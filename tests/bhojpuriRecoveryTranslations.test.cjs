'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const english=require('../imports/i18n/data/en.i18n.json');
const locale=require('../imports/i18n/data/bho.i18n.json');
const {translationTokens}=require('../releases/translations/placeholder-tokens.mjs');
const keys=["sync-report-retention", "sync-report-partial", "sync-report-unfinished", "sync-report-failed", "sync-report-completed", "sync-report-completed-with-warnings", "sync-report-skipped", "sync-report-review-only", "sync-report-unavailable", "sync-report-empty", "sync-recovery-heading", "sync-recovery-description", "sync-recovery-unavailable", "sync-recovery-all", "sync-estimate-field", "sync-estimate-field-hint", "sync-original-time", "sync-remaining-time", "sync-time-estimate-hint", "email-failure-smtp-temporary", "email-failure-smtp-rejected", "email-failure-smtp-authentication", "email-failure-smtp-configuration", "email-failure-recipient-unavailable", "email-failure-delivery-unconfirmed", "email-failure-acknowledgement-failed", "email-failure-delivery-failed", "email-failure-retry-limit", "activity-recovery-heading", "activity-recovery-description", "activity-recovery-empty", "activity-recovery-unavailable", "activity-recovery-retry", "activity-recovery-retrying", "activity-recovery-status-pending", "activity-recovery-status-preparing", "activity-recovery-status-processing", "activity-recovery-status-missing", "activity-recovery-status-changed", "activity-recovery-status-invalid", "activity-recovery-status-inconsistent", "activity-recovery-busy", "activity-recovery-denied", "activity-recovery-source-unavailable", "activity-recovery-disabled", "activity-recovery-failed", "activity-recovery-pause", "activity-recovery-resume", "activity-recovery-paused", "activity-recovery-control-conflict", "activity-recovery-control-failed", "activity-recovery-status-cancelled", "activity-recovery-cancel", "activity-recovery-cancel-confirm", "rule-email-recovery-unavailable"];

test('Bhojpuri recovery strings preserve source keys and tokens',()=>{
 assert.deepEqual(Object.keys(locale),Object.keys(english));
 for(const key of keys){
  assert.ok(locale[key].trim(),key);
  assert.notEqual(locale[key],english[key],key);
  assert.deepEqual(translationTokens(locale[key]),translationTokens(english[key]),key);
 }
});
test('Bhojpuri recovery preserves retention, explicit null and distinct delivery states',()=>{
 assert.match(locale['sync-report-retention'],/20.*30/);
 for(const key of ['sync-estimate-field-hint','sync-time-estimate-hint']) assert.ok(locale[key].includes('null'));
 const states=['pending','preparing','processing','missing','changed','invalid','inconsistent'].map(state=>locale['activity-recovery-status-'+state]);
 assert.equal(new Set(states).size,states.length);
 assert.notEqual(locale['email-failure-smtp-temporary'],locale['email-failure-smtp-rejected']);
 assert.match(locale['activity-recovery-description'],/\u0915\u092c\u094b.*\u0928\u093e/);
 assert.notEqual(locale['activity-recovery-pause'],locale['activity-recovery-resume']);
});

test('Bhojpuri cancellation warns against resuming or recalling prior delivery',()=>{
 const warning=locale['activity-recovery-cancel-confirm'];
 assert.match(warning,/\u092b\u0947\u0930 \u091a\u093e\u0932\u0942 \u0928\u093e/);
 assert.match(warning,/\u0935\u093e\u092a\u0938 \u0928\u093e/);
 assert.notEqual(locale['activity-recovery-cancel'],locale['activity-recovery-pause']);
 assert.notEqual(locale['activity-recovery-status-cancelled'],locale['activity-recovery-paused']);
});
