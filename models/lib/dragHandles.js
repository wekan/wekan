'use strict';

// Pure decision helper for "should drag handles be shown?" (#6521).
//
// Drag handles exist so that the REST of a card/list/swimlane is free for
// something else: with handles on, dragging the card body pans the board
// (dragscroll) and only the handle moves the card. So whether they are shown
// changes the meaning of every drag on the board, and the user must be able to
// decide it on any device.
//
// Three states, not two:
//   * preference === true   - the user turned handles ON
//   * preference === false  - the user turned handles OFF
//   * preference === null   - the user has never chosen; the device decides
//
// The old rule was `isTouchScreen() || preference`, which collapsed the three
// states into "always on for touch": on a touch screen the OR was already true,
// so the "Show desktop drag handles" toggle could not hide them there. Keeping
// "never chosen" distinct from "deliberately off" is the whole fix — the default
// for a touch screen stays ON (a finger needs something to grab), but an
// explicit OFF is now honoured everywhere.

function resolveShowDragHandles(preference, isTouchScreen) {
  if (preference === true) return true;
  if (preference === false) return false;
  return !!isTouchScreen; // never chosen: touch gets handles, a mouse does not
}

// Normalize a stored value (user profile field or localStorage string) into the
// three states above. Anything unrecognized is "never chosen", so a corrupt or
// legacy value falls back to the device default rather than to an arbitrary
// boolean.
function readDragHandlesPreference(stored) {
  if (stored === true || stored === 'true') return true;
  if (stored === false || stored === 'false') return false;
  return null;
}

module.exports = { resolveShowDragHandles, readDragHandlesPreference };
