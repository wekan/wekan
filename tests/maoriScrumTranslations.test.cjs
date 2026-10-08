'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const english=require('../imports/i18n/data/en.i18n.json');
const data=require('../imports/i18n/data/mi.i18n.json');
test('Māori imports retain foreign-board cards and avoid duplicates',()=>{
 assert.match(data['scrum-import-into-board-hint'],/kāore e tāruatia/);
 assert.match(data['scrum-import-card-on-another-board'],/kia kore e panonitia/);
 assert.match(data['scrum-import-sprint-finished'],/Kāore.*i nukuhia/);
});
const {translationTokens}=require('../releases/translations/placeholder-tokens.mjs');
const keys=Object.keys(english).filter(k=>k.startsWith('scrum-')||['board-view-product-backlog','board-view-sprints','board-view-sprint-report','board-view-velocity'].includes(k));

test('Māori Scrum messages preserve coverage, tokens and shared labels',()=>{
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
});

test('Māori sprint actions preserve cancellation and unfinished-card handling',()=>{
 assert.equal(new Set(['planned','active','closed','cancelled','released'].map(s=>data['scrum-state-'+s])).size,5);
 assert.equal(new Set(['start','close','cancel'].map(s=>data['scrum-'+s+'-sprint'])).size,3);
 assert.match(data['scrum-confirm-close'],/kāri kāore anō kia oti.*wāhi kua tīpakohia/);
 assert.match(data['scrum-confirm-cancel'],/noho tonu.*kia tohaina anō rā anō/);
 assert.match(data['scrum-partial-report'],/kāri anake kua tohaina ki a koe i tēnei wā/);
 assert.match(data['scrum-import-pending'],/Kāore anō kia oti.*Kāore e wātea/);
 assert.notEqual(data['scrum-category-todo'],data['scrum-category-doing']);
 assert.notEqual(data['scrum-incomplete'],data['scrum-completed']);
 assert.match(data['scrum-timebox'],/meneti/);
});

test('Māori report caveats preserve unknown estimates and daily sampling limits',()=>{
 for(const key of ['scrum-report-help','scrum-daily-observations-help','scrum-daily-observations-export-help']) assert.match(data[key],/kāore e mōhiotia.*ehara.*kore/);
 for(const key of ['scrum-daily-observations-help','scrum-daily-observations-export-help']){
  assert.match(data[key],/tuatahi.*UTC/);
  assert.match(data[key],/[Kk]a waiho ngā rā kāore he kitenga/);
  assert.match(data[key],/Kāore.*kitenga e tuhi i ia panonitanga/);
  assert.match(data[key],/mutunga o te rā/);
 }
 assert.match(data['scrum-report-help'],/anake ina ōrite ngā wae whakatau tata me ngā kaupapa here/);
 assert.match(data['scrum-daily-truncated'],/366/);
 assert.ok(data['scrum-daily-observations-help'].includes('mahi '+data.export));
 assert.match(data['scrum-daily-observations-help'],/tēnei wāhanga.*paeutauta/);
});

test('release selection and recovery distinguish retaining records from rollback',()=>{
 assert.match(data['scrum-releases-select-help'],/Ctrl.*Cmd/);
 assert.notEqual(data['scrum-history-checkpoint-rollback'],data['scrum-history-checkpoint-discard']);
 assert.deepEqual(translationTokens(data['scrum-history-checkpoint-counts']),
   ['__applied__','__conflicted__','__pending__','__total__']);
});
