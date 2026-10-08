// The completed catalog predates newer features; keep its no-regression gate.
// Full translation work remains visible through fill-translations.mjs --list.
'use strict';
const assert = require('assert');
const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const node = process.execPath;
const fill = path.join(ROOT, 'releases/translations/fill-translations.mjs');
assert.deepStrictEqual(JSON.parse(childProcess.execFileSync(node,
  [fill, '--completed-catalog', '--list', 'lv'], { cwd: ROOT, encoding: 'utf8' })), {});
const translated = JSON.parse(fs.readFileSync(path.join(ROOT,
  'imports/i18n/data/lv.i18n.json'), 'utf8'));
assert.strictEqual(translated.officeReportTitle, 'Biroji');
assert.match(translated['api-report-desc'], /galapunkt|bieži/);
assert.doesNotMatch(translated['office-no-results'], /Nobody|logged in/);
assert.match(translated['api-no-calls'], /WITH_API=true/);
console.log('upcomingLatvianTranslationFill: 5 tests passed');

(async () => {
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  const en = JSON.parse(fs.readFileSync(path.join(ROOT, 'imports/i18n/data/en.i18n.json'), 'utf8'));
  assert.deepStrictEqual(Object.keys(translated), Object.keys(en));
  for (const key of Object.keys(en)) {
    assert.deepStrictEqual(translationTokens(translated[key]), translationTokens(en[key]), key);
    if (/^(interrupted-import-|stuck-sync-operation-|scrum-import-|sync-planning-|scrum-history-checkpoint-|ldap-sync-now)/.test(key)) {
      assert.notStrictEqual(translated[key], en[key], key);
      assert.ok(translated[key].trim(), key);
    }
  }
  assert.match(translated['interrupted-import-description'], /nevar turpināt/);
  assert.match(translated['interrupted-import-description'], /tostarp visu, kas pievienots kopš tā laika/);
  assert.match(translated['interrupted-import-keep-confirm'], /Nekas netiek noņemts/);
  assert.match(translated['interrupted-import-discard-confirm'], /neatgriezeniski noņemts/);
  assert.match(translated['interrupted-import-foreign-board'], /tas netika mainīts/);
  assert.match(translated['interrupted-import-truncated'], /50 vecākās/);
  assert.match(translated['stuck-sync-operation-description'], /jau lietotās izmaiņas tiek saglabātas/);
  assert.match(translated['stuck-sync-operation-description'], /nekad netiek ierakstītas/);
  assert.match(translated['stuck-sync-operation-replayable-now'], /nevar atmest/);
  assert.match(translated['stuck-sync-operation-replayable'], /netika atmesta/);
  assert.match(translated['scrum-import-into-board-hint'], /nekad netiek dublēti/);
  assert.match(translated['scrum-import-card-on-another-board'], /atstāta nemainīta/);
  assert.match(translated['scrum-import-sprint-finished'], /netika pārvietota/);
  assert.match(translated['sync-planning-hint'], /vispirms tiek saskaņots pēc avota ID, pēc tam pēc nosaukuma/);
  assert.match(translated['sync-planning-hint'], /pirmā sinhronizācija nekad nenoņem/);
  assert.match(translated['scrum-history-checkpoint-hint'], /neviens cits nav mainījis/);
  assert.match(translated['scrum-history-checkpoint-hint'], /nemaina nevienu ierakstu/);
  assert.match(translated['scrum-history-checkpoint-discard-confirm'], /jau ierakstīja/);
  assert.match(translated['ldap-sync-now-nothing'], /LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS/);
  assert.match(translated['ldap-sync-now-nothing'], /LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED/);
  assert.ok(translated['external-link-rules-description'].includes('[{identifier}:{number}] = https://tracker.example.com/{identifier}/{number}'));
  assert.ok(translated['external-link-identifier-aliases'].includes('TK=Task, IN=Incident'));
  assert.match(translated['r-moved-forward'], /uz priekšu/);
  assert.match(translated['r-moved-back'], /atpakaļ/);
  assert.match(translated['login-origin-mismatch'], /ROOT_URL/);
  assert.match(translated['login-setting-env-only'], /tikai servera vide/);
  console.log('Latvian recovery decisions, source order and variable inventory pass');
})().catch(error => { console.error(error); process.exitCode = 1; });
