'use strict';

// Guards for the FerretDB OpLog + data-reduction changes (#6480/#6481).
//
// With FerretDB there is no MongoDB oplog, so Meteor observed every live query by
// poll-and-diff, pinning FerretDB CPU at 100-390% on busy boards. FerretDB v1 now
// ships an OpLog (auto-created capped local.oplog.rs + replica-set hello
// handshake), so every FerretDB launch path must (a) start ferretdb with
// --repl-set-name so the OpLog exists and the server advertises the replica set,
// and (b) point WeKan at it via MONGO_OPLOG_URL so Meteor TAILS the OpLog instead
// of polling — with a WEKAN_FERRETDB_OPLOG kill-switch back to polling. Also
// asserts the oversized activity page was trimmed.
//
// Run: node tests/ferretdbOplog.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');

console.log('ferretdbOplog:');

// ── data reduction: activity page size ──────────────────────────────────────
test('activitiesPerPage was trimmed from 500 to <= 50', () => {
  const src = read('client/components/activities/activities.js');
  const m = src.match(/const activitiesPerPage = (\d+);/);
  assert.ok(m, 'activitiesPerPage constant must exist');
  const n = parseInt(m[1], 10);
  assert.ok(n <= 50, `activitiesPerPage must be <= 50 (was 500), got ${n}`);
});

