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
  "stuck-sync-operation-failed"
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
  assert.equal(locale['move-selection-before'], 'Før');
  assert.equal(locale['move-selection-after'], 'Etter');
  assert.equal(locale['blockly-MATH_ADDITION_SYMBOL_ARIA'], 'pluss');
  assert.equal(locale['scrum-start-sprint'], 'Start sprint');
  assert.match(locale['scrum-report-help'], /ikke nullestimater/);
  assert.match(locale['sync-conflict-hint'], /Ingenting sendes til kildesystemet/);
  assert.match(locale['activity-recovery-cancel-confirm'], /kan ikke gjenopptas/);
  console.log('Bokmål source keys, tokens, shared vocabulary and recovery meaning verified');
})().catch(error => { console.error(error); process.exitCode = 1; });
