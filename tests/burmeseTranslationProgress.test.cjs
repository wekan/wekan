'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const fillScript = path.join(root,
  'releases/translations/fill-translations.mjs');
const result = spawnSync(process.execPath, [fillScript, '--list', 'my'], {
  cwd: root,
  encoding: 'utf8',
});
assert.equal(result.status, 0, result.stderr);
const remaining = JSON.parse(result.stdout);
assert.equal(Object.keys(remaining).length, 317);

const english = JSON.parse(fs.readFileSync(
  path.join(root, 'imports/i18n/data/en.i18n.json'), 'utf8'));
const burmese = JSON.parse(fs.readFileSync(
  path.join(root, 'imports/i18n/data/my.i18n.json'), 'utf8'));
const tokens = value => [...value.matchAll(
  /__[A-Za-z0-9_]+__|%[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g)]
  .map(([token]) => token).sort();
const tags = value => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)]
  .map(([tag]) => tag).sort();

for (const [key, value] of Object.entries(burmese)) {
  assert.deepEqual(tokens(value), tokens(english[key]), key);
  assert.deepEqual(tags(value), tags(english[key]), key);
}

assert.equal(burmese.accept, 'လက်ခံရန်');
assert.match(burmese.accept, /[\u1000-\u109F]/);
assert.deepEqual(tokens(burmese['activity-changedTitle']), ['%s', '%s']);
assert.deepEqual(tokens(burmese['act-deleteCard']),
  ['__board__', '__card__', '__list__', '__swimlane__']);
assert.deepEqual(tokens(burmese['act-removeChecklistItem']),
  ['__board__', '__card__', '__checkList__', '__checklistItem__', '__list__',
    '__swimlane__']);
assert.deepEqual(tokens(burmese['act-setCustomField']),
  ['__board__', '__card__', '__customFieldValue__', '__customField__',
    '__list__', '__swimlane__']);
assert.match(burmese['board-members-same-org-only'], /အဖွဲ့အစည်း/);
assert.match(burmese['board-members-same-team-only'], /အဖွဲ့/);
assert.deepEqual(tokens(burmese['act-moveCardToOtherBoard']),
  ['__board__', '__card__', '__list__', '__oldBoard__', '__oldList__',
    '__oldSwimlane__', '__swimlane__']);
assert.deepEqual(tokens(burmese['activity-imported']), ['%s', '%s', '%s']);
assert.deepEqual(tokens(burmese['activity-checklist-completed-card']),
  ['__board__', '__card__', '__checklist__', '__list__', '__swimlane__']);
assert.equal(burmese['allboards.workspaces'], 'လုပ်ငန်းနေရာများ');
assert.match(burmese['allboards.edit-workspace-icon'], /markdown/);
assert.deepEqual(tokens(burmese['activity-dueDate']), ['%s', '%s']);
assert.match(burmese['list-width-error-message'], /270/);
assert.match(burmese['set-list-width-value'], /ပစ်ဇယ်/);
assert.match(burmese['set-swimlane-height-value'], /ပစ်ဇယ်/);
assert.equal(burmese['add-checklist'], 'စစ်ဆေးစာရင်း ထည့်ရန်');
assert.deepEqual(tokens(burmese['and-n-other-card']), ['__count__']);
assert.deepEqual(tokens(burmese['and-n-other-card_plural']), ['__count__']);
assert.deepEqual(tokens(burmese['avatar-too-big']), ['__size__']);
assert.match(burmese['board-background-image-url'], /URL/);
assert.deepEqual(tokens(burmese['board-nb-stars']), ['%s']);
assert.deepEqual(tags(burmese['board-private-info']),
  ['</strong>', '<strong>']);
assert.deepEqual(tags(burmese['board-public-info']),
  ['</strong>', '<strong>']);
assert.deepEqual(tokens(
  burmese['board-open-and-move-between-remaining-and-workspaces']),
['__workspaces__']);
assert.match(burmese['enter-zoom-level'], /50-300%/);
assert.deepEqual(tokens(burmese['card-comments-title']), ['%s']);
assert.equal(burmese['card-edit-custom-fields'],
  'စိတ်ကြိုက်အကွက်များ ပြင်ရန်');
