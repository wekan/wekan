// The completed catalog predates newer features; keep its no-regression gate.
// Full translation work remains visible through fill-translations.mjs --list.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const result = spawnSync(process.execPath, [path.join(root, 'releases/translations/fill-translations.mjs'), '--completed-catalog', '--list', 'ca'], { cwd: root, encoding: 'utf8' });
assert.equal(result.status, 0, result.stderr);
assert.equal(result.stdout, '{}\n');
const locale = JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/ca.i18n.json'), 'utf8'));
assert.equal(locale['select-none'], 'No en seleccionis cap');
assert.equal(locale.avatars, 'Imatges dels perfils');
assert.equal(locale.errors, "Missatges d'error");
assert.match(locale['office-report-desc'], /IPv4.*IPv6/);
assert.match(locale['api-no-calls'], /REST API.*WITH_API=true/);

const settingsKeys = ["board-announcement", "board-announcement-enabled", "cards-use-list-color", "external-link-rules", "external-link-rules-description", "external-link-identifier-aliases", "read-only-field", "r-moved-forward", "r-moved-back", "r-assignee", "r-add-actinguser-assignee", "r-remove-all-assignees", "ldap-sync-now", "ldap-sync-now-done", "ldap-sync-now-error", "ldap-sync-now-nothing", "oauth-providers-allowed-email-domains", "scrum-release-scope", "scrum-releases-select-help", "scrum-import-into-board", "scrum-import-into-board-hint", "scrum-import-preview", "scrum-import-choose-file", "scrum-import-invalid-file", "scrum-import-preview-sprints"];
const { translationTokens } = require('../releases/translations/placeholder-tokens.mjs');
const english = JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/en.i18n.json'), 'utf8'));
for (const code of ['ca', 'ca_ES', 'ca@valencia']) {
  const data = JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data', code + '.i18n.json'), 'utf8'));
  for (const key of settingsKeys) {
    assert.ok(data[key]?.trim(), key);
    assert.notEqual(data[key], english[key], code + ': ' + key);
    assert.deepEqual(translationTokens(data[key]), translationTokens(english[key]), code + ': ' + key);
  }
  assert.match(data['read-only-field'], /només els administradors del tauler el poden canviar/);
  assert.match(data['scrum-import-into-board-hint'], /mai no es dupliquen/);
  assert.match(data['scrum-import-into-board-hint'], /sense coincidència.*sense canvis/);
  assert.match(data['r-moved-forward'], /endavant.*posterior/);
  assert.match(data['r-moved-back'], /enrere.*anterior/);
  assert.match(data['oauth-providers-allowed-email-domains'], /en blanc es permeten tots/);
  for (const literal of ['LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS', 'LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED']) assert.ok(data['ldap-sync-now-nothing'].includes(literal));
  assert.ok(data['external-link-rules-description'].includes('[{identifier}:{number}] = https://tracker.example.com/{identifier}/{number}'));
  assert.deepEqual(data['external-link-rules-description'].match(/\{[^{}]+\}/g), english['external-link-rules-description'].match(/\{[^{}]+\}/g));
  assert.ok(data['external-link-identifier-aliases'].includes('TK=Task, IN=Incident'));
}
