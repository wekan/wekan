import Boards from '/models/boards';
import CardComments from '/models/cardComments';
import { allowIsBoardMemberCommentOnly, allowIsBoardAdmin } from '/server/lib/utils';

CardComments.allow({
  async insert(userId, doc) {
    // ReadOnly users cannot add comments. Only members who can comment are allowed.
    return allowIsBoardMemberCommentOnly(userId, await Boards.findOneAsync(doc.boardId));
  },
  async update(userId, doc) {
    return userId === doc.userId || allowIsBoardAdmin(userId, await Boards.findOneAsync(doc.boardId));
  },
  async remove(userId, doc) {
    return userId === doc.userId || allowIsBoardAdmin(userId, await Boards.findOneAsync(doc.boardId));
  },
  fetch: ['userId', 'boardId'],
});
