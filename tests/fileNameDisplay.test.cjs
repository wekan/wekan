'use strict';

// Admin Panel → Problems → Files report filename handling:
//  - percent-encoded names are URL-decoded for display when they decode cleanly;
//  - names are shown as PLAIN TEXT (Blaze {{ }} escapes; never markdown/HTML);
//  - names hiding invisible/control/bidi characters are flagged (shown red);
//  - a server-side filter lists ONLY invisible-character filenames.
//
// Run: node tests/fileNameDisplay.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { hasInvisibleChars, decodeFileNameSafe, INVISIBLE_CHARS_SOURCE } =
  require('../imports/lib/fileNameDisplay.js');

let passed = 0;
function check(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');

const ZW = '​'; // zero-width space

console.log('fileNameDisplay:');

check('hasInvisibleChars flags zero-width / control / bidi, not normal text or CJK', () => {
  assert.strictEqual(hasInvisibleChars('normal.png'), false);
  assert.strictEqual(hasInvisibleChars('Nihongo 日本語.txt'), false); // CJK ok
  assert.strictEqual(hasInvisibleChars('evil' + ZW + '.png'), true);
  assert.strictEqual(hasInvisibleChars('tab\tname.txt'), true);       // control char
  assert.strictEqual(hasInvisibleChars('rtl‮exe.txt'), true);    // bidi override
  assert.strictEqual(hasInvisibleChars('bom﻿.txt'), true);
});

check('decodeFileNameSafe URL-decodes clean encodings, leaves the rest untouched', () => {
  assert.strictEqual(decodeFileNameSafe('%D0%93%D1%80.png'), 'Гр.png'); // Гр
  assert.strictEqual(decodeFileNameSafe('normal.png'), 'normal.png');
  assert.strictEqual(decodeFileNameSafe('50%.pdf'), '50%.pdf');       // lone % not an encoding
  assert.strictEqual(decodeFileNameSafe('bad%ZZ.png'), 'bad%ZZ.png'); // malformed -> unchanged
});

check('decoding reveals url-encoded invisibles so they get flagged', () => {
  const disp = decodeFileNameSafe('evil%E2%80%8B.png'); // %E2%80%8B = ZWSP
  assert.strictEqual(disp, 'evil' + ZW + '.png');
  assert.strictEqual(hasInvisibleChars(disp), true);
});

// ── server-side "only invisible filenames" filter ───────────────────────────
check('attachments publication + count accept invisibleOnly and use the char class', () => {
  const src = read('server/publications/attachments.js');
  assert.ok(/INVISIBLE_CHARS_SOURCE/.test(src), 'must query using the shared char class');
  assert.ok(/attachmentsList'.*invisibleOnly|invisibleOnly = false/.test(src), 'publication takes invisibleOnly');
  assert.ok(/getAttachmentsReportCount\(searchTerm = '', invisibleOnly/.test(src), 'count takes invisibleOnly');
  assert.ok(/\$regex: INVISIBLE_CHARS_SOURCE/.test(src), 'filter matches invisible chars in the name');
});

// ── client renders plain text, red-flags invisibles, has filter + legend ────
check('files report renders plain-text names, red-flags invisibles, has filter + legend', () => {
  const jade = read('client/components/settings/adminReports.jade');
  // plain text: escaped {{ }}, never {{{ }}} (raw HTML)
  assert.ok(/\{\{ displayFileName att\.name \}\}/.test(jade), 'name shown via displayFileName');
  assert.ok(!/\{\{\{ ?(att\.name|displayFileName)/.test(jade), 'filename must never be raw HTML');
  assert.ok(/fileNameHasInvisible att\.name/.test(jade) && /filename-invisible/.test(jade), 'invisible names flagged');
  assert.ok(/js-files-invisible-filter/.test(jade), 'invisible-only filter button present');
  assert.ok(/admin-report-legend/.test(jade), 'legend present');
  const js = read('client/components/settings/adminReports.js');
  assert.ok(/filesInvisibleOnly/.test(js) && /js-files-invisible-filter/.test(js), 'filter wired + toggled');
  const css = read('client/components/settings/adminReports.css');
  assert.ok(/\.filename-invisible\s*\{[^}]*color:/.test(css), 'red style for invisible names');
});

console.log(`\n${passed} passed`);
