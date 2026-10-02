// The completed catalog predates newer features; keep its no-regression gate.
// Full translation work remains visible through fill-translations.mjs --list.
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const DATA = path.join(__dirname, '..', 'imports', 'i18n', 'data');
const read = code => JSON.parse(
  fs.readFileSync(path.join(DATA, `${code}.i18n.json`), 'utf8'),
);
const en = read('en');
const simplified = ['cmn', 'wuu-Hans', 'zh-CN', 'zh-GB', 'zh-Hans', 'zh', 'zh_SG'];
const traditional = ['yue_CN', 'zh-HK', 'zh-Hant', 'zh-TW'];
const reportKeys = [
  'officeReportTitle',
  'office-report-desc',
  'office-logins',
  'office-first-seen',
  'office-last-seen',
  'office-shared',
  'office-no-results',
  'api-report-desc',
  'api-calls',
  'api-first-called',
  'api-last-called',
  'api-no-calls',
];

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

test('all Chinese tags translate every Office and API report placeholder', () => {
  for (const code of [...simplified, ...traditional]) {
    const lang = read(code);
    for (const key of reportKeys) {
      assert.equal(typeof lang[key], 'string', `${code} lacks ${key}`);
      assert.notEqual(lang[key], en[key], `${code} leaves ${key} in English`);
    }
  }
});

test('simplified and traditional tags use their established scripts', () => {
  for (const code of simplified) {
    assert.match(read(code).officeReportTitle, /办公/, `${code} must use simplified script`);
    assert.doesNotMatch(read(code).officeReportTitle, /辦公/, `${code} must not use traditional script`);
  }
  for (const code of traditional) {
    assert.match(read(code).officeReportTitle, /辦公/, `${code} must use traditional script`);
    assert.doesNotMatch(read(code).officeReportTitle, /办公/, `${code} must not use simplified script`);
  }
});

test('technical tokens remain recognizable in translated report prose', () => {
  for (const code of [...simplified, ...traditional]) {
    const lang = read(code);
    assert.match(lang['office-report-desc'], /IPv4/);
    assert.match(lang['office-report-desc'], /IPv6/);
    assert.match(lang['api-report-desc'], /REST API/);
    assert.match(lang['api-no-calls'], /REST API/);
    assert.match(lang['api-no-calls'], /WITH_API=true/);
  }
});

test('universal API labels remain universal rather than receiving invented prose', () => {
  for (const code of [...simplified, ...traditional]) {
    const lang = read(code);
    assert.equal(lang.apiReportTitle, 'API');
    assert.equal(lang['api-endpoint'], 'API');
  }
});

console.log(`\nupcomingChineseTranslations: ${passed} tests passed`);

(async () => {
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  const { execFileSync } = require('node:child_process');
  const root = path.resolve(DATA, '../../..');
  for (const code of ['zh', 'zh-CN', 'zh-Hans', 'zh-GB', 'zh_SG', 'cmn']) {
    const locale = read(code);
    assert.deepStrictEqual(Object.keys(locale), Object.keys(en), code);
    for (const key of Object.keys(en)) {
      assert.deepStrictEqual(translationTokens(locale[key]), translationTokens(en[key]), `${code}:${key}`);
    }
    for (const key of ['filter-column-age-hint', 'scrum-total', 'sync-preview-saved',
      'email-recovery-description', 'activity-recovery-busy', 'saml-login-not-started',
      'r-rule-any-trigger-help', 'move-selection-before', 'move-selection-after',
      'blockly-WORKSPACE_SEARCH_INPUT_LABEL']) {
      assert.notStrictEqual(locale[key], en[key], `${code}:${key} remains English`);
      assert.match(locale[key], /\p{Script=Han}/u, `${code}:${key}`);
    }
    assert.match(locale['filter-preset-save'], /保存.*筛选/);
    assert.doesNotMatch(locale['filter-preset-save'], /儲存|篩選/);
    assert.notStrictEqual(locale['move-selection-before'], locale['move-selection-after']);
    assert.deepStrictEqual(JSON.parse(execFileSync(process.execPath,
      ['releases/translations/fill-translations.mjs', '--completed-catalog', '--list', code],
      { cwd: root, encoding: 'utf8' })), {});
  }
  console.log('Simplified Chinese source order, tokens, script and completeness verified');
})().catch(error => { console.error(error); process.exitCode = 1; });
