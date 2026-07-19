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
const { hasInvisibleChars, decodeFileNameSafe, INVISIBLE_CHARS_SOURCE,
  fileNameSegments, describeInvisibleChar } = require('../imports/lib/fileNameDisplay.js');

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

// ── segment splitting: visible runs + named invisible chars ─────────────────
check('fileNameSegments splits visible runs from named invisible characters', () => {
  assert.deepStrictEqual(fileNameSegments('normal-file.png'),
    [{ invisible: false, text: 'normal-file.png' }]);
  assert.deepStrictEqual(fileNameSegments('evil' + ZW + '.png'), [
    { invisible: false, text: 'evil' },
    { invisible: true, text: '[U+200B ZERO WIDTH SPACE]' },
    { invisible: false, text: '.png' },
  ]);
  assert.deepStrictEqual(fileNameSegments('tab\tname.txt'), [
    { invisible: false, text: 'tab' },
    { invisible: true, text: '[U+0009 TAB]' },
    { invisible: false, text: 'name.txt' },
  ]);
  // percent-encoded is decoded first, and a clean name has one visible segment.
  assert.deepStrictEqual(fileNameSegments('%D0%93%D1%80.png'),
    [{ invisible: false, text: 'Гр.png' }]);
});

check('describeInvisibleChar names known chars and falls back to U+XXXX', () => {
  assert.strictEqual(describeInvisibleChar(0x200b), 'U+200B ZERO WIDTH SPACE');
  assert.strictEqual(describeInvisibleChar(0x09), 'U+0009 TAB');
  assert.strictEqual(describeInvisibleChar(0x202e), 'U+202E RIGHT-TO-LEFT OVERRIDE');
  // NEGATIVE: an unnamed C1 control -> just its code point.
  assert.strictEqual(describeInvisibleChar(0x0086), 'U+0086');
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
check('files report shows a red warning + inline named invisible chars (plain text) + filter + legend', () => {
  const jade = read('client/components/settings/adminReports.jade');
  const filesTpl = jade.slice(jade.indexOf('template(name="filesReport")'), jade.indexOf('template(name="cardsReport")'));
  // red warning triangle when the name hides invisible characters
  assert.ok(/att\.hasInvisible/.test(filesTpl) && /filename-invisible-warning/.test(filesTpl), 'red warning shown for invisible names');
  // each invisible character replaced inline by its (red) description segment
  assert.ok(/each seg in att\.nameSegments/.test(filesTpl) && /invisible-char-desc/.test(filesTpl), 'inline per-character descriptions');
  // rendered as ESCAPED plain text — never raw HTML/markdown
  assert.ok(/\{\{ seg\.text \}\}/.test(filesTpl), 'segment text via escaped {{ }}');
  assert.ok(!/\{\{\{/.test(filesTpl), 'filename must never be raw HTML');
  assert.ok(/js-files-invisible-filter/.test(filesTpl), 'invisible-only filter present');
  assert.ok(/admin-report-legend/.test(filesTpl), 'legend present');
  const js = read('client/components/settings/adminReports.js');
  assert.ok(/filesInvisibleOnly/.test(js) && /nameSegments: fileNameSegments/.test(js), 'rows enriched with segments + filter wired');
  const css = read('client/components/settings/adminReports.css');
  assert.ok(/\.invisible-char-desc\s*\{[^}]*color:/.test(css) && /\.filename-invisible-warning\s*\{[^}]*color:/.test(css),
    'red styles for the warning triangle + the inline descriptions');
});

console.log(`\n${passed} passed`);
