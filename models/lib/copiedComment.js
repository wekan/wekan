'use strict';

function buildCopiedComment(comment, newCardId, newBoardId) {
  if (!comment || !newCardId || !newBoardId) return null;
  const copy = { ...comment, cardId: newCardId, boardId: newBoardId };
  delete copy._id;
  return copy;
}

module.exports = { buildCopiedComment };
