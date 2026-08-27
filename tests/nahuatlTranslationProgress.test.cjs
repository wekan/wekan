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
assert.equal(Object.keys(remaining).length, 417);

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
assert.deepEqual(tokens(nahuatl['leave-board-pop']), ['__boardTitle__']);
assert.match(nahuatl['listImportCardPopup-title'], /Trello/);
assert.match(nahuatl['listImportCardsTsvPopup-title'], /Excel CSV\/TSV/);
assert.equal(nahuatl['my-boards'], 'Nohuapaltin');
assert.deepEqual(tokens(nahuatl['page-maybe-private']), ['%s']);
assert.deepEqual(tags(nahuatl['page-maybe-private']),
  ["</a>", "<a href='%s'>"]);
assert.deepEqual(tokens(nahuatl['remove-member-pop']),
  ['__boardTitle__', '__name__', '__username__']);
assert.match(nahuatl['sandstorm-remove-member-warning'], /Sandstorm/);
assert.match(nahuatl['sandstorm-remove-member-warning'], /WeKan/);
assert.match(nahuatl['search-example'], /Enter/);
assert.match(nahuatl['setWipLimitPopup-title'], /WIP/);
assert.match(nahuatl['toggle-assignees'], /1-9/);
assert.match(nahuatl['toggle-labels'], /1-9/);
assert.match(nahuatl['custom-top-left-corner-logo-image-url'], /URL/);
assert.match(nahuatl['custom-top-left-corner-logo-height'], /27/);
assert.match(nahuatl['automatic-linked-url-schemes'], /URL/);
assert.match(nahuatl['wipLimitErrorPopup-dialog-pt1'], /WIP/);
assert.match(nahuatl['attachment-transfer-limits-title'], /API/);
assert.match(nahuatl['smtp-tls-description'], /TLS.*SMTP/);
assert.deepEqual(tokens(nahuatl['email-invite-register-text']),
  ['__icode__', '__inviter__', '__url__', '__user__']);
assert.match(nahuatl['email-smtp-test-subject'], /SMTP/);
assert.match(nahuatl.Node_version, /Node/);
assert.match(nahuatl.Meteor_version, /Meteor/);
assert.match(nahuatl.FerretDB_version, /FerretDB/);
assert.match(nahuatl.Reactivity_mode, /changeStreams.*oplog.*polling/);
assert.match(nahuatl.Reactivity_order, /METEOR_REACTIVITY_ORDER/);
assert.match(nahuatl.DDP_transport, /DDP_TRANSPORT/);
assert.match(nahuatl['org-domains-description'], /a\.example\.com/);
assert.match(nahuatl['org-domains-description'], /kanban\.example\.org/);
assert.match(nahuatl['org-domains-description'], /MULTITENANCY=true/);
assert.deepEqual(tokens(nahuatl['default-subtasks-board']), ['__board__']);
assert.match(nahuatl['checklist-count-on-minicard'], /0\/0/);
assert.match(nahuatl['checklist-count'], /0\/0/);
assert.deepEqual(tokens(nahuatl['activity-added-label']), ['%s', '%s']);
assert.equal(nahuatl['parent-card'], 'Tetah amatlapalli');
assert.deepEqual(tokens(nahuatl['activity-set-customfield']),
  ['%s', '%s', '%s']);
assert.deepEqual(tokens(nahuatl['r-w-every-day-at']), ['__time__']);
assert.deepEqual(tokens(nahuatl['r-import-done']), ['__count__']);
assert.match(nahuatl['r-import-paste'], /JSON.*CSV.*Trello Butler/);
assert.match(nahuatl['r-import-workflow-note'], /n8n.*Node-RED.*WeKan/);
assert.deepEqual(tokens(nahuatl['r-import-unmapped']), ['__count__']);
assert.match(nahuatl['r-schedule-weekday'], /Lunes–Viernes/);
assert.match(nahuatl['r-for-n-days'], /N/);
assert.equal(nahuatl['r-the-board'], 'in huapalli');
assert.equal(nahuatl['r-list'], 'tocatlahtolli');
assert.equal(nahuatl['r-card'], 'amatlapalli');
assert.equal(nahuatl['r-label'], 'machiotl');
assert.equal(nahuatl['r-member'], 'tlacatl');
assert.equal(nahuatl['r-items-list'].split(',').length, 3);
assert.match(nahuatl['custom-head-meta-tags'], /HTML/);
assert.match(nahuatl['custom-head-link-tags'], /HTML/);
assert.match(nahuatl['custom-head-manifest-content'], /JSON/);
assert.match(nahuatl['custom-assetlinks-enabled'], /assetlinks\.json/);
assert.match(nahuatl['custom-assetlinks-content'], /assetlinks\.json.*JSON/);
assert.deepEqual(tags(nahuatl['add-custom-html-after-body-start']), ['<body>']);
assert.deepEqual(tags(nahuatl['add-custom-html-before-body-end']), ['</body>']);
assert.match(nahuatl['oidc-button-text'], /OIDC/);
assert.deepEqual(tokens(nahuatl['act-a-dueAt']),
  ['__card__', '__timeOldValue__', '__timeValue__']);
