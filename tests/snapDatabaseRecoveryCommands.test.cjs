'use strict';

// Two copies of the data, and the snap serving the older one - and an admin with
// no command to run. Run: node tests/snapDatabaseRecoveryCommands.test.cjs
//
// #6583, comment 5280504937:
//
//   "The migration and the update to 10.83 startet at 11.08.2026 at 6:35 pm and
//    migration failed. Now we just see the old data from a migration we did in
//    july 2026. ... Which steps exactly could we do, to restore the database
//    with our most recent data"
//
// Everything needed to answer that already existed - db-eval's `evidence`,
// database-choose.mjs, database-merge-missing.mjs, database-autopick - and none
// of it was a command anybody could run. `snap run wekan.problems` reported "No
// problems detected", which was true of the things it checks and useless here.
//
// So: wekan.database-compare says what each copy holds and changes nothing, and
// wekan.database-merge inserts what is missing into the copy WeKan serves. The
// second one is safe to run without knowing which copy is "right" because the
// merge is INSERT-ONLY and WeKan's history is append-only.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = f => fs.readFileSync(path.join(repoRoot, f), 'utf8');
const compare = read('snap-src/bin/database-compare');
const merge = read('snap-src/bin/database-merge');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('snapDatabaseRecoveryCommands:');

test('both commands are registered in BOTH snapcraft files', () => {
  for (const rel of ['snapcraft.yaml', 'snapcraft-core26.yaml']) {
    const yaml = read(rel);
    for (const app of ['database-compare', 'database-merge']) {
      assert.ok(new RegExp(`\\n    ${app}:\\n\\s+command: \\./bin/${app}`).test(yaml),
        `${rel} must expose snap run wekan.${app}`);
    }
  }
});

test('compare changes NOTHING (negative)', () => {
  assert.ok(/--dry-run/.test(compare),
    'it runs the reader in dry-run, which is what makes it safe to suggest first');
  assert.ok(!/snapctl set|updateOne|insertOne|rm -rf|--to-ferretdb\b/.test(compare),
    'compare must not write a setting, a document or a file');
  assert.ok(/Nothing is changed/.test(compare), 'and it says so, because the admin is nervous');
});

test('compare answers with the DATA, not with file timestamps', () => {
  assert.ok(/database-autopick/.test(compare),
    'it reuses the one implementation of "read both databases and compare"');
  assert.ok(/temporary\s*\n?[a-z ]*port/.test(compare),
    'each database is started on a temporary port - the running one is not disturbed');
  assert.ok(/wekan\.sqlite|files\/db/.test(compare) && /WiredTiger/.test(compare),
    'and it shows where both copies live, which is the next thing anybody asks');
});

test('merge only ever INSERTS, into the database WeKan serves', () => {
  assert.ok(/--to-ferretdb/.test(merge),
    'the destination is FerretDB: MongoDB is the copy being migrated away from');
  assert.ok(/overwrites nothing and deletes\n# nothing|overwrites nothing|Nothing is overwritten/.test(merge),
    'and the promise is stated where somebody reading the script will see it');
  const missing = read('snap-src/bin/database-merge-missing.mjs');
  assert.ok(/THE ONLY OPERATION IS INSERT/.test(missing),
    'which is the guarantee the underlying tool actually makes');
});

test('merge tells the admin to take a copy first, with the command', () => {
  assert.ok(/cp -a/.test(merge) && /snap stop/.test(merge),
    'a copy of $SNAP_COMMON is one command and it makes this reversible');
  assert.ok(/--dry-run/.test(merge), 'and it can be asked what it would do');
});

test('and it says what to do afterwards', () => {
  assert.ok(/snap restart/.test(merge),
    'WeKan has to re-read the database it is serving');
  assert.ok(/History/.test(merge),
    'and the merged work shows up in the card History, which is where to look');
});

test('the removed wekan.database app is gone from both snapcraft files (negative)', () => {
  // It switched between mongodb and ferretdb; the setting behind it no longer
  // exists, and core26 still carried the app after core24 dropped it.
  for (const rel of ['snapcraft.yaml', 'snapcraft-core26.yaml']) {
    assert.ok(!/bin\/wekan-database/.test(read(rel)),
      `${rel} still registers the removed switch command`);
  }
  assert.ok(!fs.existsSync(path.join(repoRoot, 'snap-src/bin/wekan-database')),
    'and the script itself is removed');
});

console.log(`\nsnapDatabaseRecoveryCommands: ${passed} tests passed`);
