'use strict';

// Plain-Node guard for retrying a write that the database was too busy to take
// (#6533). Run: node tests/sqliteBusyRetry.test.cjs
//
// The crash loop in #6533 was fixed - a transient database error no longer ends the
// boot or the process - and the reporter's next log, on 10.49, is the same
// contention arriving in front of a user instead:
//
//   Exception while invoking method '/users/updateAsync' MongoServerError:
//     ... [collection.go:191 sqlite.(*collection).UpdateAll]
//     [db.go:151 fsql.(*DB).InTransaction] database is locked (5) (SQLITE_BUSY)
//
// That reached the client: the edit failed, and the user reloaded to see what had
// actually happened. It was not supposed to. models/lib/databaseErrors.js has
// classified a locked SQLite as `{ id: 'deadlock', act: 'retry' }` with "Retried
// automatically." since it was written, and server/00processErrors.js says "the
// write is retried by whatever issued it" - and NOTHING read `act`. No code in
// WeKan retried anything.
//
// server/00retryBusyWrites.js is that retry, and this exercises it: the real module
// is loaded with a stub collection prototype, so what is checked is the behaviour -
// a busy write is retried and succeeds, a real fault is not retried at all, and an
// endlessly busy database still gets the original error, bounded in both attempts
// and wall-clock time.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

// What FerretDB on SQLite actually says, from the report. Retrying is keyed off the
// shared classifier, so this exact wording is what has to be recognised.
const BUSY = 'MongoServerError: [msg_update.go:133 handler.(*Handler).updateDocument] '
  + '[collection.go:191 sqlite.(*collection).UpdateAll] [db.go:151 fsql.(*DB).InTransaction] '
  + 'database is locked (5) (SQLITE_BUSY)';

// And what collection2 turns it into by the time it reaches the outermost wrapper -
// a ValidationError carrying the same text, which is the form in the reporter's
// SyncedCron traces.
const BUSY_VALIDATION = 'Failed validation [msg_update.go:133 '
  + 'handler.(*Handler).updateDocument] [collection.go:191 sqlite.(*collection).UpdateAll] '
  + 'database is locked (5) (SQLITE_BUSY)';

const DISK_FULL = 'SQLITE_FULL: database or disk is full';

// ── load the real module against a stub collection prototype ────────────────
// Most of the behaviour is checked on millisecond backoffs so the test stays quick;
// the delays themselves are checked on the SHIPPED numbers further down, which is
// why these go in through loadWith() rather than into process.env for good.
const FAST = {
  WEKAN_DB_RETRY_ATTEMPTS: '4',
  WEKAN_DB_RETRY_BASE_MS: '1',
  WEKAN_DB_RETRY_MAX_MS: '2',
  WEKAN_DB_RETRY_TOTAL_MS: '1000',
};

const { classifyDatabaseError } = require('../models/lib/databaseErrors');
const TRANSIENT = new Set(['deadlock', 'too-many-connections', 'connection-lost', 'timeout']);
// The same predicate server/00processErrors.js exports, so the module under test
// sees exactly what it sees in production.
const isTransientDatabaseError = error => {
  if (!error) return false;
  const classified = classifyDatabaseError(error);
  return !!classified && TRANSIENT.has(classified.id);
};

// The stub prototype. Each write method records the calls it got and answers from
// a queue the test sets up.
const calls = [];
function makeStubWrite(method) {
  return async function stubWrite(...args) {
    calls.push({ method, collection: this && this._name, args });
    const next = this.__answers.shift();
    if (next && next.throw) throw next.throw;
    return next ? next.value : 'ok';
  };
}

const CollectionProto = {};
for (const method of ['insertAsync', 'updateAsync', 'upsertAsync', 'removeAsync']) {
  CollectionProto[method] = makeStubWrite(method);
}
// Reads must be left alone: they are not what contends for SQLite's single writer.
CollectionProto.findOneAsync = makeStubWrite('findOneAsync');
const UNWRAPPED_READ = CollectionProto.findOneAsync;

const recorded = [];
const requireStub = id => {
  if (id === '/server/lib/databaseProblems') {
    return { recordDatabaseProblem: (error, options) => recorded.push({ error, options }) };
  }
  throw new Error(`unexpected require(${id})`);
};

const src = read('server/00retryBusyWrites.js')
  .replace(/^import .*$/gm, '')
  .replace(/^export /gm, '');

