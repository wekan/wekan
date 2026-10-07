'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const english=require('../imports/i18n/data/en.i18n.json');
const data=require('../imports/i18n/data/nso.i18n.json');
const {translationTokens}=require('../releases/translations/placeholder-tokens.mjs');
const keys=Object.keys(english).filter(k=>/^(r-blocks-|email-failure-|activity-recovery-)/.test(k)||k==='rule-email-recovery-unavailable');

test('Northern Sotho rule and recovery messages preserve tokens and editor constraints',()=>{
 assert.equal(keys.length,46);
 for(const key of keys){
  assert.ok(data[key].trim(),key);
  assert.notEqual(data[key],english[key],key);
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 }
 assert.match(data['r-blocks-invalid'],/se tee fela.*e tee fela.*pele o boloka/);
 assert.match(data['r-blocks-permission'],/molaodi wa poto/);
 assert.match(data['r-blocks-conflict'],/Laetša gape.*pele o boloka/);
 assert.notEqual(data['r-blocks-unsaved'],data['r-blocks-saved']);
});

test('Northern Sotho delivery recovery preserves uncertainty and irreversible cancellation',()=>{
 assert.match(data['email-failure-smtp-temporary'],/SMTP.*nakwana/);
 assert.match(data['email-failure-smtp-rejected'],/SMTP.*sa ruri/);
 assert.match(data['email-failure-delivery-unconfirmed'],/netefatšwa.*hlahloba pele o leka gape/);
 assert.notEqual(data['email-failure-delivery-unconfirmed'],data['email-failure-delivery-failed']);
 assert.match(data['activity-recovery-description'],/ga go tsoge go hlodile tiragalo leswa/);
 assert.match(data['activity-recovery-source-unavailable'],/Ga go selo se se hlodilwego leswa/);
 assert.match(data['activity-recovery-failed'],/Mošomo.*o bolokilwe/);
 assert.match(data['activity-recovery-denied'],/ga di sa dumelela/);
 assert.match(data['activity-recovery-cancel-confirm'],/sa ruri.*ka se tšwetšwe pele gape.*mothalading.*ga di bušetšwe morago/);
 assert.equal(new Set(['pause','resume','cancel'].map(s=>data['activity-recovery-'+s])).size,3);
 assert.equal(new Set(['pending','preparing','processing','missing','changed','invalid','inconsistent','cancelled'].map(s=>data['activity-recovery-status-'+s])).size,8);
});
