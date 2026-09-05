'use strict';

// Guard: attachments are still readable when the storage root is a symlink.
// Run: node tests/fileStoreSymlinkRoot.test.cjs
//
// FileStoreStrategyFilesystem builds its candidate paths by joining names onto
// the storage root AS WRITTEN, and then checked each candidate against that root
// with every symlink RESOLVED. Those are the same string only when nothing in
// the path is a symlink.
//
// On macOS nothing is: `os.tmpdir()` is /var/folders/..., a symlink to
// /private/var/folders/..., so every candidate failed the containment check
// before it was looked at, getReadStream() returned undefined, and WeKan served
// none of its own attachments. The mocha suite said so - "allows reading a
// regular file from storage root" - and it reads as a bland assertion failure
// rather than as "this platform cannot open attachments at all". A deployment
// whose data directory is a symlink has the same fault on Linux.
//
// The security property is NOT the lexical check: what a caller must not do is
// reach a file outside the root, and that is decided by resolving the candidate
// and requiring the result to be inside the RESOLVED root. This pins that both
// checks are still there, against the right root each.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { isPathInsideBase } = require('../models/lib/storagePathContainment');

const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'models/lib/fileStoreStrategy.js'), 'utf8');

let passed = 0;
const test = (name, run) => {
  run();
  passed++;
  if (process.env.VERBOSE) console.log(`  ok - ${name}`);
};

// ---- the shape of the fix ------------------------------------------------------

test('the check takes the literal root as well as the resolved one', () => {
  assert.match(src, /function isSafeReadableFile\(candidatePath, storageRootPath, literalRootPath\)/,
    'both roots are needed: candidates are built from one and resolved against the other');
  assert.match(src, /const lexicalRoot = literalRootPath \|\| storageRootPath;/);
  assert.match(src, /isPathInside\(lexicalRoot, candidatePath\)/,
    'the lexical pre-filter must use the root the candidates were built from');
});

test('and the authoritative check still resolves against the resolved root', () => {
  const fn = src.slice(src.indexOf('function isSafeReadableFile'),
    src.indexOf('function ', src.indexOf('function isSafeReadableFile') + 10));
  assert.match(fn, /tryRealPath\(candidatePath\)/,
    'GHSA-4mxf-m8pq-xc9p: a symlink out of the tree is caught by resolving it');
  assert.match(fn, /isPathInside\(storageRootPath, candidateRealPath\)/,
    'and comparing the RESOLVED candidate to the RESOLVED root');
});

test('the caller passes both roots (negative)', () => {
  assert.match(src, /isSafeReadableFile\(c, resolvedStorageRoot, storageRoot\)/);
  assert.doesNotMatch(src, /isSafeReadableFile\(c, resolvedStorageRoot\)\s*\)/,
    'passing only the resolved root is the bug this fixes');
});

// ---- the containment rule itself, against a real symlinked root ----------------

test('a real symlinked root: the file is inside it, resolved or not', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wekan-symroot-'));
  try {
    const real = path.join(tmp, 'real-data');
    const link = path.join(tmp, 'linked-data');
    fs.mkdirSync(real, { recursive: true });
    fs.symlinkSync(real, link);
    const file = path.join(link, 'safe.txt');
    fs.writeFileSync(file, 'safe-data');

    // Built from the literal root, as the strategy builds them.
    assert.ok(isPathInsideBase(link, file),
      'the candidate is inside the root it was built from');
    // And the authoritative check still holds once both sides are resolved.
    assert.ok(isPathInsideBase(fs.realpathSync(link), fs.realpathSync(file)),
      'and inside the resolved root once resolved - which is what decides safety');

    // The mismatch that caused the bug: literal candidate vs resolved root.
    assert.equal(isPathInsideBase(fs.realpathSync(link), file), false,
      'comparing an unresolved candidate to a resolved root is exactly what '
      + 'rejected every legitimate attachment');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('an escape is still an escape, symlinked root or not (negative)', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wekan-symroot-'));
  try {
    const real = path.join(tmp, 'real-data');
    const link = path.join(tmp, 'linked-data');
    fs.mkdirSync(real, { recursive: true });
    fs.symlinkSync(real, link);

    const outside = path.join(tmp, 'outside-secret.txt');
    fs.writeFileSync(outside, 'secret');
    const escape = path.join(real, 'escape-link.txt');
    fs.symlinkSync(outside, escape);

    assert.equal(isPathInsideBase(fs.realpathSync(link), fs.realpathSync(escape)), false,
      'a symlink pointing out of the tree is refused once resolved');
    assert.equal(isPathInsideBase(link, outside), false,
      'and so is a plain path outside the root');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

console.log(`fileStoreSymlinkRoot: ${passed} tests passed`);
