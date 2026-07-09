'use strict';

// #3624 "new_swimlane API sorting problem". POST /api/boards/:boardId/swimlanes
// set the new swimlane's sort to board.swimlanes().length (a COUNT). When the
// existing swimlanes' sort values are not a contiguous 0..n-1 run (after
// deletions, reordering, or swimlanes created top-first with decreasing sorts),
// the count collides with or precedes existing sorts, so the new swimlane could
// appear FIRST instead of last. The issue also asked to allow an explicit index.
//
// nextSwimlaneSort() returns the sort to use: the caller's requested sort when a
// finite number is supplied, otherwise max(existing sorts)+1 for a reliable
// append (0 when the board has no swimlanes yet). Meteor-free and unit tested.
function nextSwimlaneSort(existingSorts, requestedSort) {
  if (
    requestedSort !== undefined &&
    requestedSort !== null &&
    requestedSort !== '' &&
    Number.isFinite(Number(requestedSort))
  ) {
    return Number(requestedSort);
  }
  const nums = (Array.isArray(existingSorts) ? existingSorts : [])
    .map(Number)
    .filter(Number.isFinite);
  if (nums.length === 0) return 0;
  return Math.max(...nums) + 1;
}

module.exports = { nextSwimlaneSort };
