'use strict';

// Backup history, health and retention (models/lib/backupRuns.js,
// server/lib/backupRuns.js, server/methods/backup.js): every Admin Panel backup
// run is recorded, so "did last night's backup work?" has an answer after a
// restart and on every server; /metrics exports it; BACKUP_KEEP_DAYS prunes
// local backups but always keeps the newest.
// Run: node tests/backupRuns.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const B = require('../models/lib/backupRuns.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const NOW = new Date('2026-10-20T21:00:00Z');
const hoursAgo = h => new Date(NOW.getTime() - h * 3600 * 1000);
const daysAgo = d => hoursAgo(d * 24);
const run = (status, h, over = {}) => ({ status, startedAt: hoursAgo(h), finishedAt: status === 'running' ? undefined : hoursAgo(h - 0.5), orgId: null, ...over });
const daily = { enabled: true, frequency: 'daily' };

test('BACKUP_KEEP_DAYS: off unless a positive whole number of days', () => {
  assert.strictEqual(B.normalizeKeepDays('7'), 7);
  assert.strictEqual(B.normalizeKeepDays("'14'"), 14);
  for (const off of [undefined, null, '', '0', '-1', '1.5', 'week', '99999']) assert.strictEqual(B.normalizeKeepDays(off), 0, String(off));
});

test('a run starts as running, with trigger, scope, storage and options', () => {
  const doc = B.runStartDoc({ trigger: 'scheduled', storage: 's3', opts: { data: 1, attachments: 0 }, host: 'pod-1', now: NOW });
  assert.deepStrictEqual(doc, {
    startedAt: NOW, status: 'running', trigger: 'scheduled', userId: null, orgId: null,
    storage: 's3', opts: { attachments: false, avatars: false, data: true }, host: 'pod-1',
  });
  assert.strictEqual(B.runStartDoc({ trigger: 'anything', now: NOW }).trigger, 'manual');
  assert.strictEqual(B.runStartDoc({ now: NOW }).storage, 'filesystem');
});

test('a run ends as success with file, size and pruned count, or as failed with the error', () => {
  const ok = B.runFinishSet({ ok: true, startedAt: hoursAgo(1), file: '/f/backup.zip', size: 1234, pruned: 2, now: NOW });
  assert.deepStrictEqual(ok, { status: 'success', finishedAt: NOW, durationMs: 3600000, file: '/f/backup.zip', size: 1234, pruned: 2 });
  const failed = B.runFinishSet({ ok: false, startedAt: hoursAgo(1), error: new Error('disk full'), now: NOW });
  assert.deepStrictEqual(failed, { status: 'failed', finishedAt: NOW, durationMs: 3600000, error: 'disk full' });
  assert.strictEqual(B.runFinishSet({ ok: false, startedAt: NOW, error: 'x'.repeat(900), now: NOW }).error.length, 500);
});

test('a run still "running" after 24 hours counts as failed (its server went away)', () => {
  assert.strictEqual(B.effectiveStatus(run('running', 2), NOW), 'running');
  assert.strictEqual(B.effectiveStatus(run('running', 25), NOW), 'failed');
  assert.strictEqual(B.effectiveStatus(run('success', 25), NOW), 'success');
});

test('health: ok after a recent success', () => {
  const h = B.backupHealth({ runs: [run('success', 1)], schedule: daily, now: NOW });
  assert.strictEqual(h.state, 'ok');
  assert.strictEqual(h.overdue, false);
});

test('health: failed when the last finished run failed, even with an older success', () => {
  const h = B.backupHealth({ runs: [run('failed', 1, { error: 'disk full' }), run('success', 25)], schedule: daily, now: NOW });
  assert.strictEqual(h.state, 'failed');
  assert.strictEqual(h.lastRun.error, 'disk full');
  assert.deepStrictEqual(h.lastSuccessAt, hoursAgo(24.5));
});

test('health: overdue when the schedule ran out without a success', () => {
  const h = B.backupHealth({ runs: [run('success', 30)], schedule: daily, now: NOW });
  assert.strictEqual(h.state, 'overdue');
  assert.strictEqual(h.overdue, true);
  // Without a schedule nothing is ever overdue.
  assert.strictEqual(B.backupHealth({ runs: [run('success', 30)], schedule: null, now: NOW }).state, 'ok');
  // Weekly allows a week.
  assert.strictEqual(B.backupHealth({ runs: [run('success', 6 * 24)], schedule: { enabled: true, frequency: 'weekly' }, now: NOW }).state, 'ok');
});

test('health: never, and running, before the first success', () => {
  assert.strictEqual(B.backupHealth({ runs: [], schedule: daily, now: NOW }).state, 'never');
  assert.strictEqual(B.backupHealth({ runs: [run('running', 0.1)], schedule: daily, now: NOW }).state, 'running');
});

test('health counts only instance runs, not organization backups', () => {
  const h = B.backupHealth({ runs: [run('failed', 1, { orgId: 'o1' }), run('success', 2)], schedule: daily, now: NOW });
  assert.strictEqual(h.state, 'ok');
});

