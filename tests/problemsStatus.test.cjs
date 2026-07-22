'use strict';

// Tests for the Admin Panel / Problems "Status" overview and its snap mirror:
//   - models/lib/loginProblems.js  (login-page "Must be logged in" causes)
//   - models/lib/problemsOverview.js (the overview builder)
//   - source guards for the server hub / method / startup pass / snap command.
// Run: node tests/problemsStatus.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { loginProblemChecks } = require('../models/lib/loginProblems');
const { buildProblemsOverview } = require('../models/lib/problemsOverview');

let passed = 0;
function check(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
const byId = (checks, id) => checks.find(c => c.id === id);

// ── loginProblemChecks ────────────────────────────────────────────────────────
check('migration-in-progress is a warning when active, ok when idle', () => {
  const active = byId(loginProblemChecks({ migrationActive: true, rootUrl: 'https://x' }), 'migration-in-progress');
  assert.strictEqual(active.severity, 'warning');
  assert.strictEqual(active.ok, false);
  const idle = byId(loginProblemChecks({ migrationActive: false, rootUrl: 'https://x' }), 'migration-in-progress');
  assert.strictEqual(idle.ok, true);
});

check('migration-in-progress detail names BOTH login symptoms', () => {
  const c = byId(loginProblemChecks({ migrationActive: true, rootUrl: 'https://x' }), 'migration-in-progress');
  assert.ok(/Must be logged in/.test(c.detail), 'names the "Must be logged in" symptom');
  assert.ok(/Loading, please wait/.test(c.detail), 'names the "Loading, please wait" spinner symptom');
});

check('ROOT_URL unset is an error; set is ok', () => {
  assert.strictEqual(byId(loginProblemChecks({ rootUrl: '' }), 'root-url').severity, 'error');
  assert.strictEqual(byId(loginProblemChecks({ rootUrl: '  ' }), 'root-url').ok, false);
  assert.strictEqual(byId(loginProblemChecks({ rootUrl: 'https://boards.example.com' }), 'root-url').ok, true);
});

check('LDAP / Sandstorm checks appear only when enabled', () => {
  const off = loginProblemChecks({ rootUrl: 'https://x' });
  assert.ok(!byId(off, 'ldap') && !byId(off, 'sandstorm'));
  const on = loginProblemChecks({ rootUrl: 'https://x', ldapEnabled: true, sandstorm: true });
  assert.ok(byId(on, 'ldap') && byId(on, 'sandstorm'));
});

check('tolerates missing env argument', () => {
  const checks = loginProblemChecks();
  assert.ok(Array.isArray(checks) && byId(checks, 'root-url').severity === 'error');
});

// ── buildProblemsOverview ─────────────────────────────────────────────────────
check('overview surfaces in-progress items (active only)', () => {
  const ov = buildProblemsOverview({
    inProgress: [
      { kind: 'database-migration', active: true, message: 'migrating' },
      { kind: 'stale', active: false, message: 'no' },
    ],
  });
  assert.strictEqual(ov.anyInProgress, true);
  assert.strictEqual(ov.inProgress.length, 1);
});

check('broken cards become a warning problem with a count', () => {
  const ov = buildProblemsOverview({ brokenCards: 4 });
  const p = ov.problems.find(x => x.id === 'broken-cards');
  assert.ok(p && p.count === 4 && p.severity === 'warning');
  assert.strictEqual(buildProblemsOverview({ brokenCards: 0 }).anyProblems, false);
});

check('failing login checks (ok === false) become problems; ok ones do not', () => {
  const login = loginProblemChecks({ migrationActive: false, rootUrl: '' }); // root-url fails
  const ov = buildProblemsOverview({ loginProblems: login });
  assert.ok(ov.problems.some(p => p.id === 'root-url'));
  assert.ok(!ov.problems.some(p => p.id === 'migration-in-progress')); // that one is ok here
});

check('empty input -> nothing in progress, no problems', () => {
  const ov = buildProblemsOverview({});
  assert.deepStrictEqual([ov.anyInProgress, ov.anyProblems], [false, false]);
  const ov2 = buildProblemsOverview(undefined);
  assert.deepStrictEqual([ov2.anyInProgress, ov2.anyProblems], [false, false]);
});

// ── source guards ─────────────────────────────────────────────────────────────
check('server status hub persists status + aggregates in-progress', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'server', 'lib', 'systemStatus.js'), 'utf8');
  assert.ok(/export async function setTextMigrationStatus/.test(src));
  assert.ok(/export async function setBoardRepairStatus/.test(src));
  assert.ok(/export async function getInProgress/.test(src));
  assert.ok(/export async function getProblemsOverview/.test(src));
  assert.ok(/RecoveryStatus|cronJobStatus|CronJobStatus|attachmentMigrationStatus|AttachmentMigrationStatus/.test(src),
    'must aggregate the persisted status collections');
});

check('systemStatusReport method is admin-gated and offers cpu/login detail', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'server', 'methods', 'systemStatus.js'), 'utf8');
  assert.ok(/systemStatusReport\(\)/.test(src) && /requireAdmin\(\)/.test(src), 'admin-gated overview method');
  assert.ok(/isAdmin/.test(src), 'must require isAdmin');
  assert.ok(/area === 'cpu'/.test(src) && /loadAverage/.test(src), 'cpu detail area');
});

check('startup repair pass runs server-side, version-gated, background', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'server', 'startup', 'repairBoardsOnStartup.js'), 'utf8');
  assert.ok(/Meteor\.startup/.test(src), 'runs on server startup');
  assert.ok(/repairAllBoards\(/.test(src), 'runs the shared repair');
  assert.ok(/getRepairMarkerVersion|REPAIR_VERSION/.test(src), 'version-gated so it does not scan on every boot');
  assert.ok(/Meteor\.setTimeout/.test(src), 'runs detached in the background');
});

check('migrateTextDatabase persists status so a CLI can read it', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'server', 'methods', 'migrateTextDatabase.js'), 'utf8');
  assert.ok(/setTextMigrationStatus/.test(src), 'must persist the migration status');
});

check('snap wekan.problems command exists, is wired, and reads the status', () => {
  const wrapper = fs.readFileSync(path.join(__dirname, '..', 'snap-src', 'bin', 'wekan-problems'), 'utf8');
  assert.ok(/wekan-problems\.mjs/.test(wrapper), 'wrapper runs the mjs');
  const mjs = fs.readFileSync(path.join(__dirname, '..', 'snap-src', 'bin', 'wekan-problems.mjs'), 'utf8');
  assert.ok(/text_migration_status/.test(mjs), 'reads the persisted migration/repair status');
  assert.ok(/Must be logged in/.test(mjs) && /Loading, please wait/.test(mjs), 'prints login-page checks');
  assert.ok(/area === 'cpu'/.test(mjs) && /loadavg/.test(mjs), 'has a cpu sub-command');
  const yaml = fs.readFileSync(path.join(__dirname, '..', 'snapcraft.yaml'), 'utf8');
  assert.ok(/problems:\s*\n\s*command: \.\/bin\/wekan-problems/.test(yaml), 'snapcraft app entry exists');
});

console.log(`\nproblemsStatus: ${passed} checks passed`);
