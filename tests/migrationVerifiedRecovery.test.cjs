'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');

const migration = read('snap-src/bin/migration-control');
const control = read('snap-src/bin/ferretdb-control');
const helper = read('releases/ferretdb/sqlite-recovery.mjs');
const bundle = read('releases/build-release-bundle.sh');

assert.match(migration, /migration-evidence/);
assert.match(migration, /migration-progress\.json/);
assert.match(helper, /checkpointHash/);
assert.match(helper, /sourceFiles/);
assert.match(helper, /sourceBytes \+ RESERVE/,
  'migration must reserve worst-case uncompressed target space');
assert.match(migration, /check-sqlite "\$SQLITE_DIR\/wekan\.sqlite"/,
  'successful importer exit is not enough without SQLite integrity');
assert.match(migration, /snapshot "\$SQLITE_DIR"/,
  'migration must create its first verified recovery generation before switching');
assert.match(control, /quarantine-/);
assert.match(control, /\.migration-to-ferretdb-done/);
assert.match(control, /snapctl start --enable "\$\{SNAP_NAME\}\.mongodb"/,
  'all failed SQLite generations hand control back to retained MongoDB automatically');
assert.match(bundle, /sqlite-recovery\.mjs/,
  'snap, container and offline bundles must all receive the same helper');

console.log('migrationVerifiedRecovery: evidence, disk, integrity, snapshot, and fallback wiring passed');
