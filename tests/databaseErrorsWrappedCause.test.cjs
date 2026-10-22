'use strict';

// #6795: while MongoDB restarted, Admin Panel / Problems showed
//   Exception while invoking method 'usersHeartbeat' ValidationError: Failed
//   validation Socket 'connect' timed out
// as a schema bug ("usually a required field that was empty ... report it as a
// WeKan bug"). collection2 wraps whatever failed during a write's validation in
// "ValidationError: Failed validation", an unreachable database included; the
// schema rule came first in models/lib/databaseErrors.js, and the driver's
// connect timeout matched no rule at all. The same classifier decides in
// server/00startupResilience.js and 00processErrors.js whether an error is
// TRANSIENT, so it was treated as fatal too.
// Run: node tests/databaseErrorsWrappedCause.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const { classifyDatabaseError: classify } = require('../models/lib/databaseErrors.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const REPORTED = "Exception while invoking method 'usersHeartbeat' ValidationError: Failed validation Socket 'connect' timed out after 30000ms";

// The decision each guard makes, run from its own source.
const guards = ['server/00startupResilience.js', 'server/00processErrors.js'].map(file => {
  const src = read(file);
  const set = src.match(/const TRANSIENT = new Set\(\[[\s\S]*?\]\);/)[0];
  const fn = src.match(/export function isTransientDatabaseError\(error\) \{[\s\S]*?\n\}/)[0].replace('export function', 'function');
  return { file, isTransient: vm.runInNewContext(`${set}\n${fn}\nisTransientDatabaseError`, { classifyDatabaseError: classify }) };
});

test('the reported heartbeat error is a lost connection, and the guards treat it as transient', () => {
  const r = classify(REPORTED);
  assert.strictEqual(r.id, 'connection-lost');
  assert.strictEqual(r.kind, 'connection');
  assert.doesNotMatch(`${r.means} ${r.whatToDo}`, /required field|WeKan bug/);
  for (const { file, isTransient } of guards) assert.strictEqual(isTransient(new Error(REPORTED)), true, file);
});

test("the MongoDB driver's own connection errors are recognised", () => {
  for (const message of [
    "MongoNetworkTimeoutError: Socket 'connect' timed out after 30000ms",
    "MongoNetworkTimeoutError: Socket 'read' timed out",
    'MongoServerSelectionError: Server selection timed out after 30000 ms',
    'MongoNetworkError: connection 12 to 10.0.0.5:27017 closed',
    'PoolClearedError: Connection pool for wekan-mongodb:27017 was cleared',
    'MongoServerError: not primary',
    'MongoServerError: NotWritablePrimary',
    'MongoServerError: not primary and secondaryOk=false',
  ]) assert.strictEqual(classify(message).id, 'connection-lost', message);
});

test('negative: every wrapper in front of every transient cause is still that cause, never a schema bug', () => {
  const wrappers = [
    'ValidationError: Failed validation ',
    "Exception while invoking method 'cards.update' ValidationError: Failed validation ",
    "Exception in callback of async function: ValidationError: Failed validation\n",
  ];
  const causes = {
    'connection-lost': ["Socket 'connect' timed out", 'ECONNREFUSED 127.0.0.1:27017', 'Topology is closed', 'MongoNetworkError: closed'],
    timeout: ['ETIMEDOUT', 'operation exceeded time limit'],
    'too-many-connections': ['too many connections'],
  };
  for (const wrapper of wrappers) {
    for (const [id, list] of Object.entries(causes)) {
      for (const cause of list) {
        assert.strictEqual(classify(wrapper + cause).id, id, `${wrapper}${cause}`);
        for (const { file, isTransient } of guards) assert.strictEqual(isTransient(new Error(wrapper + cause)), true, `${file}: ${wrapper}${cause}`);
      }
    }
  }
});

test('a real schema failure is still a schema failure, and still fatal at startup', () => {
  for (const message of ['ValidationError: Failed validation', "Cannot read properties of undefined (reading 'title')",
    "ValidationError: Failed validation\nTitle is required"]) {
    assert.strictEqual(classify(message).id, 'schema-validation', message);
    for (const { file, isTransient } of guards) assert.strictEqual(isTransient(new Error(message)), false, file);
  }
});

test('"not primary key" in a SQL message is not a primary election (negative)', () => {
  assert.notStrictEqual(classify('column "x" is not primary key', { configured: 'postgresql' }).id, 'connection-lost');
  assert.notStrictEqual(classify('ERROR: column is not primary key').id, 'connection-lost');
});

test('a rule only yields to a cause that applies to the database in use', () => {
  // unlessRules consults the same database filter as the rule itself.
  const src = read('models/lib/databaseErrors.js');
  assert.match(src, /if \(rule\.unlessRules && RULES\.some\(other => rule\.unlessRules\.includes\(other\.id\) && applies\(other\)\)\) continue;/);
  const ids = new Set([...src.matchAll(/id: '([\w-]+)'/g)].map(m => m[1]));
  for (const m of src.matchAll(/unlessRules: \[([^\]]*)\]/g)) {
    for (const id of m[1].match(/'([\w-]+)'/g).map(s => s.slice(1, -1))) assert.ok(ids.has(id), `unlessRules names a rule that exists: ${id}`);
  }
});

console.log(`\n${passed} passed`);
