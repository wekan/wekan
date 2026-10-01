'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { translationTokens } = require('../releases/translations/placeholder-tokens.mjs');
const root = path.resolve(__dirname, '..');
const read = code => JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data', code + '.i18n.json'), 'utf8'));
const english = read('en');
const locale = read('yue_CN');
assert.deepEqual(Object.keys(locale), Object.keys(english));
for (const key of ["auto-archive-days","auto-archive-off","auto-archive-hint","filter-recency-any","filter-recency-day","filter-recency-week","filter-recency-month","filter-recency-older","filter-movement-range","filter-date-range-field","filter-date-range-from","filter-date-range-to","filter-date-range-missing","filter-date-range-list-entry","filter-date-range-invalid","filter-due-any","filter-due-previous-week","filter-due-next-month","filter-column-age","filter-column-age-disabled","filter-column-age-days","filter-column-age-hint","advanced-filter-card-dates-hint","import-board-instruction-leo","instance","instance-desc","board-instance-info","automatic-linked-url-schemes-hint","other-parent-cards","add-parent-card"]) {
  assert.ok(locale[key]?.trim(), key);
  assert.notEqual(locale[key], english[key], key);
  assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), key);
  assert.match(locale[key], /[\u3400-\u9fff]/, key);
}
for (const token of ['@createdAt', '@receivedAt', '@startAt', '@dueAt', '@endAt', '@listEnteredAt', "'2026-01-01'", '>=', '= none']) {
  assert.ok(locale['advanced-filter-card-dates-hint'].includes(token), token);
}
for (const token of ['thunderlink', 'onenote', 'javascript', 'data', 'vbscript']) {
  assert.ok(locale['automatic-linked-url-schemes-hint'].includes(token), token);
}
assert.match(locale['auto-archive-hint'], /範本永遠唔會移至存檔/);
assert.match(locale['filter-column-age-hint'], /加入日期不明嘅卡片仍然會顯示/);
assert.match(locale['filter-column-age-hint'], /編輯卡片唔會重設/);
assert.match(locale['instance-desc'], /只有已加入看板嘅人先可以編輯/);
assert.match(locale['board-instance-info'], /<strong>.*<\/strong>/);
assert.match(locale['import-board-instruction-leo'], /Leo.*\.leo/);
console.log('Cantonese filter translations: prose, tokens and restrictions passed');
