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

test('Card → More lists the other parents and removes one', async ({ boardPage: page, board }) => {
  const byTitle = title => db.findOne('cards', { boardId: board.boardId, title });
  const [a, b, c] = ['Alpha Card', 'Beta Card', 'Gamma Card'].map(byTitle);
  db.updateOne('cards', { _id: a._id }, { $set: { parentId: b._id, parentIds: [b._id, c._id] } });
  const bp = new BoardPage(page);
  await bp.clickCard(board.listIds[0], 'Alpha Card');
  const details = new CardPage(page);
  await details.waitForOpen();
  await page.evaluate(() => {
    const opener = document.querySelector('.js-more') || document.body;
    Popup.open('cardMore')({ currentTarget: opener, target: opener, preventDefault() {}, stopPropagation() {} });
  });
  const others = page.locator('.card-other-parents');
  await expect(others).toContainText('Gamma Card');
  await others.locator('.js-remove-other-parent').click();
  await expect.poll(() => byTitle('Alpha Card').parentIds).toEqual([b._id]);
  expect(byTitle('Alpha Card').parentId).toBe(b._id);
});
