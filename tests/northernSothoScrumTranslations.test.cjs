'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const english=require('../imports/i18n/data/en.i18n.json');
const data=require('../imports/i18n/data/nso.i18n.json');
const {translationTokens}=require('../releases/translations/placeholder-tokens.mjs');
const keys=Object.keys(english).filter(k=>k.startsWith('scrum-')||['board-view-product-backlog','board-view-sprints','board-view-sprint-report','board-view-velocity'].includes(k));

test('Northern Sotho Scrum messages preserve coverage, tokens and shared labels',()=>{
 assert.equal(keys.length,127);
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

test('Northern Sotho sprint actions preserve cancellation and unfinished-card handling',()=>{
 assert.equal(new Set(['planned','active','closed','cancelled','released'].map(s=>data['scrum-state-'+s])).size,5);
 assert.equal(new Set(['start','close','cancel'].map(s=>data['scrum-'+s+'-sprint'])).size,3);
 assert.match(data['scrum-confirm-close'],/tše di sa phethwago.*lefelong le le kgethilwego/);
 assert.match(data['scrum-confirm-cancel'],/di tla dula.*go fihlela di abelwa gape/);
 assert.match(data['scrum-partial-report'],/fela dikarata tše o di abetšwego gona bjale/);
 assert.match(data['scrum-import-pending'],/ga se gwa phethwa.*ga go hwetšagale/);
 assert.notEqual(data['scrum-category-todo'],data['scrum-category-doing']);
 assert.notEqual(data['scrum-incomplete'],data['scrum-completed']);
 assert.match(data['scrum-timebox'],/metsotso/);
});

test('Northern Sotho report caveats preserve unknown estimates and daily sampling limits',()=>{
 for(const key of ['scrum-report-help','scrum-daily-observations-help','scrum-daily-observations-export-help']) assert.match(data[key],/tše di sa tsebjego.*ga se.*lefela/);
 for(const key of ['scrum-daily-observations-help','scrum-daily-observations-export-help']){
  assert.match(data[key],/mathomo.*UTC/);
  assert.match(data[key],/[Mm]atšatši ao a sego gona a a tlogelwa/);
  assert.match(data[key],/ga di rekote phetogo ye nngwe le ye nngwe/);
  assert.match(data[key],/mafelelong a letšatši/);
 }
 assert.match(data['scrum-daily-truncated'],/366/);
 assert.ok(data['scrum-daily-observations-help'].includes('tiro ya '+data.export));
 assert.match(data['scrum-daily-observations-help'],/karolo ye.*bara ya didirišwa/);
});

test('release selection and recovery distinguish retaining records from rollback',()=>{
 assert.match(data['scrum-releases-select-help'],/Ctrl.*Cmd/);
 assert.notEqual(data['scrum-history-checkpoint-rollback'],data['scrum-history-checkpoint-discard']);
 assert.deepEqual(translationTokens(data['scrum-history-checkpoint-counts']),
   ['__applied__','__conflicted__','__pending__','__total__']);
});

test('Northern Sotho imports preserve foreign-board cards and avoid duplicates',()=>{
 assert.match(data['scrum-import-into-board-hint'],/ga di dirwe dikopi/);
 assert.match(data['scrum-import-card-on-another-board'],/e tlogetšwe e sa fetolwa/);
});
