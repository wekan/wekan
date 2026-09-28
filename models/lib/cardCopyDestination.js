'use strict';

function validCardCopyDestination(boardId, swimlaneId, listId, board, swimlane, list) {
  return [boardId, swimlaneId, listId].every(id => typeof id === 'string' && id.length > 0) &&
    !!board && board._id === boardId && board.deletedAt == null &&
    !!swimlane && swimlane._id === swimlaneId && swimlane.deletedAt == null &&
    swimlane.boardId === boardId && !!list && list._id === listId && list.boardId === boardId && list.deletedAt == null;
}
// Lists can be board-wide, and board copies preserve archived containers.
// This is a placement check; caller-specific permissions remain with the caller.
module.exports = { validCardCopyDestination };
