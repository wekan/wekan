'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const fillScript = path.join(root,
  'releases/translations/fill-translations.mjs');
const result = spawnSync(process.execPath, [fillScript, '--list', 'nd'], {
  cwd: root,
  encoding: 'utf8',
});
assert.equal(result.status, 0, result.stderr);
const remaining = JSON.parse(result.stdout);
assert.equal(Object.keys(remaining).length, 1867);

const english = JSON.parse(fs.readFileSync(
  path.join(root, 'imports/i18n/data/en.i18n.json'), 'utf8'));
const ndebele = JSON.parse(fs.readFileSync(
  path.join(root, 'imports/i18n/data/nd.i18n.json'), 'utf8'));
const tokens = value => [...value.matchAll(
  /__[A-Za-z0-9_]+__|%[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g)]
  .map(([token]) => token).sort();
const tags = value => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)]
  .map(([tag]) => tag).sort();

for (const [key, value] of Object.entries(ndebele)) {
  assert.deepEqual(tokens(value), tokens(english[key]), key);
  assert.deepEqual(tags(value), tags(english[key]), key);
}

assert.equal(ndebele.accept, 'Yamukela');
assert.deepEqual(tokens(ndebele['activity-changedTitle']), ['%s', '%s']);
assert.deepEqual(tokens(ndebele['act-deleteCard']),
  ['__board__', '__card__', '__list__', '__swimlane__']);
assert.deepEqual(tokens(ndebele['act-removeChecklistItem']),
  ['__board__', '__card__', '__checkList__', '__checklistItem__', '__list__',
    '__swimlane__']);
assert.deepEqual(tokens(ndebele['act-setCustomField']),
  ['__board__', '__card__', '__customFieldValue__', '__customField__',
    '__list__', '__swimlane__']);
assert.match(ndebele['act-createBoard'], /ibhodi/);
assert.match(ndebele['act-createCard'], /ikhadi/);
assert.match(ndebele['act-createList'], /uluhlu/);
assert.match(ndebele['act-createSwimlane'], /umzila/);
assert.match(ndebele['act-addAttachment'], /okunamathiselweyo/);
assert.match(ndebele['act-addChecklist'], /uluhlu lokuhlola/);
assert.deepEqual(tokens(ndebele['act-moveCardToOtherBoard']),
  ['__board__', '__card__', '__list__', '__oldBoard__', '__oldList__',
    '__oldSwimlane__', '__swimlane__']);
assert.deepEqual(tokens(ndebele['activity-imported']), ['%s', '%s', '%s']);
assert.deepEqual(tokens(ndebele['activity-checklist-completed-card']),
  ['__board__', '__card__', '__checklist__', '__list__', '__swimlane__']);
assert.equal(ndebele['allboards.workspaces'], 'Izindawo zokusebenza');
assert.match(ndebele['allboards.edit-workspace-icon'], /markdown/);
assert.deepEqual(tokens(ndebele['activity-dueDate']), ['%s', '%s']);
assert.match(ndebele['set-list-width-value'], /amaphikseli/);
assert.match(ndebele['list-width-error-message'], /270/);
assert.match(ndebele['set-swimlane-height-value'], /amaphikseli/);
assert.equal(ndebele['add-checklist'], 'Engeza uluhlu lokuhlola');
assert.deepEqual(tokens(ndebele['and-n-other-card']), ['__count__']);
assert.deepEqual(tokens(ndebele['and-n-other-card_plural']), ['__count__']);
assert.deepEqual(tokens(ndebele['avatar-too-big']), ['__size__']);
assert.match(ndebele['board-background-image-url'], /URL/);
assert.deepEqual(tokens(ndebele['board-nb-stars']), ['%s']);
assert.deepEqual(tags(ndebele['board-private-info']),
  ['</strong>', '<strong>']);
assert.deepEqual(tags(ndebele['board-public-info']),
  ['</strong>', '<strong>']);
assert.deepEqual(tokens(
  ndebele['board-open-and-move-between-remaining-and-workspaces']),
['__workspaces__']);
assert.match(ndebele['enter-zoom-level'], /50-300%/);
assert.deepEqual(tokens(ndebele['card-comments-title']), ['%s']);
assert.equal(ndebele['card-edit-custom-fields'],
  'Hlela izinkambu ezenziwe ngokwezifiso');
assert.match(ndebele['cardStartPlanningPokerPopup-title'], /Planning Poker/);
assert.match(ndebele['editPokerEndDatePopup-title'], /Planning Poker/);
assert.equal(ndebele['importDependenciesPopup-title'], 'Ngenisa ukuncika');
assert.equal(ndebele['addBoardOrgPopup-title'], 'Engeza inhlangano');
assert.equal(ndebele['addBoardTeamPopup-title'], 'Engeza iqembu');

console.log('Northern Ndebele translation progress checks passed.');
