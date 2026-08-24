'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const read = code => JSON.parse(fs.readFileSync(path.join(ROOT,
  'imports/i18n/data', `${code}.i18n.json`), 'utf8'));
const english = read('en');
const translated = read('et-EE');
const pattern = /__[^\s]+?__|%(?:\d+\$)?[A-Za-z]/g;
const inventory = value => (value.match(pattern) || []).sort();
for (const [key, source] of Object.entries(english)) {
  assert.deepStrictEqual(inventory(translated[key] || ''), inventory(source),
    `et-EE:${key} changed a placeholder`);
}
const values = Object.values(translated).join('\n');
assert.doesNotMatch(values, /__(?:manus|kaart|kaardile|loend|nimekiri|laud|tahvel|kutsuja|kasutaja|loe|algus|lõpp|predikaat_)/);
console.log('upcomingEstonianPlaceholderRepair: 2 tests passed');
