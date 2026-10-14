'use strict';

// #2809: a linked whole list - a list on this board that is a live mirror of
// a list on another board. It shows the source list's cards as they are, and
// whoever may write the source board edits them (they stay that board's
// cards, under its rules); a card added in it is added to the source list.
// In the Swimlanes view the mirror shows its cards once, in the first
// swimlane, rather than repeating them in every swimlane.
// Pure: tests/linkedList.test.cjs.

function isLinkedList(list) {
  return !!(list && typeof list.linkedListId === 'string' && list.linkedListId && typeof list.linkedBoardId === 'string' && list.linkedBoardId);
}

// The cards a linked list shows in `swimlaneId`: the source list's, in the
// board's first swimlane (or with no swimlanes); nothing elsewhere.
function linkedListCardsSelector(list, { swimlaneId, firstSwimlaneId } = {}) {
  if (!isLinkedList(list)) return null;
  if (swimlaneId && firstSwimlaneId && swimlaneId !== firstSwimlaneId) return { _id: { $in: [] } };
  return { boardId: list.linkedBoardId, listId: list.linkedListId, archived: false };
}

// Linking a list to itself, or to a list of its own board, is no mirror.
function validLink({ boardId, sourceBoardId, sourceListId, sourceList }) {
  if (!boardId || !sourceBoardId || !sourceListId || !sourceList) return false;
  if (sourceBoardId === boardId) return false;
  if (sourceList.boardId !== sourceBoardId || sourceList.archived) return false;
  return !isLinkedList(sourceList);
}

module.exports = { isLinkedList, linkedListCardsSelector, validLink };
