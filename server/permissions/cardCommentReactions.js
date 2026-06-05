import CardCommentReactions from '/models/cardCommentReactions';
import Boards from '/models/boards';
import { allowIsBoardMemberCommentOnly } from '/server/lib/utils';

// Reacting to a comment is a form of commenting, so it follows the same rule as
// CardComments.insert: members who may comment (Normal / Comment-only) are
// allowed, but ReadOnly / No-comments members are not. Previously this used bare
// allowIsBoardMember, letting read-only members add/remove reactions the UI
// hides from them (read-only-write privilege escalation class).
CardCommentReactions.allow({
  async insert(userId, doc) {
    return allowIsBoardMemberCommentOnly(userId, await Boards.findOneAsync(doc.boardId));
  },
  async update(userId, doc) {
    return allowIsBoardMemberCommentOnly(userId, await Boards.findOneAsync(doc.boardId));
  },
  async remove(userId, doc) {
    return allowIsBoardMemberCommentOnly(userId, await Boards.findOneAsync(doc.boardId));
  },
  fetch: ['boardId'],
});
