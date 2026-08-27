const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const fillScript = path.join(root,
  'releases/translations/fill-translations.mjs');
const result = spawnSync(process.execPath, [fillScript, '--list', 'mr'], {
  cwd: root,
  encoding: 'utf8',
});
assert.equal(result.status, 0, result.stderr);
const remaining = JSON.parse(result.stdout);
assert.equal(Object.keys(remaining).length, 617);

const english = JSON.parse(fs.readFileSync(
  path.join(root, 'imports/i18n/data/en.i18n.json'), 'utf8'));
const marathi = JSON.parse(fs.readFileSync(
  path.join(root, 'imports/i18n/data/mr.i18n.json'), 'utf8'));
const tokens = (value) => [...value.matchAll(
  /__[A-Za-z0-9_]+__|%[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g)]
  .map(([token]) => token).sort();
const tags = (value) => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)]
  .map(([tag]) => tag).sort();

for (const [key, value] of Object.entries(marathi)) {
  if (value !== english[key]) {
    assert.deepEqual(tokens(value), tokens(english[key]), key);
  }
  assert.deepEqual(tags(value), tags(english[key]), key);
}

assert.equal(marathi.accept, 'स्वीकारा');
assert.match(marathi.accept, /[\u0900-\u097F]/);
assert.deepEqual(tokens(marathi['activity-changedTitle']), ['%s', '%s']);
assert.deepEqual(tokens(marathi['act-deleteCard']),
  ['__board__', '__card__', '__list__', '__swimlane__']);
assert.deepEqual(tokens(marathi['act-removeChecklistItem']),
  ['__board__', '__card__', '__checkList__', '__checklistItem__', '__list__',
    '__swimlane__']);
assert.deepEqual(tokens(marathi['act-setCustomField']),
  ['__board__', '__card__', '__customFieldValue__', '__customField__',
    '__list__', '__swimlane__']);
assert.match(marathi['board-members-same-org-only'], /संस्थेतील/);
assert.match(marathi['board-members-same-team-only'], /संघातील/);
assert.deepEqual(tokens(marathi['act-moveCardToOtherBoard']),
  ['__board__', '__card__', '__list__', '__oldBoard__', '__oldList__',
    '__oldSwimlane__', '__swimlane__']);
assert.deepEqual(tokens(marathi['activity-imported']), ['%s', '%s', '%s']);
assert.deepEqual(tokens(marathi['activity-checklist-completed-card']),
  ['__board__', '__card__', '__checklist__', '__list__', '__swimlane__']);
assert.equal(marathi['allboards.workspaces'], 'कार्यस्थाने');
assert.match(marathi['allboards.edit-workspace-icon'], /markdown/);
assert.equal(marathi['workspaceActionsPopup-title'], 'कार्यस्थान सेटिंग्ज');
assert.deepEqual(tokens(marathi['activity-dueDate']), ['%s', '%s']);
assert.match(marathi['list-width-error-message'], /270/);
assert.match(marathi['set-list-width-value'], /पिक्सेल/);
assert.match(marathi['set-swimlane-height-value'], /पिक्सेल/);
assert.equal(marathi['add-checklist'], 'तपासणीसूची जोडा');
assert.deepEqual(tokens(marathi['and-n-other-card']), ['__count__']);
assert.deepEqual(tokens(marathi['and-n-other-card_plural']), ['__count__']);
assert.deepEqual(tokens(marathi['avatar-too-big']), ['__size__']);
assert.match(marathi['board-background-image-url'], /URL/);
assert.deepEqual(tokens(marathi['board-nb-stars']), ['%s']);
assert.deepEqual(tags(marathi['board-private-info']),
  ['</strong>', '<strong>']);
assert.deepEqual(tags(marathi['board-public-info']),
  ['</strong>', '<strong>']);
