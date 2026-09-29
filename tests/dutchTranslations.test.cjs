const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const fillScript = path.join(root, 'releases/translations/fill-translations.mjs');
for (const language of ['nl-NL', 'nl']) {
  const result = spawnSync(process.execPath, [fillScript, '--list', language], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, '{}\n');
  const locale = JSON.parse(fs.readFileSync(path.join(root, `imports/i18n/data/${language}.i18n.json`), 'utf8'));
  assert.equal(locale.swimlane, 'Werkbaan');
  assert.equal(locale.status, 'Toestand');
  assert.equal(locale.repository, 'Broncodeopslag');
  assert.equal(locale.ticket, 'Ondersteuningsverzoek');
  assert.match(locale['azure-container'], /Azure/);
  assert.match(locale['office-report-desc'], /IPv4.*IPv6/);
  assert.match(locale['api-no-calls'], /REST API.*WITH_API=true/);
}

(async () => {
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  const english = JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/en.i18n.json'), 'utf8'));
  for (const code of ['nl', 'nl-NL']) {
    const locale = JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/' + code + '.i18n.json'), 'utf8'));
    assert.deepEqual(Object.keys(locale), Object.keys(english), code);
    for (const key of Object.keys(english)) {
      assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), code + ':' + key);
    }
    for (const key of ['filter-column-age-hint', 'scrum-total', 'sync-preview-saved',
      'email-recovery-description', 'activity-recovery-busy', 'saml-login-not-started',
      'r-rule-any-trigger-help', 'move-selection-before', 'move-selection-after', 'draggable']) {
      assert.ok(locale[key]?.trim(), key);
      assert.notEqual(locale[key], english[key], code + ':' + key);
    }
    assert.equal(locale['move-selection-before'], 'Vóór');
    assert.equal(locale['move-selection-after'], 'Na');
    assert.equal(locale['blockly-MATH_IS_EVEN'], 'is even');
    assert.match(locale['scrum-report-help'], /geen schattingen van nul/);
    assert.match(locale['sync-conflict-hint'], /niets naar het bronsysteem/);
    assert.match(locale['sync-report-partial'], /niet ongedaan/);
    assert.match(locale['activity-recovery-cancel-confirm'], /niet worden hervat/);
  }
  console.log('Dutch source keys, tokens, shared vocabulary and recovery meaning verified');
})().catch(error => { console.error(error); process.exitCode = 1; });
