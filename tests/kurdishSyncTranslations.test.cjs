'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const english=require('../imports/i18n/data/en.i18n.json');
const locale=require('../imports/i18n/data/ku.i18n.json');
const {translationTokens}=require('../releases/translations/placeholder-tokens.mjs');
const keys=["sync-conflict-heading", "sync-conflict-hint", "sync-conflict-local", "sync-conflict-keep-local", "sync-conflict-use-source", "sync-conflict-refresh", "sync-conflict-review-complete", "sync-conflict-duplicate", "sync-conflict-keep-mapping", "sync-conflict-detach", "sync-conflict-detach-hint", "sync-conflict-archive", "sync-conflict-archive-hint", "sync-conflict-keep-card-local", "sync-conflict-creation", "sync-conflict-creation-hint", "sync-conflict-create-replacement", "sync-preview-button", "sync-preview-heading", "sync-preview-saved", "sync-preview-unavailable", "sync-preview-blocked", "sync-preview-create", "sync-preview-update", "sync-preview-archive", "sync-preview-baseline"];
test('Kurdish Sync translations preserve key order and source tokens',()=>{
 assert.deepEqual(Object.keys(locale),Object.keys(english));
 for(const key of keys){
  assert.ok(locale[key].trim(),key);
  assert.notEqual(locale[key],english[key],key);
  assert.deepEqual(translationTokens(locale[key]),translationTokens(english[key]),key);
 }
});
test('Kurdish Sync conflict messages retain local-only and retry guarantees',()=>{
 assert.match(locale['sync-conflict-hint'],/Tu tişt.*nayê şandin/);
 assert.match(locale['sync-conflict-detach-hint'],/Tenê girêdana.*Naveroka wê.*dimîne/);
 assert.match(locale['sync-conflict-archive-hint'],/Kartên jêrîn nayên guhertin/);
 assert.match(locale['sync-conflict-creation-hint'],/bê guhertin.*heman karta şûngir/);
 assert.match(locale['sync-conflict-review-complete'],/tevahiya lîsteyê nehat xebitandin/);
 assert.notEqual(locale['sync-conflict-keep-local'],locale['sync-conflict-use-source']);
});
