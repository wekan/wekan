// The completed catalog predates newer features; keep its no-regression gate.
// Full translation work remains visible through fill-translations.mjs --list.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const fillScript = path.join(root, 'releases/translations/fill-translations.mjs');
const result = spawnSync(process.execPath, [fillScript, '--completed-catalog', '--list', 'gd'], {
  cwd: root,
  encoding: 'utf8',
});
assert.equal(result.status, 0, result.stderr);
const remaining = JSON.parse(result.stdout);
assert.equal(Object.keys(remaining).length, 0);

const english = JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/en.i18n.json'), 'utf8'));
const gaelic = JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/gd.i18n.json'), 'utf8'));
const tokens = (value) => [...value.matchAll(/__[A-Za-z0-9_]+__|%[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g)].map(([token]) => token).sort();
const tags = (value) => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)].map(([tag]) => tag).sort();

for (const [key, value] of Object.entries(gaelic)) {
  if (value !== english[key]) assert.deepEqual(tokens(value), tokens(english[key]), key);
  assert.deepEqual(tags(value), tags(english[key]), key);
}

assert.equal(gaelic.accept, 'Gabh ris');
assert.match(gaelic['act-createBoard'], /bòrd/);
assert.match(gaelic['act-createCard'], /cairt/);
assert.equal(gaelic.log, 'Loga');

const attachmentStorageKeys = ["attach-card", "attachCardPopup-title", "attach-card-hint", "attached-card-unavailable", "detach-card", "attach-card-self", "attach-card-limit", "attach-card-not-found", "MongoDB_version", "MongoDB_storage_engine", "MongoDB_Oplog_enabled", "r-sort-by", "r-is", "r-to", "r-of", "r-d-send-email-to", "r-by", "dueCardsViewChange-choice-me", "s3-file-id", "s3-minio-storage-description", "s3-disabled", "mongodb-gridfs-storage", "s3-access-key", "s3-bucket", "s3-bucket-description", "s3-connection-failed", "s3-connection-success", "s3-enabled", "s3-endpoint", "s3-endpoint-description", "s3-minio-storage", "s3-port", "s3-port-description", "s3-region", "s3-secret-key", "s3-secret-key-required", "s3-settings-saved", "s3-ssl-enabled", "of", "s3-attachments", "s3-size"];
for (const key of attachmentStorageKeys) {
  assert.notEqual(gaelic[key], english[key], key);
  assert.deepEqual(tokens(gaelic[key]), tokens(english[key]), key);
}
assert.match(gaelic['attach-card-self'], /Chan urrainn.*rithe fhèin/);
assert.match(gaelic['attach-card-not-found'], /Cha deach.*a chì thu/);
assert.match(gaelic['s3-access-key'], /inntrigidh/);
assert.match(gaelic['s3-secret-key'], /dhìomhair/);
assert.notEqual(gaelic['s3-access-key'], gaelic['s3-secret-key']);
assert.match(gaelic['s3-endpoint-description'], /s3.amazonaws.com.*minio.example.com/);

const fieldLinkKeys = ["board-announcement", "board-announcement-enabled", "board-view-calendar-mode", "custom-field-links", "custom-field-links-hint", "custom-field-links-none", "custom-field-link-unavailable", "custom-field-link-fields", "custom-field-link-no-fields", "custom-field-link-inactive", "custom-field-unlink", "custom-field-link-target", "custom-field-link-direction", "custom-field-link-both", "custom-field-link-send", "custom-field-link-sends", "custom-field-link-receives", "custom-field-link-add", "field-link-self", "field-link-limit", "field-link-archived", "field-link-invalid", "field-link-not-found", "field-link-not-allowed", "cardCustomFieldLinksPopup-title", "cards-use-list-color"];
for (const key of fieldLinkKeys) {
  assert.notEqual(gaelic[key], english[key], key);
  assert.deepEqual(tokens(gaelic[key]), tokens(english[key]), key);
}
assert.match(gaelic['custom-field-link-both'], /An dà threo.*chairt eile/);
assert.match(gaelic['custom-field-link-send'], /Aon treo.*phrìomh chairt/);
assert.match(gaelic['custom-field-link-inactive'], /an dà chairt a dheasachadh tuilleadh.*san tasglann/);
assert.match(gaelic['field-link-not-allowed'], /an dà chairt a dheasachadh/);
assert.match(gaelic['custom-field-links-hint'], /Chan atharraichear.*aon chairt/);
assert.match(gaelic['field-link-self'], /Chan urrainn.*rithe fhèin/);

