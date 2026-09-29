'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/gl.i18n.json'), 'utf8'));
const template = fs.readFileSync(path.join(root, 'client/components/rules/actions/cardActions.jade'), 'utf8');
for (const [action, key, adjective] of [
  ['markCardComplete', 'r-mark-complete', 'completa'],
  ['markCardIncomplete', 'r-mark-incomplete', 'incompleta'],
]) {
  assert.ok(template.includes(`option(value="${action}") {{_'${key}'}}`));
  assert.equal(data[key], `Marcar a tarxeta como ${adjective}`);
  assert.doesNotMatch(data[key], /cartão|cartao|\b(completo|incompleto)\b/);
}
assert.notEqual(data['r-mark-complete'], data['r-mark-incomplete']);
console.log('Galician complete/incomplete card actions: actual template wiring, native noun agreement and distinct actions verified; browser not run');

(async () => {
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  const { execFileSync } = require('node:child_process');
  const english = JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/en.i18n.json'), 'utf8'));
  for (const code of ['gl', 'gl-ES']) {
    const locale = JSON.parse(fs.readFileSync(path.join(root, `imports/i18n/data/${code}.i18n.json`), 'utf8'));
    assert.deepEqual(Object.keys(locale), Object.keys(english), code);
    for (const key of Object.keys(english)) {
      assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}`);
    }
    for (const key of ['filter-column-age-hint', 'scrum-total', 'sync-preview-saved',
      'email-recovery-description', 'activity-recovery-busy', 'saml-login-not-started',
      'r-rule-any-trigger-help', 'r-add-trigger-to-rule', 'r-add-action-to-rule', 'r-remove-rule-part']) {
      assert.ok(locale[key]?.trim(), key);
      assert.notEqual(locale[key], english[key], `${code}:${key} remains English`);
    }
    assert.match(locale['scrum-total'], /tarxetas.*descoñecidas/);
    assert.doesNotMatch(locale['scrum-total'], /tarjetas|cartões|desconocidas/);
    assert.equal(locale['blockly-INPUT_LABEL_MATH_DIVISOR'], 'divisor');
    assert.deepEqual(JSON.parse(execFileSync(process.execPath,
      ['releases/translations/fill-translations.mjs', '--list', code],
      { cwd: root, encoding: 'utf8' })), {});
  }
  console.log('Galician source keys, interpolation tokens and planning/recovery translations verified');
})().catch(error => { console.error(error); process.exitCode = 1; });
