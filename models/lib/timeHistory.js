'use strict';

// One position row, regardless of whether a move came from a UI drag, REST,
// a rule or Card.move. Bookkeeping-only updates are not moves.
function positionChange(previous, next, fieldNames) {
  const keys = ['boardId', 'swimlaneId', 'listId', 'sort'];
  if (!keys.some(key => fieldNames.includes(key) && previous[key] !== next[key])) return null;
  const snapshot = doc => Object.fromEntries([...keys, 'lastMoveReason'].map(key => [key,
    doc[key] === undefined ? (key === 'lastMoveReason' ? '' : null) : doc[key]]));
  return { group: 'position', changeType: 'moved', previousContent: snapshot(previous), newContent: snapshot(next) };
}

// A spentTime total is not a timesheet. Report its actual timestamped changes
// by their author, including negative corrections and unknown opening balances.
function timeAdjustments(history, nameOf = id => id, titleOf = id => id) {
  const groups = new Map();
  const entries = [];
  for (const row of history) {
    // Restore also writes a provenance row for the original author. Attribute
    // the actual adjustment once, to the person who performed the restore.
    if (row.restoredByUserId && row.userId !== row.restoredByUserId) continue;
    const field = row.newContent?.field || row.previousContent?.field;
    if (field !== 'spentTime') continue;
    const before = row.previousContent?.value ?? 0;
    const after = row.newContent?.value ?? 0;
    if (typeof before !== 'number' || typeof after !== 'number' || !Number.isFinite(before) || !Number.isFinite(after)) continue;
    const hours = after - before;
    if (!hours) continue;
    entries.push({ cardId: row.entityId, title: titleOf(row.entityId), author: nameOf(row.userId),
      at: row.createdAt, hours, total: after });
    const group = groups.get(row.userId) || { userId: row.userId, label: nameOf(row.userId), hours: 0, count: 0 };
    group.hours += hours;
    group.count += 1;
    groups.set(row.userId, group);
  }
  return { entries: entries.sort((a, b) => new Date(b.at) - new Date(a.at)),
    groups: [...groups.values()].sort((a, b) => b.hours - a.hours) };
}
// Only board-scoped, recorded removal snapshots; never invent deleted cards
// whose data was already purged before this feature existed.
function withRemovedCards(cards, history, boardId) {
  const result = new Map(cards.map(card => [card._id, card]));
  for (const row of [...history].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))) {
    const doc = row.previousContent?.document;
    if (row.group !== 'lifecycle' || row.newContent != null || !doc || doc.boardId !== boardId
      || doc._id !== row.entityId || result.has(doc._id)) continue;
    result.set(doc._id, { ...doc, deletedAt: new Date(row.createdAt) });
  }
  return [...result.values()];
}
module.exports = { positionChange, timeAdjustments, withRemovedCards };
