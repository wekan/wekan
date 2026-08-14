'use strict';

// A MongoDB copy nothing can read is not compared with FerretDB.
// Run: node tests/snapUnreadableMongoNotCompared.test.cjs
//
// #6585, comment 5290402146. A snap whose MongoDB data was written by a MongoDB
// older than any mongod it carries printed this at EVERY start, before the site
// came up:
//
//   Database selection: setting='ferretdb' ferretdb_has_data=true mongodb_has_data=true
//   WeKan: BOTH databases have been written to since the migration.
//   ...
//   [autopick] reading both databases to see which one holds the work ...
//
// `mongodb_has_data` answers "are the files there", not "can anything here open
// them", and on that instance those are different answers - the earlier comment
// on the same issue shows mongod 7, 5.0 and 4.2 each refusing the files in turn.
// So the ambiguity branch ran on a copy that cannot be served, and autopick
// then started a mongod that cannot open the data and a SECOND FerretDB against
// the SQLite directory the running one already holds.
//
// migration-control has already tried every reader in the snap and left
// .mongodb-data-too-old behind when none of them could open the files. That
// marker is the answer: with it present, the MongoDB copy is not a candidate,
// and WeKan serves the FerretDB that has the data.
//
// The files are not touched and the marker is not removed: it is true, and it
// belongs to MongoDB - move back to a snap that can read them and it is right
// again.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const control = read('snap-src/bin/wekan-control');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('snapUnreadableMongoNotCompared:');

test('"the files are there" and "they can be read" are two questions', () => {
  assert.ok(/mongodb_readable="\$mongodb_has_data"/.test(control),
    'the second starts as the first');
  assert.ok(/if \[ "\$mongodb_has_data" = "true" \] && \[ -f "\$SNAP_COMMON\/\.mongodb-data-too-old" \]; then\n\s+mongodb_readable=false/
    .test(control), 'and turns false when nothing in the snap can open them');
});

test('the comparisons ask the second question', () => {
  // Both branches that compare the two databases - the ambiguous one that runs
  // autopick, and the stale one that merges into FerretDB.
  assert.ok(/if \[ "\$mongodb_readable" = "true" \] && \[ "\$migration_stale_rc" -eq 2 \]/.test(control),
    'the "both have been written to" branch');
  assert.ok(/if \[ "ferretdb" = "\$DATABASE" \] && \[ "\$mongodb_readable" = "true" \] && \[ "\$migration_stale_rc" -eq 0 \]/
    .test(control), 'and the "MongoDB is newer, merge it in" branch');
  // Neither compares on file presence any more.
  assert.ok(!/\[ "\$mongodb_has_data" = "true" \] && \[ "\$migration_stale_rc"/.test(control),
    'nothing decides from the files merely being there');
});

test('the empty-FerretDB safety still asks the FIRST question (negative)', () => {
  // That guard is not a comparison: FerretDB is empty, MongoDB has files, and
  // starting an empty database would look like all data was lost. Whether those
  // files can be read is the admin's next problem, not a reason to serve
  // nothing - the too-old page above says exactly what to do.
  assert.ok(/if \[ "ferretdb" = "\$DATABASE" \] && \[ "\$ferretdb_has_data" != "true" \] && \[ "\$mongodb_has_data" = "true" \]/
    .test(control), 'it still reads mongodb_has_data');
});

test('the files and the marker are left alone (negative)', () => {
  const branch = control.slice(control.indexOf('mongodb_readable="$mongodb_has_data"'),
    control.indexOf('# SAFETY, the second half'));
  assert.ok(!/rm -f/.test(branch), 'nothing is deleted');
  assert.ok(/left untouched/.test(branch), 'and it says so');
  assert.ok(/the explanation stands if you move back to a snap that can read them/.test(branch),
    'the marker keeps its meaning for a snap that can read them');
});

test('an instance on FerretDB still starts normally (negative)', () => {
  // The half of #6585 that was already fixed: the marker is about MongoDB, so
  // it must not hide a working FerretDB site behind the explanatory page.
  assert.ok(/The 'database too old' marker is about the old MongoDB files; this snap runs on FerretDB/
    .test(control), 'that message is still there');
  assert.ok(/SERVING_FERRETDB=true/.test(control), 'and the condition that reaches it');
});

console.log(`\nsnapUnreadableMongoNotCompared: ${passed} tests passed`);
