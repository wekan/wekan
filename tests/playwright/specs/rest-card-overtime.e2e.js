'use strict';

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, openBoard } = require('../helpers/auth');
const BoardPage = require('../pages/BoardPage');
const CardPage = require('../pages/CardPage');

const headers = token => ({ Authorization: `Bearer ${token}` });
const cardPath = card => `/api/boards/${card.boardId}/lists/${card.listId}/cards/${card._id}`;

test('REST overtime persists and updates the open card for JSON and form edits', async ({ boardPage: page, request, user, board }) => {
  const card = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  db.updateOne('boards', { _id: board.boardId }, { $set: { allowsSpentTime: true } });
  db.updateOne('cards', { _id: card._id }, { $set: { spentTime: 2, isOvertime: false } });
  const bp = new BoardPage(page);
  const cp = new CardPage(page);
  await bp.clickCard(card.listId, card.title);
  await cp.waitForOpen();
  const heading = cp.root.locator('.card-details-item-spent .card-details-item-title');
  await expect(heading).toContainText('Spent time');

  for (const format of ['json', 'form']) {
    for (const isOverTime of [true, false]) {
      const response = await request.put(cardPath(card), {
        headers: headers(user.token),
        ...(format === 'json' ? { data: { isOverTime } } : { form: { isOverTime: String(isOverTime) } }),
      });
      expect(response.status()).toBe(200);
      expect(await response.json()).toEqual({ _id: card._id });
      const stored = db.findOne('cards', { _id: card._id });
      expect(stored.isOvertime).toBe(isOverTime);
      expect(stored).not.toHaveProperty('isOverTime');
      expect(stored.spentTime).toBe(2);
      const read = await request.get(cardPath(card), { headers: headers(user.token) });
      expect(read.status()).toBe(200);
      expect((await read.json()).isOvertime).toBe(isOverTime);
      await expect(heading).toContainText(isOverTime ? 'Overtime' : 'Spent time');
    }
  }

  // Omitting the flag during another edit must preserve the saved value.
  const enable = await request.put(cardPath(card), { headers: headers(user.token), data: { isOverTime: true } });
  expect(enable.status()).toBe(200);
  const edit = await request.put(cardPath(card), { headers: headers(user.token), data: { description: 'Keep overtime' } });
  expect(edit.status()).toBe(200);
  expect(db.findOne('cards', { _id: card._id }).isOvertime).toBe(true);
  await page.reload();
  // Token-based fixture sessions may be memory-only. Authenticate the new
  // page before reopening the private board to check the persisted display.
  await loginWithToken(page, user.id, user.token);
  await openBoard(page, board.boardId, board.slug);
  await bp.clickCard(card.listId, card.title);
  await cp.waitForOpen();
  await expect(heading).toContainText('Overtime');
});

test('REST overtime rejects invalid, unauthenticated, unauthorized and incorrectly scoped edits without writes', async ({ request, user, user2, board }) => {
  const card = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  db.updateOne('cards', { _id: card._id }, { $set: { isOvertime: true } });
  const before = db.findOne('cards', { _id: card._id });
  for (const isOverTime of [null, 0, 'yes', {}, []]) {
    const response = await request.put(cardPath(card), { headers: headers(user.token), data: { isOverTime, title: 'Renamed' } });
    expect(response.status()).toBe(400);
    expect(await response.json()).toEqual({ error: 'Invalid isOverTime' });
    expect(db.findOne('cards', { _id: card._id })).toEqual(before);
  }
  for (const auth of [{}, headers(user2.token)]) {
    const response = await request.put(cardPath(card), { headers: auth, data: { isOverTime: false } });
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
      const response = await request.put(cardPath(target), { headers: headers(user.token), data: { isOverTime: false } });
      expect(response.status()).toBe(404);
      expect(await response.json()).toEqual({ error: 'Card not found' });
      expect(db.findOne('cards', { _id: card._id })).toEqual(before);
    }
  } finally {
    db.cleanup({ boardIds: [otherBoard.boardId] });
  }
});
