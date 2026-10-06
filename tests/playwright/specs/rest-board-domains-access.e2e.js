'use strict';
// GHSA-r3c4-5xwp-vf54, run against a real WeKan: the report's proof of concept
// expects an ordinary account to read a private board's domain sharing from
// GET /api/boards/:boardId/domains. The route is site-admin only
// (Authentication.checkUserId is the admin check), so the account is refused -
// as is a member of the board, who reads `domains` with the board itself.
// Needs WITH_API=true (the build.sh "Run tests" server sets it).
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');

const auth = token => ({ headers: { Authorization: `Bearer ${token}` } });
const DOMAIN = 'partner-ghsa-r3c4.example';

test('only a site admin reads a board\'s domain sharing through /domains', async ({ request, adminUser, user }) => {
  const board = db.seedBoard({ ownerId: adminUser.id, title: 'GHSA-r3c4 private board' });
  const member = db.seedUser();
  db.updateOne('boards', { _id: board.boardId }, {
    $set: { permission: 'private', domains: [{ domain: DOMAIN, isActive: true }] },
    $push: { members: { userId: member.id, isAdmin: false, isActive: true, isNoComments: false, isCommentOnly: false, isWorker: false } },
  });

  // The report's steps: an ordinary account, not on the board.
  const probe = await request.get(`/api/boards/${board.boardId}/domains`, auth(user.token));
  expect(probe.status()).toBe(403);
  expect(await probe.text()).not.toContain(DOMAIN);
  // A missing board answers the same, so this route reveals no board ids.
  expect((await request.get('/api/boards/no-such-board-ghsa-r3c4/domains', auth(user.token))).status()).toBe(403);

  // A member uses the board route, which checks board access and carries the list.
  expect((await request.get(`/api/boards/${board.boardId}/domains`, auth(member.token))).status()).toBe(403);
  const viaBoard = await request.get(`/api/boards/${board.boardId}`, auth(member.token));
  expect(viaBoard.status()).toBe(200);
  expect((await viaBoard.json()).domains).toEqual([{ domain: DOMAIN, isActive: true }]);

  const admin = await request.get(`/api/boards/${board.boardId}/domains`, auth(adminUser.token));
  expect(admin.status()).toBe(200);
  expect(await admin.json()).toEqual([{ domain: DOMAIN, isActive: true }]);
  expect((await request.get(`/api/boards/${board.boardId}/domains`)).status()).toBe(401);
});
