// The completed catalog predates newer features; keep its no-regression gate.
// Full translation work remains visible through fill-translations.mjs --list.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const fillScript = path.join(root, 'releases/translations/fill-translations.mjs');
const result = spawnSync(process.execPath, [fillScript, '--completed-catalog', '--list', 'ga'], {
  cwd: root,
  encoding: 'utf8',
});
assert.equal(result.status, 0, result.stderr);
const remaining = JSON.parse(result.stdout);
// This explicit count makes a skipped or oversized batch visible. The token
// and tag inventory checks below protect every translated value.
assert.equal(Object.keys(remaining).length, 0);

const english = JSON.parse(
  fs.readFileSync(path.join(root, 'imports/i18n/data/en.i18n.json'), 'utf8'),
);
const irish = JSON.parse(
  fs.readFileSync(path.join(root, 'imports/i18n/data/ga.i18n.json'), 'utf8'),
);
const tokens = (value) =>
  [
    ...value.matchAll(
      /__[A-Za-z0-9_]+__|%[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g,
    ),
  ]
    .map(([token]) => token)
    .sort();
const tags = (value) =>
  [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)]
    .map(([tag]) => tag)
    .sort();

for (const [key, value] of Object.entries(irish)) {
  if (value !== english[key]) {
    assert.deepEqual(tokens(value), tokens(english[key]), key);
  }
  assert.deepEqual(tags(value), tags(english[key]), key);
}

assert.equal(irish.accept, 'Glac');
assert.deepEqual(tokens(irish['activity-changedTitle']), ['%s', '%s']);
assert.deepEqual(tokens(irish['act-removeChecklistItem']), [
  '__board__',
  '__card__',
  '__checkList__',
  '__checklistItem__',
  '__list__',
  '__swimlane__',
]);
assert.match(irish['act-createBoard'], /clár/);
assert.match(irish['act-createCard'], /cárta/);

const cardLinkKeys = ["attach-card", "attachCardPopup-title", "attach-card-hint", "attached-card-unavailable", "detach-card", "attach-card-self", "attach-card-limit", "attach-card-not-found", "board-announcement", "board-announcement-enabled", "board-view-calendar-mode", "custom-field-links", "custom-field-links-hint", "custom-field-links-none", "custom-field-link-unavailable", "custom-field-link-fields", "custom-field-link-no-fields", "custom-field-link-inactive", "custom-field-unlink", "custom-field-link-target", "custom-field-link-direction", "custom-field-link-both", "custom-field-link-send", "custom-field-link-sends", "custom-field-link-receives", "custom-field-link-add", "field-link-self", "field-link-limit", "field-link-archived", "field-link-invalid", "field-link-not-found", "field-link-not-allowed", "cardCustomFieldLinksPopup-title", "cards-use-list-color"];
for (const key of cardLinkKeys) {
  assert.notEqual(irish[key], english[key], key);
  assert.deepEqual(tokens(irish[key]), tokens(english[key]), key);
}
assert.match(irish['custom-field-link-both'], /Sa dá threo.*cheachtar cárta/);
assert.match(irish['custom-field-link-send'], /I dtreo amháin.*bpríomhchárta/);
assert.match(irish['custom-field-link-inactive'], /Ar sos.*an dá chárta.*sa chartlann/);
assert.match(irish['field-link-not-allowed'], /an dá chárta a chur in eagar/);
assert.match(irish['attach-card-self'], /Ní féidir.*leis féin/);
assert.match(irish['custom-field-links-hint'], /Ní athraítear réimsí.*chárta amháin/);

assert.match(irish['s3-access-key'], /rochtana/);
assert.match(irish['s3-secret-key'], /rúnda/);
assert.notEqual(irish['s3-access-key'], irish['s3-secret-key']);
assert.match(irish['s3-endpoint-description'], /s3.amazonaws.com.*minio.example.com/);

const importGuideKeys = ["import-board-instruction-opml", "import-board-instruction-orgmode", "import-board-instruction-meistertask", "import-board-instruction-obsidian", "import-board-instruction-linear", "import-board-instruction-ticktick", "import-board-instruction-clickup", "import-board-instruction-nullboard", "import-board-instruction-kanri", "import-board-instruction-pivotal"];
for (const key of importGuideKeys) {
  assert.notEqual(irish[key], english[key], key);
  assert.deepEqual(tokens(irish[key]), tokens(english[key]), key);
}
assert.match(irish['import-board-instruction-orgmode'], /TODO agus DONE.*SCHEDULED, DEADLINE agus CLOSED/);
assert.match(irish['import-board-instruction-meistertask'], /tascanna críochnaithe a ndáta críochnaithe/);
assert.match(irish['import-board-instruction-nullboard'], /lipéad raw.*an chéad chlár/);
assert.match(irish['import-board-instruction-kanri'], /an chéad chlár/);
assert.match(irish['import-board-instruction-clickup'], /colúin go léir/);

