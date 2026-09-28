// Read-only, bounded-batch join. Callers supply an authorized card scope.
// No child text or unverified child cardId is returned to the client.
export async function boardTextSearch({ cards, children, scope, term, stopped = () => false }) {
  const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  const matches = new Set();
  let after;
  while (!stopped()) {
    const batch = await cards.find({ $and: [scope, ...(after ? [{ _id: { $gt: after } }] : [])] },
      { projection: { _id: 1, title: 1, description: 1 } }).sort({ _id: 1 }).limit(250).toArray();
    if (!batch.length) break;
    const ids = batch.map(card => card._id), allowed = new Set(ids);
    for (const card of batch) {
      if ([card.title, card.description].some(text => typeof text === 'string' && regex.test(text))) matches.add(card._id);
    }
    for (const { collection, field } of children) {
      if (stopped()) return [];
      const cursor = collection.find({ cardId: { $in: ids }, boardId: scope.boardId, [field]: regex },
        { projection: { cardId: 1 } }).batchSize(250);
      try {
        for await (const row of cursor) if (allowed.has(row.cardId)) matches.add(row.cardId);
      } finally { await cursor.close(); }
    }
    after = batch[batch.length - 1]._id;
  }
  return stopped() ? [] : [...matches];
}
