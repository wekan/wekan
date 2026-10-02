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
for (const language of ['pt-PT', 'pt', 'pt_PT']) {
  const remaining = JSON.parse(childProcess.execFileSync(node,
    [fill, '--completed-catalog', '--list', language], { cwd: ROOT, encoding: 'utf8' }));
  assert.deepStrictEqual(remaining, {});
  const translated = JSON.parse(fs.readFileSync(path.join(ROOT,
    'imports/i18n/data', `${language}.i18n.json`), 'utf8'));
  assert.strictEqual(translated.officeReportTitle, 'Escritórios');
  assert.match(translated['api-report-desc'], /pontos finais|frequência/);
  assert.doesNotMatch(translated['office-no-results'], /Nobody|logged in/);
  assert.match(translated['api-no-calls'], /WITH_API=true/);
}
console.log('upcomingPortugueseTranslationFill: 15 tests passed');

(async () => {
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  const english = JSON.parse(fs.readFileSync(path.join(ROOT, 'imports/i18n/data/en.i18n.json'), 'utf8'));
  for (const language of ['pt', 'pt-PT', 'pt_PT', 'pt-BR']) {
    const translated = JSON.parse(fs.readFileSync(path.join(ROOT,
      'imports/i18n/data', `${language}.i18n.json`), 'utf8'));
    assert.deepStrictEqual(Object.keys(translated), Object.keys(english), language);
    for (const key of Object.keys(english)) {
      assert.deepStrictEqual(translationTokens(translated[key]), translationTokens(english[key]), `${language}:${key}`);
    }
    for (const key of ['filter-column-age-hint', 'scrum-total', 'sync-preview-saved',
      'email-recovery-description', 'activity-recovery-busy', 'saml-login-not-started',
      'r-rule-any-trigger-help', 'r-add-trigger-to-rule', 'r-add-action-to-rule', 'r-remove-rule-part']) {
      assert.ok(translated[key]?.trim(), key);
      assert.notStrictEqual(translated[key], english[key], `${language}:${key}`);
    }
    assert.deepStrictEqual(JSON.parse(childProcess.execFileSync(node,
      [fill, '--completed-catalog', '--list', language], { cwd: ROOT, encoding: 'utf8' })), {});
    assert.match(translated['filter-preset-save'], language === 'pt-BR' ? /Salvar/ : /Guardar/);
    assert.match(translated['r-vars-people-hint'], language === 'pt-BR' ? /usuário.*raias/ : /utilizador.*pistas/);
  }
  console.log('upcomingPortugueseTranslationFill: all four locales preserve keys, tokens and regional terminology');
})().catch(error => { console.error(error); process.exitCode = 1; });
