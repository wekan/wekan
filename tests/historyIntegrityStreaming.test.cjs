'use strict';
// The hourly History integrity audit loaded each board's whole History - every
// row with its full previous and new content - into memory and verified the
// array. A production server (v13.13) died with "JavaScript heap out of memory"
// 42 and 74 seconds after the audit started, the first hourly run after a
// restart both times (MongoDB log: the audit's changeHistory distinct, then the
// crash). The audit now streams each board through historyVerifier, which
// keeps hashes and small summaries, not rows.
// Run: node --test tests/historyIntegrityStreaming.test.cjs
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { hashHistoryRow, verifyHistoryRows, historyVerifier, isConcurrentFork } = require('../models/lib/changeHistoryIntegrity');

const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
const big = 'x'.repeat(10000);
let n = 0;
function row(boardId, previous, extra = {}) {
  n += 1;
  const r = { _id: `r${n}`, boardId, entityType: 'card', entityId: 'c', group: 'title', changeType: 'edited',
    previousContent: { field: 'title', value: big }, newContent: { field: 'title', value: `t${n}` },
    userId: 'u', createdAt: new Date(Date.UTC(2026, 10, 17, 1, 0, n)), previousHash: previous ? previous.integrityHash : null, ...extra };
  r.integrityHash = hashHistoryRow(r);
  return r;
}

// A board with everything the audit looks for: a chain, a race fork (two
// rows naming one predecessor a second apart), a late fork, a second root, a
// tampered row and a row whose predecessor is gone.
function fixture() {
  const a = row('b'), b = row('b', a), c = row('b', b), race = row('b', b);
  const late = row('b', a, { createdAt: new Date(Date.UTC(2026, 10, 18)) });
  late.integrityHash = hashHistoryRow(late);
  const root2 = row('b', null);
  const tampered = row('b', c); tampered.newContent = { field: 'title', value: 'changed later' };
  const orphan = row('b', { integrityHash: 'f'.repeat(64) });
  return [a, b, c, race, late, root2, tampered, orphan];
}
const shape = failures => failures.map(f => [f.reason, f.row._id, f.sibling ? f.sibling._id : null]);

test('streamed, the audit finds exactly what the whole-array audit found, in the same order', () => {
  const rows = fixture();
  const whole = verifyHistoryRows(rows);
  const verifier = historyVerifier();
  rows.forEach(r => verifier.add(r));
  const streamed = verifier.finish();
  assert.deepStrictEqual(shape(streamed), shape(whole));
  assert.deepStrictEqual(whole.map(f => f.reason).sort(),
    ['checksum-mismatch', 'history-fork', 'history-fork', 'multiple-history-roots', 'predecessor-missing']);
  // The race and the late fork keep their verdicts on summaries too.
  assert.deepStrictEqual(streamed.map(f => isConcurrentFork(f)), whole.map(f => isConcurrentFork(f)));
  assert.ok(streamed.some(f => isConcurrentFork(f)) && streamed.some(f => f.reason === 'history-fork' && !isConcurrentFork(f)));
});

test('a streamed failure carries no row content: memory is hashes, not History', () => {
  const verifier = historyVerifier();
  fixture().forEach(r => verifier.add(r));
  for (const failure of verifier.finish()) {
    for (const held of [failure.row, failure.sibling].filter(Boolean)) {
      assert.deepStrictEqual(Object.keys(held).sort(), ['_id', 'boardId', 'createdAt', 'hashValid', 'integrityHash', 'previousHash']);
    }
  }
});

test('negative: a predecessor that arrives later is not missing, and an intact chain reports nothing', () => {
  const a = row('b2'), b = row('b2', a), c = row('b2', b);
  for (const order of [[a, b, c], [c, b, a], [b, a, c]]) {
    const verifier = historyVerifier();
    order.forEach(r => verifier.add(r));
    assert.deepStrictEqual(verifier.finish(), []);
    assert.deepStrictEqual(verifyHistoryRows(order), []);
  }
  const empty = historyVerifier();
  [null, undefined, {}, { boardId: 'b' }].forEach(r => empty.add(r));
  assert.deepStrictEqual(empty.finish(), []);
});

test('the audit streams each board through the verifier and never fetches a board whole', () => {
  const scan = read('server/lib/historyIntegrityScan.js');
  const body = scan.slice(scan.indexOf('export async function runHistoryIntegrityScan('), scan.indexOf('\nif (Meteor.isServer'));
  assert.doesNotMatch(body, /fetchAsync\(|toArray\(/, 'no board loaded whole');
  assert.match(body, /const verifier = historyVerifier\(\);/);
  assert.match(body, /for await \(const row of cursor\) \{\s*verifier\.add\(row\);/);
  assert.match(body, /batchSize: BATCH/);
  assert.match(body, /await cursor\.close\(\)/);
});