test('a stale running run makes health failed', () => {
  const h = B.backupHealth({ runs: [run('running', 30), run('success', 50)], schedule: null, now: NOW });
  assert.strictEqual(h.state, 'failed');
});

test('metrics lines for Prometheus', () => {
  const ok = B.backupMetricsLines(B.backupHealth({ runs: [run('success', 1)], schedule: daily, now: NOW }));
  assert.match(ok, new RegExp(`^wekan_backup_last_success_timestamp_seconds ${Math.floor(hoursAgo(0.5).getTime() / 1000)}$`, 'm'));
  assert.match(ok, /^wekan_backup_last_run_success 1$/m);
  assert.match(ok, /^wekan_backup_overdue 0$/m);
  assert.match(ok, /^# TYPE wekan_backup_overdue gauge$/m);
  const bad = B.backupMetricsLines(B.backupHealth({ runs: [run('failed', 1)], schedule: daily, now: NOW }));
  assert.match(bad, /^wekan_backup_last_run_success 0$/m);
  assert.match(bad, /^wekan_backup_last_success_timestamp_seconds 0$/m);
  assert.match(bad, /^wekan_backup_overdue 1$/m);
});

test('retention: older than N days of the same scope, never the newest', () => {
  const backups = [
    { path: '/b/1', datetime: daysAgo(1), orgId: null },
    { path: '/b/8', datetime: daysAgo(8), orgId: null },
    { path: '/b/30', datetime: daysAgo(30), orgId: null },
    { path: '/b/org-old', datetime: daysAgo(30), orgId: 'o1' },
  ];
  assert.deepStrictEqual(B.backupsToPrune({ backups, keepDays: 7, now: NOW }).map(b => b.path), ['/b/8', '/b/30']);
  assert.deepStrictEqual(B.backupsToPrune({ backups, keepDays: 7, orgId: 'o1', now: NOW }).map(b => b.path), [],
    'the only backup of a scope is kept however old');
  assert.deepStrictEqual(B.backupsToPrune({ backups, keepDays: 0, now: NOW }), []);
});

test('retention: after weeks of failures the newest old backup survives', () => {
  const backups = [{ path: '/b/20', datetime: daysAgo(20) }, { path: '/b/21', datetime: daysAgo(21) }];
  assert.deepStrictEqual(B.backupsToPrune({ backups, keepDays: 7, now: NOW }).map(b => b.path), ['/b/21']);
});

test('pruning on disk removes old backup directories and empty date folders, nothing else', () => {
  const os = require('os');
  const { pruneLocalBackups } = require('../server/lib/backupPrune.js');
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wekan-backup-'));
  const mk = (rel, age) => {
    const dir = path.join(root, rel);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'backup.zip'), 'zip');
    fs.writeFileSync(path.join(dir, 'meta.json'), '{}');
    return { path: path.join(dir, 'backup.zip'), datetime: daysAgo(age), orgId: null };
  };
  const newest = mk('2026/10/19/20_30_00', 1);
  const old = mk('2026/09/01/20_30_00', 49);
  const outside = { path: path.join(os.tmpdir(), 'not-a-backup', 'backup.zip'), datetime: daysAgo(90), orgId: null };
  const quiet = { log() {}, error() {} };
  const removed = pruneLocalBackups({ backups: [newest, old, outside], backupRoot: root, keepDays: 7, now: NOW, log: quiet });
  assert.strictEqual(removed, 1);
  assert.ok(fs.existsSync(newest.path), 'the newest backup is kept');
  assert.ok(!fs.existsSync(path.dirname(old.path)), 'the old backup directory is gone');
  assert.ok(!fs.existsSync(path.join(root, '2026', '09')), 'its empty date folders are gone');
  assert.ok(fs.existsSync(path.join(root, '2026', '10')), 'folders with other backups stay');
  assert.ok(fs.existsSync(root), 'the root stays');
  fs.rmSync(root, { recursive: true, force: true });
});

const read = p => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');

