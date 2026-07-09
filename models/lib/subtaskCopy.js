'use strict';

// #3185 "Template with subtasks and checklists". When a card is copied (e.g.
// generating a card from a template), each subtask was inserted as a BARE card
// document — its checklists (and their items) were never copied, so the new
// card's subtasks came out empty. The parent card's own checklists were copied,
// but the per-subtask copy skipped them.
//
// buildCopiedSubtaskFields() builds the card document for a copied subtask
// (re-homed under the new parent and onto the destination board), and
// subtaskCopyChildKinds() declares the child records a subtask copy must also
// reproduce — 'checklists' being the one that was missing in #3185. Meteor-free
// so the re-homing and the copy contract are unit tested; the caller then runs
// Checklist.copy() for each kind.
function buildCopiedSubtaskFields(subtask, { newParentId, boardId, swimlaneId, listId } = {}) {
  const fields = Object.assign({}, subtask);
  delete fields._id;
  fields.parentId = newParentId;
  fields.boardId = boardId;
  fields.swimlaneId = swimlaneId;
  fields.listId = listId;
  return fields;
}

// The child-record kinds a full subtask copy must reproduce. Guards #3185: a
// subtask copy that reproduces only the card (this list empty / missing
// 'checklists') is the regression.
function subtaskCopyChildKinds() {
  return ['checklists'];
}

module.exports = { buildCopiedSubtaskFields, subtaskCopyChildKinds };
