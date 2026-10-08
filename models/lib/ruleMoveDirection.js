'use strict';

// #2076: rule triggers "a card is moved forward" and "... back": to a list
// after or before the one it left, in the board's list order. The reporter
// puts a card at the bottom of the next list when it moves on and at the top
// when it moves back; with plain "moved to / moved from" triggers that needs a
// rule for every pair of lists. The order is the lists' sort, not the screen,
// so the same rule works in right-to-left languages, where it is drawn the
// other way.
//
// Pure: tested by tests/ruleMoveDirection.test.cjs.
const MOVE_DIRECTIONS = ['forward', 'back'];

function moveDirection(oldList, newList) {
  if (!oldList || !newList || oldList._id === newList._id || oldList.boardId !== newList.boardId) return null;
  const from = Number(oldList.sort);
  const to = Number(newList.sort);
  if (!Number.isFinite(from) || !Number.isFinite(to) || from === to) return null;
  return to > from ? 'forward' : 'back';
}

function directionTriggerMatches(trigger, direction) {
  return !!trigger && MOVE_DIRECTIONS.includes(trigger.direction) && trigger.direction === direction;
}

module.exports = { MOVE_DIRECTIONS, moveDirection, directionTriggerMatches };
