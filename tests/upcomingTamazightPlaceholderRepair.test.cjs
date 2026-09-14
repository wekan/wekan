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

assert.strictEqual(translated.or, 'ⵏⵖ');
const header = fs.readFileSync(path.join(ROOT, 'client/components/main/header.jade'), 'utf8');
assert.match(header, /sidebar-open.*{{_ 'or'}}.*sidebar-close/);
const toggleTitle = `${translated['sidebar-open']} ${translated.or} ${translated['sidebar-close']}`;
assert.match(toggleTitle, / ⵏⵖ /);
assert.doesNotMatch(toggleTitle, /\bou\b/);
console.log('Tamazight sidebar alternatives use the native conjunction');

const boardControls = {
  'add-swimlane': 'ⵔⵏⵓ ⴰⴱⵔⵉⴷ',
  'r-add-swimlane': 'ⵔⵏⵓ ⴰⴱⵔⵉⴷ',
  'listActionPopup-title': 'ⵜⵉⴳⴰⵡⵉⵏ ⵏ ⵜⵍⴳⴰⵎⵜ',
  'swimlaneActionPopup-title': 'ⵜⵉⴳⴰⵡⵉⵏ ⵏ ⵓⴱⵔⵉⴷ',
};
for (const [key, value] of Object.entries(boardControls)) {
  assert.strictEqual(translated[key], value);
  assert.doesNotMatch(translated[key], /Ajouter|Actions|couloir|[\u0600-\u06ff]/u);
}
assert.notStrictEqual(translated['listActionPopup-title'], translated['swimlaneActionPopup-title']);
console.log('Tamazight board controls preserve distinct add/action and list/lane meanings');

for (const key of ['default', 'defaultdefault', 'font-size-default']) {
  assert.strictEqual(translated[key], 'ⵙ ⵓⵡⵏⵓⵍ');
  assert.doesNotMatch(translated[key], /Défaut|Default|ⴰⵎⵣⵡⴰⵔⵓ/u);
}
console.log('Tamazight Default values replace French without changing to First');

assert.strictEqual(translated['export-card-excel-fields'], 'ⵙⵜⵉ ⵉⴳⵔⴰⵏ ⵍⵍⵉ ⵔⴰ ⵜⵙⵙⵓⴼⵖⴷ ⵖⵔ Excel:');
assert.doesNotMatch(translated['export-card-excel-fields'], /Sélectionnez|champs|inclure|export Excel/);
console.log('Tamazight Excel prompt retains choosing fields, export destination and colon');

assert.strictEqual(translated['operator-debug-invalid'], '%s: ⴰⵣⴰⵍ ⵏ debug ⵓⵔ ⵉⵣⵔⵉ');
assert.deepStrictEqual(inventory(translated['operator-debug-invalid']), ['%s']);
assert.doesNotMatch(translated['operator-debug-invalid'], /prédicat|valide|ⵉⵎⵏⵏⵉ/);
assert.notStrictEqual(translated['operator-debug-invalid'], translated['operator-has-invalid']);
const querySource = fs.readFileSync(path.join(ROOT, 'config/query-classes.js'), 'utf8');
assert.match(querySource, /operator === OPERATOR_DEBUG[\s\S]*?predicateTranslations\[OPERATOR_DEBUG\]\[value\][\s\S]*?operator-debug-invalid/);
console.log('Tamazight debug error preserves catalogue-value meaning and positional token');

assert.strictEqual(translated.OS_Freemem, 'OS: ⵜⴰⴽⴰⵜⵓⵜ ⵜⴰⵎⵛⵉⵅⵜ');
assert.notStrictEqual(translated.OS_Freemem, translated.OS_Totalmem);
assert.doesNotMatch(translated.OS_Freemem, /[\u0600-\u06ff]|ⵎⴰⵕⵕⴰ/u);
const statisticsSource = fs.readFileSync(path.join(ROOT, 'server/statistics.js'), 'utf8');
assert.match(statisticsSource, /freemem: os\.freemem\(\)/);
console.log('Tamazight free memory remains distinct from total system memory');

assert.strictEqual(translated.OS_Release, 'OS: ⵜⵓⵏⵖⵉⵍⵜ');
assert.strictEqual(translated.OS_Type, 'OS: ⴰⵏⴰⵡ');
assert.strictEqual(translated.type, 'ⴰⵏⴰⵡ');
for (const key of ['OS_Release', 'OS_Type', 'type']) assert.doesNotMatch(translated[key], /[\u0600-\u06ff]/u);
assert.notStrictEqual(translated.OS_Release, translated.OS_Type);
assert.match(statisticsSource, /release: os\.release\(\)/);
assert.match(statisticsSource, /type: os\.type\(\)/);
console.log('Tamazight OS release and type remain separate metrics');
