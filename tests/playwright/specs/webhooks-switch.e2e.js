'use strict';
// Admin Panel / Settings / Features / Turn off all webhooks, and Admin Panel /
// Problems / Webhooks (docs/Features/Admin-Panel/Settings/Turn-Off-All-Webhooks.md,
// docs/Features/Admin-Panel/Problems/Webhooks.md).
//
//  1. The switch is turned on from the Features pane itself: the board menu's
//     Outgoing Webhooks and the Global Webhooks menu entry disappear, a client
//     insert of a webhook is refused with 'webhooks-disabled' and recorded in
//     Problems, and the saved webhook is still there. Turned off again, both
//     entries are back.
//  2. The report lists a board webhook and a global one with their board,
//     owner and type, shows that a token is set without showing it, and a
//     non-admin is refused by the server.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, openBoard } = require('../helpers/auth');
const { holdSharedSetting } = require('../helpers/sharedSettingLock');

// One switch for every worker: no other spec may send or add webhooks while
// this file turns them off.
holdSharedSetting(test, 'webhooks-switch');

const BASE_URL = process.env.WEKAN_BASE_URL || 'http://localhost:3000';
const TOKEN = 'e2e-secret-token-value';

let setting;
test.beforeEach(() => {
  setting = db.findOne('settings', {});
  db.updateOne('settings', { _id: setting._id }, { $unset: { webhooksDisabled: '' } });
});
test.afterEach(() => {
  db.updateOne('settings', { _id: setting._id }, { $unset: { webhooksDisabled: '' } });
});

async function openBoardMenu(page) {
  const cog = page.locator('.board-sidebar .js-open-board-menu');
  if (!(await cog.isVisible().catch(() => false))) {
    await page.locator('.js-toggle-page-sidebar').first().click();
  }
  await cog.click();
}

test('turned off from the Features pane, every webhook screen is hidden and a new webhook is refused', async ({ page, adminUser, board }) => {
  db.addBoardMember({ boardId: board.boardId, userId: adminUser.id, isAdmin: true });
  const hookId = `e2ehook${Date.now()}`;
  db.insertOne('integrations', { _id: hookId, boardId: board.boardId, url: 'https://hooks.example/kept', type: 'outgoing-webhooks',
    enabled: true, activities: ['all'], userId: adminUser.id, createdAt: new Date() });
  try {
    await loginWithToken(page, adminUser.id, adminUser.token);
    await openBoard(page, board.boardId, board.slug);
    await openBoardMenu(page);
    await expect(page.locator('.pop-over .js-outgoing-webhooks')).toBeVisible();

    await page.goto(`${BASE_URL}/admin/settings/features`);
    const toggle = page.locator('.js-toggle-webhooks-off');
    await expect(toggle).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('.js-left-menu-item[data-id="webhook-setting"]')).toBeVisible();
    await toggle.click();
    await expect(page.locator('#webhooks-off')).toHaveClass(/is-checked/, { timeout: 10_000 });
    await expect.poll(() => db.findOne('settings', { _id: setting._id }).webhooksDisabled).toBe(true);
    await expect(page.locator('.js-left-menu-item[data-id="webhook-setting"]')).toHaveCount(0);

    // An old link to Global Webhooks says why instead of showing the forms.
    await page.goto(`${BASE_URL}/admin/settings/global-webhooks`);
    await expect(page.locator('.js-webhooks-off-notice')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('.integration-form')).toHaveCount(0);

    await openBoard(page, board.boardId, board.slug);
    await openBoardMenu(page);
    await expect(page.locator('.pop-over .js-open-notification-settings')).toBeVisible();
    await expect(page.locator('.pop-over .js-outgoing-webhooks')).toHaveCount(0);

    // The way round the hidden form: refused, recorded, nothing stored.
    const error = await page.evaluate(async boardId => {
      try {
        await Meteor.connection._stores.integrations._getCollection().insertAsync({ boardId, url: 'https://hooks.example/new',
          type: 'outgoing-webhooks', userId: Meteor.userId(), enabled: true, activities: ['all'] });
        return null;
      } catch (e) { return e && (e.error || e.reason || e.message); }
    }, board.boardId).catch(e => String(e));
    expect(String(error)).toMatch(/403|denied|Access/i);
    expect(db.countDocuments('integrations', { boardId: board.boardId, url: 'https://hooks.example/new' })).toBe(0);
    await expect.poll(() => db.find('eventlog', { stream: 'security', bleed: 'Webhooks turned off', source: 'ddp:integrations.insert' })
      .reduce((sum, row) => sum + (row.count || 1), 0)).toBeGreaterThan(0);
    // The saved one is kept.
    expect(db.findOne('integrations', { _id: hookId }).url).toBe('https://hooks.example/kept');

    // Turned on again: both are back.
    await page.goto(`${BASE_URL}/admin/settings/features`);
    await expect(page.locator('#webhooks-off')).toHaveClass(/is-checked/, { timeout: 20_000 });
    await page.locator('.js-toggle-webhooks-off').click();
    await expect.poll(() => db.findOne('settings', { _id: setting._id }).webhooksDisabled).toBe(false);
    await expect(page.locator('.js-left-menu-item[data-id="webhook-setting"]')).toBeVisible();
    await openBoard(page, board.boardId, board.slug);
    await openBoardMenu(page);
    await expect(page.locator('.pop-over .js-outgoing-webhooks')).toBeVisible();
  } finally {
    db.deleteMany('integrations', { _id: hookId });
  }
});

