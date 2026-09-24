'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const BoardPage = require('../pages/BoardPage');
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

for (const action of ['accept', 'decline']) {
  test(`existing session can ${action} a sidebar invitation without an account block`, async ({ page, user2: user, board }) => {
    // The invitation belongs to a member, not the board's sole administrator.
    db.addBoardMember({ boardId: board.boardId, userId: user.id });
    db.updateOne('users', { _id: user.id }, {
      $addToSet: { 'profile.invitedBoards': board.boardId },
    });
    await page.goto(`${BASE_URL}/sign-in`);
    await waitForMeteor(page);
    await loginWithToken(page, user.id, user.token);
    await page.goto(`${BASE_URL}/b/${board.boardId}/${board.slug}`);
    await waitForMeteor(page);
    await new BoardPage(page).openSidebar();
    const invitation = page.locator(`.js-member-invite-${action}`);
    if (!await invitation.isVisible()) {
      await page.locator('.js-toggle-fold[data-fold="members"]').click();
    }
    await invitation.click();
    await expect.poll(() => db.findOne('users', { _id: user.id }).profile.invitedBoards || [])
      .not.toContain(board.boardId);
    const account = db.findOne('users', { _id: user.id });
    expect(account.loginDisabled).not.toBe(true);
    expect(account.services && account.services.securityBlock).toBeUndefined();
    expect(db.find('eventlog', { stream: 'security', bleed: 'InviteProfileBleed', userId: user.id })).toHaveLength(0);
    await expect.poll(() => {
      const member = db.getBoard(board.boardId).members.find(entry => entry.userId === user.id);
      return Boolean(member && member.isActive);
    }).toBe(action === 'accept');
  });
}
