'use strict';
// #3136: inviting an existing user puts the board-membership activity in their
// notification bell. It used to call notify() with a params object that was
// out of scope, so nothing was ever delivered.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');

const invite = (page, username, boardId) =>
  page.evaluate(({ username, boardId }) => Meteor.callAsync('inviteUserToBoard', username, boardId), { username, boardId });
const bell = userId => (db.findOne('users', { _id: userId }).profile?.notifications || []).map(n => n.activity);
const memberActivities = (boardId, memberId) =>
  db.find('activities', { boardId, memberId, activityType: 'addBoardMember' });

test('an invited existing user gets the membership activity in the bell', async ({ boardPage: page, board, user, user2 }) => {
  await invite(page, user2.username, board.boardId);
  await expect.poll(() => bell(user2.id).length).toBe(1);
  const [activityId] = bell(user2.id);
  const activity = db.findOne('activities', { _id: activityId });
  expect(activity).toMatchObject({ activityType: 'addBoardMember', boardId: board.boardId, memberId: user2.id, userId: user.id });

  // Negative: inviting somebody who is already an active member adds nobody,
  // so there is no second activity and no second bell entry.
  await invite(page, user2.username, board.boardId);
  expect(memberActivities(board.boardId, user2.id)).toHaveLength(1);
  expect(bell(user2.id)).toEqual([activityId]);

  // Re-inviting a removed member records and delivers a new activity.
  const index = db.findOne('boards', { _id: board.boardId }).members.findIndex(m => m.userId === user2.id);
  db.updateOne('boards', { _id: board.boardId }, { $set: { [`members.${index}.isActive`]: false } });
  await invite(page, user2.username, board.boardId);
  await expect.poll(() => bell(user2.id).length).toBe(2);
  expect(memberActivities(board.boardId, user2.id)).toHaveLength(2);
});

test('an invitee who turned the bell off gets no entry', async ({ boardPage: page, board, user2 }) => {
  db.updateOne('users', { _id: user2.id }, { $set: { 'profile.notifyOverrideTray': false } });
  await invite(page, user2.username, board.boardId);
  // The membership itself is recorded; only the bell is skipped.
  await expect.poll(() => memberActivities(board.boardId, user2.id).length).toBe(1);
  expect(bell(user2.id)).toEqual([]);
});
