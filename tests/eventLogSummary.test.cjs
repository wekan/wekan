'use strict';

// Guard: Admin Panel → Problems records ONE ROW PER PROBLEM, not per event.
// Run: node tests/eventLogSummary.test.cjs
//
// A guard that sits on a path an attacker controls fires as fast as they can
// send: a lockout under attack, a canary in a loop, an SSRF probe walking a
// range. One document per event means the database grows with the attack, the
// Problems page becomes a scroll of near-identical lines, and the one event that
// mattered is somewhere in the middle of ten thousand that did not. The admin's
// question is never "list every attempt" - it is "what is happening, how much,
// and since when".
//
// So a problem is one row that accumulates: `count`, and the window
// `firstAt` … `at`. What makes two events the SAME problem is the whole design,
// and it is what these tests are mostly about - identity is the KIND of thing
// that happened, never who did it, because putting the actor in the key restores
// the cardinality this exists to remove.

const assert = require('assert');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const {
  IDENTITY_FIELDS, LATEST_FIELDS, MAX_ACTORS, summaryIdentity, summaryUpdate,
  actorUpdate, actorList, foldEvents,
} = require(path.join(ROOT, 'models/lib/eventLogSummary'));

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const T0 = new Date('2026-08-16T10:00:00Z');
const T1 = new Date('2026-08-16T10:30:00Z');
const T2 = new Date('2026-08-16T11:00:00Z');

const event = extra => Object.assign({
  stream: 'security', bleed: 'JamBleed', category: 'brute-force',
  action: 'blocked', source: 'DDP login', severity: 'high', cwe: 'CWE-307',
}, extra);

test('the same problem from different actors is ONE row', () => {
  const folded = foldEvents([
    event({ at: T0, username: 'alice', ip: '203.0.113.9' }),
    event({ at: T1, username: 'bob', ip: '198.51.100.4' }),
    event({ at: T2, username: 'carol', ip: '192.0.2.7' }),
  ]);
  assert.strictEqual(folded.length, 1,
    'three attempts at the same problem must not be three rows - that is the bug');
  assert.strictEqual(folded[0].count, 3, 'the row says how many');
  assert.deepStrictEqual([folded[0].firstAt, folded[0].at], [T0, T2],
    'and between when and when');
});

test('the row keeps the MOST RECENT actor, so there is still someone to act on', () => {
  const folded = foldEvents([
    event({ at: T0, username: 'alice', ip: '203.0.113.9', detail: 'first' }),
    event({ at: T2, username: 'carol', ip: '192.0.2.7', detail: 'latest' }),
  ]);
  assert.strictEqual(folded[0].username, 'carol');
  assert.strictEqual(folded[0].ip, '192.0.2.7');
  assert.strictEqual(folded[0].detail, 'latest',
    '"412 blocked in the last hour" still needs a name and an address to act on');
});

test('the latest available proxy location stays with the reported actor', () => {
  const location = { country: 'FI', city: 'Helsinki', via: 'Cloudflare' };
  const folded = foldEvents([
    event({ at: T0, username: 'alice', ip: '203.0.113.9' }),
    event({ at: T1, username: 'alice', ip: '203.0.113.9', location }),
  ]);
  assert.deepStrictEqual(folded[0].location, location);
  assert.ok(LATEST_FIELDS.includes('location'));
});

test('events arriving out of order still give the right window', () => {
  const folded = foldEvents([
    event({ at: T1, username: 'b' }),
    event({ at: T0, username: 'a' }),
    event({ at: T2, username: 'c' }),
  ]);
  assert.deepStrictEqual([folded[0].firstAt, folded[0].at], [T0, T2]);
  assert.strictEqual(folded[0].username, 'c', 'and the latest actor is by TIME, not by arrival');
});

test('different problems stay different rows (negative)', () => {
  // The summary must not fold everything into one line either. Each identity
  // field is a real distinction: a different guard, a different verdict, a
  // different severity are different problems.
  const base = { at: T0 };
  const folded = foldEvents([
    event(base),
    event(Object.assign({ bleed: 'SignupBleed' }, base)),
    event(Object.assign({ action: 'detected' }, base)),
    event(Object.assign({ source: 'REST login' }, base)),
    event(Object.assign({ severity: 'medium' }, base)),
    event(Object.assign({ stream: 'speed' }, base)),
  ]);
  assert.strictEqual(folded.length, 6, `expected six distinct problems, got ${folded.length}`);
});

