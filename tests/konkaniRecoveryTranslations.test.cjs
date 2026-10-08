'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const english=require('../imports/i18n/data/en.i18n.json');
const locale=require('../imports/i18n/data/kok.i18n.json');
const {translationTokens}=require('../releases/translations/placeholder-tokens.mjs');
const keys=["activity-recovery-heading","activity-recovery-description","activity-recovery-empty","activity-recovery-unavailable","activity-recovery-retry","activity-recovery-retrying","activity-recovery-status-pending","activity-recovery-status-preparing","activity-recovery-status-processing","activity-recovery-status-missing","activity-recovery-status-changed","activity-recovery-status-invalid","activity-recovery-status-inconsistent","activity-recovery-busy","activity-recovery-denied","activity-recovery-source-unavailable","activity-recovery-disabled","activity-recovery-failed","activity-recovery-pause","activity-recovery-resume","activity-recovery-paused","activity-recovery-control-conflict","activity-recovery-control-failed","activity-recovery-status-cancelled","activity-recovery-cancel","activity-recovery-cancel-confirm","rule-email-recovery-unavailable"];
test('Konkani recovery translations preserve order, script and tokens',()=>{
 assert.deepEqual(Object.keys(locale),Object.keys(english));
 for(const key of keys){
  assert.notEqual(locale[key],english[key],key);
  assert.match(locale[key],/[\u0900-\u097f]/,key);
  assert.deepEqual(translationTokens(locale[key]),translationTokens(english[key]),key);
 }
});
test('Konkani recovery messages preserve cancellation and retry boundaries',()=>{
 assert.ok(locale['activity-recovery-description'].includes('\u0915\u0947\u0928\u094d\u0928\u093e\u091a \u092a\u0930\u0924 \u0924\u092f\u093e\u0930 \u091c\u093e\u092f\u0928\u093e'));
 assert.ok(locale['activity-recovery-source-unavailable'].includes('\u0915\u093e\u0902\u092f\u091a \u092a\u0930\u0924 \u0924\u092f\u093e\u0930 \u0915\u0930\u0942\u0902\u0915 \u0928\u093e'));
 assert.ok(locale['activity-recovery-failed'].includes('\u092a\u094d\u0930\u0932\u0902\u092c\u093f\u0924 \u0915\u093e\u092e \u0930\u093e\u0916\u0942\u0928'));
 assert.ok(locale['activity-recovery-denied'].includes('\u092a\u0930\u0935\u093e\u0928\u0917\u0940 \u0926\u093f\u0928\u093e\u0924'));
 for(const term of ['\u0915\u093e\u092f\u092e\u091a\u0947\u0902','\u092a\u0930\u0924 \u0938\u0941\u0930\u0942 \u0915\u0930\u0942\u0902\u0915 \u092e\u0947\u0933\u091a\u0947\u0902 \u0928\u093e','\u0930\u093e\u0902\u0917\u0947\u0902\u0924 \u0906\u0936\u093f\u0932\u094d\u0932\u0947 \u0908\u092e\u0947\u0932','\u092a\u094b\u091a\u093f\u0932\u094d\u0932\u094d\u092f\u094b \u0905\u0927\u093f\u0938\u0942\u091a\u0928\u093e \u092a\u0930\u0924 \u092e\u093e\u0917\u092f\u0928\u093e\u0924']) assert.ok(locale['activity-recovery-cancel-confirm'].includes(term),term);
 assert.equal(new Set(['pause','resume','cancel'].map(k=>locale['activity-recovery-'+k])).size,3);
 assert.equal(new Set(['missing','changed','invalid','inconsistent'].map(k=>locale['activity-recovery-status-'+k])).size,4);
 assert.ok(locale['activity-recovery-control-conflict'].includes('\u092a\u0930\u0924 \u092f\u0924\u094d\u0928 \u0915\u0930\u091a\u0947 \u092a\u092f\u0932\u0940\u0902'));
});
