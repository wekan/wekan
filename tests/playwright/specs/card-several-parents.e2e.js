'use strict';
// #3626: a card is a subtask of several parents - "A must be done before B and
// C can start, so A is under both".
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const BoardPage = require('../pages/BoardPage');
const CardPage = require('../pages/CardPage');

async function addExistingSubtask(page, board, parentTitle, parentListIndex, childTitle) {
  const bp = new BoardPage(page);
  await bp.clickCard(board.listIds[parentListIndex], parentTitle);
  const details = new CardPage(page);
  await details.waitForOpen();
  await details.root.locator('.js-add-existing-subtask').click();
  const candidates = page.locator('.js-pop-over .js-select-existing-subtask');
  if (childTitle) await candidates.filter({ hasText: childTitle }).click();
  return candidates;
}

test('an existing card becomes a subtask of a second parent and keeps the first', async ({ boardPage: page, board }) => {
  const byTitle = title => db.findOne('cards', { boardId: board.boardId, title });
  const [a, b, c] = ['Alpha Card', 'Beta Card', 'Gamma Card'].map(byTitle);

  await addExistingSubtask(page, board, 'Beta Card', 1, 'Alpha Card');
  await expect.poll(() => byTitle('Alpha Card').parentId).toBe(b._id);
  await page.keyboard.press('Escape');
  await addExistingSubtask(page, board, 'Gamma Card', 2, 'Alpha Card');
  await expect.poll(() => byTitle('Alpha Card').parentIds).toEqual([b._id, c._id]);
  expect(byTitle('Alpha Card').parentId).toBe(b._id, 'the first parent stays primary');

  // Negative: Beta is above Alpha now, so Alpha cannot offer Beta as its subtask.
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
  const candidates = await addExistingSubtask(page, board, 'Alpha Card', 0, null);
  await expect(page.locator('.js-pop-over .js-add-existing-subtask-results')).toBeVisible();
  await expect(candidates.filter({ hasText: 'Beta Card' })).toHaveCount(0);
  await expect(candidates.filter({ hasText: 'Gamma Card' })).toHaveCount(0);
});

for (const language of ['en', 'ku', 'ckb', 'tt', 'tk_TM', 'yi', 'so', 'ny', 'bho', 'mai', 'or_IN', 'kok', 'ks', 'st', 'tn', 'nso', 'zu', 'zu-ZA', 'xh', 'ss', 'nd', 'ts', 've', 'bi', 'tpi', 'mi', 'sm', 'fj', 'to', 'haw', 'om', 'rw', 'rn', 'lg', 'wo', 'ak', 'ee', 'bm', 'pap', 'wa', 'wa-RR', 'ace', 'bua', 'cv', 'sah', 'bo', 'dz', 'ti', 'qu', 'ay', 'gn', 'ary', 'gv', 've-CC', 'rup', 'se', 'iu', 'kl', 'tlh', 'vo', 'ff', 've-PP', 'nah', 'zgh', 'chr', 'tig', 'wal']) {
const locale = require(`../../../imports/i18n/data/${language}.i18n.json`);
test(`Card → More lists the other parents and removes one in ${language}`, async ({ boardPage: page, board }) => {
  const byTitle = title => db.findOne('cards', { boardId: board.boardId, title });
  const [a, b, c] = ['Alpha Card', 'Beta Card', 'Gamma Card'].map(byTitle);
  db.updateOne('cards', { _id: a._id }, { $set: { parentId: b._id, parentIds: [b._id, c._id] } });
  await page.evaluate(async language => { await Meteor.callAsync('setLanguage', language); }, language);
  const bp = new BoardPage(page);
  await bp.clickCard(board.listIds[0], 'Alpha Card');
  const details = new CardPage(page);
  await details.waitForOpen();
  // The parents were written straight to the database; the client sees
  // parentIds a moment before parentId, and More reads the primary parent once,
  // when it opens. Wait until this browser has both, as a member's would.
  await expect.poll(() => page.evaluate(id => Meteor.connection._stores.cards?._getCollection().findOne(id)?.parentId, a._id)).toBe(b._id);
  // Open More the way a member does: the card's menu, then More. A popup
  // opened from document.body has no card behind it, so it cannot know the
  // parent's board and never shows the "add parent" choice checked below.
  await details.openActionsMenu();
  await details.clickAction('.js-more');
  const others = page.locator('.card-other-parents');
  await expect(others).toContainText('Gamma Card');
  await expect(others.locator(':scope > span')).toHaveText(locale['other-parent-cards'] + ':');
  await expect(page.locator('label').filter({ has: page.locator('.js-field-add-parent-card') })).toContainText(locale['add-parent-card']);
  await expect(others.locator('.js-remove-other-parent')).toHaveAttribute('title', locale['remove-parent-card']);
  // The source board list is not empty for a user without a templates board:
  // its selector used to read `_id: { $ne: undefined }`, which ReactiveCache's
  // EJSON key turned into `_id: {}` - matching no board at all.
  await expect(page.locator('.js-pop-over .js-field-parent-board option[value="' + board.boardId + '"]')).toHaveCount(1);
  await expect(page.locator('.js-pop-over .js-field-add-parent-card option[value="' + b._id + '"]')).toHaveCount(1);
  await others.locator('.js-remove-other-parent').click();
  await expect.poll(() => byTitle('Alpha Card').parentIds).toEqual([b._id]);
  expect(byTitle('Alpha Card').parentId).toBe(b._id);
  expect(byTitle('Beta Card')._id).toBe(b._id);
  expect(byTitle('Gamma Card')._id).toBe(c._id);
});
}
