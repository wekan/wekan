import Boards from '/models/boards';
import CardComments from '/models/cardComments';
import Cards from '/models/cards';
import { allowIsBoardMemberCommentOnly, allowIsBoardAdmin } from '/server/lib/utils';
import { commentCardMatchesBoard, recordCommentBoundaryDenial } from '/models/lib/commentCardBoundary';

CardComments.deny({
  async insert(userId, doc) {
    const card = await Cards.findOneAsync(doc.cardId);
    if (commentCardMatchesBoard(card, doc.cardId, doc.boardId)) return false;
    recordCommentBoundaryDenial('ddp:comment-insert');
    return true;
  },
  update(userId, doc, fields) {
    // Comments have no client move operation. Rebinding would otherwise skip
    // the insert boundary check and inject an existing comment onto another card.
    if (!fields.some(field => field === 'cardId' || field === 'boardId')) return false;
    recordCommentBoundaryDenial('ddp:comment-rebind');
    return true;
  },
});

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
