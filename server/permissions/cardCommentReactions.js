import CardCommentReactions from '/models/cardCommentReactions';
import Boards from '/models/boards';
import { allowIsBoardMember } from '/server/lib/utils';

CardCommentReactions.allow({
  async insert(userId, doc) {
    return allowIsBoardMember(userId, await Boards.findOneAsync(doc.boardId));
  },
  async update(userId, doc) {
    return allowIsBoardMember(userId, await Boards.findOneAsync(doc.boardId));
  },
  async remove(userId, doc) {
    return allowIsBoardMember(userId, await Boards.findOneAsync(doc.boardId));
  },
  fetch: ['boardId'],
});