const moreImportGuideKeys = ["import-board-instruction-tasksorg", "import-board-instruction-monday", "import-board-instruction-superproductivity", "import-board-instruction-taiga", "import-board-instruction-vikunja", "import-board-instruction-quire", "import-board-instruction-wrike", "import-board-instruction-teamwork", "import-board-instruction-businessmap", "import-board-instruction-redmine", "import-board-instruction-notion", "import-board-instruction-plane"];
for (const key of moreImportGuideKeys) {
  assert.notEqual(irish[key], english[key], key);
  assert.deepEqual(tokens(irish[key]), tokens(english[key]), key);
}
for (const format of ['taiga', 'vikunja']) assert.match(irish[`import-board-instruction-${format}`], /Ní iompórtáiltear ceangaltáin/);
assert.match(irish['import-board-instruction-quire'], /Níl nótaí tráchta ná ceangaltáin/);
assert.match(irish['import-board-instruction-businessmap'], /Béarla ar dtús/);
assert.match(irish['import-board-instruction-redmine'], /Bhéarla in My account sula/);
assert.match(irish['import-board-instruction-notion'], /Ní iompórtáiltear gaolta, íomhánna ná ceangaltáin/);
assert.match(irish['import-board-instruction-plane'], /Níl cur síos ná ceangaltáin.*ní iompórtáiltear iad/);

const importControlKeys = ["import-members-mode-heading", "import-members-mode-map", "import-members-mode-placeholder", "import-members-mode-me", "csv-mapping-title", "csv-mapping-description", "csv-mapping-not-in-file", "csv-mapping-column-number", "csv-mapping-list-missing", "csv-mapping-list-name", "csv-mapping-custom-fields", "csv-mapping-boards", "csv-mapping-skipped-sheets", "csv-mapping-title-required", "csv-mapping-list-required", "invalid-import-mapping", "import-many-boards", "import-many-boards-hint", "import-one-board-per-project", "import-one-board-per-project-hint", "import-many-progress", "import-many-results-heading", "import-many-imported", "export-all-boards", "export-selected-boards", "export-all-boards-hint", "exportAllBoardsPopup-title", "exportToTrelloPopup-title", "trello-export-desc", "trello-export-include-attachments", "trello-export-start", "trello-export-open-board", "trello-export-warnings", "sandstorm-trello-access-needed", "sandstorm-allow-trello-access", "sandstorm-trello-access-granted", "sandstorm-forget-access", "sandstorm-trello-save-label"];
for (const key of importControlKeys) {
  assert.notEqual(irish[key], english[key], key);
  assert.deepEqual(tokens(irish[key]), tokens(english[key]), key);
}
assert.match(irish['import-members-mode-placeholder'], /ainmneacha féin.*fíorúsáideoirí níos déanaí/);
assert.match(irish['import-many-boards-hint'], /gan baill a mheaitseáil.*Is clár amháin.*in ionad an réimse thuas/);
assert.match(irish['export-all-boards-hint'], /leabhar oibre amháin.*bileog do gach clár.*\.zip.*comhad do gach clár/);
assert.match(irish['trello-export-desc'], /Swimlane: …/);
assert.match(irish['sandstorm-trello-access-needed'], /Níl rochtain Idirlín.*ar dtús/);

const notificationKeys = ["external-link-rules", "external-link-rules-description", "external-link-identifier-aliases", "webhook-payload-heading", "webhook-payload-description", "webhook-payload-text", "webhook-payload-fields", "webhook-payload-field-standard", "webhook-payload-field-ids", "webhook-payload-field-names", "webhook-payload-field-links", "webhook-payload-field-actor", "webhook-payload-field-people", "webhook-payload-field-details", "webhook-hide-identity", "webhook-someone", "notification-delivery-layout-classic", "notification-delivery-layout-clear", "notification-delivery-parts", "notification-delivery-part-board", "notification-delivery-part-actor", "notification-delivery-part-card", "notification-delivery-part-details", "notification-delivery-part-dates", "notification-delivery-part-link", "notification-delivery-grouping", "notification-delivery-grouping-all", "notification-delivery-grouping-board", "notification-delivery-grouping-card", "notification-delivery-grouping-none", "notification-delivery-schedule", "notification-delivery-schedule-immediate", "notification-delivery-schedule-interval", "notification-delivery-schedule-daily", "notification-delivery-interval", "notification-delivery-minutes", "notification-delivery-quiet", "notification-delivery-quiet-clear", "notification-delivery-timezone", "notification-delivery-invalid", "notification-group-card", "notification-group-board"];
for (const key of notificationKeys) {
  assert.notEqual(irish[key], english[key], key);
  assert.deepEqual(tokens(irish[key]), tokens(english[key]), key);
}
for (const key of ['external-link-rules-description', 'external-link-identifier-aliases']) {
  assert.deepEqual(irish[key].match(/\{(?:number|identifier)\}/g), english[key].match(/\{(?:number|identifier)\}/g));
}
assert.match(irish['external-link-rules-description'], /https:\/\/tracker.example.com\/\{identifier\}\/\{number\}/);
assert.match(irish['webhook-payload-description'], /socrú oidhreachta.*mura bhfuil aon rud socraithe/);
assert.match(irish['notification-delivery-quiet'], /fan go dtí go mbeidh siad thart/);
assert.match(irish['notification-delivery-grouping-all'], /aon teachtaireacht amháin/);
assert.notEqual(irish['notification-delivery-grouping-board'], irish['notification-delivery-grouping-card']);

