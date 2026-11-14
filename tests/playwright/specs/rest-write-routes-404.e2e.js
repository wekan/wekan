'use strict';

/**
 * A REST write that changes nothing answers 404 (or 409), never 200: the
 * swimlane, list, card, dependency and domain deletions, the custom-field and
 * dropdown-item updates, the board-member add and remove, and the token
 * deletion. A card named with the wrong list keeps its checklists - it used to
 * lose them while the card stayed. tests/restWriteRoutes404.test.cjs drives
 * each handler; this runs them against the real server and database.
 */

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');

const headers = token => ({ Authorization: `Bearer ${token}` });

async function expect404(response, error) {
  expect(response.status()).toBe(404);
  expect(response.headers()['content-type']).toContain('application/json');
  if (error) expect((await response.json()).error).toBe(error);
}

test('swimlane and list deletions: missing, foreign and repeated are 404', async ({ request, user, board }) => {
  const other = db.seedBoard({ ownerId: user.id });
  const h = { headers: headers(user.token) };
  try {
    const lane = db.uid('swim');
    const now = new Date();
    db.insertOne('swimlanes', { _id: lane, title: 'Doomed lane', boardId: board.boardId, sort: 9, type: 'swimlane',
      archived: false, createdAt: now, updatedAt: now, modifiedAt: now });
    await expect404(await request.delete(`/api/boards/${board.boardId}/swimlanes/missing`, h), 'Swimlane not found');
    await expect404(await request.delete(`/api/boards/${other.boardId}/swimlanes/${lane}`, h), 'Swimlane not found');
    expect(db.findOne('swimlanes', { _id: lane })).not.toBeNull();
    expect((await request.delete(`/api/boards/${board.boardId}/swimlanes/${lane}`, h)).status()).toBe(200);
    await expect404(await request.delete(`/api/boards/${board.boardId}/swimlanes/${lane}`, h), 'Swimlane not found');

    const list = board.listIds[board.listIds.length - 1];
    await expect404(await request.delete(`/api/boards/${board.boardId}/lists/missing`, h), 'List not found');
    await expect404(await request.delete(`/api/boards/${other.boardId}/lists/${list}`, h), 'List not found');
    expect(db.findOne('lists', { _id: list }).deletedAt).toBeFalsy();
    expect((await request.delete(`/api/boards/${board.boardId}/lists/${list}`, h)).status()).toBe(200);
    await expect404(await request.delete(`/api/boards/${board.boardId}/lists/${list}`, h), 'List not found');
  } finally { db.cleanup({ boardIds: [other.boardId] }); }
});

test('negative: a card named with the wrong list keeps its checklist and stays on the board', async ({ request, user, page }) => {
  const seeded = db.seedBoard({ ownerId: user.id, cardTitlesPerList: [['Keep my checklist']] });
  const h = { headers: headers(user.token) };
  try {
    const cardId = db.findCardIdByTitle({ boardId: seeded.boardId, title: 'Keep my checklist' });
    const checklistId = db.uid('checklist');
    db.insertOne('checklists', { _id: checklistId, boardId: seeded.boardId, cardId, title: 'Steps', sort: 0, createdAt: new Date(), modifiedAt: new Date() });
    const wrong = `/api/boards/${seeded.boardId}/lists/${seeded.listIds[1]}/cards/${cardId}`;
    await expect404(await request.delete(wrong, h), 'Card not found');
    expect(db.findOne('cards', { _id: cardId })).not.toBeNull();
    expect(db.findOne('checklists', { _id: checklistId })).not.toBeNull();

    const { loginWithToken, openBoard } = require('../helpers/auth');
    await loginWithToken(page, user.id, user.token);
    await openBoard(page, seeded.boardId, seeded.slug);
    await expect(page.locator('.js-minicard', { hasText: 'Keep my checklist' })).toHaveCount(1);

    const right = `/api/boards/${seeded.boardId}/lists/${seeded.listIds[0]}/cards/${cardId}`;
    expect((await request.delete(right, h)).status()).toBe(200);
    expect(db.findOne('cards', { _id: cardId })).toBeNull();
    expect(db.findOne('checklists', { _id: checklistId })).toBeNull();
    await expect404(await request.delete(right, h), 'Card not found');
  } finally { db.cleanup({ boardIds: [seeded.boardId] }); }
});

test('a dependency, a domain, a custom field and a dropdown item that are not there are 404', async ({ request, user, board }) => {
  const h = { headers: headers(user.token) };
  const seeded = db.seedBoard({ ownerId: user.id, cardTitlesPerList: [['Source', 'Target']] });
  try {
    const source = db.findCardIdByTitle({ boardId: seeded.boardId, title: 'Source' });
    const depPath = target => `/api/boards/${seeded.boardId}/cards/${source}/dependencies/${target}`;
    await expect404(await request.delete(depPath('not-a-dependency'), h), 'Dependency not found');
    await expect404(await request.put(depPath('not-a-dependency'), { ...h, data: { color: 'red' } }), 'Dependency not found');

    await expect404(await request.delete(`/api/boards/${board.boardId}/domains/not-there.example`, h), 'Domain not found');

    const created = await request.post(`/api/boards/${board.boardId}/custom-fields`, {
      ...h, data: { name: 'Choice', type: 'dropdown', settings: { dropdownItems: [] }, showOnCard: true, showLabelOnMiniCard: true },
    });
    expect(created.status()).toBe(200);
    const { _id: fieldId } = await created.json();
    try {
      const before = db.findOne('customFields', { _id: fieldId });
      await expect404(await request.put(`/api/boards/${board.boardId}/custom-fields/missing`, { ...h, data: { name: 'X' } }), 'Custom field not found');
      await expect404(await request.put(`/api/boards/${seeded.boardId}/custom-fields/${fieldId}`, { ...h, data: { name: 'X' } }), 'Custom field not found');
      await expect404(await request.post(`/api/boards/${board.boardId}/custom-fields/missing/dropdown-items`, { ...h, data: { items: ['A'] } }), 'Custom field not found');
      await expect404(await request.put(`/api/boards/${board.boardId}/custom-fields/${fieldId}/dropdown-items/missing`, { ...h, data: { name: 'A' } }), 'Dropdown item not found');
      expect(db.findOne('customFields', { _id: fieldId })).toEqual(before);
    } finally { db.deleteOne('customFields', { _id: fieldId }); }
  } finally { db.cleanup({ boardIds: [seeded.boardId] }); }
});

test('board members: an unknown user or non-member is 404, the last admin is 409', async ({ request, user, user2, board }) => {
  const h = { headers: headers(user.token) };
  const before = db.findOne('boards', { _id: board.boardId }).members;
  const remove = id => request.post(`/api/boards/${board.boardId}/members/${id}/remove`, { ...h, data: { action: 'remove' } });
  await expect404(await remove('no-such-user'), 'User not found');
  await expect404(await remove(user2.id), 'Member not found');
  const last = await remove(user.id);
  expect(last.status()).toBe(409);
  expect(db.findOne('boards', { _id: board.boardId }).members).toEqual(before);
  await expect404(await request.post(`/api/boards/${board.boardId}/members/no-such-user/add`, { ...h, data: { action: 'add' } }), 'User not found');
});

test('token deletion for a user that does not exist is 404', async ({ request }) => {
  const admin = db.seedUser({ isAdmin: true });
  try {
    await expect404(await request.post('/api/deletetoken', { headers: headers(admin.token), data: { userId: 'no-such-user' } }), 'User not found');
  } finally { db.cleanup({ userIds: [admin.id] }); }
});
