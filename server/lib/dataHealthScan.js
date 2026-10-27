import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { getRawDb } from '/server/lib/mongoStartup';
import { runWhenCpuLow, pauseIfBusy } from '/server/lib/cpuMonitor';

// The Meteor half of models/lib/dataHealth.js: runs the read-only data health
// scan at night, keeps its last result, and repairs one check on request
// (server/methods/dataHealth.js). The findings are rows in Admin Panel /
// Problems / Summary (server/lib/systemStatus.js).
//
// One pod at a time: a scan - and a repair, which must not run beside a scan
// or another repair - claims the `runningSince` field of its status document
// atomically, so 24 pods behind one database run it once, and a pod that died
// mid-scan frees the claim after STALE_MS. The nightly claim also requires the
// last scan to be older than EVERY_MS, inside the same atomic update: a pod
// that waited in runWhenCpuLow while another pod finished does not scan again.
// The claim's own timestamp is what releases it, so a pod whose stale claim
// was taken over never clears the claim of the pod that took it.
//
// It only reads, pauses whenever the CPU is busy and runs once a night, so
// there is no switch to turn it off: on 1.1 million cards it took 2.5 minutes.

const { CHECKS, scanDataHealth, repairDataHealth, dataHealthProblems } = require('/models/lib/dataHealth');

export const DataHealth = new Mongo.Collection('dataHealth');
DataHealth.deny({ insert: () => true, update: () => true, remove: () => true });

const SCAN_ID = 'scan';
const STALE_MS = 6 * 60 * 60 * 1000;
const EVERY_MS = 20 * 60 * 60 * 1000;
const PAUSE_MS = 100;
// Server local time. The scan reads every card id once; on 1.1 million cards
// that took about 2.5 minutes.
const NIGHT_HOURS = [1, 2, 3, 4, 5];

const status = () => DataHealth.rawCollection();

// Returns the claim's timestamp, or null when another pod holds the claim (or,
// nightly, when the last scan is recent).
async function claim({ nightly = false } = {}) {
  const now = new Date();
  const filter = {
    _id: SCAN_ID,
    $and: [{ $or: [{ runningSince: null }, { runningSince: { $lt: new Date(now.getTime() - STALE_MS) } }] }],
  };
  if (nightly) {
    filter.$and.push({ $or: [{ at: null }, { at: { $exists: false } }, { at: { $lt: new Date(now.getTime() - EVERY_MS) } }] });
  }
  try {
    await status().findOneAndUpdate(filter, { $set: { runningSince: now } }, { upsert: true });
    return now;
  } catch (error) {
    if (error && error.code === 11000) return null;   // claimed elsewhere, or scanned recently
    throw error;
  }
}

// Only the holder's own claim is cleared.
const release = (claimedAt, set = {}) =>
  status().updateOne({ _id: SCAN_ID, runningSince: claimedAt }, { $set: { ...set, runningSince: null } });

export async function runDataHealthScan({ nightly = false } = {}) {
  const claimedAt = await claim({ nightly });
  if (!claimedAt) return { ran: false, reason: nightly ? 'already-running-or-recent' : 'already-running' };
  try {
    const result = await scanDataHealth(getRawDb(), { pause: () => pauseIfBusy(PAUSE_MS) });
    await release(claimedAt, { ...result, error: null });
    return { ran: true, found: result.results.filter(r => r.count > 0).length };
  } catch (error) {
    await release(claimedAt, { error: String((error && error.message) || error).slice(0, 500) }).catch(() => {});
    throw error;
  }
}

// Start (Problems / Summary), and the rescan after a repair: not waiting for a quiet CPU, the
// admin asked for it. pauseIfBusy still slows it down under load.
export function startDataHealthScan() {
  Meteor.defer(() => {
    runDataHealthScan().catch(error => console.error('[dataHealth] scan failed:', error && error.message));
  });
}

async function last() {
  return status().findOne({ _id: SCAN_ID });
}

// For Problems / Summary: when it last ran and what it found.
export async function dataHealthNow() {
  const doc = await last().catch(() => null);
  return {
    at: (doc && doc.at) || null,
    durationMs: (doc && doc.durationMs) || 0,
    running: !!(doc && doc.runningSince && Date.now() - new Date(doc.runningSince).getTime() < STALE_MS),
    checks: CHECKS.length,
    found: doc && Array.isArray(doc.results) ? doc.results.filter(r => r.count > 0).length : 0,
    error: (doc && doc.error) || null,
  };
}

export async function dataHealthProblemsNow() {
  try {
    return dataHealthProblems(await last());
  } catch (_) {
    return [];
  }
}

// A repair takes the scan's claim: never two repairs at once, and never a repair
// beside a scan whose findings it would change halfway.
export async function repairDataHealthCheck(checkId, { confirmed = false } = {}) {
  const claimedAt = await claim();
  if (!claimedAt) throw new Error('A data health scan or repair is running; try again when it has finished.');
  let fixed;
  try {
    fixed = await repairDataHealth(getRawDb(), checkId, { confirmed: confirmed === true, pause: () => pauseIfBusy(PAUSE_MS) });
  } finally {
    await release(claimedAt).catch(() => {});
  }
  startDataHealthScan();
  return { fixed };
}

if (Meteor.isServer) {
  Meteor.startup(() => {
    Meteor.setInterval(async () => {
      try {
        if (!NIGHT_HOURS.includes(new Date().getHours())) return;
        const doc = await last();
        if (doc && doc.at && Date.now() - new Date(doc.at).getTime() < EVERY_MS) return;
        await runWhenCpuLow('data health scan', () => runDataHealthScan({ nightly: true }), { maxWaitMs: 55 * 60 * 1000 });
      } catch (error) {
        console.error('[dataHealth] nightly scan failed:', error && error.message);
      }
    }, 60 * 60 * 1000);
  });
}

export default { runDataHealthScan, dataHealthNow, dataHealthProblemsNow, repairDataHealthCheck };