const workflowKeys = ["read-only-field", "r-wrike-workflow", "r-wrike-workflow-note", "r-export-wrike-workflow", "r-import-wrike-workflow", "r-import-wrike-workflow-done", "r-moved-forward", "r-moved-back", "r-add-actinguser-assignee", "r-remove-all-assignees", "ldap-sync-now", "ldap-sync-now-done", "ldap-sync-now-error", "ldap-sync-now-nothing", "oauth-providers-allowed-email-domains", "import-file-label", "subtask-mark-done", "subtask-mark-not-done", "subtask-done-no-permission"];
for (const key of workflowKeys) {
  assert.notEqual(irish[key], english[key], key);
  assert.deepEqual(tokens(irish[key]), tokens(english[key]), key);
}
assert.match(irish['read-only-field'], /gach ball.*ach ní féidir ach le riarthóirí/);
assert.match(irish['r-wrike-workflow-note'], /GET \/workflows.*Completed nó Cancelled.*Active nó Deferred.*Ní féidir rialacha uathoibrithe Wrike féin a easpórtáil/);
assert.match(irish['ldap-sync-now-nothing'], /LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS.*LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED/);
assert.match(irish['oauth-providers-allowed-email-domains'], /camóga.*ceadaítear gach ceann.*folamh/);
assert.notEqual(irish['subtask-mark-done'], irish['subtask-mark-not-done']);
assert.match(irish['subtask-done-no-permission'], /Ní féidir leat/);

const recoveryKeys = ["stuck-sync-operation-heading", "stuck-sync-operation-description", "stuck-sync-operation-list", "stuck-sync-operation-applied", "stuck-sync-operation-reason-scope-changed", "stuck-sync-operation-reason-access-denied", "stuck-sync-operation-reason-trigger-unknown", "stuck-sync-operation-reason-intent-missing", "stuck-sync-operation-reason-unknown", "stuck-sync-operation-replayable-now", "stuck-sync-operation-discard-confirm", "stuck-sync-operation-empty", "stuck-sync-operation-truncated", "stuck-sync-operation-unavailable", "stuck-sync-operation-missing", "stuck-sync-operation-not-stuck", "stuck-sync-operation-replayable", "stuck-sync-operation-busy", "interrupted-import-heading", "interrupted-import-description", "interrupted-import-progress", "interrupted-import-created", "interrupted-import-source", "interrupted-import-state-stopped", "interrupted-import-state-failed", "interrupted-import-state-discarding", "interrupted-import-counts", "interrupted-import-no-board", "interrupted-import-keep", "interrupted-import-keep-confirm", "interrupted-import-discard-confirm", "interrupted-import-empty", "interrupted-import-truncated", "interrupted-import-unavailable", "interrupted-import-missing", "interrupted-import-not-interrupted", "interrupted-import-foreign-board", "login-setting-env-only"];
for (const key of recoveryKeys) {
  assert.notEqual(irish[key], english[key], key);
  assert.deepEqual(tokens(irish[key]), tokens(english[key]), key);
}
assert.match(irish['stuck-sync-operation-discard-confirm'], /Fanann na hathruithe.*ní scríobhtar an chuid eile riamh/);
assert.match(irish['interrupted-import-description'], /nach gcoinnítear a comhad foinse.*a cuireadh leis ó shin/);
assert.match(irish['interrupted-import-discard-confirm'], /gach rud air go buan/);
assert.match(irish['interrupted-import-keep-confirm'], /Ní bhaintear aon rud/);
assert.match(irish['interrupted-import-foreign-board'], /níor athraíodh é/);
for (const key of ['stuck-sync-operation-truncated', 'interrupted-import-truncated']) assert.match(irish[key], /50 ceann is sine/);
const fullCatalog = spawnSync(process.execPath, [fillScript, '--list', 'ga'], { cwd: root, encoding: 'utf8' });
assert.equal(fullCatalog.status, 0, fullCatalog.stderr);
assert.deepEqual(JSON.parse(fullCatalog.stdout), {}, 'Full Irish placeholder inventory, including pending keys');