const importGuideKeys = ["import-board-instruction-opml", "import-board-instruction-orgmode", "import-board-instruction-meistertask", "import-board-instruction-obsidian", "import-board-instruction-linear", "import-board-instruction-ticktick", "import-board-instruction-clickup", "import-board-instruction-nullboard", "import-board-instruction-kanri", "import-board-instruction-pivotal"];
for (const key of importGuideKeys) {
  assert.notEqual(gaelic[key], english[key], key);
  assert.deepEqual(tokens(gaelic[key]), tokens(english[key]), key);
}
assert.match(gaelic['import-board-instruction-orgmode'], /TODO agus DONE.*SCHEDULED, DEADLINE agus CLOSED/);
assert.match(gaelic['import-board-instruction-meistertask'], /gnìomhan crìochnaichte an ceann-là crìochnachaidh/);
assert.match(gaelic['import-board-instruction-nullboard'], /leubail raw.*a’ chiad bhòrd/);
assert.match(gaelic['import-board-instruction-kanri'], /a’ chiad bhòrd/);
assert.match(gaelic['import-board-instruction-clickup'], /a h-uile colbh/);

const moreImportGuideKeys = ["import-board-instruction-tasksorg", "import-board-instruction-monday", "import-board-instruction-superproductivity", "import-board-instruction-taiga", "import-board-instruction-vikunja", "import-board-instruction-quire", "import-board-instruction-wrike", "import-board-instruction-teamwork", "import-board-instruction-businessmap", "import-board-instruction-redmine", "import-board-instruction-notion", "import-board-instruction-plane"];
for (const key of moreImportGuideKeys) {
  assert.notEqual(gaelic[key], english[key], key);
  assert.deepEqual(tokens(gaelic[key]), tokens(english[key]), key);
}
for (const format of ['taiga', 'vikunja']) assert.match(gaelic[`import-board-instruction-${format}`], /Cha tèid ceanglachain ion-phortadh/);
assert.match(gaelic['import-board-instruction-quire'], /Chan eil beachdan no ceanglachain/);
assert.match(gaelic['import-board-instruction-businessmap'], /gu Beurla an toiseach/);
assert.match(gaelic['import-board-instruction-redmine'], /gu Beurla.*My account mus/);
assert.match(gaelic['import-board-instruction-notion'], /Cha tèid dàimhean, dealbhan no ceanglachain/);
assert.match(gaelic['import-board-instruction-plane'], /Chan eil tuairisgeulan no ceanglachain.*cha tèid an ion-phortadh/);

const importControlKeys = ["import-members-mode-heading", "import-members-mode-map", "import-members-mode-placeholder", "import-members-mode-me", "csv-mapping-title", "csv-mapping-description", "csv-mapping-not-in-file", "csv-mapping-column-number", "csv-mapping-list-missing", "csv-mapping-list-name", "csv-mapping-custom-fields", "csv-mapping-boards", "csv-mapping-skipped-sheets", "csv-mapping-title-required", "csv-mapping-list-required", "invalid-import-mapping", "import-many-boards", "import-many-boards-hint", "import-one-board-per-project", "import-one-board-per-project-hint", "import-many-progress", "import-many-results-heading", "import-many-imported", "export-all-boards", "export-selected-boards", "export-all-boards-hint", "exportAllBoardsPopup-title"];
for (const key of importControlKeys) {
  assert.notEqual(gaelic[key], english[key], key);
  assert.deepEqual(tokens(gaelic[key]), tokens(english[key]), key);
}
assert.match(gaelic['import-members-mode-placeholder'], /h-ainmean aca fhèin.*fìor chleachdaichean nas anmoiche/);
assert.match(gaelic['import-many-boards-hint'], /gun mhaidseadh bhall.*na aon bhòrd.*an àite an raoin gu h-àrd/);
assert.match(gaelic['export-all-boards-hint'], /aon leabhar-obrach.*siota airson gach bòrd.*\.zip.*faidhle airson gach bòrd/);
assert.match(gaelic['csv-mapping-title-required'], /tiotalan nan cairtean/);

