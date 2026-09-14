'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, waitForMeteor } = require('../helpers/auth');
const BASE_URL = process.env.WEKAN_BASE_URL || 'http://localhost:3000';
test('removed member cannot forge an invitation and reactivate membership', async ({ page, user, board }) => {
  const original = db.getBoard(board.boardId);
  db.updateOne('boards', { _id: board.boardId }, { $set: {
    members: original.members.map(member => member.userId === user.id ? { ...member, isActive: false } : member),
  } });
  try {
    await page.goto(`${BASE_URL}/sign-in`);
    await waitForMeteor(page);
    await loginWithToken(page, user.id, user.token);
    const result = await page.evaluate(async ({ userId, boardId }) => {
      let errorCode;
      try {
        await window.Meteor.callAsync('/users/update', { _id: userId }, { $addToSet: { 'profile.invitedBoards': boardId } });
      } catch (error) { errorCode = error.error; }
      const accepted = await window.Meteor.callAsync('acceptInvite', boardId);
      return { errorCode, accepted };
    }, { userId: user.id, boardId: board.boardId });
    expect(result.errorCode).toBe(403);
    expect(result.accepted).toBe(false);
    expect(db.getBoard(board.boardId).members.find(member => member.userId === user.id).isActive).toBe(false);
  } finally {
    db.updateOne('boards', { _id: board.boardId }, { $set: { members: original.members } });
  }
});
