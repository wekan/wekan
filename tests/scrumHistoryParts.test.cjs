'use strict';
// Sprints with no card cap (maintainer decision of 2026-10-03): a Scrum
// History batch too large for one row is recorded as several rows sharing a
// batchId (models/lib/scrumHistory.js historyParts), the rollover plan lives in
// its own chunks (server/lib/scrumRolloverStore.js), and no 10,000-card limit
// is left in the Scrum code.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { calculateObjectSize } = require('bson');
const { historyParts, PART_RECORDS, PART_BYTES } = require('../models/lib/scrumHistory');

const size = doc => (doc ? calculateObjectSize(doc) : 0);
const record = (i, text = '') => ({ type: 'card', id: `c${i}`,
  before: { _id: `c${i}`, boardId: 'b', scrum: { sprintId: 's', acceptanceCriteria: text } },
  after: { _id: `c${i}`, boardId: 'b', scrum: { sprintId: null, pastSprintIds: ['s'], acceptanceCriteria: text } } });
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('a small batch stays one row, exactly as before', () => {
  const records = Array.from({ length: PART_RECORDS }, (_, i) => record(i));
  assert.deepEqual(historyParts(records, size), [records]);
  assert.deepEqual(historyParts([], size), []);
});

test('a large batch is cut by records, keeping order and every record once', () => {
  const records = Array.from({ length: 25 * PART_RECORDS + 3 }, (_, i) => record(i));
  const parts = historyParts(records, size);
  assert.equal(parts.length, 26);
  assert.ok(parts.every(part => part.length <= PART_RECORDS));
  assert.deepEqual(parts.flat(), records);
});

test('long card texts cut a batch by bytes, so every row stays far below the document limit', () => {
  const text = '漢'.repeat(10000);
  const records = Array.from({ length: 800 }, (_, i) => record(i, text));
  const parts = historyParts(records, size);
  assert.ok(parts.length > 1);
  for (const part of parts) {
    const side = { records: part.map(row => ({ type: row.type, id: row.id, document: row.after })) };
    // A restore journal and its restored row each hold two sides.
    assert.ok(2 * calculateObjectSize(side) < 16 * 1024 * 1024 / 2, `${calculateObjectSize(side)}`);
    assert.ok(part.reduce((sum, row) => sum + size(row.after), 0) <= PART_BYTES);
  }
  assert.deepEqual(parts.flat(), records);
});

test('NEGATIVE: one oversized record still forms its own part rather than being dropped', () => {
  const parts = historyParts([record(0), record(1, 'x'.repeat(10)), record(2)], size, { bytes: 1 });
  assert.deepEqual(parts.map(part => part.map(row => row.id)), [['c0'], ['c1'], ['c2']]);
});

test('History records a large batch as rows sharing a batchId, and undo and redo walk it', () => {
  const history = read('server/lib/scrumHistory.js');
  assert.match(history, /historyParts\(records/);
  assert.match(history, /batchId,\s*\n?\s*previousContent: historySide\(parts\[index\]/);
  assert.match(history, /nextMillisecond/);
  const undo = read('server/models/changeHistory.js');
  assert.match(undo, /const isBatchPart = /);
  // Both the request-id path and the plain path continue through the batch.
  assert.match(undo, /batchRequestId\(requestId, index\)/);
  assert.equal((undo.match(/nextBatchRow\(this\.userId, boardId, '(undo|redo)', row\.batchId\)/g) || []).length, 4);
});

test('NEGATIVE: no Scrum check reads the rollover plan as an array only, and no 10,000-card cap is left', () => {
  const files = ['server/scrum.js', 'server/lib/scrumHistory.js', 'server/lib/scrumTransferExport.js',
    'server/lib/scrumSnapshotInputs.js', 'server/lib/scrumDailyCapture.js', 'server/scrumDailySnapshots.js',
    'models/lib/scrum.js', 'models/lib/scrumTransfer.js'];
  for (const file of files) {
    const source = read(file);
    assert.doesNotMatch(source, /'rolloverPending\.0'/, file);
    assert.doesNotMatch(source, /rolloverPending\?\.length/, file);
    assert.doesNotMatch(source, /SCRUM_SNAPSHOT_LIMIT/, file);
    assert.doesNotMatch(source, /cards\.length > 10000|observedCards > 100000|ids\.size > 10000/, file);
  }
  const close = read('server/scrum.js');
  assert.match(close, /await storeRolloverPlan\(/);
  assert.doesNotMatch(close, /closedFromRevision: sprint\.revision, rolloverSprintId, rolloverPending \}/);
  const store = read('server/lib/scrumRolloverStore.js');
  assert.match(store, /CHUNK_BYTES/);
  assert.match(store, /ROLLOVER_PENDING = \{ \$or: \[\{ rolloverPending: true \}, \{ 'rolloverPending\.0'/);
});