assert.deepEqual(tokens(nahuatl['act-newDue']),
  ['__board__', '__card__', '__list__']);
assert.deepEqual(tokens(nahuatl['act-atUserComment']),
  ['__board__', '__card__', '__comment__', '__list__', '__swimlane__']);
assert.match(nahuatl['submit-on-enter'], /Enter/);
assert.match(nahuatl['submit-on-enter-description'],
  /Enter.*Shift\+Enter.*Ctrl\/Cmd\+Enter/);
assert.equal(nahuatl['editOrgPopup-title'], 'Xicpatla nechicoliztli');
assert.equal(nahuatl['editTeamPopup-title'], 'Xicpatla tlanechicolli');
assert.equal(nahuatl.monday, 'Lunes');
assert.equal(nahuatl.sunday, 'Domingo');
assert.match(nahuatl['invalid-domain'], /example\.com.*@/);
assert.equal(nahuatl.domain, 'Tlalnemachiyotl');
assert.deepEqual(tokens(nahuatl['board-title-not-found']), ['%s']);
assert.deepEqual(tokens(nahuatl['swimlane-title-not-found']), ['%s']);
assert.deepEqual(tokens(nahuatl['list-title-not-found']), ['%s']);
assert.deepEqual(tokens(nahuatl['label-not-found']), ['%s']);
assert.deepEqual(tokens(nahuatl['user-username-not-found']), ['%s']);
assert.deepEqual(tokens(nahuatl['n-n-of-n-cards-found']),
  ['__end__', '__start__', '__total__']);
assert.equal(nahuatl['operator-board'], 'huapalli');
assert.equal(nahuatl['predicate-overdue'], 'panoc');
assert.deepEqual(tokens(nahuatl['operator-number-expected']),
  ['__operator__', '__value__']);
assert.deepEqual(tokens(nahuatl['globalSearch-instructions-operator-has']),
  tokens(english['globalSearch-instructions-operator-has']));
assert.match(nahuatl['globalSearch-instructions-heading'], /Temoliztli/);
assert.deepEqual(tokens(nahuatl['import-dependencies-done']),
  ['__imported__', '__unmatched__']);
assert.deepEqual(tokens(nahuatl['background-too-big']), ['{{size}}']);
assert.equal(nahuatl['card-dependencies'], 'Tlaneltoquiliztin');
assert.equal(nahuatl.location, 'Canin');
assert.deepEqual(tokens(nahuatl['custom-field-stringtemplate-format']),
  ['%{value}']);
assert.match(nahuatl['server-error-troubleshooting'],
  /sudo snap logs wekan\.wekan/);
assert.match(nahuatl['server-error-troubleshooting'],
  /sudo docker logs wekan-app/);
assert.match(nahuatl['office-report-desc'], /IPv4.*IPv6/);
assert.match(nahuatl['api-report-desc'], /REST API/);
assert.match(nahuatl['api-no-calls'], /WITH_API=true/);
assert.match(nahuatl['recovery-report-desc'], /MongoDB/);
assert.equal(nahuatl['copy-swimlane'], 'Xiccopina ohtli');
assert.equal(nahuatl.ticket, 'Tlapalehuilamatl');
assert.match(nahuatl['email-domain-allowed-to-invite'], /correo/i);
for (const key of [
  'Node_heap_total_heap_size',
  'Node_memory_usage_rss',
]) assert.match(nahuatl[key], /Node/);
assert.match(nahuatl['custom-legal-notice-link-url'], /URL/);
assert.equal(nahuatl.moveChecklist,
  'Xicmijcueni tlanextiliztocatlahtolli');
assert.match(nahuatl['attachment-move-storage-gridfs'], /GridFS/);
assert.match(nahuatl['attachment-move-storage-s3'], /S3/);
assert.match(nahuatl['attachment-repair-locations-description'],
  /GridFS/);
assert.match(nahuatl['move-all-attachments-of-board-to-s3'], /S3/);
assert.match(nahuatl['mongodb-compact-description'], /MongoDB GridFS/);
assert.match(nahuatl['mongodb-compact-warning'], /replica sets.*oplog.*Meteor/);
assert.match(nahuatl['mongodb-compact-run'], /MongoDB Compact/);
assert.deepEqual(tokens(nahuatl['drag-board-to-workspace']),
  ['__workspaces__']);
assert.match(nahuatl['preview-pdf-not-supported'], /PDF/);
assert.match(nahuatl['show-week-of-year'], /ISO 8601/);
assert.match(nahuatl['import-board-zip'], /.zip.*JSON/);
assert.equal(nahuatl.support, 'Tlapalehuiliztli');
assert.match(nahuatl['accounts-lockout-info'], /calaquiliztli/);
assert.match(nahuatl['accounts-lockout-period'], /segundos/);
assert.match(nahuatl['accounts-lockout-failure-window'], /segundos/);
assert.equal(nahuatl['accounts-lockout-unlock-all'],
  'Xiquintlapo mochtin');
assert.equal(nahuatl['cron-migrations'], 'Tlanahuatilli mijcueniliztin');

console.log('Nahuatl translation progress checks passed.');
