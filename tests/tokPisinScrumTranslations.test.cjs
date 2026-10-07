'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const english=require('../imports/i18n/data/en.i18n.json');
const data=require('../imports/i18n/data/tpi.i18n.json');
const {translationTokens}=require('../releases/translations/placeholder-tokens.mjs');
const keys=Object.keys(english).filter(k=>k.startsWith('scrum-')||['board-view-product-backlog','board-view-sprints','board-view-sprint-report','board-view-velocity'].includes(k));

test('Tok Pisin Scrum messages preserve coverage, tokens and shared labels',()=>{
 assert.equal(keys.length,102);
 for(const key of keys){
  assert.ok(data[key].trim(),key);
  assert.notEqual(data[key],english[key],key);
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 }
 assert.equal(data['board-view-product-backlog'],data['scrum-product-backlog']);
 assert.equal(data['board-view-sprints'],data['scrum-sprints']);
 assert.equal(data['scrum-category-backlog'],data['scrum-backlog']);
 assert.equal(data['scrum-category-done'],data['scrum-completed']);
 assert.equal(data['scrum-completed'],data['sync-report-completed']);
});

test('Tok Pisin sprint actions preserve cancellation and unfinished-card handling',()=>{
 assert.equal(new Set(['planned','active','closed','cancelled','released'].map(s=>data['scrum-state-'+s])).size,5);
 assert.equal(new Set(['start','close','cancel'].map(s=>data['scrum-'+s+'-sprint'])).size,3);
 assert.match(data['scrum-confirm-close'],/kat i no pinis.*ples yu makim/);
 assert.match(data['scrum-confirm-cancel'],/i stap yet long sprint inap ol i givim/);
 assert.match(data['scrum-partial-report'],/kat ol i givim long yu nau tasol/);
 assert.match(data['scrum-import-pending'],/i no pinis.*Yu no inap editim.*salim/);
 assert.notEqual(data['scrum-category-todo'],data['scrum-category-doing']);
 assert.notEqual(data['scrum-incomplete'],data['scrum-completed']);
 assert.match(data['scrum-timebox'],/minit/);
});

test('Tok Pisin report caveats preserve unknown estimates and daily sampling limits',()=>{
 for(const key of ['scrum-report-help','scrum-daily-observations-help','scrum-daily-observations-export-help']) assert.match(data[key],/ol i no save long en.*i no siro/);
 for(const key of ['scrum-daily-observations-help','scrum-daily-observations-export-help']){
  assert.match(data[key],/[Ff]es samting.*UTC/);
  assert.match(data[key],/[Oo]l de i no gat samting i stap ausait/);
  assert.match(data[key],/i no raitim olgeta senis/);
  assert.match(data[key],/pinis bilong de/);
 }
 assert.match(data['scrum-report-help'],/yunit bilong skelim na ol rul i wankain tasol/);
 assert.match(data['scrum-daily-truncated'],/366/);
 assert.ok(data['scrum-daily-observations-help'].includes('wok '+data.export));
 assert.match(data['scrum-daily-observations-help'],/dispela hap.*ba bilong ol tul/);
});
