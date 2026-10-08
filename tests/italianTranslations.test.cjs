// The completed catalog predates newer features; keep its no-regression gate.
// Full translation work remains visible through fill-translations.mjs --list.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const result = spawnSync(process.execPath, [path.join(root, 'releases/translations/fill-translations.mjs'), '--completed-catalog', '--list', 'it'], { cwd: root, encoding: 'utf8' });
assert.equal(result.status, 0, result.stderr);
assert.equal(result.stdout, '{}\n');
const locale = JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/it.i18n.json'), 'utf8'));
assert.equal(locale.swimlane, 'Corsia');
assert.equal(locale.password, "Parola d'accesso");
assert.equal(locale.backup, 'Copia di sicurezza');
assert.match(locale['office-report-desc'], /IPv4.*IPv6/);
assert.match(locale['api-no-calls'], /REST API.*WITH_API=true/);

const currentKeys = [
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
  "scrum-history-checkpoint-ask-admin",
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
  "stuck-sync-operation-failed"
];

(async () => {
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  const english = JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/en.i18n.json'), 'utf8'));
  assert.deepEqual(Object.keys(locale), Object.keys(english), 'all current source keys in source order');
  for (const key of Object.keys(english)) {
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), key);
  }
  for (const key of ['filter-column-age-hint', 'scrum-total', 'sync-preview-saved',
    'email-recovery-description', 'activity-recovery-busy',
    'rule-email-recovery-description', 'saml-login-not-started']) {
    assert.ok(locale[key]?.trim(), key);
    assert.notEqual(locale[key], english[key], `${key} remains English`);
  }
  for (const key of currentKeys) {
    assert.ok(locale[key]?.trim(), key);
    assert.notEqual(locale[key], english[key], `${key}: translate current source prose`);
  }
  assert.match(locale['scrum-import-into-board-hint'], /mai duplicati/);
  assert.match(locale['scrum-import-into-board-hint'], /ID oppure tramite numero e titolo/);
  assert.match(locale['scrum-import-card-on-another-board'], /lasciata invariata/);
  assert.match(locale['scrum-import-sprint-finished'], /non è stata spostata/);
  assert.match(locale['sync-planning-hint'], /prima tramite il loro ID.*poi tramite il nome/);
  assert.match(locale['sync-planning-hint'], /prima sincronizzazione non rimuove mai/);
  assert.match(locale['interrupted-import-description'], /non può essere ripresa/);
  assert.match(locale['interrupted-import-description'], /compresi gli elementi aggiunti successivamente/);
  assert.match(locale['interrupted-import-keep-confirm'], /Nulla viene rimosso/);
  assert.match(locale['interrupted-import-discard-confirm'], /rimossi definitivamente/);
  assert.match(locale['interrupted-import-foreign-board'], /non è stata modificata/);
  assert.match(locale['scrum-history-checkpoint-hint'], /solo se nessun altro/);
  assert.match(locale['scrum-history-checkpoint-hint'], /senza modificare alcun elemento/);
  assert.match(locale['scrum-history-checkpoint-discard-confirm'], /modifiche già scritte/);
  assert.notEqual(locale['r-moved-forward'], locale['r-moved-back']);
  for (const literal of ['{number}', '{identifier}', '[{identifier}:{number}] = https://tracker.example.com/{identifier}/{number}']) {
    assert.ok(locale['external-link-rules-description'].includes(literal), `preserve ${literal}`);
  }
  assert.ok(locale['external-link-identifier-aliases'].includes('TK=Task, IN=Incident'));
  for (const name of ['LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS', 'LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED']) {
    assert.ok(locale['ldap-sync-now-nothing'].includes(name), name);
  }
  assert.match(locale['scrum-releases-select-help'], /più rilasci/);
  assert.match(locale['scrum-releases-select-help'], /ogni rilascio/);
  assert.match(locale['stuck-sync-operation-description'], /confronta nuovamente la lista con la sua fonte/);
  assert.match(locale['stuck-sync-operation-discard-confirm'], /già applicate vengono mantenute/);
  assert.match(locale['stuck-sync-operation-discard-confirm'], /non vengono mai scritte/);
  assert.match(locale['stuck-sync-operation-replayable-now'], /non può essere abbandonata/);
  assert.match(locale['stuck-sync-operation-replayable'], /non è stata abbandonata/);
  for (const key of ['interrupted-import-truncated', 'stuck-sync-operation-truncated']) {
    assert.match(locale[key], /50 più vecchie/);
  }
  assert.equal(locale['board-view-sprints'], 'Sprint', 'the view is not limited to planned sprints');
  assert.equal(locale['blockly-ENTER_KEY'], 'Invio');
  assert.equal(locale['blockly-MATH_TRIG_COS'], 'cos');
  console.log('italianTranslations: complete source keys, tokens and planning/recovery prose verified');
})().catch(error => { console.error(error); process.exitCode = 1; });
