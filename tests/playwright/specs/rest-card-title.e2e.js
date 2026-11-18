'use strict';

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const BoardPage = require('../pages/BoardPage');

const cardPath = card => `/api/boards/${card.boardId}/lists/${card.listId}/cards/${card._id}`;
const auth = user => ({ Authorization: `Bearer ${user.token}` });

test('REST clears a card title in JSON and form requests and updates the board', async ({ boardPage: page, request, user, board }) => {
  const card = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  const path = cardPath(card);
  const headers = auth(user);
  const titles = new BoardPage(page).cardTitlesInList(card.listId);

  for (const format of ['data', 'form']) {
    const rename = await request.put(path, { headers, data: { title: 'Title to clear' } });
    expect(rename.status()).toBe(200);
    await expect(titles).toHaveText(['Title to clear']);

    const clear = await request.put(path, { headers, [format]: { title: '' } });
    expect(clear.status()).toBe(200);
    expect(await clear.json()).toEqual({ _id: card._id });
    expect(db.findOne('cards', { _id: card._id }).title).toBe('');

    const read = await request.get(path, { headers });
    expect(read.status()).toBe(200);
    expect((await read.json()).title).toBe('');
    await expect(titles).toHaveText(['']);
  }

  const repeatClear = await request.put(path, { headers, data: { title: '' } });
  expect(repeatClear.status()).toBe(200);
  expect(db.findOne('cards', { _id: card._id }).title).toBe('');
});

test('REST returns 404 without changing the title of an archived card', async ({ request, user, board }) => {
  const card = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  const path = cardPath(card);
  const headers = auth(user);
  const archive = await request.post(`${path}/archive`, { headers });
  expect(archive.status()).toBe(200);
  const archived = db.findOne('cards', { _id: card._id });
  expect(archived).toMatchObject({ archived: true, title: card.title });

  for (const title of ['', 'Renamed']) {
    const response = await request.put(path, { headers, data: { title } });
    expect(response.status()).toBe(404);
    expect(db.findOne('cards', { _id: card._id })).toMatchObject({ archived: true, title: card.title });
  }
});

test('REST refuses an invalid title before saving other fields and preserves an omitted title', async ({ request, user, board }) => {
  const card = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  const path = cardPath(card);
  const headers = auth(user);
  const invalid = await request.put(path, { headers, data: { title: null, description: 'Other edit' } });
  expect(invalid.status()).toBe(400);
  expect(await invalid.json()).toEqual({ error: 'Invalid title' });
  expect(db.findOne('cards', { _id: card._id })).toEqual(card);

  const edit = await request.put(path, { headers, data: { description: 'Other edit' } });
  expect(edit.status()).toBe(200);
  expect(db.findOne('cards', { _id: card._id })).toMatchObject({
    title: card.title,
    description: 'Other edit',
  });
});
