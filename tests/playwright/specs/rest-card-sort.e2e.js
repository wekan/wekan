'use strict';

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');

const headers = token => ({ Authorization: `Bearer ${token}` });
const cardPath = card => `/api/boards/${card.boardId}/lists/${card.listId}/cards/${card._id}`;

test('REST sort zero persists and moves the card to the top of its list', async ({ boardPage: page, request, user, board }) => {
  const first = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  const second = db.findOne('cards', { boardId: board.boardId, title: 'Beta Card' });
  db.updateOne('cards', { _id: second._id }, { $set: { listId: first.listId, sort: 200 } });
  const cards = page.locator('.list').filter({ has: page.locator('.minicard-wrapper').filter({ hasText: 'Alpha Card' }) }).locator('.minicard-title');
  await expect(cards).toHaveText(['Alpha Card', 'Beta Card']);

  const base = cardPath({ ...second, listId: first.listId });
  const response = await request.put(base, { headers: headers(user.token), data: { sort: 0 } });
  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({ _id: second._id });
  expect(db.findOne('cards', { _id: second._id }).sort).toBe(0);
  const read = await request.get(base, { headers: headers(user.token) });
  expect(read.status()).toBe(200);
  expect((await read.json()).sort).toBe(0);
  await expect(cards).toHaveText(['Beta Card', 'Alpha Card']);
  await page.reload();
  await expect(cards).toHaveText(['Beta Card', 'Alpha Card']);

  for (const sort of [5, -1, 0.5]) {
    const update = await request.put(base, { headers: headers(user.token), data: { sort } });
    expect(update.status()).toBe(200);
    expect(db.findOne('cards', { _id: second._id }).sort).toBe(sort);
  }
  // Form-encoded clients already send zero as a truthy string.
  const form = await request.put(base, { headers: headers(user.token), form: { sort: '0' } });
  expect(form.status()).toBe(200);
  expect(db.findOne('cards', { _id: second._id }).sort).toBe(0);
  const edit = await request.put(base, { headers: headers(user.token), data: { description: 'Edited without moving' } });
  expect(edit.status()).toBe(200);
  expect(db.findOne('cards', { _id: second._id })).toMatchObject({ sort: 0, description: 'Edited without moving' });
});

test('sort zero rejects unauthenticated, unauthorized and incorrectly scoped edits without writes', async ({ request, user, user2, board }) => {
  const card = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  const before = db.findOne('cards', { _id: card._id });
  for (const auth of [{}, headers(user2.token)]) {
    const response = await request.put(cardPath(card), { headers: auth, data: { sort: 0 } });
    expect([401, 403]).toContain(response.status());
    expect(db.findOne('cards', { _id: card._id })).toEqual(before);
  }
  for (const target of [{ ...card, _id: db.uid('missing') }, { ...card, listId: board.listIds[1] }]) {
    const response = await request.put(cardPath(target), { headers: headers(user.token), data: { sort: 0 } });
    expect(response.status()).toBe(404);
    expect(await response.json()).toEqual({ error: 'Card not found' });
    expect(db.findOne('cards', { _id: card._id })).toEqual(before);
  }
});
