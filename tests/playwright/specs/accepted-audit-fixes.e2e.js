'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, navigateInApp, openBoard } = require('../helpers/auth');
const BoardPage = require('../pages/BoardPage');
const CardPage = require('../pages/CardPage');

async function openCard(page, board, title = 'Alpha Card') {
  await new BoardPage(page).clickCard(board.listIds[0], title);
  const card = new CardPage(page);
  await card.waitForOpen();
  return card;
}

test('F16 V05 V06 A07 A09: checklist keyboard state, exact progress and focusable switches', async ({ boardPage: page, board }) => {
  const card = await openCard(page, board);
  await card.addChecklist('Audit checklist');
  await card.addChecklistItem('Audit checklist', 'First item');
  await card.addChecklistItem('Audit checklist', 'Second item');
  const checklist = card.root.locator('.js-checklist').filter({ hasText: 'Audit checklist' });
  const items = checklist.locator('.js-checklist-item');
  await expect(items).toHaveCount(2);
  const ratio = () => checklist.locator('.checklist-progress-bar').evaluate(el =>
    el.querySelector('.checklist-progress').getBoundingClientRect().width / el.getBoundingClientRect().width);
  await expect(checklist.locator('.checklist-progress-bar')).toHaveCount(0);
  await items.nth(0).focus(); await page.keyboard.press('Space');
  await expect(items.nth(0)).toHaveAttribute('aria-checked', 'true');
  await expect.poll(ratio).toBeCloseTo(.5, 2);
  await items.nth(1).focus(); await page.keyboard.press('Enter');
  await expect.poll(ratio).toBeCloseTo(1, 2);
  // A held key and events from descendant controls must not toggle the row.
  await items.nth(1).dispatchEvent('keydown', { key: ' ', repeat: true });
  await expect(items.nth(1)).toHaveAttribute('aria-checked', 'true');
  const toggle = card.root.locator('input.js-toggle-hide-finished-checklist');
  await expect(toggle).toHaveCount(1);
  await toggle.focus(); await expect(toggle).toBeFocused();
  await page.keyboard.press('Space');
  const alpha = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  await expect.poll(() => db.findOne('cards', { _id: alpha._id }).hideFinishedChecklistIfItemsAreHidden).toBe(true);
  const ids = await page.locator('input.js-toggle-hide-finished-checklist').evaluateAll(els => els.map(el => el.id));
  expect(new Set(ids).size).toBe(ids.length);
  await page.setViewportSize({ width: 375, height: 900 });
  await page.evaluate(() => document.documentElement.style.setProperty('--wekan-ui-font-scale', '1.5'));
  await expect(checklist.locator('.item-title').first()).toHaveCSS('min-width', '0px');
  await expect(checklist.locator('.item-title').first()).toHaveCSS('overflow-wrap', 'anywhere');
});

test('F02 F06: relative move uses a fractional gap and keyboard moves escape ties', async ({ boardPage: page, board }) => {
  const alpha = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  const beta = db.findOne('cards', { boardId: board.boardId, title: 'Beta Card' });
  const gamma = db.findOne('cards', { boardId: board.boardId, title: 'Gamma Card' });
  for (const [card, sort] of [[alpha, 10], [beta, .25], [gamma, 0]]) {
    db.updateOne('cards', { _id: card._id }, { $set: { listId: board.listIds[0], sort } });
  }
  const card = await openCard(page, board);
  await card.openActionsMenu();
  await card.clickAction('.js-move-card');
  const popup = page.locator('.js-pop-over');
  await popup.locator('.js-select-cards').selectOption(beta._id);
  await popup.locator('input[value="above"]').check();
  await popup.locator('.js-done').click();
  await expect.poll(() => db.findOne('cards', { _id: alpha._id }).sort).toBe(.125);
  // Close the card through its real window control before keyboard reordering.
  await card.root.locator('.js-close-card-details').first().click();
  db.updateMany('cards', { boardId: board.boardId, listId: board.listIds[0] }, { $set: { sort: 0 } });
  const list = page.locator(`#js-list-${board.listIds[0]}`);
  const orderedIds = [alpha._id, beta._id, gamma._id].sort();
  await expect.poll(() => list.locator('.js-minicard').evaluateAll(els => els.map(el => el.dataset.cardId))).toEqual(orderedIds);
  const first = list.locator('.js-minicard').first();
  const id = await first.getAttribute('data-card-id');
  await first.locator('.js-card-move-down').focus(); await page.keyboard.press('Enter');
  await expect(list.locator('.js-minicard').nth(1)).toHaveAttribute('data-card-id', id);
});