test('every backup is recorded at start and at the end, success or failure', () => {
  const src = read('server/methods/backup.js');
  assert.match(src, /const runId = await recordRunStart\(\{ trigger, userId, orgId,/);
  assert.match(src, /await recordRunFinish\(runId, startedAt, \{ ok: true, file: dest, size, pruned \}\)/);
  assert.match(src, /await recordRunFinish\(runId, startedAt, \{ ok: false, error: e \}\)/);
  assert.match(src, /doBackup\([^)]*\{ trigger: 'scheduled' \}\)/);
  assert.match(src, /\{ trigger: 'manual', userId: this\.userId \}/);
  // A skipped scheduled run is recorded, not silently dropped.
  assert.match(src, /skipped: another backup was still running/);
  assert.match(src, /async backupHistory\(\)/);
});

test('/metrics includes the backup health', () => {
  const src = read('models/server/metrics.js');
  assert.match(src, /metricsRes \+= backupMetricsLines\(await backupHealthNow\(\)\)/);
});

test('the status and history UI uses only translation keys that exist', () => {
  const jade = read('client/components/settings/backupRunsStatus.jade');
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  const keys = [...jade.matchAll(/\{\{_ '([^']+)'\}\}/g)].map(m => m[1]);
  assert.ok(keys.length >= 10);
  for (const key of keys) assert.ok(key in en, `missing translation key ${key}`);
});

test('the status is shown in Attachments / Backup and in Problems / Settings / Backup', () => {
  assert.match(read('client/components/settings/attachments.jade'), /^\s+\+backupRunsStatus$/m);
  const problemsJs = read('client/components/settings/adminProblems.js');
  const menu = problemsJs.slice(problemsJs.indexOf('const PROBLEMS_MENU'), problemsJs.indexOf('];', problemsJs.indexOf('const PROBLEMS_MENU')));
  const at = needle => menu.indexOf(needle);
  assert.ok(at("{ id: 'features-backup', icon: 'fa-archive', labelKey: 'backup' }") > at("{ heading: true, labelKey: 'settings' }"));
  assert.ok(at("{ id: 'features-backup'") < at("{ heading: true, labelKey: 'reports' }"), 'under Settings, above Reports');
  assert.match(read('client/components/settings/adminProblems.jade'), /isPane 'features-backup'\s+\+backupRunsStatus\(settingsLink=true\)/);
  assert.match(read('models/lib/adminUrls.js'), /backup: 'features-backup'/);
  const imports = read('client/features/settings.js');
  assert.match(imports, /backupRunsStatus\.jade/);
  assert.match(imports, /backupRunsStatus\.js/);
});

test('a failed or overdue backup is a problem on Problems / Summary', () => {
  const failed = B.backupProblem(B.backupHealth({ runs: [run('failed', 1, { error: 'disk full' })], schedule: daily, now: NOW }));
  assert.strictEqual(failed.id, 'backup-failed');
  assert.strictEqual(failed.severity, 'error');
  assert.match(failed.detail, /disk full/);
  const overdue = B.backupProblem(B.backupHealth({ runs: [run('success', 40)], schedule: daily, now: NOW }));
  assert.strictEqual(overdue.id, 'backup-overdue');
  assert.match(overdue.detail, /last successful backup was 2026-10-19 05:30 UTC/);
  const never = B.backupProblem(B.backupHealth({ runs: [], schedule: daily, now: NOW }));
  assert.match(never.detail, /no backup has succeeded yet/);
  assert.strictEqual(B.backupProblem(B.backupHealth({ runs: [run('success', 1)], schedule: daily, now: NOW })), null);
  // No schedule and never backed up is not reported: backups are optional.
  assert.strictEqual(B.backupProblem(B.backupHealth({ runs: [], schedule: null, now: NOW })), null);
  assert.match(read('server/lib/systemStatus.js'), /extraProblems: \[await backupProblemNow\(\)\]\.filter\(Boolean\)/);
});

test('BACKUP_KEEP_DAYS is documented in the compose files, start scripts and snap config', () => {
  const files = fs.readdirSync(path.join(__dirname, '..'))
    .filter(f => /^docker-compose.*\.yml$/.test(f) && read(f).includes('USERS_DISABLE_INACTIVE_AFTER_DAYS'));
  for (const f of [...files, 'start-wekan.sh', 'start-wekan.bat', 'snap-src/bin/config', 'docs/Backup/Backup.md']) {
    assert.ok(read(f).includes('BACKUP_KEEP_DAYS'), `${f} lacks BACKUP_KEEP_DAYS`);
  }
});

// BACKUP_KEEP_DAYS is overridable in Admin Panel / Attachments / Backup.
test('BACKUP_KEEP_DAYS is in the Admin Panel, which wins over the environment', () => {
  const { AUTH_CONFIG_SECTIONS, resolveAuthEnv } = require('../models/lib/authConfigCatalog.js');
  const fields = AUTH_CONFIG_SECTIONS.backup.fields;
  assert.deepStrictEqual(fields.map(f => [f.envVar, f.type, f.storage]), [['BACKUP_KEEP_DAYS', 'number', 'backupOptions']]);
  assert.strictEqual(resolveAuthEnv('BACKUP_KEEP_DAYS', { backupOptions: { keepDays: 14 } }, { BACKUP_KEEP_DAYS: '7' }), '14');
  assert.strictEqual(resolveAuthEnv('BACKUP_KEEP_DAYS', { backupOptions: {} }, { BACKUP_KEEP_DAYS: '7' }), '7', 'empty falls back');
  const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
  assert.match(read('server/lib/backupRuns.js'), /normalizeKeepDays\(require\('\/server\/lib\/authConfig'\)\.authEnv\('BACKUP_KEEP_DAYS'\)\)/);
  // negative: nothing reads the variable around the Admin Panel
  for (const file of ['server/lib/backupRuns.js', 'server/methods/backup.js', 'server/lib/backupPrune.js']) {
    assert.doesNotMatch(read(file), /process\.env\.BACKUP_KEEP_DAYS/, file);
  }
  assert.match(read('client/components/settings/attachments.jade'), /\+authProviderSettings\(backupOptionsData\)/);
  assert.match(read('models/settings.js'), /backupOptions: \{ type: Object, optional: true, blackbox: true \}/);
});

console.log(`\n${passed} tests passed`);
