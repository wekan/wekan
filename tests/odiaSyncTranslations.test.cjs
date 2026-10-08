'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const english=require('../imports/i18n/data/en.i18n.json');
const locale=require('../imports/i18n/data/or_IN.i18n.json');
const {translationTokens}=require('../releases/translations/placeholder-tokens.mjs');
const keys=["scrum-import-pending", "sync-conflict-heading", "sync-conflict-hint", "sync-conflict-local", "sync-conflict-keep-local", "sync-conflict-use-source", "sync-conflict-refresh", "sync-conflict-review-complete", "sync-conflict-duplicate", "sync-conflict-keep-mapping", "sync-conflict-detach", "sync-conflict-detach-hint", "sync-conflict-archive", "sync-conflict-archive-hint", "sync-conflict-keep-card-local", "sync-conflict-creation", "sync-conflict-creation-hint", "sync-conflict-create-replacement", "sync-preview-button", "sync-preview-heading", "sync-preview-saved", "sync-preview-unavailable", "sync-preview-blocked", "sync-preview-create", "sync-preview-update", "sync-preview-archive", "sync-preview-baseline", "sync-preview-truncated", "sync-preview-omissions", "sync-preview-scope", "sync-preview-excluded", "sync-preview-unmapped", "sync-preview-parser-warnings", "sync-preview-parser-unsupported", "sync-source-heading", "sync-source-scope", "sync-source-unmapped", "sync-source-excluded", "sync-source-converted", "sync-source-fallback", "sync-source-excluded-item", "sync-source-occurrences", "sync-source-truncated", "sync-source-omitted", "sync-report-button", "sync-report-retention", "sync-report-partial", "sync-report-unfinished", "sync-report-failed", "sync-report-completed", "sync-report-completed-with-warnings", "sync-report-skipped", "sync-report-review-only", "sync-report-unavailable", "sync-report-empty", "sync-recovery-heading", "sync-recovery-description", "sync-recovery-unavailable", "sync-recovery-all", "sync-estimate-field", "sync-estimate-field-hint", "sync-original-time", "sync-remaining-time", "sync-time-estimate-hint"];
test('Odia sync translations preserve key order, script and tokens',()=>{
 assert.deepEqual(Object.keys(locale),Object.keys(english));
 for(const key of keys){
  assert.notEqual(locale[key],english[key],key);
  assert.match(locale[key],/[\u0b00-\u0b7f]/,key);
  assert.deepEqual(translationTokens(locale[key]),translationTokens(english[key]),key);
 }
});
test('Odia sync guidance preserves review scope and local data',()=>{
 assert.ok(locale['sync-conflict-hint'].includes('\u0b15\u0b3f\u0b1b\u0b3f \u0b2a\u0b20\u0b3e\u0b2f\u0b3e\u0b0f \u0b28\u0b3e\u0b39\u0b3f\u0b01'));
 assert.ok(locale['sync-conflict-review-complete'].includes('\u0b38\u0b2e\u0b4d\u0b2a\u0b42\u0b30\u0b4d\u0b23\u0b4d\u0b23 \u0b24\u0b3e\u0b32\u0b3f\u0b15\u0b3e\u0b30 \u0b38\u0b3f\u0b19\u0b4d\u0b15\u0b4d \u0b1a\u0b32\u0b3e\u0b2f\u0b3e\u0b07\u0b28\u0b3e\u0b39\u0b3f\u0b01'));
 assert.ok(locale['sync-conflict-archive-hint'].includes('\u0b09\u0b2a\u0b15\u0b3e\u0b30\u0b4d\u0b21\u0b17\u0b41\u0b21\u0b3c\u0b3f\u0b15 \u0b2c\u0b26\u0b33\u0b3e\u0b2f\u0b3e\u0b0f \u0b28\u0b3e\u0b39\u0b3f\u0b01'));
 assert.ok(locale['sync-conflict-detach-hint'].includes('\u0b2c\u0b3f\u0b37\u0b5f\u0b2c\u0b38\u0b4d\u0b24\u0b41 WeKan \u0b30\u0b47 \u0b30\u0b39\u0b3f\u0b2c'));
 assert.notEqual(locale['sync-conflict-keep-local'],locale['sync-conflict-use-source']);
 assert.ok(locale['scrum-import-pending'].includes('\u0b09\u0b2a\u0b32\u0b2c\u0b4d\u0b27 \u0b28\u0b3e\u0b39\u0b3f\u0b01'));
});

