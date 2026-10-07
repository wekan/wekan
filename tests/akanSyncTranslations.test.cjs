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

test('Akan Sync reports and email failures preserve limits and missing-value semantics', async()=>{
 const {translationTokens}=await import('../releases/translations/placeholder-tokens.mjs');
 const keys=["sync-report-button", "sync-report-retention", "sync-report-partial", "sync-report-unfinished", "sync-report-failed", "sync-report-completed", "sync-report-completed-with-warnings", "sync-report-skipped", "sync-report-review-only", "sync-report-unavailable", "sync-report-empty", "sync-recovery-heading", "sync-recovery-description", "sync-recovery-unavailable", "sync-recovery-all", "sync-estimate-field", "sync-estimate-field-hint", "email-failure-smtp-temporary", "email-failure-smtp-rejected", "email-failure-smtp-authentication", "email-failure-smtp-configuration", "email-failure-recipient-unavailable", "email-failure-delivery-unconfirmed", "email-failure-acknowledgement-failed", "email-failure-delivery-failed", "email-failure-retry-limit", "sync-original-time", "sync-remaining-time", "sync-time-estimate-hint"];
 for(const key of keys){
  assert.notEqual(data[key],english[key],key);
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 }
 assert.match(data['sync-report-retention'],/20.*30/);
 assert.match(data['sync-recovery-description'],/30.*ID/);
 assert.match(data['sync-report-partial'],/ntoa.*ɛnsan nyi/);
 for(const key of ['sync-estimate-field-hint','sync-time-estimate-hint']){
  assert.match(data[key],/enni hɔ.*null.*yi botae/);
  assert.match(data[key],/nsɛm a enhyia/);
 }
 assert.match(data['sync-time-estimate-hint'],/biako pɛ/);
 for(const key of ['sync-original-time','sync-remaining-time']) assert.match(data[key],/nnɔnhwerew/);
 assert.equal(new Set(['unfinished','failed','completed','skipped'].map(s=>data['sync-report-'+s])).size,4);
 assert.notEqual(data['email-failure-smtp-temporary'],data['email-failure-smtp-rejected']);
 assert.notEqual(data['email-failure-delivery-unconfirmed'],data['email-failure-delivery-failed']);
 assert.notEqual(data['email-failure-smtp-authentication'],data['email-failure-smtp-configuration']);
});

test('Akan notification recovery preserves cancellation and retained work', async()=>{
 const {translationTokens}=await import('../releases/translations/placeholder-tokens.mjs');
 const keys=["activity-recovery-heading", "activity-recovery-description", "activity-recovery-empty", "activity-recovery-unavailable", "activity-recovery-retry", "activity-recovery-retrying", "activity-recovery-status-pending", "activity-recovery-status-preparing", "activity-recovery-status-processing", "activity-recovery-status-missing", "activity-recovery-status-changed", "activity-recovery-status-invalid", "activity-recovery-status-inconsistent", "activity-recovery-busy", "activity-recovery-denied", "activity-recovery-source-unavailable", "activity-recovery-disabled", "activity-recovery-failed", "activity-recovery-pause", "activity-recovery-resume", "activity-recovery-paused", "activity-recovery-control-conflict", "activity-recovery-control-failed", "activity-recovery-status-cancelled", "activity-recovery-cancel", "activity-recovery-cancel-confirm", "rule-email-recovery-unavailable"];
 for(const key of keys){
  assert.notEqual(data[key],english[key],key);
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 }
 assert.equal(new Set(['pause','resume','cancel'].map(s=>data['activity-recovery-'+s])).size,3);
 assert.equal(new Set(['pending','preparing','processing','missing','changed','invalid','inconsistent','cancelled'].map(s=>data['activity-recovery-status-'+s])).size,8);
 assert.match(data['activity-recovery-description'],/wɔnyɛ dwumadi no foforo da/);
 assert.match(data['activity-recovery-source-unavailable'],/Wɔanyɛ biribiara foforo/);
 assert.match(data['activity-recovery-failed'],/Wɔakora adwuma a ɛretwɛn no so/);
 assert.match(data['activity-recovery-cancel-confirm'],/korakora.*Wuntumi ntoa eyi so bio/);
 assert.match(data['activity-recovery-cancel-confirm'],/email.*twɛn mu dedaw.*akɔdu dedaw/);
 assert.match(data['activity-recovery-control-conflict'],/ans[a] na woasan asɔ ahwɛ/);
});
