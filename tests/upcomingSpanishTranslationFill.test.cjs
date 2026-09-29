'use strict';
const assert = require('assert');
const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const node = process.execPath;
const fill = path.join(ROOT, 'releases/translations/fill-translations.mjs');
const languages = ['es-AR', 'es-CL', 'es-CO', 'es-LA', 'es-MX', 'es-PE',
  'es-PY', 'es', 'es_CO'];
for (const language of languages) {
  assert.deepStrictEqual(JSON.parse(childProcess.execFileSync(node,
    [fill, '--list', language], { cwd: ROOT, encoding: 'utf8' })), {});
  const translated = JSON.parse(fs.readFileSync(path.join(ROOT,
    'imports/i18n/data', `${language}.i18n.json`), 'utf8'));
  assert.strictEqual(translated.officeReportTitle, 'Oficinas');
  assert.match(translated['api-report-desc'], /puntos finales|frecuencia/);
  assert.match(translated['api-no-calls'], /WITH_API=true/);
  assert.strictEqual(translated.error, 'Mensaje de error');
}
console.log('upcomingSpanishTranslationFill: 45 tests passed');

(async () => {
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  const en = JSON.parse(fs.readFileSync(path.join(ROOT, 'imports/i18n/data/en.i18n.json'), 'utf8'));
  for (const language of languages) {
    const translated = JSON.parse(fs.readFileSync(path.join(ROOT,
      'imports/i18n/data', `${language}.i18n.json`), 'utf8'));
    assert.deepStrictEqual(Object.keys(translated), Object.keys(en), language);
    for (const key of Object.keys(en)) {
      assert.deepStrictEqual(translationTokens(translated[key]), translationTokens(en[key]), `${language}:${key}`);
    }
    for (const key of ['filter-column-age-hint', 'scrum-total', 'sync-preview-saved',
      'email-recovery-description', 'activity-recovery-busy',
      'rule-email-recovery-description', 'saml-login-not-started',
      'blockly-WORKSPACE_SEARCH_INPUT_LABEL']) {
      assert.ok(translated[key]?.trim(), `${language}:${key}`);
      assert.notStrictEqual(translated[key], en[key], `${language}:${key} remains English`);
    }
    assert.strictEqual(translated['blockly-ARIA_TYPE_FIELD_COLOUR'], 'color');
    assert.strictEqual(translated['blockly-INPUT_LABEL_MATH_DIVISOR'], 'divisor');
  }
  console.log('upcomingSpanishTranslationFill: source keys, tokens and new prose verified in all nine locales');
})().catch(error => { console.error(error); process.exitCode = 1; });
