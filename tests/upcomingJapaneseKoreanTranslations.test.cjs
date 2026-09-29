'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const DATA = path.join(__dirname, '..', 'imports', 'i18n', 'data');
const read = code => JSON.parse(
  fs.readFileSync(path.join(DATA, code + '.i18n.json'), 'utf8'),
);
const en = read('en');
const japanese = ['ja', 'ja-JP', 'ja-HI'];
const korean = ['ko', 'ko-KR'];
const reportKeys = [
  'officeReportTitle', 'office-report-desc', 'office-logins',
  'office-first-seen', 'office-last-seen', 'office-shared',
  'office-no-results', 'api-report-desc', 'api-calls',
  'api-first-called', 'api-last-called', 'api-no-calls',
];

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

test('all Japanese and Korean tags translate every report placeholder', () => {
  for (const code of [...japanese, ...korean]) {
    const lang = read(code);
    for (const key of reportKeys) {
      assert.equal(typeof lang[key], 'string', code + ' lacks ' + key);
      assert.notEqual(lang[key], en[key], code + ' leaves ' + key + ' in English');
    }
  }
});

test('each family keeps its established script and login vocabulary', () => {
  for (const code of japanese) {
    assert.equal(read(code).officeReportTitle, 'ログイン場所');
  }
  for (const code of korean) {
    assert.equal(read(code).officeReportTitle, '로그인 위치');
  }
});

test('technical tokens remain recognizable in every translated description', () => {
  for (const code of [...japanese, ...korean]) {
    const lang = read(code);
    assert.match(lang['office-report-desc'], /IPv4/);
    assert.match(lang['office-report-desc'], /IPv6/);
    assert.match(lang['api-report-desc'], /REST API/);
    assert.match(lang['api-no-calls'], /REST API/);
    assert.match(lang['api-no-calls'], /WITH_API=true/);
  }
});

test('universal API labels remain unchanged', () => {
  for (const code of [...japanese, ...korean]) {
    const lang = read(code);
    assert.equal(lang.apiReportTitle, 'API');
    assert.equal(lang['api-endpoint'], 'API');
  }
});

console.log('\nupcomingJapaneseKoreanTranslations: ' + passed + ' tests passed');

(async () => {
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  const { execFileSync } = require('node:child_process');
  const root = path.resolve(DATA, '../../..');
  for (const code of japanese) {
    const locale = read(code);
    assert.deepStrictEqual(Object.keys(locale), Object.keys(en), code);
    for (const key of Object.keys(en)) {
      assert.deepStrictEqual(translationTokens(locale[key]), translationTokens(en[key]), `${code}:${key}`);
    }
    for (const key of ['filter-column-age-hint', 'scrum-total', 'sync-preview-saved',
      'email-recovery-description', 'activity-recovery-busy', 'saml-login-not-started',
      'r-rule-any-trigger-help', 'move-selection-before', 'move-selection-after']) {
      assert.notStrictEqual(locale[key], en[key], `${code}:${key} remains English`);
      assert.match(locale[key], /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u, `${code}:${key}`);
    }
    assert.strictEqual(locale['blockly-LOGIC_BOOLEAN_TRUE'], '真');
    assert.strictEqual(locale['blockly-LOGIC_BOOLEAN_FALSE'], '偽');
    assert.strictEqual(locale['blockly-LOGIC_NULL'], 'null');
    assert.deepStrictEqual(JSON.parse(execFileSync(process.execPath,
      ['releases/translations/fill-translations.mjs', '--list', code],
      { cwd: root, encoding: 'utf8' })), {});
  }
  console.log('Japanese source order, tokens, localized prose and completeness verified');
})().catch(error => { console.error(error); process.exitCode = 1; });
