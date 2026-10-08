'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const english=require('../imports/i18n/data/en.i18n.json');
const locale=require('../imports/i18n/data/tk_TM.i18n.json');
const {translationTokens}=require('../releases/translations/placeholder-tokens.mjs');
const keys=["activity-recovery-heading","activity-recovery-description","activity-recovery-empty","activity-recovery-unavailable","activity-recovery-retry","activity-recovery-retrying","activity-recovery-status-pending","activity-recovery-status-preparing","activity-recovery-status-processing","activity-recovery-status-missing","activity-recovery-status-changed","activity-recovery-status-invalid","activity-recovery-status-inconsistent","activity-recovery-busy","activity-recovery-denied","activity-recovery-source-unavailable","activity-recovery-disabled","activity-recovery-failed","activity-recovery-pause","activity-recovery-resume","activity-recovery-paused","activity-recovery-control-conflict","activity-recovery-control-failed","activity-recovery-status-cancelled","activity-recovery-cancel","activity-recovery-cancel-confirm","rule-email-recovery-unavailable"];
test('Turkmen recovery translations preserve order and tokens',()=>{
 assert.deepEqual(Object.keys(locale),Object.keys(english));
 for(const key of keys){
  assert.notEqual(locale[key],english[key],key);
  assert.deepEqual(translationTokens(locale[key]),translationTokens(english[key]),key);
 }
});
test('Turkmen recovery retains cancellation and retry boundaries',()=>{
 assert.ok(locale['activity-recovery-description'].includes('hi\u00e7 ha\u00e7an hereketi t\u00e4zeden d\u00f6retme\u00fd\u00e4r'));
 assert.ok(locale['activity-recovery-source-unavailable'].includes('Hi\u00e7 zat t\u00e4zeden d\u00f6redilmedi'));
 assert.ok(locale['activity-recovery-failed'].includes('Gara\u015f\u00fdan i\u015f saklandy'));
 assert.ok(locale['activity-recovery-denied'].includes('rugsat berme\u00fd\u00e4r'));
 for(const term of ['hemi\u015felik','dowam etdirip bolmaz','nobata go\u00fdlan hatlar','yzyna \u00e7agyrylma\u00fdar']) assert.ok(locale['activity-recovery-cancel-confirm'].includes(term),term);
 assert.equal(new Set(['pause','resume','cancel'].map(k=>locale['activity-recovery-'+k])).size,3);
 assert.equal(new Set(['missing','changed','invalid','inconsistent'].map(k=>locale['activity-recovery-status-'+k])).size,4);
});
