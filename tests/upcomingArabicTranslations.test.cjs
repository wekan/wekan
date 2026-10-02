// The completed catalog predates newer features; keep its no-regression gate.
// Full translation work remains visible through fill-translations.mjs --list.
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const DATA = path.join(__dirname, '..', 'imports', 'i18n', 'data');
const read = code => JSON.parse(
  fs.readFileSync(path.join(DATA, code + '.i18n.json'), 'utf8'),
);
const en = read('en');
const arabic = ['ar', 'ar-DZ', 'ar-EG', 'ary'];
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

test('all Arabic tags translate every report placeholder', () => {
  for (const code of arabic) {
    const lang = read(code);
    for (const key of reportKeys) {
      assert.equal(typeof lang[key], 'string', code + ' lacks ' + key);
      assert.notEqual(lang[key], en[key], code + ' leaves ' + key + ' in English');
    }
  }
});

test('all translated report values contain Arabic script', () => {
  for (const code of arabic) {
    const lang = read(code);
    for (const key of reportKeys) {
      assert.match(lang[key], /[؀-ۿ]/, code + ' has no Arabic script in ' + key);
    }
  }
});

test('technical tokens remain recognizable in translated descriptions', () => {
  for (const code of arabic) {
    const lang = read(code);
    assert.match(lang['office-report-desc'], /IPv4/);
    assert.match(lang['office-report-desc'], /IPv6/);
    assert.match(lang['api-report-desc'], /REST API/);
    assert.match(lang['api-no-calls'], /REST API/);
    assert.match(lang['api-no-calls'], /WITH_API=true/);
  }
});

test('universal API labels remain unchanged', () => {
  for (const code of arabic) {
    const lang = read(code);
    assert.equal(lang.apiReportTitle, 'API');
    assert.equal(lang['api-endpoint'], 'API');
  }
});

console.log('\nupcomingArabicTranslations: ' + passed + ' tests passed');

(async () => {
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  test('completed Arabic locales preserve every key and interpolation token', () => {
    for (const code of ['ar', 'ar-DZ', 'ar-EG']) {
      const lang = read(code);
      assert.deepStrictEqual(Object.keys(lang), Object.keys(en), code);
      for (const key of Object.keys(en)) {
        assert.deepStrictEqual(translationTokens(lang[key]), translationTokens(en[key]), `${code}:${key}`);
      }
    }
  });
  test('new planning and recovery prose is Arabic, with no English placeholders left', () => {
    const { execFileSync } = require('node:child_process');
    const root = path.resolve(DATA, '../../..');
    for (const code of ['ar', 'ar-DZ', 'ar-EG']) {
      const lang = read(code);
      for (const key of ['filter-column-age-hint', 'scrum-total',
        'sync-preview-saved', 'email-recovery-description',
        'activity-recovery-busy', 'rule-email-recovery-description',
        'saml-login-not-started']) {
        assert.notStrictEqual(lang[key], en[key], `${code}:${key}`);
        assert.match(lang[key], /\p{Script=Arabic}/u, `${code}:${key}`);
      }
      const missing = JSON.parse(execFileSync(process.execPath,
        ['releases/translations/fill-translations.mjs', '--completed-catalog', '--list', code],
        { cwd: root, encoding: 'utf8' }));
      assert.deepStrictEqual(missing, {}, code);
      assert.strictEqual(lang['blockly-MATH_TRIG_ACOS'], 'acos');
    }
  });
})().catch(error => { console.error(error); process.exitCode = 1; });
