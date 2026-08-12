'use strict';

// Which checklists a minicard shows, and what the per-checklist toggle means.
//
// Reported by email with a screenshot (Swedish): "Även om jag avmarkerar 'Visa på
// minikort' (och vill dölja checklistan på minikortet)" - even after unchecking
// "Show on minicard" for a checklist, the checklist is still on the minicard.
//
// It was, for everybody. The board setting `allowsChecklistsOnMinicard` defaults to
// TRUE, and the minicard asked:
//
//     board.allowsChecklistsOnMinicard || checklist.showChecklistAtMinicard
//
// An OR cannot be argued with: while the board setting is on, no value of the
// checklist's own field changes the answer. The popup made it look otherwise - it
// drew the switch from the raw field, which starts false, so the switch read OFF
// beside a checklist that was plainly showing, and clicking it set the field to true
// and changed nothing anybody could see. Clicking again set it back. The toggle was
// dead in both directions.
//
// The two settings are a DEFAULT and an OVERRIDE, not two ways of saying yes:
//
//   checklist.showChecklistAtMinicard === true   -> shown, whatever the board says
//   checklist.showChecklistAtMinicard === false  -> hidden, whatever the board says
//   checklist.showChecklistAtMinicard undefined  -> follow the board's default
//
// which is why the field lost its `defaultValue: false`. A stored false has to be
// able to mean "this one, hidden"; if every checklist is born with one, "hidden" and
// "not chosen" are the same value and the override cannot exist. Checklists written
// before this have a false that meant "follow the board" - migrations/ clears those,
// so nothing changes on screen for anyone who never touched the toggle.
//
// Pure and dependency-free so both the model and the tests can use it.

// Is this checklist shown on the minicard?
//   checklist  the checklist document (only showChecklistAtMinicard is read)
//   boardAllows  the board's allowsChecklistsOnMinicard default
function isChecklistShownAtMinicard(checklist, boardAllows) {
  const own = checklist && checklist.showChecklistAtMinicard;
  if (own === true || own === false) return own;
  return boardAllows === true;
}

// What the toggle writes: the opposite of what is on screen NOW. Flipping the raw
// field instead is what made the first click do nothing when the board default was
// on (false -> true, still shown).
function toggledChecklistAtMinicard(checklist, boardAllows) {
  return !isChecklistShownAtMinicard(checklist, boardAllows);
}

export { isChecklistShownAtMinicard, toggledChecklistAtMinicard };
