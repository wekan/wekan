'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const english=require('../imports/i18n/data/en.i18n.json');
const locale=require('../imports/i18n/data/tk_TM.i18n.json');
const {translationTokens}=require('../releases/translations/placeholder-tokens.mjs');
const keys=["sync-conflict-heading","sync-conflict-hint","sync-conflict-local","sync-conflict-keep-local","sync-conflict-use-source","sync-conflict-refresh","sync-conflict-review-complete","sync-conflict-duplicate","sync-conflict-keep-mapping","sync-conflict-detach","sync-conflict-detach-hint","sync-conflict-archive","sync-conflict-archive-hint","sync-conflict-keep-card-local","sync-conflict-creation","sync-conflict-creation-hint","sync-conflict-create-replacement","sync-preview-button","sync-preview-heading","sync-preview-saved","sync-preview-unavailable","sync-preview-blocked","sync-preview-create"];
test('Turkmen Sync translations preserve order and tokens',()=>{
 assert.deepEqual(Object.keys(locale),Object.keys(english));
 for(const key of keys){
  assert.notEqual(locale[key],english[key],key);
  assert.deepEqual(translationTokens(locale[key]),translationTokens(english[key]),key);
 }
});
test('Turkmen Sync conflict guidance preserves local data and retry boundaries',()=>{
 assert.ok(locale['sync-conflict-hint'].includes('\u00c7e\u015fme ulgamyna hi\u00e7 zat iberilme\u00fd\u00e4r'));
 assert.ok(locale['sync-conflict-review-complete'].includes('Tutu\u015f sanaw sinhronla\u015fdyrylmady'));
 assert.ok(locale['sync-conflict-detach-hint'].includes('mazmuny WeKan-da gal\u00fdar'));
 assert.ok(locale['sync-conflict-archive-hint'].includes('Ki\u00e7i karto\u00e7kalar \u00fc\u00fdtgedilme\u00fd\u00e4r'));
 assert.ok(locale['sync-conflict-creation-hint'].includes('\u00d6\u0148ki karto\u00e7kany \u00fc\u00fdtgetm\u00e4n'));
 assert.ok(locale['sync-conflict-creation-hint'].includes('\u015fol t\u00e4ze karto\u00e7kany ulan\u00fdar'));
 assert.notEqual(locale['sync-conflict-keep-local'],locale['sync-conflict-use-source']);
 assert.ok(locale['sync-preview-unavailable'].includes('soramazdan \u00f6\u0148'));
});
