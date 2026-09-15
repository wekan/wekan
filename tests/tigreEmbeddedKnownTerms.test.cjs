'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const locale = code =>
  JSON.parse(
    fs.readFileSync(
      path.join(root, 'imports/i18n/data', code + '.i18n.json'),
      'utf8',
    ),
  );
const english = locale('en');
const tigre = locale('tig');
const manifestKeys = new Set([
  'custom-manifest-enabled',
  'custom-head-manifest-content',
]);
let checked = 0;

for (const [key, value] of Object.entries(tigre)) {
  if (/(account|storage|repositor)/i.test(english[key])) {
    assert.doesNotMatch(
      value,
      /መለያ|መኽዘን/,
      key + ': copied Tigrinya Account/Storage component',
    );
    checked += 1;
  }
  if (
    /(description|profile)/i.test(english[key]) &&
    !manifestKeys.has(key)
  ) {
    assert.doesNotMatch(
      value,
      /መግለጺ/,
      key + ': copied Tigrinya Description component',
    );
    checked += 1;
  }
}
assert.equal(tigre.description, 'ዋስፎ');
assert.equal(tigre.storage, 'መክዘን');
assert.equal(tigre['azure-account-name'], 'ስሜት ሕሳብ');
for (const key of manifestKeys) {
  assert.match(tigre[key], /መግለጺ/, key + ': excluded Manifest sense');
}
console.log('Tigre embedded known-term contexts checked: ' + checked);
