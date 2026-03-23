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
