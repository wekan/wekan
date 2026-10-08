'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const english=require('../imports/i18n/data/en.i18n.json');
const locale=require('../imports/i18n/data/ckb.i18n.json');
const {translationTokens}=require('../releases/translations/placeholder-tokens.mjs');
const keys=["sync-conflict-heading", "sync-conflict-hint", "sync-conflict-local", "sync-conflict-keep-local", "sync-conflict-use-source", "sync-conflict-refresh", "sync-conflict-review-complete", "sync-conflict-duplicate", "sync-conflict-keep-mapping", "sync-conflict-detach", "sync-conflict-detach-hint", "sync-conflict-archive", "sync-conflict-archive-hint", "sync-conflict-keep-card-local", "sync-conflict-creation", "sync-conflict-creation-hint", "sync-conflict-create-replacement", "sync-preview-button", "sync-preview-heading", "sync-preview-saved", "sync-preview-unavailable", "sync-preview-blocked", "sync-preview-create", "sync-preview-update", "sync-preview-archive", "sync-preview-baseline", "sync-preview-truncated", "sync-preview-omissions", "sync-preview-scope", "sync-preview-excluded", "sync-preview-unmapped", "sync-preview-parser-warnings", "sync-preview-parser-unsupported", "sync-source-heading", "sync-source-scope", "sync-source-unmapped", "sync-source-excluded", "sync-source-converted", "sync-source-fallback", "sync-source-excluded-item", "sync-source-occurrences", "sync-source-truncated", "sync-source-omitted", "sync-report-button", "sync-report-retention", "sync-report-partial", "sync-report-unfinished", "sync-report-failed", "sync-report-completed", "sync-report-completed-with-warnings", "sync-report-skipped", "sync-report-review-only", "sync-report-unavailable", "sync-report-empty", "sync-recovery-heading", "sync-recovery-description", "sync-recovery-unavailable", "sync-recovery-all", "sync-estimate-field", "sync-estimate-field-hint", "email-failure-smtp-temporary", "email-failure-smtp-rejected", "email-failure-smtp-authentication", "email-failure-smtp-configuration", "email-failure-recipient-unavailable", "email-failure-delivery-unconfirmed", "email-failure-acknowledgement-failed", "email-failure-delivery-failed", "email-failure-retry-limit", "sync-original-time", "sync-remaining-time", "sync-time-estimate-hint", "activity-recovery-heading", "activity-recovery-description", "activity-recovery-empty", "activity-recovery-unavailable", "activity-recovery-retry", "activity-recovery-retrying", "activity-recovery-status-pending", "activity-recovery-status-preparing", "activity-recovery-status-processing", "activity-recovery-status-missing", "activity-recovery-status-changed", "activity-recovery-status-invalid", "activity-recovery-status-inconsistent", "activity-recovery-busy", "activity-recovery-denied", "activity-recovery-source-unavailable", "activity-recovery-disabled", "activity-recovery-failed", "activity-recovery-pause", "activity-recovery-resume", "activity-recovery-paused", "activity-recovery-control-conflict", "activity-recovery-control-failed", "activity-recovery-status-cancelled", "activity-recovery-cancel", "activity-recovery-cancel-confirm", "rule-email-recovery-unavailable"];

test('Central Kurdish Sync strings preserve source keys and tokens',()=>{
 assert.deepEqual(Object.keys(locale),Object.keys(english));
 for(const key of keys){
  assert.ok(locale[key].trim(),key);
  assert.notEqual(locale[key],english[key],key);
  assert.match(locale[key],/[\u0600-\u06ff]/,key);
  assert.deepEqual(translationTokens(locale[key]),translationTokens(english[key]),key);
 }
});
test('Central Kurdish Sync guidance preserves source protection and preview limits',()=>{
 assert.match(locale['sync-conflict-hint'],/\u0646\u0627\u0646\u06ce\u0631\u062f\u0631\u06ce\u062a/);
 assert.match(locale['sync-conflict-archive-hint'],/\u0646\u0627\u06af\u06c6\u0695\u062f\u0631\u06ce\u0646/);
 assert.ok(locale['sync-preview-truncated'].includes('100'));
 assert.equal(locale['sync-preview-unmapped'],locale['sync-source-unmapped']);
 assert.equal(locale['sync-preview-excluded'],locale['sync-source-excluded']);
 assert.notEqual(locale['sync-conflict-keep-local'],locale['sync-conflict-use-source']);
});

test('Central Kurdish diagnostics preserve retention, null handling and delivery distinctions',()=>{
 assert.match(locale['sync-report-retention'],/20.*30/);
 assert.ok(locale['sync-source-truncated'].includes('100'));
 for(const key of ['sync-estimate-field-hint','sync-time-estimate-hint']) assert.ok(locale[key].includes('null'));
 assert.notEqual(locale['email-failure-smtp-temporary'],locale['email-failure-smtp-rejected']);
 assert.notEqual(locale['sync-report-completed'],locale['sync-report-failed']);
 assert.match(locale['activity-recovery-description'],/\u0647\u06d5\u0631\u06af\u06cc\u0632/);
});

test('Central Kurdish recovery distinguishes delivery states and permanent cancellation',()=>{
 const states=['pending','preparing','processing','missing','changed','invalid','inconsistent','cancelled'].map(state=>locale['activity-recovery-status-'+state]);
 assert.equal(new Set(states).size,states.length);
 assert.notEqual(locale['activity-recovery-pause'],locale['activity-recovery-cancel']);
 assert.match(locale['activity-recovery-cancel-confirm'],/\u0646\u0627\u062a\u0648\u0627\u0646\u0631\u06ce\u062a/);
 assert.match(locale['activity-recovery-cancel-confirm'],/\u0646\u0627\u06af\u06d5\u0695\u06ce\u0646\u062f\u0631\u06ce\u0646\u06d5\u0648\u06d5/);
});
