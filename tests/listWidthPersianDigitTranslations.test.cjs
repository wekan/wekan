'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = code => JSON.parse(fs.readFileSync(path.join(root,
  'imports/i18n/data', `${code}.i18n.json`), 'utf8'));
const english = read('en');
const key = 'list-width-error-message';
assert.equal(english[key],
  'List width must be a whole number of at least 200 pixels');
const expected = {
  fa: 'عرض لیست باید عددی صحیح و حداقل ۲۰۰ پیکسل باشد',
  'fa-IR': 'عرض لیست باید عددی صحیح و حداقل ۲۰۰ پیکسل باشد',
  'uz-AR': 'رۉیخت کینگ‌لیگی کمیده ۲۰۰ پیکسل بۉلگن پۇتون سان بۉلیشی کیرک',
};
const ledger = JSON.parse(fs.readFileSync(path.join(root,
  'releases/translations/audited-corrections.json'), 'utf8'));
for (const [code, value] of Object.entries(expected)) {
  const data = read(code);
  assert.equal(data[key], value);
  assert.match(value, /۲۰۰/u, `${code}: native numeral`);
  assert.doesNotMatch(value, /۲۷۰|270/u, `${code}: stale threshold`);
  assert.match(value, /پیکسل/u, `${code}: pixel unit`);
  assert.equal(data['set-list-width-value'].includes('پیکسل'), true,
    `${code}: rule uses existing local pixel term`);
  const rows = ledger.filter(row => row.locale === code && row.key === key);
  assert.equal(rows.length, 1, `${code}: one correction row`);
  assert.equal(rows[0].after, value);
  assert.match(rows[0].before, /۲۷۰/u);
}
for (const code of ['fa', 'fa-IR']) {
  assert.match(expected[code], /عدد.*صحیح.*حداقل/u,
    'Persian requires an integer and an inclusive minimum');
}
assert.match(expected['uz-AR'], /کمیده ۲۰۰.*پۇتون سان/u,
  'Uzbek Arabic requires at least 200 and a whole number');
(async () => {
  const i18n = require('i18next').createInstance();
  await i18n.init({ lng: 'uz-AR', fallbackLng: false,
    resources: { 'uz-AR': { translation: read('uz-AR') } } });
  assert.equal(i18n.t(key), expected['uz-AR']);
  console.log('Persian-digit list-width rules: 3 locales and runtime pass.');
})().catch(error => { console.error(error); process.exitCode = 1; });
