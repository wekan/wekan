'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = name => JSON.parse(fs.readFileSync(
  path.join(root, `imports/i18n/data/${name}.i18n.json`), 'utf8'));
const en = read('en');
const zgh = read('zgh');

assert.equal(en['filter-creator-label'], 'Filter by creator');
assert.equal(en['creator-on-minicard'], 'Creator on minicard');
assert.ok(zgh['filter-creator-label'].startsWith(zgh['filter-member-label'].split(' ⵙ ')[0] + ' ⵙ '));
assert.ok(zgh['filter-creator-label'].includes(zgh.creator.slice(1)), 'filter uses the native creator stem');
assert.ok(zgh['creator-on-minicard'].startsWith(zgh.creator + ' '));
assert.ok(zgh['creator-on-minicard'].endsWith(zgh['description-on-minicard'].split(' ⵖⴼ ')[1]),
  'minicard label uses the established native location phrase');
for (const key of ['filter-creator-label', 'creator-on-minicard']) {
  assert.match(zgh[key], /[\u2d30-\u2d7f]/u, `${key}: native Tifinagh`);
  assert.doesNotMatch(zgh[key], /[\u0600-\u06ff]|\b(?:Filtrer|personne)\b/iu,
    `${key}: wrong-language seed removed`);
}
console.log('zghCreatorLabels: native creator, filter and minicard terms verified');
