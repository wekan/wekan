'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const english=require('../imports/i18n/data/en.i18n.json');
const locale=require('../imports/i18n/data/kok.i18n.json');
const {translationTokens}=require('../releases/translations/placeholder-tokens.mjs');
const keys=["sync-conflict-heading","sync-conflict-hint","sync-conflict-local","sync-conflict-keep-local","sync-conflict-use-source","sync-conflict-refresh","sync-conflict-review-complete","sync-conflict-duplicate","sync-conflict-keep-mapping","sync-conflict-detach","sync-conflict-detach-hint","sync-conflict-archive","sync-conflict-archive-hint","sync-conflict-keep-card-local","sync-conflict-creation","sync-conflict-creation-hint","sync-conflict-create-replacement","sync-preview-button","sync-preview-heading","sync-preview-saved","sync-preview-unavailable","sync-preview-blocked","sync-preview-create","sync-preview-update","sync-preview-archive","sync-preview-baseline","sync-preview-truncated","sync-preview-omissions","sync-preview-scope","sync-preview-excluded","sync-preview-unmapped","sync-preview-parser-warnings","sync-preview-parser-unsupported","sync-source-heading","sync-source-scope","sync-source-unmapped","sync-source-excluded","sync-source-converted","sync-source-fallback","sync-source-excluded-item","sync-source-occurrences"];
test('Konkani Sync translations preserve order, script and tokens',()=>{
 assert.deepEqual(Object.keys(locale),Object.keys(english));
 for(const key of keys){
  assert.notEqual(locale[key],english[key],key);
  assert.match(locale[key],/[\u0900-\u097f]/,key);
  assert.deepEqual(translationTokens(locale[key]),translationTokens(english[key]),key);
 }
});
test('Konkani conflict guidance retains local data and retry behavior',()=>{
 assert.ok(locale['sync-conflict-hint'].includes('\u0938\u094d\u0930\u094b\u0924 \u092a\u094d\u0930\u0923\u093e\u0932\u0940\u0915 \u0915\u093e\u0902\u092f\u091a \u0927\u093e\u0921\u0928\u093e\u0924'));
 assert.ok(locale['sync-conflict-review-complete'].includes('\u092a\u0941\u0930\u093e\u092f \u0935\u0933\u0947\u0930\u0947\u091a\u0947\u0902 \u0938\u092e\u0915\u094d\u0930\u092e\u0923 \u091a\u0932\u092f\u0932\u0947\u0902 \u0928\u093e'));
 assert.ok(locale['sync-conflict-detach-hint'].includes('\u092b\u0915\u0924 \u0938\u092e\u0915\u094d\u0930\u092e\u0923 \u091c\u094b\u0921\u0923\u0940 \u0915\u093e\u0921\u093e\u0924'));
 assert.ok(locale['sync-conflict-detach-hint'].includes('\u0906\u0936\u092f WeKan\u093e\u0902\u0924 \u0930\u093e\u0935\u0924\u093e'));
 assert.ok(locale['sync-conflict-archive-hint'].includes('\u0909\u092a\u0915\u093e\u0930\u094d\u0921\u093e\u0902 \u092c\u0926\u0932\u0928\u093e\u0924'));
 assert.ok(locale['sync-conflict-creation-hint'].includes('\u0924\u0940\u091a \u092c\u0926\u0932\u0940 \u092a\u094d\u0930\u0924'));
 assert.notEqual(locale['sync-conflict-keep-local'],locale['sync-conflict-use-source']);
});
test('Konkani Sync preview preserves limits and omitted-value guidance',()=>{
 assert.ok(locale['sync-preview-truncated'].includes('100'));
 assert.ok(locale['sync-source-scope'].includes('\u092e\u094b\u0932\u093e\u0902 \u0926\u093e\u0916\u092f\u0928\u093e\u0924'));
 assert.equal(locale['sync-preview-unmapped'],locale['sync-source-unmapped']);
 assert.equal(locale['sync-preview-excluded'],locale['sync-source-excluded']);
 assert.equal(new Set(['create','update','archive'].map(k=>locale['sync-preview-'+k])).size,3);
 assert.ok(locale['sync-preview-unavailable'].includes('\u092a\u092f\u0932\u0940\u0902'));
});
