'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const readLanguage = code => JSON.parse(fs.readFileSync(
  path.join(root, 'imports/i18n/data', `${code}.i18n.json`),
  'utf8',
));
const english = readLanguage('en');
const sesotho = readLanguage('st');
const tokenPattern = /__[^\s]+?__|%(?:\d+\$)?[A-Za-z]/g;
const tokens = value => (value.match(tokenPattern) || []).sort();

const result = spawnSync(process.execPath,
  [path.join(root, 'releases/translations/fill-translations.mjs'),
    '--list', 'st'], { cwd: root, encoding: 'utf8' });
assert.equal(result.status, 0, result.stderr);
assert.equal(Object.keys(JSON.parse(result.stdout)).length, 2117);

for (const [key, value] of Object.entries(sesotho)) {
  assert.deepEqual(tokens(value), tokens(english[key]), `${key}: placeholder inventory`);
}

assert.equal(sesotho.accept, 'Amohela');
assert.match(sesotho['act-createBoard'], /boto/);
assert.match(sesotho['act-createCard'], /karete/);
assert.match(sesotho['act-createList'], /lenane/);
assert.match(sesotho['act-createSwimlane'], /tsela ya ho sesa/);
assert.match(sesotho['act-addChecklist'], /lenane la tlhahlobo/);
assert.deepEqual(tokens(sesotho['act-removeChecklistItem']), [
  '__board__', '__card__', '__checkList__', '__checklistItem__', '__list__',
  '__swimlane__',
]);
assert.deepEqual(tokens(sesotho['act-setCustomField']), [
  '__board__', '__card__', '__customFieldValue__', '__customField__', '__list__',
  '__swimlane__',
]);

console.log('Sesotho translation progress checks passed.');
