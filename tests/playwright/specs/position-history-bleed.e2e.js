'use strict';
// PositionHistoryBleed sibling (2026-10-02): a member could insert a forged
// position-history entry naming another board's card, then undo it to pull
// the card into their own board. Clients may not insert history any more, and
// undo/redo act only within the entry's boards with write access.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, openBoard } = require('../helpers/auth');

test('a forged history entry cannot pull another board\'s card in', async ({ page, user, user2, board }) => {
  const victim = db.seedBoard({ ownerId: user2.id, cardTitlesPerList: [['Victim card']] });
  const victimCard = db.find('cards', { boardId: victim.boardId })[0];
  const forged = { userId: user.id, boardId: board.boardId, entityType: 'card', entityId: victimCard._id,
    actionType: 'move', previousBoardId: board.boardId, previousListId: board.listIds[0], previousSwimlaneId: board.swimlaneId };
  const plantedId = `forged${Date.now()}`;
  try {
    await loginWithToken(page, user.id, user.token);
    await openBoard(page, board.boardId, board.slug);
    const inserted = await page.evaluate(async doc => {
      try { await Meteor.callAsync('/userPositionHistory/insert', doc); return 'inserted'; } catch (e) { return 'denied'; }
    }, { ...forged, createdAt: new Date() });
    expect(inserted).toBe('denied');
    // An entry that exists anyway (written before the fix) does not act on a
    // card outside its boards either.
    db.insertOne('userPositionHistory', { _id: plantedId, ...forged, createdAt: new Date() });
    await page.evaluate(async boardId => { try { await Meteor.callAsync('userPositionHistory.undoLast', boardId); } catch (e) { /* refused */ } }, board.boardId);
    const after = db.findOne('cards', { _id: victimCard._id });
    expect(after.boardId).toBe(victim.boardId);
    expect(after.listId).toBe(victimCard.listId);
  } finally {
    db.deleteMany('userPositionHistory', { _id: plantedId });
    db.cleanup({ boardIds: [victim.boardId] });
    db.updateOne('users', { _id: user.id }, { $unset: { loginDisabled: 1 } });
  }
});
