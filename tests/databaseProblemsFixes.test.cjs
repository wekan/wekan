'use strict';

// The two WeKan bugs Admin Panel / Problems / Database problems was reporting
// (commit 30e8e38f6, v10.80). The page had been doing its job for a week and both
// rows sat there marked "unknown / unclassified".
// Run: node tests/databaseProblemsFixes.test.cjs
//
// That fix shipped without a test, which is what this repairs. Both bugs are the
// same shape - WeKan calling the database in a way that cannot work, and the admin
// seeing the wreckage rather than the cause - and both are cheap to pin:
//
//   1. Board.ensureDefaultSwimlaneId() called the SYNCHRONOUS Swimlanes.upsert().
//      Meteor 3 removed it on the server, so every card or swimlane move that
//      reached the default-swimlane self-heal threw
//        Error: update is not available on the server. Please use updateAsync()
//      four times in a week, out of moveSwimlane.
//
//   2. List.move() inserted a list with `title: this.title`. With no title, the
//      schema refuses the insert - and collection2's own error formatter then
//      reads a property of the undefined field, so the admin got
//        ValidationError: Failed validation
//        Cannot read properties of undefined (reading 'title')
//      naming neither the list nor the problem.
//
// The classifier rules matter as much as the fixes: a row nobody can act on is a
// row nobody acts on, which is how both of these went a week unnoticed.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');
const boards = read('models/boards.js');
const lists = read('models/lists.js');
const { classifyDatabaseError } = require('../models/lib/databaseErrors.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('databaseProblemsFixes:');

// ── 1. the synchronous upsert on the server ─────────────────────────────────
function bodyOf(source, name) {
  // The DEFINITION, which starts a line - `this.ensureDefaultSwimlaneId()` is a
  // call, and reading its "body" would be reading the caller's.
  const definition = new RegExp(`^\\s*(async\\s+)?${name}\\s*\\(`, 'm');
  const found = definition.exec(source);
  assert.ok(found, `${name} is gone from the model`);
  const at = found.index;
  const open = source.indexOf('{', at);
  let depth = 0;
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    else if (source[i] === '}') { depth -= 1; if (depth === 0) return source.slice(at, i + 1); }
  }
  throw new Error(`could not read the body of ${name}`);
}

test('the default-swimlane self-heal uses the async upsert, which is the only one there is', () => {
  const body = bodyOf(boards, 'ensureDefaultSwimlaneId');
  assert.ok(/Swimlanes\.upsertAsync\(/.test(body),
    'Meteor 3 removed the synchronous upsert on the server; calling it threw out of '
    + 'every move that reached this self-heal');
  assert.ok(!/Swimlanes\.upsert\(/.test(body.replace(/upsertAsync\(/g, '')),
    'and the synchronous one must not come back');
});

test('the synchronous getter does not await, and cannot throw at its caller', () => {
  // It is a getter: it cannot await, and a rejected promise nobody is holding
  // would take the process down instead of the operation.
  const body = bodyOf(boards, 'ensureDefaultSwimlaneId');
  assert.ok(!/await /.test(body), 'a synchronous getter cannot await');
  assert.ok(/catch\(\(\) => \{\}\)|catch\(\s*\(\)\s*=>/.test(body),
    'the promise it starts has to have its rejection handled, or a self-heal '
    + 'failure becomes an unhandled rejection');
  assert.ok(/try \{/.test(body) && /catch \(e\)/.test(body),
    'and a throw from the call itself must not escape a getter that every board '
    + 'read goes through');
  assert.ok(/return ReactiveCache\.getSwimlane/.test(body),
    'it returns what is in the cache - which callers already had to handle, '
    + 'because it was undefined before the self-heal existed at all');
});

test('a caller that needs the swimlane in the same tick has an async twin', () => {
  const async = bodyOf(boards, 'ensureDefaultSwimlaneIdAsync');
  assert.ok(/await Swimlanes\.upsertAsync\(/.test(async),
    'the awaited version is what makes the non-awaited one acceptable');
});

// ── 2. moving a list that has no title ──────────────────────────────────────
test('moving a list with no title says so instead of crashing in the validator', () => {
  const body = bodyOf(lists, 'move');
  assert.ok(/This list has no title, so it cannot be moved to another board/.test(body),
    'the message has to name the list and the problem - the crash named neither');
  const check = body.indexOf('has no title');
  const insert = body.search(/insertAsync|insert\(/);
  assert.ok(check !== -1 && (insert === -1 || check < insert),
    'and it has to be checked BEFORE the insert, or collection2 formats the error '
    + 'first and throws on the undefined field');
});

test('the console.log lines that printed a title nobody reads are gone (negative)', () => {
  // Comments out: the fix left a note SAYING the two console.log lines are gone,
  // and a note about a mistake must not read as the mistake.
  const body = bodyOf(lists, 'move')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n').filter(l => !/^\s*\/\//.test(l)).join('\n');
  assert.ok(!/console\.log/.test(body),
    'they logged the title to a log nobody reads and did not stop the crash');
});

// ── 3. neither reads as "unknown" in the Admin Panel again ──────────────────
test('both errors classify, as WeKan bugs rather than the admin\'s problem', () => {
  const sync = classifyDatabaseError(
    'Error: update is not available on the server. Please use updateAsync() instead',
    'mongodb');
  assert.ok(sync && sync.id === 'meteor3-sync-api', 'the Meteor 3 sync call classifies');
  assert.strictEqual(sync.kind, 'bug', 'there is nothing for an admin to configure');
  assert.ok(/github\.com\/wekan\/wekan\/issues/.test(sync.whatToDo),
    'so the advice is to upgrade and report, not to change a setting');

  const validation = classifyDatabaseError(
    "ValidationError: Failed validation\nCannot read properties of undefined (reading 'title')",
    'sqlite');
  assert.ok(validation && validation.id === 'schema-validation', 'the validation crash classifies');
  assert.strictEqual(validation.severity, 'warning');
});

test('the rules match on every database WeKan runs on', () => {
  // The same WeKan bug reaches an admin whether they run MongoDB or FerretDB on
  // any of its backends; a rule that only matched MongoDB would leave the
  // FerretDB users with the "unknown / unclassified" row this fixed.
  for (const db of ['mongodb', 'sqlite', 'postgresql', 'mysql', 'mariadb', 'hana']) {
    const hit = classifyDatabaseError('insert is not available on the server. Please use insertAsync() instead', db);
    assert.ok(hit && hit.id === 'meteor3-sync-api', `not classified on ${db}`);
  }
});

test('an ordinary database error is not swallowed by the new rules (negative)', () => {
  // The rules are deliberately specific: a connection failure is the database's
  // problem and must keep its own classification and its own advice.
  const other = classifyDatabaseError('MongoNetworkError: connection 4 to 127.0.0.1:27019 closed', 'mongodb');
  assert.ok(!other || other.id !== 'meteor3-sync-api',
    'a network error is not a Meteor 3 API misuse');
  const nothing = classifyDatabaseError('', 'mongodb');
  assert.ok(!nothing || typeof nothing === 'object', 'empty input must not throw');
  assert.doesNotThrow(() => classifyDatabaseError(null, 'mongodb'));
  assert.doesNotThrow(() => classifyDatabaseError('update is not available on the server. Please use updateAsync() instead', 'not-a-database'));
});

console.log(`\ndatabaseProblemsFixes: ${passed} tests passed`);
