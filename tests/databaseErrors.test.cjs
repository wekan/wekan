'use strict';

// What the database just said, what it means, and what to do about it.
//
// WeKan runs on MongoDB or on FerretDB v1 over SQLite, PostgreSQL, MySQL,
// MariaDB or SAP HANA. Each answers a broken query, a full disk or a refused
// login in its own words, and those words reach WeKan as an opaque string - so an
// admin saw "Error 1064 (42000): You have an error in your SQL syntax" with no
// way to know which database said it, that it is FerretDB's bug rather than their
// data, and that upgrading FerretDB is the fix.
//
// Every message below is one that was actually produced by a real database in the
// conformance runs, or is the documented wording of the condition.
//
// Run: node tests/databaseErrors.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const { classifyDatabaseError, configuredDatabase, databaseOf, RULES } =
  require('../models/lib/databaseErrors.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('databaseErrors:');

test('the messages the conformance runs actually produced are recognised', () => {
  const cases = [
    // MySQL, before the identifier quoting was fixed in FerretDB.
    ['Error 1064 (42000): You have an error in your SQL syntax; check the manual ...',
      { id: 'mysql-syntax', database: 'mysql', severity: 'critical' }],
    // MySQL, before the compose files connected as a user that may create databases.
    ["Error 1044 (42000): Access denied for user 'ferretdb'@'%' to database 'conformance'",
      { id: 'mysql-access-denied-database', database: 'mysql', severity: 'critical' }],
    // MariaDB, before the driver kept its defaults.
    ['this user requires mysql native password authentication',
      { id: 'mysql-native-password', severity: 'critical' }],
    // FerretDB, before the accumulators existed.
    ['$group accumulator "$avg" is not implemented yet',
      { id: 'not-implemented', severity: 'warning' }],
    // The SQL guard, if it ever fires.
    ['statement rejected by the SQL guard: statement separator \';\' at 42',
      { id: 'sql-guard-refused', severity: 'critical', kind: 'injection' }],
  ];

  for (const [message, expected] of cases) {
    const got = classifyDatabaseError(new Error(message), { configured: 'mysql' });
    for (const [k, v] of Object.entries(expected)) {
      assert.strictEqual(got[k], v, `${message.slice(0, 40)}: ${k} was ${got[k]}`);
    }
    assert.ok(got.whatToDo.length > 20, 'every rule says what to do');
    assert.ok(got.means.length > 20, 'and what it means');
  }
});

test('each database is named from its own dialect of error', () => {
  assert.strictEqual(databaseOf('Error 1064 (42000): ...', 'unknown'), 'mysql');
  assert.strictEqual(databaseOf('ERROR: syntax error at or near ";" (SQLSTATE 42601)', 'unknown'),
    'postgresql');
  assert.strictEqual(databaseOf('SQL logic error', 'unknown'), 'sqlite');
  assert.strictEqual(databaseOf('hdb: invalid session', 'unknown'), 'hana');
  // With nothing to go on, what WeKan is configured with.
  assert.strictEqual(databaseOf('something odd', 'postgresql'), 'postgresql');
  assert.strictEqual(databaseOf('something odd', undefined), 'unknown');
});

test('the machine problems are classified, and the retryable ones say so', () => {
  const disk = classifyDatabaseError('No space left on device', { configured: 'sqlite' });
  assert.strictEqual(disk.kind, 'disk');
  assert.strictEqual(disk.severity, 'critical');

  const deadlock = classifyDatabaseError('Deadlock found when trying to get lock', { configured: 'mysql' });
  assert.strictEqual(deadlock.act, 'retry', 'a deadlock is retried, not reported to the user');

  const gone = classifyDatabaseError('connection refused', { configured: 'postgresql' });
  assert.strictEqual(gone.act, 'reconnect');

  const dup = classifyDatabaseError('E11000 duplicate key error', { configured: 'mongodb' });
  assert.strictEqual(dup.severity, 'info', 'a unique index doing its job is not a problem');
});

test('an unknown error is still recorded, not swallowed', () => {
  const c = classifyDatabaseError(new Error('something nobody has seen before'),
    { configured: 'postgresql', operation: 'insert cards' });
  assert.strictEqual(c.id, 'unclassified');
  assert.strictEqual(c.database, 'postgresql');
  assert.strictEqual(c.operation, 'insert cards');
  assert.ok(c.message.includes('nobody has seen'));
});

test('it never throws, whatever it is handed', () => {
  for (const input of [null, undefined, 0, '', {}, [], new Error(''), { message: null }]) {
    const c = classifyDatabaseError(input, {});
    assert.ok(c && c.id, `no classification for ${JSON.stringify(input)}`);
  }
});

test('what WeKan is running on is read from the environment', () => {
  assert.strictEqual(configuredDatabase({ MONGO_URL: 'mongodb://mongo:27017/wekan' }), 'mongodb');
  assert.strictEqual(configuredDatabase({ MONGO_URL: 'mongodb://ferretdb:27017/wekan' }), 'sqlite');
  assert.strictEqual(configuredDatabase({ WEKAN_DB: 'postgresql' }), 'postgresql');
  assert.strictEqual(configuredDatabase({}), 'unknown');
});

test('every rule is complete, and the table has no dead regex', () => {
  for (const rule of RULES) {
    assert.ok(rule.id && rule.kind && rule.severity, `${rule.id}: incomplete`);
    assert.ok(['critical', 'warning', 'info'].includes(rule.severity), `${rule.id}: severity`);
    assert.ok(rule.match instanceof RegExp, `${rule.id}: match`);
    assert.ok(Array.isArray(rule.databases) && rule.databases.length, `${rule.id}: databases`);
    assert.ok(!rule.act || ['retry', 'reconnect'].includes(rule.act), `${rule.id}: act`);
  }
  assert.ok(RULES.length >= 15, `only ${RULES.length} rules`);
});

test('the problems reach Admin Panel / Problems', () => {
  const recorder = fs.readFileSync(path.join(ROOT, 'server/lib/databaseProblems.js'), 'utf8');
  assert.ok(/stream: 'database'/.test(recorder), 'recorded into the database stream');
  assert.ok(/db: classified\.database/.test(recorder), 'with WHICH database said it');
  assert.ok(/insertAsync/.test(recorder) && /catch/.test(recorder),
    'fire-and-forget: an error handler that awaits the database hangs when the database is the problem');
  assert.ok(/QUIET_MS|tooRecent/.test(recorder),
    'one event per problem per minute - a database that is down answers every query');
  assert.ok(/Meteor\._debug/.test(recorder), 'and it watches where Meteor surfaces them');

  const streams = fs.readFileSync(path.join(ROOT, 'models/eventLog.js'), 'utf8');
  assert.ok(/'database'/.test(streams), "the 'database' stream exists");

  const menu = fs.readFileSync(path.join(ROOT, 'client/components/settings/adminReports.js'), 'utf8');
  assert.ok(/'report-database'/.test(menu), 'the Problems menu has the pane');
  assert.ok(/showDatabase/.test(menu), 'and the pane is rendered');
  assert.ok(/r\.db \|\| r\.category/.test(menu),
    'and its first column names the database that said it');

  const jade = fs.readFileSync(path.join(ROOT, 'client/components/settings/adminReports.jade'), 'utf8');
  assert.ok(/stream="database"/.test(jade));

  const en = JSON.parse(fs.readFileSync(path.join(ROOT, 'imports/i18n/data/en.i18n.json'), 'utf8'));
  assert.ok(en.databaseReportTitle, 'and it has a title');

  assert.ok(fs.readFileSync(path.join(ROOT, 'server/imports.js'), 'utf8')
    .includes("import '/server/lib/databaseProblems';"), 'and it is loaded');
});

console.log(`\n${passed} tests passed`);
