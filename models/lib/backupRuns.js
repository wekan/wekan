'use strict';

// Backup history, health and retention for Admin Panel / Attachments / Backup.
// Pure decisions only - tests/backupRuns.test.cjs runs them without a server.
// server/lib/backupRuns.js stores the runs; server/methods/backup.js records
// them; models/server/metrics.js exports the health to Prometheus.
//
// Why: the backup's progress lived only in the memory of the server process
// that ran it. After a restart, or on another pod of a multi-pod deployment,
// the Admin Panel showed "idle" - nobody could see whether last night's backup
// had worked. Every run is now a document in `backupRuns`, so the result
// survives restarts and every server shows the same history.

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const MAX_KEEP_DAYS = 3650;
// A run still "running" after this long died with its server (pod killed,
// out of memory, upgrade). Shown and counted as failed.
const STALE_RUNNING_MS = 24 * HOUR_MS;
// History documents older than this are removed; the history is a log, not an
// archive.
const HISTORY_DAYS = 400;
const STATUS_RUNNING = 'running';
const STATUS_SUCCESS = 'success';
const STATUS_FAILED = 'failed';

function toTime(value) {
  if (!value) return NaN;
  const date = value instanceof Date ? value : new Date(value);
  return date.getTime();
}

// BACKUP_KEEP_DAYS: a whole number of days from 1 to MAX_KEEP_DAYS, else 0 (keep
// every backup, as before).
function normalizeKeepDays(value) {
  if (value === undefined || value === null) return 0;
  const text = String(value).trim().replace(/^(['"])(.*)\1$/, '$2').trim();
  if (!/^\d+$/.test(text)) return 0;
  const days = Number(text);
  return days >= 1 && days <= MAX_KEEP_DAYS ? days : 0;
}

// The document inserted when a run starts.
function runStartDoc({ trigger, userId = null, orgId = null, storage, opts = {}, host = '', now = new Date() }) {
  return {
    startedAt: now,
    status: STATUS_RUNNING,
    trigger: trigger === 'scheduled' ? 'scheduled' : 'manual',
    userId: userId || null,
    orgId: orgId || null,
    storage: storage || 'filesystem',
    opts: { attachments: !!opts.attachments, avatars: !!opts.avatars, data: !!opts.data },
    host: String(host || '').slice(0, 200),
  };
}

// The $set written when it ends.
function runFinishSet({ ok, startedAt, file = null, size = null, error = null, pruned = 0, now = new Date() }) {
  const set = {
    status: ok ? STATUS_SUCCESS : STATUS_FAILED,
    finishedAt: now,
    durationMs: Math.max(0, toTime(now) - toTime(startedAt)) || 0,
  };
  if (ok) {
    if (file) set.file = String(file);
    if (Number.isFinite(size)) set.size = size;
    if (pruned) set.pruned = pruned;
  } else {
    set.error = String(error && error.message ? error.message : error || 'unknown error').slice(0, 500);
  }
  return set;
}

// The status to SHOW: a run still marked running long after it started is a
// run whose server went away.
function effectiveStatus(run, now = new Date()) {
  if (!run) return null;
  if (run.status === STATUS_RUNNING && toTime(now) - toTime(run.startedAt) > STALE_RUNNING_MS) {
    return STATUS_FAILED;
  }
  return run.status;
}

// How long a scheduled backup may be missing before it counts as overdue: the
// period plus a two-hour grace for a slow run or a server restart.
function expectedIntervalMs(schedule) {
  if (!schedule || !schedule.enabled) return null;
  const grace = 2 * HOUR_MS;
  switch (schedule.frequency) {
    case 'daily': return DAY_MS + grace;
    case 'weekly': return 7 * DAY_MS + grace;
    case 'monthly': return 31 * DAY_MS + grace;
    default: return null;
  }
}

/**
 * Health of the INSTANCE backup (organization backups are on demand and do
 * not count). `runs` newest first.
 *   state: 'ok'       last run succeeded, and (if scheduled) not overdue
 *          'failed'   the last finished run failed
 *          'overdue'  scheduled, and the last success is older than the period
 *          'never'    no successful backup at all
 *          'running'  a run is in progress and nothing has failed since the last success
 */
function backupHealth({ runs = [], schedule = null, now = new Date() } = {}) {
  const instance = runs.filter(r => r && !r.orgId);
  const lastRun = instance[0] || null;
  const lastSuccess = instance.find(r => effectiveStatus(r, now) === STATUS_SUCCESS) || null;
  const lastFinished = instance.find(r => effectiveStatus(r, now) !== STATUS_RUNNING) || null;
  const interval = expectedIntervalMs(schedule);
  const successTime = lastSuccess ? toTime(lastSuccess.finishedAt || lastSuccess.startedAt) : NaN;
  const overdue = !!interval && (Number.isNaN(successTime) || toTime(now) - successTime > interval);
  let state;
  if (lastFinished && effectiveStatus(lastFinished, now) === STATUS_FAILED) state = 'failed';
  else if (!lastSuccess) state = lastRun && effectiveStatus(lastRun, now) === STATUS_RUNNING ? 'running' : 'never';
  else if (overdue) state = 'overdue';
  else state = 'ok';
  return {
    state,
    overdue,
    lastRun,
    lastRunStatus: effectiveStatus(lastRun, now),
    lastSuccess,
    lastSuccessAt: lastSuccess ? new Date(successTime) : null,
  };
}

// Prometheus lines for /metrics, so monitoring can alert on a failed or missing
// backup without anybody opening the Admin Panel.
function backupMetricsLines(health) {
  const h = health || {};
  const seconds = d => (d ? Math.floor(toTime(d) / 1000) : 0);
  const lastRunAt = h.lastRun ? (h.lastRun.finishedAt || h.lastRun.startedAt) : null;
  return [
    '# HELP wekan_backup_last_success_timestamp_seconds Unix time of the last successful instance backup (0 = never)',
    '# TYPE wekan_backup_last_success_timestamp_seconds gauge',
    `wekan_backup_last_success_timestamp_seconds ${seconds(h.lastSuccessAt)}`,
    '# HELP wekan_backup_last_run_timestamp_seconds Unix time the last instance backup run ended (or started, while running)',
    '# TYPE wekan_backup_last_run_timestamp_seconds gauge',
    `wekan_backup_last_run_timestamp_seconds ${seconds(lastRunAt)}`,
    '# HELP wekan_backup_last_run_success 1 if the last finished instance backup succeeded, else 0',
    '# TYPE wekan_backup_last_run_success gauge',
    `wekan_backup_last_run_success ${h.state === 'ok' || h.state === 'overdue' ? 1 : 0}`,
    '# HELP wekan_backup_overdue 1 if a scheduled instance backup has not succeeded within its period',
    '# TYPE wekan_backup_overdue gauge',
    `wekan_backup_overdue ${h.overdue ? 1 : 0}`,
  ].join('\n') + '\n';
}

// The entry for Admin Panel / Problems / Summary,
// or null when the backup is fine: a failed or missing backup IS a problem, and
// Summary is the page an admin checks for problems. English, like the other
// detected problems (models/lib/problemsOverview.js).
function backupProblem(health) {
  if (!health) return null;
  const iso = d => (d ? new Date(d).toISOString().replace('T', ' ').slice(0, 16) + ' UTC' : '');
  const where = 'See Admin Panel / Problems / Backup.';
  if (health.state === 'failed') {
    const run = health.lastRun || {};
    return {
      id: 'backup-failed',
      severity: 'error',
      title: 'Backup failed',
      detail: `The last backup (${iso(run.startedAt)}) failed: ${run.error || 'interrupted'}. ${where}`,
    };
  }
  if (health.overdue) {
    return {
      id: 'backup-overdue',
      severity: 'warning',
      title: 'Backup overdue',
      detail: health.lastSuccessAt
        ? `A backup schedule is on, but the last successful backup was ${iso(health.lastSuccessAt)}. ${where}`
        : `A backup schedule is on, but no backup has succeeded yet. ${where}`,
    };
  }
  return null;
}

/**
 * Which local backups to delete under BACKUP_KEEP_DAYS. `backups` are
 * { path, datetime, orgId } as listBackups returns them. Only backups of the
 * same scope (`orgId`, null = instance) are considered, and the newest one of
 * that scope is ALWAYS kept, whatever its age - retention must never leave you
 * with no backup at all.
 */
function backupsToPrune({ backups = [], keepDays, orgId = null, now = new Date() }) {
  if (!keepDays) return [];
  const scope = (backups || [])
    .filter(b => b && b.path && (b.orgId || null) === (orgId || null) && !Number.isNaN(toTime(b.datetime)))
    .sort((a, b) => toTime(b.datetime) - toTime(a.datetime));
  const limit = toTime(now) - keepDays * DAY_MS;
  return scope.slice(1).filter(b => toTime(b.datetime) <= limit);
}

module.exports = {
  DAY_MS,
  STALE_RUNNING_MS,
  HISTORY_DAYS,
  STATUS_RUNNING,
  STATUS_SUCCESS,
  STATUS_FAILED,
  normalizeKeepDays,
  runStartDoc,
  runFinishSet,
  effectiveStatus,
  expectedIntervalMs,
  backupHealth,
  backupMetricsLines,
  backupProblem,
  backupsToPrune,
};
