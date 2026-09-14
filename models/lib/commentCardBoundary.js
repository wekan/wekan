'use strict';

function commentCardMatchesBoard(card, cardId, boardId) {
  return Boolean(card && typeof cardId === 'string' && cardId &&
    typeof boardId === 'string' && boardId &&
    card._id === cardId && card.boardId === boardId);
}

function recordCommentBoundaryDenial(source) {
  try {
    require('/server/lib/securityLog').record({
      key: 'authz.comment-card', action: 'blocked', source,
      detail: 'Comment refused because its card does not belong to the requested board.',
    });
  } catch (e) { /* logging must never break the guard */ }
}

module.exports = { commentCardMatchesBoard, recordCommentBoundaryDenial };
