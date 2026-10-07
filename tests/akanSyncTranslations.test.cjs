 'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const english=require('../imports/i18n/data/en.i18n.json');
const data=require('../imports/i18n/data/ak.i18n.json');

test('Akan Sync previews preserve local content, exclusions and display limits', async()=>{
 const {translationTokens}=await import('../releases/translations/placeholder-tokens.mjs');
 const keys=["sync-conflict-heading", "sync-conflict-hint", "sync-conflict-local", "sync-conflict-keep-local", "sync-conflict-use-source", "sync-conflict-refresh", "sync-conflict-review-complete", "sync-conflict-duplicate", "sync-conflict-keep-mapping", "sync-conflict-detach", "sync-conflict-detach-hint", "sync-conflict-archive", "sync-conflict-archive-hint", "sync-conflict-keep-card-local", "sync-conflict-creation", "sync-conflict-creation-hint", "sync-conflict-create-replacement", "sync-preview-button", "sync-preview-heading", "sync-preview-saved", "sync-preview-unavailable", "sync-preview-blocked", "sync-preview-create", "sync-preview-update", "sync-preview-archive", "sync-preview-baseline", "sync-preview-truncated", "sync-preview-omissions", "sync-preview-scope", "sync-preview-excluded", "sync-preview-unmapped", "sync-preview-parser-warnings", "sync-preview-parser-unsupported", "sync-source-heading", "sync-source-scope", "sync-source-unmapped", "sync-source-excluded", "sync-source-converted", "sync-source-fallback", "sync-source-excluded-item", "sync-source-occurrences", "sync-source-truncated", "sync-source-omitted"];
 for(const key of keys){
  assert.notEqual(data[key],english[key],key);
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 }
 assert.notEqual(data['sync-conflict-keep-local'],data['sync-conflict-use-source']);
 assert.match(data['sync-conflict-hint'],/Wɔmfa biribiara nkɔ/);
 assert.match(data['sync-conflict-detach-hint'],/nkutoo.*Emu nsɛm kɔ so tena WeKan/);
 assert.match(data['sync-conflict-archive-hint'],/Kaad nketewa no nsesa/);
 assert.match(data['sync-conflict-creation-hint'],/wonsesa no.*wɔsan de kaad foforo/);
 assert.match(data['sync-conflict-review-complete'],/Wɔanyɛ.*nyinaa/);
 assert.match(data['sync-preview-truncated'],/100.*edi kan/);
 assert.match(data['sync-source-truncated'],/100 pɛ/);
 assert.match(data['sync-source-scope'],/wɔnnkyerɛ emu botae/);
 for(const name of ['unmapped','excluded']) assert.equal(data['sync-preview-'+name],data['sync-source-'+name]);
 assert.equal(new Set(['create','update','archive'].map(s=>data['sync-preview-'+s])).size,3);
});
