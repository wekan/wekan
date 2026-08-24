'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const read = code => JSON.parse(fs.readFileSync(path.join(ROOT,
  'imports/i18n/data', `${code}.i18n.json`), 'utf8'));
const english = read('en');
const translated = read('zgh');
const pattern = /__[^\s]+?__|%(?:\d+\$)?[A-Za-z]/g;
const inventory = value => (value.match(pattern) || []).sort();
for (const [key, source] of Object.entries(english)) {
  assert.deepStrictEqual(inventory(translated[key] || ''), inventory(source),
    `zgh:${key} changed a placeholder`);
}
const repairedKeys = ['act-addAttachment', 'act-removeChecklistItem',
  'act-setCustomField', 'globalSearch-instructions-operator-has'];
const repaired = repairedKeys.map(key => translated[key]).join('\n');
assert.match(repaired, /Takarḍa|takarḍa|tabdart|tafelwit|asenqed/);
assert.doesNotMatch(repaired, /[\u0600-\u06ff]|a édité|dans la|__(?:مرفق|بطاقة|قائمة|لوحة)__/u);
console.log('upcomingTamazightPlaceholderRepair: 2 tests passed');
