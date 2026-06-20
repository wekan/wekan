// Pure helpers for the per-checklist "Hide checked items" toggle (issue #5408).
//
// Each checklist stores its own boolean field `hideCheckedChecklistItems`
// (see models/checklists.js). The toggle must:
//   1. be read PER CHECKLIST (keyed by that checklist's own document/_id),
//      never from a shared card/global flag, so toggling one checklist does
//      not affect the others; and
//   2. hide a checklist-item exactly when that item is checked AND the
//      owning checklist's toggle is on (correct, non-inverted direction).
//
// These helpers are framework-free so they can be unit tested in isolation
// and reused by the client template logic.

// Read the per-checklist "hide checked items" state from the given checklist
// document. Returns a strict boolean; a missing/undefined field means "off".
// `checklist` is expected to be that specific checklist's document, so the
// state is always scoped to the checklist passed in.
export function checklistHideState(checklist) {
  return !!(checklist && checklist.hideCheckedChecklistItems === true);
}

// Decide whether a single checklist-item should be hidden.
// An item is hidden only when it is checked (`isChecked`) AND its owning
// checklist's toggle is on (`hideChecked`). Checked items with the toggle off,
// and unchecked items, are always visible.
export function isItemHidden({ isChecked, hideChecked } = {}) {
  return !!isChecked && !!hideChecked;
}