assert.match(burmese['cardStartPlanningPokerPopup-title'], /Planning Poker/);
assert.match(burmese['editPokerEndDatePopup-title'], /Planning Poker/);
assert.equal(burmese['importDependenciesPopup-title'],
  'မှီခိုမှုများ တင်သွင်းရန်');
assert.match(burmese.casSignIn, /CAS/);
assert.match(burmese['font-preview-text'], /0123456789/);
assert.equal(burmese['change-permissions'], 'ခွင့်ပြုချက်များ ပြောင်းရန်');
assert.deepEqual(tokens(burmese['user-username-not-found']), ['%s']);
assert.deepEqual(tokens(burmese['n-n-of-n-cards-found']),
  ['__end__', '__start__', '__total__']);
assert.equal(burmese['operator-board'], 'ဘုတ်');
assert.equal(burmese['predicate-overdue'], 'သတ်မှတ်ရက်ကျော်သော');
assert.deepEqual(tokens(burmese['operator-number-expected']),
  ['__operator__', '__value__']);
assert.deepEqual(tokens(burmese['globalSearch-instructions-operator-has']),
  tokens(english['globalSearch-instructions-operator-has']));
assert.match(burmese['globalSearch-instructions-heading'], /ရှာဖွေ/);
assert.deepEqual(tokens(burmese['import-dependencies-done']),
  ['__imported__', '__unmatched__']);
assert.deepEqual(tokens(burmese['background-too-big']), ['{{size}}']);
assert.equal(burmese['card-dependencies'], 'မှီခိုမှုများ');
assert.equal(burmese.location, 'တည်နေရာ');
assert.deepEqual(tokens(burmese['custom-field-stringtemplate-format']),
  ['%{value}']);
assert.match(burmese['server-error-troubleshooting'],
  /sudo snap logs wekan\.wekan/);
assert.match(burmese['server-error-troubleshooting'],
  /sudo docker logs wekan-app/);
assert.match(burmese['office-report-desc'], /IPv4.*IPv6/);
assert.match(burmese['api-report-desc'], /REST API/);
assert.match(burmese['api-no-calls'], /WITH_API=true/);
assert.match(burmese['recovery-report-desc'], /MongoDB/);
assert.equal(burmese['help-request'], 'အကူအညီတောင်းဆိုချက်');
assert.match(burmese.Node_heap_total_heap_size, /Node heap/);
assert.match(burmese['custom-legal-notice-link-url'], /URL/);
assert.match(burmese['attachment-move-storage-gridfs'], /GridFS/);
assert.match(burmese['attachment-move-storage-s3'], /S3/);
assert.match(burmese['attachment-repair-locations-description'],
  /GridFS.*cloud/);
assert.match(burmese['mongodb-compact-description'], /MongoDB GridFS/);
assert.match(burmese['mongodb-compact-warning'], /Meteor/);
assert.equal(burmese['gridfs-file-id'], 'GridFS ဖိုင် ID');
assert.match(burmese['preview-pdf-not-supported'], /PDF/);
assert.deepEqual(tokens(burmese['drag-board-to-workspace']),
  ['__workspaces__']);
assert.match(burmese['show-week-of-year'], /ISO 8601/);
assert.match(burmese['import-board-zip'], /\.zip/);
assert.match(burmese['import-board-zip'], /JSON/);
assert.match(burmese['accounts-lockout-settings'], /ကာကွယ်ရေး/);
assert.equal(burmese['accounts-lockout-unlock-all'], 'အားလုံး ပြန်ဖွင့်ရန်');
assert.equal(burmese['attachments-path'], 'ပူးတွဲဖိုင် လမ်းကြောင်း');
assert.match(burmese['board-backup-scheduled'], /အောင်မြင်စွာ/);
assert.match(burmese['s3-force-path-style-description'], /MinIO.*AWS.*S3/);
assert.deepEqual(tokens(burmese['database-migration-confirm']), ['__db__']);
for (const literal of ['mongodb://127.0.0.1:27018',
  'mongodb://127.0.0.1:27019', 'WEKAN_FERRETDB_URL', 'WEKAN_MONGODB_URL',
  'MONGO_URL']) {
  assert.match(burmese['database-migration-description'],
    new RegExp(literal.replaceAll('.', '\\.')));
}
assert.match(burmese['sandstorm-migration-description'], /files\/attachments/);
assert.match(burmese['sandstorm-migration-description'], /files\/avatars/);
assert.match(burmese['cards-loading-description'], /CARDS_LOADING/);
assert.match(burmese['cards-loading-description'],
  /CARDS_LOADING_LAZY_THRESHOLD/);
