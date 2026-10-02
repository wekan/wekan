'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { translationTokens } = require('../releases/translations/placeholder-tokens.mjs');
const read = code => JSON.parse(fs.readFileSync(path.join(__dirname,
  '../imports/i18n/data', `${code}.i18n.json`), 'utf8'));
const en = read('en');
const locale = read('kw');
const keys = [
  "auto-archive-days",
  "auto-archive-off",
  "auto-archive-hint",
  "filter-recency-any",
  "filter-recency-day",
  "filter-recency-week",
  "filter-recency-month",
  "filter-recency-older",
  "filter-movement-range",
  "filter-date-range-field",
  "filter-date-range-from",
  "filter-date-range-to",
  "filter-date-range-missing",
  "filter-date-range-list-entry",
  "filter-date-range-invalid",
  "filter-due-any",
  "filter-due-previous-week",
  "filter-due-next-month",
  "filter-column-age",
  "filter-column-age-disabled",
  "filter-column-age-days",
  "filter-column-age-hint",
  "advanced-filter-card-dates-hint",
  "import-board-instruction-leo",
  "instance",
  "instance-desc",
  "board-instance-info",
  "automatic-linked-url-schemes-hint",
  "other-parent-cards",
  "add-parent-card",
  "remove-parent-card",
  "r-when-card-date",
  "r-trigger-vars-hint",
  "r-insert-variable",
  "r-vars-people-hint",
  "r-rule-any-trigger-help",
  "r-add-trigger-to-rule",
  "r-add-action-to-rule",
  "r-remove-rule-part",
  "notification-activity-heading",
  "notification-activity-description",
  "notification-activity-labels",
  "notification-activity-members",
  "notification-activity-assignees",
  "notification-activity-comments",
  "notification-activity-moves",
  "notification-activity-dates",
  "notification-activity-checklists",
  "notification-activity-attachments",
  "notification-activity-customFields",
  "notification-activity-archive",
  "notification-activity-created",
  "due-reminder-heading",
  "due-reminder-days-label",
  "due-reminder-off",
  "due-reminder-webhook",
  "due-reminder-invalid",
  "due-reminder-saved",
  "dependency-type-duplicates",
  "dependency-type-is-duplicated-by",
  "custom-field-stringtemplate-context-hint",
  "filter-presets",
  "filter-preset-choose",
  "filter-preset-name",
  "filter-preset-save",
  "filter-preset-replace-hint",
  "filter-preset-saved",
  "filter-preset-applied",
  "filter-preset-deleted",
  "filter-preset-error",
  "filter-card-text-label",
  "import-report-heading",
  "import-report-description",
  "import-report-open-board",
  "draggable",
  "board-view-map",
  "map-view-empty",
  "map-view-upload",
  "map-view-remove-image",
  "map-view-unplaced",
  "map-view-place-hint",
  "map-view-all-placed",
  "blockly-UNNAMED_KEY",
  "board-view-product-backlog",
  "board-view-sprints",
  "board-view-sprint-report",
  "board-view-velocity",
  "scrum-settings",
  "scrum-product-owner",
  "scrum-master",
  "scrum-developers",
  "scrum-working-days",
  "scrum-enabled",
  "scrum-product-goal",
  "scrum-definition-of-done",
  "scrum-estimate-source",
  "scrum-estimate-unit",
  "scrum-completion-policy",
  "scrum-source-poker",
  "scrum-source-customField",
  "scrum-policy-dueComplete",
  "scrum-policy-doneLists",
  "scrum-sprints",
  "scrum-sprint",
  "scrum-start-sprint",
  "scrum-close-sprint",
  "scrum-cancel-sprint",
  "scrum-rollover-sprint",
  "scrum-cancel-reason",
  "scrum-product-backlog"
];
assert.deepEqual(Object.keys(locale), Object.keys(en));
for (const key of keys) {
  assert.ok(locale[key]?.trim(), key);
  assert.notEqual(locale[key], en[key], key);
  assert.deepEqual(translationTokens(locale[key]), translationTokens(en[key]), key);
  assert.deepEqual(locale[key].match(/%?\{[^}]+\}/g), en[key].match(/%?\{[^}]+\}/g), key);
  assert.deepEqual(locale[key].match(/<[^>]+>/g), en[key].match(/<[^>]+>/g), key);
}
const hint = locale['advanced-filter-card-dates-hint'];
assert.deepEqual(hint.match(/@[A-Za-z]+/g), en['advanced-filter-card-dates-hint'].match(/@[A-Za-z]+/g));
assert.ok(hint.includes("@endAt >= '2026-01-01'"));
assert.ok(hint.includes('@endAt = none'));
assert.match(locale['auto-archive-hint'], /patronyow ny vydh byth/);
assert.match(locale['filter-column-age-hint'], /ny wra dalleth arta niveri/);
assert.notEqual(locale['filter-date-range-from'], locale['filter-date-range-to']);
console.log('Cornish date filter translations passed');

for (const token of ['thunderlink', 'onenote', 'javascript', 'data', 'vbscript']) {
  assert.ok(locale['automatic-linked-url-schemes-hint'].includes(token), token);
}
assert.ok(locale['import-board-instruction-leo'].includes('.leo'));
assert.ok(locale['notification-activity-description'].includes('@mentions'));
assert.match(locale['instance-desc'], /nad yns omgelmys/);
assert.match(locale['instance-desc'], /hepken a yll golegi/);

assert.ok(locale['custom-field-stringtemplate-context-hint'].includes('|urlencode'));
assert.match(locale['due-reminder-invalid'], /-14.*14/);
assert.match(locale['due-reminder-days-label'], /0.*posedhek.*kyns.*negedhek.*war y lergh/);
assert.notEqual(locale['dependency-type-duplicates'], locale['dependency-type-is-duplicated-by']);
assert.notEqual(locale['filter-preset-saved'], locale['filter-preset-deleted']);
assert.ok(locale['import-report-description'].includes('→ Kudynnow → Daskorrans'));

for (const pair of [['map-view-upload', 'map-view-remove-image'],
  ['scrum-start-sprint', 'scrum-close-sprint'],
  ['scrum-close-sprint', 'scrum-cancel-sprint'],
  ['scrum-policy-dueComplete', 'scrum-policy-doneLists']]) {
  assert.notEqual(locale[pair[0]], locale[pair[1]], pair.join('/'));
}
assert.equal(locale['board-view-product-backlog'], locale['scrum-product-backlog']);
assert.equal(locale['board-view-sprints'], locale['scrum-sprints']);
assert.match(locale['scrum-rollover-sprint'], /heb gorfenna/);
assert.match(locale['scrum-product-owner'], /Perghen/);
