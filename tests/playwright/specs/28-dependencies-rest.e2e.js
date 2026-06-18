'use strict';

/**
 * Spec 28 — REST API for card dependencies ("Red Strings", #3392)
 *
 * Real Bearer-token auth → real HTTP request → MongoDB change verified directly.
 * Requires the API server (WITH_API=true), like specs 17 and 23.
 *
 * This also exercises the cardDependencies SimpleSchema on the real server: the
 * POST path does a Mongo $push of a { cardId, type, color, icon } object and the
 * PUT path a positional ($) update, so a green run confirms collection2 accepts
 * the object array form.
 */

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');

function authHeaders(token, json = false) {
  const h = { Authorization: `Bearer ${token}` };
  if (json) h['Content-Type'] = 'application/json';
  return h;
}

function cardDeps(cardId) {
  const card = db.findOne('cards', { _id: cardId });
  return (card && card.cardDependencies) || [];
}

test.describe('REST API: card dependencies', () => {
  test('full CRUD with type/color/icon, plus validation', async ({ request, user, board }) => {
    const alphaId = db.findCardIdByTitle({ boardId: board.boardId, title: 'Alpha Card' });
    const betaId = db.findCardIdByTitle({ boardId: board.boardId, title: 'Beta Card' });
    const base = `/api/boards/${board.boardId}/cards/${alphaId}/dependencies`;

    // ---- POST add (Mongo $push of a typed object) --------------------------
    const addRes = await request.post(base, {
      headers: authHeaders(user.token, true),
      data: { cardId: betaId, type: 'blocks', color: '#2196f3', icon: 'lock' },
    });
    expect(addRes.status()).toBe(200);

    let deps = cardDeps(alphaId);
    expect(deps).toHaveLength(1);
    expect(deps[0]).toMatchObject({
      cardId: betaId,
      type: 'blocks',
      color: '#2196f3',
      icon: 'lock',
    });

    // ---- GET one card's dependencies --------------------------------------
    const getRes = await request.get(base, { headers: authHeaders(user.token) });
    expect(getRes.status()).toBe(200);
    const list = await getRes.json();
    expect(list).toEqual(expect.arrayContaining([
      expect.objectContaining({ cardId: betaId, type: 'blocks' }),
    ]));

    // ---- GET board-level dependency lines ---------------------------------
    const boardRes = await request.get(`/api/boards/${board.boardId}/dependencies`, {
      headers: authHeaders(user.token),
    });
    expect(boardRes.status()).toBe(200);
    const lines = await boardRes.json();
    expect(lines).toEqual(expect.arrayContaining([
      expect.objectContaining({ from: alphaId, to: betaId, type: 'blocks', color: '#2196f3' }),
    ]));

    // ---- PUT edit (positional $ update) -----------------------------------
    const putRes = await request.put(`${base}/${betaId}`, {
      headers: authHeaders(user.token, true),
      data: { color: '#ff0000', type: 'is-blocked-by' },
    });
    expect(putRes.status()).toBe(200);
    deps = cardDeps(alphaId);
    expect(deps[0]).toMatchObject({ cardId: betaId, color: '#ff0000', type: 'is-blocked-by' });

    // ---- POST again with same target updates in place (no duplicate) ------
    const reAddRes = await request.post(base, {
      headers: authHeaders(user.token, true),
      data: { cardId: betaId, type: 'fixes' },
    });
    expect(reAddRes.status()).toBe(200);
    deps = cardDeps(alphaId);
    expect(deps).toHaveLength(1);
    expect(deps[0].type).toBe('fixes');

    // ---- Validation: bad type, self-link --------------------------------
    const badType = await request.post(base, {
      headers: authHeaders(user.token, true),
      data: { cardId: betaId, type: 'not-a-type' },
    });
    expect(badType.status()).toBeGreaterThanOrEqual(400);

    const selfLink = await request.post(base, {
      headers: authHeaders(user.token, true),
      data: { cardId: alphaId },
    });
    expect(selfLink.status()).toBeGreaterThanOrEqual(400);

    // ---- DELETE -----------------------------------------------------------
    const delRes = await request.delete(`${base}/${betaId}`, {
      headers: authHeaders(user.token),
    });
    expect(delRes.status()).toBe(200);
    expect(cardDeps(alphaId)).toHaveLength(0);
  });

  test('unauthenticated requests are rejected', async ({ request, board }) => {
    const alphaId = db.findCardIdByTitle({ boardId: board.boardId, title: 'Alpha Card' });
    const res = await request.get(`/api/boards/${board.boardId}/cards/${alphaId}/dependencies`);
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });
});
