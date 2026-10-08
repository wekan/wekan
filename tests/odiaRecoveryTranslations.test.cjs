'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const english=require('../imports/i18n/data/en.i18n.json');
const locale=require('../imports/i18n/data/or_IN.i18n.json');
const {translationTokens}=require('../releases/translations/placeholder-tokens.mjs');
const keys=["email-failure-smtp-temporary","email-failure-smtp-rejected","email-failure-smtp-authentication","email-failure-smtp-configuration","email-failure-recipient-unavailable","email-failure-delivery-unconfirmed","email-failure-acknowledgement-failed","email-failure-delivery-failed","email-failure-retry-limit","activity-recovery-heading","activity-recovery-description","activity-recovery-empty","activity-recovery-unavailable","activity-recovery-retry","activity-recovery-retrying","activity-recovery-status-pending","activity-recovery-status-preparing","activity-recovery-status-processing","activity-recovery-status-missing","activity-recovery-status-changed","activity-recovery-status-invalid","activity-recovery-status-inconsistent","activity-recovery-busy","activity-recovery-denied","activity-recovery-source-unavailable","activity-recovery-disabled","activity-recovery-failed","activity-recovery-pause","activity-recovery-resume","activity-recovery-paused","activity-recovery-control-conflict","activity-recovery-control-failed","activity-recovery-status-cancelled","activity-recovery-cancel","activity-recovery-cancel-confirm","rule-email-recovery-unavailable"];
test('Odia recovery strings preserve key order and placeholders',()=>{
 assert.deepEqual(Object.keys(locale),Object.keys(english));
 for(const key of keys){
  assert.notEqual(locale[key],english[key],key);
  assert.match(locale[key],/[\u0b00-\u0b7f]/,key);
  assert.deepEqual(translationTokens(locale[key]),translationTokens(english[key]),key);
 }
});
test('Odia recovery preserves cancellation and retry caveats',()=>{
 assert.ok(locale['activity-recovery-description'].includes('\u0b2a\u0b41\u0b28\u0b03\u0b38\u0b43\u0b37\u0b4d\u0b1f\u0b3f \u0b15\u0b30\u0b47 \u0b28\u0b3e\u0b39\u0b3f\u0b01'));
 assert.ok(locale['activity-recovery-cancel-confirm'].includes('\u0b2a\u0b41\u0b23\u0b3f \u0b06\u0b30\u0b2e\u0b4d\u0b2d \u0b39\u0b4b\u0b07\u0b2a\u0b3e\u0b30\u0b3f\u0b2c \u0b28\u0b3e\u0b39\u0b3f\u0b01'));
 assert.ok(locale['activity-recovery-cancel-confirm'].includes('\u0b2b\u0b47\u0b30\u0b3e\u0b07 \u0b28\u0b3f\u0b06\u0b2f\u0b3e\u0b0f \u0b28\u0b3e\u0b39\u0b3f\u0b01'));
 assert.ok(locale['activity-recovery-failed'].includes('\u0b38\u0b02\u0b30\u0b15\u0b4d\u0b37\u0b3f\u0b24'));
 assert.notEqual(locale['activity-recovery-pause'],locale['activity-recovery-cancel']);
 assert.notEqual(locale['email-failure-smtp-temporary'],locale['email-failure-smtp-rejected']);
 for(const key of ['email-failure-smtp-temporary','email-failure-smtp-rejected']) assert.ok(locale[key].includes('SMTP'));
});