test('the ACTOR is never part of the identity (negative)', () => {
  // This is the whole point. If the username, address or detail were in the key,
  // an attacker rotating any of them would get a row each and the collection
  // would grow with the attack exactly as before.
  for (const field of ['userId', 'username', 'ip', 'detail', 'message']) {
    assert.ok(!IDENTITY_FIELDS.includes(field),
      `${field} must not be part of what makes two events the same problem`);
    assert.ok(LATEST_FIELDS.includes(field),
      `${field} should describe the most recent occurrence instead`);
  }
  const folded = foldEvents([
    event({ at: T0, username: 'a', ip: '1.1.1.1', userId: 'x', detail: 'one' }),
    event({ at: T1, username: 'b', ip: '2.2.2.2', userId: 'y', detail: 'two' }),
  ]);
  assert.strictEqual(folded.length, 1, 'rotating the actor must not create rows');
});

test('a legacy row that already stands for several attempts keeps its count', () => {
  // The canary flush wrote `count` before any of this existed.
  const folded = foldEvents([
    event({ at: T0, count: 40 }),
    event({ at: T1, count: 2 }),
    event({ at: T2 }),
  ]);
  assert.strictEqual(folded[0].count, 43, '40 + 2 + 1');
});

test('the upsert increments rather than overwrites, and only sets firstAt once', () => {
  const update = summaryUpdate(event({}), T1);
  assert.deepStrictEqual(update.$inc, { count: 1 }, 'each occurrence adds one');
  assert.strictEqual(update.$set.at, T1, 'the last-seen time always moves');
  assert.strictEqual(update.$setOnInsert.firstAt, T1,
    'the first-seen time is written only when the row is created');
  assert.ok(!('count' in update.$set), 'a $set on count would throw the total away');
  assert.ok(!('firstAt' in update.$set), 'a $set on firstAt would keep resetting the window');
});

test('a missing field is matched as MISSING, not as undefined', () => {
  // `{ cwe: undefined }` is not a query Mongo answers usefully: it would fail to
  // find the row it just wrote and every occurrence would insert another one.
  const identity = summaryIdentity({ stream: 'speed', action: 'detected' });
  assert.deepStrictEqual(identity.cwe, { $exists: false });
  assert.deepStrictEqual(identity.bleed, { $exists: false });
  assert.strictEqual(identity.stream, 'speed');
  for (const value of Object.values(identity)) {
    assert.notStrictEqual(value, undefined, 'no field may be literally undefined');
  }
});

test('an empty string is the same as absent (negative)', () => {
  // record() defaults several fields to '' when they are unknown, and '' and
  // missing must not be two different problems.
  const a = summaryIdentity({ stream: 'security', cwe: '' });
  const b = summaryIdentity({ stream: 'security' });
  assert.deepStrictEqual(a, b);
  assert.ok(!('cwe' in summaryUpdate({ stream: 'security', cwe: '' }).$setOnInsert),
    'and an empty value is not written into the row');
});

test('the database stream keeps its own classification distinct', () => {
  // Two different database faults are two problems even when the stream,
  // severity and action all match.
  const folded = foldEvents([
    { stream: 'database', type: 'disk-full', db: 'sqlite', kind: 'disk', at: T0 },
    { stream: 'database', type: 'auth-failed', db: 'sqlite', kind: 'auth', at: T0 },
  ]);
  assert.strictEqual(folded.length, 2);
});