// Load the real module, wrapping the given prototype, with the given tuning in the
// environment. The module reads process.env at load, so each instance can have its
// own limits.
function loadWith(env, proto) {
  const saved = { ...process.env };
  Object.assign(process.env, env);
  const instance = {};
  // eslint-disable-next-line no-new-func
  new Function('exports', 'Mongo', 'isTransientDatabaseError', 'require', 'process',
    `${src}\nexports.busyRetryStats = busyRetryStats;\nexports.wrap = wrap;`
      + '\nexports.WRITE_METHODS = WRITE_METHODS;\nexports.delayFor = delayFor;'
      + '\nexports.MAX_ATTEMPTS = MAX_ATTEMPTS;',
  )(instance, { Collection: { prototype: proto } }, isTransientDatabaseError,
    requireStub, process);
  for (const key of Object.keys(env)) delete process.env[key];
  Object.assign(process.env, saved);
  return instance;
}

const lib = loadWith(FAST, CollectionProto);

// The module's summary line is checked below, not silenced - collected here while a
// test body runs, so it is asserted on instead of scrolling past.
const logged = [];

// A collection: the stub prototype plus a name and its queue of answers.
function collection(name, answers) {
  return Object.assign(Object.create(CollectionProto), { _name: name, __answers: answers });
}

let passed = 0;
const tests = [];
function test(name, fn) { tests.push([name, fn]); }

console.log('sqliteBusyRetry:');

test('a write the database was too busy to take is retried, and succeeds', async () => {
  const before = lib.busyRetryStats();
  const users = collection('users', [
    { throw: new Error(BUSY) },
    { throw: new Error(BUSY) },
    { value: { numberAffected: 1 } },
  ]);

  const result = await users.updateAsync({ _id: 'a' }, { $set: { x: 1 } });
  assert.deepStrictEqual(result, { numberAffected: 1 },
    'the caller gets the write\'s result, not an error - this is the '
    + "'/users/updateAsync' failure from the report");

  const after = lib.busyRetryStats();
  assert.strictEqual(after.retried - before.retried, 2, 'two retries');
  assert.strictEqual(after.recovered - before.recovered, 1, 'one recovery');
  assert.strictEqual(after.gaveUp - before.gaveUp, 0, 'and nothing given up on');
});

test('the arguments and the collection are passed through unchanged', async () => {
  calls.length = 0;
  const selector = { _id: 'a' };
  const modifier = { $set: { title: 'x' } };
  const options = { multi: true };
  const cards = collection('cards', [{ throw: new Error(BUSY) }, { value: 1 }]);

  await cards.updateAsync(selector, modifier, options);

  assert.strictEqual(calls.length, 2, 'called twice');
  for (const call of calls) {
    assert.strictEqual(call.collection, 'cards', '`this` must still be the collection');
    assert.deepStrictEqual(call.args, [selector, modifier, options],
      'the retry is the SAME write - a different one would not be idempotent');
  }
});

test("collection2's ValidationError wrapping of the same error is retried too", async () => {
  // The reporter's SyncedCron traces show the busy error arriving as
  // collection2's ValidationError, which is the form the outermost wrapper sees.
  const boards = collection('boards', [{ throw: new Error(BUSY_VALIDATION) }, { value: 1 }]);
  assert.strictEqual(await boards.updateAsync({}, {}), 1);
});

test('a real fault is thrown at once, and never retried', async () => {
  calls.length = 0;
  const before = lib.busyRetryStats();
  const cards = collection('cards', [{ throw: new Error(DISK_FULL) }, { value: 'unreachable' }]);

  await assert.rejects(() => cards.insertAsync({ _id: 'a' }), /disk is full/,
    'a full disk is not contention and must not be retried - retrying it would '
    + 'hide it and waste the wait');
  assert.strictEqual(calls.length, 1, 'called exactly once');
  assert.strictEqual(lib.busyRetryStats().retried - before.retried, 0);
  assert.strictEqual(lib.busyRetryStats().gaveUp - before.gaveUp, 0,
    'and it is not counted as a give-up either: nothing was given up on');
});

test('an endlessly busy database gets the ORIGINAL error, after bounded attempts', async () => {
  calls.length = 0;
  const before = lib.busyRetryStats();
  const always = () => ({ throw: new Error(BUSY) });
  const cards = collection('cards', Array.from({ length: 50 }, always));

  await assert.rejects(() => cards.removeAsync({ _id: 'a' }), err => {
    assert.ok(/SQLITE_BUSY/.test(err.message),
      'the database\'s own words reach the caller unchanged, so nothing is hidden');
    return true;
  });

  assert.strictEqual(calls.length, lib.MAX_ATTEMPTS,
    `bounded at ${lib.MAX_ATTEMPTS} attempts: waiting longer holds a method `
    + 'invocation and its slot in the pool while the contention gets worse');
  assert.strictEqual(lib.busyRetryStats().gaveUp - before.gaveUp, 1);

  // …and it is reported, so Admin Panel / Problems shows it even when the caller
  // catches the error and nothing reaches Meteor._debug.
  const last = recorded[recorded.length - 1];
  assert.ok(last, 'the give-up is recorded');
  assert.strictEqual(last.options.source, 'write');
  assert.ok(/^cards\.removeAsync/.test(last.options.operation),
    `which collection and which write: ${last.options.operation}`);
});

