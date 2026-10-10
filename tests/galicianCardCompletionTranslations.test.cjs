// Guard both full current Galician catalogs and action meanings.
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
    assert.match(locale['custom-field-links-hint'], /mesmo nome e tipo nas dúas tarxetas/);
    assert.match(locale['custom-field-links-hint'], /só existen nunha das tarxetas quedan sen cambios/);
    assert.match(locale['custom-field-link-inactive'], /xa non pode editar as dúas tarxetas.*arquivada/);
    assert.match(locale['custom-field-link-both'], /dous sentidos.*calquera tarxeta/);
    assert.match(locale['custom-field-link-send'], /só sentido.*tarxeta principal/);
    assert.match(locale['field-link-not-allowed'], /editar as dúas tarxetas/);
    assert.equal(locale['import-members-mode-me'], 'Substituílas todas por min');
    assert.match(locale['import-many-boards-hint'], /sen asociar membros/);
    assert.match(locale['import-many-boards-hint'], /por si mesmo unha única exportación.*é un só taboleiro/);
    assert.match(locale['export-all-boards-hint'], /pode exportar.*libro.*\.zip/);
    assert.match(locale['webhook-payload-description'], /conserva a configuración herdada/);
    assert.match(locale['notification-delivery-quiet'], /agardar ata que rematen/);
    assert.match(locale['r-wrike-workflow-note'], /como completa.*Completed.*Cancelled.*como incompleta.*Active.*Deferred/);
    for (const literal of ['GET /workflows', 'Active', 'Completed', 'Deferred', 'Cancelled']) assert.ok(locale['r-wrike-workflow-note'].includes(literal), literal);
    assert.ok(locale['webhook-payload-field-standard'].includes('WEBHOOKS_ATTRIBUTES'));
    assert.notEqual(locale['subtask-mark-done'], locale['subtask-mark-not-done']);
    assert.match(locale['scrum-total'], /tarxetas.*descoñecidas/);
    assert.doesNotMatch(locale['scrum-total'], /tarjetas|cartões|desconocidas/);
    assert.equal(locale['blockly-INPUT_LABEL_MATH_DIVISOR'], 'divisor');
    assert.deepEqual(JSON.parse(execFileSync(process.execPath,
      ['releases/translations/fill-translations.mjs', '--list', code],
      { cwd: root, encoding: 'utf8' })), {});
  }
  console.log('Galician source keys, interpolation tokens and planning/recovery translations verified');
})().catch(error => { console.error(error); process.exitCode = 1; });
