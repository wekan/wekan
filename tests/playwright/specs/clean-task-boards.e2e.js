'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, openBoard, navigateInApp } = require('../helpers/auth');
const BoardPage = require('../pages/BoardPage');
const CardPage = require('../pages/CardPage');

async function settings(page) {
  if (!await page.locator('.board-sidebar.is-open').isVisible()) await page.locator('.js-toggle-page-sidebar').click();
  await page.locator('.board-sidebar .js-open-board-menu').click();
  await page.locator('.js-pop-over .js-open-board-card-settings').click();
  return page.locator('.js-pop-over');
}
async function toggle(page, selector) {
  const popup = await settings(page);
  await popup.locator(selector).click();
  await popup.locator('.js-close-pop-over').click();
}

test('clean boards: collapse control and labels above title persist without hiding saved content', async ({ boardPage: page, board, user2 }) => {
  const card = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  const labelId = db.uid('label');
  db.updateOne('boards', { _id: board.boardId }, { $set: { labels: [{ _id: labelId, name: 'Task label', color: 'green' }], allowsLabelsOnMinicard: true, allowsDueCompleteOnMinicard: true } });
  db.updateOne('cards', { _id: card._id }, { $set: { labelIds: [labelId] } });
  const mini = new BoardPage(page).minicard(board.listIds[0], 'Alpha Card');
  await expect(mini.locator('.minicard-labels')).toBeVisible();
  await mini.locator('.js-collapse-minicard').click();
  await expect(mini.locator('.minicard')).toHaveClass(/minicard-collapsed/);
  await toggle(page, '.js-field-minicard-collapse');
  await expect.poll(() => db.findOne('boards', { _id: board.boardId }).allowsMinicardCollapse).toBe(false);
  await expect(mini.locator('.js-collapse-minicard')).toHaveCount(0);
  await expect(mini.locator('.minicard-labels')).toBeVisible();
  await toggle(page, '.js-field-labels-above-title');
  await expect(mini.locator('.minicard-labels')).toHaveCount(1);
  await expect.poll(() => mini.evaluate(el => el.querySelector('.minicard-labels').getBoundingClientRect().bottom <= el.querySelector('.minicard-title').getBoundingClientRect().top + 1)).toBe(true);
  const complete = await mini.locator('.minicard-complete-toggle').boundingBox();
  const title = await mini.locator('.minicard-title-text').boundingBox();
  expect(complete.x).toBeLessThan(title.x);
  expect(Math.abs(complete.y + complete.height / 2 - title.y - title.height / 2)).toBeLessThan(2);
  await page.reload();
  await expect(mini.locator('.js-collapse-minicard')).toHaveCount(0);
  await expect(mini.locator('.minicard-labels')).toBeVisible();
  await toggle(page, '.js-field-has-labels-on-minicard');
  await expect(mini.locator('.minicard-labels')).toHaveCount(0);
  // A normal member cannot mutate presentation flags through DDP.
  db.updateOne('boards', { _id: board.boardId }, { $push: { members: { userId: user2.id, isActive: true, isAdmin: false } } });
  await loginWithToken(page, user2.id, user2.token);
  const denied = await page.evaluate(async id => {
    try { await Meteor.callAsync('/boards/update', { _id: id }, { $set: { allowsMinicardCollapse: true } }); return false; }
    catch (error) { return true; }
  }, board.boardId);
  expect(denied).toBe(true);
  expect(db.findOne('boards', { _id: board.boardId }).allowsMinicardCollapse).toBe(false);
});

