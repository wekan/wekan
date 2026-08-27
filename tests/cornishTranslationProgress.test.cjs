const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const fillScript = path.join(root, 'releases/translations/fill-translations.mjs');
const result = spawnSync(process.execPath, [fillScript, '--list', 'kw'], {
  cwd: root,
  encoding: 'utf8',
});
assert.equal(result.status, 0, result.stderr);
const remaining = JSON.parse(result.stdout);
assert.equal(Object.keys(remaining).length, 767);

const english = JSON.parse(fs.readFileSync(
  path.join(root, 'imports/i18n/data/en.i18n.json'), 'utf8'));
const cornish = JSON.parse(fs.readFileSync(
  path.join(root, 'imports/i18n/data/kw.i18n.json'), 'utf8'));
const tokens = (value) => [...value.matchAll(
  /__[A-Za-z0-9_]+__|%[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g)]
  .map(([token]) => token).sort();
const tags = (value) => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)]
  .map(([tag]) => tag).sort();

for (const [key, value] of Object.entries(cornish)) {
  if (value !== english[key]) {
    assert.deepEqual(tokens(value), tokens(english[key]), key);
  }
  assert.deepEqual(tags(value), tags(english[key]), key);
}

assert.equal(cornish.accept, 'Degemer');
assert.deepEqual(tokens(cornish['activity-changedTitle']), ['%s', '%s']);
assert.deepEqual(tokens(cornish['act-deleteCard']),
  ['__board__', '__card__', '__list__', '__swimlane__']);
assert.deepEqual(tokens(cornish['act-removeChecklistItem']),
  ['__board__', '__card__', '__checkList__', '__checklistItem__', '__list__',
    '__swimlane__']);
assert.match(cornish['act-createBoard'], /estyllen/);
assert.match(cornish['act-createCard'], /karten.*rol.*hyns.*estyllen/);
assert.match(cornish['act-addAttachment'], /stagell/);
assert.match(cornish['act-addChecklist'], /rol checkya/);
assert.match(cornish['act-addComment'], /kampoellys/);
assert.match(cornish['act-archivedBoard'], /kovskrifva/);
assert.deepEqual(tokens(cornish['act-moveCardToOtherBoard']),
  ['__board__', '__card__', '__list__', '__oldBoard__', '__oldList__',
    '__oldSwimlane__', '__swimlane__']);
assert.deepEqual(tokens(cornish['activity-added']), ['%s', '%s']);
assert.deepEqual(tokens(cornish['activity-checklist-completed-card']),
  ['__board__', '__card__', '__checklist__', '__list__', '__swimlane__']);
assert.equal(cornish['allboards.workspaces'], 'Leow ober');
assert.match(cornish['allboards.edit-workspace-icon'], /markdown/);
assert.match(cornish['archive-permanent-delete-disabled-hint'],
  /Admin Panel.*Problems.*Delete/);
assert.match(cornish['archive-permanent-delete-disabled-hint'],
  /Enable permanent delete for Global Admin/);
assert.deepEqual(tokens(cornish['activity-dueDate']), ['%s', '%s']);
assert.match(cornish['list-width-error-message'], /270/);
assert.match(cornish['set-swimlane-height-value'], /picselow/);
assert.equal(cornish['add-checklist'], 'Keworra rol checkya');
assert.equal(cornish['add-members'], 'Keworra eseli');
assert.deepEqual(tokens(cornish['and-n-other-card']), ['__count__']);
assert.deepEqual(tokens(cornish['and-n-other-card_plural']), ['__count__']);
assert.deepEqual(tokens(cornish['avatar-too-big']), ['__size__']);
assert.deepEqual(tokens(cornish['board-nb-stars']), ['%s']);
assert.deepEqual(tags(cornish['board-private-info']),
  ['</strong>', '<strong>']);
assert.match(cornish['board-private-info'], /privedh/);
assert.deepEqual(tags(cornish['board-public-info']),
  ['</strong>', '<strong>']);
assert.match(cornish['board-public-info'], /poblek/);
assert.deepEqual(tokens(
  cornish['board-open-and-move-between-remaining-and-workspaces']),
['__workspaces__']);
assert.match(cornish['enter-zoom-level'], /50-300%/);
assert.deepEqual(tokens(cornish['card-comments-title']), ['%s']);
assert.equal(cornish['card-edit-custom-fields'], 'Chanjya meys a-vusur');
assert.equal(cornish['vote-question'], 'Govynn votya');
assert.match(cornish['cardStartPlanningPokerPopup-title'], /Planning Poker/);
assert.match(cornish['editPokerEndDatePopup-title'], /Planning Poker/);
assert.equal(cornish['importDependenciesPopup-title'],
  'Ynperthi omgemmysow');
