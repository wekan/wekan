import { Meteor } from 'meteor/meteor';

let syncedCronConfigured = false;
let syncedCronInstance = null;

function getSyncedCronInstance() {
  if (!syncedCronInstance) {
    syncedCronInstance = require('meteor/quave:synced-cron').SyncedCron;
  }
  return syncedCronInstance;
}

export function configureSyncedCron() {
  if (syncedCronConfigured) {
    return;
  }

  const SyncedCron = getSyncedCronInstance();
  SyncedCron.config({
    log: false,
    collectionName: 'cronJobs',
    utc: false,
    collectionTTL: 172800,
  });

  syncedCronConfigured = true;
}

export function startSyncedCron() {
  configureSyncedCron();
  getSyncedCronInstance().start();
}

export const SyncedCron = new Proxy(
  {},
  {
    get(_target, prop) {
      return getSyncedCronInstance()[prop];
    },
    set(_target, prop, value) {
      getSyncedCronInstance()[prop] = value;
      return true;
    },
  },
);

// Configure before the package's startup hook creates its history collection.
// Registration alone does not start timers (quave:synced-cron's add() only
// schedules immediately once running). The removed migration bootstrap was the
// last caller of startSyncedCron, leaving backups/rules registered but idle.
configureSyncedCron();
Meteor.startup(async () => {
  startSyncedCron();
  // The package makes its collection in its own startup; if it is not there
  // yet, ask again a little later rather than leave the scan in place.
  if (!(await ensureCronIndexes()) && !getSyncedCronInstance()._collection && typeof setTimeout === 'function') {
    setTimeout(() => { ensureCronIndexes(); }, 5000);
  }
});

// #6769: before running a job, synced-cron asks whether one of that name is
// still running - `{ name, finishedAt: { $exists: false } }` - every minute
// for every job on every instance. The package indexes only
// `{ intendedAt, name }` and the TTL on `startedAt`, so that question scanned
// the whole history: thousands of documents with many pods and a 48-hour TTL.
// `{ name, finishedAt }` answers it from the index.
export const CRON_RUNNING_JOB_INDEX = { name: 1, finishedAt: 1 };
export async function ensureCronIndexes() {
  try {
    const collection = getSyncedCronInstance()._collection;
    if (!collection) return false;
    const { ensureIndex } = require('/server/lib/mongoStartup');
    return await ensureIndex(collection, CRON_RUNNING_JOB_INDEX);
  } catch (error) {
    console.error('SyncedCron: could not index the running-job lookup:', error && error.message);
    return false;
  }
}
