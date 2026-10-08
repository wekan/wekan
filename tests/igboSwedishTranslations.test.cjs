// The completed catalog predates newer features; keep its no-regression gate.
// Full translation work remains visible through fill-translations.mjs --list.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const fillScript = path.join(root, 'releases/translations/fill-translations.mjs');
const locales = {};
for (const language of ['ig', 'sv']) {
  const result = spawnSync(process.execPath, [fillScript, '--completed-catalog', '--list', language], { cwd: root, encoding: 'utf8' });
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
  "stuck-sync-operation-failed"
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
  console.log('Swedish current import and Sync recovery prose, variables and source syntax verified');
})().catch(error => { console.error(error); process.exitCode = 1; });
