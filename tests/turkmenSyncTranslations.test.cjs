'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const english=require('../imports/i18n/data/en.i18n.json');
const locale=require('../imports/i18n/data/tk_TM.i18n.json');
const {translationTokens}=require('../releases/translations/placeholder-tokens.mjs');
const keys=["sync-conflict-heading", "sync-conflict-hint", "sync-conflict-local", "sync-conflict-keep-local", "sync-conflict-use-source", "sync-conflict-refresh", "sync-conflict-review-complete", "sync-conflict-duplicate", "sync-conflict-keep-mapping", "sync-conflict-detach", "sync-conflict-detach-hint", "sync-conflict-archive", "sync-conflict-archive-hint", "sync-conflict-keep-card-local", "sync-conflict-creation", "sync-conflict-creation-hint", "sync-conflict-create-replacement", "sync-preview-button", "sync-preview-heading", "sync-preview-saved", "sync-preview-unavailable", "sync-preview-blocked", "sync-preview-create", "sync-preview-update", "sync-preview-archive", "sync-preview-baseline", "sync-preview-truncated", "sync-preview-omissions", "sync-preview-scope", "sync-preview-excluded", "sync-preview-unmapped", "sync-preview-parser-warnings", "sync-preview-parser-unsupported", "sync-source-heading", "sync-source-scope", "sync-source-unmapped", "sync-source-excluded", "sync-source-converted", "sync-source-fallback", "sync-source-excluded-item", "sync-source-occurrences", "sync-source-truncated", "sync-source-omitted", "sync-report-button", "sync-report-retention", "sync-report-partial", "sync-report-unfinished", "sync-report-failed", "sync-report-completed", "sync-report-completed-with-warnings", "sync-report-skipped", "sync-report-review-only"];
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
test('Turkmen Sync reports preserve limits and uncertain outcomes',()=>{
 for(const key of ['sync-preview-truncated','sync-source-truncated']) assert.ok(locale[key].includes('100'));
 assert.ok(locale['sync-report-retention'].includes('20'));
 assert.ok(locale['sync-report-retention'].includes('30 g\u00fcn'));
 assert.ok(locale['sync-report-partial'].includes('dowam etdirme\u00fd\u00e4r'));
 assert.ok(locale['sync-report-partial'].includes('yzyna alma\u00fdar'));
 assert.ok(locale['sync-source-scope'].includes('bahalary g\u00f6rkezilme\u00fd\u00e4r'));
 assert.equal(locale['sync-preview-unmapped'],locale['sync-source-unmapped']);
 assert.equal(locale['sync-preview-excluded'],locale['sync-source-excluded']);
 assert.equal(new Set(['create','update','archive'].map(k=>locale['sync-preview-'+k])).size,3);
 assert.notEqual(locale['sync-report-failed'],locale['sync-report-completed']);
});
