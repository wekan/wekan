// #2473: "check all" / "uncheck all" bulk actions on a checklist's action
// menu, setting every item's isFinished to the same value in one operation.
//
// This module is intentionally free of Meteor/Mongo imports so the item
// selection can be unit tested as plain functions - the actual DB writes
// (Checklists.checkAllItems()/uncheckAllItems() in models/checklists.js) are
// a thin wrapper that loops item._id -> item.check()/item.uncheck() over the
// ids this returns.

/**
 * Which items belong to the given checklist, regardless of their current
 * isFinished state - the "check all" / "uncheck all" actions apply to every
 * item of the checklist, not just the ones not already in the target state.
 * Items belonging to any OTHER checklist (same card or a different one) are
 * left out untouched.
 *
 * @param {Array<{_id: string, checklistId: string}>} items every checklist
 *   item under consideration (e.g. every item on the card)
 * @param {string} checklistId the checklist being bulk-checked/unchecked
 * @returns {string[]} the _ids of the items to update
 */
export function selectBulkCheckItemIds(items, checklistId) {
  if (!Array.isArray(items) || !checklistId) return [];
  return items
    .filter(item => item && item.checklistId === checklistId)
    .map(item => item._id);
}

/**
 * Applies a bulk check/uncheck to a plain array of items (used by the unit
 * test to assert the resulting isFinished values without touching Mongo).
 *
 * @param {Array<{_id: string, checklistId: string, isFinished: boolean}>} items
 * @param {string} checklistId
 * @param {boolean} isFinished the target state - true for "check all", false
 *   for "uncheck all"
 * @returns {Array<{_id: string, checklistId: string, isFinished: boolean}>}
 *   a new array, same shape, with the checklist's items updated
 */
export function applyBulkCheck(items, checklistId, isFinished) {
  const ids = new Set(selectBulkCheckItemIds(items, checklistId));
  return (items || []).map(item =>
    ids.has(item._id) ? { ...item, isFinished } : item,
  );
}
