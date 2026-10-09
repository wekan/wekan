// The completed catalog predates newer features; keep its no-regression gate.
// Full translation work remains visible through fill-translations.mjs --list.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const fillScript = path.join(root, 'releases/translations/fill-translations.mjs');
const locales = {};
for (const language of ['gl', 'gl-ES', 'xh']) {
  const result = spawnSync(process.execPath, [fillScript, '--completed-catalog', '--list', language], {
    cwd: root,
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, '{}\n');
  locales[language] = JSON.parse(
    fs.readFileSync(path.join(root, `imports/i18n/data/${language}.i18n.json`), 'utf8'),
  );
}

for (const language of ['gl', 'gl-ES']) {
  assert.equal(locales[language]['select-none'], 'Non seleccionar ningún');
  assert.equal(locales[language].backup, 'Copia de seguranza');
}
assert.equal(locales.xh['select-none'], 'Ungakhethi nanye');
assert.match(locales.xh['font-preview-text'], /0123456789$/);

for (const locale of Object.values(locales)) {
  assert.match(locale['office-report-desc'], /IPv4.*IPv6/);
  assert.match(locale['api-no-calls'], /REST API.*WITH_API=true/);
}

(async () => {
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  const source = JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/en.i18n.json'), 'utf8'));
  const locale = locales.xh;
  const keys = [
  "board-announcement",
  "board-announcement-enabled",
  "cards-use-list-color",
  "external-link-rules",
  "external-link-rules-description",
  "external-link-identifier-aliases",
  "read-only-field",
  "r-moved-forward",
  "r-moved-back",
  "r-assignee",
  "r-add-actinguser-assignee",
  "r-remove-all-assignees",
  "ldap-sync-now",
  "ldap-sync-now-done",
  "ldap-sync-now-error",
  "ldap-sync-now-nothing",
  "oauth-providers-allowed-email-domains",
  "card-field-visibility",
  "card-field-visibility-desc",
  "r-blocks-view",
  "r-blocks-help",
  "r-blocks-discard",
  "r-blocks-unavailable",
  "r-blocks-invalid",
  "r-blocks-conflict",
  "r-blocks-permission",
  "r-blocks-unsaved",
  "r-blocks-saved",
  "r-blocks-reload"
];
  for (const key of keys) {
    assert.notEqual(locale[key], source[key], key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(source[key]), key);
  }
  const links = 'external-link-rules-description';
  assert.deepEqual(locale[links].match(/\{(?:identifier|number)\}/g), source[links].match(/\{(?:identifier|number)\}/g));
  assert.ok(locale[links].includes('[{identifier}:{number}] = https://tracker.example.com/{identifier}/{number}'));
  for (const name of ['LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS', 'LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED']) assert.ok(locale['ldap-sync-now-nothing'].includes(name));
  assert.match(locale['read-only-field'], /ngabaphathi bebhodi kuphela/);
  assert.match(locale['r-blocks-invalid'], /esinye kuphela.*esinye/);
  assert.match(locale['r-blocks-conflict'], /Layisha kwakhona.*ngaphambi kokugcina/);
  assert.match(locale['card-field-visibility-desc'], /Akukho datha yekhadi.*etshintshayo/);
  const error = locale['ldap-sync-now-error'].replace('%s', 'E_LDAP');
  assert.ok(error.includes('E_LDAP'));
  assert.ok(!error.includes('%s'));
  console.log('Xhosa settings: variables, literals, restrictions and rendered errors passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
