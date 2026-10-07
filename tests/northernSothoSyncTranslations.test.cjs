'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const english=require('../imports/i18n/data/en.i18n.json');
const data=require('../imports/i18n/data/nso.i18n.json');
const {translationTokens}=require('../releases/translations/placeholder-tokens.mjs');
const keys=Object.keys(english).filter(k=>/^sync-(conflict|preview|source)-/.test(k));

test('Northern Sotho Sync conflicts and previews preserve source tokens and shared labels',()=>{
 assert.equal(keys.length,43);
 for(const key of keys){
  assert.ok(data[key].trim(),key);
  assert.notEqual(data[key],english[key],key);
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 }
 for(const suffix of ['unmapped','excluded']) assert.equal(data['sync-preview-'+suffix],data['sync-source-'+suffix]);
 assert.notEqual(data['sync-conflict-keep-local'],data['sync-conflict-use-source']);
 assert.equal(new Set(['create','update','archive'].map(s=>data['sync-preview-'+s])).size,3);
});

test('Northern Sotho Sync choices preserve local content and limit review scope',()=>{
 assert.match(data['sync-conflict-hint'],/Ga go selo se se romelwago tshepedišong ya mothopo/);
 assert.match(data['sync-conflict-detach-hint'],/Tloša fela kgokaganyo.*Dikagare.*di dula ka go WeKan/);
 assert.match(data['sync-conflict-archive-hint'],/Dikarata tše nnyane ga di fetolwe/);
 assert.match(data['sync-conflict-creation-hint'],/ya pele e sa fetoga.*šomiša gape/);
 assert.match(data['sync-conflict-review-complete'],/lenaneo ka moka ga se ya dirwa/);
 assert.match(data['sync-preview-unavailable'],/Boloka.*pele/);
 assert.match(data['sync-preview-blocked'],/Rarolla dithulano.*pele/);
 assert.match(data['sync-preview-truncated'],/mathomo tše 100/);
 assert.match(data['sync-source-truncated'],/ditsela tše 100.*khutsofaditšwego/);
 assert.match(data['sync-source-scope'],/boleng bja tšona ga bo bontšhwe/);
});
