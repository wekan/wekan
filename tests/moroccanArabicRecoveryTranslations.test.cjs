'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const english=require('../imports/i18n/data/en.i18n.json');
const locale=require('../imports/i18n/data/ary.i18n.json');
const {translationTokens}=require('../releases/translations/placeholder-tokens.mjs');
const keys=["sync-estimate-field", "sync-estimate-field-hint", "email-failure-smtp-temporary", "email-failure-smtp-rejected", "email-failure-smtp-authentication", "email-failure-smtp-configuration", "email-failure-recipient-unavailable", "email-failure-delivery-unconfirmed", "email-failure-acknowledgement-failed", "email-failure-delivery-failed", "email-failure-retry-limit", "sync-original-time", "sync-remaining-time", "sync-time-estimate-hint", "activity-recovery-heading", "activity-recovery-description", "activity-recovery-empty", "activity-recovery-unavailable", "activity-recovery-retry", "activity-recovery-retrying", "activity-recovery-status-pending", "activity-recovery-status-preparing", "activity-recovery-status-processing", "activity-recovery-status-missing", "activity-recovery-status-changed", "activity-recovery-status-invalid", "activity-recovery-status-inconsistent", "activity-recovery-busy", "activity-recovery-denied", "activity-recovery-source-unavailable", "activity-recovery-disabled"];
test('Moroccan Arabic recovery translations preserve order, script and tokens',()=>{
 assert.deepEqual(Object.keys(locale),Object.keys(english));
 for(const key of keys){
  assert.notEqual(locale[key],english[key],key);
  assert.match(locale[key],/[\u0600-\u06ff]/,key);
  assert.deepEqual(translationTokens(locale[key]),translationTokens(english[key]),key);
 }
});
test('Moroccan Arabic recovery warnings preserve missing versus null and delivery uncertainty',()=>{
 for(const key of ['sync-estimate-field-hint','sync-time-estimate-hint']){
  assert.match(locale[key],/القيم الناقصة فالمصدر كتتجاهل/);
  assert.match(locale[key],/null صريحة كتمسح/);
 }
 assert.match(locale['sync-time-estimate-hint'],/بالضبط حقل واحد/);
 assert.match(locale['sync-original-time'],/بالساعات/);
 assert.match(locale['sync-remaining-time'],/بالساعات/);
 assert.match(locale['email-failure-smtp-temporary'],/مؤقّت/);
 assert.match(locale['email-failure-smtp-rejected'],/دائم/);
 assert.match(locale['email-failure-delivery-unconfirmed'],/ما قدرناش نأكّدو.*راجع قبل/);
 assert.match(locale['activity-recovery-description'],/ما كتعوّدش تصايب النشاط/);
 assert.match(locale['activity-recovery-source-unavailable'],/ما تعاود تصايب والو/);
 assert.match(locale['activity-recovery-denied'],/ما بقاوش كيسمحو/);
 assert.notEqual(locale['activity-recovery-status-missing'],locale['activity-recovery-status-changed']);
});