const integrationKeys = ["exportToTrelloPopup-title", "trello-export-desc", "trello-export-include-attachments", "trello-export-start", "trello-export-open-board", "trello-export-warnings", "sandstorm-trello-access-needed", "sandstorm-allow-trello-access", "sandstorm-trello-access-granted", "sandstorm-forget-access", "sandstorm-trello-save-label", "external-link-rules", "external-link-rules-description", "external-link-identifier-aliases", "webhook-payload-heading", "webhook-payload-description", "webhook-payload-text", "webhook-payload-fields", "webhook-payload-field-standard", "webhook-payload-field-ids", "webhook-payload-field-names", "webhook-payload-field-links", "webhook-payload-field-actor", "webhook-payload-field-people", "webhook-payload-field-details", "webhook-hide-identity", "webhook-someone", "notification-delivery-layout-classic", "notification-delivery-layout-clear", "notification-delivery-parts", "notification-delivery-part-board", "notification-delivery-part-actor", "notification-delivery-part-card", "notification-delivery-part-details", "notification-delivery-part-dates", "notification-delivery-part-link", "notification-delivery-grouping", "notification-delivery-grouping-all", "notification-delivery-grouping-board", "notification-delivery-grouping-card", "notification-delivery-grouping-none", "notification-delivery-schedule", "notification-delivery-schedule-immediate", "notification-delivery-schedule-interval", "notification-delivery-schedule-daily", "notification-delivery-interval", "notification-delivery-minutes", "notification-delivery-quiet", "notification-delivery-quiet-clear", "notification-delivery-timezone", "notification-delivery-invalid", "notification-group-card", "notification-group-board"];
for (const key of integrationKeys) {
  assert.notEqual(gaelic[key], english[key], key);
  assert.deepEqual(tokens(gaelic[key]), tokens(english[key]), key);
}
for (const key of ['external-link-rules-description', 'external-link-identifier-aliases']) {
  assert.deepEqual(gaelic[key].match(/\{(?:number|identifier)\}/g), english[key].match(/\{(?:number|identifier)\}/g));
}
assert.match(gaelic['trello-export-desc'], /Swimlane: …/);
assert.match(gaelic['sandstorm-trello-access-needed'], /Chan eil.*an toiseach/);
assert.match(gaelic['webhook-payload-description'], /dhìleab.*mur eil dad suidhichte/);
assert.match(gaelic['notification-delivery-quiet'], /fuirich gus am bi iad seachad/);
assert.notEqual(gaelic['notification-delivery-grouping-board'], gaelic['notification-delivery-grouping-card']);

const workflowKeys = ["read-only-field", "r-wrike-workflow", "r-wrike-workflow-note", "r-export-wrike-workflow", "r-import-wrike-workflow", "r-import-wrike-workflow-done", "r-moved-forward", "r-moved-back", "r-add-actinguser-assignee", "r-remove-all-assignees", "ldap-sync-now", "ldap-sync-now-done", "ldap-sync-now-error", "ldap-sync-now-nothing", "oauth-providers-allowed-email-domains", "import-file-label", "subtask-mark-done", "subtask-mark-not-done", "subtask-done-no-permission"];
for (const key of workflowKeys) {
  assert.notEqual(gaelic[key], english[key], key);
  assert.deepEqual(tokens(gaelic[key]), tokens(english[key]), key);
}
assert.match(gaelic['read-only-field'], /gach ball.*ach chan atharraich ach rianairean/);
assert.match(gaelic['r-wrike-workflow-note'], /GET \/workflows.*Completed no Cancelled.*Active no Deferred.*Chan urrainnear riaghailtean/);
assert.match(gaelic['ldap-sync-now-nothing'], /LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS.*LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED/);
assert.match(gaelic['oauth-providers-allowed-email-domains'], /cromagan.*ceadaichear a h-uile fear.*falamh/);
assert.notEqual(gaelic['subtask-mark-done'], gaelic['subtask-mark-not-done']);
assert.match(gaelic['subtask-done-no-permission'], /Chan urrainn dhut/);

