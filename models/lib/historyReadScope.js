'use strict';

// Current access wins over authorship and over the scope a client selected.
// Restricted members only receive history belonging to a currently visible
// card; container snapshots can contain other cards and must not slip through.
function readableHistoryRow(row, scope) {
  if (!scope || !scope.visible) return false;
  if (!scope.assignedOnly) return true;
  const cardId = row.cardId || (row.entityType === 'card' ? row.entityId : null);
  return Boolean(cardId && scope.cardIds.has(cardId));
}
module.exports = { readableHistoryRow };