// ── ferretdb launched with a replica-set name (enables the OpLog) ────────────
test('snap ferretdb-control launches with --repl-set-name', () => {
  const src = read('snap-src/bin/ferretdb-control');
  assert.ok(/--repl-set-name=/.test(src), 'ferretdb must run with --repl-set-name');
  assert.ok(/WEKAN_FERRETDB_REPL_SET:-rs0/.test(src), 'replica set defaults to rs0');
});
test('docker-compose ferretdb service runs with --repl-set-name=rs0', () => {
  const src = read('docker-compose.yml');
  assert.ok(/--repl-set-name=rs0/.test(src), 'ferretdb service must pass --repl-set-name=rs0');
});
test('bundle start-wekan.sh passes a repl-set arg to ferretdb', () => {
  const src = read('releases/ferretdb/start-wekan.sh');
  assert.ok(/FERRET_REPL_ARG="--repl-set-name=/.test(src), 'builds the --repl-set-name arg');
  assert.ok(/\$\{FERRET_REPL_ARG:\+"\$FERRET_REPL_ARG"\}/.test(src), 'passes it to the ferretdb launch');
});
test('docker wekan-entrypoint.sh passes --repl-set-name to both ferretdb launches', () => {
  const src = read('releases/ferretdb/wekan-entrypoint.sh');
  const count = (src.match(/--repl-set-name="\$REPL_SET_NAME"/g) || []).length;
  assert.strictEqual(count, 2, 'both the cpu-exec and plain launches must pass --repl-set-name');
});
test('windows start-wekan.bat passes a repl-set arg to ferretdb.exe', () => {
  const src = read('releases/ferretdb/start-wekan.bat');
  assert.ok(/--repl-set-name=%WEKAN_FERRETDB_REPL_SET%/.test(src), 'builds --repl-set-name');
  assert.ok(/ferretdb\.exe.*%FERRET_REPL_ARG%/.test(src), 'passes it on the ferretdb.exe line');
});

// ── WeKan points at the OpLog by default (with a kill-switch) ────────────────
test('snap wekan-control sets MONGO_OPLOG_URL for FerretDB, gated by WEKAN_FERRETDB_OPLOG', () => {
  const src = read('snap-src/bin/wekan-control');
  assert.ok(/WEKAN_FERRETDB_OPLOG:-true/.test(src), 'OpLog on by default');
  assert.ok(/export MONGO_OPLOG_URL="mongodb:\/\/.*\/local\?replicaSet=/.test(src), 'sets oplog url to local?replicaSet');
  assert.ok(/"true" = "\$\{WEKAN_FERRETDB_OPLOG\}"/.test(src), 'kill-switch check present');
});
test('bundle start-wekan.sh sets MONGO_OPLOG_URL by default, kill-switch WEKAN_FERRETDB_OPLOG', () => {
  const src = read('releases/ferretdb/start-wekan.sh');
  assert.ok(/WEKAN_FERRETDB_OPLOG="\$\{WEKAN_FERRETDB_OPLOG:-true\}"/.test(src), 'default true');
  assert.ok(/export MONGO_OPLOG_URL="\$\{MONGO_OPLOG_URL:-mongodb:\/\/\$FERRETDB_LISTEN_ADDR\/local\?replicaSet=/.test(src));
});
test('docker wekan-entrypoint.sh sets MONGO_OPLOG_URL, kill-switch present', () => {
  const src = read('releases/ferretdb/wekan-entrypoint.sh');
  assert.ok(/WEKAN_FERRETDB_OPLOG="\$\{WEKAN_FERRETDB_OPLOG:-true\}"/.test(src), 'default true');
  assert.ok(/export MONGO_OPLOG_URL="\$\{MONGO_OPLOG_URL:-mongodb:\/\/\$FERRETDB_LISTEN_ADDR\/local\?replicaSet=/.test(src));
});
test('docker-compose prefers oplog reactivity + sets MONGO_OPLOG_URL (uncommented)', () => {
  const src = read('docker-compose.yml');
  assert.ok(/METEOR_REACTIVITY_ORDER=oplog,polling/.test(src), 'reactivity prefers oplog then polling');
  // the MONGO_OPLOG_URL line must be active (not commented out)
  assert.ok(/\n\s*- MONGO_OPLOG_URL=mongodb:\/\/ferretdb:27017\/local\?replicaSet=rs0/.test(src),
    'MONGO_OPLOG_URL must be an active env line, not commented');
});
test('windows start-wekan.bat sets MONGO_OPLOG_URL under the kill-switch', () => {
  const src = read('releases/ferretdb/start-wekan.bat');
  assert.ok(/WEKAN_FERRETDB_OPLOG%"=="true"/.test(src), 'gated on the kill-switch');
  assert.ok(/MONGO_OPLOG_URL=mongodb:\/\/127\.0\.0\.1:27017\/local\?replicaSet=/.test(src));
});

// ── OpLog only when it works: polling must be the final reactivity fallback ──
// Meteor tries the drivers in METEOR_REACTIVITY_ORDER left-to-right and uses
// OpLog only when tailing actually works, else polling — so a broken/absent
// OpLog never stops WeKan starting. Every FerretDB launch path must keep polling
// last (like the MongoDB "changeStreams,oplog,polling" default).
test('every FerretDB launch path keeps polling as the reactivity fallback (oplog,polling)', () => {
  for (const f of [
    'snap-src/bin/wekan-control',
    'releases/ferretdb/start-wekan.sh',
    'releases/ferretdb/wekan-entrypoint.sh',
    'releases/ferretdb/start-wekan.bat',
    'docker-compose.yml',
    'sandstorm-src/start.js',
  ]) {
    const src = read(f);
    assert.ok(/METEOR_REACTIVITY_ORDER[^\n]*oplog,polling/.test(src),
      `${f} must set METEOR_REACTIVITY_ORDER to oplog,polling (polling fallback)`);
  }
});

// ── Sandstorm (defaults to FerretDB) enables the OpLog like the other platforms ──
test('Sandstorm launcher runs steady-state FerretDB with the OpLog + reactivity fallback', () => {
  const src = read('sandstorm-src/start.js');
  // steady-state instance gets the oplog; the migration target does NOT
  assert.ok(/startFerret\(DB_PORT, \{ oplog: true \}\)/.test(src), 'steady-state FerretDB enables oplog');
  assert.ok(/opts\.oplog && FERRET_OPLOG\) args\.push\(`--repl-set-name=/.test(src), 'repl-set-name gated on oplog opt');
  assert.ok(/MONGO_OPLOG_URL[\s\S]*local\?replicaSet=/.test(src), 'points WeKan at the oplog');
  // the migration-target startFerret call must stay oplog-free (no { oplog: true })
  assert.ok(/startFerret\(DB_PORT\);\s*\/\/ the PERMANENT SQLite dir/.test(src),
    'the migration-target FerretDB must not enable the oplog');
});
test('kill-switch path (WEKAN_FERRETDB_OPLOG=false) selects polling-only reactivity', () => {
  for (const f of ['snap-src/bin/wekan-control', 'releases/ferretdb/start-wekan.sh', 'releases/ferretdb/wekan-entrypoint.sh']) {
    const src = read(f);
    assert.ok(/METEOR_REACTIVITY_ORDER="\$\{METEOR_REACTIVITY_ORDER:-polling\}"/.test(src),
      `${f} must fall to polling-only when OpLog is disabled`);
  }
});

// ── Admin Panel / Version reports whether OpLog or polling is actually live ──
test('Version page detects + shows the live reactivity driver (oplog vs polling)', () => {
  const stats = read('server/statistics.js');
  assert.ok(/mongo\._oplogHandle/.test(stats), 'detects the live oplog handle');
  assert.ok(/reactivity = .*oplog|reactivity = 'polling'/.test(stats), 'reports oplog/changeStreams/polling');
  const jade = read('client/components/settings/informationBody.jade');
  assert.ok(/statistics\.mongo\.reactivity/.test(jade), 'Version page shows Reactivity mode');
  assert.ok(/statistics\.mongo\.mongoOplogEnabled/.test(jade), 'Version page shows Oplog enabled');
});
test('Version page also returns + shows the configured REACTIVITY_ORDER and DDP_TRANSPORT env', () => {
  const stats = read('server/statistics.js');
  assert.ok(/reactivityOrder:\s*\n?\s*process\.env\.METEOR_REACTIVITY_ORDER/.test(stats),
    'getStatistics returns METEOR_REACTIVITY_ORDER (server function, not a public var)');
  assert.ok(/ddpTransport:\s*process\.env\.DDP_TRANSPORT/.test(stats),
    'getStatistics returns DDP_TRANSPORT');
  const jade = read('client/components/settings/informationBody.jade');
  assert.ok(/statistics\.mongo\.reactivityOrder/.test(jade), 'Version page shows Reactivity order');
  assert.ok(/statistics\.mongo\.ddpTransport/.test(jade), 'Version page shows DDP transport');
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  assert.ok(en.Reactivity_order && en.DDP_transport, 'i18n keys exist');
});

// ── NEGATIVE: the migration's transient ferretdb must NOT enable the oplog ───
test('NEGATIVE: migration-control does not add --repl-set-name (transient bulk target)', () => {
  const src = read('snap-src/bin/migration-control');
  assert.ok(!/--repl-set-name/.test(src),
    'the migration target must stay oplog-free so bulk inserts are not slowed/contended');
});

console.log(`\n${passed} passed`);
