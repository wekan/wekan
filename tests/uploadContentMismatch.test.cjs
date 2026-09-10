'use strict';

// GitHub issue #3274: an uploaded attachment's real content (magic bytes)
// must be checked against its client-declared MIME type, and a dangerous
// mismatch (e.g. an .exe renamed to .jpg) must be rejected.
//
// Tests the pure decision module directly - no server, no filesystem, no
// Meteor - per CLAUDE.md's security-test guidance: a pure module reproduces
// the attack exactly rather than approximately, and can run anywhere.
//
// Run: node tests/uploadContentMismatch.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const {
  isDangerousUploadMismatch,
  declaredLooksNonExecutable,
  isCompatibleTextual,
  looksLikeScriptHead,
  EXECUTABLE_DETECTED_MIMES,
} = require('../models/lib/uploadContentMismatch');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// ---------------------------------------------------------------------------
// Positive: legitimate files of each declared type pass (not blocked)
// ---------------------------------------------------------------------------

test('a genuine JPEG declared image/jpeg is not blocked', () => {
  const result = isDangerousUploadMismatch({
    declaredMime: 'image/jpeg',
    detectedMime: 'image/jpeg',
  });
  assert.strictEqual(result.blocked, false);
});

test('a genuine PDF declared application/pdf is not blocked', () => {
  const result = isDangerousUploadMismatch({
    declaredMime: 'application/pdf',
    detectedMime: 'application/pdf',
  });
  assert.strictEqual(result.blocked, false);
});

test('text/plain declared as text/csv (compatible textual mismatch) is not blocked', () => {
  const result = isDangerousUploadMismatch({
    declaredMime: 'text/plain',
    detectedMime: 'text/csv',
  });
  assert.strictEqual(result.blocked, false);
});

test('an octet-stream declared upload is never flagged (unspecified, not a spoof claim)', () => {
  const result = isDangerousUploadMismatch({
    declaredMime: 'application/octet-stream',
    detectedMime: 'application/x-msdownload',
  });
  assert.strictEqual(result.blocked, false);
});

test('an executable honestly declared as an executable is not blocked (allow-list handles policy)', () => {
  const result = isDangerousUploadMismatch({
    declaredMime: 'application/x-msdownload',
    detectedMime: 'application/x-msdownload',
  });
  assert.strictEqual(result.blocked, false);
});

test('missing detected mime (detection unavailable) never blocks on its own', () => {
  const result = isDangerousUploadMismatch({
    declaredMime: 'image/png',
    detectedMime: undefined,
  });
  assert.strictEqual(result.blocked, false);
});

// ---------------------------------------------------------------------------
// Negative: a script/executable disguised with an image extension/MIME is
// rejected - the exact scenario from issue #3274.
// ---------------------------------------------------------------------------

test('a Windows PE .exe renamed to .jpg (declared image/jpeg) is blocked', () => {
  const result = isDangerousUploadMismatch({
    declaredMime: 'image/jpeg',
    detectedMime: 'application/x-msdownload',
  });
  assert.strictEqual(result.blocked, true);
  assert.ok(/executable/.test(result.reason));
});

test('an ELF binary renamed to .png (declared image/png) is blocked', () => {
  const result = isDangerousUploadMismatch({
    declaredMime: 'image/png',
    detectedMime: 'application/x-elf',
  });
  assert.strictEqual(result.blocked, true);
});

test('a Mach-O binary renamed to .pdf (declared application/pdf) is blocked', () => {
  const result = isDangerousUploadMismatch({
    declaredMime: 'application/pdf',
    detectedMime: 'application/x-mach-binary',
  });
  assert.strictEqual(result.blocked, true);
});

test('a shell script (#!/bin/sh) renamed to .txt (declared text/plain) is blocked', () => {
  const result = isDangerousUploadMismatch({
    declaredMime: 'text/plain',
    detectedMime: undefined,
    headText: '#!/bin/sh\nrm -rf /\n',
  });
  assert.strictEqual(result.blocked, true);
  assert.ok(/script/.test(result.reason));
});

test('a bash script (#!/usr/bin/env not matched, but /usr/bin/bash is) is blocked', () => {
  const result = isDangerousUploadMismatch({
    declaredMime: 'image/jpeg',
    detectedMime: undefined,
    headText: '#!/usr/bin/bash\necho pwned\n',
  });
  assert.strictEqual(result.blocked, true);
});

