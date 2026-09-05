'use strict';

// SheetColorBleed: an XLSX member may supply sheetPr/tabColor@rgb, but those
// bytes may control only a color token, never additional CSS declarations.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const dist = fs.readFileSync(path.join(__dirname, '..', 'npm-packages',
  'office-open-xml-viewer', 'dist', 'xlsx-DSU6pV1O.js'), 'utf8');
const method = /tabStyle\(e, t\) \{([\s\S]*?)\n\t\}/.exec(dist);
assert.ok(method, 'the shipped XLSX tab style method exists');
assert.match(method[1], /typeof t == "string" && \/\^#\[0-9A-F\]\{6\}\$\/\.test\(t\)/,
  'only canonical six-digit hexadecimal CSS colors cross into the style');
assert.ok(method[1].indexOf('^#[0-9A-F]{6}$') < method[1].indexOf('box-shadow:'),
  'validation happens before the CSS serialization sink');

const canonical = value => typeof value === 'string' && /^#[0-9A-F]{6}$/.test(value)
  ? value.toUpperCase() : '';
assert.equal(canonical('#FF0000'), '#FF0000', 'valid control remains a color');
for (const attack of [
  '#FF0000;BACKGROUND-IMAGE:URL(/PROBE)',
  '#FFF', '#FFFFFFFF', '#GG0000', 'red', '', null,
]) assert.equal(canonical(attack), '', `reject ${String(attack)}`);

assert.doesNotMatch(canonical('#FF0000;POSITION:FIXED'), /[;():]/,
  'negative: declarations cannot survive as a color');
console.log('SheetColorBleed: XLSX tab colors are canonical before CSS serialization');
