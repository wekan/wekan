'use strict';

// Repeated padded names must reuse the label whose name the schema
// already trimmed, including in the card's label picker.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const BoardPage = require('../pages/BoardPage');
const CardPage = require('../pages/CardPage');

async function putLabel(request, token, boardId, label) {
  return request.put(`/api/boards/${boardId}/labels`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { label },
  });
}

test('REST labels reuse trimmed object and string names', async ({ request, user, board }) => {
  for (const labels of [
    [{ name: '  Bug  ', color: 'red' }, { name: '\tBug\n', color: 'red' }, { name: 'Bug', color: 'red' }],
    ['  Feature  ', '\u00a0Feature\u00a0', { name: 'Feature' }],
  ]) {
    const ids = [];
    for (const label of labels) {
      const response = await putLabel(request, user.token, board.boardId, label);
      expect(response.status()).toBe(200);
      ids.push(await response.json());
    }
    expect(typeof ids[0]).toBe('string');
    expect(new Set(ids).size).toBe(1);
  }
  const labels = db.findOne('boards', { _id: board.boardId }).labels;
  expect(labels.map(({ name, color }) => ({ name, color }))).toEqual([
    { name: 'Bug', color: 'red' },
    { name: 'Feature', color: 'green' },
  ]);
});

test('REST label normalization preserves distinct labels and rejects bad input', async ({ request, user, user2, board }) => {
  db.addBoardMember({ boardId: board.boardId, userId: user2.id, isAdmin: false });
  const ids = [];
  for (const label of [
    { name: 'Bug', color: 'red' },
    { name: 'Bug', color: 'blue' },
    { name: 'bug', color: 'red' },
    { name: 'Bug  Fix', color: 'red' },
    { name: 'Bug Fix', color: 'red' },
  ]) {
    const response = await putLabel(request, user.token, board.boardId, label);
    expect(response.status()).toBe(200);
    ids.push(await response.json());
  }
  expect(new Set(ids).size).toBe(5);
  const before = db.findOne('boards', { _id: board.boardId }).labels;
  expect((await putLabel(request, user.token, board.boardId, { name: ' Bug ', color: 'invalid' })).status()).toBe(400);
  expect((await putLabel(request, user.token, board.boardId, undefined)).status()).toBe(400);
  expect((await putLabel(request, user2.token, board.boardId, ' Bug ')).status()).toBe(403);
  expect((await request.put(`/api/boards/${board.boardId}/labels`, { data: { label: ' Bug ' } })).status()).toBe(401);
  expect(db.findOne('boards', { _id: board.boardId }).labels).toEqual(before);
});

test('repeated REST labels appear once in the picker and can be applied', async ({ request, user, board, boardPage }) => {
  const ids = [];
  for (let i = 0; i < 2; i += 1) {
    const response = await putLabel(request, user.token, board.boardId, { name: '  Reused label  ', color: 'red' });
    expect(response.status()).toBe(200);
    ids.push(await response.json());
  }

  const bp = new BoardPage(boardPage);
  const cp = new CardPage(boardPage);
  await bp.clickCard(board.listIds[0], 'Alpha Card');
  await cp.waitForOpen();
  await cp.openLabelSelector();
  const label = boardPage.locator('.js-pop-over .js-select-label').filter({ hasText: 'Reused label' });
  await expect(label).toHaveCount(1);
  await label.click();
  await expect.poll(() => db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' }).labelIds).toEqual([ids[0]]);
  await boardPage.keyboard.press('Escape');
  await expect(cp.root.locator('.card-label').filter({ hasText: 'Reused label' })).toHaveCount(1);
  expect(ids[0]).toBe(ids[1]);
});
