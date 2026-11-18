import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import ChangeHistory from '/models/changeHistory';
import SecurityLog from '/server/lib/securityLog';
import { runWhenCpuLow, pauseIfBusy } from '/server/lib/cpuMonitor';
import { ensureIndex } from '/server/lib/mongoStartup';
import { SyncedCron } from '/server/cron/syncedCron';

const { historyVerifier, isConcurrentFork } = require('/models/lib/changeHistoryIntegrity');
const PAUSE_MS = 100;
// Rows read between two pauses, and the cursor's batch: what is in memory at once.
const BATCH = 500;

// What this audit has already reported: { _id: '<row>:<reason>', reportedAt }.
// A broken row stays broken, and the audit runs every hour; reporting it again
// each time only grew one Problems row's count (89,062 for a handful of forks)
// and buried what was new. Each finding is reported once.
export const HistoryIntegrityReported = new Mongo.Collection('historyIntegrityReported');
HistoryIntegrityReported.deny({ insert: () => true, update: () => true, remove: () => true });

async function firstReport(failure) {
  try {
    await HistoryIntegrityReported.rawCollection().insertOne({
      _id: `${failure.row._id || 'unknown'}:${failure.reason}`, reportedAt: new Date() });
    return true;
  } catch (error) {
    if (error && error.code === 11000) return false;
    throw error;
  }
}

function report(failure) {
  const where = `row=${failure.row._id || 'unknown'} board=${failure.row.boardId || 'unknown'} ` +
    `expected=${failure.row.integrityHash || 'missing'} previous=${failure.row.previousHash || 'genesis'}`;
  if (isConcurrentFork(failure)) {
    SecurityLog.record({
      key: 'integrity.historyConcurrentFork',
      action: 'detected',
      detail: `background history audit reason=history-fork-concurrent ${where} sibling=${failure.sibling._id || 'unknown'}; ` +
        'two changes on this board were saved at the same moment and name the same previous row - a History writer race, ' +
        'not tampering; undo of these two rows is refused',
    });
    return;
  }
  SecurityLog.record({
    key: 'integrity.history',
    action: 'detected',
    detail: `background history audit reason=${failure.reason} ${where}; ` +
      'username/IP unavailable for background filesystem or database tampering',
  });
}

// Board by board, and within a board row by row: a board's History is never
// in memory at once either. It used to be - fetchAsync() of every row with its
// full content - and one board with a long History took a server past its heap
// limit on the first hourly run after a restart (production log, v13.13). The
// verifier keeps only hashes and small summaries (historyVerifier).
export async function runHistoryIntegrityScan() {
  const raw = ChangeHistory.rawCollection();
  const boardIds = await raw.distinct('boardId', { integrityHash: { $nin: [null, ''] } });
  let checked = 0, failures = 0, reported = 0;
  for (const boardId of boardIds) {
    await pauseIfBusy(PAUSE_MS);
    const verifier = historyVerifier();
    const cursor = raw.find({ boardId, integrityHash: { $nin: [null, ''] } }, { sort: { createdAt: 1 }, batchSize: BATCH });
    try {
      for await (const row of cursor) {
        verifier.add(row);
        checked += 1;
        if (checked % BATCH === 0) await pauseIfBusy(PAUSE_MS);
      }
    } finally {
      await cursor.close().catch(() => {});
    }
    for (const failure of verifier.finish()) {
      failures += 1;
      if (await firstReport(failure)) { reported += 1; report(failure); }
    }
  }
  return { checked, failures, reported };
}

if (Meteor.isServer && process.env.WEKAN_HISTORY_INTEGRITY_SCAN !== 'false') {
  Meteor.startup(() => {
    ensureIndex(HistoryIntegrityReported, { reportedAt: 1 }).catch(() => {});
    // Once an hour for the whole installation, not once per WeKan process: a
    // Meteor.setInterval read the whole History on every pod, 24 times an hour
    // on 24 pods (#6821). SyncedCron runs each scheduled hour on one pod only.
    try {
      SyncedCron.add({
        name: 'wekan-history-integrity-scan',
        schedule(parser) {
          return parser.text('every 1 hour');
        },
        job() {
          return runWhenCpuLow('change history integrity audit', runHistoryIntegrityScan,
            { maxWaitMs: 55 * 60 * 1000 }).catch(() => {});
        },
      });
    } catch (e) {
      console.error('historyIntegrityScan: failed to register cron job', e);
    }
  });
}

export default { runHistoryIntegrityScan };
