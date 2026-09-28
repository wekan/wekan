'use strict';
const { withoutCommentPrivateFields } = require('./commentPrivateFields');

function buildCopiedComment(comment, newCardId, newBoardId) {
  if (!comment || !newCardId || !newBoardId) return null;
  const copy = { ...withoutCommentPrivateFields(comment), cardId: newCardId, boardId: newBoardId };
  delete copy._id;
  return copy;
}

module.exports = { buildCopiedComment };
