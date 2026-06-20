// Pure, dependency-free helpers for creating subtask cards.
//
// This module intentionally has NO Meteor / Mongo / collection imports so it
// can be imported directly by unit tests (mocha + chai) without a running app,
// while still being the single source of truth used by models/cards.js.
//
// Covered bugs:
//   - #3328 circular subtask guard (a card must never become its own ancestor).
//   - #4037 / #3562 board "always on card" custom fields not applied to new
//     subtask cards.

/**
 * #3328 "Circular subtask reference hangs the board".
 *
 * The original guard tested `crtParentId in resultId`, which uses the JS `in`
 * operator on an array: it checks ARRAY INDICES ("0", "1", ...), not the stored
 * ids, so it never matched and a card could be made its own ancestor — which
 * then hangs every parent/ancestor walk.
 *
 * Decide whether assigning `newParentId` as the parent of `cardId` would create
 * a cycle. It would if the new parent is the card itself, or if the card is
 * already somewhere in the new parent's ancestor chain.
 *
 * Comparison is strictly by VALUE (not by array index).
 *
 * @param {string} cardId        The card whose parent is being (re)assigned.
 * @param {string} newParentId   The proposed new parent id (may be falsy = clear).
 * @param {Array<string>} ancestorIds  Ids of the new parent's ancestor chain
 *                                      (the new parent's own ancestors; the new
 *                                      parent id itself may or may not be
 *                                      included — both are handled).
 * @returns {boolean} true if the assignment would create a cycle.
 */
export function wouldCreateCycle(cardId, newParentId, ancestorIds = []) {
  if (!newParentId) {
    // Clearing the parent (top-level card) can never create a cycle.
    return false;
  }
  if (newParentId === cardId) {
    // A card cannot be its own parent.
    return true;
  }
  const chain = Array.isArray(ancestorIds) ? ancestorIds : [];
  // If the card already appears in the new parent's ancestor chain, linking the
  // two would close a loop. Compare by VALUE via includes() (the #3328 fix).
  return chain.includes(cardId);
}

/**
 * #4037 / #3562 "Custom fields not assigned to subtask cards".
 *
 * A normal new card receives every board custom field flagged
 * `automaticallyOnCard` (or `alwaysOnCard`) as a `{ _id, value: null }` entry
 * (see server/models/cards.js card-create endpoints). Subtask creation skipped
 * this, so subtask cards never got the board's automatic custom fields.
 *
 * Build the `customFields` array a new subtask card should start with.
 *
 * @param {Array<{_id:string, automaticallyOnCard?:boolean, alwaysOnCard?:boolean}>} boardCustomFields
 *        The custom field definitions of the destination (subtasks) board.
 * @returns {Array<{_id:string, value:null}>}
 */
export function subtaskCustomFields(boardCustomFields) {
  const fields = Array.isArray(boardCustomFields) ? boardCustomFields : [];
  const result = [];
  for (const field of fields) {
    if (field && (field.automaticallyOnCard || field.alwaysOnCard)) {
      result.push({ _id: field._id, value: null });
    }
  }
  return result;
}
