'use strict';

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');

const headers = token => ({ Authorization: `Bearer ${token}` });
const cardsPath = board => `/api/boards/${board.boardId}/lists/${board.listIds[0]}/cards`;

test('REST creation persists a parent and shows the new card as its subtask', async ({ boardPage: page, request, user, board }) => {
  const parent = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  const response = await request.post(cardsPath(board), {
    headers: headers(user.token),
    data: { title: 'Created subtask', parentId: parent._id, swimlaneId: board.swimlaneId },
  });
  expect(response.status()).toBe(200);
  const { _id } = await response.json();
  expect(db.findOne('cards', { _id }).parentId).toBe(parent._id);
  const read = await request.get(`${cardsPath(board)}/${_id}`, { headers: headers(user.token) });
  expect(read.status()).toBe(200);
  expect((await read.json()).parentId).toBe(parent._id);

  await page.goto(`/b/${board.boardId}/${board.slug}/${parent._id}`);
  const subtask = page.locator('.card-subtasks-items .js-subtasks').filter({ hasText: 'Created subtask' });
  await expect(subtask).toBeVisible();
  await page.reload();
  await expect(subtask).toBeVisible();
});

test('REST creation accepts an omitted or empty parent', async ({ request, user, board }) => {
  for (const body of [{}, { parentId: '' }]) {
    const response = await request.post(cardsPath(board), {
      headers: headers(user.token),
      data: { title: 'Independent card', swimlaneId: board.swimlaneId, ...body },
    });
    expect(response.status()).toBe(200);
    const { _id } = await response.json();
    expect(db.findOne('cards', { _id }).parentId).toBe('');
  }
});

test('REST creation refuses non-string parents without inserting', async ({ request, user, board }) => {
  const parent = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  const before = db.countDocuments('cards', { boardId: board.boardId });
  for (const parentId of [0, false, true, 42, {}, [], { _id: parent._id }]) {
    const response = await request.post(cardsPath(board), {
      headers: headers(user.token),
      data: { title: 'Refused child', parentId, swimlaneId: board.swimlaneId },
    });
    expect(response.status()).toBe(400);
    expect(await response.json()).toEqual({ error: 'Invalid parentId' });
    expect(db.countDocuments('cards', { boardId: board.boardId })).toBe(before);
  }
});

test('REST creation refuses missing and invisible parents without inserting', async ({ request, user, user2, board }) => {
  const foreign = db.seedBoard({ ownerId: user2.id, cardTitlesPerList: [['Private parent']] });
  const privateParent = db.findOne('cards', { boardId: foreign.boardId });
  const before = db.countDocuments('cards', { boardId: board.boardId });
  try {
    for (const [parentId, status] of [[db.uid('missing'), 404], [privateParent._id, 403]]) {
      const response = await request.post(cardsPath(board), {
        headers: headers(user.token),
        data: { title: 'Refused child', parentId, swimlaneId: board.swimlaneId },
      });
      expect(response.status()).toBe(status);
      expect(db.countDocuments('cards', { boardId: board.boardId })).toBe(before);
    }
  } finally {
    db.cleanup({ boardIds: [foreign.boardId] });
  }
});

test('REST creation with a parent still requires board write access', async ({ request, user2, board }) => {
  const parent = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  const before = db.countDocuments('cards', { boardId: board.boardId });
  for (const auth of [{}, headers(user2.token)]) {
    const response = await request.post(cardsPath(board), {
      headers: auth,
      data: { title: 'Refused child', parentId: parent._id, swimlaneId: board.swimlaneId },
    });
    expect([401, 403]).toContain(response.status());
    expect(db.countDocuments('cards', { boardId: board.boardId })).toBe(before);
  }
});
