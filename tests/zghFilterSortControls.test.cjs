'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = name => JSON.parse(fs.readFileSync(
  path.join(root, `imports/i18n/data/${name}.i18n.json`), 'utf8'));
const en = read('en');
const zgh = read('zgh');

assert.equal(en['filter-hide-empty'], 'Hide empty lists');
assert.equal(en['set-filter'], 'Set Filter');
assert.equal(en['sort-is-on'], 'Sort is on');
assert.ok(zgh['filter-hide-empty'].startsWith(zgh['all-boards-hide'].split(': ')[1] + ' '),
  'hide control uses the established native imperative');
assert.ok(zgh['filter-hide-empty'].includes('ⵜⵉⵍⴳⴰⵎⵉⵏ ⵓⵔ ⴳⵉⵙⵏⵜ ⵜⵍⵍⵉ ⵜⴰⴽⴰⵕⴹⴰ'),
  'empty lists use the locally established no-cards clause');
assert.ok(zgh['filter-on-desc'].includes('ⵜⴰⵎⵣⵉⵣⴷⴳⵜ'),
  'filter noun is independently present in local prose');
assert.ok(zgh['set-filter'].endsWith('ⵜⴰⵎⵣⵉⵣⴷⴳⵜ'),
  'set filter uses the native filter noun');
assert.ok(zgh['sort-is-on'].includes(zgh['operator-sort'].replace(/^ⴰ/, 'ⵓ')),
  'sort status uses the native sort stem');
for (const key of ['filter-hide-empty', 'set-filter', 'sort-is-on']) {
  assert.match(zgh[key], /[\u2d30-\u2d7f]/u, `${key}: native Tifinagh`);
  assert.doesNotMatch(zgh[key], /[\u0600-\u06ff]|\b(?:Cacher|Définir|listes|vides|filtre)\b/iu,
    `${key}: wrong-language seed removed`);
}
console.log('zghFilterSortControls: native filter and sort control terms verified');
