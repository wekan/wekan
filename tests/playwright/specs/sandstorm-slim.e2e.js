'use strict';
// The smaller Sandstorm .spk (docs/Platforms/FOSS/Container/Sandstorm/Smaller-wekan-spk.md):
// inside a grain Sandstorm is the only login, FerretDB on SQLite the only
// database and the grain's own address the only mail, so the Admin Panel does
// not offer the panes for anything else, and the REST password login says it
// is not there. Run by tests/integration/login-providers/run.cjs --sandstorm.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { waitForMeteor } = require('../helpers/auth');

// The same lists the menus filter with (models/lib/sandstormSlim.js).
const {
  SANDSTORM_HIDDEN_PEOPLE_PANES,
  SANDSTORM_HIDDEN_ATTACHMENTS_PANES,
} = require('../../../models/lib/sandstormSlim');

async function signInAsSandstormAdmin(page, context) {
  await context.route('**/.sandstorm-login', route => route.continue({ headers: {
    ...route.request().headers(), 'x-sandstorm-username': encodeURIComponent('Slim Admin'),
    'x-sandstorm-permissions': 'participate,configure', 'x-sandstorm-session-id': 'fixture-session-slim',
    'x-sandstorm-user-id': 'fixture-sandstorm-slim-admin', 'x-sandstorm-preferred-handle': 'slimadmin',
  } }));
  await page.goto('/'); await waitForMeteor(page);
  await expect.poll(() => page.evaluate(() => Meteor.userId())).toBeTruthy();
  const userId = await page.evaluate(() => Meteor.userId());
  db.updateOne('users', { _id: userId }, { $set: { isAdmin: true } });
  return userId;
}

test.describe('Sandstorm grain: no login, database or mail options it cannot use', () => {
  test.skip(process.env.WEKAN_TEST_SANDSTORM !== '1', 'Requires isolated --sandstorm runner');

  test('Admin Panel / People offers no login method and no e-mail pane', async ({ page, context }) => {
    const userId = await signInAsSandstormAdmin(page, context);
    try {
      await page.goto('/admin/people'); await waitForMeteor(page);
      // Positive: the panes a grain does use are there.
      await expect(page.locator('.js-left-menu-item[data-id="people-setting"]')).toBeVisible();
      await expect(page.locator('.js-left-menu-item[data-id="notify-setting"]')).toBeVisible();
      // Negative: none of the hidden ones, not even as an empty row.
      for (const id of SANDSTORM_HIDDEN_PEOPLE_PANES) {
        await expect(page.locator(`.js-left-menu-item[data-id="${id}"]`)).toHaveCount(0);
      }
      // And its URL does not bring a hidden pane back.
      await page.goto('/admin/people/ldap'); await waitForMeteor(page);
      await expect(page.locator('.js-left-menu-item[data-id="ldap-setting"]')).toHaveCount(0);
      await expect(page.locator('.left-menu-heading, .js-left-menu-item.active, li.active .js-left-menu-item').first()).toBeVisible();
    } finally {
      db.cleanup({ userIds: [userId] });
    }
  });

  test('Admin Panel / Attachments offers no database migration', async ({ page, context }) => {
    const userId = await signInAsSandstormAdmin(page, context);
    try {
      await page.goto('/admin/attachments'); await waitForMeteor(page);
      await expect(page.locator('.js-left-menu-item[data-id="backup"]')).toBeVisible();
      for (const id of SANDSTORM_HIDDEN_ATTACHMENTS_PANES) {
        await expect(page.locator(`.js-left-menu-item[data-id="${id}"]`)).toHaveCount(0);
      }
    } finally {
      db.cleanup({ userIds: [userId] });
    }
  });

  // The first slim grain opened a new board EMPTY: built with fewer packages,
  // models/ attached their schemas before collection2 had loaded, so a board's
  // swimlane was stored without archived/sort/type and never published
  // (server/main.js step 2b). A board, a list and a card, through the UI.
  test('a new board opens with its swimlane, and a list and a card can be added', async ({ page, context }) => {
    const userId = await signInAsSandstormAdmin(page, context);
    let boardId;
    try {
      await page.goto('/'); await waitForMeteor(page);
      await page.getByText('Add Board').first().click();
      await page.locator('.pop-over textarea:visible').first().fill('Slim grain board');
      await page.locator('.pop-over').getByRole('button', { name: 'Create' }).click();
      await expect(page).toHaveURL(/\/b\/[^/]+\//);
      boardId = page.url().split('/b/')[1].split('/')[0];
      await expect(page.locator('.js-open-empty-add-list').first()).toBeVisible();
      const swimlane = db.findOne('swimlanes', { boardId });
      expect(swimlane.archived).toBe(false);
      expect(swimlane.type).toBe('swimlane');

      await page.locator('.js-open-empty-add-list').first().click();
      await page.locator('textarea.list-name-input:visible').fill('Slim grain list');
      await page.locator('button.primary.confirm:visible').first().click();
      await expect(page.locator('.js-card-composer').first()).toBeVisible();

      await page.locator('.js-card-composer').first().click();
      await page.locator('textarea.minicard-composer-textarea:visible').fill('Slim grain card');
      await page.locator('button.primary.confirm:visible').first().click();
      await expect(page.locator('.minicard').filter({ hasText: 'Slim grain card' })).toHaveCount(1);
      const card = db.findOne('cards', { boardId, title: 'Slim grain card' });
      expect(card.archived).toBe(false);
    } finally {
      db.cleanup({ boardIds: boardId ? [boardId] : [], userIds: [userId] });
    }
  });

  test('the REST password login and sign-up say Sandstorm is the login', async ({ request }) => {
    for (const route of ['/users/login', '/users/register']) {
      const result = await request.post(route, { data: { username: 'nobody', password: 'Correct-Horse-1', email: 'nobody@example.com' } });
      expect(result.status()).toBe(404);
      expect((await result.json()).error).toBe('sandstorm-sso-only');
    }
  });
});
