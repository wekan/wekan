'use strict';

const { test: base, expect } = require('../fixtures');
const db = require('../helpers/db');

const headers = token => ({ Authorization: `Bearer ${token}` });
const fieldPath = (boardId, id) => `/api/boards/${boardId}/custom-fields/${id}`;

const test = base.extend({
  customField: async ({ request, user, board }, use) => {
    const response = await request.post(`/api/boards/${board.boardId}/custom-fields`, {
      headers: headers(user.token),
      data: { name: 'Deletion field', type: 'text', settings: {}, showOnCard: true, showLabelOnMiniCard: true },
    });
    expect(response.status()).toBe(200);
    const { _id } = await response.json();
    try {
      await use({ id: _id, path: fieldPath(board.boardId, _id) });
    } finally {
      db.deleteOne('customFields', { _id });
    }
  },
});

test('custom-field DELETE rejects missing and wrong-board IDs and reports repeated deletions', async ({ request, user, board, customField }) => {
  const other = db.seedBoard({ ownerId: user.id });
  try {
    const before = db.findOne('customFields', { _id: customField.id });
    for (const path of [fieldPath(board.boardId, 'missing-field'), fieldPath(other.boardId, customField.id)]) {
      const response = await request.delete(path, { headers: headers(user.token) });
      expect(response.status()).toBe(404);
      expect(response.headers()['content-type']).toContain('application/json');
      expect(await response.json()).toEqual({ error: 'Custom field not found' });
      expect(db.findOne('customFields', { _id: customField.id })).toEqual(before);
    }
    const response = await request.delete(customField.path, { headers: headers(user.token) });
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({ _id: customField.id });
    expect(db.findOne('customFields', { _id: customField.id })).toBeNull();
    const read = await request.get(customField.path, { headers: headers(user.token) });
    expect(read.status()).toBe(404);
    const repeated = await request.delete(customField.path, { headers: headers(user.token) });
    expect(repeated.status()).toBe(404);
    expect(await repeated.json()).toEqual({ error: 'Custom field not found' });
  } finally {
    db.cleanup({ boardIds: [other.boardId] });
  }
});

test('custom-field DELETE keeps authorization checks and permits ordinary board writers', async ({ request, user2, board, customField }) => {
  const before = db.findOne('customFields', { _id: customField.id });
  expect((await request.delete(customField.path)).status()).toBe(401);
  expect((await request.delete(customField.path, { headers: headers(user2.token) })).status()).toBe(403);
  expect(db.findOne('customFields', { _id: customField.id })).toEqual(before);

  // A refused write may block its actor; use a fresh member for the valid write.
  const member = db.seedUser();
  try {
    db.addBoardMember({ boardId: board.boardId, userId: member.id });
    const response = await request.delete(customField.path, { headers: headers(member.token) });
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({ _id: customField.id });
    expect(db.findOne('customFields', { _id: customField.id })).toBeNull();
  } finally {
    db.cleanup({ userIds: [member.id] });
  }
});

test('rejected custom-field deletion preserves card values and successful deletion removes them from the board', async ({ request, user, board, customField, boardPage: page }) => {
  const other = db.seedBoard({ ownerId: user.id });
  const siblingId = db.uid('field');
  const card = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  try {
    db.insertOne('customFields', {
      ...db.findOne('customFields', { _id: customField.id }), _id: siblingId, name: 'Retained field',
    });
    db.updateOne('boards', { _id: board.boardId }, { $set: { allowsCustomFieldsOnMinicard: true } });
    db.updateOne('cards', { _id: card._id }, { $set: { customFields: [
      { _id: customField.id, value: 'Delete this value' },
      { _id: siblingId, value: 'Keep this value' },
    ] } });
    const minicard = page.locator('.minicard-wrapper').filter({ hasText: 'Alpha Card' });
    await expect(minicard).toContainText('Deletion field');
    await expect(minicard).toContainText('Delete this value');
    await expect(minicard).toContainText('Keep this value');
    const before = db.getCard(card._id);
    const rejected = await request.delete(fieldPath(other.boardId, customField.id), { headers: headers(user.token) });
    expect(rejected.status()).toBe(404);
    expect(db.getCard(card._id)).toEqual(before);
    await expect(minicard).toContainText('Delete this value');

    const response = await request.delete(customField.path, { headers: headers(user.token) });
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({ _id: customField.id });
    expect(db.findOne('customFields', { _id: customField.id })).toBeNull();
    expect(db.getCard(card._id).customFields).toEqual([{ _id: siblingId, value: 'Keep this value' }]);
    await expect(minicard).not.toContainText('Deletion field');
    await expect(minicard).not.toContainText('Delete this value');
    await expect(minicard).toContainText('Retained field');
    await expect(minicard).toContainText('Keep this value');
    await page.reload();
    await expect(minicard).not.toContainText('Deletion field');
    await expect(minicard).toContainText('Keep this value');
  } finally {
    db.deleteOne('customFields', { _id: siblingId });
    db.cleanup({ boardIds: [other.boardId] });
  }
});
