import { Meteor } from 'meteor/meteor';
import Boards from '/models/boards';
import Users from '/models/users';
import { ReactiveCache } from '/imports/reactiveCache';
import { tripCanary } from '/server/lib/canary';

function refuseBoardListWrite(userId, detail) {
  tripCanary('board-list.cross-scope', { userId, detail });
  throw new Meteor.Error('not-authorized');
}

async function visibleBoardAndUser(userId, boardId) {
  if (!userId) throw new Meteor.Error('not-logged-in', 'User must be logged in');
  const [user, board] = await Promise.all([
    Users.findOneAsync(userId), Boards.findOneAsync(String(boardId || '')),
  ]);
  if (!user) throw new Meteor.Error('user-not-found', 'User not found');
  if (!board || !board.isVisibleBy(user)) {
    refuseBoardListWrite(userId, 'All Boards action targeted a board the user cannot see');
  }
  return { user, board };
}

async function toggleAccessibleBoardStar(userId, boardId) {
  const { user } = await visibleBoardAndUser(userId, boardId);
  const starredBoards = user.profile?.starredBoards || [];
  await Users.updateAsync(userId, starredBoards.includes(boardId)
    ? { $pull: { 'profile.starredBoards': boardId } }
    : { $addToSet: { 'profile.starredBoards': boardId } });
  return true;
}

async function toggleAccessibleDefaultBoard(userId, boardId) {
  const { user, board } = await visibleBoardAndUser(userId, boardId);
  if (board.archived === true || board.type !== 'board') {
    throw new Meteor.Error('invalid-default-board');
  }
  const isDefault = user.profile?.defaultBoardId === boardId;
  await Users.updateAsync(userId, isDefault
    ? { $unset: { 'profile.defaultBoardId': '' } }
    : { $set: { 'profile.defaultBoardId': boardId } });
  return true;
}

async function setAccessibleBoardArchived(userId, boardId, archived) {
  if (!userId) throw new Meteor.Error('not-logged-in', 'User must be logged in');
  const [board, user] = await Promise.all([
    ReactiveCache.getBoard(String(boardId || '')), ReactiveCache.getUser(userId),
  ]);
  if (!board) throw new Meteor.Error('error-board-doesNotExist');
  if (!board.hasAdmin(userId) && !user?.isAdmin) {
    tripCanary('board-list.cross-scope', {
      userId, detail: 'All Boards archive action targeted a board without admin access',
    });
    throw new Meteor.Error('error-board-notAdmin');
  }
  if (archived) await board.archive();
  else await board.restore();
  return true;
}

export {
  setAccessibleBoardArchived,
  toggleAccessibleBoardStar,
  toggleAccessibleDefaultBoard,
};
