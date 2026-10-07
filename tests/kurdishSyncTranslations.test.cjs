'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const english=require('../imports/i18n/data/en.i18n.json');
const locale=require('../imports/i18n/data/ku.i18n.json');
const {translationTokens}=require('../releases/translations/placeholder-tokens.mjs');
const keys=["sync-conflict-heading", "sync-conflict-hint", "sync-conflict-local", "sync-conflict-keep-local", "sync-conflict-use-source", "sync-conflict-refresh", "sync-conflict-review-complete", "sync-conflict-duplicate", "sync-conflict-keep-mapping", "sync-conflict-detach", "sync-conflict-detach-hint", "sync-conflict-archive", "sync-conflict-archive-hint", "sync-conflict-keep-card-local", "sync-conflict-creation", "sync-conflict-creation-hint", "sync-conflict-create-replacement", "sync-preview-button", "sync-preview-heading", "sync-preview-saved", "sync-preview-unavailable", "sync-preview-blocked", "sync-preview-create", "sync-preview-update", "sync-preview-archive", "sync-preview-baseline", "sync-preview-truncated", "sync-preview-omissions", "sync-preview-scope", "sync-preview-excluded", "sync-preview-unmapped", "sync-preview-parser-warnings", "sync-preview-parser-unsupported", "sync-source-heading", "sync-source-scope", "sync-source-unmapped", "sync-source-excluded", "sync-source-converted", "sync-source-fallback", "sync-source-excluded-item", "sync-source-occurrences", "sync-source-truncated", "sync-source-omitted", "sync-report-button", "sync-report-retention", "sync-report-partial", "sync-report-unfinished", "sync-report-failed", "sync-report-completed", "sync-report-completed-with-warnings", "sync-report-skipped", "sync-report-review-only", "sync-report-unavailable", "sync-report-empty", "sync-recovery-heading", "sync-recovery-description", "sync-recovery-unavailable", "sync-recovery-all", "sync-estimate-field", "sync-estimate-field-hint", "email-failure-smtp-temporary", "email-failure-smtp-rejected", "email-failure-smtp-authentication", "email-failure-smtp-configuration", "email-failure-recipient-unavailable", "email-failure-delivery-unconfirmed", "email-failure-acknowledgement-failed", "email-failure-delivery-failed", "email-failure-retry-limit", "sync-original-time"];
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

test('Kurdish Sync reports retain limits and partial-change caveats',()=>{
 assert.match(locale['sync-preview-truncated'],/100/);
 assert.match(locale['sync-source-truncated'],/100/);
 assert.match(locale['sync-report-retention'],/20.*30/);
 assert.match(locale['sync-source-scope'],/nirxên wan nayên nîşandan/);
 assert.match(locale['sync-report-partial'],/hin kart guhertibin/);
 assert.match(locale['sync-report-partial'],/nadomînin û betal nakin/);
 assert.notEqual(locale['sync-report-completed'],locale['sync-report-failed']);
});

test('Kurdish diagnostics retain permissions, missing-versus-null semantics and retry caution',()=>{
 assert.match(locale['sync-report-unavailable'],/destûra nivîsandinê li tevahiya lîsteyê/);
 assert.match(locale['sync-recovery-description'],/30/);
 assert.match(locale['sync-recovery-description'],/nikarin.*bidomînin an betal bikin/);
 assert.match(locale['sync-estimate-field-hint'],/tune tên paşguhkirin; null.*paqij dike/);
 assert.match(locale['email-failure-delivery-unconfirmed'],/berî hewldana nû venêre/);
 assert.notEqual(locale['email-failure-smtp-temporary'],locale['email-failure-smtp-rejected']);
});
