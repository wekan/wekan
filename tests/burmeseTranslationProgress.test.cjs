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
assert.equal(Object.keys(remaining).length, 1167);

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

console.log('Burmese translation progress checks passed.');
