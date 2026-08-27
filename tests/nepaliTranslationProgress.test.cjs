'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const result = spawnSync(process.execPath,
  [path.join(root, 'releases/translations/fill-translations.mjs'),
    '--list', 'ne'], { cwd: root, encoding: 'utf8' });
assert.equal(result.status, 0, result.stderr);
assert.equal(Object.keys(JSON.parse(result.stdout)).length, 767);

const english = JSON.parse(fs.readFileSync(
  path.join(root, 'imports/i18n/data/en.i18n.json'), 'utf8'));
const nepali = JSON.parse(fs.readFileSync(
  path.join(root, 'imports/i18n/data/ne.i18n.json'), 'utf8'));
const tokens = value => [...value.matchAll(
  /__[A-Za-z0-9_]+__|%[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g)]
  .map(([token]) => token).sort();
const tags = value => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)]
  .map(([tag]) => tag).sort();

for (const [key, value] of Object.entries(nepali)) {
  assert.deepEqual(tokens(value), tokens(english[key]), key);
  assert.deepEqual(tags(value), tags(english[key]), key);
}

assert.equal(nepali.accept, 'स्वीकार गर्नुहोस्');
assert.deepEqual(tokens(nepali['activity-changedTitle']), ['%s', '%s']);
assert.deepEqual(tokens(nepali['act-deleteCard']),
  ['__board__', '__card__', '__list__', '__swimlane__']);
assert.deepEqual(tokens(nepali['act-removeChecklistItem']),
  ['__board__', '__card__', '__checkList__', '__checklistItem__', '__list__',
    '__swimlane__']);
assert.deepEqual(tokens(nepali['act-setCustomField']),
  ['__board__', '__card__', '__customFieldValue__', '__customField__',
    '__list__', '__swimlane__']);
assert.match(nepali['act-createBoard'], /बोर्ड/);
assert.match(nepali['act-createCard'], /कार्ड/);
assert.match(nepali['act-addChecklist'], /जाँचसूची/);
assert.match(nepali['act-addAttachment'], /संलग्नक/);
assert.deepEqual(tokens(nepali['act-moveCardToOtherBoard']),
  ['__board__', '__card__', '__list__', '__oldBoard__', '__oldList__',
    '__oldSwimlane__', '__swimlane__']);
assert.deepEqual(tokens(nepali['activity-imported']), ['%s', '%s', '%s']);
assert.deepEqual(tokens(nepali['activity-checklist-completed-card']),
  ['__board__', '__card__', '__checklist__', '__list__', '__swimlane__']);
assert.equal(nepali['allboards.workspaces'], 'कार्यस्थानहरू');
assert.match(nepali['allboards.edit-workspace-icon'], /markdown/);
assert.deepEqual(tokens(nepali['activity-dueDate']), ['%s', '%s']);
assert.match(nepali['set-list-width-value'], /पिक्सेल/);
assert.match(nepali['list-width-error-message'], /270/);
assert.match(nepali['set-swimlane-height-value'], /पिक्सेल/);
assert.equal(nepali['add-checklist'], 'जाँचसूची थप्नुहोस्');
assert.deepEqual(tokens(nepali['and-n-other-card']), ['__count__']);
assert.deepEqual(tokens(nepali['and-n-other-card_plural']), ['__count__']);
assert.deepEqual(tokens(nepali['avatar-too-big']), ['__size__']);
assert.match(nepali['board-background-image-url'], /URL/);
assert.deepEqual(tokens(nepali['board-nb-stars']), ['%s']);
assert.deepEqual(tags(nepali['board-private-info']),
  ['</strong>', '<strong>']);
assert.deepEqual(tags(nepali['board-public-info']),
  ['</strong>', '<strong>']);
assert.deepEqual(tokens(nepali[
  'board-open-and-move-between-remaining-and-workspaces']), ['__workspaces__']);
assert.match(nepali['enter-zoom-level'], /50-300%/);
assert.deepEqual(tokens(nepali['card-comments-title']), ['%s']);
assert.equal(nepali['vote-question'], 'मतदानको प्रश्न');
assert.match(nepali['cardStartPlanningPokerPopup-title'], /प्लानिङ पोकर/);
assert.equal(nepali['cardDependenciesPopup-title'], 'निर्भरता थप्नुहोस्');
assert.equal(nepali['importCardPopup-title'], 'कार्ड आयात गर्नुहोस्');
assert.match(nepali.casSignIn, /CAS/);
assert.match(nepali['font-preview-text'], /0123456789/);
assert.equal(nepali['change-permissions'], 'अनुमतिहरू परिवर्तन गर्नुहोस्');
assert.equal(nepali['changeLanguagePopup-title'], 'भाषा परिवर्तन गर्नुहोस्');
assert.match(nepali['card-aging-days'], /3/);
assert.match(nepali['card-aging-tier1'], /1/);
assert.match(nepali['card-aging-tier2'], /2/);
assert.match(nepali['card-aging-tier3'], /3/);
assert.equal(nepali['color-blue'], 'निलो');
assert.equal(nepali['color-red'], 'रातो');
assert.equal(nepali['color-white'], 'सेतो');
assert.equal(nepali['color-yellow'], 'पहेंलो');
assert.match(nepali['copyManyCardsPopup-instructions'], /JSON/);
const cardCopyExample = JSON.parse(nepali['copyManyCardsPopup-format']);
assert.equal(cardCopyExample.length, 3);
assert.deepEqual(Object.keys(cardCopyExample[0]), ['title', 'description']);
assert.equal(nepali['custom-field-currency-option'], 'मुद्रा कोड');
assert.match(nepali['edit-wip-limit'], /WIP/);
assert.deepEqual(tokens(nepali['email-enrollAccount-text']),
  ['__url__', '__user__']);
