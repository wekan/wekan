'use strict';

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { openBoard } = require('../helpers/auth');
const BoardPage = require('../pages/BoardPage');
const CardPage = require('../pages/CardPage');

const headers = token => ({ Authorization: `Bearer ${token}` });
const cardPath = card => `/api/boards/${card.boardId}/lists/${card.listId}/cards/${card._id}`;

test('REST clears a description in storage, API reads and the open card', async ({ boardPage: page, request, user, board }) => {
  const card = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  const base = cardPath(card);
  const description = 'Description to clear';
  const bp = new BoardPage(page);
  const cp = new CardPage(page);
  await bp.clickCard(card.listId, card.title);
  await cp.waitForOpen();
  const viewer = cp.root.locator('.viewer').filter({ hasText: description });

  for (const format of ['json', 'form']) {
    const set = await request.put(base, { headers: headers(user.token), data: { description } });
    expect(set.status()).toBe(200);
    expect(db.findOne('cards', { _id: card._id }).description).toBe(description);
    await expect(viewer).toBeVisible();

    const clear = await request.put(base, {
      headers: headers(user.token),
      ...(format === 'json' ? { data: { description: '' } } : { form: { description: '' } }),
    });
    expect(clear.status()).toBe(200);
    expect(await clear.json()).toEqual({ _id: card._id });
    // Schema cleaning may remove an empty optional description.
    expect(db.findOne('cards', { _id: card._id }).description ?? '').toBe('');
    const read = await request.get(base, { headers: headers(user.token) });
    expect(read.status()).toBe(200);
    expect((await read.json()).description ?? '').toBe('');
    await expect(viewer).toHaveCount(0);
    await expect(cp.root).toBeVisible();
  }

  await openBoard(page, board.boardId, board.slug);
  await bp.clickCard(card.listId, card.title);
  await cp.waitForOpen();
  await expect(viewer).toHaveCount(0);
  const set = await request.put(base, { headers: headers(user.token), data: { description } });
  expect(set.status()).toBe(200);
  const edit = await request.put(base, { headers: headers(user.token), data: { title: 'Renamed card' } });
  expect(edit.status()).toBe(200);
  expect(db.findOne('cards', { _id: card._id }).description).toBe(description);
  await expect(viewer).toBeVisible();
});

test('clearing a description rejects unauthenticated, unauthorized and incorrectly scoped edits without writes', async ({ request, user, user2, board }) => {
  const card = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  db.updateOne('cards', { _id: card._id }, { $set: { description: 'Keep this description' } });
  const before = db.findOne('cards', { _id: card._id });
  for (const auth of [{}, headers(user2.token)]) {
    const response = await request.put(cardPath(card), { headers: auth, data: { description: '' } });
    expect([401, 403]).toContain(response.status());
    expect(db.findOne('cards', { _id: card._id })).toEqual(before);
  }
  const otherBoard = db.seedBoard({ ownerId: user.id });
  try {
    for (const target of [
      { ...card, _id: db.uid('missing') },
      { ...card, listId: board.listIds[1] },
      { ...card, boardId: otherBoard.boardId },
    ]) {
      const response = await request.put(cardPath(target), { headers: headers(user.token), data: { description: '' } });
      expect(response.status()).toBe(404);
      expect(await response.json()).toEqual({ error: 'Card not found' });
      expect(db.findOne('cards', { _id: card._id })).toEqual(before);
    }
  } finally {
    db.cleanup({ boardIds: [otherBoard.boardId] });
  }
});