const recoveryKeys = ["stuck-sync-operation-heading", "stuck-sync-operation-description", "stuck-sync-operation-list", "stuck-sync-operation-applied", "stuck-sync-operation-reason-scope-changed", "stuck-sync-operation-reason-access-denied", "stuck-sync-operation-reason-trigger-unknown", "stuck-sync-operation-reason-intent-missing", "stuck-sync-operation-reason-unknown", "stuck-sync-operation-replayable-now", "stuck-sync-operation-discard-confirm", "stuck-sync-operation-empty", "stuck-sync-operation-truncated", "stuck-sync-operation-unavailable", "stuck-sync-operation-missing", "stuck-sync-operation-not-stuck", "stuck-sync-operation-replayable", "stuck-sync-operation-busy", "interrupted-import-heading", "interrupted-import-description", "interrupted-import-progress", "interrupted-import-created", "interrupted-import-source", "interrupted-import-state-stopped", "interrupted-import-state-failed", "interrupted-import-state-discarding", "interrupted-import-counts", "interrupted-import-no-board", "interrupted-import-keep", "interrupted-import-keep-confirm", "interrupted-import-discard-confirm", "interrupted-import-empty", "interrupted-import-truncated", "interrupted-import-unavailable", "interrupted-import-missing", "interrupted-import-not-interrupted", "interrupted-import-foreign-board", "login-setting-env-only"];
for (const key of recoveryKeys) {
  assert.notEqual(gaelic[key], english[key], key);
  assert.deepEqual(tokens(gaelic[key]), tokens(english[key]), key);
}
assert.match(gaelic['stuck-sync-operation-discard-confirm'], /Fuirichidh.*cha tèid an còrr a sgrìobhadh gu bràth/);
assert.match(gaelic['interrupted-import-description'], /faidhle tùsail.*air a chumail.*a chaidh a chur ris bhon uair sin/);
assert.match(gaelic['interrupted-import-discard-confirm'], /gach rud air.*gu buan/);
assert.match(gaelic['interrupted-import-keep-confirm'], /Cha tèid dad a thoirt air falbh/);
assert.match(gaelic['interrupted-import-foreign-board'], /cha deach atharrachadh/);
for (const key of ['stuck-sync-operation-truncated', 'interrupted-import-truncated']) assert.match(gaelic[key], /50 fear as sine/);
const fullCatalog = spawnSync(process.execPath, [fillScript, '--list', 'gd'], { cwd: root, encoding: 'utf8' });
assert.equal(fullCatalog.status, 0, fullCatalog.stderr);
assert.deepEqual(JSON.parse(fullCatalog.stdout), {}, 'Full Scottish Gaelic placeholder inventory including pending keys');

// Meaning checks catch stale English and wrong actions even after placeholders reach zero.
for (const key of ['card-recurrence-interval', 'cardRecurrenceIntervalPopup-title']) {
  assert.equal(gaelic[key], 'Ath-aithris na cairt');
  assert.doesNotMatch(gaelic[key], /Ath-shuidheachadh/);
}
assert.match(gaelic['card-recurrence-interval-none'], /cha dèanar.*a-rithist/);
assert.doesNotMatch(gaelic['card-recurrence-interval-none'], /ath-shuidhichear/);
assert.match(gaelic['move-reason'], /Adhbhar.*roghainneil/);
assert.match(gaelic['ask-move-reason'], /Iarr adhbhar.*cairtean/);
assert.doesNotMatch(gaelic['move-reason'] + gaelic['ask-move-reason'], /Tuairisgeul/);
for (const format of ['todoist', 'planner']) {
  const value = gaelic[`import-board-instruction-${format}`];
  assert.match(value, /^Ann /);
  assert.doesNotMatch(value, /open the|choose|Sections become|Buckets become/);
}
assert.match(gaelic['import-board-instruction-todoist'], /Stiùirich dàta > Às-phortaich mar CSV/);
assert.match(gaelic['import-board-instruction-todoist'], /@leubailean.*p1 gu p3/);
assert.match(gaelic['import-board-instruction-planner'], /Planner clasaigeach.*\.xlsx/);
assert.match(gaelic['import-board-instruction-planner'], /Adhartas, Prìomhachas agus Crìochnaichte le.*raointean gnàthaichte/);

