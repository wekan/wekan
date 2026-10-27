'use strict';

// MimeStorageBleed follow-up - GHSA-rv5g-5p4g-3v89 (avrlab233, CWE-79),
// https://wekan.fi/hall-of-fame/mimebleed/
//
// Three faults let a stored attachment run script under the WeKan origin:
//   1. the markup sniff required whitespace and quotes before an event
//      handler, so the valid HTML `<img/onerror=... src=x>` (a SLASH between the
//      tag name and the handler, the value unquoted) was not "dangerous";
//   2. files kept on the filesystem skipped validation, which sat inside the
//      migration-only branch of Attachments.onAfterUpload;
//   3. the original Meteor-Files route could serve executable stored metadata
//      inline.
// Faults 2 and 3 are pinned in tests/avatarLegacyAttachSwimlaneBleed.test.cjs
// and tests/attachmentServeFailsClosed.test.cjs. This file pins fault 1 by
// RUNNING the real sniff, and - the negative test - requires every other
// handler detector that gates a file (the serve-time sanitizer and the upload
// filename check) to know the slash form too. Both missed it until this test
// was written; the slash was only ever taught to models/fileValidation.js.
//
// Problems: rejected uploads are already recorded as MimeStorageBleed through
// 'file.mime' in models/lib/securityCategories.js; nothing new to record here.
//
// Run: node tests/mimeStorageBleed.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// Lift a plain function out of an ES module source and run it.
function extract(rel, signature, name) {
  const src = read(rel);
  const start = src.indexOf(signature);
  assert.notStrictEqual(start, -1, `${rel}: ${signature} not found`);
  const end = src.indexOf('\n}\n', start);
  const body = src.slice(start, end + 2).replace(/^export /, '');
  return new Function(`${body}\nreturn ${name};`)();
}

const looksLikeDangerousMarkup = extract(
  'models/fileValidation.js',
  'export function looksLikeDangerousMarkup(text) {',
  'looksLikeDangerousMarkup',
);
const headLooksDangerous = extract(
  'models/lib/serveFileSanitizer.js',
  'function headLooksDangerous(text) {',
  'headLooksDangerous',
);
// uploadFileName.js requires the Meteor-absolute '/imports/lib/fileNameDisplay';
// map it to the real file, as tests/uploadFileName.test.cjs does.
const Module = require('module');
const origResolve = Module._resolveFilename;
Module._resolveFilename = function(request, ...rest) {
  if (request === '/imports/lib/fileNameDisplay') {
    return path.join(root, 'imports', 'lib', 'fileNameDisplay.js');
  }
  return origResolve.call(this, request, ...rest);
};
const { filenameLooksLikeExploit } = require('../models/lib/uploadFileName');

const REPORTED = '<img/onerror=document.body.dataset.executed="yes" src=x>';
const SLASH_FORMS = [
  REPORTED,
  '<img/onerror=alert(1) src=x>',
  '<svg/onload=alert(1)>',
  '<body/onpageshow=alert(1)>',
  '<a/onmouseover=alert(1)>x</a>',
];

test('the reported payload is dangerous markup (GHSA-rv5g-5p4g-3v89)', () => {
  assert.strictEqual(looksLikeDangerousMarkup(REPORTED), true);
  for (const sample of SLASH_FORMS) {
    assert.strictEqual(looksLikeDangerousMarkup(sample), true, sample);
  }
  // Unquoted, whitespace-separated, and javascript: URIs too.
  assert.strictEqual(looksLikeDangerousMarkup('<img src=x onerror=alert(1)>'), true);
  assert.strictEqual(looksLikeDangerousMarkup('<a href=javascript:alert(1)>x</a>'), true);
});

test('ordinary content is not markup (negative)', () => {
  for (const sample of [
    '', null, 'plain text, nothing to see', 'a,b,c\n1,2,3\n',
    '{"on": "value", "onerror": 1}', 'see https://example.com/one=1/two',
    '\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR', '%PDF-1.7\n1 0 obj',
  ]) {
    assert.strictEqual(looksLikeDangerousMarkup(sample), false, String(sample));
  }
});

test('the upload content scan uses the same slash-aware handler pattern', () => {
  const src = read('models/fileValidation.js');
  const scan = src.slice(src.indexOf('const containsJsOrXmlBombs'), src.indexOf('const checkDangerousMimeAllowance'));
  assert.ok(scan.includes('[\\s/]on[a-z\\-]{1,40}'), 'containsJsOrXmlBombs knows `<tag/on...=`');
});

test('negative: the serve-time sanitizer also sees the slash form', () => {
  for (const sample of SLASH_FORMS) {
    assert.strictEqual(headLooksDangerous(sample), true, sample);
  }
  assert.strictEqual(headLooksDangerous('see https://example.com/one=1'), false);
  assert.strictEqual(headLooksDangerous('plain text'), false);
});

test('negative: an upload filename with the slash form is refused', () => {
  assert.strictEqual(filenameLooksLikeExploit('<a/onclick=alert(1)>.png'), true);
  assert.strictEqual(filenameLooksLikeExploit('x<b/onmouseover=alert(1)>.pdf'), true);
  assert.strictEqual(filenameLooksLikeExploit('2026/one.pdf'), false);
  assert.strictEqual(filenameLooksLikeExploit('online.pdf'), false);
});

// The shape: a handler detector that only knows `\son...=`. Every source file
// that has one must also carry a slash-aware variant, or be listed here as
// classification-only (it labels or logs content, it does not decide whether
// a file is stored or served).
const CLASSIFICATION_ONLY = new Map([
  ['models/lib/injectionDetect.js', 'decides only whether a sanitizer change is logged as an attempt'],
  ['imports/lib/fileNameDisplay.js', 'classifyExploitKinds names the kinds for a log line; "HTML code" catches the rest'],
]);

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    if (['node_modules', '_build', '.build', '.tools', 'tests', '.meteor'].includes(entry.name)) continue;
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(rel, out);
    else if (/\.(c|m)?js$/.test(entry.name)) out.push(rel);
  }
  return out;
}

test('negative: no file-gating handler detector misses `<tag/on...=` anywhere', () => {
  const offenders = [];
  for (const dir of ['models', 'server', 'imports', 'client', 'packages']) {
    if (!fs.existsSync(path.join(root, dir))) continue;
    for (const rel of walk(dir)) {
      const src = read(rel);
      if (!/\\son(?:\\w|\[a-z)/.test(src)) continue;
      if (CLASSIFICATION_ONLY.has(rel)) continue;
      if (/\[\\s\/\]on|\\\/on\[a-z/.test(src)) continue;
      offenders.push(rel);
    }
  }
  assert.deepStrictEqual(offenders, [], `whitespace-only handler detectors: ${offenders.join(', ')}`);
});

console.log(`\nmimeStorageBleed: ${passed} tests passed`);
