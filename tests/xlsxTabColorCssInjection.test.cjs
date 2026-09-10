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

console.log('SheetColorBleed: documentGif.js no longer serializes workbook color data as CSS at all');
