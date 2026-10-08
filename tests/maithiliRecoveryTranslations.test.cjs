'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const english=require('../imports/i18n/data/en.i18n.json');
const locale=require('../imports/i18n/data/mai.i18n.json');
const {translationTokens}=require('../releases/translations/placeholder-tokens.mjs');
const keys=["email-failure-smtp-temporary","email-failure-smtp-rejected","email-failure-smtp-authentication","email-failure-smtp-configuration","email-failure-recipient-unavailable","email-failure-delivery-unconfirmed","email-failure-acknowledgement-failed","email-failure-delivery-failed","email-failure-retry-limit","sync-remaining-time","sync-time-estimate-hint","activity-recovery-heading","activity-recovery-description","activity-recovery-empty","activity-recovery-unavailable","activity-recovery-retry","activity-recovery-retrying","activity-recovery-status-pending","activity-recovery-status-preparing","activity-recovery-status-processing","activity-recovery-status-missing","activity-recovery-status-changed","activity-recovery-status-invalid","activity-recovery-status-inconsistent","activity-recovery-busy","activity-recovery-denied","activity-recovery-source-unavailable","activity-recovery-disabled","activity-recovery-failed","activity-recovery-pause","activity-recovery-resume","activity-recovery-paused","activity-recovery-control-conflict","activity-recovery-control-failed","activity-recovery-status-cancelled","activity-recovery-cancel","activity-recovery-cancel-confirm","rule-email-recovery-unavailable"];
test('Maithili recovery translations preserve order, script and tokens',()=>{
 assert.deepEqual(Object.keys(locale),Object.keys(english));
 for(const key of keys){
  assert.notEqual(locale[key],english[key],key);
  assert.match(locale[key],/[\u0900-\u097f]/,key);
  assert.deepEqual(translationTokens(locale[key]),translationTokens(english[key]),key);
 }
});
test('Maithili recovery preserves cancellation and retry limitations',()=>{
 assert.ok(locale['activity-recovery-description'].includes('\u0926\u094b\u092c\u093e\u0930\u093e \u0928\u0939\u093f \u092c\u0928\u092c\u0948\u0924'));
 assert.ok(locale['activity-recovery-cancel-confirm'].includes('\u092b\u0947\u0930 \u0938\u0901 \u0936\u0941\u0930\u0942 \u0928\u0939\u093f'));
 assert.ok(locale['activity-recovery-cancel-confirm'].includes('\u0935\u093e\u092a\u0938 \u0928\u0939\u093f \u0932\u0947\u0932'));
 assert.ok(locale['activity-recovery-failed'].includes('\u0938\u0941\u0930\u0915\u094d\u0937\u093f\u0924 \u0930\u093e\u0916\u0932'));
 assert.notEqual(locale['activity-recovery-pause'],locale['activity-recovery-cancel']);
 assert.notEqual(locale['email-failure-smtp-temporary'],locale['email-failure-smtp-rejected']);
 for(const term of ['Jira','null','\u0920\u0940\u0915 \u090f\u0915\u091f\u093e','\u091b\u094b\u0921\u093c\u0932','\u0938\u093e\u092b']) assert.ok(locale['sync-time-estimate-hint'].includes(term));
 assert.ok(locale['sync-remaining-time'].includes('\u0918\u0902\u091f\u093e'));
});
