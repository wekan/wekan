'use strict';

// Plain-Node BEHAVIORAL tests (no Meteor, needs bash — CI runners are Linux) for
// issue #6473's SELF-HEALING attachment repair: snap-src/bin/attachment-repair.
//
// Rolled out via snap auto-refresh to ~15k servers, the repair must run WITHOUT
// any manual command: wekan-control launches it in the background on every start
// when the snap runs on FerretDB; it verifies what is already migrated, migrates
// only what is missing (FILES_ONLY importer mode — text data untouched), marks
// itself done with $SNAP_COMMON/.attachments-files-v2-done, and retries on the
// next start after a failure. These tests drive the REAL bash script against a
// fake $SNAP tree with stubbed snapctl/db-eval/cpu-exec/node, asserting both the
// happy path and every guard (negative cases).
// Run: node tests/attachmentRepair.test.cjs

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');
const SCRIPT = path.join(repoRoot, 'snap-src/bin/attachment-repair');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// Build a disposable environment: fake $SNAP with stub tools, fake $SNAP_COMMON.
// opts: {database, ferretdbData, mongodbData, marker, maintenance, nodeExit}
function makeEnv(opts = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'attachment-repair-'));
  const snap = path.join(root, 'snap');
  const common = path.join(root, 'common');
  const stubBin = path.join(root, 'stubs');
  const record = path.join(root, 'record');
  fs.mkdirSync(path.join(snap, 'bin'), { recursive: true });
  fs.mkdirSync(common, { recursive: true });
  fs.mkdirSync(stubBin, { recursive: true });

  // Real guard helper, stubbed tools.
  fs.copyFileSync(path.join(repoRoot, 'snap-src/bin/ferretdb-has-data'), path.join(snap, 'bin/ferretdb-has-data'));

  // snapctl stub: `snapctl get database` prints the configured value.
  fs.writeFileSync(path.join(stubBin, 'snapctl'), `#!/bin/sh
if [ "$1" = "get" ] && [ "$2" = "database" ]; then echo "${opts.database || 'ferretdb'}"; fi
exit 0
`, { mode: 0o755 });

  // db-eval stub: ping/shutdown always succeed (FerretDB and temp mongod "ready").
  fs.writeFileSync(path.join(snap, 'bin/db-eval'), `#!/bin/sh
echo "db-eval $@" >> "${record}"
exit 0
`, { mode: 0o755 });

  // cpu-exec stub: "starts" the temp mongod — writes the pidfile named on the
  // command line (like mongod --fork --pidfilepath does) and exits 0.
  fs.writeFileSync(path.join(snap, 'bin/cpu-exec'), `#!/bin/bash
echo "cpu-exec $@" >> "${record}"
prev=""
for a in "$@"; do
  if [ "$prev" = "--pidfilepath" ]; then echo 999999 > "$a"; fi
  prev="$a"
done
exit 0
`, { mode: 0o755 });

  // mongod binary must exist (start_mongod runs it through cpu-exec).
  fs.writeFileSync(path.join(snap, 'bin/mongod'), '#!/bin/sh\nexit 0\n', { mode: 0o755 });

  // node stub: records its argv and full environment, exits as configured —
  // this is "the importer run".
  fs.writeFileSync(path.join(snap, 'bin/node'), `#!/bin/sh
echo "node $@" >> "${record}"
env | grep -E '^(FILES_ONLY|TARGET_MONGO_URL|SOURCE_MONGO_URL|MIGRATION_PORT|WRITABLE_PATH)=' | sort >> "${record}"
exit ${Number.isInteger(opts.nodeExit) ? opts.nodeExit : 0}
`, { mode: 0o755 });

  // The importer file path is passed to node; content is irrelevant here.
  fs.writeFileSync(path.join(snap, 'bin/migrate-mongodb-to-ferretdb.mjs'), '// stub\n');
  fs.writeFileSync(path.join(snap, 'bin/migrate-mongo3-to-ferretdb.mjs'), '// stub\n');

  if (opts.ferretdbData !== false) {
    fs.mkdirSync(path.join(common, 'files/db'), { recursive: true });
    fs.writeFileSync(path.join(common, 'files/db/wekan.sqlite'), 'data');
  }
  if (opts.mongodbData !== false) {
    fs.writeFileSync(path.join(common, 'WiredTiger'), 'WiredTiger');
  }
  if (opts.marker) fs.writeFileSync(path.join(common, '.attachments-files-v2-done'), '');
  if (opts.maintenance) fs.writeFileSync(path.join(common, '.wekan-maintenance'), '');

  return { root, snap, common, stubBin, record };
}

