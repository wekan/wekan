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
  [fill, '--completed-catalog', '--list', 'tr'], { cwd: ROOT, encoding: 'utf8' })), {});
const translated = JSON.parse(fs.readFileSync(path.join(ROOT,
  'imports/i18n/data/tr.i18n.json'), 'utf8'));
assert.strictEqual(translated.checklist, 'Kontrol listesi');
assert.match(translated['api-report-desc'], /uç nokta|sıklıkta/);
assert.doesNotMatch(translated['office-no-results'], /Nobody|logged in/);
assert.match(translated['api-no-calls'], /WITH_API=true/);
console.log('upcomingTurkishTranslationFill: 5 tests passed');

(async () => {
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  const en = JSON.parse(fs.readFileSync(path.join(ROOT, 'imports/i18n/data/en.i18n.json'), 'utf8'));
  assert.deepStrictEqual(Object.keys(translated), Object.keys(en), 'new English keys must be translated in source order');
  for (const key of Object.keys(en)) {
    assert.deepStrictEqual(translationTokens(translated[key]), translationTokens(en[key]), key);
  }
  for (const key of ['filter-column-age-hint', 'scrum-total', 'sync-preview-saved',
    'email-recovery-description', 'activity-recovery-busy',
    'rule-email-recovery-description', 'saml-login-not-started']) {
    assert.ok(translated[key]?.trim(), key);
    assert.notStrictEqual(translated[key], en[key], `${key} must not remain English`);
  }
  for (const key of Object.keys(en).filter(key => key.startsWith('interrupted-import-'))) {
    assert.ok(translated[key]?.trim(), key);
    assert.notStrictEqual(translated[key], en[key], `${key}: translate import recovery`);
  }
  assert.match(translated['interrupted-import-description'], /devam edilemez/);
  assert.match(translated['interrupted-import-description'], /sonradan eklenenler dahil/);
  assert.match(translated['interrupted-import-keep-confirm'], /Hiçbir şey kaldırılmaz/);
  assert.match(translated['interrupted-import-discard-confirm'], /kalıcı olarak kaldırılır/);
  assert.match(translated['interrupted-import-truncated'], /en eski 50/);
  assert.match(translated['interrupted-import-foreign-board'], /değiştirilmedi/);
  assert.match(translated['interrupted-import-state-discarding'], /yeniden silin/);
  for (const key of Object.keys(en).filter(key => key.startsWith('stuck-sync-operation-') || key.startsWith('ldap-sync-now'))) {
    assert.notStrictEqual(translated[key], en[key], `${key}: translate recovery and LDAP`);
  }
  assert.match(translated['stuck-sync-operation-description'], /uygulanmış değişiklikler korunur/);
  assert.match(translated['stuck-sync-operation-description'], /hiçbir zaman yazılmaz/);
  assert.match(translated['stuck-sync-operation-replayable-now'], /iptal edilemez/);
  assert.match(translated['stuck-sync-operation-replayable'], /iptal edilmedi/);
  assert.match(translated['stuck-sync-operation-truncated'], /en eski 50/);
  assert.match(translated['ldap-sync-now-nothing'], /LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS/);
  assert.match(translated['ldap-sync-now-nothing'], /LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED/);
  assert.ok(translated['external-link-rules-description'].includes('[{identifier}:{number}] = https://tracker.example.com/{identifier}/{number}'));
  assert.ok(translated['external-link-identifier-aliases'].includes('TK=Task, IN=Incident'));
  assert.match(translated['r-moved-forward'], /ilerideki/);
  assert.match(translated['r-moved-back'], /önceki/);
  assert.match(translated['login-origin-mismatch'], /ROOT_URL/);
  for (const key of Object.keys(en).filter(key => /^(scrum-import-|sync-planning-|scrum-history-checkpoint-)/.test(key))) {
    assert.notStrictEqual(translated[key], en[key], `${key}: translate planning recovery`);
  }
  assert.match(translated['scrum-import-into-board-hint'], /asla çoğaltılmaz/);
  assert.match(translated['scrum-import-card-on-another-board'], /değiştirilmeden bırakıldı/);
  assert.match(translated['scrum-import-sprint-finished'], /taşınmadı/);
  assert.match(translated['sync-planning-hint'], /önce kaynak kimliğine, ardından ada/);
  assert.match(translated['sync-planning-hint'], /ilk eşitleme planlamayı asla kaldırmaz/);
  assert.match(translated['scrum-history-checkpoint-hint'], /başka hiç kimse değiştirmemişse/);
  assert.match(translated['scrum-history-checkpoint-hint'], /hiçbir kaydı değiştirmez/);
  assert.match(translated['scrum-history-checkpoint-discard-confirm'], /zaten yazdığı değişiklikler de dahil/);
  assert.strictEqual(translated['scrum-product-backlog'], 'Ürün İş Listesi');
  assert.strictEqual(translated['scrum-sprint'], 'Sprint', 'established Turkish Scrum vocabulary');
  assert.strictEqual(translated['blockly-ENTER_KEY'], 'Enter', 'keyboard legend');
  console.log('upcomingTurkishTranslationFill: source keys, tokens and planning/recovery prose verified');
})().catch(error => { console.error(error); process.exitCode = 1; });
