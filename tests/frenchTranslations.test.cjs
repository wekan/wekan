// The completed catalog predates newer features; keep its no-regression gate.
// Full translation work remains visible through fill-translations.mjs --list.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const pendingKeys = [
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
const fillScript = path.join(root, 'releases/translations/fill-translations.mjs');
for (const language of ['fr-BE', 'fr-CA', 'fr-CH', 'fr-FR', 'fr']) {
  const result = spawnSync(process.execPath, [fillScript, '--completed-catalog', '--list', language], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, '{}\n');
  const locale = JSON.parse(fs.readFileSync(path.join(root, `imports/i18n/data/${language}.i18n.json`), 'utf8'));
  assert.equal(locale.action, "Opération à effectuer");
  assert.equal(locale.public, 'Visible par tous');
  assert.equal(locale.ticket, "Demande d'assistance");
  assert.match(locale['office-report-desc'], /IPv4.*IPv6/);
  assert.match(locale['api-no-calls'], /REST API.*WITH_API=true/);
}

(async () => {
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  const english = JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/en.i18n.json'), 'utf8'));
  for (const code of ['fr', 'fr-FR', 'fr-BE', 'fr-CH', 'fr-CA']) {
    const locale = JSON.parse(fs.readFileSync(path.join(root, `imports/i18n/data/${code}.i18n.json`), 'utf8'));
    assert.deepEqual(Object.keys(locale), Object.keys(english), code);
    for (const key of Object.keys(english)) {
      assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}`);
    }
    for (const key of ['filter-column-age-hint', 'scrum-total', 'sync-preview-saved',
      'email-recovery-description', 'activity-recovery-busy', 'saml-login-not-started',
      'r-rule-any-trigger-help', 'move-selection-before', 'move-selection-after']) {
      assert.ok(locale[key]?.trim(), key);
      assert.notEqual(locale[key], english[key], `${code}:${key} remains English`);
    }
    for (const key of pendingKeys) {
      assert.ok(locale[key]?.trim(), `${code}:${key}`);
      assert.notEqual(locale[key], english[key], `${code}:${key} remains English`);
    }
    assert.match(locale['stuck-sync-operation-discard-confirm'], /déjà appliquées sont conservées/);
    assert.match(locale['stuck-sync-operation-discard-confirm'], /ne seront jamais écrites/);
    assert.match(locale['stuck-sync-operation-description'], /compare de nouveau la liste à sa source/);
    assert.match(locale['stuck-sync-operation-replayable-now'], /ne peut donc pas être abandonnée/);
    assert.match(locale['stuck-sync-operation-replayable'], /n’a donc pas été abandonnée/);
    assert.match(locale['stuck-sync-operation-truncated'], /50 plus anciennes/);
    assert.match(locale['scrum-releases-select-help'], /plusieurs versions/);
    assert.match(locale['scrum-releases-select-help'], /toutes les versions/);
    for (const name of ['LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS',
      'LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED']) {
      assert.ok(locale['ldap-sync-now-nothing'].includes(name), `${code}:${name}`);
    }
    assert.match(locale['scrum-import-into-board-hint'], /jamais dupliqués/);
    assert.match(locale['scrum-import-into-board-hint'], /par identifiant, ou par numéro et titre/);
    assert.match(locale['scrum-import-card-on-another-board'], /laissée inchangée/);
    assert.match(locale['scrum-import-sprint-finished'], /n’a pas été déplacée/);
    assert.match(locale['sync-planning-hint'], /d’abord par leur identifiant.*puis par leur nom/);
    assert.match(locale['sync-planning-hint'], /première synchronisation ne supprime jamais/);
    assert.match(locale['interrupted-import-description'], /ne peut pas être repris/);
    assert.match(locale['interrupted-import-description'], /y compris les éléments ajoutés depuis/);
    assert.match(locale['interrupted-import-keep-confirm'], /Rien n’est supprimé/);
    assert.match(locale['interrupted-import-discard-confirm'], /définitivement supprimés/);
    assert.match(locale['interrupted-import-truncated'], /50 plus anciens/);
    assert.match(locale['interrupted-import-foreign-board'], /n’a donc pas été modifié/);
    assert.match(locale['scrum-history-checkpoint-hint'], /que si personne d’autre/);
    assert.match(locale['scrum-history-checkpoint-hint'], /sans modifier aucun enregistrement/);
    assert.match(locale['scrum-history-checkpoint-discard-confirm'], /changements déjà écrits/);
    assert.notEqual(locale['r-moved-forward'], locale['r-moved-back']);
    for (const literal of ['{number}', '{identifier}', '[{identifier}:{number}] = https://tracker.example.com/{identifier}/{number}']) {
      assert.ok(locale['external-link-rules-description'].includes(literal), `${code}: preserve ${literal}`);
    }
    assert.ok(locale['external-link-identifier-aliases'].includes('TK=Task, IN=Incident'));
    assert.match(locale['filter-preset-save'], /Enregistrer.*filtres/);
    assert.equal(locale['blockly-ARIA_TYPE_FIELD_IMAGE'], 'image');
    assert.equal(locale['blockly-MATH_ONLIST_OPERATOR_MIN_ARIA'], 'minimum');
    assert.notEqual(locale['move-selection-before'], locale['move-selection-after']);
  }
  console.log('French locales: source keys, tokens, localized prose and shared vocabulary verified');
})().catch(error => { console.error(error); process.exitCode = 1; });
