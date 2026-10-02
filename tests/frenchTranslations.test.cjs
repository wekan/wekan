// The completed catalog predates newer features; keep its no-regression gate.
// Full translation work remains visible through fill-translations.mjs --list.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const fillScript = path.join(root, 'releases/translations/fill-translations.mjs');
for (const language of ['fr-BE', 'fr-CA', 'fr-CH', 'fr-FR', 'fr']) {
  const result = spawnSync(process.execPath, [fillScript, '--completed-catalog', '--list', language], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, '{}\n');
  const locale = JSON.parse(fs.readFileSync(path.join(root, `imports/i18n/data/${language}.i18n.json`), 'utf8'));
  assert.equal(locale.action, "Opération à effectuer");
  assert.equal(locale.public, 'Visible par tous');
  assert.equal(locale.ticket, "Demande d'assistance");
  assert.match(locale['office-report-desc'], /IPv4.*IPv6/);
  assert.match(locale['api-no-calls'], /REST API.*WITH_API=true/);
}

(async () => {
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  const english = JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/en.i18n.json'), 'utf8'));
  for (const code of ['fr', 'fr-FR', 'fr-BE', 'fr-CH', 'fr-CA']) {
    const locale = JSON.parse(fs.readFileSync(path.join(root, `imports/i18n/data/${code}.i18n.json`), 'utf8'));
    assert.deepEqual(Object.keys(locale), Object.keys(english), code);
    for (const key of Object.keys(english)) {
      assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}`);
    }
    for (const key of ['filter-column-age-hint', 'scrum-total', 'sync-preview-saved',
      'email-recovery-description', 'activity-recovery-busy', 'saml-login-not-started',
      'r-rule-any-trigger-help', 'move-selection-before', 'move-selection-after']) {
      assert.ok(locale[key]?.trim(), key);
      assert.notEqual(locale[key], english[key], `${code}:${key} remains English`);
    }
    assert.match(locale['filter-preset-save'], /Enregistrer.*filtres/);
    assert.equal(locale['blockly-ARIA_TYPE_FIELD_IMAGE'], 'image');
    assert.equal(locale['blockly-MATH_ONLIST_OPERATOR_MIN_ARIA'], 'minimum');
    assert.notEqual(locale['move-selection-before'], locale['move-selection-after']);
  }
  console.log('French locales: source keys, tokens, localized prose and shared vocabulary verified');
})().catch(error => { console.error(error); process.exitCode = 1; });