test('every logger folds into a summary, and none inserts an event (negative)', () => {
  const fs = require('fs');
  const fold = fs.readFileSync(path.join(ROOT, 'server/lib/eventLogFold.js'), 'utf8');
  assert.ok(/summaryIdentity\(evt\)/.test(fold) && /upsertAsync\(identity, \{/.test(fold),
    'the fold must find the problem\'s row and fold this occurrence into it');
  assert.ok(/catch \(e\)/.test(fold),
    'and it must be unable to throw into whatever called it');
  // All three streams, not only security: a slow query in a loop and a test
  // failing on every run repeat just as a guard under attack does.
  for (const f of ['securityLog.js', 'speedLog.js', 'testLog.js']) {
    const src = fs.readFileSync(path.join(ROOT, 'server/lib', f), 'utf8');
    assert.ok(/foldEventFireAndForget\(/.test(src), `${f} must fold`);
    assert.ok(!/EventLog\.insertAsync\(/.test(src),
      `${f} still inserts a document per event`);
  }
});

test('the migration folds legacy rows and is safe to re-run', () => {
  const fs = require('fs');
  const src = fs.readFileSync(path.join(ROOT, 'server/lib/eventLogSummaryMigration.js'), 'utf8');
  assert.ok(/firstAt: \{ \$exists: false \}/.test(src),
    'a row with firstAt is already a summary and must not be folded twice');
  assert.ok(/limit: BATCH/.test(src),
    'and it must work in batches - an attacked instance can have a very large collection');
  assert.ok(/foldEvents\(batch\)/.test(src), 'using the same folding the tests above pin');
});

// ── Who tried, and how many times each ──────────────────────────────────────

test('the row lists each username and address with its own count', () => {
  // What the admin asked for: `username1 25, 100.100.100.100 30`.
  const events = [];
  for (let i = 0; i < 25; i += 1) {
    events.push(event({ at: T0, username: 'username1', ip: '100.100.100.100' }));
  }
  for (let i = 0; i < 5; i += 1) events.push(event({ at: T1, ip: '100.100.100.100' }));
  const [summary] = foldEvents(events);
  assert.strictEqual(summary.count, 30, 'the problem happened thirty times');
  assert.deepStrictEqual(
    actorList(summary).map(a => `${a.value} ${a.count}`),
    ['100.100.100.100 30', 'username1 25'],
    'busiest first, each actor with its own count');
});

test('a username and an address are counted SEPARATELY, not as a pair', () => {
  // They answer different questions - which account, and where from - and one
  // attacker moving address would otherwise become a line per address.
  const [summary] = foldEvents([
    event({ at: T0, username: 'bob', ip: '1.1.1.1' }),
    event({ at: T1, username: 'bob', ip: '2.2.2.2' }),
  ]);
  const list = actorList(summary);
  const bob = list.find(a => a.value === 'bob');
  assert.strictEqual(bob.count, 2, 'bob was attacked twice, from two places');
  assert.strictEqual(bob.kind, 'user');
  assert.strictEqual(list.filter(a => a.kind === 'ip').length, 2, 'and each place is its own line');
});

test('an unauthenticated attempt is still attributed, by address', () => {
  const [summary] = foldEvents([event({ at: T0, ip: '203.0.113.9' })]);
  assert.deepStrictEqual(actorList(summary).map(a => a.value), ['203.0.113.9']);
});

test('an attempt with neither name nor address adds no actor (negative)', () => {
  const [summary] = foldEvents([event({ at: T0 })]);
  assert.deepStrictEqual(actorList(summary), [],
    'an empty actor entry would be a line saying nothing');
  assert.strictEqual(summary.count, 1, 'but the problem is still counted');
});

test('THE CAP: rotating addresses cannot grow the row without bound', () => {
  // The same bug one level down. An attacker with a botnet would otherwise put
  // one entry per address into the row and reintroduce the cost this removes.
  const events = [];
  for (let i = 0; i < MAX_ACTORS + 200; i += 1) {
    events.push(event({ at: T0, ip: `10.0.${Math.floor(i / 256)}.${i % 256}` }));
  }
  const [summary] = foldEvents(events);
  assert.strictEqual(Object.keys(summary.actors).length, MAX_ACTORS,
    `the row must name at most ${MAX_ACTORS} actors`);
  assert.strictEqual(summary.actorsOverflow, 200,
    'and count the rest, which is itself the signal that the source is spread');
  assert.strictEqual(summary.count, MAX_ACTORS + 200,
    'while the total is still exact');
});

test('the update adds a new actor only while there is room', () => {
  const full = new Set(Array.from({ length: MAX_ACTORS }, (_, i) => `key${i}`));
  const update = actorUpdate({ username: 'new', ip: '9.9.9.9' }, T0, 1, full);
  assert.deepStrictEqual(update.$set, {}, 'no new key is written when the row is full');
  assert.strictEqual(update.$inc.actorsOverflow, 2,
    'both the name and the address fall into the overflow');
});

test('a known actor increments rather than being rewritten', () => {
  const { actorKeyFor, actorsOf } = require(path.join(ROOT, 'models/lib/eventLogSummary'));
  const evt = { username: 'bob' };
  const key = actorKeyFor(actorsOf(evt)[0]);
  const update = actorUpdate(evt, T1, 1, new Set([key]));
  assert.strictEqual(update.$inc[`actors.${key}.count`], 1);
  assert.ok(!(`actors.${key}.value` in update.$set),
    'the value is already there; rewriting it every time is pointless work');
});

test('the write path does not read the row for every attempt', () => {
  // Under attack this is the hot path. Reading the row each time to apply the
  // cap would double the database work of the thing being made cheap.
  const fs = require('fs');
  const src = fs.readFileSync(path.join(ROOT, 'server/lib/eventLogFold.js'), 'utf8');
  assert.ok(/const knownActors = new Map\(\)/.test(src),
    'the known actor keys per row must be remembered between attempts');
  assert.ok(/MAX_CACHED_ROWS/.test(src),
    'and that cache must itself be bounded, or it grows for ever');
  assert.ok(/known\.add\(m\[1\]\)/.test(src),
    'an actor added by this attempt must be remembered, or the next one reads again');
});

console.log(`\neventLogSummary: ${passed} tests passed`);