assert.equal(cornish['exportChecklistPopup-title'],
  'Esperthi rol checkya');
assert.equal(cornish['importSwimlanePopup-title'], 'Ynperthi hyns');
assert.match(cornish.casSignIn, /CAS/);
assert.equal(cornish['cardType-linkedBoard'], 'Estyllen gelmys');
assert.match(cornish['map-to-existing-user-desc'],
  /usyer gwir.*kartennow.*kampoellyansow.*gwrythres/);
assert.match(cornish['font-preview-text'], /0123456789/);
assert.equal(cornish['changeLanguagePopup-title'], 'Chanjya yeth');
assert.equal(cornish['changePermissionsPopup-title'], 'Chanjya grontyow');
assert.equal(cornish['auto-list-width'], 'Ledander awtomatek an rol');
assert.match(cornish['card-aging-days'], /3/);
assert.equal(cornish['move-card-up'], 'Gwaya karten yn-bann');
assert.equal(cornish['close-dialog'], 'Degea keskows');
assert.equal(cornish['color-indigo'], 'glas indigo');
assert.equal(cornish['color-magenta'], 'rudh magenta');
assert.equal(cornish['color-sky'], 'ebron');
assert.equal(cornish['comment-only'], 'Kampoellyans hepken');
assert.match(cornish['read-only-desc'], /Ny yll chanjya/);
assert.equal(cornish['checklistDeletePopup-title'],
  'Dilea rol checkya?');
assert.doesNotThrow(() => JSON.parse(cornish['copyManyCardsPopup-format']));
assert.match(cornish['copyManyCardsPopup-instructions'], /JSON/);
assert.equal(cornish['custom-field-currency-option'], 'Kod arghans');
assert.match(cornish['edit-wip-limit'], /WIP/);
assert.deepEqual(tokens(cornish['email-enrollAccount-text']),
  ['__url__', '__user__']);
assert.deepEqual(tokens(cornish['email-invite-text']),
  ['__board__', '__inviter__', '__url__', '__user__']);
assert.deepEqual(tokens(cornish['email-resetPassword-subject']),
  ['__siteName__']);
assert.match(cornish['error-json-schema'], /JSON/);
assert.match(cornish['error-csv-schema'], /CSV.*TSV/);
assert.match(cornish['error-import-empty-board'], /WeKan/);
assert.match(cornish['export-card-pdf'], /PDF/);
assert.match(cornish['export-card-excel-fields'], /Excel/);
assert.match(cornish['export-card-field-board-info'],
  /Estyllen.*Rol.*Hyns/);
