import { Meteor } from 'meteor/meteor';
import Boards from '/models/boards';
import Users from '/models/users';
import Swimlanes from '/models/swimlanes';
import TableVisibilityModeSettings from '/models/tableVisibilityModeSettings';
import { ReactiveCache } from '/imports/reactiveCache';
import { tripCanary } from '/server/lib/canary';
import getSlug from 'limax';
import { getFeatureFlags } from '/models/lib/featureFlags';
import RecoveryEvents from '/models/recoveryEvents';
import { recordRecoveryAudit } from '/server/lib/recoveryAudit';
const { findNode } = require('/models/lib/workspacesTree');

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

async function setAccessibleBoardWorkspace(userId, boardId, workspaceId) {
  const { user, board } = await visibleBoardAndUser(userId, boardId);
  if (board.archived === true || board.type !== 'board') {
    throw new Meteor.Error('invalid-workspace-board');
  }
  const target = String(workspaceId || '');
  if (target && !findNode(user.profile?.boardWorkspacesTree || [], target)) {
    refuseBoardListWrite(userId, 'All Boards assignment targeted an unknown workspace');
  }
  const assignments = { ...(user.profile?.boardWorkspaceAssignments || {}) };
  if (target) assignments[board._id] = target;
  else delete assignments[board._id];
  await Users.updateAsync(userId, {
    $set: { 'profile.boardWorkspaceAssignments': assignments },
  });
  return true;
}

async function permanentlyDeleteAccessibleArchivedBoards(userId, boardIds, connection) {
  const attemptedIds = Array.isArray(boardIds)
    ? [...new Set(boardIds.filter(id => typeof id === 'string'))].slice(0, 200)
    : [];
  let attemptedBoards = attemptedIds.map(_id => ({ _id, title: '' }));
  let user;
  let username = 'unknown';
  try {
    user = userId && await ReactiveCache.getUser(userId);
    username = user?.username || user?._id || 'unknown';
    if (!Array.isArray(boardIds) || boardIds.some(id => typeof id !== 'string')) {
      throw new Meteor.Error('invalid-board-selection');
    }
    const ids = [...new Set(boardIds)];
    if (!ids.length || ids.length > 200) {
      throw new Meteor.Error('invalid-board-selection');
    }
    const foundBoards = await Boards.find(
      { _id: { $in: ids } },
      { fields: { _id: 1, title: 1, archived: 1 } },
    ).fetchAsync();
    const foundById = new Map(foundBoards.map(board => [board._id, board]));
    attemptedBoards = ids.map(_id => foundById.get(_id) || { _id, title: '' });
    if (user?.isAdmin !== true || !getFeatureFlags().enablePermanentDelete) {
      throw new Meteor.Error('not-authorized', 'Permanent delete is disabled.');
    }
    if (foundBoards.length !== ids.length || foundBoards.some(board => !board.archived)) {
      throw new Meteor.Error('not-archived', 'Only archived boards can be permanently deleted.');
    }
    for (const board of foundBoards) {
      await Boards.removeAsync(board._id);
      await recordRecoveryAudit({
        type: RecoveryEvents.types.BOARD_PERMANENTLY_DELETED,
        user, connection, done: true, deletedData: true, boards: [board],
        detail: `Global Admin ${username} (${user._id}) permanently deleted board ${board._id} titled ${JSON.stringify(board.title || '')}.`,
      });
    }
    return { deleted: foundBoards.length };
  } catch (error) {
    if (!user && userId) {
      try {
        user = await ReactiveCache.getUser(userId);
        username = user?.username || user?._id || 'unknown';
      } catch {
        // Best effort: retain the original deletion error.
      }
    }
    await recordRecoveryAudit({
      type: RecoveryEvents.types.BOARD_PERMANENTLY_DELETED,
      user, connection, done: false, boards: attemptedBoards,
      detail: `User ${username} (${user?._id || 'not logged in'}) failed to permanently delete boards ${attemptedBoards.map(board => `${board._id} titled ${JSON.stringify(board.title || '')}`).join(', ') || '(none)'}: ${error.reason || error.message || 'unknown error'}.`,
    });
    throw error;
  }
}

export {
  copyAccessibleBoard,
  createAccessibleBoardWithInitialSwimlanes,
  permanentlyDeleteAccessibleArchivedBoards,
  setAccessibleBoardWorkspace,
  setAccessibleBoardArchived,
  toggleAccessibleBoardStar,
  toggleAccessibleDefaultBoard,
};
