'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const english=require('../imports/i18n/data/en.i18n.json');
const data=require('../imports/i18n/data/so.i18n.json');
const {translationTokens}=require('../releases/translations/placeholder-tokens.mjs');
const keys=Object.keys(english).filter(key=>/^(r-blocks-|email-failure-|activity-recovery-)/.test(key)||key==='rule-email-recovery-unavailable');

test('Somali rule and recovery messages preserve source tokens and translated coverage',()=>{
 assert.equal(keys.length,46);
 for(const key of keys){
  assert.ok(data[key].trim(),key);
  assert.notEqual(data[key],english[key],key);
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 }
 assert.match(data['r-blocks-invalid'],/hal kiciye hal ficil.*aan ku xirnayn ama dheeraadka ah.*ka hor kaydinta/);
 assert.match(data['r-blocks-permission'],/maamulaha sabuuradda/);
 assert.match(data['r-blocks-conflict'],/Dib u soo rar.*ka hor intaadan kaydin/);
 assert.notEqual(data['r-blocks-unsaved'],data['r-blocks-saved']);
});

test('Somali delivery failures retain uncertainty and temporary/permanent distinctions',()=>{
 assert.match(data['email-failure-smtp-temporary'],/SMTP.*ku meel gaar/);
 assert.match(data['email-failure-smtp-rejected'],/SMTP.*joogto/);
 assert.match(data['email-failure-delivery-unconfirmed'],/lama xaqiijin.*dib u eeg ka hor/);
 assert.match(data['email-failure-acknowledgement-failed'],/lama kaydin/);
 assert.notEqual(data['email-failure-delivery-unconfirmed'],data['email-failure-delivery-failed']);
 assert.notEqual(data['email-failure-smtp-authentication'],data['email-failure-smtp-configuration']);
});

test('Somali notification recovery does not promise recreation or recall',()=>{
 assert.match(data['activity-recovery-description'],/marnaba dib uma abuuro hawl/);
 assert.match(data['activity-recovery-source-unavailable'],/Waxba dib looma abuurin/);
 assert.match(data['activity-recovery-failed'],/Shaqadii sugaysay waa la hayaa/);
 assert.match(data['activity-recovery-denied'],/hadda ma oggola/);
 assert.match(data['activity-recovery-cancel-confirm'],/si joogto ah.*Dib looma sii wadi karo.*hore safka loogu daray.*dib looma soo celiyo/);
 assert.match(data['activity-recovery-control-conflict'],/xaaladda la cusboonaysiiyey ka hor/);
 assert.equal(new Set(['pause','resume','cancel'].map(s=>data['activity-recovery-'+s])).size,3);
 assert.equal(new Set(['pending','preparing','processing','missing','changed','invalid','inconsistent','cancelled'].map(s=>data['activity-recovery-status-'+s])).size,8);
});
