'use strict';

// Upload-time filename hardening (models/lib/uploadFileName.js):
//   - sanitizeUploadFileName: URL-decode + fold homoglyphs + strip invisible /
//     exploit chars, give a type-based name when empty, correct the extension to
//     the real MIME type, and cap the length for portability (Amiga OS FFS = 30);
//   - filenameLooksLikeExploit: reject HTML/JS/XML/template/traversal/null-byte
//     filenames outright.
//
// Run: node tests/uploadFileName.test.cjs

const assert = require('assert');
const path = require('path');
const Module = require('module');

// uploadFileName.js imports the shared display lib via the Meteor-absolute path
// '/imports/lib/fileNameDisplay'. Map it to the real file so this runs under plain
// Node (mime-types resolves normally from node_modules).
const origResolve = Module._resolveFilename;
Module._resolveFilename = function(request, ...rest) {
  if (request === '/imports/lib/fileNameDisplay') {
    return path.join(__dirname, '..', 'imports', 'lib', 'fileNameDisplay.js');
  }
  return origResolve.call(this, request, ...rest);
};

const {
  MAX_FILENAME_CHARS,
  truncateFilenameChars,
  baseNameForMime,
  extensionForMime,
  filenameLooksLikeExploit,
  sanitizeUploadFileName,
  sanitizationReasons,
} = require('../models/lib/uploadFileName.js');

let passed = 0;
function check(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const ZW = '​';

console.log('uploadFileName:');

check('truncateFilenameChars caps length, preserves extension, never splits code points', () => {
  assert.strictEqual(MAX_FILENAME_CHARS, 30);
  assert.strictEqual(truncateFilenameChars('short.pdf'), 'short.pdf');
  const long = truncateFilenameChars('this-is-a-very-long-presentation-name.pptx');
  assert.ok(Array.from(long).length <= 30, 'within 30 code points');
  assert.ok(long.endsWith('.pptx'), 'extension preserved');
  // no extension, just too long -> clipped to 30
  assert.strictEqual(Array.from(truncateFilenameChars('x'.repeat(50))).length, 30);
});

check('extensionForMime / baseNameForMime', () => {
  assert.strictEqual(extensionForMime('application/pdf'), '.pdf');
  assert.strictEqual(extensionForMime('image/png'), '.png');
  assert.strictEqual(extensionForMime('nonsense/unknown'), '');
  assert.strictEqual(baseNameForMime('image/png'), 'image');
  assert.strictEqual(baseNameForMime('application/pdf'), 'document');
  assert.strictEqual(baseNameForMime('application/vnd.ms-excel'), 'spreadsheet');
  assert.strictEqual(baseNameForMime('application/zip'), 'archive');
});

check('sanitizeUploadFileName appends a missing extension', () => {
  assert.strictEqual(sanitizeUploadFileName('report', 'application/pdf'), 'report.pdf');
});

check('sanitizeUploadFileName replaces a WRONG extension', () => {
  assert.strictEqual(sanitizeUploadFileName('report.txt', 'application/pdf'), 'report.pdf');
});

check('sanitizeUploadFileName keeps a correct extension (jpg vs jpeg)', () => {
  assert.strictEqual(sanitizeUploadFileName('photo.jpg', 'image/jpeg'), 'photo.jpg');
});

check('sanitizeUploadFileName generates a name from the type when empty', () => {
  assert.strictEqual(sanitizeUploadFileName('', 'image/png'), 'image.png');
  assert.strictEqual(sanitizeUploadFileName('   ' + ZW + '  ', 'text/plain'), 'document.txt');
});

check('sanitizeUploadFileName strips invisible chars and folds homoglyphs', () => {
  assert.strictEqual(sanitizeUploadFileName('evil' + ZW, 'application/pdf'), 'evil.pdf');
  assert.strictEqual(sanitizeUploadFileName('pаypal', 'application/pdf'), 'paypal.pdf'); // Cyrillic a
});

check('sanitizeUploadFileName caps the final length', () => {
  const out = sanitizeUploadFileName('a'.repeat(60), 'application/pdf');
  assert.ok(Array.from(out).length <= 30 && out.endsWith('.pdf'));
});

check('filenameLooksLikeExploit accepts normal names', () => {
  assert.strictEqual(filenameLooksLikeExploit('report.pdf'), false);
  assert.strictEqual(filenameLooksLikeExploit('Photo 2024.jpg'), false);
  assert.strictEqual(filenameLooksLikeExploit('Отчёт.pdf'), false);
});

check('filenameLooksLikeExploit rejects exploit-looking names (negative tests)', () => {
  assert.strictEqual(filenameLooksLikeExploit('<script>alert(1)</script>.png'), true);
  assert.strictEqual(filenameLooksLikeExploit('<svg onload=alert(1)>.svg'), true);
  assert.strictEqual(filenameLooksLikeExploit('<?xml version="1.0"?>.svg'), true);
  assert.strictEqual(filenameLooksLikeExploit('x<!DOCTYPE y>.xml'), true);
  assert.strictEqual(filenameLooksLikeExploit('x<!ENTITY y>.xml'), true);
  assert.strictEqual(filenameLooksLikeExploit('report{{7*7}}.pdf'), true);
  assert.strictEqual(filenameLooksLikeExploit('a${x}.pdf'), true);
  assert.strictEqual(filenameLooksLikeExploit('javascript:alert(1).png'), true);
  assert.strictEqual(filenameLooksLikeExploit('onerror=alert(1).png'), true);
  assert.strictEqual(filenameLooksLikeExploit('shell.php\u0000.jpg'), true);   // null byte
  assert.strictEqual(filenameLooksLikeExploit('../../etc/passwd'), true);      // path traversal
});

check('sanitizationReasons explains WHY a name was sanitized (for the Problems log)', () => {
  assert.deepStrictEqual(sanitizationReasons('evil' + ZW + '.png', 'image/png', 'evil.png'),
    ['invisible characters']);
  assert.deepStrictEqual(sanitizationReasons('report.txt', 'application/pdf', 'report.pdf'),
    ['wrong file type (.txt → .pdf)']);
  assert.deepStrictEqual(sanitizationReasons('pаypal.exe', 'application/octet-stream', 'paypal.exe'),
    ['typosquatting (look-alike characters)']);
  assert.deepStrictEqual(sanitizationReasons('x'.repeat(40) + '.pdf', 'application/pdf', 'x'.repeat(25) + '.pdf'),
    ['filename too long']);
  const doctype = sanitizationReasons('a<!DOCTYPE y>.svg', 'image/svg+xml', 'a.svg');
  assert.ok(doctype.includes('exploit: XML loop (billion laughs)'));
  assert.deepStrictEqual(sanitizationReasons('clean.png', 'image/png', 'clean.png'), []);
});

console.log(`\nuploadFileName: ${passed} checks passed`);