function runRepair(env, extraEnv = {}) {
  return spawnSync('bash', [SCRIPT], {
    encoding: 'utf8',
    env: {
      PATH: `${env.stubBin}:${process.env.PATH}`,
      SNAP: env.snap,
      SNAP_COMMON: env.common,
      SNAP_NAME: 'wekan',
      REPAIR_WAIT_SECS: '4',
      ...extraEnv,
    },
  });
}

const recordOf = env => (fs.existsSync(env.record) ? fs.readFileSync(env.record, 'utf8') : '');
const markerExists = env => fs.existsSync(path.join(env.common, '.attachments-files-v2-done'));

// ── happy path ────────────────────────────────────────────────────────────────

test('repairs once and marks done: temp mongod started, importer run FILES_ONLY against live FerretDB', () => {
  const env = makeEnv({});
  const r = runRepair(env);
  assert.strictEqual(r.status, 0, r.stdout + r.stderr);
  const rec = recordOf(env);
  assert.ok(/cpu-exec .*mongod/.test(rec), 'temporary source mongod started via cpu-exec');
  assert.ok(/node .*migrate-mongodb-to-ferretdb\.mjs/.test(rec), 'modern importer invoked');
  assert.ok(rec.includes('FILES_ONLY=true'), 'importer runs in incremental files-only mode');
  assert.ok(/TARGET_MONGO_URL=mongodb:\/\/127\.0\.0\.1:27019\/wekan/.test(rec), 'target is the LIVE FerretDB');
  assert.ok(rec.includes('MIGRATION_PORT=0'), 'no clash with WeKan on the web port');
  assert.ok(rec.includes(`WRITABLE_PATH=${env.common}`), 'files land in $SNAP_COMMON/files');
  assert.ok(markerExists(env), 'success writes the done marker');
  assert.ok(!fs.existsSync(path.join(env.common, '.attachment-repair.pid')), 'lock removed');
});

test('second run after success does nothing (marker respected)', () => {
  const env = makeEnv({ marker: true });
  const r = runRepair(env);
  assert.strictEqual(r.status, 0);
  assert.strictEqual(recordOf(env), '', 'no tool was invoked at all');
});

// ── failure: retry next start ─────────────────────────────────────────────────

test('negative: importer failure leaves NO marker so the next start retries', () => {
  const env = makeEnv({ nodeExit: 1 });
  const r = runRepair(env);
  assert.notStrictEqual(r.status, 0, 'non-zero exit on failure');
  assert.ok(!markerExists(env), 'failed repair must not be marked done');
  assert.ok(!fs.existsSync(path.join(env.common, '.attachment-repair.pid')), 'lock removed even on failure');
});

// ── guards (negative cases) ───────────────────────────────────────────────────

test('negative: skips while still on MongoDB (normal migration path covers files)', () => {
  const env = makeEnv({ database: 'mongodb' });
  const r = runRepair(env);
  assert.strictEqual(r.status, 0);
  assert.ok(!markerExists(env), 'must not mark done — migration has not happened yet');
  assert.ok(!/node /.test(recordOf(env)), 'importer not invoked');
});

test('negative: skips in maintenance mode', () => {
  const env = makeEnv({ maintenance: true });
  const r = runRepair(env);
  assert.strictEqual(r.status, 0);
  assert.ok(!markerExists(env));
  assert.strictEqual(recordOf(env), '');
});

test('negative: skips when FerretDB has no data (nothing to repair INTO)', () => {
  const env = makeEnv({ ferretdbData: false });
  const r = runRepair(env);
  assert.strictEqual(r.status, 0);
  assert.ok(!markerExists(env), 'not marked done — the migration itself is still pending');
  assert.ok(!/node /.test(recordOf(env)));
});

test('no MongoDB source data: marks done WITHOUT running anything (fresh installs)', () => {
  const env = makeEnv({ mongodbData: false });
  const r = runRepair(env);
  assert.strictEqual(r.status, 0);
  assert.ok(markerExists(env), 'nothing to repair from, ever — never probe again');
  assert.ok(!/node /.test(recordOf(env)), 'importer not invoked');
});

test('negative: a live concurrent repair is not doubled (pid lock)', () => {
  const env = makeEnv({});
  fs.writeFileSync(path.join(env.common, '.attachment-repair.pid'), String(process.pid));
  const r = runRepair(env);
  assert.strictEqual(r.status, 0);
  assert.ok(!/node /.test(recordOf(env)), 'importer not invoked while another repair runs');
  assert.ok(!markerExists(env));
});

test('a STALE lock (dead pid) does not block the repair', () => {
  const env = makeEnv({});
  fs.writeFileSync(path.join(env.common, '.attachment-repair.pid'), '999999');
  const r = runRepair(env);
  assert.strictEqual(r.status, 0, r.stdout + r.stderr);
  assert.ok(markerExists(env), 'repair ran despite the stale lock');
});

