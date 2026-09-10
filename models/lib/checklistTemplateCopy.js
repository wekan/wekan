'use strict';

// #4017 "Apply checklist template to an existing card". WeKan already let a
// checklist template be applied only at CARD-CREATION time (copying a
// template card, via Cards.copy() -> Checklists.copy()); there was no way to
// append a template's checklists onto a card that already exists. This
// module holds the pure, Meteor-free document-building logic behind the new
// "Copy Checklist From Template" action
// (client/components/cards/checklists.js /
// Checklists.copyAllFromCardToCard() in models/checklists.js), split out so
// the copy semantics can be unit tested without a database - the same
// pattern already used for subtask copying (models/lib/subtaskCopy.js) and
// bulk checklist-item text editing (models/lib/checklistItemsAsText.js).
//
// Three things the append must get right, each pinned by a test:
//   - the copied checklist/item documents carry the SOURCE content, with no
//     `_id` (the actual Mongo insert - not done here - assigns the fresh
//     one) and re-homed onto the destination card/board;
//   - a copied item is always inserted UNCHECKED, regardless of the source
//     item's own `isFinished` - applying a template should never pre-check
//     the card it lands on;
//   - the appended checklists are placed AFTER whatever the destination card
//     already has (existing checklists are left untouched, never
//     overwritten), in the source card's own order.

/**
 * Build the document for a copied checklist, minus `_id` (the caller's
 * insert assigns a fresh one).
 */
function buildCopiedChecklistDoc(sourceChecklist, { newCardId, boardId, sort }) {
  const copy = Object.assign({}, sourceChecklist);
  delete copy._id;
  copy.cardId = newCardId;
  copy.boardId = boardId;
  copy.sort = sort;
  return copy;
}

/**
 * Build the document for a copied checklist item, minus `_id`. When
 * `resetChecked` is true (always the case for a template application), the
 * copy is forced unchecked no matter what the source item's `isFinished`
 * was - the defining rule of #4017.
 */
function buildCopiedItemDoc(sourceItem, { newChecklistId, newCardId, boardId, resetChecked }) {
  const copy = Object.assign({}, sourceItem);
  delete copy._id;
  copy.checklistId = newChecklistId;
  copy.cardId = newCardId;
  copy.boardId = boardId;
  if (resetChecked) {
    copy.isFinished = false;
  }
  return copy;
}

/**
 * The sort value the first appended checklist should get, so the whole
 * batch lands strictly after the destination card's own checklists (which
 * are left exactly as they are) rather than colliding with, or sorting
 * ahead of, them.
 */
function firstAppendSort(targetChecklists) {
  const last = targetChecklists[targetChecklists.length - 1];
  return last && typeof last.sort === 'number' ? last.sort + 1 : 0;
}

export { buildCopiedChecklistDoc, buildCopiedItemDoc, firstAppendSort };
