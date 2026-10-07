'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const english=require('../imports/i18n/data/en.i18n.json');
const data=require('../imports/i18n/data/mi.i18n.json');
const {translationTokens}=require('../releases/translations/placeholder-tokens.mjs');
const keys=Object.keys(english).filter(k=>/^(r-blocks-|email-failure-|activity-recovery-)/.test(k)||k==='rule-email-recovery-unavailable');

test('Māori rule and recovery messages preserve tokens and editor constraints',()=>{
 assert.equal(keys.length,46);
 for(const key of keys){
  assert.ok(data[key].trim(),key);
  assert.notEqual(data[key],english[key],key);
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 }
 assert.match(data['r-blocks-invalid'],/kotahi anake te keu.*hohenga kotahi anake.*i mua i te tiaki/);
 assert.match(data['r-blocks-permission'],/whakaaetanga kaiwhakahaere papa/);
 assert.match(data['r-blocks-conflict'],/Utaina anō.*i mua i te tiaki/);
 assert.notEqual(data['r-blocks-unsaved'],data['r-blocks-saved']);
});

test('Māori delivery recovery preserves uncertainty and irreversible cancellation',()=>{
 assert.match(data['email-failure-smtp-temporary'],/SMTP rangitahi/);
 assert.match(data['email-failure-smtp-rejected'],/SMTP pūmau/);
 assert.match(data['email-failure-delivery-unconfirmed'],/Kāore i taea te whakaū.*i mua i te ngana anō/);
 assert.notEqual(data['email-failure-delivery-unconfirmed'],data['email-failure-delivery-failed']);
 assert.match(data['activity-recovery-description'],/E kore rawa te ngana anō e waihanga anō/);
 assert.match(data['activity-recovery-source-unavailable'],/Kāore he mea i waihangatia anō/);
 assert.match(data['activity-recovery-failed'],/Kua puritia ngā mahi e tārewa ana/);
 assert.match(data['activity-recovery-denied'],/Kāore.*e whakaae tonu/);
 assert.match(data['activity-recovery-cancel-confirm'],/pūmautia.*E kore e taea te haere tonu anō.*Kāore.*tūtira kē.*kua tukuna e whakahokia mai/);
 assert.equal(new Set(['pause','resume','cancel'].map(s=>data['activity-recovery-'+s])).size,3);
 assert.equal(new Set(['pending','preparing','processing','missing','changed','invalid','inconsistent','cancelled'].map(s=>data['activity-recovery-status-'+s])).size,8);
});
