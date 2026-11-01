'use strict';
// UnassignedAttachBleed (GHSA-w26g-rc43-q6cm, 2026-11-01): an assigned-only
// member kept the card and attachment ids they had seen while assigned, and
// after the assignment was removed still uploaded a file to that card and
// soft-deleted its existing one through the REST attachment API.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken } = require('../helpers/auth');

const auth = token => ({ Authorization: `Bearer ${token}` });

test('an unassigned assigned-only member can no longer upload to or delete from the card', async ({ page, request, user, user2, board }) => {
  const [card] = db.find('cards', { boardId: board.boardId });
  const existing = `uabExisting${Date.now()}`;
  db.insertOne('attachments', { _id: existing, name: `${existing}.txt`, size: 16, type: 'text/plain', userId: user.id,
    meta: { boardId: board.boardId, cardId: card._id, listId: card.listId, swimlaneId: card.swimlaneId },
    versions: { original: { path: `/nonexistent/${existing}`, name: `${existing}.txt`, size: 16, type: 'text/plain', storage: 'fs' } } });
  const original = db.getBoard(board.boardId).members;
  db.updateOne('boards', { _id: board.boardId }, { $set: { members: [...original,
    { userId: user2.id, isActive: true, isAdmin: false, isNormalAssignedOnly: true }] } });
  const uploadUrl = name => `/api/attachment/upload?boardId=${board.boardId}&swimlaneId=${card.swimlaneId}` +
    `&listId=${card.listId}&cardId=${card._id}&fileName=${name}&fileType=text/plain`;
  const uploaded = [];
  try {
    // While assigned, the member uploads to the card (positive).
    db.updateOne('cards', { _id: card._id }, { $set: { assignees: [user2.id] } });
    const allowed = await request.post(uploadUrl('assigned.txt'), {
      headers: { ...auth(user2.token), 'Content-Type': 'text/plain' }, data: 'synthetic file 1' });
    expect(allowed.status()).toBe(200);
    uploaded.push((await allowed.json()).attachmentId);

    // The owner removes the assignment; the member kept the ids.
    db.updateOne('cards', { _id: card._id }, { $set: { assignees: [] } });
    const before = db.find('attachments', { 'meta.cardId': card._id, deletedAt: { $exists: false } }).length;

    const upload = await request.post(uploadUrl('synthetic.txt'), {
      headers: { ...auth(user2.token), 'Content-Type': 'text/plain' }, data: 'synthetic file 22' });
    expect(upload.status()).toBe(403);
    const del = await request.delete(`/api/attachment/delete/${existing}`, { headers: auth(user2.token) });
    expect(del.status()).toBe(403);
    expect(db.findOne('attachments', { _id: existing }).deletedAt).toBeFalsy();
    expect(db.find('attachments', { 'meta.cardId': card._id, deletedAt: { $exists: false } }).length).toBe(before);

    // The DDP twin of the delete refuses too.
    await loginWithToken(page, user2.id, user2.token);
    const ddp = await page.evaluate(id => Meteor.callAsync('api.attachment.delete', id).then(() => 'ok', e => e.error), existing);
    expect(ddp).toBe('not-authorized');
    expect(db.findOne('attachments', { _id: existing }).deletedAt).toBeFalsy();

    // The attempts are in Admin Panel -> Problems, and never disable (medium).
    await expect.poll(() => db.findOne('eventlog', { bleed: 'UnassignedAttachBleed', source: 'attachment-api:delete' })?.count).toBeGreaterThan(0);
    await expect.poll(() => db.findOne('eventlog', { bleed: 'UnassignedAttachBleed', source: 'attachment-api:upload' })?.count).toBeGreaterThan(0);
    expect(db.findOne('users', { _id: user2.id }).loginDisabled).toBeFalsy();

    // Negative: the board's owner still deletes the file on that card.
    const owner = await request.delete(`/api/attachment/delete/${existing}`, { headers: auth(user.token) });
    expect(owner.status()).toBe(200);
    await expect.poll(() => !!db.findOne('attachments', { _id: existing }).deletedAt).toBe(true);
  } finally {
    db.updateOne('boards', { _id: board.boardId }, { $set: { members: original } });
    db.deleteMany('attachments', { _id: { $in: [existing, ...uploaded] } });
  }
});
