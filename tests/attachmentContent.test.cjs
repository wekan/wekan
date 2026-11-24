'use strict';
// An attachment's SHA-256 and plain search text (models/lib/attachmentContent.js,
// server/lib/attachmentContentIndex.js): made when it is added, made on a read
// when missing, and checked on every whole read - a file that differs from its
// hash is a known earlier version (the card history has its hash: a new hash
// and search text are made) or a warning in Admin Panel / Problems. Search,
// Filter and Search All Boards find the text, only on live attachments of the
// cards the reader may already see.
// Run: node --test tests/attachmentContent.test.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const lib = require('../models/lib/attachmentContent');
const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
const sha = text => crypto.createHash('sha256').update(text).digest('hex');

test('which attachments have search text, and where it comes from', () => {
  const s = doc => lib.searchTextSource(doc);
  assert.equal(s({ name: 'notes.txt' }), 'text');
  assert.equal(s({ name: 'README.md' }), 'text');
  assert.equal(s({ name: 'data.csv' }), 'text');
  assert.equal(s({ name: 'app.py' }), 'text');
  assert.equal(s({ name: 'x.json', type: 'application/json' }), 'text');
  assert.equal(s({ name: 'page.html' }), 'text');
  assert.equal(s({ name: 'report.pdf' }), 'document');
  assert.equal(s({ name: 'plan.docx' }), 'document');
  assert.equal(s({ name: 'mail.msg' }), 'preview');
  assert.equal(s({ name: 'letter.odt' }), 'preview');
  for (const name of ['photo.jpg', 'clip.mp4', 'song.mp3', 'backup.zip', 'logs.tar.gz']) assert.equal(s({ name }), null, name);
});

test('text: UTF-8, UTF-16 by its mark, markup removed, controls gone, bounded; binary is not text', () => {
  const enc = new TextEncoder();
  assert.equal(lib.decodeText(enc.encode('﻿hyvää päivää')), 'hyvää päivää');
  const le = Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from('kanban', 'utf16le')]);
  assert.equal(lib.decodeText(le), 'kanban');
  assert.equal(lib.decodeText(Buffer.from([1, 2, 0, 3, 4])), '', 'a NUL byte: not text');
  assert.equal(lib.plainSearchText('<p>Hello <b>board</b></p><script>alert(1)</script>&amp; more', { markup: true }), 'Hello board & more');
  assert.equal(lib.plainSearchText('a\u0000b\u0007c\n\n d'), 'abc d');
  assert.equal(lib.plainSearchText('x'.repeat(lib.MAX_SEARCH_TEXT + 10)).length, lib.MAX_SEARCH_TEXT);
  assert.equal(lib.previewRowText({ t: 'field', k: 'Subject', v: 'Quarterly plan' }), 'Subject Quarterly plan');
  assert.equal(lib.previewRowText({ t: 'row', cells: ['a', 1, 'b'] }), 'a b');
});

test('after a whole read: same, store a missing hash, accept a known earlier version, or a mismatch', () => {
  const a = sha('version 1');
  const b = sha('version 2');
  const stored = { contentHash: { algorithm: 'sha256', value: a, size: 9 }, size: 9 };
  assert.equal(lib.decideHash({ attachment: stored, actual: { value: a, size: 9 } }), 'same');
  assert.equal(lib.decideHash({ attachment: { size: 9 }, actual: { value: a, size: 9 } }), 'store', 'added before hashes: stored now');
  assert.equal(lib.decideHash({ attachment: stored, actual: { value: b, size: 9 }, known: [b] }), 'known-version');
  assert.equal(lib.decideHash({ attachment: stored, actual: { value: b, size: 9 }, known: [] }), 'mismatch');
  // Negative: a hash that is not one, or of another algorithm, is never trusted.
  assert.equal(lib.decideHash({ attachment: { contentHash: { algorithm: 'md5', value: a } }, actual: { value: b, size: 1 } }), 'store');
  assert.equal(lib.decideHash({ attachment: stored, actual: { value: 'zz', size: 9 } }), 'same', 'nothing to compare');
  // A read that stopped early is no evidence of anything.
  assert.equal(lib.wasWholeRead({ size: 100 }, { value: a, size: 40 }), false);
  assert.equal(lib.wasWholeRead({ size: 100 }, { value: a, size: 100 }), true);
  assert.equal(lib.wasWholeRead({ size: 100 }, null), false);
});

