import Boards from '/models/boards';
import Lists from '/models/lists';
import { allowIsBoardMemberWithWriteAccess, denyCrossBoardMove } from '/server/lib/utils';

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
    return await denyCrossBoardMove(userId, modifier);
  },
  fetch: [],
});
