'use strict';

// Plain-Node guard for what a BUSY database may cost WeKan at startup (#6533).
// Run: node tests/sqliteBusyResilience.test.cjs
//
// The reporter's snap, upgraded from 6.09 to 10.44, was in a systemd restart loop
// at restart number 72. Each boot re-ran the startup work, one write lost the
// SQLite write lock, and Meteor's boot.js turned that into a process exit:
//
//   error on boot.js Error [ValidationError]: Failed validation
//   ... [collection.go:191 sqlite.(*collection).UpdateAll]
//   database is locked (5) (SQLITE_BUSY)
//
// Two things had to change here. A transient database error must not be fatal at
// startup - SQLITE_BUSY means another writer had the lock, not that anything is
// wrong - and the startup work must not be proportional to the whole card
// collection on every boot, which is what kept the database busy in the first
// place.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const guard = read('server/00startupResilience.js');
const backfill = read('server/lib/denormalizeBoardId.js');
const imports = read('server/imports.js');

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log('  ok -', name);
  } catch (err) {
    console.error(`  FAIL - ${name}\n    ${err.message}`);
    process.exitCode = 1;
  }
}

console.log('sqliteBusyResilience:');

test('a busy database does not end the boot, and a real fault still does', () => {
  assert.ok(/Meteor\.startup = function/.test(guard),
    'every startup callback registered after this file must be wrapped');
  assert.ok(/if \(!isTransientDatabaseError\(error\)\) throw error;/.test(guard),
    'anything that is NOT a transient database error is rethrown, so a real '
    + 'misconfiguration still stops WeKan');

  // Only the errors that fix themselves are swallowed.
  const set = guard.slice(guard.indexOf('const TRANSIENT'), guard.indexOf('export function'));
  for (const id of ['deadlock', 'too-many-connections', 'connection-lost', 'timeout']) {
    assert.ok(set.includes(`'${id}'`), `${id} is transient`);
  }
  for (const id of ['disk-full', 'auth-failed', 'sqlite-syntax', 'mysql-access-denied-database']) {
    assert.ok(!set.includes(`'${id}'`), `${id} must NOT be treated as transient`);
  }
  assert.ok(/recordDatabaseProblem/.test(guard),
    'and it is recorded, so Admin Panel / Problems shows what the database said');
});

test('SQLITE_BUSY is one of the errors it recognises', () => {
  // The classifier is the shared one, so this is what the guard will see.
  const { classifyDatabaseError } = require('../models/lib/databaseErrors');
  const busy = classifyDatabaseError(
    'Failed validation [msg_update.go:133 handler.(*Handler).updateDocument] ' +
    '[collection.go:191 sqlite.(*collection).UpdateAll] database is locked (5) (SQLITE_BUSY)',
  );
  assert.strictEqual(busy.id, 'deadlock', 'a locked SQLite is contention, not corruption');
  assert.strictEqual(busy.act, 'retry');

  // ...and a fault is not.
  const disk = classifyDatabaseError('database or disk is full');
  assert.notStrictEqual(disk.id, 'deadlock');
  for (const [message, id] of [
    ['JavaScript heap out of memory', 'memory-exhausted'],
    ['EMFILE: too many open files', 'file-descriptors-exhausted'],
    ['attempt to write a readonly database', 'read-only-filesystem'],
    ['database disk image is malformed', 'database-corrupt'],
    ['BSONObjectTooLarge', 'document-too-large'],
  ]) assert.strictEqual(classifyDatabaseError(message).id, id);
});

test('the guard is installed before anything that registers a startup callback', () => {
  const at = imports.indexOf("import '/server/00startupResilience'");
  assert.notStrictEqual(at, -1, 'server/imports.js must load it');
  const others = imports.indexOf("import '/server/00waitForMongo'");
  assert.ok(at < others, 'and before the first file that registers a Meteor.startup hook');
});

test('the board-id backfill is driven by the missing rows, not by every card', () => {
  // It streamed the WHOLE Cards collection and issued one multi-update per card -
  // 130,947 of them on the reporter's instance - on EVERY boot, because a row
  // whose card is deleted can never be filled and kept the pass "unfinished".
  assert.ok(!/Cards\.find\(\{\},/.test(backfill),
    'the whole card collection must never be scanned for this');
  assert.ok(/find\(\s*\{ \[boardField\]: \{ \$exists: false \} \},/.test(backfill),
    'the rows missing the board id are what is streamed');
  assert.ok(/_id: \{ \$in: ids \}/.test(backfill),
    'and only their cards are asked for');
  assert.ok(/const CHUNK = \d+/.test(backfill), 'in bounded chunks, so memory is bounded');

  // Version-gated, like the schema upgrade beside it: an unchanged version costs
  // one findOne.
  assert.ok(/_wekan_migration/.test(backfill), 'the marker collection');
  assert.ok(/done\.version === version/.test(backfill), 'gated on the WeKan version');
  assert.ok(/WEKAN_FORCE_SCHEMA_UPGRADE/.test(backfill), 'and forceable');

  // Still never fatal.
  assert.ok(/catch \(e\) \{/.test(backfill) && /will retry next start/.test(backfill),
    'a failure is logged, not thrown - it runs in the background at startup');
});

console.log(`\n${passed} tests passed`);
