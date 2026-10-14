'use strict';

// #864: dropping a Table view row onto another row puts the dragged card just
// before the target card, in the target's list and swimlane - between the
// target and the card before it there, or one before the target when the
// target is first. Pure: tests/tableViewDrop.test.cjs.

function tableViewDropTarget(dragged, target, cardsInTargetCell) {
  if (!dragged || !target || dragged._id === target._id) return null;
  const cell = (Array.isArray(cardsInTargetCell) ? cardsInTargetCell : [])
    .filter(c => c && c._id !== dragged._id && Number.isFinite(c.sort))
    .sort((a, b) => a.sort - b.sort);
  const at = cell.findIndex(c => c._id === target._id);
  const targetSort = Number.isFinite(target.sort) ? target.sort : 0;
  const before = at > 0 ? cell[at - 1] : null;
  const sort = before ? (before.sort + targetSort) / 2 : targetSort - 1;
  return { boardId: target.boardId, swimlaneId: target.swimlaneId, listId: target.listId, sort };
}

module.exports = { tableViewDropTarget };
