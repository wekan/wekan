'use strict';

// SheetColorBleed: an XLSX member may supply sheetPr/tabColor@rgb, but those
// bytes may control only a color token, never additional CSS declarations.
//
// The original fix canonicalized that color before it entered a server-
// rendered HTML preview table. The document-preview slideshow that table
// belonged to has since been replaced: server/lib/documentGif.js now builds
// only a plain-text search index (indexDocumentText/officeSearchText) and
// never generates HTML, CSS, or reads style/color data at all - the actual
// XLSX rendering moved to the restored client-side office-open-xml-viewer
// (a separate, vendored, MIT-licensed package). So the attack surface this
// vulnerability lived in - workbook color bytes reaching server-generated
// CSS - no longer exists on the server at all: there is nothing left to
// canonicalize because nothing is serialized into CSS here anymore.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'server', 'lib',
  'documentGif.js'), 'utf8');

for (const pattern of [/function safeRgb\(/, /xlsxStyles\(/, /tabColor/i,
  /sheetPr/i, /htmlEscape\(/, /<style/i]) {
  assert.doesNotMatch(source, pattern,
    `documentGif.js must not read/serialize workbook style or color data any more (found ${pattern})`);
}

// Formula source still must not leak into the search index.
assert.match(source, /xml\.replace\(\/<f\\b\[\\s\\S\]\*\?<\\\/f>\/g, ''\)/,
  'formula source is not copied into the search text');

// The client-side viewer is where workbook colors DO reach CSS now. Its tab
// strip writes the sheet's tabColor into style.cssText, and it accepts only a
// canonical #RRGGBB (2026-10-02: this test used to read only the server).
const viewer = fs.readFileSync(path.join(__dirname, '..', 'npm-packages',
  'office-open-xml-viewer', 'dist', 'xlsx-DSU6pV1O.js'), 'utf8');
const tabStyleAt = viewer.indexOf('tabStyle(e, t) {');
assert.ok(tabStyleAt > 0, 'the viewer still builds tab styles in tabStyle()');
const tabStyle = viewer.slice(tabStyleAt, tabStyleAt + 300);
assert.match(tabStyle, /t = typeof t == "string" && \/\^#\[0-9A-F\]\{6\}\$\/\.test\(t\) \? t\.toUpperCase\(\) : "";/,
  'the tab color is canonicalized before it is put into CSS');
// Negative: the color gets into the tab's CSS only through tabStyle().
const tabColorReads = [...viewer.matchAll(/tabColors\[/g)].length;
assert.ok(tabColorReads >= 1, 'the viewer reads the tab colors');
for (const m of viewer.matchAll(/tabColors\[[^\]]+\]/g)) {
  const around = viewer.slice(Math.max(0, m.index - 40), m.index);
  assert.match(around, /tabStyle\([^)]*$/, `tab color used outside tabStyle(): ${viewer.slice(m.index - 40, m.index + 30)}`);
}

console.log('SheetColorBleed: the server serializes no workbook color; the viewer canonicalizes tab colors');