assert.deepEqual(tokens(nepali['email-invite-text']),
  ['__board__', '__inviter__', '__url__', '__user__']);
assert.deepEqual(tokens(nepali['email-resetPassword-text']),
  ['__url__', '__user__']);
assert.deepEqual(tokens(nepali['email-verifyEmail-text']),
  ['__url__', '__user__']);
assert.match(nepali['error-json-malformed'], /JSON/);
assert.match(nepali['error-csv-schema'], /CSV.*TSV/);
assert.match(nepali['error-import-empty-board'], /WeKan/);
assert.match(nepali['export-card-pdf'], /PDF/);
assert.match(nepali['export-card-excel'], /Excel/);
assert.match(nepali['export-card-excel-no-disk-space'], /Excel/);
assert.equal(nepali['filter-overdue'], 'म्याद नाघेको');
assert.equal(nepali['filter-no-member'], 'सदस्य छैन');
assert.match(nepali['advanced-filter-description'],
  /==.*!=.*<=.*>=.*&&.*\|\|.*\/Tes\.\*\/i/);
assert.deepEqual(tokens(nepali['import-board-instruction-issues']),
  ['__endpoint__', '__sourceName__']);
assert.match(nepali['import-board-instruction-openproject'],
  /GET \/api\/v3\/work_packages/);
assert.match(nepali['import-board-instruction-jira'],
  /GET \/rest\/api\/2\/search/);
assert.match(nepali['import-board-instruction-excel'], /\.xlsx.*Excel/);
assert.match(nepali['import-trello-zip-file-hint'], /\.json.*\.zip/);
assert.match(nepali['trello-api-key'],
  /https:\/\/trello\.com\/app-key/);
assert.match(nepali['trello-api-import'], /API/);
assert.match(nepali['trello-api-token'], /API/);
assert.match(nepali['invalid-year'], /2026/);
assert.deepEqual(tokens(nepali['label-default']), ['%s']);
assert.deepEqual(tokens(nepali['leave-board-pop']), ['__boardTitle__']);
assert.match(nepali['listImportCardPopup-title'], /Trello/);
assert.match(nepali['listImportCardsTsvPopup-title'], /Excel.*CSV\/TSV/);
assert.equal(nepali['multi-selection'], 'बहु-चयन');
assert.equal(nepali['no-archived-swimlanes'], 'अभिलेखमा स्विमलेन छैन।');
assert.deepEqual(tokens(nepali['page-maybe-private']), ['%s']);
assert.deepEqual(tags(nepali['page-maybe-private']), ['</a>', "<a href='%s'>"]);
assert.deepEqual(tokens(nepali['remove-member-pop']),
  ['__boardTitle__', '__name__', '__username__']);
assert.match(nepali['sandstorm-remove-member-warning'], /WeKan.*Sandstorm/);
assert.match(nepali['public-desc'], /Google/);
assert.match(nepali['setWipLimitPopup-title'], /WIP/);
assert.match(nepali['toggle-assignees'], /1-9/);
assert.match(nepali['toggle-labels'], /1-9/);
assert.match(nepali['custom-top-left-corner-logo-height'], /27/);
assert.match(nepali['automatic-linked-url-schemes'], /URL.*URL/);
assert.match(nepali['wipLimitErrorPopup-dialog-pt1'], /WIP/);
assert.match(nepali['wipLimitErrorPopup-dialog-pt2'], /WIP/);
assert.match(nepali['attachment-transfer-limits-title'], /API/);
assert.match(nepali['smtp-host-description'], /SMTP/);
assert.match(nepali['smtp-tls-description'], /SMTP/);
assert.match(nepali['smtp-tls-description'], /TLS/);
assert.deepEqual(tokens(nepali['email-invite-register-text']),
  ['__icode__', '__inviter__', '__url__', '__user__']);
assert.match(nepali['email-smtp-test-subject'], /SMTP/);
assert.match(nepali.Node_version, /Node/);
assert.match(nepali.Meteor_version, /Meteor/);
assert.match(nepali.FerretDB_version, /FerretDB/);
assert.match(nepali.Reactivity_mode, /changeStreams.*oplog.*polling/);
assert.match(nepali.Reactivity_order, /METEOR_REACTIVITY_ORDER/);
assert.match(nepali.DDP_transport, /DDP.*DDP_TRANSPORT/);
assert.match(nepali.OS_Cpus, /OS.*CPU/);
assert.match(nepali['org-domains-description'],
  /a\.example\.com.*kanban\.example\.org.*MULTITENANCY=true/);
