'use strict';

// #1618: a person responsible for each checklist item, and dated checklist
// items in the calendar and the Gantt views. An item's due date (dueAt) shows
// beside the cards, as "card: item", with its own id - `ci:<itemId>` - so the
// views never mistake it for a card: opening it opens its card, and moving it
// moves only the item's own due date. Pure: tests/checklistItemSchedule.test.cjs.

const PREFIX = 'ci:';

function isChecklistItemEventId(id) {
  return typeof id === 'string' && id.startsWith(PREFIX);
}
function checklistItemIdOf(id) {
  return isChecklistItemEventId(id) ? id.slice(PREFIX.length) : null;
}

// The board's dated, not-archived checklist items, each with its card, in
// [from, to) when a range is given.
function datedChecklistItems(items, cardOf, { from, to } = {}) {
  const out = [];
  for (const item of Array.isArray(items) ? items : []) {
    if (!item || !item.dueAt) continue;
    const due = new Date(item.dueAt);
    if (Number.isNaN(due.getTime())) continue;
    if (from && due < new Date(from)) continue;
    if (to && due >= new Date(to)) continue;
    const card = cardOf(item.cardId);
    if (!card || card.archived) continue;
    out.push({
      id: PREFIX + item._id,
      itemId: item._id,
      cardId: card._id,
      title: `${card.title || ''}: ${item.title || ''}`,
      dueAt: due,
      isFinished: !!item.isFinished,
      assigneeId: item.assigneeId || null,
    });
  }
  return out.sort((a, b) => a.dueAt - b.dueAt);
}

// Whether `userId` may be made responsible for an item of `board`.
function mayBeAssigned(board, userId) {
  if (userId === null || userId === '') return true; // nobody
  return typeof userId === 'string' && !!board && (board.members || [])
    .some(m => m && m.userId === userId && m.isActive !== false);
}

module.exports = { PREFIX, isChecklistItemEventId, checklistItemIdOf, datedChecklistItems, mayBeAssigned };
