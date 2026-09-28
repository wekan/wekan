'use strict';

// A column is identified by board + list, not swimlane or sort position.
// Call after board/list consistency has resolved the final destination.
function stampCardListEntry(card, modifier, at = new Date()) {
  if (!card || !modifier || !Object.keys(modifier).some(key => key.startsWith('$'))) return;
  const set = modifier.$set || {};
  const moved = ['boardId', 'listId'].some(field =>
    typeof set[field] === 'string' && set[field] !== card[field]);
  // This is derived metadata. Ordinary field updates must neither backdate
  // nor clear it; maintenance can deliberately use a direct collection write.
  if (modifier.$set) delete modifier.$set.listEnteredAt;
  if (modifier.$unset) delete modifier.$unset.listEnteredAt;
  if (moved) {
    if (!(at instanceof Date) || !Number.isFinite(at.getTime())) throw new Error('Invalid list entry date');
    modifier.$set = { ...set, listEnteredAt: at };
  }
}

function columnAgeSelector(listId, days, at = new Date()) {
  if (typeof listId !== 'string' || !listId || !Number.isInteger(days) || days < 1 || days > 365000 ||
      !(at instanceof Date) || !Number.isFinite(at.getTime())) return {};
  const cutoff = new Date(at.getTime() - days * 86400000);
  // Unknown legacy ages stay visible; never invent a date from the last edit.
  return { $or: [{ listId: { $ne: listId } }, { listEnteredAt: null }, { listEnteredAt: { $gte: cutoff } }] };
}

module.exports = { stampCardListEntry, columnAgeSelector };
