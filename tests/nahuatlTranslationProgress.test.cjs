'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const fillScript = path.join(root,
  'releases/translations/fill-translations.mjs');
const result = spawnSync(process.execPath, [fillScript, '--list', 'nah'], {
  cwd: root,
  encoding: 'utf8',
});
assert.equal(result.status, 0, result.stderr);
const remaining = JSON.parse(result.stdout);
assert.equal(Object.keys(remaining).length, 2017);

const english = JSON.parse(fs.readFileSync(
  path.join(root, 'imports/i18n/data/en.i18n.json'), 'utf8'));
const nahuatl = JSON.parse(fs.readFileSync(
  path.join(root, 'imports/i18n/data/nah.i18n.json'), 'utf8'));
const tokens = value => [...value.matchAll(
  /__[A-Za-z0-9_]+__|%[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g)]
  .map(([token]) => token).sort();
const tags = value => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)]
  .map(([tag]) => tag).sort();

for (const [key, value] of Object.entries(nahuatl)) {
  assert.deepEqual(tokens(value), tokens(english[key]), key);
  assert.deepEqual(tags(value), tags(english[key]), key);
}

assert.equal(nahuatl.accept, 'Xicseli');
assert.deepEqual(tokens(nahuatl['activity-changedTitle']), ['%s', '%s']);
assert.deepEqual(tokens(nahuatl['act-deleteCard']),
  ['__board__', '__card__', '__list__', '__swimlane__']);
assert.deepEqual(tokens(nahuatl['act-removeChecklistItem']),
  ['__board__', '__card__', '__checkList__', '__checklistItem__', '__list__',
    '__swimlane__']);
assert.deepEqual(tokens(nahuatl['act-setCustomField']),
  ['__board__', '__card__', '__customFieldValue__', '__customField__',
    '__list__', '__swimlane__']);
assert.match(nahuatl['act-createBoard'], /huapalli/);
assert.match(nahuatl['act-createCard'], /amatlapalli/);
assert.deepEqual(tokens(nahuatl['act-moveCardToOtherBoard']),
  ['__board__', '__card__', '__list__', '__oldBoard__', '__oldList__',
    '__oldSwimlane__', '__swimlane__']);
assert.deepEqual(tokens(nahuatl['activity-imported']), ['%s', '%s', '%s']);
assert.deepEqual(tokens(nahuatl['activity-checklist-completed-card']),
  ['__board__', '__card__', '__checklist__', '__list__', '__swimlane__']);
assert.equal(nahuatl['allboards.workspaces'], 'Tequitiloyan');
assert.match(nahuatl['allboards.edit-workspace-icon'], /markdown/);
assert.deepEqual(tokens(nahuatl['activity-dueDate']), ['%s', '%s']);
assert.match(nahuatl['set-list-width-value'], /pixels/);
assert.match(nahuatl['list-width-error-message'], /270/);
assert.match(nahuatl['set-swimlane-height-value'], /pixels/);
assert.equal(nahuatl['add-checklist'],
  'Xicaquiti tlanextiliztocatlahtolli');

console.log('Nahuatl translation progress checks passed.');
