'use strict';
// Retention of receipts and request IDs (maintainer decision of 2026-09-30):
// "compacted after 90 days to a permanent minimal id and outcome, so a late
// retry still finds its receipt." For stored PLANS that needed a compaction
// sweep (server/lib/syncPlanRetention.js), because a plan carries its whole
// work. The five receipt collections the decision also names are already that
// minimal form when they are written - an id, the identity it proves and its
// outcome, with no payload - so there is nothing to compact, and a sweep
// would only break the exact-shape checks their readers make:
//
//   scrumHistoryCompletions      operation id, board, row, user, direction, two hashes, completedAt, checksum
//   scrumHistoryRequests         request id, user, board, direction, selection (kind, row id, hash), createdAt, checksum
//   listSyncOperationIntents     intent id, actor, the five-string list scope, trigger, createdAt
//   listSyncOperationCompletions intent id, operation id, scope, step count, plan checksum, appliedAt
//   notificationTrayReceipts     receipt id, user id, activity id
//
// This test pins that: each receipt is built (by the real code where it is
// pure) and stays small and payload-free, and each reader still refuses any
// extra field - so a payload cannot creep into one of them unnoticed and grow
// it without bound.
//
// Run: node tests/receiptRetentionShape.test.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
console.log('receiptRetentionShape:');

const LIMIT = 1024; // bytes of JSON: an id and its identity, never a payload
const small = (doc, name) => {
  const size = Buffer.byteLength(JSON.stringify(doc));
  assert.ok(size < LIMIT, `${name} is ${size} bytes`);
  for (const [key, value] of Object.entries(doc)) {
    assert.ok(!Array.isArray(value), `${name}.${key} is not a list that can grow`);
  }
};
const long = 'x'.repeat(40);

test('tray receipts: id, user and activity', () => {
  const { receiptFor } = require('../server/lib/trayDelivery');
  const receipt = receiptFor(long, long);
  assert.deepEqual(Object.keys(receipt).sort(), ['_id', 'activityId', 'userId', 'version']);
  small(receipt, 'tray receipt');
  assert.match(read('server/lib/trayDelivery.js'), /if \(canonical\(value\) !== canonical\(expected\)\) fail\('tray-delivery-receipt-invalid'\)/,
    'a receipt with any other field is refused');
});

test('Scrum History requests: id, owner, direction and a fixed selection', () => {
  const { requestIdentity } = require('../server/lib/scrumHistoryRequest');
  const identity = requestIdentity({ userId: long, boardId: long, direction: 'undo', requestId: 'a'.repeat(64) });
  const doc = { ...identity, selection: { kind: 'scrum', rowId: long, sourceHash: 'f'.repeat(64) },
    createdAt: new Date(), checksum: 'f'.repeat(64) };
  small(doc, 'Scrum request');
  assert.match(read('server/lib/scrumHistoryRequest.js'), /\.\.\.Object\.keys\(identity\), 'selection', 'createdAt', 'checksum'\]\.sort\(\)\)/,
    'a request with any other field is refused');
});

test('Scrum History completions: the identity, its hashes and when', () => {
  const src = read('server/lib/scrumHistoryCompletion.js');
  assert.match(src, /return \{ _id: journal\.operationId, version: 1, boardId: journal\._id,\s*rowId: journal\.rowId, userId: journal\.userId, direction: journal\.direction,\s*sourceHash: row\.integrityHash, planHash: digest\(selector\) \};/);
  small({ _id: long, version: 1, boardId: long, rowId: long, userId: long, direction: 'redo',
    sourceHash: 'f'.repeat(64), planHash: 'f'.repeat(64), completedAt: new Date(), checksum: 'f'.repeat(64) }, 'Scrum completion');
  assert.match(src, /digest\(identity\) !== digest\(expected\)/, 'a completion with any other field is refused');
});

test('List Sync intents and completions: the list scope and the outcome', () => {
  const { intentIdentity } = require('../server/lib/syncOperationIntent');
  const scope = { boardId: long, listId: long, incarnation: long, revision: long, sourceKey: 'f'.repeat(64) };
  const intent = intentIdentity({ intentId: '123e4567-e89b-42d3-a456-426614174000', actorId: long, scope, trigger: 'manual' });
  small({ ...intent, createdAt: new Date() }, 'Sync intent');
  const intentSrc = read('server/lib/syncOperationIntent.js');
  assert.match(intentSrc, /'_id,actorId,createdAt,scope,trigger,version' : '_id,actorId,createdAt,scope,version'/);
  const journal = read('server/lib/syncOperationJournal.js');
  assert.match(journal, /Object\.keys\(row\)\.sort\(\)\.join\(','\) !== '_id,appliedAt,operationId,planChecksum,scope,total,version'/,
    'a completion is exactly its outcome');
  small({ _id: long, version: 1, operationId: long, scope, total: 1000, planChecksum: 'f'.repeat(64), appliedAt: new Date() }, 'Sync completion');
});

test('the stored plans, which do carry their work, are the ones that are compacted', () => {
  for (const rel of ['server/lib/syncNotificationRetention.js', 'server/lib/syncWebhookRetention.js']) {
    assert.match(read(rel), /createPlanRetentionKit/, rel);
  }
  assert.match(read('server/lib/syncPlanRetention.js'), /compactReceiptVersion: 1/);
});

console.log(`\nreceiptRetentionShape: ${passed} tests passed`);
