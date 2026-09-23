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
Meteor.startup(startSyncedCron);
