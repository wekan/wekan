import Boards from '/models/boards';
import Lists from '/models/lists';
import { allowIsBoardMemberWithWriteAccess, denyCrossBoardMove } from '/server/lib/utils';
import { tripCanaryDeny } from '/server/lib/canary';

Lists.allow({
  async insert(userId, doc) {
    // ReadOnly and CommentOnly users cannot create lists
    return allowIsBoardMemberWithWriteAccess(userId, await Boards.findOneAsync(doc.boardId));
  },
  async update(userId, doc) {
    // ReadOnly and CommentOnly users cannot edit lists
    return allowIsBoardMemberWithWriteAccess(userId, await Boards.findOneAsync(doc.boardId));
  },
  async remove(userId, doc) {
    // ReadOnly and CommentOnly users cannot delete lists
    return allowIsBoardMemberWithWriteAccess(userId, await Boards.findOneAsync(doc.boardId));
  },
  fetch: ['boardId'],
});

// Security (GHSA-gm7v-pc38-53jr): the allow rule above only checks write access
// on the list's SOURCE board, so a client could move a list into a private board
// it is not a member of by setting a new boardId. Deny any cross-board move where
// the caller lacks write access to the destination board.
Lists.deny({
  async update(userId, doc, fieldNames, modifier) {
    if (!(await denyCrossBoardMove(userId, modifier))) return false;
    return tripCanaryDeny('list.cross-board-move', { userId });
  },
  fetch: [],
});

// A list's WIP limit is a board-wide workflow rule, set by a board admin: the
// applyWipLimit / enableWipLimit / enableSoftLimit methods have always required
// one, but the allow rule above let any member with write access set
// `wipLimit` with a plain list update. Every WeKan client path goes through the
// methods, so this refuses nothing in ordinary use.
Lists.deny({
  async update(userId, doc, fieldNames) {
    if (!fieldNames.includes('wipLimit')) return false;
    const board = await Boards.findOneAsync(doc.boardId);
    return !(board && board.hasAdmin(userId));
  },
  fetch: ['boardId'],
});
