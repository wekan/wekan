import Boards from '/models/boards';
import Swimlanes from '/models/swimlanes';
import { allowIsBoardMemberWithWriteAccess } from '/server/lib/utils';

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
