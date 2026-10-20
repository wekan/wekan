// Storage of backup runs (models/lib/backupRuns.js has the rules). Recording
// must never change the outcome of a backup: every write here is best-effort.
import { Mongo } from 'meteor/mongo';
import os from 'os';

const {
  HISTORY_DAYS, DAY_MS, STATUS_RUNNING, runStartDoc, runFinishSet, backupHealth,
  normalizeKeepDays,
} = require('/models/lib/backupRuns');

export const BackupRuns = new Mongo.Collection('backupRuns');

export async function recordRunStart(fields) {
  try {
    // Keep the log bounded.
    await BackupRuns.removeAsync({ startedAt: { $lt: new Date(Date.now() - HISTORY_DAYS * DAY_MS) } });
  } catch (_) { /* best-effort */ }
  try {
    return await BackupRuns.insertAsync(runStartDoc({ ...fields, host: os.hostname() }));
  } catch (e) {
    console.error('[backup] could not record the run start:', e && e.message); // eslint-disable-line no-console
    return null;
  }
}

export async function recordRunFinish(runId, startedAt, result) {
  if (!runId) return;
  try {
    await BackupRuns.updateAsync({ _id: runId, status: STATUS_RUNNING },
      { $set: runFinishSet({ ...result, startedAt }) });
  } catch (e) {
    console.error('[backup] could not record the run result:', e && e.message); // eslint-disable-line no-console
  }
}

export async function recentRuns(selector = {}, limit = 30) {
  return BackupRuns.find(selector, { sort: { startedAt: -1 }, limit }).fetchAsync();
}

export async function currentBackupHealth(schedule, now = new Date()) {
  // Enough instance runs to find the last success behind a run of failures.
  const runs = await recentRuns({ orgId: null }, 200);
  return backupHealth({ runs, schedule, now });
}

// Admin Panel / Attachments / Backup first, then the environment variable
// (models/lib/authConfigCatalog.js), read at every backup.
export function keepDaysSetting() {
  return normalizeKeepDays(require('/server/lib/authConfig').authEnv('BACKUP_KEEP_DAYS'));
}

export { pruneLocalBackups } from './backupPrune';
