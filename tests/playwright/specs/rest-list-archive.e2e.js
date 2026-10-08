'use strict';
// #2906: archive and restore a list through the REST API; another user's
// token is refused.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');

const headers = token => ({ Authorization: `Bearer ${token}` });

test('a list is archived and restored by REST, and not by someone without access', async ({ request, user, user2, board }) => {
  const listId = board.listIds[0];
  const base = `/api/boards/${board.boardId}/lists/${listId}`;
  const refused = await request.post(`${base}/archive`, { headers: headers(user2.token) });
  expect(refused.status()).not.toBe(200);
  expect(db.findOne('lists', { _id: listId }).archived).toBe(false);

  expect((await request.post(`${base}/archive`, { headers: headers(user.token) })).status()).toBe(200);
  expect(db.findOne('lists', { _id: listId }).archived).toBe(true);
  // Archiving again: the list is no longer live.
  expect((await request.post(`${base}/archive`, { headers: headers(user.token) })).status()).toBe(404);

  expect((await request.post(`${base}/unarchive`, { headers: headers(user.token) })).status()).toBe(200);
  expect(db.findOne('lists', { _id: listId }).archived).toBe(false);
});
