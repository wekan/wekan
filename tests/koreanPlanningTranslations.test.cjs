'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const read = code => JSON.parse(fs.readFileSync(path.join(root,
  `imports/i18n/data/${code}.i18n.json`), 'utf8'));

(async () => {
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  const english = read('en');
  for (const code of ['ko', 'ko-KR']) {
    const locale = read(code);
    assert.deepEqual(Object.keys(locale), Object.keys(english), code);
    for (const key of Object.keys(english)) {
      assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}`);
    }
    for (const key of ['filter-column-age-hint', 'scrum-total', 'sync-preview-saved',
      'email-recovery-description', 'activity-recovery-busy', 'saml-login-not-started',
      'r-rule-any-trigger-help', 'move-selection-before', 'move-selection-after']) {
      assert.notEqual(locale[key], english[key], `${code}:${key} remains English`);
      assert.match(locale[key], /\p{Script=Hangul}/u, `${code}:${key}`);
    }
    assert.notEqual(locale['move-selection-before'], locale['move-selection-after']);
    assert.equal(locale['blockly-MATH_TRIG_COS'], 'cos');
    assert.deepEqual(JSON.parse(execFileSync(process.execPath,
      ['releases/translations/fill-translations.mjs', '--list', code],
      { cwd: root, encoding: 'utf8' })), {});
  }
  console.log('Korean locales: source order, tokens, Korean prose and completion verified');
})().catch(error => { console.error(error); process.exitCode = 1; });
