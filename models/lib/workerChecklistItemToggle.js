'use strict';

// wekan/wekan#3307: "a board member with the Worker role cannot check/uncheck
// checklist items" - the reporter asked for Workers to complete an assigned
// task's checklist without being able to delete it.
//
// server/permissions/checklistItems.js gated EVERY write on the same check as
// editing and deleting a checklist item: `write` capability on the board
// (models/lib/boardRoleCapabilities.js). A Worker has `write: false` by design
// (see models/lib/workerCardWrite.js) - the role is "move card, assign himself
// to card and comment", not "edit cards" - so toggling a checkbox was refused
// the same way deleting the item would be. The client mirrored it:
// client/components/cards/checklists.jade only drew the clickable
// `.check-box-container` `if canModifyCard`, so a Worker never even saw a box
// to click.
//
// Widening `write` for Worker is not the fix - that reopens edit and delete,
// which is exactly what the reporter did NOT want. What is missing is a
// FIELD-LEVEL policy, the same shape as workerCardWrite.js: a Worker may set
// isFinished and nothing else on a checklist item.
//
// Pure and dependency-free: server/permissions/checklistItems.js applies it,
// and tests/workerChecklistItemToggle.test.cjs exercises it on its own.

function isPlainObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

// May a Worker perform this checklist-item update? Only a $set of isFinished,
// to a boolean, and nothing else - not title, not dueAt, not checklistId/cardId
// (which would move the item), not a second field alongside it.
function workerMayToggleChecklistItem(userId, modifier) {
  if (!userId || !isPlainObject(modifier)) return false;
  const operators = Object.keys(modifier);
  if (operators.length !== 1 || operators[0] !== '$set') return false;

  const set = modifier.$set;
  if (!isPlainObject(set)) return false;
  const fields = Object.keys(set);
  if (fields.length !== 1 || fields[0] !== 'isFinished') return false;

  return typeof set.isFinished === 'boolean';
}

module.exports = {
  workerMayToggleChecklistItem,
};
