import Boards from '/models/boards';
import Lists from '/models/lists';
import { allowIsBoardMemberWithWriteAccess } from '/server/lib/utils';

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