assert.deepEqual(tokens(
  marathi['board-open-and-move-between-remaining-and-workspaces']),
['__workspaces__']);
assert.match(marathi['enter-zoom-level'], /50-300%/);
assert.deepEqual(tokens(marathi['card-comments-title']), ['%s']);
assert.equal(marathi['card-edit-custom-fields'],
  'सानुकूल क्षेत्रे संपादित करा');
assert.match(marathi['cardStartPlanningPokerPopup-title'], /Planning Poker/);
assert.match(marathi['editPokerEndDatePopup-title'], /Planning Poker/);
assert.equal(marathi['importDependenciesPopup-title'],
  'अवलंबित्वे आयात करा');
assert.equal(marathi['exportChecklistPopup-title'],
  'तपासणीसूची निर्यात करा');
assert.equal(marathi['importSwimlanePopup-title'], 'स्विमलेन आयात करा');
assert.match(marathi.casSignIn, /CAS/);
assert.equal(marathi['cardType-linkedBoard'], 'जोडलेला फलक');
assert.match(marathi['map-to-existing-user-desc'],
  /कार्डे.*टिप्पण्या.*क्रियाकलाप/);
assert.equal(marathi['map-to-existing-user-no-results'],
  'जुळणारे वापरकर्ते सापडले नाहीत.');
assert.match(marathi['font-preview-text'], /0123456789/);
assert.equal(marathi['auto-list-width'], 'स्वयंचलित यादी रुंदी');
assert.match(marathi['card-aging-days'], /3/);
assert.equal(marathi['move-card-up'], 'कार्ड वर हलवा');
assert.equal(marathi['color-red'], 'लाल');
assert.equal(marathi['color-silver'], 'चंदेरी');
assert.equal(marathi['color-magenta'], 'मॅजेंटा');
assert.equal(marathi['color-white'], 'पांढरा');
assert.equal(marathi['read-only'], 'फक्त वाचन');
assert.equal(marathi.worker, 'कार्यकर्ता');
const bulkCardExample = JSON.parse(marathi['copyManyCardsPopup-format']);
assert.deepEqual(Object.keys(bulkCardExample[0]), ['title', 'description']);
assert.equal(marathi['custom-field-number'], 'संख्या');
assert.match(marathi['edit-wip-limit'], /WIP/);
assert.deepEqual(tokens(marathi['email-enrollAccount-text']),
  ['__url__', '__user__']);
assert.deepEqual(tokens(marathi['email-invite-text']),
  ['__board__', '__inviter__', '__url__', '__user__']);
assert.deepEqual(tokens(marathi['email-resetPassword-text']),
  ['__url__', '__user__']);
assert.match(marathi['error-json-malformed'], /JSON/);
assert.match(marathi['error-csv-schema'], /CSV.*TSV/);
assert.match(marathi['export-card-pdf'], /PDF/);
assert.match(marathi['export-card-excel'], /Excel/);
assert.match(marathi['export-card-field-board-info'],
  /फलक.*यादी.*स्विमलेन/);
