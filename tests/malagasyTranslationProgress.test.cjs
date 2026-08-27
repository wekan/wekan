const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const fillScript = path.join(root, 'releases/translations/fill-translations.mjs');
const result = spawnSync(process.execPath, [fillScript, '--list', 'mg'], {
  cwd: root,
  encoding: 'utf8',
});
assert.equal(result.status, 0, result.stderr);
const remaining = JSON.parse(result.stdout);
assert.equal(Object.keys(remaining).length, 1467);

const english = JSON.parse(fs.readFileSync(
  path.join(root, 'imports/i18n/data/en.i18n.json'), 'utf8'));
const malagasy = JSON.parse(fs.readFileSync(
  path.join(root, 'imports/i18n/data/mg.i18n.json'), 'utf8'));
const tokens = (value) => [...value.matchAll(
  /__[A-Za-z0-9_]+__|%[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g)]
  .map(([token]) => token).sort();
const tags = (value) => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)]
  .map(([tag]) => tag).sort();

for (const [key, value] of Object.entries(malagasy)) {
  if (value !== english[key]) {
    assert.deepEqual(tokens(value), tokens(english[key]), key);
  }
  assert.deepEqual(tags(value), tags(english[key]), key);
}

assert.equal(malagasy.accept, 'Ekeo');
assert.deepEqual(tokens(malagasy['activity-changedTitle']), ['%s', '%s']);
assert.deepEqual(tokens(malagasy['act-deleteCard']),
  ['__board__', '__card__', '__list__', '__swimlane__']);
assert.match(malagasy['board-members-same-org-only'], /fikambanana/);
assert.match(malagasy['board-members-same-team-only'], /ekipa/);
assert.deepEqual(tokens(malagasy['due-date-changed-times']), ['%s']);
assert.deepEqual(tokens(malagasy['act-removeChecklistItem']),
  ['__board__', '__card__', '__checkList__', '__checklistItem__', '__list__',
    '__swimlane__']);
assert.match(malagasy['act-addAttachment'], /rakitra/);
assert.match(malagasy['act-addChecklist'], /lisitra fanamarinana/);
assert.match(malagasy['act-createCustomField'], /saha namboarina/);
assert.match(malagasy['act-archivedBoard'], /arisiva/);
assert.deepEqual(tokens(malagasy['act-moveCardToOtherBoard']),
  ['__board__', '__card__', '__list__', '__oldBoard__', '__oldList__',
    '__oldSwimlane__', '__swimlane__']);
assert.deepEqual(tokens(malagasy['activity-imported']), ['%s', '%s', '%s']);
assert.deepEqual(tokens(malagasy['activity-checklist-completed-card']),
  ['__board__', '__card__', '__checklist__', '__list__', '__swimlane__']);
assert.equal(malagasy['allboards.workspaces'], 'Toeram-piasana');
assert.match(malagasy['allboards.edit-workspace-icon'], /markdown/);
assert.equal(malagasy['workspaceActionsPopup-title'],
  'Fikirana toeram-piasana');
assert.deepEqual(tokens(malagasy['activity-dueDate']), ['%s', '%s']);
assert.match(malagasy['list-width-error-message'], /270/);
assert.match(malagasy['set-list-width-value'], /piksel/);
assert.match(malagasy['set-swimlane-height-value'], /piksel/);
assert.equal(malagasy['add-checklist'], 'Ampio lisitra fanamarinana');
assert.deepEqual(tokens(malagasy['and-n-other-card']), ['__count__']);
assert.deepEqual(tokens(malagasy['and-n-other-card_plural']), ['__count__']);
assert.deepEqual(tokens(malagasy['avatar-too-big']), ['__size__']);
assert.match(malagasy['board-background-image-url'], /URL/);
assert.deepEqual(tokens(malagasy['board-nb-stars']), ['%s']);
assert.deepEqual(tags(malagasy['board-private-info']),
  ['</strong>', '<strong>']);
assert.deepEqual(tags(malagasy['board-public-info']),
  ['</strong>', '<strong>']);
assert.deepEqual(tokens(
  malagasy['board-open-and-move-between-remaining-and-workspaces']),
['__workspaces__']);
assert.match(malagasy['enter-zoom-level'], /50-300%/);
assert.deepEqual(tokens(malagasy['card-comments-title']), ['%s']);
assert.equal(malagasy['card-edit-custom-fields'],
  'Ovay ny saha namboarina');
