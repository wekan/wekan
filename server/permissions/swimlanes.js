import Boards from '/models/boards';
import Swimlanes from '/models/swimlanes';
import { allowIsBoardMemberWithWriteAccess, denyCrossBoardMove } from '/server/lib/utils';

Swimlanes.allow({
  async insert(userId, doc) {
    // ReadOnly and CommentOnly users cannot create swimlanes
    return allowIsBoardMemberWithWriteAccess(userId, await Boards.findOneAsync(doc.boardId));
  },
  async update(userId, doc) {
    // ReadOnly and CommentOnly users cannot edit swimlanes
    return allowIsBoardMemberWithWriteAccess(userId, await Boards.findOneAsync(doc.boardId));
  },
  async remove(userId, doc) {
    // ReadOnly and CommentOnly users cannot delete swimlanes
    return allowIsBoardMemberWithWriteAccess(userId, await Boards.findOneAsync(doc.boardId));
  },
  fetch: ['boardId'],
});

// Security (GHSA-gm7v-pc38-53jr): the allow rule above only checks write access
// on the swimlane's SOURCE board, so a client could move a swimlane into a private
// board it is not a member of by setting a new boardId. Deny any cross-board move
// where the caller lacks write access to the destination board.
Swimlanes.deny({
  async update(userId, doc, fieldNames, modifier) {
    return await denyCrossBoardMove(userId, modifier);
  },
  fetch: [],
});
