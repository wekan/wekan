'use strict';
// #5323: per-board due-date reminder offsets and webhook delivery, set in
// Board Settings -> Notifications.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, openBoard } = require('../helpers/auth');
const BoardPage = require('../pages/BoardPage');

async function openNotifications(page) {
  const bp = new BoardPage(page);
  await bp.openSidebar();
  await page.locator('.board-sidebar .js-open-board-menu').click();
  await page.locator('.js-pop-over .js-open-notification-settings').click();
  await expect(page.locator('.js-pop-over .due-reminder-settings')).toBeVisible();
}

for (const language of ['en', 'tk_TM', 'tt', 'so', 'ku', 'ckb', 'pap', 'tpi', 'bi', 'mi', 'sm', 'haw', 'zu', 'zu-ZA', 'xh', 'st', 'tn', 'rw', 'rn', 'ny', 'bho', 'mai', 'or_IN', 'kok', 'ary', 'yi', 'nd', 'ss', 'nso', 'ts', 'om', 'fj', 'to', 'gv', 'wa', 'wa-RR', 'ak', 'lg', 'bm', 'wo', 'ee', 'rup', 've-CC', 'bua', 'sah', 'cv', 've', 'se', 'ace', 'bo', 'dz', 'ti', 'ks', 'qu', 'ay', 'gn', 'ff', 'vo', 'tlh', 'kl', 'nah', 've-PP', 'zgh', 'iu', 'wal', 'tig', 'chr']) {
test(`a board admin sets reminder days and webhook delivery in ${language}; bad input saves nothing`, async ({ boardPage: page, board }) => {
  await page.evaluate(language => Meteor.callAsync('setLanguage', language), language);
  const strings = require(`../../../imports/i18n/data/${language}.i18n.json`);
  await openNotifications(page);
  const pop = page.locator('.js-pop-over');
  await expect(pop.locator('.due-reminder-settings .title')).toHaveText(strings['due-reminder-heading']);
  await expect(pop.locator('label[for="due-reminder-days"]')).toHaveText(strings['due-reminder-days-label']);
  await expect(pop.locator('.js-due-reminder-off span')).toHaveText(strings['due-reminder-off']);
  await expect(pop.locator('.js-due-reminder-webhook span')).toHaveText(strings['due-reminder-webhook']);
  await pop.locator('.js-due-reminder-days').fill('3, 0, -1, 3');
  await pop.locator('.js-due-reminder-webhook').click();
  await pop.locator('.js-due-reminder-save').click();
  await expect(pop.locator('.js-due-reminder-message')).toHaveText(strings['due-reminder-saved']);
  await expect.poll(() => db.findOne('boards', { _id: board.boardId }).dueReminderDays).toEqual([3, 0, -1]);
  expect(db.findOne('boards', { _id: board.boardId }).dueReminderWebhook).toBe(true);

  // Out-of-range input is refused in the popup and never reaches the board.
  await pop.locator('.js-due-reminder-days').fill('20');
  await pop.locator('.js-due-reminder-save').click();
  await expect(pop.locator('.js-due-reminder-message')).toHaveText(strings['due-reminder-invalid']);
  expect(db.findOne('boards', { _id: board.boardId }).dueReminderDays).toEqual([3, 0, -1]);

  // "No reminders" stores an empty list; clearing the field restores the server default.
  await pop.locator('.js-due-reminder-off').click();
  await pop.locator('.js-due-reminder-save').click();
  await expect.poll(() => db.findOne('boards', { _id: board.boardId }).dueReminderDays).toEqual([]);
  await pop.locator('.js-due-reminder-off').click();
  await pop.locator('.js-due-reminder-days').fill('');
  await pop.locator('.js-due-reminder-save').click();
  await expect.poll(() => db.findOne('boards', { _id: board.boardId }).dueReminderDays).toBeUndefined();
});

}

test('the method refuses non-admins and malformed offsets', async ({ page, board, user2 }) => {
  db.addBoardMember({ boardId: board.boardId, userId: user2.id, isAdmin: false });
  await loginWithToken(page, user2.id, user2.token);
  await openBoard(page, board.boardId, board.slug);
  const call = (...args) => page.evaluate(async args => {
    try { return await Meteor.callAsync('setBoardDueReminders', ...args); } catch (e) { return e.error; }
  }, args);
  expect(await call(board.boardId, [1], true)).toBe('not-authorized');
  expect(db.findOne('boards', { _id: board.boardId }).dueReminderDays).toBeUndefined();
  expect(db.findOne('boards', { _id: board.boardId }).dueReminderWebhook).toBeFalsy();
  db.updateOne('boards', { _id: board.boardId, 'members.userId': user2.id }, { $set: { 'members.$.isAdmin': true } });
  // Out of range or too many: refused by validation; not an integer: refused by check().
  expect(await call(board.boardId, [15], false)).toBe('invalid-due-reminder-days');
  expect(await call(board.boardId, Array.from({ length: 11 }, (_, i) => i), false)).toBe('invalid-due-reminder-days');
  expect(await call(board.boardId, [1.5], false)).toBe(400);
  expect(db.findOne('boards', { _id: board.boardId }).dueReminderDays).toBeUndefined();
  expect(await call(board.boardId, [0], false)).toEqual({ days: [0], webhook: false });
});
