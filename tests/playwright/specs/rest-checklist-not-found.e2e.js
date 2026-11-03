'use strict';

// A scoped checklist GET must distinguish not-found from server errors.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const BoardPage = require('../pages/BoardPage');
const CardPage = require('../pages/CardPage');

const headers = token => ({ Authorization: `Bearer ${token}` });
const checklistPath = (boardId, cardId, checklistId = '') =>
  `/api/boards/${boardId}/cards/${cardId}/checklists${checklistId ? `/${checklistId}` : ''}`;

async function createChecklist(request, user, board) {
  const card = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  const response = await request.post(checklistPath(board.boardId, card._id), {
    headers: headers(user.token),
    data: { title: 'Retained REST checklist', items: ['Retained REST item'] },
  });
  expect(response.status()).toBe(200);
  const { _id } = await response.json();
  return { card, id: _id, path: checklistPath(board.boardId, card._id, _id) };
}

test('missing and wrong-scope checklists return JSON 404 while a valid checklist stays readable', async ({ request, user, board }) => {
  const checklist = await createChecklist(request, user, board);
  const otherCard = db.findOne('cards', { boardId: board.boardId, title: 'Beta Card' });
  const otherBoard = db.seedBoard({ ownerId: user.id, cardTitlesPerList: [['Other board card']] });
  try {
    const foreignCard = db.findOne('cards', { boardId: otherBoard.boardId });
    for (const path of [
      checklistPath(board.boardId, checklist.card._id, 'missing-checklist'),
      checklistPath(board.boardId, otherCard._id, checklist.id),
      checklistPath(otherBoard.boardId, foreignCard._id, checklist.id),
    ]) {
      const response = await request.get(path, { headers: headers(user.token) });
      expect(response.status()).toBe(404);
      expect(response.headers()['content-type']).toContain('application/json');
      expect(await response.json()).toEqual({ error: 'Checklist not found or does not belong to the specified card' });
    }
    for (const cardId of ['missing-card', foreignCard._id]) {
      const response = await request.get(checklistPath(board.boardId, cardId, checklist.id), { headers: headers(user.token) });
      expect(response.status()).toBe(404);
      expect(await response.json()).toEqual({ error: 'Card not found or does not belong to the specified board' });
    }
    const response = await request.get(checklist.path, { headers: headers(user.token) });
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data._id).toBe(checklist.id);
    expect(data.title).toBe('Retained REST checklist');
    expect(data.items.map(item => item.title)).toEqual(['Retained REST item']);
  } finally {
    db.cleanup({ boardIds: [otherBoard.boardId] });
  }
});

test('missing and existing checklist IDs preserve board access and authentication errors', async ({ request, user, user2, board }) => {
  const checklist = await createChecklist(request, user, board);
  for (const id of [checklist.id, 'missing-checklist']) {
    const path = checklistPath(board.boardId, checklist.card._id, id);
    expect((await request.get(path, { headers: headers(user2.token) })).status()).toBe(403);
    expect((await request.get(path)).status()).toBe(401);
  }
});

test('a failed checklist read leaves the real checklist and its item visible in the card', async ({ request, user, board, boardPage }) => {
  const checklist = await createChecklist(request, user, board);
  const bp = new BoardPage(boardPage);
  const cp = new CardPage(boardPage);
  await bp.clickCard(board.listIds[0], 'Alpha Card');
  await cp.waitForOpen();
  await expect(cp.root.locator('.checklist-title').filter({ hasText: 'Retained REST checklist' })).toBeVisible();
  await expect(cp.root.locator('.js-checklist-item').filter({ hasText: 'Retained REST item' })).toBeVisible();

  const response = await request.get(checklistPath(board.boardId, checklist.card._id, 'missing-checklist'), { headers: headers(user.token) });
  expect(response.status()).toBe(404);
  await boardPage.reload();
  // Open-card state belongs to the page session, so reopen after a reload.
  await bp.clickCard(board.listIds[0], 'Alpha Card');
  await cp.waitForOpen();
  await cp.root.locator('.checklist-title').filter({ hasText: 'Retained REST checklist' }).scrollIntoViewIfNeeded();
  await expect(cp.root.locator('.checklist-title').filter({ hasText: 'Retained REST checklist' })).toBeVisible();
  await expect(cp.root.locator('.js-checklist-item').filter({ hasText: 'Retained REST item' })).toBeVisible();
});
