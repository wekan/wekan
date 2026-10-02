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
  "scrum-product-backlog",
  "scrum-edit-sprint",
  "scrum-sprint-goal",
  "scrum-capacity",
  "scrum-new-sprint",
  "scrum-releases",
  "scrum-release",
  "scrum-select-sprint",
  "scrum-backlog",
  "scrum-backlog-help",
  "scrum-estimate",
  "scrum-backlog-rank",
  "scrum-issue-type",
  "scrum-acceptance-criteria",
  "scrum-events",
  "scrum-event-kind",
  "scrum-timebox",
  "scrum-notes",
  "scrum-event-planning",
  "scrum-event-daily",
  "scrum-event-review",
  "scrum-event-retrospective",
  "scrum-committed",
  "scrum-completed",
  "scrum-added",
  "scrum-removed",
  "scrum-incomplete",
  "scrum-no-closed-sprints",
  "scrum-report-help",
  "scrum-total",
  "scrum-state-planned",
  "scrum-state-active",
  "scrum-state-closed",
  "scrum-state-cancelled",
  "scrum-unknown-estimate",
  "scrum-confirm-close",
  "scrum-confirm-cancel",
  "scrum-past-sprints",
  "scrum-list-category",
  "scrum-swimlane-purpose",
  "scrum-category-backlog",
  "scrum-category-todo",
  "scrum-category-doing",
  "scrum-category-done",
  "scrum-partial-report",
  "scrum-state-released",
  "scrum-released-at",
  "scrum-follow-up-cards",
  "scrum-import-reference-omitted",
  "scrum-partial-snapshot",
  "scrum-resume-close",
  "scrum-daily-observations",
  "scrum-daily-observations-help",
  "scrum-daily-truncated",
  "scrum-daily-empty",
  "scrum-observed-scope",
  "scrum-daily-observations-export-help",
  "scrum-import-pending",
  "sync-conflict-heading",
  "sync-conflict-hint",
  "sync-conflict-local",
  "sync-conflict-keep-local",
  "sync-conflict-use-source",
  "sync-conflict-refresh",
  "sync-conflict-review-complete",
  "sync-conflict-duplicate",
  "sync-conflict-keep-mapping",
  "sync-conflict-detach",
  "sync-conflict-detach-hint",
  "sync-conflict-archive",
  "sync-conflict-archive-hint",
  "sync-conflict-keep-card-local",
  "sync-conflict-creation",
  "sync-conflict-creation-hint",
  "sync-conflict-create-replacement",
  "sync-preview-button",
  "sync-preview-heading",
  "sync-preview-saved",
  "sync-preview-unavailable",
  "sync-preview-blocked",
  "sync-preview-create",
  "sync-preview-update",
  "sync-preview-archive",
  "sync-preview-baseline",
  "sync-preview-truncated",
  "sync-preview-omissions",
  "sync-preview-scope",
  "sync-preview-excluded",
  "sync-preview-unmapped",
  "sync-preview-parser-warnings",
  "sync-preview-parser-unsupported",
  "sync-source-heading",
  "sync-source-scope",
  "sync-source-unmapped",
  "sync-source-excluded",
  "sync-source-converted",
  "sync-source-fallback",
  "sync-source-excluded-item",
  "sync-source-occurrences",
  "sync-source-truncated",
  "sync-source-omitted",
  "sync-report-button",
  "sync-report-retention",
  "sync-report-partial",
  "sync-report-unfinished",
  "sync-report-failed",
  "sync-report-completed",
  "sync-report-completed-with-warnings",
  "sync-report-skipped",
  "sync-report-review-only",
  "sync-report-unavailable",
  "sync-report-empty",
  "sync-recovery-heading",
  "sync-recovery-description",
  "sync-recovery-unavailable",
  "sync-recovery-all",
  "sync-estimate-field",
  "sync-estimate-field-hint",
  "email-recovery-heading",
  "email-recovery-description",
  "email-recovery-saving",
  "email-recovery-queued",
  "email-recovery-retrying",
  "email-recovery-attempts",
  "email-recovery-oldest",
  "email-recovery-next",
  "email-recovery-changed",
  "email-recovery-pause",
  "email-recovery-resume",
  "email-recovery-cancel"
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

assert.notEqual(locale['scrum-added'], locale['scrum-removed']);
assert.notEqual(locale['scrum-completed'], locale['scrum-incomplete']);
assert.notEqual(locale['scrum-event-review'], locale['scrum-event-retrospective']);
assert.match(locale['scrum-report-help'], /ankoth.*a-denewen.*nyns yns.*vann/);
assert.match(locale['scrum-report-help'], /unsesow ha policis.*hepken/);

assert.notEqual(locale['scrum-state-active'], locale['scrum-state-closed']);
assert.notEqual(locale['scrum-state-closed'], locale['scrum-state-cancelled']);
assert.equal(locale['scrum-category-backlog'], locale['scrum-backlog']);
assert.match(locale['scrum-confirm-cancel'], /bys pan vons apoyntys arta/);
assert.match(locale['scrum-partial-report'], /apoyntys dhywgh a-lemmyn hepken/);
for (const key of ['scrum-daily-observations-help', 'scrum-daily-observations-export-help']) {
  assert.ok(locale[key].includes('UTC'), key);
  assert.match(locale[key], /kynsa aspians.*hepkorrys/);
  assert.match(locale[key], /Dismygrivow ankoth nyns yns mann/);
}
assert.match(locale['scrum-daily-truncated'], /366/);

assert.notEqual(locale['sync-conflict-keep-local'], locale['sync-conflict-use-source']);
assert.match(locale['sync-conflict-hint'], /Nyns eus tra danvenys dhe system an pennfenten/);
assert.match(locale['sync-conflict-review-complete'], /rol dien ny veu gwrys/);
assert.match(locale['sync-conflict-detach-hint'], /hepken.*dalgh a drig yn WeKan/);
assert.match(locale['sync-conflict-archive-hint'], /Iskartennow ny vydh chanjys/);
assert.match(locale['sync-conflict-creation-hint'], /garten kyns heb chanj.*Assayow arta.*karten nowydh arta/);


assert.equal(locale['sync-preview-unmapped'], locale['sync-source-unmapped']);
assert.equal(locale['sync-preview-excluded'], locale['sync-source-excluded']);
assert.match(locale['sync-preview-truncated'], /100/);
assert.match(locale['sync-source-truncated'], /100/);
assert.match(locale['sync-report-retention'], /20.*30/);
assert.match(locale['sync-source-scope'], /gwerthow nyns yns diskwedhys/);
assert.match(locale['sync-report-partial'], /ny wra pesya.*na y dhiswul/);
assert.notEqual(locale['sync-report-failed'], locale['sync-report-completed']);
assert.notEqual(locale['sync-preview-create'], locale['sync-preview-archive']);

assert.match(locale['sync-recovery-description'], /30.*ID.*ny yll pesya.*diswul/);
assert.match(locale['sync-estimate-field-hint'], /ID.*Jira.*hepkorrys.*null.*dhilea/);
assert.notEqual(locale['email-recovery-pause'], locale['email-recovery-resume']);
assert.notEqual(locale['email-recovery-pause'], locale['email-recovery-cancel']);
assert.match(locale['email-recovery-description'], /messajys a-lemmyn ha messajys a dheu/);
assert.match(locale['email-recovery-description'], /bys dhe dermyn an govyn/);
assert.match(locale['email-recovery-description'], /Ny yllir gervel dhe-dre.*ansur.*daswrys/);
assert.match(locale['email-recovery-description'], /hag a berth an powes a-lemmyn/);
console.log('Cornish translation batch checks passed');
