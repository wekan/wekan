'use strict';

// The at-risk mark (docs/Features/Cards/At-Risk.md): an overdue card gets the
// triangle on its minicard and the reasons in the opened card; a complete card
// and a board that turned the side off get none.

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const BoardPage = require('../pages/BoardPage');
const CardPage = require('../pages/CardPage');

test.describe('At risk', () => {
  test('an overdue card is marked, on the minicard and in the opened card', async ({ boardPage, board }) => {
    const alpha = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
    db.updateOne('cards', { _id: alpha._id }, { $set: { dueAt: new Date(Date.now() - 2 * 86400000) } });
    const bp = new BoardPage(boardPage);
    const mini = bp.minicard(board.listIds[0], 'Alpha Card');
    await expect(mini.locator('.js-minicard-at-risk')).toBeVisible({ timeout: 15_000 });
    await expect(mini.locator('.js-minicard-at-risk')).toHaveAttribute('title', /overdue/);
    // Beta has no date: no mark (negative).
    await expect(bp.minicard(board.listIds[1], 'Beta Card').locator('.js-minicard-at-risk')).toHaveCount(0);

    const cp = new CardPage(boardPage);
    await bp.clickCard(board.listIds[0], 'Alpha Card');
    await cp.waitForOpen();
    await expect(cp.root.locator('.js-card-at-risk')).toContainText('overdue');
  });

  test('a complete card and a board that turned it off are not marked (negative)', async ({ boardPage, board }) => {
    const alpha = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
    db.updateOne('cards', { _id: alpha._id }, { $set: { dueAt: new Date(Date.now() - 2 * 86400000) } });
    const bp = new BoardPage(boardPage);
    const mark = bp.minicard(board.listIds[0], 'Alpha Card').locator('.js-minicard-at-risk');
    await expect(mark).toBeVisible({ timeout: 15_000 });

    db.updateOne('boards', { _id: board.boardId }, { $set: { allowsAtRiskOnMinicard: false } });
    await expect(mark).toHaveCount(0, { timeout: 15_000 });
    db.updateOne('boards', { _id: board.boardId }, { $unset: { allowsAtRiskOnMinicard: 1 } });
    await expect(mark).toBeVisible({ timeout: 15_000 });

    db.updateOne('cards', { _id: alpha._id }, { $set: { dueComplete: true } });
    await expect(mark).toHaveCount(0, { timeout: 15_000 });
  });
});
