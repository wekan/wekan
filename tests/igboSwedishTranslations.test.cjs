// Swedish covers the full current fill; Igbo retains its historical catalog gate.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const fillScript = path.join(root, 'releases/translations/fill-translations.mjs');
const locales = {};
for (const language of ['ig', 'sv']) {
  const result = spawnSync(process.execPath, [fillScript, ...(language === 'sv' ? [] : ['--completed-catalog']), '--list', language], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, '{}\n');
  locales[language] = JSON.parse(fs.readFileSync(path.join(root, `imports/i18n/data/${language}.i18n.json`), 'utf8'));
}
assert.equal(locales.ig['select-none'], 'Ahọrọla nke ọ bụla');
assert.match(locales.ig['gridfs-file-id'], /GridFS/);
assert.match(locales.ig['azure-container'], /Azure/);
assert.equal(locales.sv.status, 'Tillstånd');
assert.equal(locales.sv['operator-team'], 'arbetsgrupp');
for (const locale of Object.values(locales)) {
  assert.match(locale['office-report-desc'], /IPv4.*IPv6/);
  assert.match(locale['api-no-calls'], /REST API.*WITH_API=true/);
}

const swedishCurrentKeys = [
  "import-board-instruction-opml",
  "import-board-instruction-orgmode",
  "import-board-instruction-todoist",
  "r-assignee",
  "r-add-actinguser-assignee",
  "r-remove-all-assignees",
  "ldap-sync-now",
  "ldap-sync-now-done",
  "ldap-sync-now-error",
  "ldap-sync-now-nothing",
  "oauth-providers-allowed-email-domains",
  "scrum-release-scope",
  "scrum-releases-select-help",
  "stuck-sync-operation-heading",
  "stuck-sync-operation-description",
  "stuck-sync-operation-list",
  "stuck-sync-operation-progress",
  "stuck-sync-operation-reason",
  "stuck-sync-operation-applied",
  "stuck-sync-operation-reason-scope-changed",
  "stuck-sync-operation-reason-access-denied",
  "stuck-sync-operation-reason-trigger-unknown",
  "stuck-sync-operation-reason-intent-missing",
  "stuck-sync-operation-reason-unknown",
  "stuck-sync-operation-replayable-now",
  "stuck-sync-operation-discard",
  "stuck-sync-operation-discard-confirm",
  "stuck-sync-operation-refresh",
  "stuck-sync-operation-empty",
  "stuck-sync-operation-truncated",
  "stuck-sync-operation-unavailable",
  "stuck-sync-operation-missing",
  "stuck-sync-operation-not-stuck",
  "stuck-sync-operation-replayable",
  "stuck-sync-operation-busy",
  "stuck-sync-operation-failed",
  "board-announcement",
  "board-announcement-enabled",
  "cards-use-list-color",
  "external-link-rules",
  "external-link-rules-description",
  "external-link-identifier-aliases",
  "read-only-field",
  "r-moved-forward",
  "r-moved-back",
  "scrum-import-into-board",
  "scrum-import-into-board-hint",
  "scrum-import-preview",
  "scrum-import-choose-file",
  "scrum-import-invalid-file",
  "scrum-import-preview-sprints",
  "scrum-import-preview-releases",
  "scrum-import-preview-cards",
  "scrum-import-preview-nothing",
  "scrum-import-into-board-done",
  "scrum-import-card-not-matched",
  "scrum-import-card-ambiguous",
  "scrum-import-card-on-another-board",
  "scrum-import-record-ambiguous",
  "scrum-import-record-not-imported",
  "scrum-import-sprint-finished",
  "sync-planning-sprint",
  "sync-planning-releases",
  "sync-planning-fields",
  "sync-planning-hint",
  "interrupted-import-heading",
  "interrupted-import-description",
  "interrupted-import-board",
  "interrupted-import-progress",
  "interrupted-import-created",
  "interrupted-import-source",
  "interrupted-import-state-stopped",
  "interrupted-import-state-failed",
  "interrupted-import-state-discarding",
  "interrupted-import-scrum",
  "interrupted-import-counts",
  "interrupted-import-no-board",
  "interrupted-import-keep",
  "interrupted-import-discard",
  "interrupted-import-keep-confirm",
  "interrupted-import-discard-confirm",
  "interrupted-import-refresh",
  "interrupted-import-empty",
  "interrupted-import-truncated",
  "interrupted-import-unavailable",
  "interrupted-import-missing",
  "interrupted-import-not-interrupted",
  "interrupted-import-foreign-board",
  "interrupted-import-scrum-busy",
  "interrupted-import-failed",
  "scrum-history-checkpoint-stuck",
  "scrum-history-checkpoint-counts",
  "scrum-history-checkpoint-hint",
  "scrum-history-checkpoint-rollback",
  "scrum-history-checkpoint-discard",
  "scrum-history-checkpoint-discard-confirm",
  "scrum-history-checkpoint-ask-admin"
];

