'use strict';
// HookUrlBleed (2026-10-02): the board publication sent every integration's
// URL - a chat webhook's secret - to everyone who could read the board. Only
// the board's admins receive it now.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, openBoard } = require('../helpers/auth');

const SECRET_URL = 'https://hooks.example/services/T000/B000/secretPathToken';
const published = page => page.evaluate(() => (Meteor.connection._stores.integrations?._getCollection?.().find().fetch() || [])
  .map(({ _id, url, boardId }) => ({ _id, url, boardId })));

test('a member who is not a board admin is not sent the webhook URL', async ({ page, user, user2, board }) => {
  const hookId = `hookurl${Date.now()}`;
  db.insertOne('integrations', { _id: hookId, boardId: board.boardId, url: SECRET_URL, type: 'outgoing-webhooks',
    enabled: true, activities: ['all'], userId: user.id, createdAt: new Date() });
  db.addBoardMember({ boardId: board.boardId, userId: user2.id, isAdmin: false });
  try {
    await loginWithToken(page, user2.id, user2.token);
    await openBoard(page, board.boardId, board.slug);
    await expect.poll(async () => (await published(page)).find(row => row._id === hookId)?.boardId).toBe(board.boardId);
    expect((await published(page)).find(row => row._id === hookId).url).toBeUndefined();
    // The board's admin still manages it (negative).
    await loginWithToken(page, user.id, user.token);
    await openBoard(page, board.boardId, board.slug);
    await expect.poll(async () => (await published(page)).find(row => row._id === hookId)?.url).toBe(SECRET_URL);
  } finally {
    db.deleteMany('integrations', { _id: hookId });
  }
});
