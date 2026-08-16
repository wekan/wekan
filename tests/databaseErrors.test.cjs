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
const { classifyDatabaseError, configuredDatabase, databaseOf, redactCredentials, RULES } =
  require('../models/lib/databaseErrors.js');

// The top-level keys of the object literal that starts at `from` in `src`.
function objectKeysAt(src, from) {
  const open = src.indexOf('{', from);
  let depth = 0;
  let end = open;
  for (let i = open; i < src.length; i += 1) {
    if (src[i] === '{') depth += 1;
    else if (src[i] === '}') {
      depth -= 1;
      if (depth === 0) { end = i; break; }
    }
  }
  const body = src.slice(open + 1, end);
  // Only depth-1 keys: `{ type: String, optional: true }` values must not count.
  const keys = [];
  let level = 0;
  for (const line of body.split('\n')) {
    const m = level === 0 && line.match(/^\s*([A-Za-z_$][\w$]*)\s*:/);
    if (m) keys.push(m[1]);
    for (const ch of line) {
      if (ch === '{' || ch === '[' || ch === '(') level += 1;
      if (ch === '}' || ch === ']' || ch === ')') level -= 1;
    }
  }
  return keys;
}

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

  const menu = fs.readFileSync(path.join(ROOT, 'client/components/settings/adminProblems.js'), 'utf8');
  assert.ok(/'report-database'/.test(menu), 'the Problems menu has the pane');
  const paneJade = fs.readFileSync(
    path.join(ROOT, 'client/components/settings/adminProblems.jade'), 'utf8');
  assert.ok(/isPane 'report-database'/.test(paneJade), 'and the pane is rendered');
  assert.ok(/r\.db \|\| r\.category/.test(menu),
    'and its first column names the database that said it');

  const jade = fs.readFileSync(path.join(ROOT, 'client/components/settings/adminProblems.jade'), 'utf8');
  assert.ok(/stream="database"/.test(jade));

  const en = JSON.parse(fs.readFileSync(path.join(ROOT, 'imports/i18n/data/en.i18n.json'), 'utf8'));
  assert.ok(en.databaseReportTitle, 'and it has a title');

  assert.ok(fs.readFileSync(path.join(ROOT, 'server/imports.js'), 'utf8')
    .includes("import '/server/lib/databaseProblems';"), 'and it is loaded');
});

// The bug this pins: a database problem reached Admin Panel / Problems / Database
// problems with an EMPTY Category, Name and Action, and its detail said "read the
// message below" with no message anywhere on the page. Nothing was wrong with the
// classifier or the recorder - collection2 cleans every insert against the
// collection's schema with `filter: true`, and `db`, `kind`, `type` and `message`
// were not IN the schema, so those four fields were dropped on the way to the
// database. A field a logger writes and the schema does not declare is invisible.
test('every field an event logger writes is declared in the EventLog schema', () => {
  const streams = fs.readFileSync(path.join(ROOT, 'models/eventLog.js'), 'utf8');
  const schema = objectKeysAt(streams, streams.indexOf('new SimpleSchema('));
  for (const field of ['stream', 'at', 'severity', 'detail', 'db', 'kind', 'type', 'message']) {
    assert.ok(schema.includes(field), `EventLog schema is missing ${field}`);
  }

  const writers = [
    'server/lib/databaseProblems.js',
    'server/lib/securityLog.js',
    'server/lib/speedLog.js',
    'server/lib/cpuLog.js',
    'server/lib/testLog.js',
  ];
  for (const file of writers) {
    const src = fs.readFileSync(path.join(ROOT, file), 'utf8');
    // Four of them build `const doc = { … }` and insert it; the database recorder
    // passes the literal straight to insertAsync.
    const start = src.includes('const doc =')
      ? src.indexOf('const doc =')
      : src.indexOf('EventLog.insertAsync(');
    assert.ok(start >= 0, `${file}: no event document found`);
    for (const key of objectKeysAt(src, start)) {
      assert.ok(schema.includes(key),
        `${file} writes "${key}", which the EventLog schema does not declare - ` +
        'collection2 would drop it silently');
    }
  }
});

test('the page shows what the database said, not only what WeKan makes of it', () => {
  const menu = fs.readFileSync(path.join(ROOT, 'client/components/settings/adminProblems.js'), 'utf8');
  assert.ok(/r\.detail.*r\.message|r\.message.*r\.detail/.test(menu),
    'the Detail column carries the database\'s own message beside the advice');

  // ... and searching for a phrase out of that message finds the row showing it.
  const streams = fs.readFileSync(path.join(ROOT, 'models/eventLog.js'), 'utf8');
  const selector = streams.slice(streams.indexOf('function streamSelector'),
    streams.indexOf('Meteor.methods'));
  for (const field of ['message', 'db', 'kind', 'type']) {
    assert.ok(new RegExp(`\\{ ${field}: rx \\}`).test(selector),
      `the stream search does not look at ${field}`);
  }

  // The unclassified advice may not promise a message that is not there.
  const unknown = classifyDatabaseError('something nobody has seen before', {});
  assert.ok(!/below/.test(unknown.whatToDo),
    'nothing is "below" a table cell - the message is joined into the same cell');
});

test('a connection URL in the message loses its password before it is stored', () => {
  const cases = [
    ['failed to connect to mongodb://wekan:s3cret@mongo:27017/wekan',
      'mongodb://wekan:***@mongo:27017/wekan'],
    ['pq: password authentication failed for user "ferretdb" (postgres://ferretdb:hunter2@db:5432/ferretdb)',
      'postgres://ferretdb:***@db:5432/ferretdb'],
  ];
  for (const [message, expected] of cases) {
    const out = redactCredentials(message);
    assert.ok(out.includes(expected), `not redacted: ${out}`);
    assert.ok(!/s3cret|hunter2/.test(out), `the password survived: ${out}`);
  }

  // The host, port and database name are what makes the message useful, and a URL
  // with no password in it is not rewritten at all.
  assert.strictEqual(redactCredentials('mongodb://mongo:27017/wekan'),
    'mongodb://mongo:27017/wekan');
  assert.strictEqual(redactCredentials('mongodb://wekan@mongo:27017/wekan'),
    'mongodb://wekan@mongo:27017/wekan');
  // And it is applied where nobody can forget it: on the way out of the classifier.
  const c = classifyDatabaseError(new Error('bad auth: mongodb://u:p@h:27017/w'), {});
  assert.ok(!/:p@/.test(c.message), 'classifyDatabaseError returns a redacted message');
  assert.strictEqual(c.id, 'auth-failed', 'and still classifies it');
});

console.log(`\n${passed} tests passed`);
