import { MongoInternals } from 'meteor/mongo';
import Cards from '/models/cards';

// ============================================================================
// Memory-safe, idempotent backfill of a denormalized board id onto card-related
// collections (checklists, checklist items, comments).
//
// It must NOT load every document into memory (an early version used
// `.fetchAsync()` over all rows plus `ReactiveCache.getCard()` per row, which
// cached every card and ran the server out of heap on large databases).
//
// It must also not scan every CARD (#6533). The next version streamed the whole
// Cards collection and issued one multi-update per card - 130,947 cards on the
// reporter's instance, so ~131k writes per collection on EVERY boot, because the
// "is there anything left to do" guard could never go quiet: a checklist whose
// card has been deleted has no board id to copy and stays missing one forever.
// On a server that was already restarting in a loop that was a constant stream
// of writes into SQLite, and part of the load being reported.
//
// So the work is driven by the ROWS THAT ARE MISSING the board id - normally
// none - and never by the size of the card collection:
//
//   1. one findOne says whether any row is missing it at all;
//   2. the rows missing it are streamed and their DISTINCT card ids collected in
//      bounded chunks, so peak memory is one chunk of ids;
//   3. each chunk asks Cards for just those ids and issues one multi-update per
//      card that has a board id;
//   4. rows whose card is gone, or whose card has no board id, cannot be filled
//      from a card at all: they are counted and reported once, not retried on
//      every boot for the rest of the instance's life.
//
// And the pass is VERSION-GATED like the schema upgrade beside it
// (server/lib/schemaUpgradeSteps.js): after a completed pass the WeKan version
// goes into the `_wekan_migration` marker, so a boot on an unchanged version
// costs one findOne. A new release re-checks once. Force a re-check with
// WEKAN_FORCE_SCHEMA_UPGRADE=true.
// ============================================================================

const MARKER_COLL = '_wekan_migration';

// How many distinct card ids are resolved per round trip.
const CHUNK = 1000;

function appVersion() {
  try {
    return require('/package.json').version || '';
  } catch (e) {
    return '';
  }
}

// The raw driver collection for the marker: it is bookkeeping, not app data, so
// it has no Meteor collection, no schema and no hooks.
function markerCollection() {
  const db = MongoInternals.defaultRemoteCollectionDriver()?.mongo?.db;
  return db ? db.collection(MARKER_COLL) : null;
}

export async function backfillBoardIdFromCard(
  collection,
  { cardField = 'cardId', boardField = 'boardId', label = 'collection' } = {},
) {
  try {
    const marker = markerCollection();
    const markerId = `backfill-${boardField}-${label}`;
    const version = appVersion();
    const forced = process.env.WEKAN_FORCE_SCHEMA_UPGRADE === 'true';

    if (marker && !forced) {
      const done = await marker.findOne({ _id: markerId });
      if (done && done.version === version) return; // done for this version
    }

    const anyMissing = await collection.findOneAsync(
      { [boardField]: { $exists: false } },
      { fields: { _id: 1 } },
    );

    let filled = 0;
    let unresolved = 0;

    if (anyMissing) {
      const cursor = collection.find(
        { [boardField]: { $exists: false } },
        { fields: { _id: 1, [cardField]: 1 } },
      );

      let chunk = new Set();

      const flush = async () => {
        if (chunk.size === 0) return;

        const ids = [...chunk];
        chunk = new Set();

        const cards = await Cards.find(
          { _id: { $in: ids } },
          { fields: { _id: 1, boardId: 1 } },
        ).fetchAsync();

        for (const card of cards) {
          if (!card.boardId) continue;

          const n = await collection.direct.updateAsync(
            { [cardField]: card._id, [boardField]: { $exists: false } },
            { $set: { [boardField]: card.boardId } },
            { multi: true },
          );
          filled += n || 0;
        }
      };

      await cursor.forEachAsync(async row => {
        const id = row[cardField];
        if (!id) return;

        chunk.add(id);
        if (chunk.size >= CHUNK) await flush();
      });

      await flush();

      unresolved = await collection
        .find({ [boardField]: { $exists: false } })
        .countAsync();

      console.log(
        `[${label}] Backfilled ${boardField} on ${filled} row(s)` +
        (unresolved ? `; ${unresolved} row(s) have no card to take it from` : '') + '.',
      );
    }

    if (marker) {
      await marker.updateOne(
        { _id: markerId },
        { $set: { version, at: new Date(), filled, unresolved } },
        { upsert: true },
      );
    }
  } catch (e) {
    // Never fatal: this runs in the background at startup, and a database that
    // is momentarily busy must not cost the server its boot (#6533).
    console.error(
      `[${label}] Failed to backfill ${boardField} (will retry next start):`,
      (e && e.message) || e,
    );
  }
}
