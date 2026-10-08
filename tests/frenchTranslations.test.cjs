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
  "stuck-sync-operation-failed"
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
    assert.match(locale['filter-preset-save'], /Enregistrer.*filtres/);
    assert.equal(locale['blockly-ARIA_TYPE_FIELD_IMAGE'], 'image');
    assert.equal(locale['blockly-MATH_ONLIST_OPERATOR_MIN_ARIA'], 'minimum');
    assert.notEqual(locale['move-selection-before'], locale['move-selection-after']);
  }
  console.log('French locales: source keys, tokens, localized prose and shared vocabulary verified');
})().catch(error => { console.error(error); process.exitCode = 1; });
