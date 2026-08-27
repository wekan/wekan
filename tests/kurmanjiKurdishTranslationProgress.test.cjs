const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const fillScript = path.join(root, 'releases/translations/fill-translations.mjs');
const result = spawnSync(process.execPath, [fillScript, '--list', 'ku'], {
  cwd: root,
  encoding: 'utf8',
});
assert.equal(result.status, 0, result.stderr);
const remaining = JSON.parse(result.stdout);
assert.equal(Object.keys(remaining).length, 1467);

const english = JSON.parse(fs.readFileSync(
  path.join(root, 'imports/i18n/data/en.i18n.json'), 'utf8'));
const kurmanji = JSON.parse(fs.readFileSync(
  path.join(root, 'imports/i18n/data/ku.i18n.json'), 'utf8'));
const tokens = (value) => [...value.matchAll(
  /__[A-Za-z0-9_]+__|%[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g)]
  .map(([token]) => token).sort();
const tags = (value) => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)]
  .map(([tag]) => tag).sort();

for (const [key, value] of Object.entries(kurmanji)) {
  if (value !== english[key]) {
    assert.deepEqual(tokens(value), tokens(english[key]), key);
  }
  assert.deepEqual(tags(value), tags(english[key]), key);
}

assert.equal(kurmanji.accept, 'Bipejirîne');
assert.deepEqual(tokens(kurmanji['activity-changedTitle']), ['%s', '%s']);
assert.deepEqual(tokens(kurmanji['act-deleteCard']),
  ['__board__', '__card__', '__list__', '__swimlane__']);
assert.match(kurmanji['board-members-same-org-only'], /rêxistin/);
assert.match(kurmanji['board-members-same-team-only'], /tîm/);
assert.deepEqual(tokens(kurmanji['act-removeChecklistItem']),
  ['__board__', '__card__', '__checkList__', '__checklistItem__', '__list__',
    '__swimlane__']);
assert.deepEqual(tokens(kurmanji['act-setCustomField']),
  ['__board__', '__card__', '__customFieldValue__', '__customField__',
    '__list__', '__swimlane__']);
assert.match(kurmanji['act-archivedSwimlane'], /Rêça.*arşîvê/);
assert.deepEqual(tokens(kurmanji['act-moveCardToOtherBoard']),
  ['__board__', '__card__', '__list__', '__oldBoard__', '__oldList__',
    '__oldSwimlane__', '__swimlane__']);
assert.deepEqual(tokens(kurmanji['activity-imported']), ['%s', '%s', '%s']);
assert.deepEqual(tokens(kurmanji['activity-checked-item']), ['%s', '%s', '%s']);
assert.deepEqual(tokens(kurmanji['activity-checklist-completed-card']),
  ['__board__', '__card__', '__checklist__', '__list__', '__swimlane__']);
assert.equal(kurmanji['allboards.workspaces'], 'Cihên xebatê');
assert.match(kurmanji['allboards.edit-workspace-icon'], /markdown/);
assert.match(kurmanji['archive-permanent-delete-disabled-hint'],
  /Panela rêveber.*Rêveberê Giştî/);
assert.match(kurmanji['home-board-empty'], /yek depo/);
assert.deepEqual(tokens(kurmanji['activity-dueDate']), ['%s', '%s']);
assert.match(kurmanji['list-width-error-message'], /270/);
assert.equal(kurmanji['set-swimlane-height'],
  'Bilindahiya rêçê saz bike');
assert.match(kurmanji['keyboard-shortcuts-enabled'], /klavyeyê/);
assert.deepEqual(tokens(kurmanji['and-n-other-card']), ['__count__']);
assert.deepEqual(tokens(kurmanji['avatar-too-big']), ['__size__']);
assert.deepEqual(tokens(kurmanji['board-nb-stars']), ['%s']);
assert.deepEqual(tags(kurmanji['board-private-info']),
  ['</strong>', '<strong>']);
assert.match(kurmanji['board-private-info'], /taybet/);
assert.equal(kurmanji['public-boards'], 'Depoyên giştî');
assert.deepEqual(tags(kurmanji['board-public-info']),
  ['</strong>', '<strong>']);
assert.deepEqual(tokens(
  kurmanji['board-open-and-move-between-remaining-and-workspaces']),
['__workspaces__']);
assert.match(kurmanji['enter-zoom-level'], /50-300%/);
assert.deepEqual(tokens(kurmanji['card-comments-title']), ['%s']);
assert.match(kurmanji['swimlane-archive-suggest'], /rêç.*arşîv/);
assert.equal(kurmanji['board-view-table'], 'Tablo');
assert.match(kurmanji['vote-question'], /dengdanê/);
assert.match(kurmanji['cardStartPlanningPokerPopup-title'], /Planning Poker/);
assert.match(kurmanji['poker-delete-pop'], /Planning Poker/);
assert.equal(kurmanji['cardDependenciesPopup-title'],
  'Girêdayîbûnê zêde bike');
