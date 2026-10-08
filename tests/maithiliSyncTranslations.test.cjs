'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const english=require('../imports/i18n/data/en.i18n.json');
const locale=require('../imports/i18n/data/mai.i18n.json');
const {translationTokens}=require('../releases/translations/placeholder-tokens.mjs');
const keys=["scrum-observed-scope","scrum-daily-observations-export-help","scrum-import-pending","sync-conflict-heading","sync-conflict-hint","sync-conflict-local","sync-conflict-keep-local","sync-conflict-use-source","sync-conflict-refresh","sync-conflict-review-complete","sync-conflict-duplicate","sync-conflict-keep-mapping","sync-conflict-detach","sync-conflict-detach-hint","sync-conflict-archive","sync-conflict-archive-hint","sync-conflict-keep-card-local","sync-conflict-creation","sync-conflict-creation-hint","sync-conflict-create-replacement","sync-preview-button","sync-preview-heading","sync-preview-saved"];
test('Maithili sync translations preserve order, script and tokens',()=>{
 assert.deepEqual(Object.keys(locale),Object.keys(english));
 for(const key of keys){
  assert.notEqual(locale[key],english[key],key);
  assert.match(locale[key],/[\u0900-\u097f]/,key);
  assert.deepEqual(translationTokens(locale[key]),translationTokens(english[key]),key);
 }
});
test('Maithili sync conflicts preserve local data and review scope',()=>{
 assert.ok(locale['sync-conflict-hint'].includes('\u0915\u093f\u091b\u0941 \u0928\u0939\u093f \u092a\u0920\u093e\u0913\u0932'));
 assert.ok(locale['sync-conflict-review-complete'].includes('\u092a\u0942\u0930\u093e \u0938\u0942\u091a\u0940\u0915 \u0938\u093f\u0902\u0915 \u0928\u0939\u093f'));
 assert.ok(locale['sync-conflict-detach-hint'].includes('\u0938\u093e\u092e\u0917\u094d\u0930\u0940 WeKan \u092e\u0947 \u0930\u0939\u0924'));
 assert.ok(locale['sync-conflict-archive-hint'].includes('\u0909\u092a\u0915\u093e\u0930\u094d\u0921 \u0938\u092d \u0928\u0939\u093f \u092c\u0926\u0932\u0948\u0924'));
 assert.ok(locale['sync-conflict-creation-hint'].includes('\u092a\u091b\u093f\u0932\u093e \u0915\u093e\u0930\u094d\u0921 \u092c\u093f\u0928\u093e \u092c\u0926\u0932\u0928\u0947'));
 assert.notEqual(locale['sync-conflict-keep-local'],locale['sync-conflict-use-source']);
 assert.ok(locale['scrum-import-pending'].includes('\u0909\u092a\u0932\u092c\u094d\u0927 \u0928\u0939\u093f'));
 assert.ok(locale['scrum-daily-observations-export-help'].includes('UTC'));
});
