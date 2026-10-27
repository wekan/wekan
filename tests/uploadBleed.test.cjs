'use strict';

// UploadBleed (found reviewing the attachment side of StampBleed): Meteor-
// Files' upload pipeline (_FilesCollectionStart_attachments / Write and its
// HTTP twin) inserts the stored document SERVER-side, so the attachments'
// allow rules were never asked, and the collection's onBeforeUpload only
// cleaned the file name. Any DDP client - signed in or not - could put a file
// on any card of any board, published to its members with an addAttachment
// activity, and pick its meta.boardId. The upload is authorized on every
// chunk now (models/attachments.server.js, models/lib/attachmentUploadAuth.js).
// Run: node tests/uploadBleed.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { uploadDecision } = require('../models/lib/attachmentUploadAuth.js');

const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
console.log('uploadBleed:');

const card = { _id: 'c1', boardId: 'b1', listId: 'l1', swimlaneId: 's1' };
const board = { _id: 'b1' };
const base = { userId: 'u1', meta: { cardId: 'c1', boardId: 'b1' }, card, mayEditCard: true, board: null, mayWriteBoard: false, uploadsBlocked: false };

test('the attack: not signed in - refused and recorded', () => {
  const d = uploadDecision({ ...base, userId: null });
  assert.strictEqual(d.allow, false);
  assert.strictEqual(d.key, 'authz.attachment-upload');
});

test('the attack: a card one cannot edit, or a board one cannot write - refused and recorded', () => {
  assert.deepStrictEqual(pick(uploadDecision({ ...base, mayEditCard: false })), { allow: false, key: 'authz.attachment-upload' });
  const boardLevel = { ...base, meta: { boardId: 'b1', source: 'board-background' }, card: null, board, mayWriteBoard: false };
  assert.deepStrictEqual(pick(uploadDecision(boardLevel)), { allow: false, key: 'authz.attachment-upload' });
  // Neither a card nor a board named.
  assert.deepStrictEqual(pick(uploadDecision({ ...base, meta: {}, card: null })), { allow: false, key: 'authz.attachment-upload' });
});

test('StampBleed through the upload: one\'s own card, another board\'s id - refused', () => {
  const d = uploadDecision({ ...base, meta: { cardId: 'c1', boardId: 'private' } });
  assert.strictEqual(d.allow, false);
  assert.strictEqual(d.key, 'authz.card-child-stamp');
});

test('negative: what WeKan\'s own client uploads is allowed, its board stamped from the card', () => {
  const d = uploadDecision(base);
  assert.strictEqual(d.allow, true);
  assert.deepStrictEqual(d.stamp, { boardId: 'b1', listId: 'l1', swimlaneId: 's1' });
  // A linked card's upload names the real card, with or without its board.
  assert.strictEqual(uploadDecision({ ...base, meta: { cardId: 'c1' } }).allow, true);
  // A board's background or map image, by somebody who may write the board.
  const bg = uploadDecision({ ...base, meta: { boardId: 'b1', source: 'board-background' }, card: null, board, mayWriteBoard: true });
  assert.deepStrictEqual(pick(bg), { allow: true, key: undefined });
});

test('negative: refusals a legitimate user can reach are not recorded (no account block)', () => {
  assert.strictEqual(uploadDecision({ ...base, uploadsBlocked: true }).key, null, 'uploads turned off by an admin');
  assert.strictEqual(uploadDecision({ ...base, card: null }).key, null, 'a card deleted meanwhile');
  assert.strictEqual(uploadDecision({ ...base, meta: { boardId: 'gone' }, card: null, board: null }).key, null, 'a board deleted meanwhile');
});

function pick(d) { return { allow: d.allow, key: d.key }; }

test('the server asks it on every chunk, after the shared name cleaning, and stamps the card\'s board', () => {
  const s = read('models/attachments.server.js');
  const hook = s.slice(s.indexOf('const sharedOnBeforeUpload = Attachments.onBeforeUpload;'), s.indexOf('Attachments.onAfterUpload ='));
  assert.match(hook, /Attachments\.onBeforeUpload = async function \(file\) \{\n\s+const shared = sharedOnBeforeUpload \? sharedOnBeforeUpload\.call\(this, file\) : true;\n\s+if \(shared !== true\) return shared;/);
  assert.match(hook, /canEditCardOrLinkedCard\(this\.userId, card, undefined, \{ recordDenial: false \}\)/);
  assert.match(hook, /allowIsBoardMemberWithWriteAccess\(this\.userId, board\)/);
  assert.match(hook, /uploadsBlocked = settings\?\.limitSettings\?\.attachmentsUploadBlocked === true;/);
  // Recorded once per upload - at its start, chunk -1 - not per chunk.
  assert.match(hook, /if \(decision\.key && this\.chunkId === -1\) \{\n\s+try \{\n\s+require\('\/server\/lib\/securityLog'\)\.record\(\{/);
  assert.match(hook, /\} catch \(e\) \{ \/\* logging must never break the guard \*\/ \}/);
  assert.match(hook, /file\.meta = \{ \.\.\.meta, \.\.\.decision\.stamp \};/);
  assert.match(read('server/imports.js'), /import '\/models\/attachments\.server';/);
});

test('negative: every FilesCollection authorizes its uploads on the server', () => {
  // The pipeline never asks the allow rules: an onBeforeUpload that does not
  // look at who uploads is an open door, whatever the allow rules say.
  const walk = dir => fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap(e => {
    const rel = path.join(dir, e.name);
    if (e.isDirectory()) return ['node_modules', '_build', '.build', '.tools', 'tests'].includes(e.name) ? [] : walk(rel);
    return /\.js$/.test(e.name) ? [rel] : [];
  });
  const collections = [];
  for (const file of [...walk('models'), ...walk('server')]) {
    if (/new FilesCollection\(/.test(read(file))) collections.push(file);
  }
  assert.deepStrictEqual(collections.sort(), [path.join('models', 'attachments.js'), path.join('models', 'avatars.js')], 'a new FilesCollection must be listed here with its upload check');
  assert.match(read('models/avatars.js'), /onBeforeUpload\(file\) \{\n(\s+\/\/[^\n]*\n)*\s+if \(!this\.userId\) return 'Please sign in to upload an avatar\.';/);
  assert.ok(read('models/attachments.server.js').includes('uploadDecision({'), 'attachments: authorized on the server');
});

test('the catalog names it as the Hall of Fame does', () => {
  assert.match(read('models/lib/securityCategories.js'), /'authz\.attachment-upload': \{ category: 'authz', bleed: 'UploadBleed', severity: 'critical', cwe: 'CWE-862' \},/);
});

console.log(`uploadBleed: ${passed} passed`);
