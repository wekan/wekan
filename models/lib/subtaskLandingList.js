'use strict';

// Which list a new subtask lands in on its deposit board (#1781).
//
// A board stores ONE `subtasksDefaultListId`, and Board Settings / Subtasks
// uses it for two different questions:
//   - on a board whose subtasks go to ANOTHER board, it is the landing list
//     chosen there, and it is a list of that other board (the settings show
//     the deposit board's lists since #3414) - so each main board can land its
//     subtasks in its own list of a shared deposit board, as #1781 asked;
//   - on a board that receives subtasks, it is the landing list of its own.
// The server used to read only the deposit board's field, so the main board's
// choice was ignored - and when the deposit board itself sends its subtasks
// elsewhere, its field names a list of a THIRD board, and the card was written
// with this board's id and that board's list.
//
// The rule, never choosing a list that is not on the deposit board:
//   1. the main board's choice, when it is a live list of the deposit board;
//   2. the deposit board's own choice, when it is a live list of that board;
//   3. none set on the deposit board -> create and store its "Queue" list,
//      as before;
//   4. its choice is gone, archived or on another board -> its first live
//      list, or a new "Queue" list that is NOT stored over its choice.
//
// Pure: tested by tests/subtaskLandingList.test.cjs.
function chooseSubtaskLandingList({ parentBoard, targetBoard, lists }) {
  const live = (Array.isArray(lists) ? lists : [])
    .filter(list => list && list.boardId === targetBoard._id && list.archived !== true);
  const has = id => typeof id === 'string' && id !== '' && live.some(list => list._id === id);
  if (parentBoard && parentBoard._id !== targetBoard._id && has(parentBoard.subtasksDefaultListId)) {
    return { listId: parentBoard.subtasksDefaultListId };
  }
  const own = targetBoard.subtasksDefaultListId;
  if (has(own)) return { listId: own };
  if (own === undefined || own === null || own === '' || own === 'null') return { create: 'store' };
  return live.length ? { listId: live[0]._id } : { create: 'local' };
}

module.exports = { chooseSubtaskLandingList };
