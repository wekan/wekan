'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = name => JSON.parse(fs.readFileSync(
  path.join(root, `imports/i18n/data/${name}.i18n.json`), 'utf8'));
const en = read('en');
const zgh = read('zgh');
assert.equal(en['color-pink'], 'pink');
assert.equal(zgh['color-pink'], 'ⴰⵣⵡⴰⵡⴰⵖ');
assert.notEqual(zgh['color-pink'], 'rose');
assert.equal(en['color-darkgreen'], 'darkgreen');
assert.equal(zgh['color-darkgreen'], 'ⴰⵣⴳⵣⴰ ⴰⴱⵔⴽⴰⵏ');
assert.match(zgh['color-darkgreen'], new RegExp(zgh['color-green']));
assert.match(zgh['color-darkgreen'], new RegExp(zgh['color-black']));
assert.notEqual(zgh['color-darkgreen'], 'اخضر غامق');
for (const [key, source, value, old] of [
  ['color-sky', 'sky', 'ⵉⴳⵏⵏⴰ', 'ciel'],
  ['color-gold', 'gold', 'ⵓⵔⵖ', 'ذهبي'],
  ['color-silver', 'silver', 'ⴰⵥⵔⴼ', 'فضي'],
]) {
  assert.equal(en[key], source);
  assert.equal(zgh[key], value);
  assert.notEqual(zgh[key], old);
}
console.log('zghNativeColorTerms: pink and dark-green senses verified');
