'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const english=require('../imports/i18n/data/en.i18n.json');
const locale=require('../imports/i18n/data/kok.i18n.json');
const {translationTokens}=require('../releases/translations/placeholder-tokens.mjs');
const keys=["sync-conflict-heading", "sync-conflict-hint", "sync-conflict-local", "sync-conflict-keep-local", "sync-conflict-use-source", "sync-conflict-refresh", "sync-conflict-review-complete", "sync-conflict-duplicate", "sync-conflict-keep-mapping", "sync-conflict-detach", "sync-conflict-detach-hint", "sync-conflict-archive", "sync-conflict-archive-hint", "sync-conflict-keep-card-local", "sync-conflict-creation", "sync-conflict-creation-hint", "sync-conflict-create-replacement", "sync-preview-button", "sync-preview-heading", "sync-preview-saved", "sync-preview-unavailable", "sync-preview-blocked", "sync-preview-create", "sync-preview-update", "sync-preview-archive", "sync-preview-baseline", "sync-preview-truncated", "sync-preview-omissions", "sync-preview-scope", "sync-preview-excluded", "sync-preview-unmapped", "sync-preview-parser-warnings", "sync-preview-parser-unsupported", "sync-source-heading", "sync-source-scope", "sync-source-unmapped", "sync-source-excluded", "sync-source-converted", "sync-source-fallback", "sync-source-excluded-item", "sync-source-occurrences", "sync-source-truncated", "sync-source-omitted", "sync-report-button", "sync-report-retention", "sync-report-partial", "sync-report-unfinished", "sync-report-failed", "sync-report-completed", "sync-report-completed-with-warnings", "sync-report-skipped", "sync-report-review-only", "sync-report-unavailable", "sync-report-empty", "sync-recovery-heading", "sync-recovery-description", "sync-recovery-unavailable", "sync-recovery-all", "sync-estimate-field", "sync-estimate-field-hint", "email-failure-smtp-temporary", "email-failure-smtp-rejected", "email-failure-smtp-authentication", "email-failure-smtp-configuration", "email-failure-recipient-unavailable", "email-failure-delivery-unconfirmed", "email-failure-acknowledgement-failed", "email-failure-delivery-failed", "email-failure-retry-limit", "sync-original-time", "sync-remaining-time", "sync-time-estimate-hint"];
test('Konkani Sync translations preserve order, script and tokens',()=>{
 assert.deepEqual(Object.keys(locale),Object.keys(english));
 for(const key of keys){
  assert.notEqual(locale[key],english[key],key);
  assert.match(locale[key],/[\u0900-\u097f]/,key);
  assert.deepEqual(translationTokens(locale[key]),translationTokens(english[key]),key);
 }
});
test('Konkani conflict guidance retains local data and retry behavior',()=>{
 assert.ok(locale['sync-conflict-hint'].includes('\u0938\u094d\u0930\u094b\u0924 \u092a\u094d\u0930\u0923\u093e\u0932\u0940\u0915 \u0915\u093e\u0902\u092f\u091a \u0927\u093e\u0921\u0928\u093e\u0924'));
 assert.ok(locale['sync-conflict-review-complete'].includes('\u092a\u0941\u0930\u093e\u092f \u0935\u0933\u0947\u0930\u0947\u091a\u0947\u0902 \u0938\u092e\u0915\u094d\u0930\u092e\u0923 \u091a\u0932\u092f\u0932\u0947\u0902 \u0928\u093e'));
 assert.ok(locale['sync-conflict-detach-hint'].includes('\u092b\u0915\u0924 \u0938\u092e\u0915\u094d\u0930\u092e\u0923 \u091c\u094b\u0921\u0923\u0940 \u0915\u093e\u0921\u093e\u0924'));
 assert.ok(locale['sync-conflict-detach-hint'].includes('\u0906\u0936\u092f WeKan\u093e\u0902\u0924 \u0930\u093e\u0935\u0924\u093e'));
 assert.ok(locale['sync-conflict-archive-hint'].includes('\u0909\u092a\u0915\u093e\u0930\u094d\u0921\u093e\u0902 \u092c\u0926\u0932\u0928\u093e\u0924'));
 assert.ok(locale['sync-conflict-creation-hint'].includes('\u0924\u0940\u091a \u092c\u0926\u0932\u0940 \u092a\u094d\u0930\u0924'));
 assert.notEqual(locale['sync-conflict-keep-local'],locale['sync-conflict-use-source']);
});
test('Konkani Sync preview preserves limits and omitted-value guidance',()=>{
 assert.ok(locale['sync-preview-truncated'].includes('100'));
 assert.ok(locale['sync-source-scope'].includes('\u092e\u094b\u0932\u093e\u0902 \u0926\u093e\u0916\u092f\u0928\u093e\u0924'));
 assert.equal(locale['sync-preview-unmapped'],locale['sync-source-unmapped']);
 assert.equal(locale['sync-preview-excluded'],locale['sync-source-excluded']);
 assert.equal(new Set(['create','update','archive'].map(k=>locale['sync-preview-'+k])).size,3);
 assert.ok(locale['sync-preview-unavailable'].includes('\u092a\u092f\u0932\u0940\u0902'));
});
test('Konkani run reports preserve retention and uncertain outcomes',()=>{
 assert.ok(locale['sync-report-retention'].includes('20'));
 assert.ok(locale['sync-report-retention'].includes('30 \u0926\u0940\u0938'));
 assert.ok(locale['sync-source-truncated'].includes('100'));
 assert.ok(locale['sync-report-partial'].includes('\u092a\u0930\u0924 \u0938\u0941\u0930\u0942 \u0915\u0930\u093f\u0928\u093e\u0924'));
 assert.ok(locale['sync-report-partial'].includes('\u092c\u0926\u0932 \u092b\u093e\u091f\u0940\u0902 \u0918\u0947\u0928\u093e\u0924'));
 assert.ok(locale['sync-recovery-description'].includes('\u0905\u091c\u0942\u0928 \u091a\u093e\u0932\u0942 \u0935\u093e \u092e\u0926\u0940\u0902\u091a \u0925\u093e\u0902\u092c\u093f\u0932\u094d\u0932\u0947\u0902'));
 assert.ok(locale['sync-report-unavailable'].includes('\u092a\u0941\u0930\u093e\u092f \u0935\u0933\u0947\u0930\u0947\u0902\u0924 \u092c\u0930\u094b\u0935\u092a\u093e\u091a\u094b \u0905\u0927\u093f\u0915\u093e\u0930'));
});
test('Konkani estimate and mail diagnostics preserve null semantics and delivery uncertainty',()=>{
 for(const key of ['sync-estimate-field-hint','sync-time-estimate-hint']){
  for(const term of ['Jira','\u0928\u093e\u0936\u093f\u0932\u094d\u0932\u0940\u0902 \u092e\u094b\u0932\u093e\u0902 \u0938\u094b\u0921\u0942\u0928 \u0926\u093f\u0924\u093e\u0924','\u0938\u094d\u092a\u0937\u094d\u091f null','\u092a\u0941\u0938\u0924\u093e']) assert.ok(locale[key].includes(term),key+term);
 }
 assert.ok(locale['sync-time-estimate-hint'].includes('\u0928\u0947\u092e\u0915\u0947\u0902 \u090f\u0915 \u091c\u0941\u0933\u092a\u0940 \u0915\u094d\u0937\u0947\u0924\u094d\u0930'));
 for(const key of ['sync-original-time','sync-remaining-time']) assert.ok(locale[key].includes('(\u0935\u0930\u093e\u0902)'));
 assert.notEqual(locale['email-failure-smtp-temporary'],locale['email-failure-smtp-rejected']);
 assert.ok(locale['email-failure-delivery-unconfirmed'].includes('\u092a\u0930\u0924 \u092f\u0924\u094d\u0928 \u0915\u0930\u091a\u0947 \u092a\u092f\u0932\u0940\u0902 \u0924\u092a\u093e\u0938\u093e\u0924'));
 assert.notEqual(locale['email-failure-delivery-unconfirmed'],locale['email-failure-acknowledgement-failed']);
});
