'use strict';
// ListLockAttachBleed (a sibling of ListLockBleed, GHSA-4734-8vrg-8j3w): a
// list whose exception refuses a role write (#4527) refuses that role's
// attachment upload, delete, copy and move through the attachment API too,
// over REST and DDP, and the attempt is in Admin Panel -> Problems. A list
// without the refusal still takes the same writes, and the board admin, whom
// no list exception binds, writes in the locked one.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken } = require('../helpers/auth');

const auth = token => ({ Authorization: `Bearer ${token}` });

test('a list refusing a role write refuses its attachment API writes (ListLockAttachBleed)', async ({ page, request, board, user, user2 }) => {
  const original = db.getBoard(board.boardId).members;
  const [lockedListId, openListId] = board.listIds;
  const card = id => db.find('cards', { boardId: board.boardId, listId: id })[0];
  const locked = card(lockedListId), open = card(openListId);
  const file = (id, c) => ({ _id: id, name: `${id}.txt`, size: 16, type: 'text/plain', userId: user.id,
    meta: { boardId: board.boardId, cardId: c._id, listId: c.listId, swimlaneId: c.swimlaneId },
    versions: { original: { path: `/nonexistent/${id}`, name: `${id}.txt`, size: 16, type: 'text/plain', storage: 'fs' } } });
  const inLocked = `llaLocked${Date.now()}`, inOpen = `llaOpen${Date.now()}`;
  db.insertOne('attachments', file(inLocked, locked));
  db.insertOne('attachments', file(inOpen, open));
  const uploadUrl = (c, name) => `/api/attachment/upload?boardId=${board.boardId}&swimlaneId=${c.swimlaneId}` +
    `&listId=${c.listId}&cardId=${c._id}&fileName=${name}&fileType=text/plain`;
  const target = c => ({ targetBoardId: board.boardId, targetSwimlaneId: c.swimlaneId, targetListId: c.listId, targetCardId: c._id });
  const json = (token, data) => ({ headers: { ...auth(token), 'Content-Type': 'application/json' }, data });
  const live = c => db.find('attachments', { 'meta.cardId': c._id, deletedAt: { $exists: false } }).map(a => a._id).sort();
  const recorded = source => db.findOne('eventlog', { bleed: 'ListLockAttachBleed', source })?.count || 0;
  const uploaded = [];
  db.updateOne('boards', { _id: board.boardId }, { $set: { members: [...original.filter(m => m.userId !== user2.id),
    { userId: user2.id, isActive: true, isAdmin: false }] } });
  db.updateOne('lists', { _id: lockedListId }, { $set: { roleExceptions: { normal: { write: false } } } });
  try {
    const before = live(locked);
    // The reporter's two routes, then copy and move onto and off the locked card.
    const up = await request.post(uploadUrl(locked, 'locked.txt'), {
      headers: { ...auth(user2.token), 'Content-Type': 'text/plain' }, data: 'synthetic file 1' });
    expect(up.status(), 'upload').toBe(403);
    expect((await request.delete(`/api/attachment/delete/${inLocked}`, { headers: auth(user2.token) })).status(), 'delete').toBe(403);
    expect((await request.post('/api/attachment/copy', json(user2.token, { attachmentId: inOpen, ...target(locked) }))).status(), 'copy onto').toBe(403);
    expect((await request.post('/api/attachment/move', json(user2.token, { attachmentId: inOpen, ...target(locked) }))).status(), 'move onto').toBe(403);
    expect((await request.post('/api/attachment/move', json(user2.token, { attachmentId: inLocked, ...target(open) }))).status(), 'move off').toBe(403);
    expect(live(locked)).toEqual(before);
    expect(db.findOne('attachments', { _id: inLocked }).meta.cardId).toBe(locked._id);
    expect(db.findOne('attachments', { _id: inOpen }).meta.cardId).toBe(open._id);

    // The DDP twins refuse too.
    await loginWithToken(page, user2.id, user2.token);
    const ddp = await page.evaluate(id => Meteor.callAsync('api.attachment.delete', id).then(() => 'ok', e => e.error), inLocked);
    expect(ddp).toBe('not-authorized');
    expect(db.findOne('attachments', { _id: inLocked }).deletedAt).toBeFalsy();

    // In Admin Panel -> Problems, never disabling the account (medium).
    for (const source of ['attachment-api:upload', 'attachment-api:delete', 'attachment-api:copy', 'attachment-api:move', 'attachment-method:delete']) {
      await expect.poll(() => recorded(source), source).toBeGreaterThan(0);
    }
    expect(db.findOne('users', { _id: user2.id }).loginDisabled || false).toBe(false);

    // Negative: the same member uploads to and deletes from the open list's card.
    const openUp = await request.post(uploadUrl(open, 'open.txt'), {
      headers: { ...auth(user2.token), 'Content-Type': 'text/plain' }, data: 'synthetic file 2' });
    expect(openUp.status()).toBe(200);
    const openId = (await openUp.json()).attachmentId;
    uploaded.push(openId);
    expect((await request.delete(`/api/attachment/delete/${openId}`, { headers: auth(user2.token) })).status()).toBe(200);
    // And the board admin deletes the locked list's file.
    expect((await request.delete(`/api/attachment/delete/${inLocked}`, { headers: auth(user.token) })).status()).toBe(200);
    await expect.poll(() => !!db.findOne('attachments', { _id: inLocked }).deletedAt).toBe(true);
  } finally {
    db.updateOne('boards', { _id: board.boardId }, { $set: { members: original } });
    db.updateOne('lists', { _id: lockedListId }, { $unset: { roleExceptions: '' } });
    db.deleteMany('attachments', { _id: { $in: [inLocked, inOpen, ...uploaded] } });
  }
});
