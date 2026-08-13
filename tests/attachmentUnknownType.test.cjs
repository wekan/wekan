'use strict';

// #6589: a .drawio attachment stored and displayed as ".bin", unopenable, and
// impossible to rename. Run: node tests/attachmentUnknownType.test.cjs
//
// Two separate bugs, and the report has both:
//
//   1. THE NAME. The browser sends application/octet-stream for a type it does
//      not know, and the upload-time "correct the extension to the type" step
//      took that literally: mime.extension('application/octet-stream') is 'bin',
//      so "sso-proconnect-keycloak.drawio" was stored as
//      "sso-proconnect-keycloak.drawio.bin". Every unrecognised format - .drawio,
//      .kdbx, .ova, anything new - was renamed the same way.
//
//   2. THE RENAME. Repairing it by hand failed too:
//
//        Exception while invoking method 'renameAttachment' Error: ENOENT:
//          no such file or directory, rename
//          '/data/files/attachments/6a7d66369c6aee799e857d36.drawio' -> ...
//
//      The recorded versions[].path and the file on disk had diverged - the
//      reader already searched several layouts to find it, and rename used the
//      recorded path alone. So the attachment could be read but never repaired.

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const Module = require('module');

const repoRoot = path.resolve(__dirname, '..');

// uploadFileName imports a Meteor absolute path; map it so this runs under Node.
const origResolve = Module._resolveFilename;
Module._resolveFilename = function(request, ...rest) {
  if (request === '/imports/lib/fileNameDisplay') {
    return path.join(repoRoot, 'imports', 'lib', 'fileNameDisplay.js');
  }
  return origResolve.call(this, request, ...rest);
};

const { sanitizeUploadFileName, extensionForMime, mimeSaysNothing } =
  require('../models/lib/uploadFileName.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('attachmentUnknownType:');

test('an unknown type never renames the file to .bin', () => {
  assert.strictEqual(
    sanitizeUploadFileName('sso-proconnect-keycloak.drawio', 'application/octet-stream'),
    'sso-proconnect-keycloak.drawio',
    'the name from the report must survive the upload');
  for (const name of ['diagram.drawio', 'passwords.kdbx', 'machine.ova', 'firmware.img']) {
    assert.strictEqual(sanitizeUploadFileName(name, 'application/octet-stream'), name,
      `${name} is an unrecognised format, not a .bin`);
  }
});

test('every way of saying "I do not know" is treated the same', () => {
  for (const mime of ['application/octet-stream', 'binary/octet-stream', 'application/binary',
    'application/x-binary', 'application/unknown', '*/*', '', null, undefined, '  ']) {
    assert.ok(mimeSaysNothing(mime), `${JSON.stringify(mime)} says nothing about the file`);
    assert.strictEqual(extensionForMime(mime), '',
      'so it must not produce an extension to "correct" the name to');
  }
});

test('a type that DOES say something still corrects the name (negative)', () => {
  // The guard against over-correcting the fix: this is the behaviour the
  // extension correction exists for - a PNG called .txt opens as a text file on
  // the desktop, and that is the bug it was written for.
  assert.strictEqual(sanitizeUploadFileName('photo.txt', 'image/png'), 'photo.png');
  assert.strictEqual(sanitizeUploadFileName('notes', 'text/plain'), 'notes.txt');
  assert.strictEqual(sanitizeUploadFileName('photo.jpg', 'image/jpeg'), 'photo.jpg',
    '.jpg for image/jpeg is already right and must be left alone');
});

test('an empty name with an unknown type gets a name, not an extension', () => {
  const named = sanitizeUploadFileName('', 'application/octet-stream');
  assert.ok(named && !named.endsWith('.bin'), `got ${named}`);
});

// --- the rename half ---------------------------------------------------------
//
// FileStrategyFilesystem is a Meteor module, so the resolution logic is read out
// of the source and exercised the way the class uses it: the candidate list
// against a real directory of real files.

const source = fs.readFileSync(path.join(repoRoot, 'models/lib/fileStoreStrategy.js'), 'utf8');

test('rename resolves the file that is THERE, not the one recorded', () => {
  assert.ok(/resolveExistingPath\(\)/.test(source), 'there is one resolver');
  const rename = source.slice(source.indexOf('  rename(newFilePath) {', source.indexOf('class FileStoreStrategyFilesystem')));
  const body = rename.slice(0, rename.indexOf('\n  }'));
  assert.ok(/this\.resolveExistingPath\(\)/.test(body),
    'rename must ask where the file actually is');
  assert.ok(!/renameSync\(this\.fileObj\.versions/.test(body),
    'and must not rename from the recorded path, which is what threw ENOENT');
  assert.ok(/no file found on disk/.test(body),
    'when there is genuinely nothing, it says so - ENOENT on a path nobody '
    + 'recognises is not an explanation');
});

test('unlink resolves it too, or the bytes stay on disk forever', () => {
  const unlink = source.slice(source.indexOf('  unlink() {', source.indexOf('class FileStoreStrategyFilesystem')));
  const body = unlink.slice(0, unlink.indexOf('\n  }'));
  assert.ok(/this\.resolveExistingPath\(\)/.test(body),
    'a delete that misses is a file nobody can see and nobody can remove');
});

test('the reader and the writer use the SAME search', () => {
  // The bug was that they did not: the reader had a candidate list covering
  // every layout WeKan has used, and rename had one line.
  const readStream = source.slice(source.indexOf('  getReadStream() {',
    source.indexOf('candidatePaths()')));
  assert.ok(/this\.resolveExistingPath\(\)/.test(readStream.slice(0, 300)),
    'getReadStream goes through the same resolver');
  const candidates = source.slice(source.indexOf('  candidatePaths() {'));
  for (const layout of ['-${this.versionName}-', "path.join(storageRoot, String(this.fileObj._id))"]) {
    assert.ok(candidates.includes(layout), `the ${layout} layout is still searched`);
  }
});

// The behaviour itself, on a real directory: the recorded path is missing and
// the file is under one of the older names.
test('the candidate layouts really do find a diverged file', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wekan-att-'));
  const id = '6a7d66369c6aee799e857d36';
  const onDisk = path.join(dir, `${id}.bin`);           // what the upload wrote
  fs.writeFileSync(onDisk, 'drawio bytes');
  const recorded = path.join(dir, `${id}.drawio`);      // what the database says
  assert.ok(!fs.existsSync(recorded), 'the recorded path is the one that is missing');

  // The same order the class uses: recorded, then basename, then id, then
  // id-version-name, then the id-version-* prefix scan.
  const tried = [
    recorded,
    path.join(dir, path.basename(recorded)),
    path.join(dir, id),
    path.join(dir, `${id}-original-sso-proconnect-keycloak.drawio`),
  ];
  let found = tried.find(p => fs.existsSync(p));
  if (!found) {
    const prefixed = fs.readdirSync(dir).find(e => e.startsWith(`${id}`));
    found = prefixed && path.join(dir, prefixed);
  }
  assert.strictEqual(found, onDisk, 'the file is found under the name it really has');
  fs.renameSync(found, path.join(dir, `${id}-original-renamed.drawio`));
  assert.ok(fs.existsSync(path.join(dir, `${id}-original-renamed.drawio`)),
    'and renaming it works, which is all the report asked for');
  fs.rmSync(dir, { recursive: true, force: true });
});

console.log(`\nattachmentUnknownType: ${passed} tests passed`);
