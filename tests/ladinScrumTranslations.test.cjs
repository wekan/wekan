'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { translationTokens } = require('../releases/translations/placeholder-tokens.mjs');
const read = code => JSON.parse(fs.readFileSync(path.join(__dirname, '../imports/i18n/data', `${code}.i18n.json`), 'utf8'));
const en = read('en');
const keys = [
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
  "scrum-import-pending"
];
for (const code of ['lld', 'hsb', 'szl', 'wuu-Hans']) {
const locale = read(code);
assert.deepEqual(Object.keys(locale), Object.keys(en));
for (const key of keys) {
  assert.ok(locale[key]?.trim(), key);
  assert.notEqual(locale[key], en[key], `${key}: translated`);
  assert.deepEqual(translationTokens(locale[key]), translationTokens(en[key]), `${key}: exact placeholders`);
  assert.deepEqual(locale[key].match(/\d+/g), en[key].match(/\d+/g), `${key}: numeric limits`);
}
if (code === 'lld') {
// Do not let unknown estimates become zero or daily observations imply complete history.
assert.match(locale['scrum-report-help'], /ne é nia stimes de zero/);
assert.match(locale['scrum-report-help'], /medemes unités de stima y regoles/);
for (const key of ['scrum-daily-observations-help', 'scrum-daily-observations-export-help']) {
  assert.match(locale[key], /UTC/);
  assert.match(locale[key], /dis che manca vën lascés ora/);
  assert.match(locale[key], /ne registrea nia uni mudaziun/);
  assert.match(locale[key], /stimes nia cunescides ne é nia zero/);
}
assert.match(locale['scrum-partial-report'], /demé.*assegnedes a vos/);
assert.match(locale['scrum-import-pending'], /ne é nia fenida.*ne é nia a desposizion/);
assert.notEqual(locale['scrum-state-closed'], locale['scrum-state-cancelled']);
assert.notEqual(locale['scrum-added'], locale['scrum-removed']);
} else if (code === 'hsb') {
 assert.match(locale['scrum-report-help'], /njejsu nulowe šacowanja/);
 assert.match(locale['scrum-report-help'], /samsnych šacowanskich jednotkach a prawidłach/);
 for (const key of ['scrum-daily-observations-help', 'scrum-daily-observations-export-help']) {
  assert.match(locale[key], /UTC/);
  assert.match(locale[key], /[Ff]alowace dny so wuwostaja/);
  assert.match(locale[key], /kóždu změnu.*njezapisuja/);
  assert.match(locale[key], /Njeznate šacowanja njejsu nula/);
 }
 assert.match(locale['scrum-partial-report'], /jenož kartki.*wam tuchwilu přirjadowane/);
 assert.match(locale['scrum-import-pending'], /njeje dospołny.*k dispoziciji njejsu/);
 assert.notEqual(locale['scrum-state-closed'], locale['scrum-state-cancelled']);
 assert.notEqual(locale['scrum-added'], locale['scrum-removed']);
 } else if (code === 'szl') {
 assert.match(locale['scrum-report-help'], /niy sōm ôszacowaniami zerowymi/);
 assert.match(locale['scrum-report-help'], /tych samych jednostkach ôszacowaniŏ i zasadach/);
 for (const key of ['scrum-daily-observations-help', 'scrum-daily-observations-export-help']) {
  assert.match(locale[key], /UTC/);
  assert.match(locale[key], /[Bb]rakujōnce dni sōm pōmijane/);
  assert.match(locale[key], /niy zapisujōm kożdyj zmiany/);
  assert.match(locale[key], /Niyznane ôszacowania niy sōm zerym/);
 }
 assert.match(locale['scrum-partial-report'], /ino karty teroz przipisane tobie/);
 assert.match(locale['scrum-import-pending'], /niy je dokończōny.*niy sōm dostympne/);
 assert.notEqual(locale['scrum-state-closed'], locale['scrum-state-cancelled']);
 assert.notEqual(locale['scrum-added'], locale['scrum-removed']);
 } else {
 assert.match(locale['scrum-report-help'], /勿是零估算/);
 assert.match(locale['scrum-report-help'], /估算单位搭规则一样/);
 for (const key of ['scrum-daily-observations-help', 'scrum-daily-observations-export-help']) {
  assert.match(locale[key], /UTC/);
  assert.match(locale[key], /缺失个日子会略脱/);
  assert.match(locale[key], /勿会记录每一趟改动/);
  assert.match(locale[key], /勿晓得个估算勿是零/);
 }
 assert.match(locale['scrum-partial-report'], /只包括眼前分配拨侬个卡片/);
 assert.match(locale['scrum-import-pending'], /还没做完.*暂时用勿了/);
 assert.notEqual(locale['scrum-state-closed'], locale['scrum-state-cancelled']);
 assert.notEqual(locale['scrum-added'], locale['scrum-removed']);
}
}
console.log('Ladin, Upper Sorbian, Silesian and Wu Scrum translations: 84 messages each passed');
