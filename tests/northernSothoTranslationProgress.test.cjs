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
assert.equal(Object.keys(JSON.parse(result.stdout)).length, 1367);

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
assert.deepEqual(tokens(sotho['and-n-other-card']), ['__count__']);
assert.deepEqual(tokens(sotho['avatar-too-big']), ['__size__']);
assert.deepEqual(tokens(sotho['board-nb-stars']), ['%s']);
assert.deepEqual(tags(sotho['board-private-info']),
  ['</strong>', '<strong>']);
assert.equal(sotho['board-not-found'], 'Boto ga se ya hwetšwa');
assert.deepEqual(tags(sotho['board-public-info']),
  ['</strong>', '<strong>']);
assert.deepEqual(tokens(
  sotho['board-open-and-move-between-remaining-and-workspaces']),
['__workspaces__']);
assert.match(sotho['enter-zoom-level'], /50-300%/);
assert.deepEqual(tokens(sotho['card-comments-title']), ['%s']);
assert.equal(sotho['cardStartVotingPopup-title'], 'Thoma go bouta');
assert.match(sotho['poker-delete-pop'], /Planning Poker/);
assert.match(sotho['exportChecklistPopup-title'], /lenaneo la go hlahloba/);
assert.equal(sotho['importCardPopup-title'], 'Tliša karata');
assert.match(sotho['restoreArchivedListToSwimlanePopup-title'],
  /tseleng ya go sesa/);
assert.match(sotho['map-to-existing-user-desc'], /ditumelelo/);
assert.match(sotho['font-preview-text'], /0123456789/);
assert.equal(sotho['changeLanguagePopup-title'], 'Fetoša leleme');
assert.match(sotho['card-aging-days'], /3/);
assert.match(sotho['close-board-pop'], /Bobolokelo/);
assert.equal(sotho['color-black'], 'ntsho');
assert.equal(sotho['color-magenta'], 'makenta');
assert.equal(sotho['color-white'], 'tšhweu');
assert.match(sotho['worker-desc'], /dikarata/);
assert.doesNotThrow(() => JSON.parse(sotho['copyManyCardsPopup-format']));
assert.equal(sotho['custom-field-number'], 'Palo');
assert.deepEqual(tokens(sotho['email-enrollAccount-text']),
  ['__url__', '__user__']);
assert.deepEqual(tokens(sotho['email-invite-text']),
  ['__board__', '__inviter__', '__url__', '__user__']);
assert.match(sotho['error-import-empty-board'], /WeKan/);
assert.equal(sotho['error-user-disabled'],
  'Akhaonto ye ya modiriši e timilwe');
assert.match(sotho['export-card-field-board-info'], /Tsela ya go sesa/);
assert.match(sotho['export-card-excel-no-disk-space'], /tisiking/);
assert.equal(sotho['filter-due-tomorrow'], 'Di swanetše gosasa');
assert.equal(sotho['filter-no-member'], 'Ga go leloko');
assert.match(sotho['advanced-filter-description'], /F1 == \/Tes\.\*\/i/);
assert.deepEqual(tokens(sotho['import-board-instruction-issues']),
  ['__endpoint__', '__sourceName__']);
assert.match(sotho['import-board-instruction-openproject'],
  /GET \/api\/v3\/work_packages/);
assert.match(sotho['import-trello-zip-too-many-files'], /\.zip/);
assert.match(sotho['trello-api-key'],
  /https:\/\/trello\.com\/app-key/);
assert.match(sotho['invalid-year'], /2026/);
assert.deepEqual(tokens(sotho['label-default']), ['%s']);
assert.equal(sotho['keyboard-shortcuts'], 'Dikgaoletšo tša khiiboto');
assert.deepEqual(tokens(sotho['leave-board-pop']), ['__boardTitle__']);
assert.match(sotho['swimlaneAddPopup-title'], /tsela ya go sesa/);
assert.equal(sotho.menu, 'Lenaneotirišo');
assert.match(sotho['normal-desc'], /dipeakanyo/);
assert.deepEqual(tokens(sotho['page-maybe-private']), ['%s']);
assert.deepEqual(tags(sotho['page-maybe-private']), ['</a>', "<a href='%s'>"]);
assert.deepEqual(tokens(sotho['remove-member-pop']),
  ['__boardTitle__', '__name__', '__username__']);
assert.equal(sotho['signupPopup-title'], 'Hlama akhaonto');
assert.match(sotho['toggle-assignees'], /1-9/);
assert.match(sotho['custom-top-left-corner-logo-height'], /27/);
assert.match(sotho['automatic-linked-url-schemes'], /URL/);
assert.equal(sotho['what-to-do'], 'O nyaka go dira eng?');

console.log('Northern Sotho translation progress checks passed.');
