'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const english=require('../imports/i18n/data/en.i18n.json');
const data=require('../imports/i18n/data/mi.i18n.json');
const {translationTokens}=require('../releases/translations/placeholder-tokens.mjs');

test('Māori Sync messages preserve source tokens and shared labels',()=>{
 for(const key of Object.keys(english).filter(k=>k.startsWith('sync-'))){
  assert.ok(data[key].trim(),key);
  assert.notEqual(data[key],english[key],key);
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 }
 for(const suffix of ['unmapped','excluded']) assert.equal(data['sync-preview-'+suffix],data['sync-source-'+suffix]);
 assert.equal(data['sync-report-completed'],data['scrum-completed']);
 assert.notEqual(data['sync-conflict-keep-local'],data['sync-conflict-use-source']);
 assert.equal(new Set(['create','update','archive'].map(s=>data['sync-preview-'+s])).size,3);
});

test('Māori Sync conflict choices retain local data and limit review scope',()=>{
 assert.match(data['sync-conflict-hint'],/Kāore he mea e tukuna ki te pūnaha pūtake/);
 assert.match(data['sync-conflict-detach-hint'],/hononga tukutahi.*anake.*noho tonu.*ihirangi ki WeKan/);
 assert.match(data['sync-conflict-archive-hint'],/Kāore ngā kāri iti e panonitia/);
 assert.match(data['sync-conflict-creation-hint'],/kāri o mua kia kaua e panonitia.*whakamahi anō.*whakakapi/);
 assert.match(data['sync-conflict-review-complete'],/Kāore i whakahaeretia.*rārangi katoa/);
 assert.match(data['sync-preview-unavailable'],/Tiakina.*i mua/);
 assert.match(data['sync-preview-blocked'],/Whakatikahia ngā papā.*i mua/);
 assert.match(data['sync-preview-truncated'],/tuatahi 100/);
 assert.match(data['sync-source-truncated'],/ara 100.*whakapotoa/);
 assert.match(data['sync-source-scope'],/kāore ō rātou uara e whakaaturia/);
});

test('Māori Sync reports preserve retention, permissions and recovery limits',()=>{
 assert.match(data['sync-report-retention'],/20.*rā 30/);
 assert.match(data['sync-report-partial'],/panoni pea.*Kāore ēnei pūrongo e haere tonu, e wetewete/);
 assert.match(data['sync-report-unavailable'],/mana tuhi mō te rārangi katoa.*tūmau/);
 assert.match(data['sync-recovery-description'],/30.*ID.*haere tonu pea.*haukotia.*kāore e taea.*haere tonu, te wetewete/);
 assert.match(data['sync-recovery-unavailable'],/urunga kaiwhakahaere.*tūmau/);
 assert.equal(new Set(['unfinished','failed','completed','completed-with-warnings','skipped','review-only'].map(s=>data['sync-report-'+s])).size,6);
});

test('Māori estimate mappings distinguish missing values from explicit null',()=>{
 for(const key of ['sync-estimate-field-hint','sync-time-estimate-hint']){
  assert.match(data[key],/Jira/);
  assert.match(data[key],/papā/);
  assert.match(data[key],/[Kk]a waiho ngā uara pūtake e ngaro ana/);
  assert.match(data[key],/null mārama e muku/);
 }
 assert.match(data['sync-time-estimate-hint'],/kotahi anake te āpure ōrite/);
 for(const key of ['sync-original-time','sync-remaining-time']) assert.match(data[key],/\(hāora\)/);
 assert.notEqual(data['sync-original-time'],data['sync-remaining-time']);
});
