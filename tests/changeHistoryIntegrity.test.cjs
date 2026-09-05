'use strict';

const assert = require('node:assert/strict');
const { canonical, hashHistoryRow, rowHashIsValid, verifyHistoryRows } = require('../models/lib/changeHistoryIntegrity');

const first = {
  boardId: 'b1', entityType: 'card', entityId: 'c1', group: 'title',
  changeType: 'edited', previousContent: { value: 'before', field: 'title' },
  newContent: { field: 'title', value: 'after' }, userId: 'u1',
  createdAt: new Date('2026-09-05T12:00:00Z'), previousHash: null,
};
first.integrityHash = hashHistoryRow(first);
assert.ok(rowHashIsValid(first));

const second = { ...first, entityId: 'c2', previousHash: first.integrityHash,
  createdAt: new Date('2026-09-05T12:00:01Z') };
second.integrityHash = hashHistoryRow(second);
assert.ok(rowHashIsValid(second));

for (const mutate of [
  row => { row.userId = 'attacker'; },
  row => { row.boardId = 'other'; },
  row => { row.newContent.value = 'tampered'; },
  row => { row.previousHash = '0'.repeat(64); },
  row => { row.createdAt = new Date('2026-09-05T12:00:02Z'); },
]) {
  const row = structuredClone(second);
  mutate(row);
  assert.equal(rowHashIsValid(row), false);
}

const mutable = { ...second, undone: true, undoneAt: new Date(), superseded: true };
assert.ok(rowHashIsValid(mutable), 'undo/redo stack state is intentionally outside immutable hash');
assert.equal(canonical({ b: 1, a: 2 }), canonical({ a: 2, b: 1 }),
  'object insertion order cannot change a canonical hash');
assert.throws(() => canonical({ bad: Infinity }), /non-finite/);

assert.deepEqual(verifyHistoryRows([first, second]), []);
const orphan = { ...second, previousHash: 'f'.repeat(64) };
orphan.integrityHash = hashHistoryRow(orphan);
assert.equal(verifyHistoryRows([first, orphan])[0].reason, 'predecessor-missing');
const fork = { ...second, entityId: 'c3' };
fork.integrityHash = hashHistoryRow(fork);
assert.ok(verifyHistoryRows([first, second, fork]).some(item => item.reason === 'history-fork'));

console.log('changeHistoryIntegrity: chain and tamper checks passed');
