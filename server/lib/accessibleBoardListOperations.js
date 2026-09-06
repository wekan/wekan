import { Meteor } from 'meteor/meteor';
import Boards from '/models/boards';
import Users from '/models/users';
import Swimlanes from '/models/swimlanes';
import TableVisibilityModeSettings from '/models/tableVisibilityModeSettings';
import { ReactiveCache } from '/imports/reactiveCache';
import { tripCanary } from '/server/lib/canary';
import getSlug from 'limax';

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

async function createAccessibleBoardWithInitialSwimlanes(userId, payload) {
  if (!userId) throw new Meteor.Error('not-authorized');
  const allowedPayload = new Set([
    'title', 'slug', 'permission', 'type', 'migrationVersion', 'swimlanes',
  ]);
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)
    || Object.keys(payload).some(key => !allowedPayload.has(key))) {
    refuseBoardListWrite(userId, 'All Boards creation tried to set a protected board field');
  }
  const title = String(payload?.title || '').trim();
  if (!title || title.length > 1000) throw new Meteor.Error('invalid-title');
  const type = payload?.type || 'board';
  if (!['board', 'template-container'].includes(type)) {
    refuseBoardListWrite(userId, 'All Boards creation supplied a forbidden board type');
  }
  const privateOnly = (await TableVisibilityModeSettings.findOneAsync(
    'tableVisibilityMode-allowPrivateOnly',
  ))?.booleanValue === true;
  const requestedPermission = payload?.permission || 'private';
  if (!['private', 'public'].includes(requestedPermission)) {
    refuseBoardListWrite(userId, 'All Boards creation supplied a forbidden permission');
  }
  const permission = privateOnly ? 'private' : requestedPermission;
  const swimlanes = Array.isArray(payload?.swimlanes) ? payload.swimlanes : [];
  const boardId = await Boards.insertAsync({
    title,
    slug: getSlug(title) || 'board',
    permission,
    type,
    migrationVersion: Number.isFinite(payload?.migrationVersion)
      ? payload.migrationVersion : 1,
    members: [{
      userId, isAdmin: true, isActive: true, isNoComments: false,
      isCommentOnly: false, isWorker: false,
    }],
  });
  const templateRolePointers = {
    card: 'profile.cardTemplatesSwimlaneId',
    list: 'profile.listTemplatesSwimlaneId',
    board: 'profile.boardTemplatesSwimlaneId',
  };
  const profilePointerSet = type === 'template-container'
    ? { 'profile.templatesBoardId': boardId } : {};
  for (const swimlane of swimlanes) {
    const swimlaneId = await Swimlanes.insertAsync({
      title: String(swimlane.title || ''), boardId,
      sort: swimlane.sort, type: swimlane.type,
    });
    if (type === 'template-container' && templateRolePointers[swimlane.role]) {
      profilePointerSet[templateRolePointers[swimlane.role]] = swimlaneId;
    }
  }
  if (Object.keys(profilePointerSet).length) {
    await Users.updateAsync(userId, { $set: profilePointerSet });
  }
  return boardId;
}

async function copyAccessibleBoard(userId, boardId, properties = {}) {
  if (!userId) throw new Meteor.Error('not-authorized');
  const board = await ReactiveCache.getBoard(String(boardId || ''));
  if (!board) throw new Meteor.Error('not-found');
  if (!board.hasAdmin(userId)) {
    tripCanary('board-list.cross-scope', {
      userId, detail: 'All Boards copy action targeted a board without admin access',
    });
    throw new Meteor.Error('not-authorized');
  }
  const allowedProperties = new Set(['sort', 'title', 'type']);
  if (Object.keys(properties).some(key => !allowedProperties.has(key))) {
    refuseBoardListWrite(userId, 'All Boards copy tried to set a protected board field');
  }
  if (typeof properties.title === 'string' && properties.title.trim()) {
    board.title = properties.title.trim().slice(0, 1000);
  }
  if (Number.isFinite(properties.sort)) board.sort = properties.sort;
  board.type = 'board';
  return board.copy();
}

export {
  copyAccessibleBoard,
  createAccessibleBoardWithInitialSwimlanes,
  setAccessibleBoardArchived,
  toggleAccessibleBoardStar,
  toggleAccessibleDefaultBoard,
};
