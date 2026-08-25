const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const fillScript = path.join(root, 'releases/translations/fill-translations.mjs');
const result = spawnSync(process.execPath, [fillScript, '--list', 'ckb'], {
  cwd: root,
  encoding: 'utf8',
});
assert.equal(result.status, 0, result.stderr);
const remaining = JSON.parse(result.stdout);
assert.equal(Object.keys(remaining).length, 466);

const english = JSON.parse(
  fs.readFileSync(path.join(root, 'imports/i18n/data/en.i18n.json'), 'utf8'),
);
const kurdish = JSON.parse(
  fs.readFileSync(path.join(root, 'imports/i18n/data/ckb.i18n.json'), 'utf8'),
);
const tokens = (value) =>
  [
    ...value.matchAll(
      /__[A-Za-z0-9_]+__|%[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g,
    ),
  ]
    .map(([token]) => token)
    .sort();
const tags = (value) =>
  [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)]
    .map(([tag]) => tag)
    .sort();

for (const [key, value] of Object.entries(kurdish)) {
  if (value !== english[key]) {
    assert.deepEqual(tokens(value), tokens(english[key]), key);
  }
  assert.deepEqual(tags(value), tags(english[key]), key);
}

assert.equal(kurdish.accept, 'پەسەندکردن');
assert.deepEqual(tokens(kurdish['activity-changedTitle']), ['%s', '%s']);
assert.deepEqual(tokens(kurdish['act-addChecklistItem']), [
  '__board__',
  '__card__',
  '__checklistItem__',
  '__checklist__',
  '__list__',
  '__swimlane__',
]);
assert.deepEqual(tokens(kurdish['act-removeChecklistItem']), [
  '__board__',
  '__card__',
  '__checkList__',
  '__checklistItem__',
  '__list__',
  '__swimlane__',
]);
assert.match(kurdish['act-createBoard'], /تەختە/);
assert.match(kurdish['act-createSwimlane'], /ڕێڕەو/);
assert.match(kurdish['act-addComment'], /لێدوان/);
assert.match(kurdish['act-archivedCard'], /ئەرشیف/);
assert.deepEqual(tokens(kurdish['act-moveCard']), [
  '__board__',
  '__card__',
  '__list__',
  '__oldList__',
  '__oldSwimlane__',
  '__swimlane__',
]);
assert.deepEqual(tokens(kurdish['activity-checklist-completed-card']), [
  '__board__',
  '__card__',
  '__checklist__',
  '__list__',
  '__swimlane__',
]);
assert.match(kurdish['allboards.add-workspace'], /شوێنی کار/);
assert.match(kurdish['allboards.edit-workspace-icon'], /markdown/);
assert.deepEqual(tokens(kurdish['activity-dueDate']), ['%s', '%s']);
assert.match(kurdish['home-board-remove-confirm'], /ناسڕدرێتەوە/);
assert.match(kurdish['list-width-error-message'], /270/);
assert.match(kurdish['set-swimlane-height'], /ڕێڕەو/);
assert.match(kurdish['convertChecklistItemToCardPopup-title'], /کارت/);
assert.deepEqual(tokens(kurdish['and-n-other-card']), ['__count__']);
assert.deepEqual(tokens(kurdish['avatar-too-big']), ['__size__']);
assert.deepEqual(tags(kurdish['board-private-info']), [
  '</strong>',
  '<strong>',
]);
assert.match(kurdish['board-private-info'], /تایبەت/);
assert.deepEqual(tags(kurdish['board-public-info']), [
  '</strong>',
  '<strong>',
]);
assert.deepEqual(
  tokens(kurdish['board-open-and-move-between-remaining-and-workspaces']),
  ['__workspaces__'],
);
assert.match(kurdish['enter-zoom-level'], /50-300%/);
assert.deepEqual(tokens(kurdish['card-comments-title']), ['%s']);
assert.match(kurdish['cardStartPlanningPokerPopup-title'], /Planning Poker/);
assert.match(kurdish['cardDependenciesPopup-title'], /پشتبەستە/);
assert.match(kurdish['addBoardOrgPopup-title'], /ڕێکخراو/);
assert.match(kurdish['importSwimlanePopup-title'], /ڕێڕەو/);
assert.match(kurdish.casSignIn, /CAS/);
assert.match(kurdish['map-to-existing-user-desc'], /مۆڵەت/);
assert.match(kurdish['font-preview-text'], /0123456789/);
assert.match(kurdish['changeLanguagePopup-title'], /زمان/);
assert.match(kurdish['card-aging-days'], /3/);
assert.match(kurdish['move-card-up'], /سەرەوە/);
assert.match(kurdish['move-list-left'], /چەپ/);
assert.equal(kurdish['color-black'], 'ڕەش');
assert.equal(kurdish['color-red'], 'سوور');
assert.match(kurdish['comment-only'], /لێدوان/);
assert.match(kurdish['read-only'], /خوێندنەوە/);
assert.equal(JSON.parse(kurdish['copyManyCardsPopup-format']).length, 3);
assert.match(kurdish['custom-field-currency'], /دراو/);
assert.deepEqual(tokens(kurdish['email-enrollAccount-text']), [
  '__url__',
  '__user__',
]);
assert.deepEqual(tokens(kurdish['email-invite-text']), [
  '__board__',
  '__inviter__',
  '__url__',
  '__user__',
]);
assert.match(kurdish['error-json-malformed'], /JSON/);
assert.match(kurdish['error-csv-schema'], /CSV.*TSV/);
assert.match(kurdish['error-import-empty-board'], /WeKan/);
assert.match(kurdish['export-card-pdf'], /PDF/);
assert.match(kurdish['export-card-excel'], /Excel/);
assert.match(kurdish['export-card-field-board-info'], /ڕێڕەو/);
assert.match(kurdish['filter-due-today'], /ئەمڕۆ/);
assert.match(kurdish['advanced-filter-description'], /F1 == \/Tes\.\*\/i/);
assert.deepEqual(tokens(kurdish['import-board-instruction-issues']), [
  '__endpoint__',
  '__sourceName__',
]);
assert.match(kurdish['import-board-instruction-openproject'], /GET \/api\/v3\/work_packages/);
assert.match(kurdish['import-board-instruction-jira'], /GET \/rest\/api\/2\/search/);
assert.match(kurdish['import-trello-json-file-hint'], /API/);
assert.match(kurdish['trello-api-key'], /https:\/\/trello\.com\/app-key/);
assert.match(kurdish['trello-api-token'], /API/);
assert.match(kurdish['invalid-year'], /2026/);
assert.deepEqual(tokens(kurdish['label-default']), ['%s']);
assert.deepEqual(tokens(kurdish['leave-board-pop']), ['__boardTitle__']);
assert.match(kurdish['listImportCardsTsvPopup-title'], /Excel CSV\/TSV/);
assert.match(kurdish['no-archived-swimlanes'], /ڕێڕەو/);
assert.match(kurdish['normal-assigned-only-desc'], /ئاسایی/);
assert.deepEqual(tokens(kurdish['page-maybe-private']), ['%s']);
assert.deepEqual(tags(kurdish['page-maybe-private']), [
  '</a>',
  "<a href='%s'>",
]);
assert.deepEqual(tokens(kurdish['remove-member-pop']), [
  '__boardTitle__',
  '__name__',
  '__username__',
]);
assert.match(kurdish['public-desc'], /Google/);
assert.match(kurdish['toggle-assignees'], /1-9/);
assert.match(kurdish['custom-top-left-corner-logo-height'], /27/);
assert.match(kurdish['automatic-linked-url-schemes'], /URL/);
assert.match(kurdish['attachment-transfer-limits-title'], /API/);
assert.deepEqual(tokens(kurdish['email-invite-register-text']), [
  '__icode__',
  '__inviter__',
  '__url__',
  '__user__',
]);
assert.match(kurdish['smtp-host'], /SMTP/);
assert.match(kurdish['smtp-tls'], /TLS/);
assert.match(kurdish.Node_version, /Node/);
assert.match(kurdish.Meteor_version, /Meteor/);
assert.match(kurdish.FerretDB_version, /FerretDB/);
assert.match(kurdish.Reactivity_order, /METEOR_REACTIVITY_ORDER/);
assert.match(kurdish.DDP_transport, /DDP_TRANSPORT/);
assert.match(kurdish['org-domains-description'], /MULTITENANCY=true/);
assert.match(kurdish['org-domains-description'], /a\.example\.com.*kanban\.example\.org/);
assert.deepEqual(tokens(kurdish['default-subtasks-board']), ['__board__']);
assert.match(kurdish['checklist-count'], /0\/0/);
assert.match(kurdish['parent-card'], /باوک/);
assert.match(kurdish['delete-board'], /تەختە/);
assert.deepEqual(tokens(kurdish['activity-added-label']), ['%s', '%s']);
assert.deepEqual(tokens(kurdish['activity-set-customfield']), ['%s', '%s', '%s']);
assert.deepEqual(tokens(kurdish['r-w-every-day-at']), ['__time__']);
assert.deepEqual(tokens(kurdish['r-import-done']), ['__count__']);
assert.match(kurdish['r-board-rules'], /یاسا/);
assert.match(kurdish['r-workflow-view'], /ڕەوتی کار/);
assert.deepEqual(tokens(kurdish['r-import-unmapped']), ['__count__']);
assert.match(kurdish['r-schedule-weekday'], /دووشەممە.*هەینی/);
assert.match(kurdish['r-unit-minutes'], /خولەک/);
assert.match(kurdish['r-trigger'], /دەستپێکەر/);
assert.match(kurdish['r-unarchived'], /ئەرشیف/);
assert.match(kurdish['r-checklist'], /لیستی پشکنین/);
assert.match(kurdish['r-send-email'], /ئیمەیڵ/);
assert.equal(kurdish['r-items-list'], 'بڕگە1,بڕگە2,بڕگە3');
assert.match(kurdish['r-in-swimlane'], /ڕێڕەو/);
assert.match(kurdish['authentication-method'], /پشتڕاستکردنەوە/);
assert.match(kurdish['custom-head-meta-tags'], /HTML/);
assert.match(kurdish['custom-assetlinks-content'], /assetlinks\.json.*JSON/);
assert.deepEqual(tags(kurdish['add-custom-html-after-body-start']), ['<body>']);
assert.deepEqual(tags(kurdish['add-custom-html-before-body-end']), ['</body>']);
assert.deepEqual(tokens(kurdish['act-a-dueAt']), [
  '__card__',
  '__timeOldValue__',
  '__timeValue__',
]);
assert.equal(kurdish['act-a-dueAt'].split('\n').length, 4);
assert.deepEqual(tokens(kurdish['act-atUserComment']), [
  '__board__',
  '__card__',
  '__comment__',
  '__list__',
  '__swimlane__',
]);
assert.match(kurdish['submit-on-enter-description'], /Shift\+Enter/);
assert.match(kurdish['submit-on-enter-description'], /Ctrl\/Cmd\+Enter/);
assert.equal(kurdish.monday, 'دووشەممە');
assert.equal(kurdish.friday, 'هەینی');
assert.match(kurdish['roles-info'], /پانێڵی بەڕێوەبەر/);
assert.match(kurdish['invalid-domain'], /example\.com.*@/);
assert.match(kurdish['shared-templates-info'], /ڕێکخراو.*تیم.*دۆمەین/);
assert.match(kurdish['dueCardsViewChange-choice-all-description'], /\*کۆتایی\*/);
assert.deepEqual(tokens(kurdish['board-title-not-found']), ['%s']);
assert.deepEqual(tokens(kurdish['label-color-not-found']), ['%s']);
assert.deepEqual(tokens(kurdish['n-n-of-n-cards-found']), [
  '__end__',
  '__start__',
  '__total__',
]);
for (const key of [
  'operator-board',
  'operator-customfield',
  'operator-checklist-text',
  'predicate-archived',
  'predicate-checklist',
]) {
  assert.doesNotMatch(kurdish[key], /\s/, key);
}
assert.deepEqual(tokens(kurdish['operator-number-expected']), [
  '__operator__',
  '__value__',
]);
assert.deepEqual(
  tags(kurdish['globalSearch-instructions-operator-board']),
  ['<title>', '<title>'],
);
assert.deepEqual(
  tokens(kurdish['globalSearch-instructions-operator-has']),
  tokens(english['globalSearch-instructions-operator-has']),
);
assert.equal(kurdish['globalSearch-instructions-notes-2'].split('\n').length, 2);
assert.match(kurdish['sort-boards-title-asc'], /A → Z/);
assert.match(kurdish['card-dependencies'], /پشتبەستە/);
assert.deepEqual(tokens(kurdish['import-dependencies-done']), [
  '__imported__',
  '__unmatched__',
]);
assert.deepEqual(tokens(kurdish['background-too-big']), ['{{size}}']);
assert.match(kurdish['location-latitude'], /جوگرافی/);
assert.equal(kurdish['server-error-troubleshooting'].split('\n').length, 3);
assert.match(kurdish['server-error-troubleshooting'], /sudo snap logs wekan\.wekan/);
assert.match(kurdish['server-error-troubleshooting'], /sudo docker logs wekan-app/);
assert.deepEqual(tokens(kurdish['custom-field-stringtemplate-format']), [
  '%{value}',
]);
assert.match(kurdish['custom-field-stringtemplate-separator'], /&#32;.*&nbsp;/);
assert.match(kurdish['office-report-desc'], /IPv4.*IPv6/);
assert.match(kurdish['api-report-desc'], /REST API/);
assert.match(kurdish['api-no-calls'], /WITH_API=true/);
assert.match(kurdish['recovery-report-desc'], /MongoDB/);
assert.match(kurdish['carbon-copy'], /Cc:/);
assert.equal(kurdish.resolved, 'چارەسەرکراو');
assert.match(kurdish.Node_heap_malloced_memory, /Node.*malloc/);
assert.match(kurdish['custom-legal-notice-link-url'], /URL/);
assert.match(kurdish['newLineNewItem'], /=/);
assert.match(kurdish['attachment-move-storage-gridfs'], /GridFS/);
assert.match(kurdish['attachment-move-storage-s3'], /S3/);
assert.match(kurdish['attachment-repair-locations-description'], /GridFS/);
assert.match(kurdish['mongodb-compact-description'], /MongoDB GridFS.*Compact/);
assert.match(kurdish['mongodb-compact-warning'], /oplog.*Meteor/);
assert.match(kurdish['move-all-attachments-of-board-to-s3'], /S3/);
assert.match(kurdish['gridfs-file-id'], /GridFS/);
assert.match(kurdish['preview-pdf-not-supported'], /PDF/);
assert.deepEqual(tokens(kurdish['drag-board-to-workspace']), ['__workspaces__']);
assert.match(kurdish['show-week-of-year'], /ISO 8601/);
assert.match(kurdish['import-board-zip'], /\.zip.*JSON/);
assert.match(kurdish.accessibility, /دەستڕاگەیشتن/);
