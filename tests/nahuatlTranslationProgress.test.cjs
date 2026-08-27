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
assert.equal(Object.keys(remaining).length, 1517);

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
assert.deepEqual(tokens(nahuatl['and-n-other-card']), ['__count__']);
assert.deepEqual(tokens(nahuatl['and-n-other-card_plural']), ['__count__']);
assert.deepEqual(tokens(nahuatl['avatar-too-big']), ['__size__']);
assert.match(nahuatl['board-background-image-url'], /URL/);
assert.deepEqual(tokens(nahuatl['board-nb-stars']), ['%s']);
assert.deepEqual(tags(nahuatl['board-private-info']),
  ['</strong>', '<strong>']);
assert.deepEqual(tags(nahuatl['board-public-info']),
  ['</strong>', '<strong>']);
assert.deepEqual(tokens(
  nahuatl['board-open-and-move-between-remaining-and-workspaces']),
['__workspaces__']);
assert.match(nahuatl['enter-zoom-level'], /50-300%/);
assert.deepEqual(tokens(nahuatl['card-comments-title']), ['%s']);
assert.equal(nahuatl['card-edit-custom-fields'],
  'Xiquinpatla monemac tlaltin');
assert.match(nahuatl['cardStartPlanningPokerPopup-title'], /Planning Poker/);
assert.match(nahuatl['editPokerEndDatePopup-title'], /Planning Poker/);
assert.equal(nahuatl['importDependenciesPopup-title'],
  'Xiquincalaqui tlaneltoquiliztin');
assert.equal(nahuatl['addBoardOrgPopup-title'],
  'Xicaquiti nechicoliztli');
assert.equal(nahuatl['addBoardTeamPopup-title'],
  'Xicaquiti tlanechicolli');
assert.match(nahuatl.casSignIn, /CAS/);
assert.equal(nahuatl['change-permissions'], 'Xicpatla cahuiliztin');
assert.match(nahuatl['font-preview-text'], /0123456789/);
assert.equal(nahuatl['font-size-largest'], 'Cenca hueyi');
assert.match(nahuatl['card-aging-days'], /3/);
assert.equal(nahuatl['color-black'], 'tliltic');
assert.equal(nahuatl['color-green'], 'xoxoctic');
assert.equal(nahuatl['color-red'], 'chichiltic');
assert.equal(nahuatl['color-sky'], 'ilhuicac texotictic');
assert.equal(nahuatl['color-white'], 'iztac');
assert.equal(nahuatl['color-yellow'], 'coztic');
assert.deepEqual(JSON.parse(nahuatl['copyManyCardsPopup-format']).map(card =>
  Object.keys(card).sort()), [
  ['description', 'title'],
  ['description', 'title'],
  ['description', 'title'],
]);
assert.match(nahuatl['custom-field-dropdown-options-placeholder'], /Enter/);
assert.match(nahuatl['edit-wip-limit'], /WIP/);
assert.deepEqual(tokens(nahuatl['email-enrollAccount-text']),
  ['__url__', '__user__']);
assert.deepEqual(tokens(nahuatl['email-invite-text']),
  ['__board__', '__inviter__', '__url__', '__user__']);
assert.deepEqual(tokens(nahuatl['email-resetPassword-text']),
  ['__url__', '__user__']);
assert.deepEqual(tokens(nahuatl['email-verifyEmail-text']),
  ['__url__', '__user__']);
assert.match(nahuatl['error-json-malformed'], /JSON/);
assert.match(nahuatl['error-csv-schema'], /CSV.*TSV/);
assert.match(nahuatl['export-card-pdf'], /PDF/);
assert.match(nahuatl['export-card-excel'], /Excel/);
assert.match(nahuatl['export-card-excel-no-disk-space'], /Excel.*disk/);
assert.equal(nahuatl['filter-due-tomorrow'], 'Tlamiz moztla');
for (const literal of ['==', '!=', '<=', '>=', '&&', '||', '/Tes.*/i']) {
  assert.match(nahuatl['advanced-filter-description'],
    new RegExp(literal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
}
assert.deepEqual(tokens(nahuatl['import-board-instruction-issues']),
  ['__endpoint__', '__sourceName__']);
assert.match(nahuatl['import-board-instruction-openproject'],
  /GET \/api\/v3\/work_packages/);
assert.match(nahuatl['import-board-instruction-jira'],
  /GET \/rest\/api\/2\/search/);
assert.match(nahuatl['import-trello-json-file-hint'], /API key.*token/);
assert.match(nahuatl['trello-api-key'],
  /https:\/\/trello\.com\/app-key/);
assert.match(nahuatl['trello-api-import-desc'], /API key.*token/);
assert.match(nahuatl['invalid-year'], /2026/);
assert.deepEqual(tokens(nahuatl['label-default']), ['%s']);

console.log('Nahuatl translation progress checks passed.');
