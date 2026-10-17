'use strict';

// Similar cards and possible duplicates (docs/Features/Cards/Similar-Cards.md):
// the add-card form's hint, the opened card's section, and what the server
// never answers - a hidden helper, and cards an assigned-only member may not see.

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const BoardPage = require('../pages/BoardPage');
const CardPage = require('../pages/CardPage');

test.describe('Similar cards', () => {
  test('the add-card form points out a possible duplicate', async ({ boardPage, board }) => {
    const bp = new BoardPage(boardPage);
    const [listA] = board.listIds;
    await bp.openAddCardTop(listA);
    const form = bp.list(listA).locator('.js-inlined-form');
    await form.locator('textarea.js-card-title').fill('Alpha Card');
    const hint = form.locator('.js-similar-cards-hint');
    await expect(hint).toBeVisible({ timeout: 10_000 });
    await expect(hint.locator('.similar-card-title')).toHaveText(['Alpha Card']);
    await expect(hint.locator('.similar-card-duplicate')).toBeVisible();
    // Something unrelated: the hint goes away.
    await form.locator('textarea.js-card-title').fill('Completely different words');
    await expect(hint).toHaveCount(0, { timeout: 10_000 });
  });

  test('the opened card lists the cards like it, and opens one', async ({ boardPage, board }) => {
    const [listA, listB] = board.listIds;
    const copy = db.findOne('cards', { boardId: board.boardId, title: 'Beta Card' });
    db.updateOne('cards', { _id: copy._id }, { $set: { title: 'Alpha Card again' } });
    const bp = new BoardPage(boardPage);
    const cp = new CardPage(boardPage);
    await bp.clickCard(listA, 'Alpha Card');
    await cp.waitForOpen();
    const section = cp.root.locator('.js-similar-cards');
    await expect(section.locator('.similar-card-title')).toHaveText(['Alpha Card again'], { timeout: 10_000 });
    await expect(section.locator('.similar-card-list')).toHaveText([/.+/]);
    await section.locator('.js-open-similar-card').click();
    await expect(boardPage).toHaveURL(new RegExp(copy._id));
    expect(listB).toBeTruthy();
  });

  test('a hidden helper and an assigned-only member get nothing from the server (negative)', async ({ boardPage, board, user }) => {
    const ask = () => boardPage.evaluate(id => Meteor.callAsync('cards.similar', id, { title: 'Alpha Card' }), board.boardId);
    expect((await ask()).map(r => r.title)).toContain('Alpha Card');

    db.updateOne('boards', { _id: board.boardId }, { $set: { allowsSimilarCardsOnMinicard: false } });
    expect(await ask()).toEqual([]);
    db.updateOne('boards', { _id: board.boardId }, { $unset: { allowsSimilarCardsOnMinicard: 1 } });

    // Assigned-only: only the cards assigned to them, and none is.
    db.updateOne('boards', { _id: board.boardId, 'members.userId': user.id },
      { $set: { 'members.$.isNormalAssignedOnly': true, 'members.$.isAdmin': false } });
    expect(await ask()).toEqual([]);
  });
});
