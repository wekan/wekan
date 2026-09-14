'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, waitForMeteor } = require('../helpers/auth');
const BASE_URL = process.env.WEKAN_BASE_URL || 'http://localhost:3000';
test('comment-only member cannot move or archive a list through DDP', async ({ page, user, board }) => {
  const original = db.getBoard(board.boardId);
  const list = db.find('lists', { boardId: board.boardId })[0];
  const members = original.members.map(member => member.userId === user.id
    ? { userId: user.id, isActive: true, isCommentOnly: true } : member);
  db.updateOne('boards', { _id: board.boardId }, { $set: { members } });
  try {
    await page.goto(`${BASE_URL}/sign-in`);
    await waitForMeteor(page);
    await loginWithToken(page, user.id, user.token);
    const result = await page.evaluate(async ({ listId, boardId }) => {
      try {
        await window.Meteor.callAsync('moveList', listId, boardId, '', null, null, null);
        return 'unexpected-success';
      } catch (error) { return error.error; }
    }, { listId: list._id, boardId: board.boardId });
    expect(result).toBe('not-authorized');
    const current = db.findOne('lists', { _id: list._id });
    expect(current.archived).toBe(list.archived);
    expect(current.boardId).toBe(list.boardId);
    expect(db.find('cards', { listId: list._id }).map(card => card.boardId))
      .toEqual(db.find('cards', { listId: list._id }).map(() => board.boardId));
  } finally {
    db.updateOne('boards', { _id: board.boardId }, { $set: { members: original.members } });
  }
});
