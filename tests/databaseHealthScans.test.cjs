'use strict';

// #6826: Admin Panel / Problems / Database also reports queries without an
// index - the big COLLSCANs in MongoDB's own "Slow query" log lines - and a
// database that reads an unusual number of documents per second
// (models/lib/databaseHealth.js). On one instance these found a 10 GB
// collection scanned three times per search and an hourly job reading all 1.1
// million cards; WeKan showed neither.
// Run: node tests/databaseHealthScans.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const h = require('../models/lib/databaseHealth.js');

let passed = 0;
const test = (name, fn) => { fn(); passed += 1; console.log('  ok -', name); };

const line = (at, attr, msg = 'Slow query') => JSON.stringify({ t: { $date: at }, msg, attr });
const SECRET = 'secret-value-7f3a';
const LOG = [
  line('2026-10-27T18:55:00.000+00:00', { ns: 'wekan.cards', planSummary: 'COLLSCAN', docsExamined: 1108017, durationMillis: 1155,
    command: { find: 'cards', filter: { recurrenceInterval: { $exists: true }, archived: { $ne: true } } } }),
  line('2026-10-27T18:56:00.000+00:00', { ns: 'wekan.sessiondata', planSummary: 'COLLSCAN', docsExamined: 47510, durationMillis: 900,
    command: { findAndModify: 'sessiondata', query: { userId: SECRET, sessionId: 's' } } }),
  line('2026-10-27T18:56:01.000+00:00', { ns: 'wekan.sessiondata', planSummary: 'COLLSCAN', docsExamined: 47510, durationMillis: 800,
    command: { find: 'sessiondata', filter: { sessionId: 's', userId: SECRET } } }),
  // not reported: a small lookup table read whole, an index scan, an internal
  // namespace, another message, and a line that is not JSON
  line('2026-10-27T18:56:02.000+00:00', { ns: 'wekan.settings', planSummary: 'COLLSCAN', docsExamined: 860, durationMillis: 183, command: { getMore: 1 } }),
  line('2026-10-27T18:56:03.000+00:00', { ns: 'wekan.cards', planSummary: 'IXSCAN { listId: 1 }', docsExamined: 50000, durationMillis: 2591,
    command: { find: 'cards', filter: { listId: 'l' } } }),
  line('2026-10-27T18:56:04.000+00:00', { ns: 'local.oplog.rs', planSummary: 'COLLSCAN', docsExamined: 900000, durationMillis: 400, command: {} }),
  line('2026-10-27T18:56:05.000+00:00', { ns: 'wekan.cards' }, 'Connection accepted'),
  'not json',
];

test('big collection scans are grouped by collection and filter fields', () => {
  const { groups, newestMs } = h.collectionScans(LOG, 0);
  assert.deepStrictEqual(groups.map(g => [g.ns, g.fields, g.count]), [
    ['wekan.cards', 'archived,recurrenceInterval', 1],
    ['wekan.sessiondata', 'sessionId,userId', 2],
  ]);
  assert.strictEqual(newestMs, Date.parse('2026-10-27T18:56:05.000+00:00'));
  const p = h.collectionScanProblem(groups);
  assert.strictEqual(p.type, 'db.collection-scan');
  assert.match(p.detail, /wekan\.cards \(filter on archived,recurrenceInterval: 1x, up to 1108017 documents, 1155 ms\)/);
});

test('negative: the values a query filtered on never reach the problem row', () => {
  const p = h.collectionScanProblem(h.collectionScans(LOG, 0).groups);
  assert.ok(!p.detail.includes(SECRET), p.detail);
});

test('negative: lines already seen are not counted again; no log, nothing found', () => {
  const { groups } = h.collectionScans(LOG, Date.parse('2026-10-27T18:56:00.500+00:00'));
  assert.deepStrictEqual(groups.map(g => [g.ns, g.count]), [['wekan.sessiondata', 1]]);
  assert.deepStrictEqual(h.collectionScans(null, 0).groups, []);
  assert.deepStrictEqual(h.collectionScans(['{}', '[]'], 0).groups, []);
});

test('the filter is found in find, findAndModify, aggregate, update and delete commands', () => {
  const scan = command => h.collectionScans([line('2026-10-27T19:00:00.000+00:00',
    { ns: 'wekan.x', planSummary: 'COLLSCAN', docsExamined: 20000, durationMillis: 1, command })], 0).groups[0].fields;
  assert.strictEqual(scan({ find: 'x', filter: { a: 1 } }), 'a');
  assert.strictEqual(scan({ findAndModify: 'x', query: { b: 1 } }), 'b');
  assert.strictEqual(scan({ aggregate: 'x', pipeline: [{ $match: { c: 1 } }] }), 'c');
  assert.strictEqual(scan({ update: 'x', updates: [{ q: { d: 1 }, u: {} }] }), 'd');
  assert.strictEqual(scan({ delete: 'x', deletes: [{ q: { e: 1 } }] }), 'e');
  assert.strictEqual(scan({ count: 'x' }), '');
});

test('documents read per second between two probes', () => {
  assert.strictEqual(h.scanRate(1000, 301000, 300), 1000);
  assert.strictEqual(h.scanRate(null, 5, 300), null);
  assert.strictEqual(h.scanRate(500, 100, 300), null, 'a database restart resets the counter');
  assert.strictEqual(h.scanRate(1, 2, 0), null);
  assert.ok(227000 > h.SCAN_RATE_PER_SEC, 'the rate seen on the instance that found this');
  assert.ok(!(1000 > h.SCAN_RATE_PER_SEC), 'negative: an ordinary rate is not a problem');
  assert.match(h.scanRateProblem(227000).detail, /227000 documents per second/);
  assert.strictEqual(h.scanRateProblem(227000).type, 'db.scan-rate');
});

test('the probe reads the log and the counter, and a refused getLog is skipped', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'server/lib/databaseHealth.js'), 'utf8');
  assert.match(src, /db\.admin\(\)\.command\(\{ getLog: 'global' \}\)/);
  assert.match(src, /health\.collectionScans\(log, state\.logSeenMs\)/);
  assert.match(src, /status\.metrics\.queryExecutor\.scannedObjects/);
  assert.match(src, /async function globalLog\(db\) \{\n\s+try \{[\s\S]*?\} catch \(e\) \{\n\s+return null;/);
});

test('both rows are documented', () => {
  const doc = fs.readFileSync(path.join(__dirname, '..', 'docs/Databases/MongoDB/Storage-Requirements.md'), 'utf8');
  assert.match(doc, /^\| `db\.collection-scan` \|/m);
  assert.match(doc, /^\| `db\.scan-rate` \|/m);
});

console.log(`\n${passed} tests passed`);
