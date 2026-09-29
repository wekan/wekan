const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const result = spawnSync(process.execPath, [path.join(root, 'releases/translations/fill-translations.mjs'), '--list', 'nb'], { cwd: root, encoding: 'utf8' });
assert.equal(result.status, 0, result.stderr);
assert.equal(result.stdout, '{}\n');
const locale = JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/nb.i18n.json'), 'utf8'));
assert.equal(locale.font, 'Skriftutforming');
assert.equal(locale.status, 'Tilstand');
assert.equal(locale.Database, 'Datalager');
assert.match(locale['azure-container'], /Azure/);
assert.match(locale['office-report-desc'], /IPv4.*IPv6/);
assert.match(locale['api-no-calls'], /REST API.*WITH_API=true/);

(async () => {
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  const english = JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/en.i18n.json'), 'utf8'));
  assert.deepEqual(Object.keys(locale), Object.keys(english));
  for (const key of Object.keys(english)) {
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), key);
  }
  for (const key of ['filter-column-age-hint', 'scrum-total', 'sync-preview-saved',
    'email-recovery-description', 'activity-recovery-busy', 'saml-login-not-started',
    'r-rule-any-trigger-help', 'move-selection-before', 'move-selection-after']) {
    assert.ok(locale[key]?.trim(), key);
    assert.notEqual(locale[key], english[key], key);
  }
  assert.equal(locale['move-selection-before'], 'Før');
  assert.equal(locale['move-selection-after'], 'Etter');
  assert.equal(locale['blockly-MATH_ADDITION_SYMBOL_ARIA'], 'pluss');
  assert.equal(locale['scrum-start-sprint'], 'Start sprint');
  assert.match(locale['scrum-report-help'], /ikke nullestimater/);
  assert.match(locale['sync-conflict-hint'], /Ingenting sendes til kildesystemet/);
  assert.match(locale['activity-recovery-cancel-confirm'], /kan ikke gjenopptas/);
  console.log('Bokmål source keys, tokens, shared vocabulary and recovery meaning verified');
})().catch(error => { console.error(error); process.exitCode = 1; });
