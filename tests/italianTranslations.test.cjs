const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const result = spawnSync(process.execPath, [path.join(root, 'releases/translations/fill-translations.mjs'), '--list', 'it'], { cwd: root, encoding: 'utf8' });
assert.equal(result.status, 0, result.stderr);
assert.equal(result.stdout, '{}\n');
const locale = JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/it.i18n.json'), 'utf8'));
assert.equal(locale.swimlane, 'Corsia');
assert.equal(locale.password, "Parola d'accesso");
assert.equal(locale.backup, 'Copia di sicurezza');
assert.match(locale['office-report-desc'], /IPv4.*IPv6/);
assert.match(locale['api-no-calls'], /REST API.*WITH_API=true/);

(async () => {
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  const english = JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/en.i18n.json'), 'utf8'));
  assert.deepEqual(Object.keys(locale), Object.keys(english), 'all current source keys in source order');
  for (const key of Object.keys(english)) {
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), key);
  }
  for (const key of ['filter-column-age-hint', 'scrum-total', 'sync-preview-saved',
    'email-recovery-description', 'activity-recovery-busy',
    'rule-email-recovery-description', 'saml-login-not-started']) {
    assert.ok(locale[key]?.trim(), key);
    assert.notEqual(locale[key], english[key], `${key} remains English`);
  }
  assert.equal(locale['board-view-sprints'], 'Sprint', 'the view is not limited to planned sprints');
  assert.equal(locale['blockly-ENTER_KEY'], 'Invio');
  assert.equal(locale['blockly-MATH_TRIG_COS'], 'cos');
  console.log('italianTranslations: complete source keys, tokens and planning/recovery prose verified');
})().catch(error => { console.error(error); process.exitCode = 1; });
