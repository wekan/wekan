'use strict';

/**
 * Spec 40 — REST API: move a card to another list (#6423 regression)
 *
 * #6423: PUT /api/boards/:boardId/lists/:listId/cards/:cardId with a `listId` in
 * the body (a same-board list move) returned HTTP 500 — the move path called the
 * cardMove() activity helper with `{ fieldName: 'listId' }` (a plain object)
 * where it expects an ARRAY of changed field names, so `fieldNames.includes(...)`
 * threw "fieldNames.includes is not a function".
 *
 * Positive: the move now returns 200 and the card lands in the destination list,
 *           and a 'moveCard' activity is recorded (proving cardMove() ran).
 * Negative: the endpoint never 500s on this path; a user without board write
 *           access cannot move the card.
 *
 * Requires WITH_API=true (the test server sets it).
 */

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');

function authHeaders(token, json = false) {
  const h = { Authorization: `Bearer ${token}` };
  if (json) h['Content-Type'] = 'application/json';
  return h;
}

test.describe('REST API: move card to another list (#6423)', () => {
  test('PUT with listId moves the card and returns 200 (not 500)', async ({ request, user, board }) => {
    const srcList = board.listIds[0];
    const destList = board.listIds[1];
    const cardId = db.find('cards', { boardId: board.boardId, listId: srcList, archived: false })[0]._id;

    const res = await request.put(
      `/api/boards/${board.boardId}/lists/${srcList}/cards/${cardId}`,
      { headers: authHeaders(user.token, true), data: { listId: destList } },
    );

    // Regression: must NOT be a 500.
    expect(res.status(), `move response was ${res.status()}`).not.toBe(500);
    expect(res.status()).toBe(200);

    // Data correctness: the card is now in the destination list.
    await expect.poll(() => db.getCard(cardId).listId, { timeout: 5_000 }).toBe(destList);

    // cardMove() ran to completion: a moveCard activity was recorded for this card.
    await expect
      .poll(
        () => db.find('activities', { cardId, activityType: 'moveCard' }).length,
        { timeout: 5_000 },
      )
      .toBeGreaterThan(0);
  });

  test('moving back and forth never 500s (the includes-is-not-a-function path)', async ({ request, user, board }) => {
    const [a, b] = board.listIds;
    const cardId = db.find('cards', { boardId: board.boardId, listId: a, archived: false })[0]._id;

    for (const target of [b, a, b]) {
      const res = await request.put(
        `/api/boards/${board.boardId}/lists/${cardCurrentList(cardId)}/cards/${cardId}`,
        { headers: authHeaders(user.token, true), data: { listId: target } },
      );
      expect(res.status(), `move to ${target} returned ${res.status()}`).toBe(200);
      await expect.poll(() => db.getCard(cardId).listId, { timeout: 5_000 }).toBe(target);
    }

    function cardCurrentList(id) {
      return db.getCard(id).listId;
    }
  });

  test('a user without board write access cannot move the card (negative)', async ({ request, user2, board }) => {
    const srcList = board.listIds[0];
    const destList = board.listIds[1];
    const cardId = db.find('cards', { boardId: board.boardId, listId: srcList, archived: false })[0]._id;

    const res = await request.put(
      `/api/boards/${board.boardId}/lists/${srcList}/cards/${cardId}`,
      { headers: authHeaders(user2.token, true), data: { listId: destList } },
    );

    // Not authorized — must not succeed, and must not move the card.
    expect(res.status()).not.toBe(200);
    expect(db.getCard(cardId).listId).toBe(srcList);
  });
});
