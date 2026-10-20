'use strict';

const assert = require('node:assert/strict');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const {
  canonical, sha256, hashHistoryRow, rowHashIsValid, verifyHistoryRows,
} = require('../models/lib/changeHistoryIntegrity');

for (const value of ['', 'abc', 'WeKan ® 🐙', 'x'.repeat(1000)]) {
  assert.equal(sha256(value), crypto.createHash('sha256').update(value).digest('hex'));
}
const helperSource = fs.readFileSync(
  path.join(__dirname, '../models/lib/changeHistoryIntegrity.js'), 'utf8',
);
assert.doesNotMatch(helperSource, /require\(['"](?:node:)?crypto['"]\)/,
  'the isomorphic history helper must not pull Node crypto into the browser');

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

// Admin Panel / Problems / Security showed "HistoryIntegrity checksum-mismatch"
// as critical tampering, 89472 times, for rows nobody touched. A row is stored
// the way Meteor's driver stores it (ignoreUndefined): an undefined content
// property is dropped, so a row hashed WITH it failed its own check after a
// plain database round trip. Stored here exactly as the driver does it.
const { serialize, deserialize } = require('bson');
const stored = row => deserialize(serialize(row, { ignoreUndefined: true }));
const unsetBefore = {
  _id: 'h-undef', boardId: 'b1', entityType: 'list', entityId: 'l1', group: 'list',
  changeType: 'edited', userId: 'u1', createdAt: new Date('2026-10-15T08:29:56Z'),
  previousContent: { deleted: true, deletedAt: undefined, deleteBatchId: 'x1' },
  newContent: { deleted: false, deleteBatchId: 'x1', tags: ['a', undefined] },
};
unsetBefore.integrityHash = hashHistoryRow(unsetBefore);
const roundTripped = stored(unsetBefore);
assert.equal('deletedAt' in roundTripped.previousContent, false, 'the driver drops an undefined property');
assert.ok(rowHashIsValid(roundTripped), 'a row hashed now is valid as the database returns it');
assert.ok(rowHashIsValid(unsetBefore), 'and before it is written');

// Rows written before this fix were hashed WITH the undefined key. The key the
// other side of the change has is re-added as undefined, which reproduces it.
const legacy = { ...unsetBefore, previousContent: { deleted: true, deletedAt: undefined }, newContent: { deleted: false, deletedAt: new Date(5) } };
legacy.integrityHash = sha256(canonical(Object.fromEntries(
  ['boardId', 'swimlaneId', 'listId', 'cardId', 'entityType', 'entityId', 'group', 'changeType', 'previousContent',
    'newContent', 'userId', 'createdAt', 'batchId', 'restoredFromId', 'restoredByUserId', 'previousHash']
    .map(key => [key, legacy[key]]))));
assert.ok(rowHashIsValid(stored(legacy)), 'a row written before the fix is valid too');
assert.equal(verifyHistoryRows([stored(legacy)]).filter(f => f.reason === 'checksum-mismatch').length, 0);

// Negative: real tampering is still caught, legacy rows included.
for (const tamper of [
  row => { row.newContent.deletedAt = new Date(6); },            // a value changed
  row => { delete row.newContent.deletedAt; },                    // a real value removed
  row => { row.previousContent.deleted = false; },                // the other side changed
  row => { row.previousContent.extra = undefined; row.newContent.extra = 1; }, // a key added
]) {
  const row = stored(legacy);
  tamper(row);
  assert.equal(rowHashIsValid(row), false, `still caught: ${tamper}`);
}
const nowTampered = stored(unsetBefore);
nowTampered.previousContent.deleteBatchId = 'x2';
assert.equal(rowHashIsValid(nowTampered), false);

console.log('changeHistoryIntegrity: chain and tamper checks passed');