assert.deepEqual(tags(burmese['render-links-as-plain-text-description']),
  tags(english['render-links-as-plain-text-description']));
for (const literal of ['backup/YYYY/MM/DD/HH_MM_SS/backup.zip',
  'YYYY_MM_DD-HH_MM_SS/attachments', '/avatars', '/data']) {
  assert.match(burmese['backup-description'],
    new RegExp(literal.replaceAll('/', '\\/').replaceAll('.', '\\.')));
}
assert.match(burmese['card-aging-days'], /3/);
assert.equal(burmese['color-black'], 'အနက်');
assert.equal(burmese['color-red'], 'အနီ');
assert.equal(burmese['color-sky'], 'ကောင်းကင်ပြာ');
assert.equal(burmese['color-white'], 'အဖြူ');
assert.equal(burmese['color-yellow'], 'အဝါ');
assert.deepEqual(JSON.parse(burmese['copyManyCardsPopup-format']).map(card =>
  Object.keys(card).sort()), [
  ['description', 'title'],
  ['description', 'title'],
  ['description', 'title'],
]);
assert.match(burmese['copyManyCardsPopup-instructions'], /JSON/);
assert.match(burmese['custom-field-dropdown-options-placeholder'], /Enter/);
assert.match(burmese['edit-wip-limit'], /WIP/);
assert.deepEqual(tokens(burmese['email-enrollAccount-text']),
  ['__url__', '__user__']);
assert.deepEqual(tokens(burmese['email-invite-text']),
  ['__board__', '__inviter__', '__url__', '__user__']);
assert.deepEqual(tokens(burmese['email-resetPassword-text']),
  ['__url__', '__user__']);
for (const literal of ['JSON', 'CSV', 'TSV', 'WeKan']) {
  assert.ok(Object.values(burmese).some(value => value.includes(literal)));
}
assert.match(burmese['export-card-pdf'], /PDF/);
assert.match(burmese['export-card-excel'], /Excel/);
assert.match(burmese['export-card-excel-no-disk-space'], /Excel/);
assert.deepEqual(tokens(burmese['import-board-instruction-issues']),
  ['__endpoint__', '__sourceName__']);
for (const literal of ['==', '!=', '<=', '>=', '&&', '||', '/Tes.*/i']) {
  assert.ok(burmese['advanced-filter-description'].includes(literal));
}
for (const literal of ['Kanboard', 'NextCloud Deck', 'OpenProject', 'Asana',
  'ZenKit', 'Trello', 'Jira Cloud REST API', '.xlsx', '.json', '.zip']) {
  assert.ok(Object.values(burmese).some(value => value.includes(literal)));
}
assert.match(burmese['trello-api-key'], /https:\/\/trello\.com\/app-key/);
assert.match(burmese['trello-api-import'], /API.*token/);
assert.match(burmese['invalid-year'], /2026/);
assert.deepEqual(tokens(burmese['label-default']), ['%s']);
assert.deepEqual(tokens(burmese['leave-board-pop']), ['__boardTitle__']);
for (const literal of ['Trello', 'Excel', 'CSV', 'TSV']) {
  assert.ok(burmese['listImportCardPopup-title'].includes(literal)
    || burmese['listImportCardsTsvPopup-title'].includes(literal));
}
assert.equal(burmese['multi-selection'], 'အများရွေးချယ်မှု');
assert.deepEqual(tokens(burmese['page-maybe-private']), ['%s']);
assert.deepEqual(tags(burmese['page-maybe-private']), ['</a>', "<a href='%s'>"]);
assert.deepEqual(tokens(burmese['remove-member-pop']),
  ['__boardTitle__', '__name__', '__username__']);
