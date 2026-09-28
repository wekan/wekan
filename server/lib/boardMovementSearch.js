import { CARD_MOVEMENT_EVENTS, cardMovementRange } from '../../models/lib/cardMovementRange.js';

export async function boardMovementSearch({ cards, activities, scope, start, end, stopped = () => false }) {
  const createdAt = cardMovementRange(start, end);
  if (!createdAt) return [];
  const matched = new Set();
  let after;
  while (!stopped()) {
    const batch = await cards.find({ $and: [scope, ...(after ? [{ _id: { $gt: after } }] : [])] },
      { projection: { _id: 1 } }).sort({ _id: 1 }).limit(250).toArray();
    if (!batch.length) break;
    const ids = batch.map(card => card._id), allowed = new Set(ids);
    const cursor = activities.find({ boardId: scope.boardId, cardId: { $in: ids },
      activityType: { $in: CARD_MOVEMENT_EVENTS }, createdAt }, { projection: { cardId: 1 } }).batchSize(250);
    try {
      for await (const row of cursor) {
        if (stopped()) return [];
        if (allowed.has(row.cardId)) matched.add(row.cardId);
      }
    } finally { await cursor.close(); }
    after = batch[batch.length - 1]._id;
  }
  return stopped() ? [] : [...matched];
}
