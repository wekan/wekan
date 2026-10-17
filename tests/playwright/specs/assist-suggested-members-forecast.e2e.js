'use strict';

// Suggested members (docs/Features/Cards/Suggested-Members.md) and the
// forecast done date (docs/Features/Cards/Dates/Forecast.md) in the opened card.

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const BoardPage = require('../pages/BoardPage');
const CardPage = require('../pages/CardPage');

const DAY = 86400000;

test.describe('Suggested members and forecast', () => {
  test('the person who handles this label is suggested, and a click adds them', async ({ boardPage, board }) => {
    const other = db.seedUser();
    db.addBoardMember({ boardId: board.boardId, userId: other.id });
    const labelId = `e2e-lbl-${Date.now()}`;
    db.updateOne('boards', { _id: board.boardId }, { $push: { labels: { _id: labelId, name: 'Printers', color: 'red' } } });
    db.updateOne('cards', { boardId: board.boardId, title: 'Beta Card' }, { $set: { labelIds: [labelId], members: [other.id] } });
    db.updateOne('cards', { boardId: board.boardId, title: 'Alpha Card' }, { $set: { labelIds: [labelId] } });

    const bp = new BoardPage(boardPage);
    const cp = new CardPage(boardPage);
    await bp.clickCard(board.listIds[0], 'Alpha Card');
    await cp.waitForOpen();
    await cp.root.locator('a.js-add-members').first().click();
    const suggested = boardPage.locator('.js-pop-over .js-suggested-members');
    await expect(suggested).toContainText(other.username, { timeout: 15_000 });
    await suggested.locator('.js-select-member').first().click();
    await expect.poll(() => db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' }).members || [], { timeout: 15_000 })
      .toContain(other.id);
    // Already on the card: no longer suggested (negative).
    await expect(boardPage.locator('.js-pop-over .js-suggested-members')).toHaveCount(0, { timeout: 10_000 });
  });

  test('the forecast from the board\'s finished cards, and too few of them (negative)', async ({ boardPage, board }) => {
    const bp = new BoardPage(boardPage);
    const cp = new CardPage(boardPage);
    await bp.clickCard(board.listIds[0], 'Alpha Card');
    await cp.waitForOpen();
    await expect(cp.root.locator('.js-card-forecast')).toContainText('Not enough', { timeout: 15_000 });

    const now = Date.now();
    db.insertMany('cards', [2, 3, 4, 5, 6, 8].map(d => ({
      _id: `e2e-fc-${d}-${board.boardId}`, title: `Done ${d}`, boardId: board.boardId, listId: board.listIds[2],
      swimlaneId: db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' }).swimlaneId, sort: d,
      archived: false, type: 'cardType-card', userId: db.findOne('boards', { _id: board.boardId }).members[0].userId,
      createdAt: new Date(now - 20 * DAY), endAt: new Date(now - 20 * DAY + d * DAY), modifiedAt: new Date(now - 5 * DAY),
    })));
    // The cycle times are kept ten minutes per board: a reload asks again.
    await boardPage.reload();
    await bp.clickCard(board.listIds[0], 'Alpha Card');
    await cp.waitForOpen();
    await expect(cp.root.locator('.js-card-forecast')).toContainText('50 %', { timeout: 15_000 });
    await expect(cp.root.locator('.js-card-forecast')).toContainText('85 %');
  });
});
