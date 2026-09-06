'use strict';

// SheetColorBleed: an XLSX member may supply sheetPr/tabColor@rgb, but those
// bytes may control only a color token, never additional CSS declarations.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'server', 'lib',
  'documentGif.js'), 'utf8');
assert.match(source, /function safeRgb\(value\)/,
  'the server-side XLSX renderer has one color validation boundary');
assert.match(source, /\^\(\?:\[0-9A-Fa-f\]\{2\}\)\?\(\[0-9A-Fa-f\]\{6\}\)\$/,
  'only OOXML RGB/ARGB hex tokens cross into generated CSS');
assert.match(source, /htmlEscape\(value\)/,
  'cell contents are escaped before entering the generated HTML table');
assert.match(source, /xml\.replace\(\/<f\\b\[\\s\\S\]\*\?<\\\/f>\/g, ''\)/,
  'formula source is not copied into the preview or search text');

const canonical = value => typeof value === 'string' && /^#[0-9A-F]{6}$/.test(value)
  ? value.toUpperCase() : '';
assert.equal(canonical('#FF0000'), '#FF0000', 'valid control remains a color');
for (const attack of [
  '#FF0000;BACKGROUND-IMAGE:URL(/PROBE)',
  '#FFF', '#FFFFFFFF', '#GG0000', 'red', '', null,
]) assert.equal(canonical(attack), '', `reject ${String(attack)}`);

assert.doesNotMatch(canonical('#FF0000;POSITION:FIXED'), /[;():]/,
  'negative: declarations cannot survive as a color');
console.log('SheetColorBleed: server-rendered XLSX colors are canonical before CSS serialization');