assert.equal(marathi['filter-overdue'], 'मुदत उलटलेले');
assert.equal(marathi['filter-no-member'], 'सदस्य नाही');
for (const operator of ['==', '!=', '<=', '>=', '&&', '||', '/Tes.*/i']) {
  assert.match(marathi['advanced-filter-description'],
    new RegExp(operator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
}
assert.deepEqual(tokens(marathi['import-board-instruction-issues']),
  ['__endpoint__', '__sourceName__']);
assert.match(marathi['import-board-instruction-excel'], /\.xlsx/);
assert.match(marathi['import-csv-placeholder'], /CSV\/TSV/);
assert.match(marathi['import-trello-zip-file-hint'], /\.json.*\.zip/);
assert.match(marathi['trello-api-key'], /https:\/\/trello\.com\/app-key/);
assert.match(marathi['trello-api-import-desc'], /API/);
assert.match(marathi['invalid-year'], /2026/);
assert.deepEqual(tokens(marathi['label-default']), ['%s']);
assert.equal(marathi['keyboard-shortcuts'], 'कीबोर्ड शॉर्टकट');
assert.deepEqual(tokens(marathi['leave-board-pop']), ['__boardTitle__']);
assert.match(marathi['listImportCardsTsvPopup-title'], /Excel CSV\/TSV/);
assert.equal(marathi['moveCardToTop-title'], 'शीर्षस्थानी हलवा');
assert.equal(marathi['multi-selection'], 'बहु-निवड');
assert.equal(marathi['my-boards'], 'माझे फलक');
assert.deepEqual(tokens(marathi['page-maybe-private']), ['%s']);
assert.deepEqual(tags(marathi['page-maybe-private']),
  ['</a>', "<a href='%s'>"]);
assert.deepEqual(tokens(marathi['remove-member-pop']),
  ['__boardTitle__', '__name__', '__username__']);
assert.match(marathi['sandstorm-remove-member-warning'], /Sandstorm/);
assert.match(marathi['setWipLimitPopup-title'], /WIP/);
assert.match(marathi['toggle-assignees'], /1-9/);
assert.match(marathi['toggle-labels'], /1-9/);
assert.match(marathi['custom-top-left-corner-logo-height'], /27/);
assert.match(marathi['automatic-linked-url-schemes'], /URL/);
assert.match(marathi['wipLimitErrorPopup-dialog-pt1'], /WIP/);
assert.match(marathi['attachment-transfer-limits-title'], /API/);
assert.match(marathi['smtp-tls-description'], /SMTP.*TLS/);
assert.deepEqual(tokens(marathi['email-invite-register-text']),
  ['__icode__', '__inviter__', '__url__', '__user__']);
assert.match(marathi['email-smtp-test-subject'], /SMTP/);
assert.match(marathi.Node_version, /Node/);
assert.match(marathi.Meteor_version, /Meteor/);
assert.match(marathi.FerretDB_version, /FerretDB/);
assert.match(marathi.Reactivity_order, /METEOR_REACTIVITY_ORDER/);
assert.match(marathi.DDP_transport, /DDP_TRANSPORT/);
assert.match(marathi.OS_Cpus, /OS CPU/);
for (const literal of ['a.example.com', 'kanban.example.org',
  'MULTITENANCY=true']) {
  assert.match(marathi['org-domains-description'], new RegExp(literal));
}
assert.deepEqual(tokens(marathi['default-subtasks-board']), ['__board__']);
assert.match(marathi['checklist-count-on-minicard'], /0\/0/);
assert.match(marathi['checklist-count'], /0\/0/);
assert.equal(marathi['parent-card'], 'पालक कार्ड');
assert.deepEqual(tokens(marathi['activity-added-label']), ['%s', '%s']);
assert.deepEqual(tokens(marathi['activity-set-customfield']),
  ['%s', '%s', '%s']);
assert.deepEqual(tokens(marathi['r-w-every-day-at']), ['__time__']);
assert.deepEqual(tokens(marathi['r-import-done']), ['__count__']);
assert.match(marathi['r-import-paste'], /JSON.*CSV.*Trello Butler/);
assert.equal(marathi['r-all-boards'], 'सर्व फलक');
assert.match(marathi['r-import-workflow-note'], /n8n.*Node-RED.*WeKan/);
assert.deepEqual(tokens(marathi['r-import-unmapped']), ['__count__']);
assert.match(marathi['r-schedule-weekday'], /सोम–शुक्र/);
assert.match(marathi['r-for-n-days'], /N/);
assert.equal(marathi['r-unit-weeks'], 'आठवडे');
assert.equal(marathi['r-the-board'], 'फलक');
assert.equal(marathi['r-list'], 'यादी');
assert.equal(marathi['r-unarchive'], 'संग्रहातून पुनर्संचयित करा');
assert.equal(marathi['r-checklist'], 'तपासणीसूची');
assert.equal(marathi['r-d-send-email'], 'ईमेल पाठवा');
assert.match(marathi['r-items-list'], /घटक1,घटक2,घटक3/);
assert.match(marathi['r-checklist-note'], /स्वल्पविरामाने विभक्त/);
assert.match(marathi['custom-head-meta-tags'], /HTML/);
assert.match(marathi['custom-head-manifest-content'], /JSON/);
assert.match(marathi['custom-assetlinks-enabled'], /assetlinks\.json/);
assert.deepEqual(tags(marathi['add-custom-html-after-body-start']), ['<body>']);
assert.deepEqual(tags(marathi['add-custom-html-before-body-end']), ['</body>']);
assert.match(marathi['oidc-button-text'], /OIDC/);
assert.deepEqual(tokens(marathi['act-a-dueAt']),
  ['__card__', '__timeOldValue__', '__timeValue__']);
assert.deepEqual(tokens(marathi['act-atUserComment']),
  ['__board__', '__card__', '__comment__', '__list__', '__swimlane__']);
for (const literal of ['Enter', 'Shift+Enter', 'Ctrl/Cmd+Enter']) {
  assert.ok(marathi['submit-on-enter-description'].includes(literal));
}
assert.equal(marathi['roles-status-role'], 'भूमिका');
assert.equal(marathi.monday, 'सोमवार');
assert.equal(marathi.sunday, 'रविवार');
assert.match(marathi['invalid-domain'], /example\.com/);
assert.equal(marathi['globalSearchViewChange-choice-me'], 'माझी कार्डे');
for (const key of ['board-title-not-found', 'swimlane-title-not-found',
  'list-title-not-found', 'label-not-found', 'label-color-not-found']) {
  assert.deepEqual(tokens(marathi[key]), ['%s']);
}
assert.deepEqual(tokens(marathi['n-n-of-n-cards-found']),
  ['__end__', '__start__', '__total__']);
assert.equal(marathi['operator-board'], 'फलक');
assert.equal(marathi['operator-customfield'], 'सानुकूल क्षेत्र');
assert.equal(marathi['predicate-overdue'], 'मुदत उलटलेले');
assert.equal(marathi['predicate-quarter'], 'तिमाही');
assert.deepEqual(tokens(marathi['operator-number-expected']),
  ['__operator__', '__value__']);
assert.deepEqual(tokens(marathi['globalSearch-instructions-operator-has']),
  ['__operator_has__', '__predicate_assignee__', '__predicate_attachment__',
    '__predicate_checklist__', '__predicate_description__', '__predicate_due__',
    '__predicate_end__', '__predicate_member__', '__predicate_start__']);
assert.deepEqual(tokens(marathi['globalSearch-instructions-notes-3-2']),
  ['__predicate_month__', '__predicate_quarter__', '__predicate_week__',
    '__predicate_year__']);
assert.match(marathi['sort-boards-title-asc'], /A → Z/);
assert.match(marathi['import-dependencies-file'], /JSON.*SVG/);
assert.deepEqual(tokens(marathi['import-dependencies-done']),
  ['__imported__', '__unmatched__']);
assert.deepEqual(tokens(marathi['background-too-big']), ['{{size}}']);
assert.equal(marathi.location, 'स्थान');
assert.ok(marathi['server-error-troubleshooting'].includes(
  'sudo snap logs wekan.wekan'));
assert.ok(marathi['server-error-troubleshooting'].includes(
  'sudo docker logs wekan-app'));
assert.deepEqual(tokens(marathi['custom-field-stringtemplate-format']),
  ['%{value}']);
assert.match(marathi['custom-field-stringtemplate-separator'], /&#32;.*&nbsp;/);
assert.match(marathi['office-report-desc'], /IPv4.*IPv6/);
assert.match(marathi['api-report-desc'], /REST API/);
assert.match(marathi['api-no-calls'], /WITH_API=true/);
assert.match(marathi['recovery-report-desc'], /MongoDB/);
assert.match(marathi['Cube-Grid'], /Cube-Grid/);
assert.match(marathi['carbon-copy'], /Cc:/);

console.log('Marathi translation progress checks passed.');