test('a Windows batch script (@echo off) renamed to .docx is blocked', () => {
  const result = isDangerousUploadMismatch({
    declaredMime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    detectedMime: undefined,
    headText: '@echo off\r\ndel /f /q C:\\*.*\r\n',
  });
  assert.strictEqual(result.blocked, true);
});

test('looksLikeScriptHead ignores plain prose that merely mentions a shebang mid-text', () => {
  assert.strictEqual(looksLikeScriptHead('This document explains what #!/bin/sh means.'), false);
});

test('declaredLooksNonExecutable recognizes common safe categories', () => {
  assert.ok(declaredLooksNonExecutable('image/png'));
  assert.ok(declaredLooksNonExecutable('application/pdf'));
  assert.ok(declaredLooksNonExecutable('text/csv'));
  assert.ok(!declaredLooksNonExecutable('application/x-msdownload'));
});

test('isCompatibleTextual treats two textual types as compatible, binary vs textual as not', () => {
  assert.ok(isCompatibleTextual('text/plain', 'text/markdown'));
  assert.ok(!isCompatibleTextual('image/jpeg', 'application/x-msdownload'));
});

test('EXECUTABLE_DETECTED_MIMES covers the common dangerous binary formats', () => {
  ['application/x-msdownload', 'application/x-elf', 'application/x-mach-binary', 'application/x-msi']
    .forEach(mime => assert.ok(EXECUTABLE_DETECTED_MIMES.has(mime), mime));
});

// ---------------------------------------------------------------------------
// Negative: prove the fault isn't just fixed at one call site - every upload
// path that finalizes a file (attachments, avatars) must go through
// isFileValid, which is where isDangerousUploadMismatch is wired in.
// models/fileValidation.js's isFileValid() is the single choke point,
// referenced from models/attachments.server.js and models/avatars.server.js.
// ---------------------------------------------------------------------------

test('models/fileValidation.js calls isDangerousUploadMismatch (the guard is actually wired in)', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'models', 'fileValidation.js'), 'utf8');
  assert.ok(
    /isDangerousUploadMismatch/.test(src),
    'fileValidation.js must call isDangerousUploadMismatch',
  );
  assert.ok(
    /require\(['"]\.\/lib\/uploadContentMismatch['"]\)/.test(src),
    'fileValidation.js must import uploadContentMismatch',
  );
});

test('every upload path that finalizes a file goes through isFileValid (attachments + avatars)', () => {
  const attachmentsSrc = fs.readFileSync(
    path.join(__dirname, '..', 'models', 'attachments.server.js'), 'utf8',
  );
  const avatarsSrc = fs.readFileSync(
    path.join(__dirname, '..', 'models', 'avatars.server.js'), 'utf8',
  );
  assert.ok(/isFileValid\(/.test(attachmentsSrc), 'attachments.server.js must call isFileValid');
  assert.ok(/isFileValid\(/.test(avatarsSrc), 'avatars.server.js must call isFileValid');
});

test('no other server module re-implements its own ad-hoc magic-byte check bypassing isDangerousUploadMismatch', () => {
  // Search every server-side JS file for a hand-rolled MZ/ELF/Mach-O magic
  // byte check outside the guard itself and its own test, which would be the
  // same spoofing hole reappearing at a second call site.
  const roots = ['models', 'server'];
  const offenders = [];
  const suspiciousPatterns = [/0x4d5a/i, /['"]MZ['"]/, /x7fELF/i];
  const skip = new Set([
    path.join(__dirname, '..', 'models', 'lib', 'uploadContentMismatch.js'),
  ]);

  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === '.build' || entry.name === '_build') continue;
        walk(full);
      } else if (entry.isFile() && entry.name.endsWith('.js')) {
        if (skip.has(full)) continue;
        const contents = fs.readFileSync(full, 'utf8');
        if (suspiciousPatterns.some(re => re.test(contents))) {
          offenders.push(full);
        }
      }
    }
  }

  roots.forEach(root => walk(path.join(__dirname, '..', root)));
  assert.deepStrictEqual(offenders, [], 'found a duplicate/bypassing magic-byte check: ' + offenders.join(', '));
});

console.log(`uploadContentMismatch: ${passed} passed`);
