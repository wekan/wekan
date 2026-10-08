'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const english=require('../imports/i18n/data/en.i18n.json');
const data=require('../imports/i18n/data/so.i18n.json');
const {translationTokens}=require('../releases/translations/placeholder-tokens.mjs');
const keys=Object.keys(english).filter(key=>key.startsWith('sync-'));

test('Somali Sync messages preserve placeholders and shared labels',()=>{
  assert.ok(keys.length>=63);
  for(const key of keys){
    assert.ok(data[key].trim(),key);
    assert.notEqual(data[key],english[key],key);
    assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  }
  for(const suffix of ['excluded','unmapped']) assert.equal(data['sync-preview-'+suffix],data['sync-source-'+suffix]);
  assert.equal(data['sync-report-completed'],data['scrum-completed']);
  assert.equal(new Set(['unfinished','failed','completed','completed-with-warnings','skipped','review-only'].map(s=>data['sync-report-'+s])).size,6);
});

test('Somali conflict resolution preserves local content and limits its scope',()=>{
  assert.match(data['sync-conflict-hint'],/Waxba looma diro nidaamka isha xogta/);
  assert.match(data['sync-conflict-detach-hint'],/keliya xiriirka.*ku sii jiraan WeKan/);
  assert.match(data['sync-conflict-archive-hint'],/Kaararka hoosaadyada ah lama beddelo/);
  assert.match(data['sync-conflict-creation-hint'],/hore sidiisa u hay.*dib u adeegsadaan kaarka beddelka/);
  assert.match(data['sync-conflict-review-complete'],/liiska oo dhan lama samayn/);
  assert.notEqual(data['sync-conflict-keep-local'],data['sync-conflict-use-source']);
  assert.notEqual(data['sync-conflict-detach'],data['sync-conflict-create-replacement']);
});

test('Somali Sync reports retain visibility, retention and recovery limitations',()=>{
  assert.match(data['sync-preview-truncated'],/100/);
  assert.match(data['sync-source-truncated'],/100.*la soo gaabiyey/);
  assert.match(data['sync-source-scope'],/qiimayaashooda lama muujiyo/);
  assert.match(data['sync-report-retention'],/20.*30 maalmood/);
  assert.match(data['sync-report-partial'],/inay beddeleen.*ma sii wadaan mana ka noqdaan/);
  assert.match(data['sync-report-unavailable'],/liiska oo dhan.*adeege la heli karo/);
  assert.match(data['sync-recovery-description'],/30.*weli socota ama hakaday.*ma sii wadi karaan mana ka noqon/);
  assert.match(data['sync-recovery-unavailable'],/oggolaanshaha maamulaha.*helitaanka adeegaha/);
});

test('Somali estimate mapping distinguishes missing values from explicit null and preserves units',()=>{
  for(const key of ['sync-estimate-field-hint','sync-time-estimate-hint']){
    assert.match(data[key],/Jira/);
    assert.match(data[key],/isku dhacyo/);
    assert.match(data[key],/ka maqan isha xogta waa la iska dhaafaa/);
    assert.match(data[key],/null si cad loo bixiyey.*tirtiraa/);
  }
  assert.match(data['sync-time-estimate-hint'],/hal goob oo keliya/);
  for(const key of ['sync-original-time','sync-remaining-time']) assert.match(data[key],/\(saacado\)/);
  assert.notEqual(data['sync-original-time'],data['sync-remaining-time']);
});

test('Somali planning Sync preserves matching priority and existing plans',()=>{
 assert.match(data['sync-planning-hint'],/aqoonsiga ID ee isha, ka dibna magaca/);
 assert.match(data['sync-planning-hint'],/koowaad marna ma tirtirto qorshaynta/);
});
