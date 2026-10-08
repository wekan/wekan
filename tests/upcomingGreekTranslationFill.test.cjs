'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
for (const language of ['el', 'el-GR']) {
  const translated = JSON.parse(fs.readFileSync(path.join(ROOT,
    'imports/i18n/data', `${language}.i18n.json`), 'utf8'));
  for (const key of ['azure-connection-string', 'azure-container', 'backup',
    'gcs-project-id']) {
    assert.match(translated[key], /[\u0370-\u03ff]/u);
  }
  assert.notStrictEqual(translated.backup, 'Backup');
}
console.log('upcomingGreekTranslationFill: 10 tests passed');

(async () => {
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  const en = JSON.parse(fs.readFileSync(path.join(ROOT, 'imports/i18n/data/en.i18n.json'), 'utf8'));
  for (const language of ['el', 'el-GR']) {
    const translated = JSON.parse(fs.readFileSync(path.join(ROOT, 'imports/i18n/data', `${language}.i18n.json`), 'utf8'));
    assert.deepStrictEqual(Object.keys(translated), Object.keys(en), `${language}: source key order`);
    for (const key of Object.keys(en)) {
      assert.deepStrictEqual(translationTokens(translated[key]), translationTokens(en[key]), `${language}: ${key}`);
    }
    for (const key of Object.keys(en).filter(key => /^(scrum-import-|sync-planning-|interrupted-import-|scrum-history-checkpoint-|stuck-sync-operation-|ldap-sync-now)/.test(key))) {
      assert.notStrictEqual(translated[key], en[key], `${language}: ${key} must be translated`);
      assert.match(translated[key], /[\u0370-\u03ff]/u, `${language}: ${key} needs Greek prose`);
    }
    assert.match(translated['scrum-import-into-board-hint'], /χωρίς να δημιουργούνται διπλότυπα/);
    assert.match(translated['scrum-import-card-on-another-board'], /παρέμεινε αμετάβλητη/);
    assert.match(translated['scrum-import-sprint-finished'], /δεν μετακινήθηκε/);
    assert.match(translated['sync-planning-hint'], /πρώτα με το αναγνωριστικό της πηγής και μετά με το όνομα/);
    assert.match(translated['sync-planning-hint'], /πρώτος συγχρονισμός δεν αφαιρεί ποτέ/);
    assert.match(translated['interrupted-import-description'], /δεν μπορεί να συνεχιστεί/);
    assert.match(translated['interrupted-import-description'], /συμπεριλαμβανομένων όσων προστέθηκαν έκτοτε/);
    assert.match(translated['interrupted-import-keep-confirm'], /Δεν διαγράφεται τίποτα/);
    assert.match(translated['interrupted-import-discard-confirm'], /διαγράφονται οριστικά/);
    assert.match(translated['interrupted-import-foreign-board'], /δεν τροποποιήθηκε/);
    assert.match(translated['interrupted-import-truncated'], /50 παλαιότερες/);
    assert.match(translated['scrum-history-checkpoint-hint'], /κανείς άλλος δεν έχει αλλάξει/);
    assert.match(translated['scrum-history-checkpoint-hint'], /δεν αλλάζει καμία εγγραφή/);
    assert.match(translated['scrum-history-checkpoint-discard-confirm'], /έγραψε ήδη/);
    assert.match(translated['stuck-sync-operation-description'], /εφαρμόστηκαν ήδη διατηρούνται/);
    assert.match(translated['stuck-sync-operation-description'], /δεν γράφονται ποτέ/);
    assert.match(translated['stuck-sync-operation-replayable-now'], /δεν μπορεί να απορριφθεί/);
    assert.match(translated['stuck-sync-operation-replayable'], /δεν απορρίφθηκε/);
    assert.match(translated['ldap-sync-now-nothing'], /LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS/);
    assert.match(translated['ldap-sync-now-nothing'], /LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED/);
    assert.ok(translated['external-link-rules-description'].includes('[{identifier}:{number}] = https://tracker.example.com/{identifier}/{number}'));
    assert.ok(translated['external-link-identifier-aliases'].includes('TK=Task, IN=Incident'));
    assert.match(translated['r-moved-forward'], /προς τα εμπρός/);
    assert.match(translated['r-moved-back'], /προς τα πίσω/);
    assert.match(translated['login-origin-mismatch'], /ROOT_URL/);
  }
  console.log('Greek planning and recovery prose, source order and complete variable inventories pass');
})().catch(error => { console.error(error); process.exitCode = 1; });