test('F05 A03: named destination labels retain failed operations and allow retry', async ({ boardPage: page, board }) => {
  const card = await openCard(page, board);
  await card.openActionsMenu();
  await card.clickAction('.js-copy-card');
  const popup = page.locator('.js-pop-over');
  for (const name of ['Boards', 'Swimlanes', 'Lists', 'Cards']) await expect(popup.getByLabel(new RegExp(`^${name}:?$`))).toBeVisible();
  await popup.locator('#copy-card-title').fill('Retained title');
  await popup.locator('.js-select-cards').selectOption({ index: 0 });
  await popup.locator('.js-done').evaluate(el => {
    const tpl = Blaze.getView(el, 'Template.copyCardPopup').templateInstance();
    const real = tpl.dialog._setDone;
    tpl.dialog._setDone = async function (...args) {
      this._setDone = real;
      throw new Error('Controlled rejection');
    };
  });
  await popup.locator('.js-done').click();
  await expect(popup.locator('.js-destination-error')).toHaveText('Controlled rejection');
  await expect(popup.locator('#copy-card-title')).toHaveValue('Retained title');
  await popup.locator('.js-done').click();
  await expect.poll(() => db.countDocuments('cards', { boardId: board.boardId, title: 'Retained title' })).toBe(1);
  await expect(popup).toHaveCount(0);
});

test('F12: overtime is a draft until Save', async ({ boardPage: page, board }) => {
  db.updateOne('boards', { _id: board.boardId }, { $set: { allowsSpentTime: true } });
  db.updateOne('cards', { boardId: board.boardId, title: 'Alpha Card' }, { $set: { spentTime: 1 } });
  const card = await openCard(page, board);
  const id = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' })._id;
  await card.root.locator('.js-edit-time').first().click();
  const popup = page.locator('.js-pop-over');
  await popup.locator('.js-toggle-overtime').click();
  expect(db.findOne('cards', { _id: id }).isOvertime || false).toBe(false);
  await popup.locator('.js-close-pop-over').click();
  expect(db.findOne('cards', { _id: id }).isOvertime || false).toBe(false);
  await card.root.locator('.js-edit-time').first().click();
  await popup.locator('.js-time-field').fill('2.5');
  await popup.locator('.js-toggle-overtime').click();
  await popup.locator('.js-submit-time').click();
  await expect.poll(() => db.findOne('cards', { _id: id }).isOvertime).toBe(true);
});

test('F01 A01 A02: keyboard rule controls save string checklist and item names', async ({ boardPage: page, board, user }) => {
  db.updateOne('users', { _id: user.id }, { $set: { 'profile.keyboardShortcuts': true } });
  await navigateInApp(page, `/b/${board.boardId}/${board.slug}/rules`);
  await page.locator('#ruleTitle').fill('Audit string arguments');
  await page.locator('.js-goto-trigger').click();
  const addTrigger = page.locator('.js-add-create-trigger.js-goto-action');
  await expect(addTrigger).toHaveAttribute('type', 'button');
  await addTrigger.focus(); await page.keyboard.press('Space');
  await page.locator('.js-set-checklist-actions').click();
  await page.locator('#checkitem-name').fill('Target item');
  await page.locator('#checklist-name3').fill('Target checklist');
  await page.locator('.js-add-check-item-action').focus(); await page.keyboard.press('Enter');
  await expect.poll(() => db.findOne('actions', { boardId: board.boardId, actionType: 'checkItem' })?.checkItemName).toBe('Target item');
  expect(db.findOne('actions', { boardId: board.boardId, actionType: 'checkItem' }).checklistName).toBe('Target checklist');
});

