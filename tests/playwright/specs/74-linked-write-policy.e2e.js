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
