'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { translationTokens } = require('../releases/translations/placeholder-tokens.mjs');
const read = code => JSON.parse(fs.readFileSync(path.join(__dirname, '../imports/i18n/data', `${code}.i18n.json`), 'utf8'));
const en = read('en');
const keys = [
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
  "sync-original-time",
  "sync-remaining-time",
  "sync-time-estimate-hint"
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
// Preserve the one-way sync boundary and limited effect of detaching a duplicate.
assert.match(locale['sync-conflict-hint'], /ne vën nia mané al sistem de urigin/);
assert.match(locale['sync-conflict-detach-hint'], /demé l colegamënt.*contegn resta te WeKan/);
assert.match(locale['sync-conflict-archive-hint'], /sotciartes ne vën nia mudedes/);
assert.match(locale['sync-conflict-review-complete'], /duta la lista ne é nia unida fata/);
assert.match(locale['sync-report-partial'], /ne continua nia y ne anulea nia/);
assert.match(locale['sync-source-scope'], /valorei ne vën nia mostrés/);
for (const key of ['sync-estimate-field-hint', 'sync-time-estimate-hint']) {
  assert.match(locale[key], /manca vën ignorés/);
  assert.match(locale[key], /null esplizit destuda/);
}
assert.notEqual(locale['sync-report-failed'], locale['sync-report-completed']);
assert.notEqual(locale['sync-preview-create'], locale['sync-preview-archive']);
} else if (code === 'hsb') {
 assert.match(locale['sync-conflict-hint'], /Ničo so do žórłoweho systema njepósćele/);
 assert.match(locale['sync-conflict-detach-hint'], /jenož přirjadowanje.*wobsah we WeKan wostanje/);
 assert.match(locale['sync-conflict-archive-hint'], /Podkartki so njezměnja/);
 assert.match(locale['sync-conflict-review-complete'], /cyłeje lisćiny njeje so wuwjedła/);
 assert.match(locale['sync-report-partial'], /njepokročuja ani njewróća/);
 assert.match(locale['sync-source-scope'], /hódnoty so njepokazuja/);
 for (const key of ['sync-estimate-field-hint', 'sync-time-estimate-hint']) {
  assert.match(locale[key], /hódnoty so ignoruja/);
  assert.match(locale[key], /eksplicitne null.*wotstroni/);
 }
 assert.notEqual(locale['sync-report-failed'], locale['sync-report-completed']);
 assert.notEqual(locale['sync-preview-create'], locale['sync-preview-archive']);
 } else if (code === 'szl') {
 assert.match(locale['sync-conflict-hint'], /Nic niy je wysyłane do zdrzōdłowego systymu/);
 assert.match(locale['sync-conflict-detach-hint'], /ino mapowanie.*treść ôstŏwŏ we WeKan/);
 assert.match(locale['sync-conflict-archive-hint'], /Podkarty niy sōm zmiyniane/);
 assert.match(locale['sync-conflict-review-complete'], /cołkij listy niy była puszczōnŏ/);
 assert.match(locale['sync-report-partial'], /niy wznŏwiajōm ani niy cofajōm/);
 assert.match(locale['sync-source-scope'], /wartości niy sōm pokŏzowane/);
 for (const key of ['sync-estimate-field-hint', 'sync-time-estimate-hint']) {
  assert.match(locale[key], /wartości zdrzōdła sōm ignorowane/);
  assert.match(locale[key], /jawne null czyści/);
 }
 assert.notEqual(locale['sync-report-failed'], locale['sync-report-completed']);
 assert.notEqual(locale['sync-preview-create'], locale['sync-preview-archive']);
 } else {
 assert.match(locale['sync-conflict-hint'], /呒没任何内容会发回源系统/);
 assert.match(locale['sync-conflict-detach-hint'], /只移除.*内容还留勒 WeKan/);
 assert.match(locale['sync-conflict-archive-hint'], /子卡片勿会改动/);
 assert.match(locale['sync-conflict-review-complete'], /整个列表个同步呒没运行过/);
 assert.match(locale['sync-report-partial'], /勿会继续或者撤销运行/);
 assert.match(locale['sync-source-scope'], /值勿会显示/);
 for (const key of ['sync-estimate-field-hint', 'sync-time-estimate-hint']) {
  assert.match(locale[key], /源头缺失个值会忽略/);
  assert.match(locale[key], /明确个 null 会清空/);
 }
 assert.notEqual(locale['sync-report-failed'], locale['sync-report-completed']);
 assert.notEqual(locale['sync-preview-create'], locale['sync-preview-archive']);
}
}
console.log('Ladin, Upper Sorbian, Silesian and Wu Sync translations: 63 messages each passed');
