'use strict';

// Moving attachments out of CollectionFS: two records may share one binary.
// Run: node tests/collectionFsSharedBinary.test.cjs
//
// #6596: "attachmentMigration fails; problem with identical files". Moving from
// MongoDB CollectionFS to File-System stopped on some attachments with
//
//   [attachmentMigration] Failed to move item xxxx.xxxj
//   MongoRuntimeError: FileNotFound: file 66336fc372e64200010f4832 was not found
//
// A CollectionFS filerecord points at its binary by `copies.<coll>.key`, the
// _id of a file in the `cfs_gridfs.<coll>` bucket. TWO filerecords can carry the
// SAME key - the same file attached twice, or a board copied with its
// attachments - and the migration deleted the binary as soon as it had moved
// the FIRST of them. The second then read a file that was no longer there, and
// failed with a GridFS error naming only an id.
//
// So: the binary is deleted only when no other filerecord still names it, and a
// binary that really is missing is reported as an attachment that has nothing
// to move rather than as a MongoDB stack trace.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const store = read('models/lib/collectionFsStore.js');
const move = read('server/attachmentBulkMove.js');
const settings = read('client/components/settings/attachments.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('collectionFsSharedBinary:');

// ── the shared binary ──────────────────────────────────────────────────────

const del = store.slice(store.indexOf('export async function deleteCollectionFsRecord'));
const delBody = del.slice(0, del.indexOf('\n}\n'));

test('the binary is kept while another record still names it', () => {
  assert.ok(/countDocuments\(\s*\n?\s*\{ \[`copies\.\$\{coll\}\.key`\]: gridFsKey \}/.test(delBody),
    'the other filerecords are asked about this exact key');
  assert.ok(/if \(stillUsed > 0\) \{\n\s+return;/.test(delBody),
    'and the binary stays when one of them still points at it');
  assert.ok(/bucket\.delete\(toObjectId\(gridFsKey\)\)/.test(delBody),
    'otherwise it goes, as before');
});

test('the record itself is deleted first, so it cannot count itself (negative)', () => {
  // Asking before the delete would always find at least one user - this record
  // - and no binary would ever be removed.
  const recordDelete = delBody.indexOf('deleteOne({ _id: sourceId })');
  const check = delBody.indexOf('countDocuments');
  assert.ok(recordDelete !== -1 && recordDelete < check,
    'the filerecord goes before the question is asked');
  assert.ok(/never counts itself/.test(delBody), 'and the reason is written down');
});

test('an unanswerable question keeps the binary (negative)', () => {
  // A file left behind can be removed later; an attachment deleted out from
  // under another record cannot be brought back.
  const rescue = delBody.slice(delBody.indexOf('Could not check for shared binary') - 300);
  assert.ok(/return;/.test(rescue), 'the delete is skipped when the check fails');
  assert.ok(/a file left behind is\n\s*\/\/ recoverable/.test(delBody),
    'with the reason for erring that way');
});

// ── the missing binary ─────────────────────────────────────────────────────

test('a missing binary names the attachment, not just a GridFS id', () => {
  const reader = store.slice(store.indexOf('export async function readCollectionFsBuffer'));
  const body = reader.slice(0, reader.indexOf('\n}\n'));
  assert.ok(/isFileNotFound\(error\)/.test(body), 'the GridFS error is recognised');
  assert.ok(/'collectionfs-binary-missing'/.test(body), 'and given an error code of its own');
  assert.ok(/record \$\{item\.sourceId\}, key \$\{item\.gridFsKey\}/.test(body),
    'the message carries the record and the key');
  assert.ok(/item\.name \|\| item\.sourceId/.test(body), 'and the attachment\'s NAME first');
  assert.ok(/Nothing to move/.test(body), 'and says what it means');
});

test('FileNotFound is recognised however Mongo phrases it', () => {
  const fn = store.slice(store.indexOf('export function isFileNotFound'));
  const body = fn.slice(0, fn.indexOf('\n}\n'));
  assert.ok(/FileNotFound/i.test(body), 'the message the report showed');
  assert.ok(/error\.code === 'ENOENT'/.test(body), 'and the codes drivers use');
  assert.ok(/error\.code === 232/.test(body));
  assert.ok(/if \(!error\) return false;/.test(body), 'and nothing else is a missing file');
});

test('a skipped record is not counted as a failure (negative)', () => {
  const loop = move.slice(move.indexOf('// Defensive: one bad file must only skip itself'));
  const body = loop.slice(0, loop.indexOf('\n    }\n  } finally'));
  assert.ok(/error\.error === 'collectionfs-binary-missing'/.test(body),
    'the two are told apart');
  assert.ok(/skipped \+= 1/.test(body) && /console\.warn/.test(body),
    'a missing binary is a warning and a count');
  assert.ok(/failed \+= 1/.test(body) && /console\.error/.test(body),
    'anything else is still an error');
  assert.ok(/one bad file must only skip itself/.test(body),
    'and either way the run goes on');
});

test('the run says how many were skipped', () => {
  // A run that reports only "done" while a dozen attachments stayed behind is
  // how this went unnoticed.
  assert.ok(/lastMove: \{[\s\S]{0,200}skipped,\n\s+failed,/.test(move),
    'the summary carries both counts');
  assert.ok(/if \(lm\.skipped\) counts\.push\(`\$\{lm\.skipped\} skipped`\)/.test(settings),
    'and the Admin Panel shows them');
  assert.ok(/if \(lm\.failed\) counts\.push/.test(settings));
});

console.log(`\ncollectionFsSharedBinary: ${passed} tests passed`);
