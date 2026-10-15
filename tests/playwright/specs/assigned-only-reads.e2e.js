'use strict';
// AssignedBleed read siblings (2026-10-02): the attachment API listed and
// served every attachment of a board to an assigned-only member, who may see
// only the cards assigned to them.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');

const auth = token => ({ Authorization: `Bearer ${token}` });

test('an assigned-only member reads only their own cards\' attachments over REST', async ({ request, user, user2, board }) => {
  const cards = db.find('cards', { boardId: board.boardId });
  const [hidden, assigned] = cards;
  const ids = { hidden: `aoHidden${Date.now()}`, mine: `aoMine${Date.now()}` };
  for (const [id, card] of [[ids.hidden, hidden], [ids.mine, assigned]]) {
    db.insertOne('attachments', { _id: id, name: `${id}.txt`, size: 1, type: 'text/plain', userId: user.id,
      meta: { boardId: board.boardId, cardId: card._id, listId: card.listId, swimlaneId: card.swimlaneId },
      versions: { original: { path: `/nonexistent/${id}`, name: `${id}.txt`, size: 1, type: 'text/plain', storage: 'fs' } } });
  }
  db.updateOne('cards', { _id: assigned._id }, { $set: { assignees: [user2.id] } });
  const original = db.getBoard(board.boardId).members;
  db.updateOne('boards', { _id: board.boardId }, { $set: { members: [...original,
    { userId: user2.id, isActive: true, isAdmin: false, isNormalAssignedOnly: true }] } });
  try {
    const list = await (await request.get(`/api/attachment/list/${board.boardId}`, { headers: auth(user2.token) })).json();
    expect(list.attachments.map(a => a.attachmentId)).toEqual([ids.mine]);
    // The board-wide REST read refuses an assigned-only member outright.
    const legacy = await request.get(`/api/boards/${board.boardId}/attachments`, { headers: auth(user2.token) });
    expect(legacy.status()).toBe(403);
    expect(await legacy.text()).not.toContain(ids.hidden);
    const info = await request.get(`/api/attachment/info/${ids.hidden}`, { headers: auth(user2.token) });
    expect(info.status()).toBe(403);
    await expect.poll(() => db.findOne('eventlog', { bleed: 'AssignedBleed', source: 'attachment-api:read' })?.count).toBeGreaterThan(0);
    // Medium severity: the attempt never disables the member.
    expect(db.findOne('users', { _id: user2.id }).loginDisabled).toBeFalsy();
    // The board's owner still sees both (negative).
    const all = await (await request.get(`/api/attachment/list/${board.boardId}`, { headers: auth(user.token) })).json();
    expect(all.attachments.map(a => a.attachmentId).sort()).toEqual([ids.hidden, ids.mine].sort());
  } finally {
    db.updateOne('boards', { _id: board.boardId }, { $set: { members: original } });
    db.deleteMany('attachments', { _id: { $in: Object.values(ids) } });
  }
});

// GHSA-3cgr-47wm-9cc9 (2026-10-15): the same member got other cards' files
// from the file server's downloads, and their extracted text from the
// document search, both of which asked only for board membership.
test('an assigned-only member gets neither the file nor the text of a card not assigned to them', async ({ page, request, user, user2, board }) => {
  const { loginWithToken } = require('../helpers/auth');
  const cards = db.find('cards', { boardId: board.boardId });
  const [hidden, assigned] = cards;
  const stamp = Date.now();
  const ids = { hidden: `aoFileHidden${stamp}`, mine: `aoFileMine${stamp}` };
  const word = `secretword${stamp}`;
  for (const [id, card] of [[ids.hidden, hidden], [ids.mine, assigned]]) {
    db.insertOne('attachments', { _id: id, name: `${id}.pdf`, size: 1, type: 'application/pdf', userId: user.id,
      meta: { boardId: board.boardId, cardId: card._id, listId: card.listId, swimlaneId: card.swimlaneId },
      versions: { original: { path: `/nonexistent/${id}`, name: `${id}.pdf`, size: 1, type: 'application/pdf', storage: 'fs' } } });
    db.insertOne('documentPreviews', { _id: `dp${id}`, attachmentId: id, boardId: board.boardId, cardId: card._id,
      searchText: `${word} in ${id}` });
  }
  db.updateOne('cards', { _id: assigned._id }, { $set: { assignees: [user2.id] } });
  const original = db.getBoard(board.boardId).members;
  db.updateOne('boards', { _id: board.boardId }, { $set: { members: [...original,
    { userId: user2.id, isActive: true, isAdmin: false, isReadAssignedOnly: true }] } });
  try {
    // Both download routes refuse the hidden card's file...
    for (const route of ['/cdn/storage/attachments', '/cfs/files/attachments']) {
      const res = await request.get(`${route}/${ids.hidden}`, { headers: auth(user2.token) });
      expect(res.status(), route).toBe(403);
      // ...and do not refuse the member's own (missing on disk, so not 200 here).
      const mine = await request.get(`${route}/${ids.mine}`, { headers: auth(user2.token) });
      expect(mine.status(), route).not.toBe(403);
    }
    await expect.poll(() => db.findOne('eventlog', { bleed: 'AssignedBleed', source: 'file-server:cdn' })?.count).toBeGreaterThan(0);
    // The document search finds only the member's own card.
    await loginWithToken(page, user2.id, user2.token);
    const rows = await page.evaluate(({ boardId, word }) => Meteor.callAsync('searchAttachmentDocumentText', boardId, word),
      { boardId: board.boardId, word });
    expect(rows.map(r => r.attachmentId)).toEqual([ids.mine]);
    expect(JSON.stringify(rows)).not.toContain(ids.hidden);
    // The board's owner still finds and downloads both (negative).
    const owner = await request.get(`/cdn/storage/attachments/${ids.hidden}`, { headers: auth(user.token) });
    expect(owner.status()).not.toBe(403);
    expect(db.findOne('users', { _id: user2.id }).loginDisabled).toBeFalsy();
  } finally {
    db.updateOne('boards', { _id: board.boardId }, { $set: { members: original } });
    db.deleteMany('attachments', { _id: { $in: Object.values(ids) } });
    db.deleteMany('documentPreviews', { attachmentId: { $in: Object.values(ids) } });
  }
});