test('the total wall-clock is capped as well as the attempt count', async () => {
  // Attempts alone are not a bound: a long backoff with many attempts would let one
  // write sit for seconds. Both limits are checked, and the tighter one wins.
  const src2 = read('server/00retryBusyWrites.js');
  assert.ok(/MAX_TOTAL_MS/.test(src2) && /outOfTime/.test(src2),
    'there is a total-time bound');

  // 100 attempts allowed, but only 10ms in total: it must stop on time, not on count.
  const stub = { insertAsync: async function () { throw new Error(BUSY); } };
  loadWith({
    WEKAN_DB_RETRY_ATTEMPTS: '100',
    WEKAN_DB_RETRY_BASE_MS: '5',
    WEKAN_DB_RETRY_MAX_MS: '5',
    WEKAN_DB_RETRY_TOTAL_MS: '10',
  }, stub);

  const startedAt = Date.now();
  await assert.rejects(() => stub.insertAsync({}), /SQLITE_BUSY/);
  const elapsed = Date.now() - startedAt;
  assert.ok(elapsed < 500, `gave up on time, not on count (took ${elapsed}ms)`);
});

test('the backoff grows, is jittered, and is capped', async () => {
  // Exponential so a long lock hand-over is not hammered; jittered so writers
  // released together do not all come back together; capped so no single wait is
  // unbounded. Checked on the SHIPPED numbers - the instance above runs on
  // millisecond delays to keep the test quick, which is too coarse to see jitter in.
  const shipped = loadWith({}, { insertAsync: async () => 'ok' });

  // The defaults, read from the source rather than repeated here, so changing one
  // is checked against what it is supposed to be instead of quietly agreeing.
  const defaultOf = name => {
    const m = read('server/00retryBusyWrites.js')
      .match(new RegExp(`intEnv\\('${name}',\\s*(\\d+)\\)`));
    assert.ok(m, `${name} has a default`);
    return parseInt(m[1], 10);
  };
  const BASE = defaultOf('WEKAN_DB_RETRY_BASE_MS');
  const CAP = defaultOf('WEKAN_DB_RETRY_MAX_MS');
  assert.ok(BASE >= 10 && BASE <= 100,
    `the first wait is a lock hand-over, tens of milliseconds, not seconds (${BASE}ms)`);
  assert.ok(CAP >= BASE * 4 && CAP <= 1000, `and the cap is a fraction of a second (${CAP}ms)`);

  const seen = new Set();
  for (let i = 0; i < 60; i++) seen.add(shipped.delayFor(1));
  assert.ok(seen.size > 3, `the delay is jittered, not a constant (saw ${seen.size} values)`);

  const rangeAt = n => {
    const all = Array.from({ length: 500 }, () => shipped.delayFor(n));
    return { min: Math.min(...all), max: Math.max(...all) };
  };
  assert.ok(rangeAt(1).max <= Math.ceil(BASE * 1.5), 'the first wait is short');
  assert.ok(rangeAt(4).min > rangeAt(1).max, 'and it grows with the attempt number');
  assert.ok(rangeAt(20).max <= Math.ceil(CAP * 1.5),
    'while no single delay exceeds the cap plus its jitter');
  assert.ok(rangeAt(1).min >= 1, 'and never zero, or the retry is not a wait at all');
});

test('contention is summarised once, with what to do about it', async () => {
  // A line per retried write would make the log the new problem; a contended
  // database still has to be visible, and the summary is where an admin sees it.
  const src2 = read('server/00retryBusyWrites.js');
  assert.ok(/SUMMARY_EVERY_MS/.test(src2) && /now - lastSummaryAt < SUMMARY_EVERY_MS/.test(src2),
    'the summary is rate-limited');

  const summaries = logged.filter(line => line.startsWith('[db-retry]'));
  assert.ok(summaries.length >= 1, 'the first contention is reported promptly');
  assert.ok(summaries.length <= 3,
    `and then rate-limited, not once per write (${summaries.length} lines for `
    + `${lib.busyRetryStats().retried} retries)`);
  assert.ok(/retried/.test(summaries[0]) && /given up on/.test(summaries[0]),
    'it says how many were retried and how many were lost');
  assert.ok(/PostgreSQL/.test(summaries[0]),
    'and what to do when it is constant, which is the reporter\'s actual question');
});

