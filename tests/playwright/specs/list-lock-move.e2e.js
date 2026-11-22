'use strict';
// ListLockMoveBleed (GHSA-394w-8q99-q4qx): a list whose exception refuses a
// role write (#4527) refuses that role's REST move of a swimlane holding its
// cards, as the swimlane delete and the moveSwimlane method already did. The
// move used to carry the locked list's cards to lists on another board with no
// exceptions. The attempt is in Admin Panel -> Problems. A swimlane with no
// refusing list still moves for the same member, with 200 rather than the 500
// the card move's Meteor.userId() used to throw outside a method.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');

const json = (token, data) => ({ headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, data });

// Board A (the fixture) and board B, both owned by `user`, with `user2` a
// normal member of each - the reporter's setup.
function twoBoards(board, user, user2) {
  const other = db.seedBoard({ ownerId: user.id, cardTitlesPerList: [['Delta Card']] });
  db.addBoardMember({ boardId: board.boardId, userId: user2.id });
  db.addBoardMember({ boardId: other.boardId, userId: user2.id });
  return other;
}

test('a list refusing a role write refuses the REST move of its swimlane (ListLockMoveBleed)', async ({ request, board, user, user2 }) => {
  const other = twoBoards(board, user, user2);
  try {
    const [lockedListId] = board.listIds;
    db.updateOne('lists', { _id: lockedListId }, { $set: { roleExceptions: { normal: { write: false } } } });
    const cardIds = db.find('cards', { boardId: board.boardId }).map(c => c._id);
    expect(cardIds.length).toBe(3);
    const route = `/api/boards/${board.boardId}/swimlanes/${board.swimlaneId}/move`;

    // The PoC: the move to board B is refused, and nothing moved.
    const res = await request.post(route, json(user2.token, { toBoardId: other.boardId }));
    expect(res.status(), 'swimlane move').toBe(403);
    expect(db.findOne('swimlanes', { _id: board.swimlaneId }).boardId).toBe(board.boardId);
    for (const id of cardIds) {
      expect(db.findOne('cards', { _id: id }).boardId, `card ${id}`).toBe(board.boardId);
    }
    expect(db.find('cards', { boardId: other.boardId }).length, 'board B keeps only its own card').toBe(1);
    await expect.poll(() => db.findOne('eventlog', { bleed: 'ListLockMoveBleed', source: 'rest:swimlane-move' })?.count || 0)
      .toBeGreaterThan(0);
    // Medium: recorded, never disables the account.
    expect(db.findOne('users', { _id: user2.id }).loginDisabled || false).toBe(false);

    // Negative: the board admin, whom no list exception binds, moves it.
    const admin = await request.post(route, json(user.token, { toBoardId: other.boardId }));
    expect(admin.status(), 'board admin move').toBe(200);
    expect(db.findOne('swimlanes', { _id: board.swimlaneId }).boardId).toBe(other.boardId);
  } finally {
    db.cleanup({ boardIds: [other.boardId] });
  }
});

test('negative: the same member moves a swimlane with no refusing list, with 200 and every card', async ({ request, board, user, user2 }) => {
  const other = twoBoards(board, user, user2);
  try {
    const cardIds = db.find('cards', { boardId: board.boardId }).map(c => c._id);
    expect(cardIds.length).toBe(3);
    const recorded = () => db.findOne('eventlog', { bleed: 'ListLockMoveBleed' })?.count || 0;
    const recordedBefore = recorded();
    const res = await request.post(`/api/boards/${board.boardId}/swimlanes/${board.swimlaneId}/move`,
      json(user2.token, { toBoardId: other.boardId }));
    // Before the fix in models/cards.js this was a 500 after the first card.
    expect(res.status(), 'unrestricted swimlane move').toBe(200);
    expect((await res.json())._id).toBe(board.swimlaneId);
    expect(db.findOne('swimlanes', { _id: board.swimlaneId }).boardId).toBe(other.boardId);
    for (const id of cardIds) {
      expect(db.findOne('cards', { _id: id }).boardId, `card ${id}`).toBe(other.boardId);
    }
    // An allowed move is ordinary use and records nothing in Problems.
    expect(recorded(), 'no ListLockMoveBleed record for an allowed move').toBe(recordedBefore);
  } finally {
    db.cleanup({ boardIds: [other.boardId] });
  }
});
