import { Meteor } from 'meteor/meteor';
import { ReactiveCache } from '/imports/reactiveCache';

// AttachmentMigrationBleed (SnowBleed, fixed in v8.21): the board-scoped
// migration methods answered any logged-in user about ANY board - the
// attachmentMigration.* methods were given a board visibility check then
// (server/attachmentMigration.js). Three siblings kept the same shape, a login
// check alone: deleteDuplicateEmptyLists.getStatus returned every list id and
// title of a private board with card counts, and its .needsMigration,
// fixAllFileUrls.needsMigration and fixAvatarUrls.needsMigration answered
// questions about a board the caller cannot see (and made the server scan its
// cards). They now refuse a board the caller cannot see, like the
// attachmentMigration ones.
//
// No WeKan client calls these four, so a refusal is an attempt, not ordinary
// use, and it is recorded (Admin Panel / Problems, AttachmentMigrationBleed).
// Throws unless `userId` may see `boardId`; returns the board.
export async function assertMigrationBoardVisible(userId, boardId, source) {
  if (!userId) {
    throw new Meteor.Error('not-authorized', 'You must be logged in');
  }
  const board = await ReactiveCache.getBoard(boardId);
  if (!board || !board.isVisibleBy({ _id: userId })) {
    try {
      require('/server/lib/securityLog').record({
        key: 'authz.migration-board', action: 'blocked', source,
        detail: 'Asked a board migration method about a board the caller cannot see.',
      });
    } catch (e) { /* logging must never break the guard */ }
    throw new Meteor.Error('not-authorized', 'You do not have access to this board.');
  }
  return board;
}