assert.match(irish['import-board-instruction-todoist'], /Manage data > Export as CSV.*seicliosta.*p1 go p3/);
assert.doesNotMatch(irish['import-board-instruction-todoist'], /Export as a template/);
assert.match(irish['import-board-instruction-planner'], /Export as Excel.*clasaiceach.*Export plan to Excel/);
assert.match(irish['move-reason'], /Cúis.*roghnach/);
assert.match(irish['ask-move-reason'], /Iarr cúis/);
for (const key of ['card-recurrence-interval', 'cardRecurrenceIntervalPopup-title']) {
  assert.equal(irish[key], 'Atarlú cárta');
  assert.doesNotMatch(irish[key], /Athshocrú/);
}
assert.match(irish['card-recurrence-interval-none'], /ní atarlaíonn an cárta/);
assert.match(irish['anonymize-account-confirm-popup'], /go buan luachanna ionaid/);
assert.doesNotMatch(irish['anonymize-account-confirm-popup'], /sealadacha/);

assert.match(irish['board-view-monte-carlo'], /Réamhaisnéisí/);
assert.doesNotMatch(irish['board-view-monte-carlo'], /Histeagram/);
assert.match(irish['flow-error'], /tuairisc.*Seiceáil na luachanna.*triail eile/);
assert.match(irish['flow-note-agingWip'], /85ú peircintíl.*cúig thréimhse fanachta ar a laghad.*anaithnid/);
assert.match(irish['flow-note-blockerAnalysis'], /cártaí scriosta.*fhorluíonn.*ar leithligh/);
assert.match(irish['flow-note-monteCarlo'], /2,000.*UTC.*gan aon tréchur.*ní ráthaíocht.*3,650.*níl aon réamhaisnéis/);
assert.match(irish['flow-note-processBehavior'], /chruthaithe.*cartlannaithe.*dhá chríochnú bhailí ar a laghad/);
assert.match(irish['flow-note-sizeCycleTime'], /Fágtar meastacháin ar iarraidh.*neamhbhailí ar lár.*chruthaithe.*cartlannaithe/);
for (const suffix of ['agingWip', 'blockerAnalysis', 'monteCarlo', 'processBehavior', 'sizeCycleTime']) {
  assert.doesNotMatch(irish[`flow-note-${suffix}`], /→|≥|≤|✓|MR̄/);
}

assert.match(irish['flow-confidence'], /muiníne/);
assert.match(irish['flow-capacity'], /ar a laghad/);
assert.match(irish['flow-active'], /oscailte/);
assert.match(irish['flow-p85'], /85ú peircintíl/);
assert.match(irish['flow-moving-range'], /absalóideach.*comhleanúnacha/);
assert.match(irish['flow-mr-mean'], /Meán.*absalóideacha/);
assert.equal(irish['flow-size'], 'Meastachán');
assert.match(irish['sum-of-number-fields'], /Suim luachanna.*marcáilte.*barr an liosta/);
assert.match(irish['wip-limit-group-apply-swimlane'], /ar an lána/);

for (const key of ['r-when-a-due-date-changed', 'r-when-a-start-date-changed',
  'r-when-a-end-date-changed', 'r-when-a-received-date-changed']) {
  assert.match(irish[key], /^Nuair a shocraítear nó a athraítear/);
  assert.deepEqual(tokens(irish[key]), tokens(english[key]), key);
}
assert.match(irish['calendar-system-iso8601'], /Gréagórach.*seachtainí ISO 8601/);
assert.doesNotMatch(irish['calendar-system-iso8601'], /bhliain ag an tús/);
assert.equal(irish['linkCardToBoardPopup-title'], 'Nasc le clár');
assert.match(irish['linkCardToNewBoard'], /ón gcárta seo/);

assert.match(irish['import-board-instruction-jira'], /fields=\*all&expand=names,schema.*nextPageToken.*gach leathanaigh.*"automationRules"/);
assert.match(irish['import-board-instruction-excel'], /chéim eile.*gach réimse.*gach bileog.*ró ceanntásca/);
assert.match(irish['toggle-header-icons-collapsed'], /fhón póca\/ríomhaire.*fógraí/);

assert.equal(irish['r-assignee'], 'sannaí');
assert.equal(irish['r-w-assignee-added'], 'Cuirtear sannaí leis');
assert.equal(irish['r-w-assignee-removed'], 'Baintear sannaí');
for (const key of ['r-when-a-card', 'r-when-a-assignee', 'r-when-the-assignee']) assert.match(irish[key], /^Nuair a bhíonn/);
assert.match(irish['r-when-a-card'], /cárta/);
