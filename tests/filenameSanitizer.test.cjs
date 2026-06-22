'use strict';

// Plain-Node unit test (no Meteor) for the attachment filename helpers.
// Run: node tests/filenameSanitizer.test.cjs
//
// Regression guard for #6412: very long attachment filenames produced an on-disk
// "<id>-<version>-<name>" component longer than the filesystem's 255-byte limit
// and failed with ENAMETOOLONG (worse with multibyte UTF-8 like German umlauts).

const assert = require('assert');
const {
  MAX_FILENAME_BYTES,
  truncateFilenameToBytes,
  sanitizeFilename,
} = require('../models/lib/filenameSanitizer');

const bytes = s => Buffer.byteLength(s, 'utf8');
const isValidUtf8 = s => Buffer.from(s, 'utf8').toString('utf8') === s;

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// --- truncateFilenameToBytes ---
test('leaves a short name unchanged', () => {
  assert.strictEqual(truncateFilenameToBytes('short.png', 200), 'short.png');
});

test('truncates a long ASCII name to the byte budget and keeps the extension', () => {
  const out = truncateFilenameToBytes('a'.repeat(300) + '.png', 200);
  assert.ok(bytes(out) <= 200, `bytes=${bytes(out)}`);
  assert.ok(out.endsWith('.png'));
});

test('truncates a multibyte (umlaut) name by bytes without splitting a codepoint', () => {
  // The actual filename from the issue report (German, umlauts = 2 bytes each).
  const name =
    'Förderprogramme helfen bei deiner Unternehmensgründung. Man unterscheidet ' +
    'auf drei Ebenen. Absicherung des Lebensunterhalt bei Gründung aus ' +
    'Arbeitslosigkeit Beratungskostenzuschüsse für die Beratung vor oder während .png';
  assert.ok(bytes(name) > 200);
  const out = truncateFilenameToBytes(name, 200);
  assert.ok(bytes(out) <= 200, `bytes=${bytes(out)}`);
  assert.ok(isValidUtf8(out), 'must remain valid UTF-8 (no split codepoint)');
  assert.ok(out.endsWith('.png'));
});

test('clips the whole name when the extension itself is absurdly long', () => {
  const out = truncateFilenameToBytes('x.' + 'y'.repeat(300), 200);
  assert.ok(bytes(out) <= 200);
  assert.ok(isValidUtf8(out));
});

// --- sanitizeFilename (the #6412 integration: traversal + length cap) ---
test('caps a very long name so "<id>-<version>-<name>" stays under 255 bytes', () => {
  const out = sanitizeFilename('Ü'.repeat(300) + '.png');
  assert.ok(bytes(out) <= MAX_FILENAME_BYTES, `bytes=${bytes(out)}`);
  const component = `aBcD1234eFgH5678i-original-${out}`; // typical Random.id() prefix
  assert.ok(bytes(component) < 255, `component bytes=${bytes(component)}`);
});

test('still strips path traversal AND caps length together', () => {
  const out = sanitizeFilename('../../' + 'n'.repeat(300) + '.txt');
  assert.ok(!out.includes('..'), 'path traversal removed');
  assert.ok(bytes(out) <= MAX_FILENAME_BYTES);
  assert.ok(out.endsWith('.txt'));
});

test('falls back to "unnamed" for empty/invalid input', () => {
  assert.strictEqual(sanitizeFilename(''), 'unnamed');
  assert.strictEqual(sanitizeFilename(null), 'unnamed');
});

console.log(`\n${passed} passing`);
