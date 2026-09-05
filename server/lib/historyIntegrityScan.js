import { Meteor } from 'meteor/meteor';
import ChangeHistory from '/models/changeHistory';
import SecurityLog from '/server/lib/securityLog';
import { runWhenCpuLow, pauseIfBusy } from '/server/lib/cpuMonitor';

const { verifyHistoryRows } = require('/models/lib/changeHistoryIntegrity');
const BATCH = 250;
const PAUSE_MS = 100;

export async function runHistoryIntegrityScan() {
  const rows = await ChangeHistory.find(
    { integrityHash: { $nin: [null, ''] } },
    { sort: { boardId: 1, createdAt: 1 } },
  ).fetchAsync();
  const found = verifyHistoryRows(rows);
  let failures = 0;
  for (let offset = 0; offset < found.length; offset += BATCH) {
    await pauseIfBusy(PAUSE_MS);
    for (const failure of found.slice(offset, offset + BATCH)) {
      failures += 1;
      SecurityLog.record({
        key: 'integrity.history',
        action: 'detected',
        detail: `background history audit reason=${failure.reason} ` +
          `row=${failure.row._id || 'unknown'} board=${failure.row.boardId || 'unknown'} ` +
          `expected=${failure.row.integrityHash || 'missing'} previous=${failure.row.previousHash || 'genesis'}; ` +
          'username/IP unavailable for background filesystem or database tampering',
      });
    }
    await new Promise(resolve => Meteor.setTimeout(resolve, PAUSE_MS));
  }
  return { checked: rows.length, failures };
}

if (Meteor.isServer && process.env.WEKAN_HISTORY_INTEGRITY_SCAN !== 'false') {
  Meteor.startup(() => Meteor.setInterval(() => {
    runWhenCpuLow('change history integrity audit', runHistoryIntegrityScan,
      { maxWaitMs: 55 * 60 * 1000 }).catch(() => {});
  }, 60 * 60 * 1000));
}

export default { runHistoryIntegrityScan };
