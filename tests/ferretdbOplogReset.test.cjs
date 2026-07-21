'use strict';

// Guards for the FerretDB simulated-OpLog reset (#6492).
//
// FerretDB v1's SQLite OpLog (local.oplog.rs, stored in the `local` database =
// local.sqlite) is not reliably capped, so over time it BLOATS or CORRUPTS; Meteor
// then busy-polls it and FerretDB CPU pegs at 300%+ even when idle. Deleting
// local.sqlite* drops CPU straight back to ~10%. The `local` database is transient
// SYSTEM data (the OpLog + replica-set metadata), NOT user data — boards/cards live
// in wekan.sqlite — so every FerretDB launch path resets it on start (recreated fresh
// and correctly capped by --repl-set-name), guarded by WEKAN_FERRETDB_RESET_OPLOG.
//
// The CRITICAL safety property: the reset must delete ONLY the `local` database and
// must NEVER touch wekan.sqlite (the actual boards/cards) — this test enforces that.
//
// Run: node tests/ferretdbOplogReset.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');

console.log('ferretdbOplogReset:');

// Every FerretDB launch path that starts the bundled/snap FerretDB.
const SCRIPTS = [
  'snap-src/bin/ferretdb-control',
  'releases/ferretdb/start-wekan.sh',
  'releases/ferretdb/wekan-entrypoint.sh',
];

for (const rel of SCRIPTS) {
  const src = read(rel);

  test(`${rel}: resets the local OpLog database on start`, () => {
    // Deletes the `local` database file(s) (the simulated OpLog).
    assert.ok(
      /rm -f[^\n]*local\.sqlite/.test(src),
      'must delete local.sqlite (the simulated OpLog)',
    );
  });

  test(`${rel}: reset is guarded by WEKAN_FERRETDB_RESET_OPLOG (default on)`, () => {
    // Default-on kill switch so the reset can be disabled.
    assert.ok(
      /WEKAN_FERRETDB_RESET_OPLOG:-true/.test(src),
      'reset must default to true and be overridable via WEKAN_FERRETDB_RESET_OPLOG',
    );
  });

  test(`${rel}: NEGATIVE — never deletes user data (wekan.sqlite)`, () => {
    // The whole point: user data must be untouched. No rm may target wekan.sqlite,
    // and no rm may wipe the whole SQLite data dir.
    const rmLines = src.split('\n').filter(l => /\brm\b/.test(l));
    for (const line of rmLines) {
      assert.ok(
        !/wekan\.sqlite/.test(line),
        `rm must never target wekan.sqlite: ${line.trim()}`,
      );
      // No `rm -rf` of the SQLite dir itself (would delete wekan.sqlite too).
      assert.ok(
        !/rm\s+-[a-z]*r[a-z]*\s+["']?\$?\{?(SQLITE_DIR|FERRETDB_SQLITE_DIR)\}?["']?\s*$/.test(
          line.trim(),
        ),
        `rm must not remove the whole data dir: ${line.trim()}`,
      );
    }
  });

  test(`${rel}: reset is guarded against an empty data-dir path`, () => {
    // Never run `rm -f /local.sqlite*` if the dir var is empty.
    assert.ok(
      /\[ -n "?\$\{?(SQLITE_DIR|FERRETDB_SQLITE_DIR)\}?"? \]/.test(src),
      'reset must require a non-empty SQLite dir before deleting',
    );
  });
}

console.log(`\n${passed} tests passed`);
