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
test('REST linked-card creation follows the same source write rule (LinkedWriteBleed)', async ({ request, board }) => {
  const source = db.find('cards', { boardId: board.boardId })[0];
  db.updateOne('cards', { _id: source._id }, { $set: { description: 'private source description' } });
  const original = db.getBoard(board.boardId).members;
  // A fresh account per attempt, so each attempt is judged on its own role.
  // (This spec used to expect a refused attempt to DISABLE the account. Since
  // #6798 authz.linked-write is blocksAccount: false - the same refusal fires
  // for a read-only/comment-only/Worker member editing their own board's card
  // from a stale screen, and it disabled four accounts on one instance. The
  // link is still refused (403) and still recorded in Admin Panel -> Problems,
  // which is what this spec now pins; the account stays usable.)
  const attempt = async (flags, assignees) => {
    const member = db.seedUser();
    member.token = db.addResumeToken(member.id);
    const own = db.seedBoard({ ownerId: member.id, cardTitlesPerList: [['Mine']] });
    db.updateOne('boards', { _id: board.boardId },
      { $set: { members: [...original, { userId: member.id, isActive: true, isAdmin: false, ...flags }] } });
    db.updateOne('cards', { _id: source._id }, assignees ? { $set: { assignees: [member.id] } } : { $unset: { assignees: 1 } });
    const res = await request.post(`${BASE_URL}/api/boards/${own.boardId}/lists/${own.listIds[0]}/cards`, {
      headers: { Authorization: `Bearer ${member.token}`, 'Content-Type': 'application/json' },
      data: { authorId: member.id, swimlaneId: own.swimlaneId, linkedId: source._id },
    });
    return { member, own, res };
  };
  const made = [];
  // The Problems row is ONE summary per kind of event, kept across runs, so
  // count from where it stands now.
  const recorded = () => db.findOne('eventlog', { bleed: 'LinkedWriteBleed', source: 'rest:card-link' })?.count || 0;
  const before = recorded();
  try {
    for (const flags of [{ isReadOnly: true }, { isReadAssignedOnly: true }, { isNormalAssignedOnly: true }]) {
      const { member, own, res } = await attempt(flags, false);
      made.push({ member, own });
      expect(res.status(), JSON.stringify(flags)).toBe(403);
      expect(db.find('cards', { boardId: own.boardId, linkedId: source._id })).toHaveLength(0);
      // Recorded (the Problems row accumulates one count per refusal) ...
      await expect.poll(recorded).toBeGreaterThanOrEqual(before + made.length);
      // ... but, by the #6798 decision, never a disabled account.
      expect(db.findOne('users', { _id: member.id }).loginDisabled).not.toBe(true);
    }
    // An assigned-only member may link a card assigned to them; a normal
    // member may link any card. The link holds the title, not a full copy.
    const assigned = await attempt({ isNormalAssignedOnly: true }, true);
    made.push(assigned);
    expect(assigned.res.status()).toBe(200);
    const normal = await attempt({}, false);
    made.push(normal);
    expect(normal.res.status()).toBe(200);
    const linked = db.getCard((await normal.res.json())._id);
    expect(linked).toMatchObject({ type: 'cardType-linkedCard', linkedId: source._id, boardId: normal.own.boardId });
    expect(linked.description || '').not.toContain('private source description');
  } finally {
    db.updateOne('boards', { _id: board.boardId }, { $set: { members: original } });
    db.updateOne('cards', { _id: source._id }, { $unset: { description: 1, assignees: 1 } });
    db.cleanup({ boardIds: made.map(m => m.own.boardId), userIds: made.map(m => m.member.id) });
  }
});