for (const literal of ['WeKan', 'Sandstorm', 'Google', 'Enter', 'WIP']) {
  assert.ok(Object.values(burmese).some(value => value.includes(literal)));
}
for (const key of ['toggle-assignees', 'toggle-labels',
  'remove-labels-multiselect']) {
  assert.match(burmese[key], /1-9/);
}
assert.match(burmese['custom-top-left-corner-logo-height'], /27/);
assert.match(burmese['automatic-linked-url-schemes'], /URL Scheme/);
for (const key of ['attachment-transfer-limits-title',
  'attachment-transfer-limits-description', 'api-upload-limit-label',
  'api-download-limit-label']) {
  assert.match(burmese[key], /API/);
}
assert.deepEqual(tokens(burmese['email-invite-register-text']),
  ['__icode__', '__inviter__', '__url__', '__user__']);
for (const literal of ['SMTP', 'TLS', 'Webhook', 'Node', 'Meteor']) {
  assert.ok(Object.values(burmese).some(value => value.includes(literal)));
}
for (const literal of ['FerretDB', 'changeStreams', 'oplog', 'polling',
  'METEOR_REACTIVITY_ORDER', 'DDP_TRANSPORT', 'OS', 'CPU']) {
  assert.ok(Object.values(burmese).some(value => value.includes(literal)));
}
for (const literal of ['a.example.com', 'kanban.example.org',
  'MULTITENANCY=true']) {
  assert.ok(burmese['org-domains-description'].includes(literal));
}
assert.deepEqual(tokens(burmese['default-subtasks-board']), ['__board__']);
assert.match(burmese['checklist-count-on-minicard'], /0\/0/);
assert.match(burmese['checklist-count'], /0\/0/);
assert.deepEqual(tokens(burmese['activity-added-label']), ['%s', '%s']);
assert.deepEqual(tokens(burmese['activity-set-customfield']),
  ['%s', '%s', '%s']);
assert.deepEqual(tokens(burmese['r-w-every-day-at']), ['__time__']);
assert.deepEqual(tokens(burmese['r-import-done']), ['__count__']);
for (const literal of ['JSON', 'CSV', 'Trello Butler']) {
  assert.ok(Object.values(burmese).some(value => value.includes(literal)));
}
assert.deepEqual(tokens(burmese['r-import-unmapped']), ['__count__']);
for (const literal of ['n8n', 'Node-RED', 'WeKan']) {
  assert.ok(burmese['r-import-workflow-note'].includes(literal));
}
assert.match(burmese['r-schedule-weekday'], /Mon–Fri/);
assert.match(burmese['r-for-n-days'], /N/);
assert.equal(burmese['r-check-all'], 'အားလုံး အမှန်ခြစ်ရန်');
assert.equal(burmese['r-uncheck-all'], 'အားလုံး အမှန်ခြစ်ဖြုတ်ရန်');
assert.equal(burmese['r-d-send-email'], 'အီးမေးလ် ပို့ရန်');
assert.equal(burmese['r-items-list'].split(',').length, 3);
for (const literal of ['HTML', 'JSON', 'assetlinks.json', 'web manifest']) {
  assert.ok(Object.values(burmese).some(value => value.includes(literal)));
}
assert.deepEqual(tags(burmese['add-custom-html-after-body-start']), ['<body>']);
assert.deepEqual(tags(burmese['add-custom-html-before-body-end']), ['</body>']);
assert.deepEqual(tokens(burmese['act-a-dueAt']),
  ['__card__', '__timeOldValue__', '__timeValue__']);
assert.deepEqual(tokens(burmese['act-atUserComment']),
  ['__board__', '__card__', '__comment__', '__list__', '__swimlane__']);
assert.match(burmese['submit-on-enter'], /Enter/);
for (const literal of ['Enter', 'Shift+Enter', 'Ctrl/Cmd+Enter']) {
  assert.ok(burmese['submit-on-enter-description'].includes(literal));
}
assert.equal(burmese.monday, 'တနင်္လာ');
assert.equal(burmese.sunday, 'တနင်္ဂနွေ');
assert.match(burmese['invalid-domain'], /example\.com.*@/);
for (const key of ['board-title-not-found', 'swimlane-title-not-found',
  'list-title-not-found', 'label-not-found', 'label-color-not-found']) {
  assert.deepEqual(tokens(burmese[key]), ['%s']);
}

console.log('Burmese translation progress checks passed.');
