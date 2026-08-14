'use strict';

// Comparing the two databases reads the one that is already running.
// Run: node tests/snapCompareReadsLiveDatabase.test.cjs
//
// #6583, comment 5291730920: `snap run wekan.database-compare` on a live
// instance answered
//
//   [autopick] MongoDB:  <unreadable>
//   [autopick] FerretDB: <unreadable>
//   [autopick] no automatic choice: Neither database could be read, or both are empty..
//
// while `wekan.sqlite` was 85 MB and the site was up. FerretDB was unreadable
// BECAUSE it was up: SQLite has one writer, so the second FerretDB the
// comparison started against the same directory did not get the data. The tool
// then said it could not read the database it was talking to all along, and
// refused to choose.
//
// The live one answers the same questions - `db-eval evidence` only counts and
// sorts - so it is asked first, and a second copy is started only for a database
// that is NOT running.
//
// Both databases speak the MongoDB wire protocol on the same port (the snap runs
// one at a time), so "something answers on 27019" does not say which one it is.
// `db-eval kind` asks it: FerretDB names itself in buildInfo, mongod does not.
// Reading FerretDB's evidence as MongoDB's would be worse than reading neither.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const autopick = read('snap-src/bin/database-autopick');
const dbEval = read('snap-src/bin/db-eval.mjs');
const compare = read('snap-src/bin/database-compare');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('snapCompareReadsLiveDatabase:');

test('the live database is tried before a second copy is started', () => {
  const mongo = autopick.slice(autopick.indexOf('evidence_from_mongodb() {'));
  assert.ok(/evidence_from_live mongodb && return 0\n\s+have_mongo_data \|\| return 1/
    .test(mongo.slice(0, 300)), 'MongoDB: the live one first, then the files');
  const ferret = autopick.slice(autopick.indexOf('evidence_from_ferretdb() {'));
  assert.ok(/evidence_from_live ferretdb && return 0\n\s+have_ferret_data \|\| return 1/
    .test(ferret.slice(0, 300)), 'FerretDB: the same');
});

test('it reads the service port, and only reads', () => {
  assert.ok(/LIVE_PORT="\$\{MONGODB_PORT:-27019\}"/.test(autopick),
    'the port the snap serves on, not the temporary one');
  const live = autopick.slice(autopick.indexOf('evidence_from_live() {'));
  const body = live.slice(0, live.indexOf('\n}\n'));
  assert.ok(/db-eval" evidence "\$LIVE_URL"/.test(body), 'evidence, which is read-only');
  assert.ok(!/mongod |ferretdb |kill /.test(body), 'nothing is started or stopped');
});

test('which database is answering is asked, not assumed (negative)', () => {
  // One port, two possible databases. Reading one as the other would give a
  // wrong answer with full confidence, which is worse than "unreadable".
  const live = autopick.slice(autopick.indexOf('live_is() {'));
  const body = live.slice(0, live.indexOf('\n}\n'));
  assert.ok(/db-eval" kind "\$LIVE_URL"/.test(body), 'it asks what is there');
  assert.ok(/\[ "\$kind" = "\$want" \] \|\| return 1/.test(
    autopick.slice(autopick.indexOf('evidence_from_live() {'))),
    'and uses it only when it is the one being asked about');
});

test('db-eval can tell them apart', () => {
  const kind = dbEval.slice(dbEval.indexOf("case 'kind': {"));
  const body = kind.slice(0, kind.indexOf('\n    }'));
  assert.ok(/buildInfo: 1/.test(body), 'from buildInfo, which both answer');
  assert.ok(/includes\('ferretdb'\) \? 'ferretdb' : 'mongodb'/.test(body),
    'FerretDB names itself there; a mongod does not');
  assert.ok(/toLowerCase\(\)/.test(body), 'and the case it uses is not depended on');
});

test('the comparison tool gets it for free (negative)', () => {
  // database-compare is autopick with --dry-run, so the fix reaches both the
  // automatic choice at startup and the command an admin runs by hand.
  assert.ok(/bash "\$SNAP\/bin\/database-autopick" --dry-run/.test(compare),
    'compare is the same reader');
  assert.ok(/--dry-run/.test(autopick), 'and dry-run still changes nothing');
});

console.log(`\nsnapCompareReadsLiveDatabase: ${passed} tests passed`);
