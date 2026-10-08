// The completed catalog predates newer features; keep its no-regression gate.
// Full translation work remains visible through fill-translations.mjs --list.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const result = spawnSync(process.execPath, [path.join(root, 'releases/translations/fill-translations.mjs'), '--completed-catalog', '--list', 'nb'], { cwd: root, encoding: 'utf8' });
assert.equal(result.status, 0, result.stderr);
assert.equal(result.stdout, '{}\n');
const locale = JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/nb.i18n.json'), 'utf8'));
assert.equal(locale.font, 'Skriftutforming');
assert.equal(locale.status, 'Tilstand');
assert.equal(locale.Database, 'Datalager');
assert.match(locale['azure-container'], /Azure/);
assert.match(locale['office-report-desc'], /IPv4.*IPv6/);
assert.match(locale['api-no-calls'], /REST API.*WITH_API=true/);

const currentKeys = [
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
  assert.deepEqual(Object.keys(locale), Object.keys(english));
  for (const key of Object.keys(english)) {
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), key);
  }
  for (const key of ['filter-column-age-hint', 'scrum-total', 'sync-preview-saved',
    'email-recovery-description', 'activity-recovery-busy', 'saml-login-not-started',
    'r-rule-any-trigger-help', 'move-selection-before', 'move-selection-after']) {
    assert.ok(locale[key]?.trim(), key);
    assert.notEqual(locale[key], english[key], key);
  }
  for (const key of currentKeys) {
    assert.ok(locale[key]?.trim(), key);
    assert.notEqual(locale[key], english[key], `${key}: translate current prose`);
  }
  for (const name of ['LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS', 'LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED']) {
    assert.ok(locale['ldap-sync-now-nothing'].includes(name), name);
  }
  assert.match(locale['scrum-releases-select-help'], /flere utgivelser/);
  assert.match(locale['scrum-releases-select-help'], /samtlige utgivelser/);
  assert.match(locale['stuck-sync-operation-description'], /sammenligner listen med kilden på nytt/);
  assert.match(locale['stuck-sync-operation-discard-confirm'], /allerede er brukt, beholdes/);
  assert.match(locale['stuck-sync-operation-discard-confirm'], /skrives aldri/);
  assert.match(locale['stuck-sync-operation-replayable-now'], /kan ikke forkastes/);
  assert.match(locale['stuck-sync-operation-replayable'], /ble ikke forkastet/);
  assert.match(locale['stuck-sync-operation-truncated'], /50 eldste/);
  for (const literal of ['TODO', 'DONE', 'SCHEDULED', 'DEADLINE', 'CLOSED']) {
    assert.ok(locale['import-board-instruction-orgmode'].includes(literal), literal);
  }
  for (const literal of ['@labels', 'p1', 'p3', 'CSV']) {
    assert.ok(locale['import-board-instruction-todoist'].includes(literal), literal);
  }
  assert.match(locale['scrum-import-into-board-hint'], /dupliseres aldri/);
  assert.match(locale['scrum-import-into-board-hint'], /ID eller kortnummer og tittel/);
  assert.match(locale['scrum-import-card-on-another-board'], /stående uendret/);
  assert.match(locale['scrum-import-sprint-finished'], /ikke flyttet/);
  assert.match(locale['sync-planning-hint'], /først etter kilde-ID og deretter etter navn/);
  assert.match(locale['sync-planning-hint'], /første synkroniseringen fjerner aldri/);
  assert.match(locale['interrupted-import-description'], /kan ikke gjenopptas/);
  assert.match(locale['interrupted-import-description'], /også alt som er lagt til siden/);
  assert.match(locale['interrupted-import-keep-confirm'], /Ingenting fjernes/);
  assert.match(locale['interrupted-import-discard-confirm'], /fjernes permanent/);
  assert.match(locale['interrupted-import-truncated'], /50 eldste/);
  assert.match(locale['interrupted-import-foreign-board'], /derfor ikke endret/);
  assert.match(locale['scrum-history-checkpoint-hint'], /bare hvis ingen andre/);
  assert.match(locale['scrum-history-checkpoint-hint'], /uten å endre noen oppføringer/);
  assert.match(locale['scrum-history-checkpoint-discard-confirm'], /allerede har skrevet/);
  assert.notEqual(locale['r-moved-forward'], locale['r-moved-back']);
  for (const literal of ['{number}', '{identifier}', '[{identifier}:{number}] = https://tracker.example.com/{identifier}/{number}']) {
    assert.ok(locale['external-link-rules-description'].includes(literal), literal);
  }
  assert.ok(locale['external-link-identifier-aliases'].includes('TK=Task, IN=Incident'));
  assert.equal(locale['move-selection-before'], 'Før');
  assert.equal(locale['move-selection-after'], 'Etter');
  assert.equal(locale['blockly-MATH_ADDITION_SYMBOL_ARIA'], 'pluss');
  assert.equal(locale['scrum-start-sprint'], 'Start sprint');
  assert.match(locale['scrum-report-help'], /ikke nullestimater/);
  assert.match(locale['sync-conflict-hint'], /Ingenting sendes til kildesystemet/);
  assert.match(locale['activity-recovery-cancel-confirm'], /kan ikke gjenopptas/);
  console.log('Bokmål source keys, tokens, shared vocabulary and recovery meaning verified');
})().catch(error => { console.error(error); process.exitCode = 1; });