assert.match(malagasy['cardStartPlanningPokerPopup-title'], /Planning Poker/);
assert.match(malagasy['editPokerEndDatePopup-title'], /Planning Poker/);
assert.equal(malagasy['importDependenciesPopup-title'],
  'Manafatra fiankinana');
assert.equal(malagasy['exportChecklistPopup-title'],
  'Manondrana lisitra fanamarinana');
assert.equal(malagasy['importSwimlanePopup-title'], 'Manafatra lalana');
assert.match(malagasy.casSignIn, /CAS/);
assert.equal(malagasy['cardType-linkedBoard'], 'Solaitra mifandray');
assert.match(malagasy['map-to-existing-user-desc'],
  /karatra.*fanamarihana.*hetsika/);
assert.equal(malagasy['map-to-existing-user-no-results'],
  'Tsy nahitana mpampiasa mifanaraka.');
assert.match(malagasy['font-preview-text'], /0123456789/);
assert.equal(malagasy['auto-list-width'],
  "Sakan'ny lisitra mandeha ho azy");
assert.match(malagasy['card-aging-days'], /3/);
assert.equal(malagasy['move-card-up'], 'Afindrao miakatra ny karatra');
assert.equal(malagasy['color-red'], 'mena');
assert.equal(malagasy['color-silver'], 'volafotsy');
assert.equal(malagasy['color-magenta'], 'mena volomparasy');
assert.equal(malagasy['color-white'], 'fotsy');
assert.equal(malagasy['read-only'], 'Vakiana ihany');
assert.equal(malagasy.worker, 'Mpiasa');
const bulkCardExample = JSON.parse(malagasy['copyManyCardsPopup-format']);
assert.deepEqual(Object.keys(bulkCardExample[0]), ['title', 'description']);
assert.equal(malagasy['custom-field-number'], 'Isa');
assert.match(malagasy['edit-wip-limit'], /WIP/);
assert.deepEqual(tokens(malagasy['email-enrollAccount-text']),
  ['__url__', '__user__']);
assert.deepEqual(tokens(malagasy['email-invite-text']),
  ['__board__', '__inviter__', '__url__', '__user__']);
assert.deepEqual(tokens(malagasy['email-verifyEmail-text']),
  ['__url__', '__user__']);
assert.match(malagasy['error-import-empty-board'], /WeKan/);
assert.equal(malagasy['export-card-pdf'], 'Manondrana karatra ho PDF');
assert.match(malagasy['export-card-excel-fields'], /Excel/);
assert.match(malagasy['export-card-excel-no-disk-space'], /Excel/);
assert.equal(malagasy['filter-due-tomorrow'], 'Voatondro rahampitso');
assert.equal(malagasy['filter-no-member'], 'Tsy misy mpikambana');
assert.match(malagasy['advanced-filter-description'],
  /== != <= >= && \|\| \( \).*Field1 == Value1.*'Field 1' == 'Value 1'.*Field1 == I\\'m.*F1 == V1 \|\| F1 == V2.*F1 == \/Tes\.\*\/i/);
assert.deepEqual(tokens(malagasy['import-board-instruction-issues']),
  ['__endpoint__', '__sourceName__']);
assert.match(malagasy['import-board-instruction-openproject'],
  /GET \/api\/v3\/work_packages/);
assert.match(malagasy['import-board-instruction-jira'],
  /GET \/rest\/api\/2\/search.*automationRules/);
assert.match(malagasy['import-excel-file'], /.xlsx/);
assert.match(malagasy['trello-api-key'],
  /https:\/\/trello\.com\/app-key/);
assert.match(malagasy['trello-api-import-desc'], /Trello API/);
assert.match(malagasy['invalid-year'], /2026/);
assert.deepEqual(tokens(malagasy['label-default']), ['%s']);
assert.deepEqual(tokens(malagasy['leave-board-pop']), ['__boardTitle__']);
assert.match(malagasy['listImportCardPopup-title'], /Trello/);
assert.match(malagasy['listImportCardsTsvPopup-title'], /Excel CSV\/TSV/);
assert.equal(malagasy.normal, 'Mahazatra');
assert.equal(malagasy['multi-selection'], 'Safidy maro');
