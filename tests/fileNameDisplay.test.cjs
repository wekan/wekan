'use strict';

// General filename DISPLAY handling (imports/lib/fileNameDisplay.js). Every
// filename shown anywhere in WeKan (card attachments, admin Files report, download
// headers) goes through cleanFileName(), which:
//   - URL-decodes a percent-encoded name when it decodes cleanly;
//   - folds confusable homoglyphs (NFKC + Cyrillic/Greek look-alikes) to the
//     standard character in a predominantly-Latin name (anti-typosquatting);
//   - removes invisible / control / bidi characters;
//   - strips exploit markup (HTML/JS/XML/template-injection);
//   - collapses whitespace.
//
// Run: node tests/fileNameDisplay.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const {
  hasInvisibleChars,
  decodeFileNameSafe,
  stripExploitPatterns,
  classifyExploitKinds,
  cleanFileName,
  sanitizeDownloadFileName,
} = require('../imports/lib/fileNameDisplay.js');

let passed = 0;
function check(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');

const ZW = '​';   // zero-width space
const RLO = '‮';  // right-to-left override (bidi)
const BOM = '﻿';

console.log('fileNameDisplay:');

check('hasInvisibleChars flags zero-width / control / bidi, not normal text or CJK', () => {
  assert.strictEqual(hasInvisibleChars('normal.png'), false);
  assert.strictEqual(hasInvisibleChars('Nihongo 日本語.txt'), false); // CJK ok
  assert.strictEqual(hasInvisibleChars('evil' + ZW + '.png'), true);
  assert.strictEqual(hasInvisibleChars('tab\tname.txt'), true);
  assert.strictEqual(hasInvisibleChars('bom' + BOM + '.txt'), true);
});

check('decodeFileNameSafe decodes only clean percent-encoding', () => {
  assert.strictEqual(decodeFileNameSafe('%D0%93%D1%80.txt'), 'Гр.txt');
  assert.strictEqual(decodeFileNameSafe('plain.txt'), 'plain.txt');
  assert.strictEqual(decodeFileNameSafe('100%done.txt'), '100%done.txt'); // not encoded
  assert.strictEqual(decodeFileNameSafe('bad%ZZ.txt'), 'bad%ZZ.txt');     // malformed
});

check('cleanFileName removes invisible characters', () => {
  assert.strictEqual(cleanFileName('evil' + ZW + '.png'), 'evil.png');
  assert.strictEqual(cleanFileName('doc' + RLO + 'fdp.exe'), 'docfdp.exe');
  assert.strictEqual(cleanFileName(BOM + 'report.pdf'), 'report.pdf');
});

check('cleanFileName URL-decodes', () => {
  assert.strictEqual(cleanFileName('%D0%93%D1%80.txt'), 'Гр.txt');
});

check('cleanFileName folds confusable homoglyphs in a Latin-majority name (typosquat)', () => {
  assert.strictEqual(cleanFileName('pаypal.exe'), 'paypal.exe');    // Cyrillic a
  assert.strictEqual(cleanFileName('gооgle.com'), 'google.com'); // Cyrillic o
  assert.strictEqual(cleanFileName('invоice.pdf'), 'invoice.pdf'); // Cyrillic o among Latin
});

check('cleanFileName preserves a genuinely non-Latin name (no Latin majority)', () => {
  // All-Cyrillic base (even one that spells Latin-looking letters) must NOT be
  // folded — there is no Latin majority, so it is treated as a real foreign name.
  assert.strictEqual(cleanFileName('Гр.txt'), 'Гр.txt');
  assert.strictEqual(cleanFileName('документ.txt'), 'документ.txt');
  assert.strictEqual(cleanFileName('АВС.txt'), 'АВС.txt'); // all-Cyrillic caps, preserved
});

check('cleanFileName applies NFKC (fullwidth -> ASCII)', () => {
  assert.strictEqual(cleanFileName('ＡＢＣ.txt'), 'ABC.txt'); // ＡＢＣ
});

check('cleanFileName strips exploit markup', () => {
  assert.strictEqual(cleanFileName('<script>alert(1)</script>.png'), 'alert(1).png');
  assert.strictEqual(cleanFileName('a<b>c.txt'), 'ac.txt');
  assert.strictEqual(cleanFileName('file{{7*7}}.pdf'), 'file.pdf');
  assert.strictEqual(cleanFileName('x javascript:alert.svg'), 'x alert.svg');
  assert.strictEqual(cleanFileName('<?php echo 1;?>note.txt'), 'note.txt');
});

check('cleanFileName leaves a plain accented Latin name intact', () => {
  assert.strictEqual(cleanFileName('café.pdf'), 'café.pdf');
});

check('stripExploitPatterns removes tags, PIs, CDATA, templates, dangerous URIs', () => {
  assert.ok(!/[<>]/.test(stripExploitPatterns('<a href="x">y</a>')));
  assert.strictEqual(stripExploitPatterns('${process}'), '');
  assert.strictEqual(stripExploitPatterns('<![CDATA[x]]>'), '');
  assert.ok(!/javascript:/i.test(stripExploitPatterns('javascript:alert(1)')));
});

check('classifyExploitKinds names the exploit kind (for the Problems log)', () => {
  assert.deepStrictEqual(classifyExploitKinds('<!DOCTYPE x><!ENTITY y>'), ['XML loop (billion laughs)']);
  assert.deepStrictEqual(classifyExploitKinds('<?xml version="1.0"?>'), ['XML code']);
  assert.deepStrictEqual(classifyExploitKinds('<script>alert(1)</script>'), ['JavaScript code']);
  assert.deepStrictEqual(classifyExploitKinds('onerror=alert(1)'), ['JavaScript code']);
  assert.deepStrictEqual(classifyExploitKinds('<?php echo 1;?>'), ['server-side code (PHP/ASP)']);
  assert.deepStrictEqual(classifyExploitKinds('a{{7*7}}'), ['template injection']);
  assert.deepStrictEqual(classifyExploitKinds('<b>hi</b>'), ['HTML code']);
  assert.deepStrictEqual(classifyExploitKinds('clean.png'), []);
});

check('sanitizeDownloadFileName never returns empty', () => {
  assert.strictEqual(sanitizeDownloadFileName('good.pdf'), 'good.pdf');
  assert.strictEqual(sanitizeDownloadFileName('<>'), 'download');
  assert.strictEqual(sanitizeDownloadFileName(ZW + ZW), 'download');
  assert.strictEqual(sanitizeDownloadFileName(''), 'download');
  assert.strictEqual(sanitizeDownloadFileName(null), 'download');
});

// ── wired everywhere: global helpers, card attachments, admin report, downloads ─
check('global filename helpers registered and used across the UI', () => {
  const js = read('client/components/main/safeFilename.js');
  assert.ok(/registerHelper\('cleanFilename'/.test(js) && /registerHelper\('downloadFilename'/.test(js),
    'cleanFilename + downloadFilename helpers registered');
  const cards = read('client/components/cards/attachments.jade');
  assert.ok(/\{\{ cleanFilename name \}\}/.test(cards), 'card attachment name uses cleanFilename');
  assert.ok(/download="\{\{downloadFilename name\}\}"/.test(cards), 'download uses the clean name');
  assert.ok(/title="\{\{cleanFilename name\}\}"/.test(cards), 'thumbnail titles use cleanFilename');
  assert.ok(/\{\{ cleanFilename att\.name \}\}/.test(read('client/components/settings/adminReports.jade')),
    'Files report uses cleanFilename');
});

check('download routes sanitize the Content-Disposition filename', () => {
  for (const f of ['server/routes/universalFileServer.js', 'server/routes/legacyAttachments.js']) {
    assert.ok(/sanitizeDownloadFileName/.test(read(f)), `${f} must sanitize the download name`);
  }
});

// ── the removed invisible-filter feature must be gone ────────────────────────
check('the old invisible-character filter / warning / legend are fully removed', () => {
  const jade = read('client/components/settings/adminReports.jade');
  const js = read('client/components/settings/adminReports.js');
  const pub = read('server/publications/attachments.js');
  assert.ok(!/js-files-invisible-filter/.test(jade) && !/admin-report-legend/.test(jade), 'no filter button / legend');
  assert.ok(!/filesInvisibleOnly|filesInvisibleActive/.test(js), 'no invisible-only client state');
  assert.ok(!/invisibleOnly/.test(pub), 'publication no longer takes invisibleOnly');
});

console.log(`\nfileNameDisplay: ${passed} checks passed`);
