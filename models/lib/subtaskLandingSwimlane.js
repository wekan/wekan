'use strict';

// Which swimlane a new subtask lands in on its deposit board (#1953).
//
// Board Settings / Subtasks has a swimlane picker beside the landing list
// picker, stored as `subtasksDefaultSwimlaneId` and read the same way the
// list is (models/lib/subtaskLandingList.js):
//   1. the main board's choice, when it is a live swimlane of the deposit
//      board;
//   2. the deposit board's own choice, when it is a live swimlane of it;
//   3. otherwise, as before: the deposit board's swimlane with the same
//      title as the parent card's, else its default swimlane (`fallback`).
// A choice that is gone, archived or on another board is never used.
//
// Pure: tests/subtaskLandingSwimlane.test.cjs.
function chooseSubtaskSwimlane({ parentBoard, targetBoard, swimlanes, parentSwimlaneTitle }) {
  const live = (Array.isArray(swimlanes) ? swimlanes : [])
    .filter(s => s && s.boardId === targetBoard._id && s.archived !== true);
  const has = id => typeof id === 'string' && id !== '' && live.some(s => s._id === id);
  if (parentBoard && parentBoard._id !== targetBoard._id && has(parentBoard.subtasksDefaultSwimlaneId)) {
    return { swimlaneId: parentBoard.subtasksDefaultSwimlaneId };
  }
  if (has(targetBoard.subtasksDefaultSwimlaneId)) return { swimlaneId: targetBoard.subtasksDefaultSwimlaneId };
  if (typeof parentSwimlaneTitle === 'string') {
    const same = live.find(s => s.title === parentSwimlaneTitle);
    if (same) return { swimlaneId: same._id };
  }
  return { fallback: true };
}

module.exports = { chooseSubtaskSwimlane };
