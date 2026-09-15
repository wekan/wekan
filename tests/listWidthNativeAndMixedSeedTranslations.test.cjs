'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const key = 'list-width-error-message';
const read = code => JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data', `${code}.i18n.json`), 'utf8'));
const ledger = JSON.parse(fs.readFileSync(path.join(root, 'releases/translations/audited-corrections.json'), 'utf8'));
const cases = [
  ['bua', /200 пиксельһээ бага бэшэ бүхэли тоо/u],
  ['fj', /naba taucoko ≥ 200 pixels/u],
  ['kok', /उण्यांत उणें 200 पिक्सेलांचो पूर्णांक/u],
  ['gn', /papapy oĩmbáva ≥ 200 píxel/u],
  ['mai', /कम सँ कम 200 पिक्सेलक पूर्णांक/u],
  ['tpi', /namba olgeta ≥ 200 piksel/u],
  ['rn', /igitigiri cuzuye ≥ 200 pixels/u],
  ['tl', /buong bilang na hindi bababa sa 200 pixels/u],
  ['sn', /nhamba yakazara ye kanenge 200 pixels/u],
  ['ig', /ọnụọgụ zuru ezu nke opekata mpe 200 pikselụ/u],
];
assert.equal(read('en')[key], 'List width must be a whole number of at least 200 pixels');
for (const [code, phrase] of cases) {
  const value = read(code)[key];
  assert.match(value, phrase, code);
  assert.doesNotMatch(value, /270|۲۷۰|greater than|integer/u, code);
  const rows = ledger.filter(row => row.locale === code && row.key === key);
  assert.equal(rows.length, 1, `${code}: one correction record`);
  assert.match(rows[0].before, /270/u, code);
  assert.equal(rows[0].after, value, code);
}
for (const code of ['bua', 'fj', 'kok', 'gn', 'tpi', 'rn', 'sn', 'ig']) {
  assert.match(ledger.find(row => row.locale === code && row.key === key).reason,
    /low-confidence pending native grammar review/u, code);
}
(async () => {
  const i18n = require('i18next').createInstance();
  await i18n.init({ lng: 'tl', fallbackLng: false,
    resources: { tl: { translation: read('tl') } } });
  assert.equal(i18n.t(key), read('tl')[key]);
  console.log(`${cases.length} repaired list-width rules and Tagalog runtime pass.`);
})().catch(error => { console.error(error); process.exitCode = 1; });
