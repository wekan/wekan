'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, openBoard } = require('../helpers/auth');

test('ownership transfer leaves ordinary memberships unchanged and transfers administered boards', async ({ page, request, adminUser, user, user2 }) => {
  const owned = db.seedBoard({ ownerId: user.id, title: 'Owned board' });
  const ordinary = db.seedBoard({ ownerId: user2.id, title: 'Ordinary membership', cardTitlesPerList: [['Retained card']] });
  const absent = db.seedBoard({ ownerId: user2.id, title: 'Unrelated board' });
  db.addBoardMember({ boardId: ordinary.boardId, userId: user.id });
  db.addBoardMember({ boardId: ordinary.boardId, userId: adminUser.id });
  const ordinaryBefore = db.findOne('boards', { _id: ordinary.boardId });
  const absentBefore = db.findOne('boards', { _id: absent.boardId });
  try {
    await loginWithToken(page, user.id, user.token);
    await openBoard(page, ordinary.boardId, ordinary.slug);
    await expect(page.locator('.minicard-title').filter({ hasText: 'Retained card' })).toBeVisible();
    const response = await request.put(`/api/users/${user.id}`, {
      headers: { Authorization: `Bearer ${adminUser.token}` }, data: { action: 'takeOwnership' },
    });
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual([{ _id: owned.boardId, title: 'Owned board' }]);
    await expect.poll(() => db.findOne('boards', { _id: owned.boardId }).members.some(m => m.userId === adminUser.id && m.isAdmin)).toBe(true);
    expect(db.findOne('boards', { _id: owned.boardId }).members.some(m => m.userId === user.id)).toBe(false);
    expect(db.findOne('boards', { _id: ordinary.boardId })).toEqual(ordinaryBefore);
    expect(db.findOne('boards', { _id: absent.boardId })).toEqual(absentBefore);
    const repeated = await request.put(`/api/users/${user.id}`, {
      headers: { Authorization: `Bearer ${adminUser.token}` }, data: { action: 'takeOwnership' },
    });
    expect(repeated.status()).toBe(200);
    expect(await repeated.json()).toEqual([]);
    expect(db.findOne('boards', { _id: ordinary.boardId })).toEqual(ordinaryBefore);
    await page.reload();
    await expect(page.locator('.minicard-title').filter({ hasText: 'Retained card' })).toBeVisible();
  } finally {
    db.cleanup({ boardIds: [owned.boardId, ordinary.boardId, absent.boardId] });
  }
});

test('ordinary users cannot request ownership transfer', async ({ request, user, user2, board }) => {
  const before = db.findOne('boards', { _id: board.boardId });
  for (const headers of [{}, { Authorization: `Bearer ${user2.token}` }]) {
    const response = await request.put(`/api/users/${user.id}`, { headers, data: { action: 'takeOwnership' } });
    expect([401, 403]).toContain(response.status());
    expect(db.findOne('boards', { _id: board.boardId })).toEqual(before);
  }
});
