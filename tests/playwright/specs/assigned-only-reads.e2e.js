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
