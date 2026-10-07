'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const english=require('../imports/i18n/data/en.i18n.json');
const data=require('../imports/i18n/data/tpi.i18n.json');
const {translationTokens}=require('../releases/translations/placeholder-tokens.mjs');
const keys=Object.keys(english).filter(k=>/^(r-blocks-|email-failure-|activity-recovery-)/.test(k)||k==='rule-email-recovery-unavailable');

test('Tok Pisin rule and recovery messages preserve tokens and editor constraints',()=>{
 assert.equal(keys.length,46);
 for(const key of keys){
  assert.ok(data[key].trim(),key);
  assert.notEqual(data[key],english[key],key);
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 }
 assert.match(data['r-blocks-invalid'],/wanpela samting i kirapim wok tasol.*wanpela wok tasol.*paslain long seivim/);
 assert.match(data['r-blocks-permission'],/tok orait bilong admin bilong bot/);
 assert.match(data['r-blocks-conflict'],/Lodim gen.*paslain long seivim/);
 assert.notEqual(data['r-blocks-unsaved'],data['r-blocks-saved']);
 for(const key of ['rules','r-trigger']){
  assert.doesNotMatch(data[key],/Toksave:|Rules|Trigger/);
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 }
 assert.equal(data.rules,'Ol rul');
 assert.equal(data['r-trigger'],'Samting i kirapim wok');
});

test('Tok Pisin delivery recovery preserves uncertainty and irreversible cancellation',()=>{
 assert.match(data['email-failure-smtp-temporary'],/SMTP.*nau tasol/);
 assert.match(data['email-failure-smtp-rejected'],/SMTP.*inap oltaim/);
 assert.match(data['email-failure-delivery-unconfirmed'],/No inap makim.*skelim paslain long traim gen/);
 assert.notEqual(data['email-failure-delivery-unconfirmed'],data['email-failure-delivery-failed']);
 assert.match(data['activity-recovery-description'],/Traim gen i no save wokim gen/);
 assert.match(data['activity-recovery-source-unavailable'],/I no gat samting ol i wokim gen/);
 assert.match(data['activity-recovery-failed'],/Wok i wet yet i stap seif/);
 assert.match(data['activity-recovery-denied'],/i no orait moa/);
 assert.match(data['activity-recovery-cancel-confirm'],/Kanselim tru.*No inap go het gen.*lain pinis.*salim pinis i no kam bek/);
 assert.equal(new Set(['pause','resume','cancel'].map(s=>data['activity-recovery-'+s])).size,3);
 assert.equal(new Set(['pending','preparing','processing','missing','changed','invalid','inconsistent','cancelled'].map(s=>data['activity-recovery-status-'+s])).size,8);
});
