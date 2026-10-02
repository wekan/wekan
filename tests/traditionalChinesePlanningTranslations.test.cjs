// The completed catalog predates newer features; keep its no-regression gate.
// Full translation work remains visible through fill-translations.mjs --list.
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
  for (const code of ['zh-Hant', 'zh-TW', 'zh-HK']) {
    const locale = read(code);
    assert.deepEqual(Object.keys(locale), Object.keys(english), code);
    for (const key of Object.keys(english)) {
      assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}`);
    }
    for (const key of ['filter-column-age-hint', 'scrum-total', 'sync-preview-saved',
      'email-recovery-description', 'activity-recovery-busy', 'saml-login-not-started',
      'r-rule-any-trigger-help', 'move-selection-before', 'move-selection-after']) {
      assert.notEqual(locale[key], english[key], `${code}:${key} remains English`);
      assert.match(locale[key], /\p{Script=Han}/u, `${code}:${key}`);
    }
    assert.match(locale['filter-preset-save'], /儲存.*篩選/);
    assert.doesNotMatch(locale['filter-preset-save'], /储存|筛选/);
    assert.equal(locale['blockly-ENTER_KEY'], 'Enter');
    assert.notEqual(locale['move-selection-before'], locale['move-selection-after']);
    assert.deepEqual(JSON.parse(execFileSync(process.execPath,
      ['releases/translations/fill-translations.mjs', '--completed-catalog', '--list', code],
      { cwd: root, encoding: 'utf8' })), {});
  }
  console.log('Traditional Chinese locales: source order, tokens, traditional script and completeness verified');
})().catch(error => { console.error(error); process.exitCode = 1; });
