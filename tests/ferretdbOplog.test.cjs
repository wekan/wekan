'use strict';

// Guards for the FerretDB OpLog + data-reduction changes (#6503/#6480/#6481).
//
// FerretDB v1 CAN tail an OpLog (auto-created capped local.oplog.rs + replica-set
// hello handshake), but on the SQLite backend the tailable+awaitData tail pins
// FerretDB CPU (~190-390% even idle) and a struggling tail stalls loading
// ("oplog catching up took too long"), so #6503 makes POLLING the DEFAULT on every
// platform. The OpLog machinery still EXISTS and is opt-in via
// WEKAN_FERRETDB_OPLOG=true. These guards assert: (a) the default is polling only
// (WEKAN_FERRETDB_OPLOG defaults false; docker-compose reactivity is `polling` and
// MONGO_OPLOG_URL is commented out); (b) when opted in, ferretdb still launches
// with --repl-set-name and WeKan is pointed at MONGO_OPLOG_URL with polling as the
// fallback; and (c) the oversized activity page was trimmed.
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

// ── #6503: FerretDB is POLLING ONLY by default; OpLog is opt-in ──────────────
test('snap wekan-control: polling-only default for FerretDB, OpLog opt-in', () => {
  const src = read('snap-src/bin/wekan-control');
  assert.ok(/WEKAN_FERRETDB_OPLOG:-false/.test(src), 'OpLog OFF by default (polling only)');
  assert.ok(/export MONGO_OPLOG_URL="mongodb:\/\/.*\/local\?replicaSet=/.test(src), 'still sets oplog url when opted in');
  assert.ok(/"true" = "\$\{WEKAN_FERRETDB_OPLOG\}"/.test(src), 'opt-in check present');
});
test('snap config registers wekan-ferretdb-oplog (default false, snap set toggle)', () => {
  const src = read('snap-src/bin/config');
  assert.ok(/\bWEKAN_FERRETDB_OPLOG\b/.test(src.match(/keys="[^"]*"/)[0]), 'listed in the settings keys');
  assert.ok(/DEFAULT_WEKAN_FERRETDB_OPLOG="false"/.test(src), 'defaults to false (polling)');
  assert.ok(/KEY_WEKAN_FERRETDB_OPLOG="wekan-ferretdb-oplog"/.test(src), 'snap set key is wekan-ferretdb-oplog');
});
test('bundle start-wekan.sh: polling-only default, OpLog opt-in via WEKAN_FERRETDB_OPLOG=true', () => {
  const src = read('releases/ferretdb/start-wekan.sh');
  assert.ok(/WEKAN_FERRETDB_OPLOG="\$\{WEKAN_FERRETDB_OPLOG:-false\}"/.test(src), 'default false');
  assert.ok(/export MONGO_OPLOG_URL="\$\{MONGO_OPLOG_URL:-mongodb:\/\/\$FERRETDB_LISTEN_ADDR\/local\?replicaSet=/.test(src));
});
test('docker wekan-entrypoint.sh: polling-only default, OpLog opt-in', () => {
  const src = read('releases/ferretdb/wekan-entrypoint.sh');
  assert.ok(/WEKAN_FERRETDB_OPLOG="\$\{WEKAN_FERRETDB_OPLOG:-false\}"/.test(src), 'default false');
  assert.ok(/export MONGO_OPLOG_URL="\$\{MONGO_OPLOG_URL:-mongodb:\/\/\$FERRETDB_LISTEN_ADDR\/local\?replicaSet=/.test(src));
});
test('docker-compose: polling-only reactivity by default + MONGO_OPLOG_URL commented out', () => {
  const src = read('docker-compose.yml');
  assert.ok(/METEOR_REACTIVITY_ORDER=polling/.test(src), 'reactivity is polling by default');
  // the MONGO_OPLOG_URL line must NOT be active (commented out for polling-only)
  assert.ok(!/\n\s*- MONGO_OPLOG_URL=mongodb:\/\/ferretdb:27017/.test(src),
    'MONGO_OPLOG_URL must NOT be an active env line');
  assert.ok(/#\s*-\s*MONGO_OPLOG_URL=mongodb:\/\/ferretdb:27017\/local\?replicaSet=rs0/.test(src),
    'the opt-in MONGO_OPLOG_URL line is present but commented');
});
test('windows start-wekan.bat: polling-only default, OpLog opt-in', () => {
  const src = read('releases/ferretdb/start-wekan.bat');
  assert.ok(/set "WEKAN_FERRETDB_OPLOG=false"/.test(src), 'default false');
  assert.ok(/WEKAN_FERRETDB_OPLOG%"=="true"/.test(src), 'opt-in branch gated on =true');
  assert.ok(/MONGO_OPLOG_URL=mongodb:\/\/127\.0\.0\.1:27017\/local\?replicaSet=/.test(src));
});

test('#6498: polling mode UNSETS MONGO_OPLOG_URL so Meteor never tails the OpLog', () => {
  // Merely having MONGO_OPLOG_URL set makes Meteor start an OpLog tail at boot that
  // polls FerretDB continuously (high CPU even with no clients), regardless of the
  // reactivity order. So the WEKAN_FERRETDB_OPLOG=false / polling-only branch of every
  // launcher must actively clear it — not merely avoid setting it.
  for (const rel of ['snap-src/bin/wekan-control', 'releases/ferretdb/start-wekan.sh', 'releases/ferretdb/wekan-entrypoint.sh']) {
    const src = read(rel);
    assert.ok(/\n\s*unset MONGO_OPLOG_URL\b/.test(src), `${rel} unsets MONGO_OPLOG_URL in polling mode`);
    assert.ok(/#6498/.test(src), `${rel} references #6498`);
  }
  const st = read('sandstorm-src/start.js');
  assert.ok(/delete process\.env\.MONGO_OPLOG_URL/.test(st), 'sandstorm start.js clears MONGO_OPLOG_URL in polling mode');
});

// ── OpLog only when it works: polling must be the final reactivity fallback ──
// Meteor tries the drivers in METEOR_REACTIVITY_ORDER left-to-right and uses
// OpLog only when tailing actually works, else polling — so a broken/absent
// OpLog never stops WeKan starting. Every FerretDB launch path must keep polling
// last (like the MongoDB "changeStreams,oplog,polling" default).
test('every FerretDB launch path always has polling (as the default or the OpLog fallback)', () => {
  for (const f of [
    'snap-src/bin/wekan-control',
    'releases/ferretdb/start-wekan.sh',
    'releases/ferretdb/wekan-entrypoint.sh',
    'releases/ferretdb/start-wekan.bat',
    'docker-compose.yml',
    'sandstorm-src/start.js',
  ]) {
    const src = read(f);
    // Default is now polling-only (METEOR_REACTIVITY_ORDER=polling); the opt-in
    // OpLog branch keeps polling last (oplog,polling). Both contain "polling".
    assert.ok(/METEOR_REACTIVITY_ORDER[^\n]*polling/.test(src),
      `${f} must keep polling available in METEOR_REACTIVITY_ORDER`);
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
    // Both forms select polling-only: wekan-control forces "polling" (the kill-switch
    // means polling, period), while the release scripts default to polling but let an
    // explicit METEOR_REACTIVITY_ORDER override it (`${...:-polling}`). Accept either.
    assert.ok(/METEOR_REACTIVITY_ORDER="(\$\{METEOR_REACTIVITY_ORDER:-polling\}|polling)"/.test(src),
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
