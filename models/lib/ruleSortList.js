'use strict';

// The order a sortList rule action puts a list's cards in (server/rulesHelper.js
// performAction, and its durable command server/lib/syncRuleSortListCommand.js):
// by name, creation, modification or due date (the default), each card then
// taking its index as its sort. Pure, so both paths sort the same way.
function sortKey(card, sortField) {
  switch (sortField) {
    case 'name': return (card.title || '').toLowerCase();
    case 'created': return card.createdAt ? new Date(card.createdAt).getTime() : 0;
    case 'modified': return card.modifiedAt ? new Date(card.modifiedAt).getTime() : 0;
    case 'due':
    default: return card.dueAt ? new Date(card.dueAt).getTime() : Number.MAX_SAFE_INTEGER;
  }
}

function sortListOrder(cards, sortField) {
  return [...(cards || [])].sort((a, b) => {
    const ka = sortKey(a, sortField), kb = sortKey(b, sortField);
    return ka > kb ? 1 : ka < kb ? -1 : 0;
  });
}

module.exports = { sortKey, sortListOrder };
