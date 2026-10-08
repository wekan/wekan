'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const english=require('../imports/i18n/data/en.i18n.json');
const locale=require('../imports/i18n/data/mai.i18n.json');
const {translationTokens}=require('../releases/translations/placeholder-tokens.mjs');
const keys=["scrum-observed-scope", "scrum-daily-observations-export-help", "scrum-import-pending", "sync-conflict-heading", "sync-conflict-hint", "sync-conflict-local", "sync-conflict-keep-local", "sync-conflict-use-source", "sync-conflict-refresh", "sync-conflict-review-complete", "sync-conflict-duplicate", "sync-conflict-keep-mapping", "sync-conflict-detach", "sync-conflict-detach-hint", "sync-conflict-archive", "sync-conflict-archive-hint", "sync-conflict-keep-card-local", "sync-conflict-creation", "sync-conflict-creation-hint", "sync-conflict-create-replacement", "sync-preview-button", "sync-preview-heading", "sync-preview-saved", "sync-preview-unavailable", "sync-preview-blocked", "sync-preview-create", "sync-preview-update", "sync-preview-archive", "sync-preview-baseline", "sync-preview-truncated", "sync-preview-omissions", "sync-preview-scope", "sync-preview-excluded", "sync-preview-unmapped", "sync-preview-parser-warnings", "sync-preview-parser-unsupported", "sync-source-heading", "sync-source-scope", "sync-source-unmapped", "sync-source-excluded", "sync-source-converted", "sync-source-fallback", "sync-source-excluded-item", "sync-source-occurrences", "sync-source-truncated", "sync-source-omitted", "sync-report-button", "sync-report-retention", "sync-report-partial", "sync-report-unfinished", "sync-report-failed", "sync-report-completed", "sync-report-completed-with-warnings", "sync-report-skipped", "sync-report-review-only", "sync-report-unavailable", "sync-report-empty", "sync-recovery-heading", "sync-recovery-description", "sync-recovery-unavailable", "sync-recovery-all", "sync-estimate-field", "sync-estimate-field-hint", "sync-original-time"];
test('Maithili sync translations preserve order, script and tokens',()=>{
 assert.deepEqual(Object.keys(locale),Object.keys(english));
 for(const key of keys){
  assert.notEqual(locale[key],english[key],key);
  assert.match(locale[key],/[\u0900-\u097f]/,key);
  assert.deepEqual(translationTokens(locale[key]),translationTokens(english[key]),key);
 }
});
test('Maithili sync conflicts preserve local data and review scope',()=>{
 assert.ok(locale['sync-conflict-hint'].includes('\u0915\u093f\u091b\u0941 \u0928\u0939\u093f \u092a\u0920\u093e\u0913\u0932'));
 assert.ok(locale['sync-conflict-review-complete'].includes('\u092a\u0942\u0930\u093e \u0938\u0942\u091a\u0940\u0915 \u0938\u093f\u0902\u0915 \u0928\u0939\u093f'));
 assert.ok(locale['sync-conflict-detach-hint'].includes('\u0938\u093e\u092e\u0917\u094d\u0930\u0940 WeKan \u092e\u0947 \u0930\u0939\u0924'));
 assert.ok(locale['sync-conflict-archive-hint'].includes('\u0909\u092a\u0915\u093e\u0930\u094d\u0921 \u0938\u092d \u0928\u0939\u093f \u092c\u0926\u0932\u0948\u0924'));
 assert.ok(locale['sync-conflict-creation-hint'].includes('\u092a\u091b\u093f\u0932\u093e \u0915\u093e\u0930\u094d\u0921 \u092c\u093f\u0928\u093e \u092c\u0926\u0932\u0928\u0947'));
 assert.notEqual(locale['sync-conflict-keep-local'],locale['sync-conflict-use-source']);
 assert.ok(locale['scrum-import-pending'].includes('\u0909\u092a\u0932\u092c\u094d\u0927 \u0928\u0939\u093f'));
 assert.ok(locale['scrum-daily-observations-export-help'].includes('UTC'));
});

test('Maithili sync previews preserve limits and omitted data caveats',()=>{
 assert.ok(locale['sync-preview-truncated'].includes('100'));
 assert.ok(locale['sync-preview-scope'].includes('\u091b\u094b\u0921\u093c\u093f \u0938\u0915\u0948\u0924 \u0905\u091b\u093f'));
 assert.ok(locale['sync-source-scope'].includes('\u092e\u093e\u0928 \u0928\u0939\u093f \u0926\u0947\u0916\u093e\u0913\u0932'));
 assert.ok(locale['sync-preview-unavailable'].includes('\u092a\u0939\u093f\u0928\u0947'));
 for(const suffix of ['unmapped','excluded']) assert.equal(locale['sync-source-'+suffix],locale['sync-preview-'+suffix]);
 assert.equal(new Set(['create','update','archive'].map(k=>locale['sync-preview-'+k])).size,3);
 assert.notEqual(locale['sync-preview-excluded'],locale['sync-preview-unmapped']);
});

test('Maithili sync reports preserve retention and partial-change caveats',()=>{
 assert.ok(locale['sync-source-truncated'].includes('100'));
 for(const n of ['20','30']) assert.ok(locale['sync-report-retention'].includes(n));
 assert.ok(locale['sync-report-partial'].includes('\u092a\u0942\u0930\u094d\u0935\u0935\u0924 \u0928\u0939\u093f'));
 assert.ok(locale['sync-report-unavailable'].includes('\u0932\u093f\u0916\u092c\u093e\u0915 \u0905\u0927\u093f\u0915\u093e\u0930'));
 for(const term of ['30','ID']) assert.ok(locale['sync-recovery-description'].includes(term));
 for(const term of ['Jira','ID','null','\u091b\u094b\u0921\u093c\u0932','\u0938\u093e\u092b']) assert.ok(locale['sync-estimate-field-hint'].includes(term));
 assert.ok(locale['sync-original-time'].includes('\u0918\u0902\u091f\u093e'));
 assert.equal(new Set(['failed','unfinished','completed','completed-with-warnings','skipped'].map(k=>locale['sync-report-'+k])).size,5);
});
