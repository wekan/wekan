'use strict';

// models/lib/uploadFileId.js: the file id an upload brings (UploadPathBleed),
// and how a Meteor-Files namingFunction reads its id and name - one function
// for attachments and avatars, which each used to write the same 25 lines.
// Run: node tests/uploadFileId.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { safeUploadFileId, isSafeUploadFileId, uploadNameParts } = require('../models/lib/uploadFileId');

const ROOT = path.join(__dirname, '..');
let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

test('an id WeKan generates is kept', () => {
  assert.equal(safeUploadFileId('aB3_x-9', { fresh: () => 'FRESH' }), 'aB3_x-9');
  assert.equal(isSafeUploadFileId('aB3_x-9'), true);
});

test('negative: a traversal, an empty or a non-string id gets a fresh one', () => {
  for (const bad of ['../../x', 'a/b', '', 'a'.repeat(41), null, undefined, 7, {}]) {
    assert.equal(safeUploadFileId(bad, { fresh: () => 'FRESH' }), 'FRESH', String(bad));
  }
});

test('client side: the id comes out of meta, and is taken out of it', () => {
  const opts = { name: 'report.final.pdf', meta: { fileId: 'ID1', boardId: 'B' } };
  assert.deepEqual(uploadNameParts(opts), { fileId: 'ID1', filenameWithoutExtension: 'report.final' });
  assert.deepEqual(opts.meta, { boardId: 'B' }, 'only fileId is removed from meta');
});

test('server side: the name loses only its own extension', () => {
  assert.deepEqual(
    uploadNameParts({ fileId: 'ID2', file: { name: 'photo.jpeg', extension: 'jpeg', extensionWithDot: '.jpeg' } }),
    { fileId: 'ID2', filenameWithoutExtension: 'photo' });
  // A name with no extension keeps its last character (extensionWithDot is '.').
  assert.deepEqual(
    uploadNameParts({ fileId: 'ID3', file: { name: 'README', extension: '', extensionWithDot: '.' } }),
    { fileId: 'ID3', filenameWithoutExtension: 'README' });
  // The suffix is literal text, never a pattern built from the name.
  assert.equal(uploadNameParts({ file: { name: 'a(b).c+', extension: 'c+', extensionWithDot: '.c+' } }).filenameWithoutExtension, 'a(b)');
});

test('negative: a client-supplied traversal id is passed on for safeUploadFileId to refuse', () => {
  const { fileId } = uploadNameParts({ name: 'x.png', meta: { fileId: '../../../../tmp/pwn' } });
  assert.equal(safeUploadFileId(fileId, { fresh: () => 'FRESH' }), 'FRESH');
});

test('neither collection reads the upload by hand any more, and both still check the id', () => {
  for (const [file, call] of [['models/attachments.js', /uploadNameParts\(opts\)/], ['models/avatars.js', /uploadNameParts\(opts\)/]]) {
    const src = fs.readFileSync(path.join(ROOT, file), 'utf8');
    const at = src.indexOf('namingFunction(opts) {');
    const body = src.slice(at, src.indexOf('\n  },', at)).replace(/^\s*\/\/.*$/gm, '');
    assert.match(body, call, file);
    assert.match(body, /safeUploadFileId\(fileId, \{\s*source: '\w+\.namingFunction'/, `${file} validates the id`);
    assert.doesNotMatch(body, /opts\.meta\.fileId|opts\.file\.extensionWithDot/, `${file} has no copy of the parsing`);
  }
});

console.log(`\nuploadFileId: ${passed} tests passed`);
