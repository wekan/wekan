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
  assert.strictEqual(translated['scrum-product-backlog'], 'Ürün İş Listesi');
  assert.strictEqual(translated['scrum-sprint'], 'Sprint', 'established Turkish Scrum vocabulary');
  assert.strictEqual(translated['blockly-ENTER_KEY'], 'Enter', 'keyboard legend');
  console.log('upcomingTurkishTranslationFill: source keys, tokens and planning/recovery prose verified');
})().catch(error => { console.error(error); process.exitCode = 1; });
