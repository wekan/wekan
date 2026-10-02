'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, waitForMeteor } = require('../helpers/auth');
const BASE_URL = process.env.WEKAN_BASE_URL || 'http://localhost:3000';
test('comment-only source member cannot mint a linked write tunnel', async ({ page, user, board }) => {
  const original = db.getBoard(board.boardId);
  const source = db.find('cards', { boardId: board.boardId })[0];
  const destination = db.seedBoard({ ownerId: user.id, cardTitlesPerList: [['Destination']] });
  const card = db.find('cards', { boardId: destination.boardId })[0];
  db.updateOne('boards', { _id: board.boardId }, { $set: { members: original.members.map(member => member.userId === user.id ? { userId: user.id, isActive: true, isCommentOnly: true } : member) } });
  try {
    await page.goto(`${BASE_URL}/sign-in`);
    await waitForMeteor(page);
    await loginWithToken(page, user.id, user.token);
    const result = await page.evaluate(async ({ sourceId, target }) => {
      try { await window.Meteor.callAsync('createLinkedCard', sourceId, target.boardId, target.swimlaneId, target.listId, 0); return 'unexpected-success'; }
      catch (error) { return error.error; }
    }, { sourceId: source._id, target: card });
    expect(result).toBe('not-authorized');
    expect(db.find('cards', { boardId: destination.boardId, linkedId: source._id })).toHaveLength(0);
  } finally {
    db.updateOne('boards', { _id: board.boardId }, { $set: { members: original.members } });
    db.cleanup({ boardIds: [destination.boardId] });
  }
});

// LinkedWriteBleed, REST sibling: POST .../cards with linkedId checked only
// READ access to the source board and cloned the whole source card, so a
// read-only or assigned-only source member could link - and copy - cards the
// in-app Link popup refuses them. Both now use createLinkedCardFor.
test('REST linked-card creation follows the same source write rule (LinkedWriteBleed)', async ({ request, user, user2, board }) => {
  const source = db.find('cards', { boardId: board.boardId })[0];
  db.updateOne('cards', { _id: source._id }, { $set: { description: 'private source description' } });
  const own = db.seedBoard({ ownerId: user2.id, cardTitlesPerList: [['Mine']] });
  const original = db.getBoard(board.boardId).members;
  const asMember = flags => db.updateOne('boards', { _id: board.boardId },
    { $set: { members: [...original, { userId: user2.id, isActive: true, isAdmin: false, ...flags }] } });
  const link = () => request.post(`${BASE_URL}/api/boards/${own.boardId}/lists/${own.listIds[0]}/cards`, {
    headers: { Authorization: `Bearer ${user2.token}`, 'Content-Type': 'application/json' },
    data: { authorId: user2.id, swimlaneId: own.swimlaneId, linkedId: source._id },
  });
  try {
    for (const flags of [{ isReadOnly: true }, { isReadAssignedOnly: true }, { isNormalAssignedOnly: true }]) {
      asMember(flags);
      const res = await link();
      expect(res.status(), JSON.stringify(flags)).toBe(403);
      expect(db.find('cards', { boardId: own.boardId, linkedId: source._id })).toHaveLength(0);
    }
    await expect.poll(() => db.findOne('eventlog', { bleed: 'LinkedWriteBleed', source: 'rest:card-link' })?.count).toBeGreaterThan(0);
    // An assigned-only member may link a card assigned to them; a normal
    // member may link any card. The link holds the title, not a full copy.
    db.updateOne('cards', { _id: source._id }, { $set: { assignees: [user2.id] } });
    asMember({ isNormalAssignedOnly: true });
    expect((await link()).status()).toBe(200);
    asMember({});
    const res = await link();
    expect(res.status()).toBe(200);
    const linked = db.getCard((await res.json())._id);
    expect(linked).toMatchObject({ type: 'cardType-linkedCard', linkedId: source._id, boardId: own.boardId });
    expect(linked.description).toBeUndefined();
  } finally {
    db.updateOne('boards', { _id: board.boardId }, { $set: { members: original } });
    db.updateOne('cards', { _id: source._id }, { $unset: { description: 1, assignees: 1 } });
    db.cleanup({ boardIds: [own.boardId] });
  }
});
