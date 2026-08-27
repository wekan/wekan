'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const result = spawnSync(process.execPath,
  [path.join(root, 'releases/translations/fill-translations.mjs'),
    '--list', 'nso'], { cwd: root, encoding: 'utf8' });
assert.equal(result.status, 0, result.stderr);
assert.equal(Object.keys(JSON.parse(result.stdout)).length, 2017);

const english = JSON.parse(fs.readFileSync(
  path.join(root, 'imports/i18n/data/en.i18n.json'), 'utf8'));
const sotho = JSON.parse(fs.readFileSync(
  path.join(root, 'imports/i18n/data/nso.i18n.json'), 'utf8'));
const tokens = value => [...value.matchAll(
  /__[A-Za-z0-9_]+__|%[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g)]
  .map(([token]) => token).sort();
const tags = value => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)]
  .map(([tag]) => tag).sort();

for (const [key, value] of Object.entries(sotho)) {
  assert.deepEqual(tokens(value), tokens(english[key]), key);
  assert.deepEqual(tags(value), tags(english[key]), key);
}

assert.equal(sotho.accept, 'Amogela');
assert.deepEqual(tokens(sotho['activity-changedTitle']), ['%s', '%s']);
assert.deepEqual(tokens(sotho['act-deleteCard']),
  ['__board__', '__card__', '__list__', '__swimlane__']);
assert.deepEqual(tokens(sotho['act-removeChecklistItem']),
  ['__board__', '__card__', '__checkList__', '__checklistItem__', '__list__',
    '__swimlane__']);
assert.deepEqual(tokens(sotho['act-setCustomField']),
  ['__board__', '__card__', '__customFieldValue__', '__customField__',
    '__list__', '__swimlane__']);
assert.match(sotho['act-createBoard'], /boto/);
assert.match(sotho['act-createCard'], /karata/);
assert.match(sotho['act-createList'], /lenaneo/);
assert.match(sotho['act-addChecklist'], /lenaneo la go hlahloba/);
assert.deepEqual(tokens(sotho['act-moveCardToOtherBoard']),
  ['__board__', '__card__', '__list__', '__oldBoard__', '__oldList__',
    '__oldSwimlane__', '__swimlane__']);
assert.deepEqual(tokens(sotho['activity-imported']), ['%s', '%s', '%s']);
assert.deepEqual(tokens(sotho['activity-checklist-completed-card']),
  ['__board__', '__card__', '__checklist__', '__list__', '__swimlane__']);
assert.equal(sotho['allboards.workspaces'], 'Mafelo a mošomo');
assert.match(sotho['allboards.edit-workspace-icon'], /markdown/);
assert.equal(sotho['workspaceActionsPopup-title'],
  'Dipeakanyo tša lefelo la mošomo');
assert.deepEqual(tokens(sotho['activity-dueDate']), ['%s', '%s']);
assert.match(sotho['list-width-error-message'], /270/);
assert.match(sotho['set-swimlane-height-value'], /dipiksele/);
assert.equal(sotho['add-members'], 'Oketša maloko');

console.log('Northern Sotho translation progress checks passed.');
