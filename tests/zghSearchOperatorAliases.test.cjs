'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = name => JSON.parse(fs.readFileSync(
  path.join(root, `imports/i18n/data/${name}.i18n.json`), 'utf8'));
const en = read('en');
const zgh = read('zgh');
const native = {
  'operator-board': 'ⵜⴰⴼⵍⵡⵉⵜ',
  'operator-swimlane': 'ⴰⴱⵔⵉⴷ',
  'operator-creator': 'ⴰⵎⵙⵏⴼⵍⵓⵍ',
  'operator-status': 'ⴰⴷⴷⴰⴷ',
  'operator-sort': 'ⴰⴼⵔⴰⵏ',
  'operator-limit': 'ⴰⵡⵜⵜⵓ',
  'operator-org': 'ⵜⵓⴷⴷⵙⴰ',
  'operator-title': 'ⴰⵣⵡⵍ',
  'operator-description': 'ⴰⴳⵍⴰⵎ',
};
for (const [key, value] of Object.entries(native)) {
  assert.equal(zgh[key], value, key);
  assert.notEqual(zgh[key], en[key], `${key}: native full operator`);
  assert.doesNotMatch(zgh[key], /[\u0600-\u06ff]/u, `${key}: no Arabic seed`);
}
const aliases = {
  'operator-board-abbrev': 'b',
  'operator-swimlane-abbrev': 's',
  'operator-list-abbrev': 'l',
  'operator-member-abbrev': 'm',
};
for (const [key, value] of Object.entries(aliases)) {
  assert.equal(zgh[key], value, key);
  assert.equal(zgh[key], en[key], `${key}: portable syntax code`);
}
const allAliases = Object.keys(en).filter(key => /^operator-.*-abbrev$/.test(key))
  .map(key => zgh[key]);
assert.equal(new Set(allAliases).size, allAliases.length, 'one parser meaning per short alias');
const parser = fs.readFileSync(path.join(root, 'config/query-classes.js'), 'utf8');
for (const key of [...Object.keys(native), ...Object.keys(aliases)]) {
  assert.ok(parser.includes(`'${key}':`), `${key}: registered in production parser`);
}
assert.match(parser, /operatorMap\[TAPi18n\.\_\_\(key\)\.toLowerCase\(\)\] = value/);
assert.match(parser, /\\p\{Letter\}/, 'Tifinagh letters are accepted in full operators');
console.log('zghSearchOperatorAliases: native terms and portable collision-free syntax verified');
