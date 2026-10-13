'use strict';
const assert = require('node:assert/strict');
const test = require('node:test');
const en = require('../imports/i18n/data/en.i18n.json');
const sw = require('../imports/i18n/data/sw.i18n.json');
test('Swahili card links and recovery instructions are translated with exact tokens', async () => {
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  const keys = Object.keys(en).filter(k => /^(?:attach-card(?:-|$)|attachCardPopup-title$|attached-card-unavailable$|detach-card$|custom-field-link|custom-field-unlink$|field-link-|cardCustomFieldLinksPopup-title$|stuck-sync-operation-|interrupted-import-|scrum-history-checkpoint-|webhook-payload-|webhook-hide-identity$|webhook-someone$|notification-delivery-|notification-group-|sync-planning-|csv-mapping-|import-members-mode-|invalid-import-mapping$|scrum-import-|scrum-release-scope$|scrum-releases-select-help$|subtask-mark-|subtask-done-no-permission$)/.test(k));
  assert.ok(keys.length >= 155);
  for (const k of keys) {
    assert.equal(typeof sw[k], 'string', k);
    assert.ok(sw[k].trim(), k);
    assert.notEqual(sw[k], en[k], k);
    assert.deepEqual(translationTokens(sw[k]), translationTokens(en[k]), k);
  }
});
test('Swahili field links preserve edit permission and propagation direction', () => {
  assert.match(sw['custom-field-links-hint'], /jina na aina sawa/);
  assert.match(sw['custom-field-links-hint'], /kadi moja tu zinaachwa bila kubadilishwa/);
  assert.match(sw['custom-field-link-both'], /Pande zote mbili/);
  assert.match(sw['custom-field-link-send'], /Upande mmoja.*kadi kuu/);
  assert.match(sw['custom-field-link-sends'], /kadi hii.*kadi ile/);
  assert.match(sw['custom-field-link-receives'], /kadi ile.*kadi hii/);
  assert.match(sw['field-link-not-allowed'], /kuhariri kadi zote mbili/);
  assert.doesNotMatch(sw['field-link-not-allowed'], /kuona kadi zote mbili/);
  for (const k of ['attached-card-unavailable','custom-field-link-unavailable']) assert.match(sw[k], /huwezi kuona/);
  for (const k of ['attach-card-self','field-link-self']) assert.match(sw[k], /haiwezi.*yenyewe/);
});
test('Swahili recovery separates retained data, unwritten changes and board deletion', () => {
  assert.match(sw['stuck-sync-operation-description'], /yaliyotekelezwa tayari yanabaki.*hayaandikwi kamwe/);
  assert.match(sw['stuck-sync-operation-description'], /unalinganisha orodha na chanzo chake tena/);
  assert.match(sw['stuck-sync-operation-discard-confirm'], /tayari yanabaki; yaliyobaki hayaandikwi kamwe/);
  assert.match(sw['stuck-sync-operation-replayable-now'], /itakamilika yenyewe.*haiwezi kutupiliwa mbali/);
  assert.match(sw['interrupted-import-description'], /hauwezi kuendelezwa.*faili yake ya chanzo haihifadhiwi/);
  assert.match(sw['interrupted-import-description'], /chochote kilichoongezwa baadaye/);
  assert.match(sw['interrupted-import-keep-confirm'], /Hakuna kinachoondolewa/);
  assert.match(sw['interrupted-import-discard-confirm'], /kila kitu kilichomo vinaondolewa kabisa/);
  assert.doesNotMatch(sw['interrupted-import-keep-confirm'], /vinaondolewa kabisa/);
  assert.match(sw['interrupted-import-foreign-board'], /haikuundwa.*haikuguswa/);
  assert.match(sw['scrum-history-checkpoint-hint'], /tu ikiwa hakuna mtu mwingine aliyebadilisha/);
  assert.match(sw['scrum-history-checkpoint-hint'], /hakubadilishi rekodi yoyote/);
  assert.match(sw['scrum-history-checkpoint-discard-confirm'], /pamoja na mabadiliko.*tayari iliandika/);
  for (const k of ['stuck-sync-operation-truncated','interrupted-import-truncated']) assert.match(sw[k], /50 za zamani zaidi tu/);
});

test('Swahili scheduling retains quiet hours, defaults and planning safeguards', () => {
  assert.match(sw['webhook-hide-identity'], /Usijumuishe jina langu/);
  assert.match(sw['webhook-payload-description'], /mpangilio uliorithiwa/);
  assert.match(sw['webhook-payload-description'], /bila mpangilio wowote/);
  assert.match(sw['notification-delivery-quiet'], /subiri hadi ziishe/);
  assert.doesNotMatch(sw['notification-delivery-quiet'], /futa/);
  assert.match(sw['notification-delivery-grouping-all'], /muda wa kutumwa.*ujumbe mmoja/);
  assert.match(sw['notification-delivery-grouping-board'], /kila bodi/);
  assert.match(sw['notification-delivery-grouping-card'], /kila kadi/);
  assert.match(sw['sync-planning-hint'], /tu wakati Scrum imewezeshwa/);
  assert.match(sw['sync-planning-hint'], /kwanza kwa kitambulisho chake cha chanzo, kisha kwa jina/);
  assert.match(sw['sync-planning-hint'], /linabaki mpaka chanzo kibadilishe/);
  assert.match(sw['sync-planning-hint'], /wa kwanza hauondoi upangaji kamwe/);
  for (const name of ['Rocket.Chat','Slack']) assert.ok(sw['webhook-payload-description'].includes(name));
  assert.ok(sw['webhook-payload-field-standard'].includes('WEBHOOKS_ATTRIBUTES'));
});
test('Swahili import matching and subtasks preserve refusal and no-change meanings', () => {
  assert.match(sw['import-members-mode-placeholder'], /majina yao wenyewe.*watumiaji halisi baadaye/);
  assert.match(sw['import-members-mode-map'], /mtumiaji aliyepo kwa kila/);
  assert.match(sw['csv-mapping-list-missing'], /orodha moja.*kadi zote/);
  assert.match(sw['invalid-import-mapping'], /haulingani na faili/);
  assert.match(sw['scrum-import-into-board-hint'], /havinakiliwi kamwe/);
  assert.match(sw['scrum-import-into-board-hint'], /zisizolingana.*bila kubadilishwa/);
  assert.match(sw['scrum-import-card-ambiguous'], /zaidi ya kadi moja/);
  assert.match(sw['scrum-import-card-on-another-board'], /bodi nyingine.*bila kubadilishwa/);
  assert.match(sw['scrum-import-sprint-finished'], /haikuhamishwa.*kilichokamilika/);
  assert.match(sw['scrum-releases-select-help'], /Ctrl.*Cmd.*Mac.*kila toleo/);
  assert.match(sw['subtask-mark-not-done'], /haijakamilika/);
  assert.doesNotMatch(sw['subtask-mark-done'], /haijakamilika/);
  assert.match(sw['subtask-done-no-permission'], /Huwezi kubadilisha/);
});
