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
assert.equal(Object.keys(remaining).length, 867);

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
assert.deepEqual(tokens(kurmanji['page-maybe-private']), ['%s']);
assert.deepEqual(tags(kurmanji['page-maybe-private']),
  ['</a>', "<a href='%s'>"]);
assert.match(kurmanji['public-desc'], /Google/);
assert.deepEqual(tokens(kurmanji['remove-member-pop']),
  ['__boardTitle__', '__name__', '__username__']);
assert.match(kurmanji['sandstorm-remove-member-warning'], /WeKan.*Sandstorm/);
assert.match(kurmanji['setWipLimitPopup-title'], /WIP/);
assert.match(kurmanji['search-example'], /Enter/);
assert.match(kurmanji['toggle-assignees'], /1-9/);
assert.match(kurmanji['toggle-labels'], /1-9.*1-9/);
assert.match(kurmanji['custom-top-left-corner-logo-height'], /27/);
assert.match(kurmanji['automatic-linked-url-schemes'], /URL.*URL/);
assert.equal(kurmanji['welcome-swimlane'], 'Qonaxa 1');
assert.match(kurmanji['wipLimitErrorPopup-dialog-pt1'], /WIP/);
assert.match(kurmanji['wipLimitErrorPopup-dialog-pt2'], /WIP/);
assert.match(kurmanji['attachment-transfer-limits-title'], /API/);
assert.match(kurmanji['smtp-tls-description'], /TLS.*SMTP/);
assert.deepEqual(tokens(kurmanji['email-invite-register-text']),
  ['__icode__', '__inviter__', '__url__', '__user__']);
assert.match(kurmanji['email-smtp-test-subject'], /SMTP/);
assert.equal(kurmanji['bidirectional-webhooks'], 'Webhookên du-alî');
assert.match(kurmanji.Node_version, /Node/);
assert.match(kurmanji.Meteor_version, /Meteor/);
assert.match(kurmanji.FerretDB_version, /FerretDB/);
assert.match(kurmanji.Reactivity_mode, /changeStreams.*oplog.*polling/);
assert.match(kurmanji.Reactivity_order, /METEOR_REACTIVITY_ORDER/);
assert.match(kurmanji.DDP_transport, /DDP_TRANSPORT/);
assert.match(kurmanji.OS_Cpus, /CPU.*OS/);
assert.match(kurmanji['org-domains-description'],
  /a\.example\.com.*kanban\.example\.org.*MULTITENANCY=true/);
assert.match(kurmanji['org-admins-description'], /Rêveberê seranserê malperê/);
assert.match(kurmanji['delete-board-confirm-popup'], /Veger tune/);
assert.deepEqual(tokens(kurmanji['default-subtasks-board']), ['__board__']);
assert.match(kurmanji['checklist-count-on-minicard'], /0\/0/);
assert.equal(kurmanji['parent-card'], 'Karta dêûbav');
assert.equal(kurmanji['source-board'], 'Depoya çavkanî');
assert.deepEqual(tokens(kurmanji['activity-added-label']), ['%s', '%s']);
assert.deepEqual(tokens(kurmanji['activity-set-customfield']),
  ['%s', '%s', '%s']);
assert.equal(kurmanji['r-board-rules'], 'Rêbazên depoyê');
assert.match(kurmanji['r-workflow-view'], /herikîna karê/);
assert.deepEqual(tokens(kurmanji['r-w-every-day-at']), ['__time__']);
assert.deepEqual(tokens(kurmanji['r-import-done']), ['__count__']);
assert.match(kurmanji['r-import-paste'], /JSON.*CSV.*Trello Butler/);
assert.equal(kurmanji['r-all-boards'], 'Hemû depo');
assert.match(kurmanji['r-import-workflow-note'], /n8n.*Node-RED.*WeKan/);
assert.deepEqual(tokens(kurmanji['r-import-unmapped']), ['__count__']);
assert.equal(kurmanji['r-workflow-format'], 'Şêwe');
assert.match(kurmanji['r-schedule-weekday'], /Duşem–În/);
assert.match(kurmanji['r-for-n-days'], /N rojan/);
assert.equal(kurmanji['r-trigger'], 'Destpêker');
assert.equal(kurmanji['r-action'], 'Kiryar');
assert.equal(kurmanji['r-list'], 'lîste');
assert.equal(kurmanji['r-card'], 'kart');
assert.match(kurmanji['r-unarchived'], /arşîvê vegerand/);
assert.equal(kurmanji['r-checklist'], 'lîsteya kontrolê');
assert.match(kurmanji['r-remove-all'], /Hemû endaman.*kartê/);
assert.match(kurmanji['r-d-move-to-top-gen'], /serê lîsteya wê/);
assert.equal(kurmanji['r-d-send-email'], 'E-name bişîne');
assert.equal(kurmanji['r-in-swimlane'], 'di rêçê de');
assert.equal(kurmanji['r-items-list'], 'hêman1,hêman2,hêman3');
assert.match(kurmanji['r-checklist-note'], /bêhnok veqetandî/);
assert.match(kurmanji['r-when-a-card-is-moved'], /lîsteyeke din/);
assert.match(kurmanji['custom-head-meta-tags'], /HTML/);
assert.match(kurmanji['custom-head-manifest-content'], /JSON/);
assert.match(kurmanji['custom-assetlinks-content'], /assetlinks\.json.*JSON/);
assert.deepEqual(tags(kurmanji['add-custom-html-after-body-start']), ['<body>']);
assert.deepEqual(tags(kurmanji['add-custom-html-before-body-end']), ['</body>']);
assert.match(kurmanji['oidc-button-text'], /OIDC/);
assert.deepEqual(tokens(kurmanji['act-a-dueAt']),
  ['__card__', '__timeOldValue__', '__timeValue__']);
assert.deepEqual(tokens(kurmanji['act-newDue']),
  ['__board__', '__card__', '__list__']);
assert.deepEqual(tokens(kurmanji['act-atUserComment']),
  ['__board__', '__card__', '__comment__', '__list__', '__swimlane__']);
assert.match(kurmanji['submit-on-enter'], /Enter/);
assert.match(kurmanji['submit-on-enter-description'],
  /Enter.*Shift\+Enter.*Ctrl\/Cmd\+Enter.*Enter/);
assert.match(kurmanji['open-many-cards-at-once-description'], /paceya xwe/);
assert.match(kurmanji['roles-info'], /Panela Rêveber.*rêveberên giştî/);
assert.equal(kurmanji['roles-status-role'], 'Rol');
assert.equal(kurmanji.monday, 'Duşem');
assert.equal(kurmanji.sunday, 'Yekşem');
assert.equal(kurmanji.voting, 'Dengdan');
assert.equal(kurmanji.task, 'Erk');
assert.match(kurmanji['invalid-domain'], /example\.com.*@/);
assert.match(kurmanji['shared-templates-info'], /Rêxistin.*Tîm.*e-nameyê/);
assert.equal(kurmanji['myCardsViewChange-choice-table'], 'Tablo');
assert.match(kurmanji['dueCardsViewChange-choice-all-description'], /\*Dawî\*/);
assert.match(kurmanji['globalSearchViewChange-choice-all-description'],
  /\*Kartên min\*/);
assert.deepEqual(tokens(kurmanji['swimlane-title-not-found']), ['%s']);