test('F14 V01 V07 A06: scaled headers fit and narrow settings stack without inert fields', async ({ boardPage: page }) => {
  await page.locator('.js-toggle-page-sidebar').click();
  await page.locator('.board-sidebar .js-open-board-menu').click();
  await page.locator('.js-pop-over .js-open-board-card-settings').click();
  const popup = page.locator('.js-pop-over');
  await page.evaluate(() => document.documentElement.style.setProperty('--wekan-ui-font-scale', '1.5'));
  expect(await popup.evaluate(el => {
    const header = el.querySelector('.header').getBoundingClientRect();
    return el.querySelector('.header-title').getBoundingClientRect().bottom <= header.bottom + 1;
  })).toBe(true);
  const disabled = popup.locator('.card-field-order-move[aria-disabled="true"]').first();
  await disabled.focus(); await page.keyboard.press('Enter');
  await expect(popup).toBeVisible();
  const inert = popup.locator('.card-field-order-column').first();
  for (const key of ['requestedBy', 'assignedBy', 'descriptionTitle', 'attachments']) {
    await expect(inert.locator(`[data-key="${key}"]`)).toHaveCount(0);
  }
  await page.setViewportSize({ width: 375, height: 900 });
  const columns = popup.locator('.card-field-order-column');
  const first = await columns.nth(0).boundingBox();
  const second = await columns.nth(1).boundingBox();
  expect(second.y).toBeGreaterThan(first.y);
  expect(Math.abs(second.x - first.x)).toBeLessThan(2);
});

test('F09 F10 T02: custom long locale tags save, duplicate forms remain, punctuation searches literally', async ({ page, adminUser }) => {
  const key = `audit[${db.uniqueSuffix()}]`;
  await loginWithToken(page, adminUser.id, adminUser.token);
  try {
    await navigateInApp(page, '/admin/settings/translation');
    await page.locator('.new-translation').click();
    const popup = page.locator('.js-pop-over');
    await popup.locator('.js-translation-language').fill('zh-Hans');
    await popup.locator('.js-translation-text').fill(key);
    await popup.locator('.js-translation-translation-text').fill('测试');
    await popup.locator('input[type="submit"]').click();
    await expect(popup).toHaveCount(0);
    await expect.poll(() => db.countDocuments('translation', { language: 'zh-Hans', text: key })).toBe(1);
    await page.locator('.new-translation').click();
    await popup.locator('.js-translation-language').fill('zh-Hans');
    await popup.locator('.js-translation-text').fill(key);
    await popup.locator('input[type="submit"]').click();
    await expect(popup.locator('.text-taken')).toBeVisible();
    await expect(popup.locator('.js-translation-text')).toHaveValue(key);
    await popup.locator('.js-close-pop-over').click();
    const search = page.locator('.js-table-search-input, .js-table-search input, input[type="search"]').first();
    await search.fill('['); await search.press('Enter');
    await expect(page.getByText(key, { exact: true })).toBeVisible();
    const rejected = await page.evaluate(async text => {
      try { await Meteor.callAsync('setCreateTranslation', 'not-a-registered-locale', text, 'invalid'); return false; }
      catch (error) { return true; }
    }, key);
    expect(rejected).toBe(true);
    expect(db.countDocuments('translation', { language: 'not-a-registered-locale', text: key })).toBe(0);
  } finally { db.deleteMany('translation', { text: key }); }
});

test('A05: password reveal is reachable by Tab and never submits', async ({ page }) => {
  await page.goto('/sign-in');
  const field = page.locator('input.password-field').first();
  await field.fill('test password');
  await field.press('Tab');
  const toggle = page.locator('.password-toggle-btn').first();
  await expect(toggle).toBeFocused();
  await page.keyboard.press('Enter'); await expect(field).toHaveAttribute('type', 'text');
  await page.keyboard.press('Space'); await expect(field).toHaveAttribute('type', 'password');
  await expect(field).toHaveValue('test password');
});

test('F17 A08: one viewer exists before and after opening cards, with named native controls', async ({ boardPage: page, board }) => {
  await expect(page.locator('#viewer-overlay')).toHaveCount(1);
  await expect(page.locator('#viewer-overlay')).toBeHidden();
  for (const [id, name] of [['viewer-close', 'Close'], ['prev-attachment', 'Previous'], ['next-attachment', 'Next']]) {
    const control = page.locator(`#${id}`);
    await expect(control).toHaveAttribute('type', 'button');
    await expect(control).toHaveAttribute('aria-label', name);
  }
  await openCard(page, board);
  await expect(page.locator('#viewer-overlay')).toHaveCount(1);
  await expect(page.locator('#viewer-overlay')).toBeHidden();
  await openBoard(page, board.boardId, board.slug);
  await expect(page.locator('#viewer-overlay')).toHaveCount(1);
  await expect(page.locator('#viewer-overlay')).toBeHidden();
});
