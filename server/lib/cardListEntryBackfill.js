'use strict';

const { ENTRY_EVENTS, listEntryBackfillSelector, createListEntryHistory, acceptListEntryEvent, finishListEntryHistory } = require('../../models/lib/cardListEntryHistory');

// Native collections are injected so the production migration is exercised
// against real MongoDB in isolation. Raw writes intentionally skip activity,
// rules and schema auto-values: this restores metadata, not a new user move.
async function backfillCardListEntries({ cards, activities, at = new Date(), onProgress = () => {} }) {
  const result = { columnDatesScanned: 0, columnDatesRestored: 0, columnDatesUnknown: 0, columnDatesRaced: 0, columnDatesPending: 0 };
  let lastId;
  while (true) {
    const query = { listEnteredAt: null };
    if (lastId !== undefined) query._id = { $gt: lastId };
    const batch = await cards.find(query, { projection: {
      _id: 1, boardId: 1, listId: 1, listEnteredAt: 1, modifiedAt: 1, dateLastActivity: 1,
    } }).sort({ _id: 1 }).limit(250).toArray();
    if (!batch.length) break;
    for (const card of batch) {
      const events = activities.find({ cardId: card._id, activityType: { $in: ENTRY_EVENTS } },
        { projection: { cardId: 1, activityType: 1, boardId: 1, oldBoardId: 1, listId: 1, oldListId: 1, createdAt: 1 } })
        .sort({ createdAt: 1 }).batchSize(250);
      const history = createListEntryHistory(card, at);
      try {
        for await (const event of events) {
          acceptListEntryEvent(history, event);
          if (history.invalid) break;
        }
      } finally { await events.close(); }
      const inferred = finishListEntryHistory(history);
      result.columnDatesScanned++;
      if (!inferred) result.columnDatesUnknown++;
      else {
        const saved = await cards.updateOne(listEntryBackfillSelector(card), { $set: { listEnteredAt: inferred } });
        if (saved.modifiedCount === 1) result.columnDatesRestored++;
        else {
          result.columnDatesRaced++;
          const current = await cards.findOne({ _id: card._id }, { projection: { listEnteredAt: 1 } });
          if (current && current.listEnteredAt == null) result.columnDatesPending++;
        }
      }
    }
    lastId = batch[batch.length - 1]._id;
    await onProgress({ ...result });
  }
  return result;
}

module.exports = { backfillCardListEntries };