test('the card history\'s rows name the hashes of earlier versions', () => {
  const a = sha('a');
  const b = sha('b');
  assert.deepEqual(lib.knownHashes([
    { newContent: { deleted: false, contentHash: a } },
    { previousContent: { deleted: false, name: 'x', contentHash: b } },
    { previousContent: { contentHash: { value: a } } },
    { newContent: { contentHash: 'not a hash' } },
    null,
  ]).sort(), [a, b].sort());
});

test('server: added -> hashed and indexed with an "added" history row; a whole read is hashed on the way out', () => {
  const upload = read('models/attachments.server.js');
  assert.match(upload, /indexNewAttachment\(fileObjId\)/, 'every new attachment, not only documents');
  const index = read('server/lib/attachmentContentIndex.js');
  assert.match(index, /changeType: 'added', previousContent: null,\s*newContent: \{ deleted: false, name: attachment\.name \|\| '', contentHash: result\.hash\.value \}/);
  assert.match(index, /group: 'lifecycle'/, 'a lifecycle row: its undo only ever soft-deletes or restores');
  // Only when it has none yet: the upload hook and a durable rule copy already
  // wrote one, and a second "added" row listed the upload twice in History.
  assert.match(index, /isSyncCopiedAttachment\(attachmentId\)\) return;/);
  assert.match(index, /findOne\(\s*\{ entityType: 'attachment', entityId: attachmentId, changeType: 'added' \}[^;]*;\s*if \(added\) return;/);
  assert.match(index, /contentHash: \{ algorithm: lib\.ALGORITHM, value: actual\.value, size: actual\.size, at \}/, 'with the time it was made');
  assert.match(index, /searchText,\s*generatedAt: at,/, 'the search text with the time it was made');
  const server = read('server/routes/universalFileServer.js');
  assert.match(server, /if \(!range && attachment\?\.meta\?\.source !== 'legacy'\) \{[\s\S]{0,400}hashingTap\(\)[\s\S]{0,400}afterWholeRead\(attachment, actual\)/,
    'a whole read is checked; a range is only a part');
  // The soft delete and restore rows carry the hash too: those are the earlier versions.
  assert.match(read('models/lib/attachmentSoftDelete.js'), /contentHash: hash\.value/);
});

test('server: a mismatch nothing explains is a Problems warning; a known version is indexed again', () => {
  const index = read('server/lib/attachmentContentIndex.js');
  assert.match(index, /decision === 'mismatch'\) \{\s*try \{\s*require\('\/server\/lib\/securityLog'\)\.record\(\{\s*key: 'integrity\.file', action: 'detected', source: 'attachment-read'/);
  assert.match(index, /decision === 'store' \|\| decision === 'known-version'\) \{\s*indexAttachmentContent\(attachment, \{ hash: actual \}\)/);
  assert.match(index, /entityType: 'attachment', entityId: attachmentId/, 'the history of THIS attachment');
});

test('search: Filter (board text matches), Search and Search All Boards read the text, live attachments only', () => {
  const index = read('server/lib/attachmentContentIndex.js');
  assert.match(index, /\{ cardId: \{ \$in: cardIds \}, searchText: regex \}/, 'within the caller\'s cards');
  assert.match(index, /deletedAt: null/, 'a deleted attachment is found by nothing');
  assert.match(read('server/lib/boardTextSearch.js'), /attachmentTextCardIds\(\{ cardIds: ids, regex \}\)/);
  assert.match(read('server/publications/cards.js'), /attachmentTextCardIds\(/);
  assert.match(read('client/components/sidebar/sidebarSearches.js'), /subscribe\('boardTextMatches'/);
  assert.match(read('models/attachments.js'), /DocumentPreviews\.rawCollection\(\)\.deleteMany\(\{ attachmentId: doc\._id \}\)/, 'removed with the attachment');
});
