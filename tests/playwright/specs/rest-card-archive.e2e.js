'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');

const headers = token => ({ Authorization: `Bearer ${token}` });
const cardPath = (boardId, listId, cardId) => `/api/boards/${boardId}/lists/${listId}/cards/${cardId}`;

for (const operation of ['archive', 'unarchive']) {
  test(`${operation} returns JSON 404 for missing, incorrectly scoped and wrong-state cards without writes`, async ({ request, user, board }) => {
    const card = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
    const other = db.seedBoard({ ownerId: user.id });
    try {
      db.updateOne('cards', { _id: card._id }, { $set: { archived: operation === 'unarchive' } });
      const before = db.findOne('cards', { _id: card._id });
      const activities = db.find('activities', { cardId: card._id });
      const paths = [
        cardPath(board.boardId, card.listId, db.uid('missing')),
        cardPath(board.boardId, board.listIds[1], card._id),
        cardPath(other.boardId, other.listIds[0], card._id),
      ];
      for (const path of paths) {
        const response = await request.post(`${path}/${operation}`, { headers: headers(user.token) });
        expect(response.status()).toBe(404);
        expect(response.headers()['content-type']).toContain('application/json');
        expect(await response.json()).toEqual({ error: 'Card not found' });
        expect(db.findOne('cards', { _id: card._id })).toEqual(before);
        expect(db.find('activities', { cardId: card._id })).toEqual(activities);
      }
      // A card already in the requested state is outside the route's selector.
      db.updateOne('cards', { _id: card._id }, { $set: { archived: operation === 'archive' } });
      const wrongState = db.findOne('cards', { _id: card._id });
      const response = await request.post(`${cardPath(board.boardId, card.listId, card._id)}/${operation}`, { headers: headers(user.token) });
      expect(response.status()).toBe(404);
      expect(await response.json()).toEqual({ error: 'Card not found' });
      expect(db.findOne('cards', { _id: card._id })).toEqual(wrongState);
      expect(db.find('activities', { cardId: card._id })).toEqual(activities);
    } finally {
      db.cleanup({ boardIds: [other.boardId] });
    }
  });
}

test('REST archive and restore persist and update the board, while unauthorized and repeated requests do not write', async ({ boardPage: page, request, user, user2, board }) => {
  const card = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  const base = cardPath(board.boardId, card.listId, card._id);
  const minicard = page.locator('.minicard-wrapper').filter({ hasText: 'Alpha Card' });
  await expect(minicard).toBeVisible();
  for (const [operation, archived] of [['archive', true], ['unarchive', false]]) {
    const before = db.findOne('cards', { _id: card._id });
    const activities = db.find('activities', { cardId: card._id });
    for (const options of [{}, { headers: headers(user2.token) }]) {
      const refused = await request.post(`${base}/${operation}`, options);
      expect([401, 403]).toContain(refused.status());
      expect(db.findOne('cards', { _id: card._id })).toEqual(before);
      expect(db.find('activities', { cardId: card._id })).toEqual(activities);
    }
    const response = await request.post(`${base}/${operation}`, { headers: headers(user.token) });
    expect(response.status()).toBe(200);
    expect(await response.json()).toMatchObject({ _id: card._id, archived });
    expect(db.findOne('cards', { _id: card._id }).archived).toBe(archived);
    if (archived) await expect(minicard).toHaveCount(0);
    else await expect(minicard).toBeVisible();
    const after = db.findOne('cards', { _id: card._id });
    const afterActivities = db.find('activities', { cardId: card._id });
    const repeated = await request.post(`${base}/${operation}`, { headers: headers(user.token) });
    expect(repeated.status()).toBe(404);
    expect(await repeated.json()).toEqual({ error: 'Card not found' });
    expect(db.findOne('cards', { _id: card._id })).toEqual(after);
    expect(db.find('activities', { cardId: card._id })).toEqual(afterActivities);
  }
});
