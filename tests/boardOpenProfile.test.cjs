'use strict';

// The board-open profile (docs/Databases/FerretDB/1/SpeedTest/app): the part that can be
// checked without a browser and a database - the CPU profile of the Meteor server is
// split by who spends it, and the README states what was measured and what was not.
//
// Run: node tests/boardOpenProfile.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const { categorise, analyse } = require('../docs/Databases/FerretDB/1/SpeedTest/app/profileAnalysis.cjs');

const DIR = path.join(__dirname, '..', 'docs/Databases/FerretDB/1/SpeedTest/app');
const node = (id, functionName, url = '') => ({ id, callFrame: { functionName, url } });

test('time is split by who spends it', () => {
  const cases = [
    ['(idle)', '', 'idle'],
    ['(garbage collector)', '', 'garbage collector'],
    ['(program)', '', 'native (program)'],
    ['deserializeObject', 'file:///x/npm-mongo/node_modules/mongodb/lib/bson.cjs', 'MongoDB driver (wire, decode, encode)'],
    ['publish', 'file:///x/programs/server/packages/ddp-server.js', 'Meteor DDP (publish, mergebox, sessions)'],
    ['replaceTypes', 'file:///x/programs/server/packages/mongo.js', 'Meteor mongo (observe, polling, diff)'],
    ['stringify', 'file:///x/programs/server/packages/ejson.js', 'EJSON'],
    ['CollectionDocument', 'file:///x/_build/main-dev/server-rspack.cjs', 'WeKan code'],
    ['writeBuffer', 'node:internal/stream_base_commons', 'node internals'],
    ['something', 'file:///x/programs/server/packages/random.js', 'other packages'],
  ];
  for (const [fn, url, want] of cases) assert.equal(categorise(node(1, fn, url)), want, `${fn} ${url}`);
  // negative: a dependency under node_modules, and a Meteor package whose path has /server/ in it,
  // are never "WeKan code", even when the path mentions wekan
  assert.notEqual(categorise(node(1, 'f', 'file:///x/wekan/node_modules/lodash/lodash.js')), 'WeKan code');
  assert.equal(categorise(node(1, 'f', 'file:///x/wekan/.meteor/local/build/programs/server/packages/check.js')), 'other packages');
});

test('analyse adds up the samples, leaves the idle time out of "busy", and orders by cost', () => {
  const nodes = [node(1, '(idle)'), node(2, 'deserializeObject', 'file:///x/mongodb/lib/bson.cjs'),
    node(3, 'CollectionDocument', 'file:///x/_build/server.cjs'), node(4, '(garbage collector)')];
  // timeDeltas are in microseconds; sample i is charged the delta after it
  const profile = { nodes, samples: [1, 2, 2, 3, 4, 1], timeDeltas: [0, 4000, 6000, 3000, 2000, 5000, 0] };
  const a = analyse(profile);
  assert.equal(Math.round(a.totalMs), 20);
  assert.equal(Math.round(a.busyMs), 16, '4 of the 20 ms are idle');
  assert.deepEqual(a.categories.map(([c]) => c), ['MongoDB driver (wire, decode, encode)', 'garbage collector', 'WeKan code']);
  assert.deepEqual(a.categories.map(([, ms]) => Math.round(ms)), [9, 5, 2]);
  assert.ok(a.categories.every(([, ms]) => ms > 0));
  assert.equal(a.topFunctions[0][0].split('  ')[0], 'deserializeObject');
  // negative: an empty profile is nothing, not NaN
  const empty = analyse({ nodes: [], samples: [], timeDeltas: [] });
  assert.equal(empty.busyMs, 0);
  assert.deepEqual(empty.categories, []);
});

test('the script parses, never touches a database outside its own, and the README says what it measured', () => {
  const { execFileSync } = require('node:child_process');
  execFileSync(process.execPath, ['--check', path.join(DIR, 'board-open.cjs')]);
  const script = fs.readFileSync(path.join(DIR, 'board-open.cjs'), 'utf8');
  // it seeds a user and a board of its own, in the database named by WEKAN_MONGO_URL
  assert.match(script, /db\.seedUser\(\)/);
  assert.doesNotMatch(script, /dropDatabase|deleteMany\(\{\}\)|drop\(\)/);
  const md = fs.readFileSync(path.join(DIR, 'README.md'), 'utf8');
  for (const needle of ['development build', 'same ~210 KB', 'run 1 / run 2', '400-600 ms', 'within the noise', 'not identified', 'does not separate']) {
    assert.ok(md.includes(needle), needle);
  }
  // the root README points to it
  assert.ok(fs.readFileSync(path.join(DIR, '..', 'README.md'), 'utf8').includes('[app/](app/)'));
});
