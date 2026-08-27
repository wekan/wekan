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
assert.equal(Object.keys(remaining).length, 1267);

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
assert.match(ndebele.casSignIn, /CAS/);
assert.equal(ndebele['change-permissions'], 'Tshintsha izimvumo');
assert.match(ndebele['font-preview-text'], /0123456789/);
assert.equal(ndebele['font-size-largest'], 'Okukhulu kulakho konke');
assert.equal(ndebele['changeLanguagePopup-title'], 'Tshintsha ulimi');
assert.match(ndebele['card-aging-days'], /3/);
assert.equal(ndebele['color-black'], 'mnyama');
assert.equal(ndebele['color-green'], 'luhlaza');
assert.equal(ndebele['color-red'], 'bomvu');
assert.equal(ndebele['color-sky'], 'sibhakabhaka');
assert.equal(ndebele['color-white'], 'mhlophe');
assert.equal(ndebele['color-yellow'], 'phuzi');
assert.deepEqual(JSON.parse(ndebele['copyManyCardsPopup-format']).map(card =>
  Object.keys(card).sort()), [
  ['description', 'title'],
  ['description', 'title'],
  ['description', 'title'],
]);
assert.match(ndebele['custom-field-dropdown-options-placeholder'], /Enter/);
assert.match(ndebele['edit-wip-limit'], /WIP/);
assert.deepEqual(tokens(ndebele['email-enrollAccount-text']),
  ['__url__', '__user__']);
assert.deepEqual(tokens(ndebele['email-invite-text']),
  ['__board__', '__inviter__', '__url__', '__user__']);
assert.deepEqual(tokens(ndebele['email-resetPassword-text']),
  ['__url__', '__user__']);
assert.deepEqual(tokens(ndebele['email-verifyEmail-text']),
  ['__url__', '__user__']);
assert.match(ndebele['error-json-malformed'], /JSON/);
assert.match(ndebele['error-csv-schema'], /CSV.*TSV/);
assert.match(ndebele['export-card-pdf'], /PDF/);
assert.match(ndebele['export-card-excel'], /Excel/);
assert.match(ndebele['export-card-excel-no-disk-space'], /Excel.*diski/);
assert.equal(ndebele['filter-due-tomorrow'], 'Kuphela kusasa');
for (const literal of ['==', '!=', '<=', '>=', '&&', '||', '/Tes.*/i']) {
  assert.match(ndebele['advanced-filter-description'],
    new RegExp(literal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
}
assert.deepEqual(tokens(ndebele['import-board-instruction-issues']),
  ['__endpoint__', '__sourceName__']);
assert.match(ndebele['import-board-instruction-openproject'],
  /GET \/api\/v3\/work_packages/);
assert.match(ndebele['import-board-instruction-jira'],
  /GET \/rest\/api\/2\/search/);
assert.match(ndebele['import-trello-json-file-hint'], /API/);
assert.match(ndebele['trello-api-key'],
  /https:\/\/trello\.com\/app-key/);
assert.match(ndebele['trello-api-import-desc'], /Trello API/);
assert.match(ndebele['invalid-year'], /2026/);
assert.deepEqual(tokens(ndebele['label-default']), ['%s']);
assert.deepEqual(tokens(ndebele['leave-board-pop']), ['__boardTitle__']);
assert.match(ndebele['listImportCardPopup-title'], /Trello/);
assert.match(ndebele['listImportCardsTsvPopup-title'], /Excel CSV\/TSV/);
assert.equal(ndebele['my-boards'], 'Amabhodi ami');
assert.deepEqual(tokens(ndebele['page-maybe-private']), ['%s']);
assert.deepEqual(tags(ndebele['page-maybe-private']),
  ["</a>", "<a href='%s'>"]);
assert.deepEqual(tokens(ndebele['remove-member-pop']),
  ['__boardTitle__', '__name__', '__username__']);
assert.match(ndebele['sandstorm-remove-member-warning'], /Sandstorm/);
assert.match(ndebele['sandstorm-remove-member-warning'], /WeKan/);
assert.match(ndebele['search-example'], /Enter/);
assert.match(ndebele['setWipLimitPopup-title'], /WIP/);
assert.equal(ndebele['starred-boards'], 'Amabhodi afakwe inkanyezi');
assert.equal(ndebele['subscribe'], 'Bhalisa');
assert.equal(ndebele.team, 'Iqembu');
assert.equal(ndebele.upload, 'Layisha');
assert.match(ndebele['custom-help-link-url'], /URL/);
assert.match(ndebele['automatic-linked-url-schemes'], /URL/);
assert.equal(ndebele['welcome-list1'], 'Okuyisisekelo');
assert.match(ndebele['wipLimitErrorPopup-title'], /WIP/);
assert.match(ndebele['attachment-transfer-limits-title'], /API/);
assert.equal(ndebele['attachment-limits'], 'Imikhawulo');
assert.equal(ndebele.registration, 'Ukubhalisa');
assert.match(ndebele['smtp-host'], /SMTP/);
assert.match(ndebele['smtp-tls'], /TLS/);
assert.deepEqual(tokens(ndebele['email-invite-register-text']),
  ['__icode__', '__inviter__', '__url__', '__user__']);
assert.equal(ndebele.Database, 'Isizindalwazi');
assert.match(ndebele.Database_type, /sizindalwazi/);
assert.match(ndebele.FerretDB_version, /FerretDB/);
assert.match(ndebele.Reactivity_order, /METEOR_REACTIVITY_ORDER/);
assert.match(ndebele.DDP_transport, /DDP_TRANSPORT/);
assert.equal(ndebele.days, 'izinsuku');
assert.equal(ndebele.visibility, 'Ukubonakala');
assert.match(ndebele['org-domains-description'], /MULTITENANCY=true/);

console.log('Northern Ndebele translation progress checks passed.');
