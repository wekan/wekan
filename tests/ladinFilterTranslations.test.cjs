'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { translationTokens } = require('../releases/translations/placeholder-tokens.mjs');
const read = code => JSON.parse(fs.readFileSync(path.join(__dirname,
  '../imports/i18n/data', code + '.i18n.json'), 'utf8'));
const en = read('en');
const locale = read('lld');
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
  "draggable"
];
// Keys pending Transifex live in en.i18n.json only until the translating
// agent adds them, so the locale must match English apart from those.
const pending = new Set(JSON.parse(fs.readFileSync(path.join(__dirname,
  '../releases/translations/pending-transifex.json'), 'utf8')).keys.map(k => k.key));
assert.deepEqual(Object.keys(locale),
  Object.keys(en).filter(key => key in locale || !pending.has(key)));
for (const key of keys) {
  assert.ok(locale[key]?.trim(), key);
  assert.notEqual(locale[key], en[key], key);
  assert.deepEqual(translationTokens(locale[key]), translationTokens(en[key]), key);
  assert.deepEqual(locale[key].match(/%?\{[^}]+\}/g), en[key].match(/%?\{[^}]+\}/g), key);
  assert.deepEqual(locale[key].match(/<[^>]+>/g), en[key].match(/<[^>]+>/g), key);
}
assert.deepEqual(locale['advanced-filter-card-dates-hint'].match(/@[A-Za-z]+/g),
  en['advanced-filter-card-dates-hint'].match(/@[A-Za-z]+/g));
for (const literal of ["@endAt >= '2026-01-01'", '@endAt = none']) {
  assert.ok(locale['advanced-filter-card-dates-hint'].includes(literal), literal);
}
for (const [key, number] of [['filter-recency-day', '24'],
  ['filter-recency-week', '7'], ['filter-recency-month', '30']]) {
  assert.ok(locale[key].includes(number), key);
}
assert.match(locale['auto-archive-hint'], /modiei ne vën mai spostei/);
assert.match(locale['filter-column-age-hint'], /nia cunescudes resta visibles/);
assert.match(locale['filter-column-age-hint'], /ne mëter nia a zero/);
assert.notEqual(locale['filter-date-range-from'], locale['filter-date-range-to']);
assert.match(locale['filter-date-range-invalid'], /medemo di.*o do/);
for (const literal of ['thunderlink', 'onenote', 'javascript', 'data', 'vbscript']) {
  assert.ok(locale['automatic-linked-url-schemes-hint'].includes(literal), literal);
}
assert.ok(locale['import-board-instruction-leo'].includes('.leo'));
assert.match(locale['instance-desc'], /mai mustreda.*zënza azes/);
assert.match(locale['instance-desc'], /Mé les persones ajuntedes.*mudé/);
assert.match(locale['r-rule-any-trigger-help'], /un de si ativadëures.*te urdin/);
assert.match(locale['notification-activity-description'], /@mentions ruva tres/);
assert.equal(locale['notification-activity-comments'], locale.comments);
assert.equal(locale['notification-activity-attachments'], locale.attachments);
assert.match(locale['due-reminder-days-label'], /0.*positifs.*dan la scadenza.*negatifs.*do/);
assert.match(locale['due-reminder-invalid'], /diesc.*-14.*14/);
assert.ok(locale['custom-field-stringtemplate-context-hint'].includes('|urlencode'));
assert.notEqual(locale['dependency-type-duplicates'], locale['dependency-type-is-duplicated-by']);
assert.notEqual(locale['filter-preset-saved'], locale['filter-preset-deleted']);
assert.match(locale['filter-preset-replace-hint'], /medemo inuem sostituësc/);
assert.ok(locale['import-report-description'].includes(
  locale['admin-panel'] + ' → ' + locale.problems + ' → ' + locale.recoveryReportTitle));
console.log('Ladin translation batch checks passed');