// ── wiring: the repair is started automatically and coordinated ───────────────

const wekanControl = read('snap-src/bin/wekan-control');
const migrationControl = read('snap-src/bin/migration-control');
const forceMigrate = read('snap-src/bin/wekan-force-migrate');
const importerModern = read('releases/migrate-mongodb-to-ferretdb.mjs');
const importer3 = read('snap-src/bin/migrate-mongo3-to-ferretdb.mjs');

test('wekan-control starts attachment-repair in the BACKGROUND on the ferretdb path', () => {
  assert.ok(/attachment-repair[^\n]*&\s*$/m.test(wekanControl),
    'must not block WeKan startup');
  const ferretBranch = wekanControl.slice(wekanControl.indexOf('Waiting for FerretDB'));
  assert.ok(ferretBranch.includes('attachment-repair'), 'launched after FerretDB is ready');
});

test('a fresh successful migration pre-marks the repair as done (fixed importer already ran)', () => {
  const fn = migrationControl.match(/finish_success\(\) \{[\s\S]*?\n\}/);
  assert.ok(fn, 'finish_success found');
  assert.ok(fn[0].includes('.attachments-files-v2-done'));
});

test('wekan.migrate (forced fresh migration) clears the repair marker', () => {
  assert.ok(forceMigrate.includes('rm -f "$COMMON/.attachments-files-v2-done"'));
});

test('modern importer: FILES_VERSION stamp exists and the marker gates on it', () => {
  assert.ok(/const FILES_VERSION = 2;/.test(importerModern));
  assert.ok(importerModern.includes('(marker.filesVersion || 1) >= FILES_VERSION'),
    'old-filesVersion markers must trigger the automatic repair');
  assert.ok(importerModern.includes('filesVersion:  FILES_VERSION') ||
            importerModern.includes('filesVersion: FILES_VERSION'),
    'fresh migrations stamp the current files version');
});

test('modern importer: repair mode never touches text data or the migration record', () => {
  assert.ok(importerModern.includes('end !repairMode (text collections)'));
  assert.ok(importerModern.includes('end !repairMode (swimlane/orphan fixes)'));
  assert.ok(/repairMode[\s\S]*?updateOne\(\s*\{ _id: 'completed' \},\s*\{ \$set: \{ filesVersion: FILES_VERSION/.test(importerModern),
    'repair stamps filesVersion via $set instead of replacing the marker');
});

test('modern importer: repair skips the all-files up-front disk check (files already on disk)', () => {
  assert.ok(/!repairMode && state\.filesTotalBytes > 0/.test(importerModern));
});

test('importers verify against the TARGET what is already migrated (incremental repair)', () => {
  // modern: CFS phase + Meteor-Files pass A both check the target record's version
  const modernChecks = importerModern.match(/tv && tv\.storage === 'fs' && tv\.path && fs\.existsSync\(tv\.path\)/g) || [];
  assert.ok(modernChecks.length >= 2, `modern importer target-state checks (found ${modernChecks.length})`);
  const mongo3Checks = importer3.match(/tv && tv\.storage === 'fs' && tv\.path && fs\.existsSync\(tv\.path\)/g) || [];
  assert.ok(mongo3Checks.length >= 2, `mongo3 importer target-state checks (found ${mongo3Checks.length})`);
});

test('importers never resurrect records deleted since the migration (repair mode)', () => {
  assert.ok(/repairMode && !tgtDoc\) continue/.test(importerModern), 'pass A skips deleted records');
  assert.ok(/repairMode && md\.fileId && !record\) continue/.test(importerModern), 'pass B skips deleted records');
  assert.ok(/FILES_ONLY && !tgtRec\) continue/.test(importer3));
});

test('mongo3 importer: FILES_ONLY skips text collections', () => {
  assert.ok(/const FILES_ONLY\s*=\s*process\.env\.FILES_ONLY === 'true';/.test(importer3));
  assert.ok(importer3.includes('end !FILES_ONLY (text collections)'));
});

test('importer dashboards survive the web port being taken by WeKan (background repair)', () => {
  assert.ok(/server\.on\('error'/.test(importerModern));
  assert.ok(/\.on\('error',/.test(importer3));
});

test('repair command is registered in both snapcraft yamls', () => {
  for (const rel of ['snapcraft.yaml', 'snapcraft-core26.yaml']) {
    const y = read(rel);
    assert.ok(y.includes('repair-attachments:'), `${rel} registers the app`);
    assert.ok(y.includes('./bin/attachment-repair'), `${rel} points at the script`);
  }
});

console.log(`attachmentRepair.test.cjs: ${passed} tests passed`);
