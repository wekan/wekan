'use strict';

// #6525: upgrading a Snap from 6.09 to 10.37 migrated MongoDB -> FerretDB
// successfully and then served 503 until the admin ran `snap restart wekan` by
// hand. WeKan sat in its startup loop printing "MongoDB not ready yet, retrying
// in 5 seconds..." against a MongoDB that the migration had just shut down for
// good.
//
// Cause: mongodb-control ends with `exec bash $SNAP/bin/migration-control`, so
// migration-control IS the wekan.mongodb service process. When the switch ran
// `snapctl stop --disable <snap>.mongodb`, systemd stopped the service THIS
// script runs in — SIGTERM, script dead at that line — and the
// `snapctl restart <snap>.wekan` that came AFTER it never ran. The reporter's log
// shows it exactly: "Migration succeeded. Switching to FerretDB" at 13:15:12,
// "Terminated" one second later, then minutes of WeKan waiting for MongoDB.
//
// Fix: hand WeKan over to FerretDB BEFORE stopping MongoDB — the one command that
// can terminate this process goes last — and have wekan-control notice a
// mid-wait switch itself, so the restart is not the only way out of that loop.
//
// Run: node tests/snapMigrationSwitchOrder.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');

const migration = read('snap-src/bin/migration-control');
const mongodbControl = read('snap-src/bin/mongodb-control');
const wekanControl = read('snap-src/bin/wekan-control');

// The switch block inside finish_success.
const finish = migration.slice(
  migration.indexOf('finish_success() {'),
  migration.indexOf('discard_partial_ferretdb()'));

console.log('snapMigrationSwitchOrder:');

test('migration-control really is the mongodb service (why order matters)', () => {
  assert.ok(/exec bash "\$SNAP\/bin\/migration-control"/.test(mongodbControl),
    'mongodb-control execs migration-control, so stopping wekan.mongodb kills it');
});

test('WeKan is handed to FerretDB BEFORE MongoDB is stopped', () => {
  const startFerret = finish.indexOf('start --enable "${svc}.ferretdb"');
  const restartWekan = finish.indexOf('restart "${svc}.wekan"');
  const stopMongo = finish.indexOf('stop --disable "${svc}.mongodb"');
  assert.ok(startFerret >= 0 && restartWekan >= 0 && stopMongo >= 0,
    'all three service commands must be present');
  assert.ok(startFerret < restartWekan,
    'FerretDB must be running before WeKan is restarted onto it');
  assert.ok(restartWekan < stopMongo,
    'restarting WeKan must come BEFORE stopping MongoDB: the stop terminates this ' +
    'very process, so anything after it never runs (that is #6525)');
});

test('stopping MongoDB is the LAST service command in the switch', () => {
  const stopMongo = finish.indexOf('stop --disable "${svc}.mongodb"');
  const after = finish.slice(stopMongo + 1);
  assert.ok(!/snapctl (start|restart|stop) /.test(after),
    'no snapctl service command may follow the stop that kills this process');
});

test('the traps are disarmed before the self-terminating stop', () => {
  const disarm = finish.lastIndexOf('trap - EXIT INT TERM');
  const stopMongo = finish.indexOf('stop --disable "${svc}.mongodb"');
  assert.ok(disarm >= 0, 'finish_success must disarm the traps');
  assert.ok(disarm < stopMongo,
    'otherwise being stopped logs "Interrupted (snap refresh, stop or reboot)" ' +
    'after a migration that SUCCEEDED, and runs cleanup for nothing');
});

test('the switch is still verified and recorded before any of it', () => {
  // Guard the safety property the reorder must not have disturbed: nothing is
  // switched until a non-empty FerretDB SQLite is confirmed.
  const verify = finish.indexOf('ferretdb-has-data');
  // `snapctl set database=ferretdb` is gone with the setting; the MARKER is what
  // records the switch now, and bin/database-role reads it. Same order, same
  // property: nothing moves until a non-empty FerretDB SQLite is confirmed.
  const mark = finish.indexOf('touch "$MARKER"');
  const startFerret = finish.indexOf('start --enable "${svc}.ferretdb"');
  assert.ok(verify >= 0 && verify < mark && mark < startFerret,
    'verify the SQLite, then record the migration as done, then move the services');
});

test('wekan-control leaves the wait loop when the database is switched under it', () => {
  const loop = wekanControl.slice(
    wekanControl.indexOf('Waiting for MongoDB replica set primary...'),
    wekanControl.indexOf('MongoDB replica set primary is ready.'));
  assert.ok(/database-role/.test(loop),
    'the loop must ask again which database should be running - bin/database-role, ' +
    'from the data - and not only use the value it sampled at startup');
  assert.ok(/exec "\$0"/.test(loop),
    'on a switch it must re-exec onto FerretDB instead of waiting for a MongoDB ' +
    'that is never coming back');
  const check = loop.indexOf('snapctl get database');
  const retry = loop.indexOf('MongoDB not ready yet, retrying');
  assert.ok(check < retry,
    'check for the switch before sleeping another round');
});

test('both scripts are still valid shell', () => {
  for (const p of ['snap-src/bin/migration-control', 'snap-src/bin/wekan-control']) {
    const r = spawnSync('bash', ['-n', path.join(root, p)], { encoding: 'utf8' });
    assert.strictEqual(r.status, 0, `bash -n ${p} failed: ${r.stderr}`);
  }
});

test('the other switch site already had the right order (negative)', () => {
  // mongodb-control has the same three commands for the "a completed migration
  // exists" case. It was already correct; keep it that way.
  const block = mongodbControl.slice(
    mongodbControl.indexOf('A completed FerretDB migration exists'));
  const restartWekan = block.indexOf('restart "${svc}.wekan"');
  const stopMongo = block.indexOf('stop --disable "${svc}.mongodb"');
  assert.ok(restartWekan >= 0 && stopMongo >= 0);
  assert.ok(restartWekan < stopMongo,
    'mongodb-control must also restart WeKan before stopping MongoDB');
});

console.log(`\nsnapMigrationSwitchOrder: ${passed} tests passed`);