test('only the write methods are wrapped, and wrapping twice does nothing', async () => {
  assert.deepStrictEqual(lib.WRITE_METHODS,
    ['insertAsync', 'updateAsync', 'upsertAsync', 'removeAsync'],
    'every write method of a Meteor 3 collection - the sync ones are gone on the server');

  for (const method of lib.WRITE_METHODS) {
    assert.strictEqual(CollectionProto[method].wekanRetriesBusyWrites, true,
      `${method} is wrapped`);
  }
  assert.strictEqual(CollectionProto.findOneAsync, UNWRAPPED_READ,
    'reads are left alone: SQLite in WAL mode does not block a reader against the '
    + 'writer, and this must not sit on the hottest path in the server');

  // Idempotent, so a second import (or a stray call) cannot nest the wrapper and
  // multiply the attempts.
  assert.strictEqual(lib.wrap(CollectionProto, 'updateAsync'), false);
});

test('the event log is retried but never reports on itself', async () => {
  // recordDatabaseProblem writes to `eventlog`, and that write comes straight back
  // through the wrapper - so reporting its failure would call the reporter from
  // inside itself.
  const before = recorded.length;
  const eventlog = collection('eventlog', Array.from({ length: 50 },
    () => ({ throw: new Error(BUSY) })));

  await assert.rejects(() => eventlog.insertAsync({}), /SQLITE_BUSY/);
  assert.strictEqual(recorded.length, before,
    'a failed event-log write files no report of its own');

  // It is still retried, though - the log entry is worth the same effort.
  const ok = collection('eventlog', [{ throw: new Error(BUSY) }, { value: 'id' }]);
  assert.strictEqual(await ok.insertAsync({}), 'id');
});

test('the retry is installed by the server, outside collection2', async () => {
  const imports = read('server/imports.js');
  const at = imports.indexOf("import '/server/00retryBusyWrites'");
  assert.notStrictEqual(at, -1, 'server/imports.js must load it');

  // After the process-error handling it belongs with, and from server/imports.js -
  // which runs after the Meteor packages, so this wrapper goes OUTSIDE the ones
  // collection2 and collection-hooks put on the same prototype. That is how it sees
  // collection2's ValidationError at all.
  assert.ok(at > imports.indexOf("import '/server/00processErrors'"));
  assert.ok(at < imports.indexOf("import '/models/boards'")
    || !imports.includes("import '/models/boards'"),
    'and before the models that use those collections');
});

test('the classifier no longer promises a retry nobody performs', async () => {
  const { RULES } = require('../models/lib/databaseErrors');
  const deadlock = RULES.find(rule => rule.id === 'deadlock');
  assert.ok(deadlock, 'the rule a locked SQLite matches');
  assert.strictEqual(deadlock.act, 'retry');
  assert.ok(/Retried automatically/.test(deadlock.whatToDo));

  // And the advice for a database that is CONSTANTLY contended says what to do
  // about it: the reporter asked outright whether PostgreSQL is an option on a
  // snap installation, and it is.
  assert.ok(/wekan-ferretdb-handler=postgresql/.test(deadlock.whatToDo),
    'the snap setting that moves the FerretDB backend to PostgreSQL');
  assert.ok(/docker-compose-ferretdb-v1-postgresql\.yml/.test(deadlock.whatToDo),
    'and the compose file that does it in Docker');
  assert.ok(fs.existsSync(path.join(ROOT, 'docker-compose-ferretdb-v1-postgresql.yml')),
    'which has to be a file that exists');
  assert.ok(/wekan-ferretdb-handler/.test(read('snap-src/bin/ferretdb-control')),
    'and a setting the snap really honours');
});

(async () => {
  const realLog = console.log;
  for (const [name, fn] of tests) {
    console.log = (...args) => { logged.push(args.join(' ')); };
    let error = null;
    try {
      await fn();
    } catch (err) {
      error = err;
    }
    console.log = realLog;

    if (error) {
      console.error(`  FAIL - ${name}\n    ${error.message}`);
      process.exitCode = 1;
    } else {
      passed++;
      console.log('  ok -', name);
    }
  }
  console.log(`\n${passed} tests passed`);
})();