assert.equal(kurmanji['importSwimlanePopup-title'], 'Rêçê têxe');
assert.match(kurmanji['mapImportedMemberPopup-title'], /bikarhênerê heyî/);
assert.equal(kurmanji['restoreArchivedListToSwimlanePopup-title'],
  'Lîsteyê vegerîne rêçê');
assert.match(kurmanji.casSignIn, /CAS/);
assert.match(kurmanji['map-to-existing-user-desc'], /virtual.*destûr/);
assert.match(kurmanji['map-to-existing-user-search'], /e-nameyê/);
assert.match(kurmanji['font-preview-text'], /0123456789/);
assert.equal(kurmanji['font-size-largest'], 'Herî mezin');
assert.match(kurmanji['auto-list-width'], /Firehiya bixweber/);
assert.match(kurmanji['card-aging-days'], /3 ast/);
assert.equal(kurmanji['move-list-left'], 'Lîsteyê bibe çepê');
assert.equal(kurmanji['move-list-right'], 'Lîsteyê bibe rastê');
assert.match(kurmanji['close-board-pop'], /Arşîv/);
assert.equal(kurmanji['color-sky'], 'ezmanî');
assert.equal(kurmanji['color-darkgreen'], 'keskê tarî');
assert.equal(kurmanji['read-only'], 'Tenê xwendin');
assert.match(kurmanji['read-only-desc'], /Nikarî biguherînî/);
assert.match(kurmanji['worker-desc'], /kartan bar bikî/);
assert.match(kurmanji['confirm-move-list-to-swimlane'], /rêça din/);
assert.doesNotThrow(() => JSON.parse(kurmanji['copyManyCardsPopup-format']));
assert.match(kurmanji['copyManyCardsPopup-instructions'], /JSON/);
assert.equal(kurmanji['custom-field-number'], 'Hejmar');
assert.match(kurmanji['enable-permanent-delete-description'],
  /Rêveberên Giştî.*bi tena serê xwe/);
assert.match(kurmanji['edit-wip-limit'], /WIP/);
assert.deepEqual(tokens(kurmanji['email-enrollAccount-text']),
  ['__url__', '__user__']);
assert.deepEqual(tokens(kurmanji['email-invite-text']),
  ['__board__', '__inviter__', '__url__', '__user__']);
assert.deepEqual(tokens(kurmanji['email-verifyEmail-subject']), ['__siteName__']);
assert.match(kurmanji['error-csv-schema'], /CSV.*TSV/);
assert.match(kurmanji['error-import-empty-board'], /WeKan/);
assert.match(kurmanji['export-card-pdf'], /PDF/);
assert.match(kurmanji['export-card-excel'], /Excel/);
assert.match(kurmanji['export-card-field-board-info'], /Depo.*Lîste.*Rêç/);
assert.match(kurmanji['export-card-excel-no-disk-space'], /Excel.*dîskê/);
assert.equal(kurmanji['filter-overdue'], 'Dema wê derbasbûyî');
assert.equal(kurmanji['filter-no-member'], 'Endam tune');
assert.equal(kurmanji['filter-no-assignee'], 'Berpirs tune');
for (const operator of ['==', '!=', '<=', '>=', '&&', '||', '/Tes.*/i']) {
  assert.match(kurmanji['advanced-filter-description'],
    new RegExp(operator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
}
assert.deepEqual(tokens(kurmanji['import-board-instruction-issues']),
  ['__endpoint__', '__sourceName__']);
assert.match(kurmanji['import-board-instruction-openproject'],
  /GET \/api\/v3\/work_packages/);
assert.match(kurmanji['import-board-instruction-jira'],
  /GET \/rest\/api\/2\/search.*automationRules/);
assert.match(kurmanji['import-trello-json-file-hint'], /Trello API/);
assert.match(kurmanji['import-trello-zip-unsafe-path'], /neewle.*redkirin/);
assert.match(kurmanji['trello-api-key'],
  /https:\/\/trello\.com\/app-key/);
assert.match(kurmanji['trello-api-token'], /Trello API/);
assert.match(kurmanji['trello-cancel-delete-confirm'], /nikare vegere/);
assert.match(kurmanji['invalid-year'], /2026/);
assert.deepEqual(tokens(kurmanji['label-default']), ['%s']);
assert.deepEqual(tokens(kurmanji['leave-board-pop']), ['__boardTitle__']);
assert.match(kurmanji['list-archive-cards-pop'], /Menu.*Arşîv/);
assert.match(kurmanji['listImportCardsTsvPopup-title'], /Excel CSV\/TSV/);
assert.equal(kurmanji['no-archived-swimlanes'],
  'Di arşîvê de tu rêç tune.');
assert.equal(kurmanji.normal, 'Asayî');
assert.match(kurmanji['normal-desc'], /Nikar[eî] mîhengan biguherîne/);
