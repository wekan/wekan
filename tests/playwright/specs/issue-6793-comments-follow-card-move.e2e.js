'use strict';

/**
 * #6793 — "Comments shows only on originating board."
 *
 * Moving a card to another board left its comments behind; moving it back
 * brought them back. The board publication finds a board's comments by the copy
 * of the board id each comment carries (#6480), and only checklists and
 * checklist items were re-homed when their card changed board - so a moved
 * card's comments were still published to the board it had LEFT.
 *
 * Positive: after the move the comment carries the destination board id, and it
 *           is shown when the card is opened on the destination board - for the
 *           Move Card popup (the browser's Card.move()) and for the REST move,
 *           whose hook-less write needed its own re-home.
 * Negative: nothing of the card is left on the board it left - no comment row
 *           still carries that board id, and the card is not shown there.
 *
 * Unit/source guards for every other move path: tests/cardChildrenFollowMove.test.cjs.
 */

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { openBoard } = require('../helpers/auth');
const BoardPage = require('../pages/BoardPage');
const CardPage = require('../pages/CardPage');

function authHeaders(token) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

const commentBoards = cardId => db.find('card_comments', { cardId }).map(c => c.boardId);

test.describe('Comments follow a card moved to another board (#6793)', () => {
  let target;

  test.beforeEach(async ({ user }) => {
    target = db.seedBoard({
      ownerId: user.id,
      title: `Issue 6793 Target ${db.uid('')}`,
      listCount: 1,
      cardTitlesPerList: [['Already There']],
    });
  });

  test.afterEach(async () => {
    if (target) db.cleanup({ boardIds: [target.boardId] });
    target = null;
  });

  test('Move Card popup: the comment is shown on the destination board, and not left behind', async ({
    boardPage,
    board,
  }) => {
    test.setTimeout(120_000);
    const text = `Comment that must follow its card ${db.uid('')}`;
    const cardId = db.findCardIdByTitle({ boardId: board.boardId, title: 'Alpha Card' });
    const bp = new BoardPage(boardPage);
    const cp = new CardPage(boardPage);

    // 1-2. A card on one board, with a comment added the way a user adds one.
    await bp.clickCard(board.listIds[0], 'Alpha Card');
    await cp.waitForOpen();
    await cp.addComment(text);
    await expect.poll(() => commentBoards(cardId), { timeout: 10_000 }).toEqual([board.boardId]);

    // 3. Move it to the other board.
    const targetTitle = db.getBoard(target.boardId).title;
    await cp.moveCard(targetTitle, 'List A');
    await expect.poll(() => db.getCard(cardId).boardId, { timeout: 15_000 }).toBe(target.boardId);

    // The comment went with it ...
    await expect.poll(() => commentBoards(cardId), { timeout: 15_000 }).toEqual([target.boardId]);
    // ... and NEGATIVE: none of it still names the board the card left.
    expect(db.find('card_comments', { cardId, boardId: board.boardId })).toHaveLength(0);

    // It is published there: open the card on the destination board.
    await openBoard(boardPage, target.boardId, target.slug);
    await bp.clickCard(target.listIds[0], 'Alpha Card');
    await cp.waitForOpen();
    await expect(cp.comments().filter({ hasText: text })).toHaveCount(1, { timeout: 15_000 });

    // NEGATIVE: the board it left shows neither the card nor its comment.
    await openBoard(boardPage, board.boardId, board.slug);
    await expect(bp.minicard(board.listIds[0], 'Alpha Card')).toHaveCount(0, { timeout: 10_000 });
    await expect(boardPage.getByText(text)).toHaveCount(0);
  });

  test('REST move: the comment and checklist follow the card there and back', async ({ request, user, board }) => {
    const cardId = db.findCardIdByTitle({ boardId: board.boardId, title: 'Beta Card' });
    const srcList = board.listIds[1];
    const posted = await request.post(`/api/boards/${board.boardId}/cards/${cardId}/comments`, {
      headers: authHeaders(user.token),
      data: { authorId: user.id, comment: 'REST comment that must follow 6793' },
    });
    expect(posted.status()).toBe(200);
    const checklistId = db.uid('checklist');
    db.insertOne('checklists', {
      _id: checklistId, cardId, boardId: board.boardId, title: 'Follows 6793',
      sort: 0, createdAt: new Date(), modifiedAt: new Date(),
    });
    await expect.poll(() => commentBoards(cardId)).toEqual([board.boardId]);

    const there = await request.put(`/api/boards/${board.boardId}/lists/${srcList}/cards/${cardId}`, {
      headers: authHeaders(user.token),
      data: { newBoardId: target.boardId, newSwimlaneId: target.swimlaneId, newListId: target.listIds[0] },
    });
    expect(there.status()).toBe(200);
    await expect.poll(() => db.getCard(cardId).boardId).toBe(target.boardId);
    await expect.poll(() => commentBoards(cardId)).toEqual([target.boardId]);
    expect(db.findOne('checklists', { _id: checklistId }).boardId).toBe(target.boardId);
    // NEGATIVE: nothing stays published to the board the card left.
    expect(db.find('card_comments', { cardId, boardId: board.boardId })).toHaveLength(0);

    // 4. And back - the reporter's "it reappears" now simply means it follows.
    const back = await request.put(`/api/boards/${target.boardId}/lists/${target.listIds[0]}/cards/${cardId}`, {
      headers: authHeaders(user.token),
      data: { newBoardId: board.boardId, newSwimlaneId: board.swimlaneId, newListId: srcList },
    });
    expect(back.status()).toBe(200);
    await expect.poll(() => commentBoards(cardId)).toEqual([board.boardId]);
    expect(db.find('card_comments', { cardId, boardId: target.boardId })).toHaveLength(0);
  });

  test('NEGATIVE: a refused REST move moves neither the card nor its comment', async ({ request, user2, board }) => {
    const cardId = db.findCardIdByTitle({ boardId: board.boardId, title: 'Gamma Card' });
    const now = new Date();
    const commentId = db.uid('comment');
    db.insertOne('card_comments', {
      _id: commentId, cardId, boardId: board.boardId, userId: board.owner.id,
      text: 'stays where its card stays', createdAt: now, modifiedAt: now,
    });
    const res = await request.put(`/api/boards/${board.boardId}/lists/${board.listIds[2]}/cards/${cardId}`, {
      headers: authHeaders(user2.token),
      data: { newBoardId: target.boardId, newSwimlaneId: target.swimlaneId, newListId: target.listIds[0] },
    });
    expect(res.status()).not.toBe(200);
    expect(db.getCard(cardId).boardId).toBe(board.boardId);
    expect(db.findOne('card_comments', { _id: commentId }).boardId).toBe(board.boardId);
  });
});
