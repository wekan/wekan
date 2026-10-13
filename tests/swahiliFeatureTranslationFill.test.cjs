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

test('Swahili export and settings labels retain tokens and technical literals', async () => {
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  const keys = ["import-many-boards", "import-many-boards-hint", "import-one-board-per-project", "import-one-board-per-project-hint", "import-many-progress", "import-many-results-heading", "import-many-imported", "export-all-boards", "export-selected-boards", "export-all-boards-hint", "exportAllBoardsPopup-title", "exportToTrelloPopup-title", "trello-export-desc", "trello-export-include-attachments", "trello-export-start", "trello-export-open-board", "trello-export-warnings", "sandstorm-trello-access-needed", "sandstorm-allow-trello-access", "sandstorm-trello-access-granted", "sandstorm-forget-access", "sandstorm-trello-save-label", "import-file-label", "board-announcement", "board-announcement-enabled", "board-view-calendar-mode", "cards-use-list-color", "external-link-rules", "external-link-rules-description", "external-link-identifier-aliases", "read-only-field", "r-wrike-workflow", "r-wrike-workflow-note", "r-export-wrike-workflow", "r-import-wrike-workflow", "r-import-wrike-workflow-done", "r-moved-forward", "r-moved-back", "r-add-actinguser-assignee", "r-remove-all-assignees", "ldap-sync-now", "ldap-sync-now-done", "ldap-sync-now-error", "ldap-sync-now-nothing", "oauth-providers-allowed-email-domains", "login-setting-env-only"];
  for (const k of keys) { assert.notEqual(sw[k], en[k], k); assert.deepEqual(translationTokens(sw[k]), translationTokens(en[k]), k); }
  for (const literal of ['{number}', '{identifier}', '[{identifier}:{number}] = https://tracker.example.com/{identifier}/{number}']) assert.ok(sw['external-link-rules-description'].includes(literal));
  for (const literal of ['TK=Task', 'IN=Incident']) assert.ok(sw['external-link-identifier-aliases'].includes(literal));
  for (const literal of ['Active', 'Completed', 'Deferred', 'Cancelled', 'GET /workflows', 'JSON']) assert.ok(sw['r-wrike-workflow-note'].includes(literal));
  for (const literal of ['LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS','LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED']) assert.ok(sw['ldap-sync-now-nothing'].includes(literal));
  assert.match(sw['trello-export-desc'], /Swimlane: …/);
});
test('Swahili export guidance retains archive exceptions and access restrictions', () => {
  assert.match(sw['import-many-boards-hint'], /bila kuoanisha wanachama/);
  assert.match(sw['import-many-boards-hint'], /uhamisho mmoja.*bodi moja/);
  assert.match(sw['import-many-boards-hint'], /badala ya maandishi/);
  assert.match(sw['export-all-boards-hint'], /unayoweza kuhamisha/);
  assert.match(sw['export-all-boards-hint'], /Excel.*lahajedwali.*umbizo jingine.*\.zip/);
  assert.match(sw['sandstorm-trello-access-needed'], /haina ufikiaji.*kwanza/);
  assert.match(sw['trello-export-warnings'], /Si kila kitu/);
  assert.match(sw['r-wrike-workflow-note'], /imekamilika.*Completed au Cancelled.*haijakamilika.*Active au Deferred/);
  assert.match(sw['r-wrike-workflow-note'], /haziwezi kuhamishwa kutoka Wrike/);
  assert.match(sw['read-only-field'], /kila mwanachama anaona.*wasimamizi wa bodi pekee/);
  assert.match(sw['login-setting-env-only'], /tu kupitia mazingira ya seva.*kusoma tu/);
  assert.match(sw['oauth-providers-allowed-email-domains'], /tenganisha kwa koma; ukiacha tupu, vyote vinaruhusiwa/);
  assert.match(sw['cards-use-list-color'], /zisizo na rangi zao wenyewe/);
});

test('Swahili importer instructions keep literal syntax and data-loss limits', async () => {
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  for (const format of ['opml','orgmode','meistertask','obsidian','linear','ticktick','clickup','nullboard','kanri','pivotal','tasksorg','monday','superproductivity','taiga','vikunja','quire','wrike','teamwork','businessmap','redmine','notion','plane']) {
    const key = 'import-board-instruction-' + format;
    assert.notEqual(sw[key], en[key], key);
    assert.deepEqual(translationTokens(sw[key]), translationTokens(en[key]), key);
  }
  for (const literal of ['TODO','DONE','SCHEDULED','DEADLINE','CLOSED']) assert.ok(sw['import-board-instruction-orgmode'].includes(literal));
  for (const literal of ['Tasklist','Task','Description','Assign to','Start date','Due date','Priority','Estimated time','Tags','Status','--','##','>>']) assert.ok(sw['import-board-instruction-teamwork'].includes(literal));
  for (const format of ['taiga','vikunja']) assert.match(sw['import-board-instruction-' + format], /Viambatisho haviagizwi/);
  assert.match(sw['import-board-instruction-quire'], /Maoni na viambatisho havimo/);
  assert.match(sw['import-board-instruction-notion'], /Mahusiano, picha na viambatisho haviagizwi/);
  assert.match(sw['import-board-instruction-plane'], /haina maelezo au viambatisho.*haviagizwi/);
  assert.match(sw['import-board-instruction-nullboard'], /bodi yake ya kwanza/);
  assert.match(sw['import-board-instruction-kanri'], /bodi ya kwanza ndiyo huagizwa/);
  assert.match(sw['import-board-instruction-businessmap'], /vichwa yawe ya Kiingereza kwanza/);
  assert.match(sw['import-board-instruction-redmine'], /English katika My account kabla ya kuhamisha/);
});