test('clean boards: checklist due controls and section heading can be hidden without deleting data', async ({ boardPage: page, board }) => {
  await new BoardPage(page).clickCard(board.listIds[0], 'Alpha Card');
  const card = new CardPage(page); await card.waitForOpen();
  await card.addChecklist('Tasks'); await card.addChecklistItem('Tasks', 'Keep this task');
  const checklist = card.root.locator('.js-checklist').filter({ hasText: 'Tasks' });
  const due = checklist.locator('.checklist-title .js-checklist-due-date');
  await expect(due).toBeVisible();
  await expect(due).toHaveAccessibleName('Due');
  expect((await due.boundingBox()).width).toBeLessThan(60);
  await due.focus(); await page.keyboard.press('Enter');
  await expect(page.locator('.js-pop-over')).toBeVisible();
  await page.locator('.js-pop-over .js-close-pop-over').click();
  const checklistDoc = db.findOne('checklists', { cardId: db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' })._id, title: 'Tasks' });
  const dueAt = new Date('2026-09-21T12:00:00Z');
  db.updateOne('checklists', { _id: checklistDoc._id }, { $set: { dueAt } });
  await expect(checklist.locator('.checklist-due-date')).toBeVisible();
  await toggle(page, '.js-field-checklist-due-date');
  await expect(checklist.locator('.checklist-due-date, .js-checklist-due-date')).toHaveCount(0);
  await card.root.locator('[data-section="checklists"]').click();
  await expect(checklist).toHaveCount(0);
  await toggle(page, '.js-field-checklist-title');
  await expect(card.root.locator('[data-section="checklists"]')).toHaveCount(0);
  await expect(checklist).toBeVisible();
  await expect(checklist.getByText('Keep this task', { exact: true })).toBeVisible();
  expect(db.findOne('checklists', { _id: checklistDoc._id }).dueAt).toBe(dueAt.toISOString());
  await toggle(page, '.js-field-checklist-due-date');
  await expect(checklist.locator('.checklist-due-date')).toBeVisible();
});

test('clean boards: personal and forced date-only formats suppress time without changing timestamps', async ({ page, browser, board, user, adminUser }) => {
  const setting = db.findOne('settings', {});
  const previous = { hideDateFormat: setting.hideDateFormat, globalDateFormat: setting.globalDateFormat };
  const context = await browser.newContext(); const admin = await context.newPage();
  const card = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  const dueAt = new Date('2026-09-21T12:34:00Z');
  try {
    db.updateOne('settings', { _id: setting._id }, { $set: { hideDateFormat: false } });
    db.updateOne('cards', { _id: card._id }, { $set: { dueAt } });
    await loginWithToken(page, user.id, user.token); await openBoard(page, board.boardId, board.slug);
    await new BoardPage(page).clickCard(board.listIds[0], 'Alpha Card');
    const cp = new CardPage(page); await cp.waitForOpen();
    await page.evaluate(() => Meteor.callAsync('changeDateFormat', 'YYYY-MM-DD-date-only', true));
    await expect.poll(() => db.findOne('users', { _id: user.id }).profile.dateFormat).toBe('YYYY-MM-DD-date-only');
    await expect(cp.root.locator('.due-date time').first()).toContainText('2026-09-21');
    await expect(cp.root.locator('.due-date time').first()).not.toContainText(/\d{1,2}:\d{2}/);
    const invalid = await page.evaluate(async () => {
      try { await Meteor.callAsync('changeDateFormat', 'unsupported'); return false; } catch (error) { return true; }
    });
    expect(invalid).toBe(true);
    await loginWithToken(admin, adminUser.id, adminUser.token); await navigateInApp(admin, '/admin/settings/visibility');
    await page.evaluate(() => Meteor.callAsync('changeDateFormat', 'YYYY-MM-DD-date-only', false));
    await admin.locator('#global-date-format').selectOption('DD-MM-YYYY-date-only');
    await admin.locator('#global-date-format-enabled').click();
    await admin.locator('.js-visibility-date-save').click();
    await expect(cp.root.locator('.js-date-format-selector')).toHaveCount(0);
    await expect(cp.root.locator('.due-date time').first()).toContainText('21-09-2026');
    await expect(cp.root.locator('.due-date time').first()).not.toContainText(/\d{1,2}:\d{2}/);
    await expect(cp.root.locator('.due-date time').first()).toHaveAttribute('datetime', dueAt.toISOString());
    expect(db.findOne('cards', { _id: card._id }).dueAt).toBe(dueAt.toISOString());
  } finally {
    const $set = {}, $unset = {};
    for (const [key, value] of Object.entries(previous)) { if (value === undefined) $unset[key] = ''; else $set[key] = value; }
    db.updateOne('settings', { _id: setting._id }, { ...(Object.keys($set).length ? { $set } : {}), ...(Object.keys($unset).length ? { $unset } : {}) });
    await context.close();
  }
});

test('clean boards: smaller font presets reduce checklist and settings spacing', async ({ page, board, user }) => {
  db.updateOne('users', { _id: user.id }, { $set: { 'profile.uiFontSize': 'smaller' } });
  await loginWithToken(page, user.id, user.token); await openBoard(page, board.boardId, board.slug);
  await new BoardPage(page).clickCard(board.listIds[0], 'Alpha Card');
  const cp = new CardPage(page); await cp.waitForOpen(); await cp.addChecklist('Compact tasks');
  await expect(cp.root.locator('.checklist-title')).toHaveCSS('padding-top', '8px');
  const popup = await settings(page);
  await expect(popup.locator('.card-field-order-row').first()).toHaveCSS('padding-top', '3.2px');
  // Firefox rounds computed font sizes to layout units (9.59375px for 9.6px).
  await expect.poll(() => popup.locator('.card-field-order-column-heading').first()
    .evaluate(el => parseFloat(getComputedStyle(el).fontSize))).toBeCloseTo(9.6, 1);
});
