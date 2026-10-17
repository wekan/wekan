'use strict';

// A checklist from a card's description
// (docs/Features/Cards/Checklist-From-Description.md) and cards from a
// comment's action items (docs/Features/Cards/Action-Items.md).

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const BoardPage = require('../pages/BoardPage');
const CardPage = require('../pages/CardPage');

test.describe('From text', () => {
  test('the description\'s list becomes a checklist', async ({ boardPage, board }) => {
    const alpha = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
    db.updateOne('cards', { _id: alpha._id }, { $set: { description: 'Steps\n- [x] Unplug\n- Clean\n- Plug in' } });
    const bp = new BoardPage(boardPage);
    const cp = new CardPage(boardPage);
    await bp.clickCard(board.listIds[0], 'Alpha Card');
    await cp.waitForOpen();
    await cp.root.locator('.js-checklist-from-description').click();
    const pop = boardPage.locator('.js-pop-over');
    await expect(pop.locator('.from-text-title')).toHaveText(['Unplug', 'Clean', 'Plug in']);
    await pop.locator('.js-make-description-checklist').click();
    await expect.poll(() => db.find('checklistItems', { cardId: alpha._id }).length, { timeout: 15_000 }).toBe(3);
    const items = db.find('checklistItems', { cardId: alpha._id }).sort((a, b) => a.sort - b.sort);
    expect(items.map(i => [i.title, !!i.isFinished])).toEqual([['Unplug', true], ['Clean', false], ['Plug in', false]]);
    // A description without a list offers nothing (negative).
    db.updateOne('cards', { _id: alpha._id }, { $set: { description: 'Just a paragraph.' } });
    await expect(cp.root.locator('.js-checklist-from-description')).toHaveCount(0, { timeout: 10_000 });
  });

  test('a comment\'s action items become cards at the top of the list, with the member', async ({ boardPage, board, user }) => {
    const alpha = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
    const me = db.findOne('users', { _id: user.id });
    db.insertOne('card_comments', { _id: `e2e-ai-${board.boardId}`, boardId: board.boardId, cardId: alpha._id, userId: user.id,
      text: `Meeting notes\nTODO: Book the venue\n@${me.username} Send the agenda`, createdAt: new Date(), modifiedAt: new Date() });
    const bp = new BoardPage(boardPage);
    const cp = new CardPage(boardPage);
    await bp.clickCard(board.listIds[0], 'Alpha Card');
    await cp.waitForOpen();
    await cp.root.locator('.js-comment-action-items').first().click();
    const pop = boardPage.locator('.js-pop-over');
    await expect(pop.locator('.from-text-title')).toHaveText(['Book the venue', 'Send the agenda']);
    await pop.locator('.js-create-action-items').click();
    await expect.poll(() => db.find('cards', { boardId: board.boardId, title: { $in: ['Book the venue', 'Send the agenda'] } }).length,
      { timeout: 15_000 }).toBe(2);
    const agenda = db.findOne('cards', { boardId: board.boardId, title: 'Send the agenda' });
    expect(agenda.members).toEqual([user.id]);
    expect(agenda.listId).toBe(alpha.listId);
    expect(agenda.description).toContain('Alpha Card');
    const venue = db.findOne('cards', { boardId: board.boardId, title: 'Book the venue' });
    expect(venue.sort).toBeLessThan(agenda.sort);
    expect(agenda.sort).toBeLessThan(alpha.sort);
  });
});
