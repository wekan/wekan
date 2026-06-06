import Cards from '/models/cards';

// ============================================================================
// Memory-safe, idempotent backfill of a denormalized board id onto card-related
// collections (checklists, checklist items, comments).
//
// It must NOT load every document into memory (an early version used
// `.fetchAsync()` over all rows plus `ReactiveCache.getCard()` per row, which
// cached every card and ran the server out of heap on large databases). Instead
// it streams the Cards collection one document at a time and issues a single
// multi-update per card for the rows that are still missing the board id, so
// peak memory is one card document regardless of database size.
//
// Idempotent: a cheap `findOne` guard skips the whole pass once every row has a
// board id, and the `{ [boardField]: { $exists: false } }` filter makes each
// per-card update a no-op after the first run.
// ============================================================================
export async function backfillBoardIdFromCard(
  collection,
  { cardField = 'cardId', boardField = 'boardId', label = 'collection' } = {},
) {
  try {
    const anyMissing = await collection.findOneAsync(
      { [boardField]: { $exists: false } },
      { fields: { _id: 1 } },
    );
    if (!anyMissing) return; // already fully backfilled — nothing to do

    let processedCards = 0;
    const cursor = Cards.find({}, { fields: { _id: 1, boardId: 1 } });
    await cursor.forEachAsync(async card => {
      if (!card.boardId) return;
      await collection.direct.updateAsync(
        { [cardField]: card._id, [boardField]: { $exists: false } },
        { $set: { [boardField]: card.boardId } },
        { multi: true },
      );
      processedCards += 1;
    });
    console.log(`[${label}] Backfilled ${boardField} (scanned ${processedCards} cards).`);
  } catch (e) {
    console.error(`[${label}] Failed to backfill ${boardField}:`, e);
  }
}