test('the Webhooks report lists every webhook, its board and owner, and never its token', async ({ page, adminUser, user, board }) => {
  const stamp = Date.now();
  const boardHook = `e2erep${stamp}`;
  const globalHook = `e2eglob${stamp}`;
  db.insertMany('integrations', [
    { _id: boardHook, boardId: board.boardId, title: `Board hook ${stamp}`, url: 'https://hooks.example/board?token=abc',
      type: 'outgoing-webhooks', enabled: true, activities: ['all'], token: TOKEN, userId: user.id, createdAt: new Date() },
    { _id: globalHook, boardId: '_global', title: `Global hook ${stamp}`, url: 'https://hooks.example/global',
      type: 'bidirectional-webhooks', enabled: false, activities: ['act-createCard'], userId: adminUser.id, createdAt: new Date() },
  ]);
  try {
    await loginWithToken(page, adminUser.id, adminUser.token);
    await page.goto(`${BASE_URL}/admin/problems/webhooks`);
    await page.locator('.js-table-page-search').fill(String(stamp));
    await page.locator('.js-table-page-search').press('Enter');
    const rows = page.locator('.js-webhooks-report-row');
    await expect(rows).toHaveCount(2, { timeout: 20_000 });
    const boardRow = page.locator(`.js-webhooks-report-row[data-integration-id="${boardHook}"]`);
    await expect(boardRow.locator('.js-webhooks-report-board')).toHaveText(db.getBoard(board.boardId).title);
    await expect(boardRow).toContainText(user.username);
    await expect(boardRow).toContainText('https://hooks.example/board?token=***');
    await expect(page.locator('.table-page')).not.toContainText(TOKEN);
    const globalRow = page.locator(`.js-webhooks-report-row[data-integration-id="${globalHook}"]`);
    await expect(globalRow).toContainText('act-createCard');

    // The filter: only the turned-off one.
    await page.locator('.js-table-page-filter').selectOption('off');
    await expect(rows).toHaveCount(1);
    await expect(globalRow).toBeVisible();

    // Nothing of the token reaches the browser at all.
    const answer = await page.evaluate(stampText => Meteor.callAsync('webhooksReportPage', { search: stampText }), String(stamp));
    expect(JSON.stringify(answer)).not.toContain(TOKEN);
    expect(answer.rows.find(r => r._id === boardHook).tokenSet).toBe(true);

    // A member who is not a site admin is refused by the server (negative).
    await loginWithToken(page, user.id, user.token);
    await page.goto(`${BASE_URL}/`);
    const refused = await page.evaluate(async () => {
      try { await Meteor.callAsync('webhooksReportPage', {}); return 'answered'; } catch (e) { return e.error; }
    });
    expect(refused).toBe('not-authorized');
  } finally {
    db.deleteMany('integrations', { _id: { $in: [boardHook, globalHook] } });
  }
});
