'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const english=require('../imports/i18n/data/en.i18n.json');
const data=require('../imports/i18n/data/tpi.i18n.json');
const {translationTokens}=require('../releases/translations/placeholder-tokens.mjs');

test('Tok Pisin Sync messages preserve source tokens and shared labels',()=>{
 for(const key of Object.keys(english).filter(k=>k.startsWith('sync-'))){
  assert.ok(data[key].trim(),key);
  assert.notEqual(data[key],english[key],key);
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 }
 for(const suffix of ['unmapped','excluded']) assert.equal(data['sync-preview-'+suffix],data['sync-source-'+suffix]);
 assert.notEqual(data['sync-conflict-keep-local'],data['sync-conflict-use-source']);
 assert.equal(new Set(['create','update','archive'].map(s=>data['sync-preview-'+s])).size,3);
});

test('Tok Pisin Sync conflict choices retain local content and limit review scope',()=>{
 assert.match(data['sync-conflict-hint'],/I no gat samting i go long sistem bilong sos/);
 assert.match(data['sync-conflict-detach-hint'],/Rausim link.*tasol.*i stap yet long WeKan/);
 assert.match(data['sync-conflict-archive-hint'],/Ol liklik kat i no senis/);
 assert.match(data['sync-conflict-creation-hint'],/pastaim na no ken senisim.*yusim gen kat i kisim ples/);
 assert.match(data['sync-conflict-review-complete'],/Sink bilong olgeta lis i no ran/);
 assert.match(data['sync-preview-unavailable'],/Seivim.*paslain/);
 assert.match(data['sync-preview-blocked'],/Stretim.*paslain/);
 assert.match(data['sync-preview-truncated'],/fes 100/);
 assert.match(data['sync-source-truncated'],/100 rot.*sotpela nem/);
 assert.match(data['sync-source-scope'],/ol veliu bilong ol i no stap long skrin/);
});

test('Tok Pisin Sync reports preserve retention, permissions and recovery limits',()=>{
 assert.match(data['sync-report-retention'],/20.*30 de/);
 assert.match(data['sync-report-partial'],/inap senisim.*i no mekim.*go het gen o rausim/);
 assert.match(data['sync-report-unavailable'],/rait bilong raitim olgeta lis.*seva/);
 assert.match(data['sync-recovery-description'],/30.*ID.*inap wok yet o i stop namel.*i no inap.*go het gen o rausim/);
 assert.match(data['sync-recovery-unavailable'],/rait bilong admin.*seva/);
 assert.equal(new Set(['unfinished','failed','completed','completed-with-warnings','skipped','review-only'].map(s=>data['sync-report-'+s])).size,6);
});

test('Tok Pisin estimate mappings distinguish missing values from explicit null',()=>{
 for(const key of ['sync-estimate-field-hint','sync-time-estimate-hint']){
  assert.match(data[key],/Jira/);
  assert.match(data[key],/pait bilong ol senis/);
  assert.match(data[key],/[Oo]l i no mekim samting long ol veliu bilong sos i no stap/);
  assert.match(data[key],/null ol i givim stret i rausim/);
 }
 assert.match(data['sync-time-estimate-hint'],/Wanpela bokis i stret tasol/);
 for(const key of ['sync-original-time','sync-remaining-time']) assert.match(data[key],/\(aua\)/);
 assert.notEqual(data['sync-original-time'],data['sync-remaining-time']);
});

test('Tok Pisin planning Sync retains source identity and first-run protection',()=>{
 assert.match(data['sync-planning-hint'],/ID bilong sos pastaim, na bihain long nem/);
 assert.match(data['sync-planning-hint'],/Fes Sync i no rausim plen/);
});