test('Odia sync preview preserves replacement reuse and preview limits',()=>{
 assert.ok(locale['sync-conflict-creation-hint'].includes('\u0b05\u0b2a\u0b30\u0b3f\u0b2c\u0b30\u0b4d\u0b24\u0b4d\u0b24\u0b3f\u0b24'));
 assert.ok(locale['sync-conflict-creation-hint'].includes('\u0b2a\u0b41\u0b23\u0b3f \u0b2c\u0b4d\u0b5f\u0b2c\u0b39\u0b3e\u0b30'));
 assert.ok(locale['sync-preview-truncated'].includes('100'));
 assert.ok(locale['sync-preview-scope'].includes('\u0b1b\u0b3e\u0b21\u0b3c\u0b3f \u0b26\u0b47\u0b07\u0b2a\u0b3e\u0b30\u0b47'));
 assert.equal(new Set(['create','update','archive'].map(action=>locale['sync-preview-'+action])).size,3);
 assert.notEqual(locale['sync-preview-excluded'],locale['sync-preview-unmapped']);
 assert.ok(locale['sync-preview-unavailable'].includes('\u0b2a\u0b42\u0b30\u0b4d\u0b2c\u0b30\u0b41'));
});

test('Odia sync reports retain limits, hidden values and partial-change caveats',()=>{
 assert.ok(locale['sync-source-truncated'].includes('100'));
 for(const number of ['20','30']) assert.ok(locale['sync-report-retention'].includes(number));
 assert.ok(locale['sync-source-scope'].includes('\u0b2e\u0b42\u0b32\u0b4d\u0b5f \u0b26\u0b47\u0b16\u0b3e\u0b2f\u0b3e\u0b0f \u0b28\u0b3e\u0b39\u0b3f\u0b01'));
 assert.ok(locale['sync-report-partial'].includes('\u0b2a\u0b41\u0b23\u0b3f \u0b1a\u0b32\u0b3e\u0b0f \u0b28\u0b3e\u0b39\u0b3f\u0b01'));
 assert.ok(locale['sync-report-partial'].includes('\u0b2a\u0b42\u0b30\u0b4d\u0b2c\u0b2c\u0b24\u0b4d \u0b15\u0b30\u0b47 \u0b28\u0b3e\u0b39\u0b3f\u0b01'));
 for(const suffix of ['unmapped','excluded']) assert.equal(locale['sync-source-'+suffix],locale['sync-preview-'+suffix]);
 assert.equal(new Set(['failed','unfinished','completed','completed-with-warnings','skipped'].map(state=>locale['sync-report-'+state])).size,5);
});

test('Odia diagnostics and estimates retain access and data-handling requirements',()=>{
 for(const term of ['30','ID']) assert.ok(locale['sync-recovery-description'].includes(term));
 assert.ok(locale['sync-report-unavailable'].includes('\u0b32\u0b47\u0b16\u0b3f\u0b2c\u0b3e \u0b05\u0b27\u0b3f\u0b15\u0b3e\u0b30'));
 assert.ok(locale['sync-recovery-description'].includes('\u0b15\u0b30\u0b3f\u0b2a\u0b3e\u0b30\u0b3f\u0b2c \u0b28\u0b3e\u0b39\u0b3f\u0b01'));
 for(const key of ['sync-estimate-field-hint','sync-time-estimate-hint']){
  assert.ok(locale[key].includes('Jira'));
  assert.ok(locale[key].includes('null'));
  assert.ok(locale[key].includes('\u0b05\u0b23\u0b26\u0b47\u0b16\u0b3e'));
  assert.ok(locale[key].includes('\u0b38\u0b2b\u0b3e'));
 }
 assert.ok(locale['sync-time-estimate-hint'].includes('\u0b20\u0b3f\u0b15\u0b4d \u0b17\u0b4b\u0b1f\u0b3f\u0b0f'));
 for(const key of ['sync-original-time','sync-remaining-time']) assert.ok(locale[key].includes('\u0b18\u0b23\u0b4d\u0b1f\u0b3e'));
});
