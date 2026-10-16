import Boards from '/models/boards';
import CardComments from '/models/cardComments';
import Cards from '/models/cards';
import { allowIsBoardMemberCommentOnly, allowIsBoardAdmin } from '/server/lib/utils';
import { commentCardMatchesBoard, recordCommentBoundaryDenial } from '/models/lib/commentCardBoundary';
const { assignedOnlyAllowsCard } = require('/models/lib/boardCardScope');

const { hasPrivateCommentWrite } = require('/models/lib/commentPrivateFields');

function recordCommentPrivateDenial(source) {
  try {
    require('/server/lib/securityLog').record({ key: 'authz.comment', action: 'blocked', source,
      detail: 'Client attempted to modify private comment delivery evidence.' });
  } catch (error) { /* logging must never break denial */ }
}

CardComments.deny({
  async insert(userId, doc) {
    if (hasPrivateCommentWrite(Object.keys(doc))) {
      recordCommentPrivateDenial('ddp:comment-private-insert');
      return true;
    }
    const card = await Cards.findOneAsync(doc.cardId);
    if (!commentCardMatchesBoard(card, doc.cardId, doc.boardId)) {
      recordCommentBoundaryDenial('ddp:comment-insert');
      return true;
    }
    // An assigned-only member comments only on their own cards; no view shows
    // them another, so this is an attempt (GHSA-r4gm-mjj9-g3x8).
    if (!assignedOnlyAllowsCard(await Boards.findOneAsync(doc.boardId), userId, card)) {
      try {
        require('/server/lib/securityLog').record({
          key: 'authz.assigned', action: 'blocked', source: 'ddp:comment-insert', userId,
          detail: 'Assigned-only member commented on a card not assigned to them.',
        });
      } catch (e) { /* logging must never break the guard */ }
      return true;
    }
    return false;
  },
  update(userId, doc, fields, modifier) {
    if (hasPrivateCommentWrite(fields, modifier)) {
      recordCommentPrivateDenial('ddp:comment-private-update');
      return true;
    }
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