for (const kind of ['due', 'start', 'end', 'received']) {
  assert.match(gaelic[`r-when-a-${kind}-date-changed`], /^Nuair a thèid.*a shuidheachadh no atharrachadh$/);
  assert.doesNotMatch(gaelic[`r-when-a-${kind}-date-changed`], /ceann-latha air atharrachadh$/);
}
assert.equal(gaelic['calendar-system-iso8601'], 'Mìosachan Griogarach (seachdainean ISO 8601)');
assert.equal(gaelic['linkCardToBoardPopup-title'], 'Ceangail ri bòrd');
assert.doesNotMatch(gaelic['linkCardToBoardPopup-title'], /seo/);
assert.equal(gaelic['linkCardToNewBoard'], 'Cruthaich bòrd bhon chairt seo');

// Report methodology must retain limits and fallbacks, not compressed symbols.
for (const kind of ['agingWip', 'blockerAnalysis', 'monteCarlo', 'processBehavior', 'sizeCycleTime']) {
  assert.doesNotMatch(gaelic[`flow-note-${kind}`], /→|≥|≤|✓|MR̄/);
  assert.notEqual(gaelic[`flow-note-${kind}`], english[`flow-note-${kind}`]);
}
assert.match(gaelic['flow-note-agingWip'], /85mh.*co-dhiù còig.*chan eil an aois aithnichte/);
assert.match(gaelic['flow-note-blockerAnalysis'], /as sine aithnichte.*dealbhan-glèidhte.*a chunntadh fa leth/);
assert.match(gaelic['flow-note-monteCarlo'], /2,000.*UTC.*gun obair chrìochnaichte/);
assert.match(gaelic['flow-note-monteCarlo'], /cheann àrd.*cheann ìosal.*chan e gealladh cinnteach.*3,650.*cha bhi ro-mheasadh/);
assert.match(gaelic['flow-note-processBehavior'], /cruthachaidh.*tasglannaidh.*co-dhiù dà chrìochnachadh dligheach/);
assert.match(gaelic['flow-note-sizeCycleTime'], /aon raon àireamhach.*neo-dhligheach fhàgail às.*cruthachaidh.*tasglannaidh/);
assert.match(gaelic['flow-error'], /aithisg.*luachan.*feuch ris a-rithist/);
assert.equal(gaelic['board-view-monte-carlo'], 'Ro-mheasaidhean Monte Carlo');
assert.doesNotMatch(gaelic['board-view-monte-carlo'], /Histogram/);

assert.match(gaelic['flow-age-days'], /Aois san ìre/);
assert.match(gaelic['flow-p85'], /85mh ceudail/);
assert.match(gaelic['flow-active'], /fosgailte/);
assert.match(gaelic['flow-capacity'], /Co-dhiù.*chairtean/);
assert.match(gaelic['flow-target-count'], /Àireamh chairtean mar amas/);
assert.match(gaelic['flow-target-date'], /Ceann-là mar amas/);
assert.notEqual(gaelic['flow-target-date'], gaelic['flow-finish-date']);
assert.notEqual(gaelic['flow-mean'], gaelic['flow-mr-mean']);
assert.equal(gaelic['flow-size'], 'Tuairmse');
for (const key of ['flow-capacity', 'flow-moving-range', 'flow-mr-mean', 'flow-mean', 'flow-beyond-horizon']) {
  assert.doesNotMatch(gaelic[key], /≥|Δ|MR̄|x̄|3650/);
}

assert.match(gaelic['import-board-instruction-jira'], /GET \/rest\/api\/3\/search\/jql\?jql=project=KEY&fields=\*all&expand=names,schema/);
assert.match(gaelic['import-board-instruction-jira'], /às aonais fields.*IDan.*nextPageToken.*aon arraigh "issues"/);
assert.match(gaelic['import-board-instruction-jira'], /bhòrd fa leth.*automationRules/);
assert.match(gaelic['import-board-instruction-excel'], /aon chairt anns gach sreath.*gach bòrd air duilleag fa leth/);
assert.match(gaelic['import-board-instruction-excel'], /an ath cheum.*gach colbh.*gach duilleag.*bhann-cinn/);
assert.doesNotMatch(gaelic['import-board-instruction-excel'], /na h-aon cholbhan ri às-phortadh/);
assert.match(gaelic['toggle-header-icons-collapsed'], /brathan.*fòn-làimhe\/deasg/);
