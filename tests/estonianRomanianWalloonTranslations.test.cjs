// The completed catalog predates newer features; keep its no-regression gate.
// Full translation work remains visible through fill-translations.mjs --list.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const fillScript = path.join(root, 'releases/translations/fill-translations.mjs');
const languages = ['et-EE', 'ro-RO', 'ro', 'wa-RR'];
const locales = {};
for (const language of languages) {
  const result = spawnSync(process.execPath, [fillScript, '--completed-catalog', '--list', language], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, '{}\n');
  locales[language] = JSON.parse(fs.readFileSync(path.join(root, `imports/i18n/data/${language}.i18n.json`), 'utf8'));
}
assert.equal(locales['et-EE']['select-none'], 'Ära vali midagi');
for (const language of ['ro-RO', 'ro']) assert.equal(locales[language]['office-logins'], 'Autentificări');
assert.equal(locales['wa-RR'].ticket, 'Tiket');
assert.match(locales['wa-RR']['globalSearch-instructions-operator-number'], /__operator_number__:<number>.*<number>/);
assert.match(locales['et-EE'].DDP_transport, /DDP.*DDP_TRANSPORT/);
const et = locales['et-EE'];
const english = JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/en.i18n.json'), 'utf8'));
for (const key of Object.keys(english).filter(key => /^(interrupted-import-|stuck-sync-operation-|ldap-sync-now)/.test(key))) {
  assert.notEqual(et[key], english[key], key);
}
assert.match(et['interrupted-import-description'], /ei saa jätkata/);
assert.match(et['interrupted-import-description'], /sealhulgas kõik hiljem lisatu/);
assert.match(et['interrupted-import-keep-confirm'], /Midagi ei eemaldata/);
assert.match(et['interrupted-import-discard-confirm'], /eemaldatakse jäädavalt/);
assert.match(et['interrupted-import-foreign-board'], /seda ei muudetud/);
assert.match(et['interrupted-import-truncated'], /50 vanimat/);
assert.match(et['stuck-sync-operation-description'], /juba rakendatud muudatused säilivad/);
assert.match(et['stuck-sync-operation-description'], /ei kirjutata kunagi/);
assert.match(et['stuck-sync-operation-replayable-now'], /ei saa sellest loobuda/);
assert.match(et['stuck-sync-operation-replayable'], /sellest ei loobutud/);
assert.match(et['ldap-sync-now-nothing'], /LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS/);
assert.match(et['ldap-sync-now-nothing'], /LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED/);
assert.ok(et['external-link-rules-description'].includes('[{identifier}:{number}] = https://tracker.example.com/{identifier}/{number}'));
assert.ok(et['external-link-identifier-aliases'].includes('TK=Task, IN=Incident'));
assert.match(et['r-moved-forward'], /edasi/);
assert.match(et['r-moved-back'], /tagasi/);
assert.match(et['login-origin-mismatch'], /ROOT_URL/);
assert.match(et['login-setting-env-only'], /ainult serveri keskkond/);
assert.match(et['login-setting-env-only'], /kirjutuskaitstuna/);
(async () => {
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  assert.deepEqual(Object.keys(et), Object.keys(english));
  for (const key of Object.keys(english)) {
    assert.deepEqual(translationTokens(et[key]), translationTokens(english[key]), key);
  }
  console.log('Estonian recovery meanings, source order and variable inventory pass');
})().catch(error => { console.error(error); process.exitCode = 1; });
for (const locale of Object.values(locales)) {
  assert.match(locale['office-report-desc'], /IPv4.*IPv6/);
  assert.match(locale['api-no-calls'], /REST API.*WITH_API=true/);
}
