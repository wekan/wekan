// Fold the per-event rows an older WeKan wrote into the summaries Admin Panel →
// Problems shows now (models/lib/eventLogSummary.js).
//
// Before this, every guard firing wrote its own document. An instance that has
// been attacked - or that ran a chatty CPU governor for a month - arrives with
// thousands of near-identical rows, and until they are folded the Problems page
// still shows the scroll this replaced, with the new summaries mixed in among
// them. So the old rows are folded once, in place, and removed.
//
// Nothing is lost that the summary does not carry: the count of every old row is
// added up, the earliest becomes `firstAt`, the latest becomes `at`, and the
// latest occurrence's user, address and detail are what the row keeps. What does
// go is one line per attempt, which is the point.
//
// Done in JS rather than an aggregation pipeline so it behaves the same on
// FerretDB as on MongoDB, and in batches so a large collection does not have to
// fit in memory at once. Idempotent: a row with `firstAt` is already a summary
// and is not touched, so a re-run - or a restart in the middle - costs nothing.

import EventLog from '/models/eventLog';

const { foldEvents, summaryIdentity, summaryUpdate } = require('/models/lib/eventLogSummary');

const BATCH = 2000;

export async function foldLegacyEventLogRows({ log = console } = {}) {
  let folded = 0;
  let removed = 0;
  for (;;) {
    // A legacy row is one with no `firstAt`: every summary has one.
    const batch = await EventLog.find(
      { firstAt: { $exists: false } },
      { limit: BATCH },
    ).fetchAsync();
    if (!batch.length) break;

    for (const summary of foldEvents(batch)) {
      const { count, firstAt, at, ...rest } = summary;
      // Add this batch's occurrences to whatever the row already holds - a
      // summary may already exist, from this migration's earlier batches or from
      // a guard that fired while it was running.
      await EventLog.upsertAsync(
        summaryIdentity(rest),
        summaryUpdate(rest, at, count),
      );
      // $setOnInsert cannot lower a firstAt that a later batch turns out to
      // precede, so the earliest is written explicitly when it is earlier.
      const row = await EventLog.findOneAsync(summaryIdentity(rest));
      if (row && (!row.firstAt || firstAt < row.firstAt)) {
        await EventLog.updateAsync({ _id: row._id }, { $set: { firstAt } });
      }
      folded += 1;
    }

    const ids = batch.map(d => d._id);
    await EventLog.removeAsync({ _id: { $in: ids } });
    removed += ids.length;

    // A batch that folds to nothing would loop forever; it cannot, since every
    // row is either folded or removed, but stop on no progress regardless.
    if (!ids.length) break;
  }
  if (removed) {
    log.log(`eventlog: folded ${removed} per-event row(s) into ${folded} problem summary(s).`);
  }
  return { folded, removed };
}