assert.deepEqual(tokens(nepali['default-subtasks-board']), ['__board__']);
assert.match(nepali['checklist-count-on-minicard'], /0\/0/);
assert.match(nepali['checklist-count'], /0\/0/);
assert.deepEqual(tokens(nepali['activity-added-label']), ['%s', '%s']);
assert.equal(nepali['parent-card'], 'अभिभावक कार्ड');
assert.deepEqual(tokens(nepali['activity-set-customfield']),
  ['%s', '%s', '%s']);
assert.deepEqual(tokens(nepali['activity-unset-customfield']), ['%s', '%s']);
assert.deepEqual(tokens(nepali['r-w-every-day-at']), ['__time__']);
assert.deepEqual(tokens(nepali['r-import-done']), ['__count__']);
assert.match(nepali['r-import-paste'], /JSON.*CSV.*Trello Butler/);
assert.match(nepali['r-import-workflow-note'], /n8n.*Node-RED.*WeKan/);
assert.deepEqual(tokens(nepali['r-import-unmapped']), ['__count__']);
assert.match(nepali['r-schedule-weekday'], /सोम–शुक्र/);
assert.match(nepali['r-for-n-days'], /N/);
assert.equal(nepali['r-unarchive'], 'अभिलेखबाट पुनर्स्थापित गर्नुहोस्');
assert.equal(nepali['r-check-all'], 'सबैमा चिन्ह लगाउनुहोस्');
assert.equal(nepali['r-uncheck-all'], 'सबैबाट चिन्ह हटाउनुहोस्');
assert.equal(nepali['r-d-send-email'], 'इमेल पठाउनुहोस्');
assert.match(nepali['r-items-list'], /^वस्तु1,वस्तु2,वस्तु3$/);
assert.match(nepali['custom-head-meta-tags'], /HTML/);
assert.match(nepali['custom-head-link-tags'], /HTML/);
assert.match(nepali['custom-head-manifest-content'], /JSON/);
assert.match(nepali['custom-assetlinks-content'], /assetlinks\.json.*JSON/);
assert.deepEqual(tags(nepali['add-custom-html-after-body-start']), ['<body>']);
assert.deepEqual(tags(nepali['add-custom-html-before-body-end']), ['</body>']);
assert.match(nepali['oidc-button-text'], /OIDC/);
assert.deepEqual(tokens(nepali['act-a-dueAt']),
  ['__card__', '__timeOldValue__', '__timeValue__']);
assert.deepEqual(tokens(nepali['act-atUserComment']),
  ['__board__', '__card__', '__comment__', '__list__', '__swimlane__']);
assert.match(nepali['submit-on-enter-description'], /Shift\+Enter/);
assert.match(nepali['submit-on-enter-description'], /Ctrl\/Cmd\+Enter/);
assert.match(nepali['submit-on-enter-description'], /Enter ले/);
assert.equal(nepali.monday, 'सोमबार');
assert.equal(nepali.sunday, 'आइतबार');
assert.equal(nepali['roles-status-sees-assigned'], 'तोकिएका मात्र');
assert.match(nepali['invalid-domain'], /example\.com.*@/);
assert.equal(nepali['myCardsSortChange-choice-board'], 'बोर्डअनुसार');
assert.deepEqual(tokens(nepali['board-title-not-found']), ['%s']);
assert.deepEqual(tokens(nepali['swimlane-title-not-found']), ['%s']);
assert.deepEqual(tokens(nepali['list-title-not-found']), ['%s']);
assert.deepEqual(tokens(nepali['label-not-found']), ['%s']);
assert.deepEqual(tokens(nepali['label-color-not-found']), ['%s']);
assert.deepEqual(tokens(nepali['user-username-not-found']), ['%s']);
assert.deepEqual(tokens(nepali['comment-not-found']), ['%s']);
assert.deepEqual(tokens(nepali['n-cards-found']), ['%s']);
assert.deepEqual(tokens(nepali['n-n-of-n-cards-found']),
  ['__end__', '__start__', '__total__']);
assert.equal(nepali['operator-customfield'], 'अनुकूल फिल्ड');
assert.equal(nepali['predicate-overdue'], 'म्याद नाघेको');
assert.deepEqual(tokens(nepali['operator-number-expected']),
  ['__operator__', '__value__']);
assert.deepEqual(tokens(nepali[
  'globalSearch-instructions-operator-has']),
['__operator_has__', '__predicate_assignee__', '__predicate_attachment__',
  '__predicate_checklist__', '__predicate_description__', '__predicate_due__',
  '__predicate_end__', '__predicate_member__', '__predicate_start__']);
assert.deepEqual(tokens(nepali['globalSearch-instructions-notes-3-2']),
  ['__predicate_month__', '__predicate_quarter__', '__predicate_week__',
    '__predicate_year__']);
assert.match(nepali['globalSearch-instructions-notes-2'], /OR/);
assert.match(nepali['globalSearch-instructions-notes-3'], /AND/);

console.log('Nepali translation progress checks passed.');