assert.match(cornish['export-card-excel-no-disk-space'], /Excel/);
assert.equal(cornish['filter-no-due-date'], 'Dedhyas termyn vyth');
assert.equal(cornish['filter-no-member'], 'Esel vyth');
for (const operator of ['==', '!=', '<=', '>=', '&&', '||', '/Tes.*/i']) {
  assert.match(cornish['advanced-filter-description'],
    new RegExp(operator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
}
assert.deepEqual(tokens(cornish['import-board-instruction-issues']),
  ['__endpoint__', '__sourceName__']);
assert.match(cornish['import-board-instruction-openproject'],
  /OpenProject.*GET \/api\/v3\/work_packages/);
assert.match(cornish['import-board-instruction-excel'], /WeKan/);
assert.match(cornish['import-board-instruction-excel'], /\.xlsx.*Excel/);
assert.match(cornish['import-trello-json-file-hint'], /Trello API/);
assert.match(cornish['import-attachments-zip'],
  /Trello Card Attachments Downloader/);
assert.match(cornish['trello-api-key'],
  /Trello API.*https:\/\/trello\.com\/app-key/);
assert.match(cornish['trello-api-token'], /Trello API/);
assert.match(cornish['trello-cancel-delete-confirm'], /Ny yll.*distreylys/);
assert.match(cornish['invalid-year'], /2026/);
assert.deepEqual(tokens(cornish['label-default']), ['%s']);
assert.equal(cornish['keyboard-shortcuts'], 'Berrfordhow bysowek');
assert.deepEqual(tokens(cornish['leave-board-pop']), ['__boardTitle__']);
assert.match(cornish['list-archive-cards-pop'], /Rol.*Kovskrifva/);
assert.match(cornish['listImportCardsTsvPopup-title'], /Excel CSV\/TSV/);
assert.equal(cornish['no-archived-swimlanes'],
  'Hyns vyth y\'n kovskrifva.');
assert.equal(cornish.normal, 'Usadow');
assert.match(cornish['normal-desc'], /Ny yll chanjya settyansow/);
assert.deepEqual(tokens(cornish['page-maybe-private']), ['%s']);
assert.deepEqual(tags(cornish['page-maybe-private']),
  ['</a>', "<a href='%s'>"]);
assert.match(cornish['public-desc'], /Google/);
assert.deepEqual(tokens(cornish['remove-member-pop']),
  ['__boardTitle__', '__name__', '__username__']);
assert.match(cornish['sandstorm-remove-member-warning'], /WeKan.*Sandstorm/);
assert.match(cornish['setWipLimitPopup-title'], /WIP/);
assert.match(cornish['search-example'], /Enter/);
assert.match(cornish['toggle-assignees'], /1-9/);
assert.match(cornish['toggle-labels'], /1-9.*1-9/);
assert.match(cornish['custom-top-left-corner-logo-height'], /27/);
assert.match(cornish['automatic-linked-url-schemes'], /URL.*URL/);
assert.equal(cornish['welcome-swimlane'], 'Karrek ven 1');
assert.match(cornish['wipLimitErrorPopup-dialog-pt1'], /WIP/);
assert.match(cornish['wipLimitErrorPopup-dialog-pt2'], /WIP/);
assert.match(cornish['attachment-transfer-limits-title'], /API/);
assert.match(cornish['smtp-tls-description'], /TLS.*SMTP/);
assert.deepEqual(tokens(cornish['email-invite-register-text']),
  ['__icode__', '__inviter__', '__url__', '__user__']);
assert.match(cornish['email-smtp-test-subject'], /SMTP/);
assert.equal(cornish['bidirectional-webhooks'], 'Webhookow diwfordh');
assert.match(cornish.Node_version, /Node/);
assert.match(cornish.Meteor_version, /Meteor/);
assert.match(cornish.FerretDB_version, /FerretDB/);
assert.match(cornish.Reactivity_mode, /changeStreams.*oplog.*polling/);
assert.match(cornish.Reactivity_order, /METEOR_REACTIVITY_ORDER/);
assert.match(cornish.DDP_transport, /DDP_TRANSPORT/);
assert.match(cornish.OS_Cpus, /CPU.*OS/);
assert.match(cornish['org-domains-description'],
  /a\.example\.com.*kanban\.example\.org.*MULTITENANCY=true/);
assert.match(cornish['org-admins-description'], /Menystrer dre'n wias oll/);
assert.match(cornish['delete-board-confirm-popup'], /Nyns eus distrei/);
assert.deepEqual(tokens(cornish['default-subtasks-board']), ['__board__']);
assert.match(cornish['checklist-count-on-minicard'], /0\/0/);
assert.equal(cornish['parent-card'], 'Karten gerens');
assert.equal(cornish['source-board'], 'Estyllen bennfenten');
assert.deepEqual(tokens(cornish['activity-added-label']), ['%s', '%s']);
assert.deepEqual(tokens(cornish['activity-set-customfield']),
  ['%s', '%s', '%s']);
assert.equal(cornish['r-board-rules'], 'Reulayow estyllen');
assert.match(cornish['r-workflow-view'], /ros ober/);
assert.deepEqual(tokens(cornish['r-w-every-day-at']), ['__time__']);
assert.deepEqual(tokens(cornish['r-import-done']), ['__count__']);
assert.match(cornish['r-import-paste'], /JSON.*CSV.*Trello Butler/);
assert.equal(cornish['r-all-boards'], 'Pub estyllen');
assert.match(cornish['r-import-workflow-note'], /n8n.*Node-RED.*WeKan/);
assert.deepEqual(tokens(cornish['r-import-unmapped']), ['__count__']);
assert.equal(cornish['r-workflow-format'], 'Furv');
assert.match(cornish['r-schedule-weekday'], /Dy'Lun–Dy'Gwener/);
assert.match(cornish['r-for-n-days'], /N dedh/);
assert.equal(cornish['r-trigger'], 'Dallether');
assert.equal(cornish['r-action'], 'Ober');
assert.equal(cornish['r-list'], 'rol');
assert.match(cornish['r-unarchived'], /kovskrifva/);
assert.equal(cornish['r-checklist'], 'rol checkya');
assert.match(cornish['r-remove-all'], /pub esel.*garten/);
assert.match(cornish['r-d-move-to-top-gen'], /benn y rol/);
assert.equal(cornish['r-d-send-email'], 'Danvon ebost');
assert.equal(cornish['r-in-swimlane'], 'yn hyns');
assert.equal(cornish['r-items-list'], 'taklen1,taklen2,taklen3');
assert.match(cornish['r-checklist-note'], /komma/);
assert.match(cornish['r-when-a-card-is-moved'], /rol aral/);
assert.match(cornish['custom-head-meta-tags'], /HTML/);
assert.match(cornish['custom-head-manifest-content'], /JSON/);
assert.match(cornish['custom-assetlinks-content'], /assetlinks\.json.*JSON/);
assert.deepEqual(tags(cornish['add-custom-html-after-body-start']), ['<body>']);
assert.deepEqual(tags(cornish['add-custom-html-before-body-end']), ['</body>']);
assert.match(cornish['oidc-button-text'], /OIDC/);
assert.deepEqual(tokens(cornish['act-a-dueAt']),
  ['__card__', '__timeOldValue__', '__timeValue__']);
assert.deepEqual(tokens(cornish['act-newDue']),
  ['__board__', '__card__', '__list__']);
assert.deepEqual(tokens(cornish['act-atUserComment']),
  ['__board__', '__card__', '__comment__', '__list__', '__swimlane__']);
assert.match(cornish['submit-on-enter'], /Enter/);
assert.match(cornish['submit-on-enter-description'],
  /Enter.*Shift\+Enter.*Ctrl\/Cmd\+Enter.*Enter/);
assert.match(cornish['open-many-cards-at-once-description'], /fenester y honan/);
assert.match(cornish['roles-info'], /Panel Menystrer.*menystroryon oll/);
assert.equal(cornish['roles-status-role'], 'Rann');
assert.equal(cornish.monday, "Dy'Lun");
assert.equal(cornish.sunday, "Dy'Sul");
assert.equal(cornish.voting, 'Votya');
assert.equal(cornish.task, 'Oberenn');
assert.match(cornish['invalid-domain'], /example\.com.*@/);
assert.match(cornish['shared-templates-info'], /Kowethas.*Bagas.*ebost/);
assert.equal(cornish['myCardsViewChange-choice-table'], 'Tavolen');
assert.match(cornish['dueCardsViewChange-choice-all-description'],
  /\*Termyn\*/);
assert.match(cornish['globalSearchViewChange-choice-all-description'],
  /\*Ow kartennow\*/);
assert.deepEqual(tokens(cornish['n-n-of-n-cards-found']),
  ['__end__', '__start__', '__total__']);
for (const key of [
  'operator-board', 'operator-swimlane', 'operator-list', 'operator-label',
  'operator-user', 'operator-member', 'operator-assignee', 'operator-creator',
  'operator-status', 'operator-due', 'operator-created', 'operator-modified',
  'operator-sort', 'operator-comment', 'operator-has', 'operator-limit',
  'operator-debug', 'operator-org', 'operator-team', 'operator-title',
  'operator-description', 'operator-customfield', 'operator-attachment-text',
  'operator-checklist-text', 'predicate-archived', 'predicate-open',
  'predicate-ended', 'predicate-all', 'predicate-overdue', 'predicate-week',
  'predicate-month', 'predicate-quarter', 'predicate-year', 'predicate-due',
  'predicate-modified', 'predicate-created', 'predicate-attachment',
  'predicate-description', 'predicate-checklist', 'predicate-start',
  'predicate-end', 'predicate-assignee',
]) {
  assert.doesNotMatch(cornish[key], /\s/, key);
}
for (const key of [
  'predicate-member', 'predicate-public', 'predicate-private',
  'predicate-selector', 'predicate-projection',
]) {
  assert.doesNotMatch(cornish[key], /\s/, key);
}
assert.deepEqual(tokens(cornish['operator-number-expected']),
  ['__operator__', '__value__']);
assert.deepEqual(tokens(cornish['globalSearch-instructions-operator-has']), [
  '__operator_has__', '__predicate_assignee__', '__predicate_attachment__',
  '__predicate_checklist__', '__predicate_description__', '__predicate_due__',
  '__predicate_end__', '__predicate_member__', '__predicate_start__',
]);
assert.match(cornish['globalSearch-instructions-notes-2'], /\*OR\*/);
assert.match(cornish['globalSearch-instructions-notes-3'], /\*AND\*/);
