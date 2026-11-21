'use strict';

// models/lib/timeEntries.js: a card's time, by day. Run: node tests/timeEntries.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const T = require('../models/lib/timeEntries.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

test('a logged entry: a day, hours and a note', () => {
  assert.deepEqual(T.normalizeTimeEntry({ date: '2027-04-05', hours: 1.5, note: ' design ' }), { date: '2027-04-05', hours: 1.5, note: 'design' });
});

test('negative: no day, no hours, too many hours, or another field is refused', () => {
  assert.throws(() => T.normalizeTimeEntry({ hours: 1 }), /YYYY-MM-DD/);
  assert.throws(() => T.normalizeTimeEntry({ date: '2027-02-30', hours: 1 }), /calendar/);
  assert.throws(() => T.normalizeTimeEntry({ date: '2027-04-05', hours: 0 }), /more than 0/);
  assert.throws(() => T.normalizeTimeEntry({ date: '2027-04-05', hours: -1 }), /more than 0/);
  assert.throws(() => T.normalizeTimeEntry({ date: '2027-04-05', hours: 1001 }), /at most 1000/);
  assert.throws(() => T.normalizeTimeEntry({ date: '2027-04-05', hours: 1, invoiceId: 'x' }), /Unsupported/);
});

test('reconcile: a change of spent time becomes an entry of that day', () => {
  assert.deepEqual(T.reconcile(2, 3.5, [{ hours: 2 }], '2027-04-05'), [{ date: '2027-04-05', hours: 1.5, source: 'card' }]);
  assert.deepEqual(T.reconcile(3, 1, [{ hours: 3 }], '2027-04-05'), [{ date: '2027-04-05', hours: -2, source: 'card' }],
    'lowering the time is a correction');
});

test('reconcile: time spent before entries existed becomes one undated entry, once', () => {
  assert.deepEqual(T.reconcile(10, 12, [], '2027-04-05'), [
    { date: null, hours: 10, source: 'legacy' },
    { date: '2027-04-05', hours: 2, source: 'card' },
  ]);
  assert.deepEqual(T.reconcile(12, 13, [{ hours: 10, source: 'legacy' }, { hours: 2, source: 'card' }], '2027-04-06'),
    [{ date: '2027-04-06', hours: 1, source: 'card' }], 'not a second legacy entry');
});

test('reconcile: nothing to add when the entries already sum to the total (a logged entry)', () => {
  // timeEntryAdd inserts the entry, then raises spentTime by its hours.
  assert.deepEqual(T.reconcile(4, 5.5, [{ hours: 4 }, { hours: 1.5, source: 'manual' }], '2027-04-05'), []);
  assert.deepEqual(T.reconcile(0, 0, [], '2027-04-05'), []);
});

test('entries of a period, both days inclusive; undated only on request', () => {
  const entries = [{ date: '2027-03-31', hours: 1 }, { date: '2027-04-01', hours: 2 }, { date: '2027-04-30', hours: 3 },
    { date: '2027-05-01', hours: 4 }, { date: null, hours: 5 }];
  assert.deepEqual(T.entriesInPeriod(entries, { start: '2027-04-01', end: '2027-04-30' }).map(e => e.hours), [2, 3]);
  assert.deepEqual(T.entriesInPeriod(entries, { start: '2027-04-01', end: '2027-04-30', includeUndated: true }).map(e => e.hours), [2, 3, 5]);
  assert.deepEqual(T.entriesInPeriod(entries, {}).map(e => e.hours), [1, 2, 3, 4]);
  assert.equal(T.sumHours(entries), 15);
});

test('the server keeps entries in step with every write of spentTime, and the methods check the card', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'server/timeEntries.js'), 'utf8');
  assert.match(src, /Cards\.after\.update\(async function \(userId, doc, fieldNames\) \{\n  if \(!fieldNames\.includes\('spentTime'\)\) return;/);
  assert.match(src, /reconcileCardEntries\(doc, previous, userId\)/);
  for (const method of ['timeEntryAdd', 'timeEntryRemove']) {
    const body = src.slice(src.indexOf(`async ${method}(`), src.indexOf('\n  },', src.indexOf(`async ${method}(`)));
    assert.match(body, /canEditCardOrLinkedCard\(userId, card\)/, method);
  }
  const remove = src.slice(src.indexOf('async timeEntryRemove('));
  assert.match(remove, /if \(entry\.invoiceId\) invalid\(new Error\('This time is on an invoice'\)\)/, 'negative: invoiced time is a record');
  assert.match(remove.slice(0, remove.indexOf('\n  },')), /if \(entry\.approval === 'approved'\) invalid\(new Error\('This time is approved'\)\)/,
    'negative: approved time is what the board bills, and stays');
  // The card's popup shows the decision; only a rejection carries its note.
  assert.match(src, /approval: e\.approval \|\| null, approvalNote: e\.approval === 'rejected' \? e\.approvalNote \|\| '' : ''/);
  assert.match(src, /async timeEntriesOfCard[\s\S]*?mayRead\(userId, card\)/);
  assert.match(fs.readFileSync(path.join(__dirname, '..', 'models/timeEntries.js'), 'utf8'),
    /TimeEntries\.deny\(\{ insert: \(\) => true, update: \(\) => true, remove: \(\) => true \}\)/);
});

console.log(`\ntimeEntries: ${passed} tests passed`);