(async () => {
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  const english = JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/en.i18n.json'), 'utf8'));
  const sv = locales.sv;
  assert.deepEqual(Object.keys(sv), Object.keys(english));
  for (const key of Object.keys(english)) {
    assert.deepEqual(translationTokens(sv[key]), translationTokens(english[key]), key);
  }
  for (const key of swedishCurrentKeys) {
    assert.ok(sv[key]?.trim(), key);
    assert.notEqual(sv[key], english[key], `${key}: translate current prose`);
  }
  for (const name of ['LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS', 'LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED']) {
    assert.ok(sv['ldap-sync-now-nothing'].includes(name), name);
  }
  assert.match(sv['scrum-releases-select-help'], /flera utgåvor/);
  assert.match(sv['scrum-releases-select-help'], /samtliga utgåvor/);
  assert.match(sv['stuck-sync-operation-description'], /jämför listan med dess källa på nytt/);
  assert.match(sv['stuck-sync-operation-discard-confirm'], /tillämpade ändringar bevaras/);
  assert.match(sv['stuck-sync-operation-discard-confirm'], /skrivs aldrig/);
  assert.match(sv['stuck-sync-operation-replayable-now'], /kan inte kastas/);
  assert.match(sv['stuck-sync-operation-replayable'], /kastades inte/);
  assert.match(sv['stuck-sync-operation-truncated'], /50 äldsta/);
  for (const literal of ['TODO', 'DONE', 'SCHEDULED', 'DEADLINE', 'CLOSED']) {
    assert.ok(sv['import-board-instruction-orgmode'].includes(literal), literal);
  }
  for (const literal of ['@labels', 'p1', 'p3', 'CSV']) {
    assert.ok(sv['import-board-instruction-todoist'].includes(literal), literal);
  }
  assert.match(sv['scrum-import-into-board-hint'], /dupliceras aldrig/);
  assert.match(sv['scrum-import-into-board-hint'], /ID eller kortnummer och titel/);
  assert.match(sv['scrum-import-card-on-another-board'], /lämnades oförändrat/);
  assert.match(sv['scrum-import-sprint-finished'], /flyttades inte/);
  assert.match(sv['sync-planning-hint'], /först med sitt käll-ID och sedan med namn/);
  assert.match(sv['sync-planning-hint'], /första synkroniseringen tar aldrig bort/);
  assert.match(sv['interrupted-import-description'], /kan inte återupptas/);
  assert.match(sv['interrupted-import-description'], /även sådant som lagts till sedan dess/);
  assert.match(sv['interrupted-import-keep-confirm'], /Inget tas bort/);
  assert.match(sv['interrupted-import-discard-confirm'], /tas bort permanent/);
  assert.match(sv['interrupted-import-truncated'], /50 äldsta/);
  assert.match(sv['interrupted-import-foreign-board'], /ändrades därför inte/);
  assert.match(sv['scrum-history-checkpoint-hint'], /bara om ingen annan/);
  assert.match(sv['scrum-history-checkpoint-hint'], /utan att ändra några poster/);
  assert.match(sv['scrum-history-checkpoint-discard-confirm'], /redan har skrivit/);
  assert.notEqual(sv['r-moved-forward'], sv['r-moved-back']);
  for (const literal of ['{number}', '{identifier}', '[{identifier}:{number}] = https://tracker.example.com/{identifier}/{number}']) {
    assert.ok(sv['external-link-rules-description'].includes(literal), literal);
  }
  assert.ok(sv['external-link-identifier-aliases'].includes('TK=Task, IN=Incident'));
  console.log('Swedish current import and Sync recovery prose, variables and source syntax verified');
})().catch(error => { console.error(error); process.exitCode = 1; });


const swedishDelivery = locales.sv;
assert.match(swedishDelivery['custom-field-links-hint'], /samma namn och typ på båda/);
assert.match(swedishDelivery['custom-field-links-hint'], /bara finns på det ena kortet.*oförändrade/);
assert.match(swedishDelivery['custom-field-link-both'], /Åt båda hållen/);
assert.match(swedishDelivery['custom-field-link-send'], /Åt ett håll.*huvudkortet/);
assert.match(swedishDelivery['custom-field-link-inactive'], /inte längre redigera båda.*arkiverat/);
assert.match(swedishDelivery['field-link-not-allowed'], /redigera båda korten/);
assert.equal(swedishDelivery['import-members-mode-me'], 'Ersätt dem alla med mig');
assert.match(swedishDelivery['import-many-boards-hint'], /utan medlemskoppling/);
assert.match(swedishDelivery['import-many-boards-hint'], /i sig är en enda export.*är en tavla/);
assert.match(swedishDelivery['export-all-boards-hint'], /kan exportera.*arbetsbok.*\.zip/);
assert.match(swedishDelivery['webhook-payload-description'], /ärvda inställningen.*alltid har skickat/);
assert.match(swedishDelivery['webhook-hide-identity'], /Utelämna mitt namn/);
assert.match(swedishDelivery['notification-delivery-quiet'], /vänta tills de är slut/);
assert.match(swedishDelivery['r-wrike-workflow-note'], /slutfört.*Completed.*Cancelled.*ej slutfört.*Active.*Deferred/);
assert.match(swedishDelivery['r-wrike-workflow-note'], /egna automatiseringsregler kan inte exporteras/);
assert.ok(swedishDelivery['r-wrike-workflow-note'].includes('GET /workflows'));
assert.ok(swedishDelivery['webhook-payload-field-standard'].includes('WEBHOOKS_ATTRIBUTES'));
assert.notEqual(swedishDelivery['subtask-mark-done'], swedishDelivery['subtask-mark-not-done']);
