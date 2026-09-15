'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const key = 'list-width-error-message';
const read = code => JSON.parse(fs.readFileSync(path.join(root,
  'imports/i18n/data', `${code}.i18n.json`), 'utf8'));
const ledger = JSON.parse(fs.readFileSync(path.join(root,
  'releases/translations/audited-corrections.json'), 'utf8'));
const groups = [
  { codes: ['cmn', 'zh', 'zh-CN', 'zh-GB', 'zh-Hans', 'zh_SG'],
    value: '列表宽度必须是至少 200 像素的整数。',
    terms: /列表宽度.*至少 200 像素.*整数/u },
  { codes: ['zh-HK', 'zh-Hant', 'zh-TW'],
    value: '清單寬度必須是至少 200 畫素的整數。',
    terms: /清單寬度.*至少 200 畫素.*整數/u },
  { codes: ['wuu-Hans'],
    value: '列表个宽度起码要 200 像素，数值还要是整数。',
    terms: /个宽度.*起码要 200 像素.*整数/u },
  { codes: ['yue_CN'],
    value: '列表嘅闊度至少要 200 像素，而且要係整數。',
    terms: /嘅闊度.*至少要 200 像素.*係整數/u },
];
assert.equal(read('en')[key],
  'List width must be a whole number of at least 200 pixels');
let count = 0;
for (const group of groups) for (const code of group.codes) {
  const value = read(code)[key];
  assert.equal(value, group.value, code);
  assert.match(value, group.terms, code);
  assert.doesNotMatch(value, /270|大于|大於/u, code);
  const rows = ledger.filter(row => row.locale === code && row.key === key);
  assert.equal(rows.length, 1, `${code}: one correction row`);
  assert.equal(rows[0].after, value, code);
  assert.match(rows[0].before, /270/u, code);
  count++;
}
assert.equal(count, 11);
assert.notEqual(read('wuu-Hans')[key], read('cmn')[key],
  'Wu cannot retain the Mandarin sentence');
assert.notEqual(read('yue_CN')[key], read('cmn')[key],
  'Cantonese cannot retain the Mandarin sentence');
for (const code of ['wuu-Hans', 'yue_CN']) {
  const row = ledger.find(record => record.locale === code && record.key === key);
  assert.match(row.reason, /low-confidence.*native review/u,
    `${code}: complete dialect clause still needs review`);
}
(async () => {
  const i18n = require('i18next').createInstance();
  await i18n.init({ lng: 'zh-TW', fallbackLng: false,
    resources: { 'zh-TW': { translation: read('zh-TW') } } });
  assert.equal(i18n.t(key), groups[1].value);
  console.log(`${count} Chinese-variant list-width rules and runtime pass.`);
})().catch(error => { console.error(error); process.exitCode = 1; });
