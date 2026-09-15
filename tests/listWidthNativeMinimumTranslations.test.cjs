'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const key = 'list-width-error-message';
const read = code => JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data', `${code}.i18n.json`), 'utf8'));
const ledger = JSON.parse(fs.readFileSync(path.join(root, 'releases/translations/audited-corrections.json'), 'utf8'));
const cases = [
  ['ace', /angka bulat nyang sikureueng 200 piksel/u],
  ['bm', /hakɛtilennen ye min ka kɛ hali 200 pikɛsɛli/u],
  ['ee', /blibo si le 200 pixels ya teti/u],
  ['ve', /nomboro yo fhelelaho ya mapikisele a si fhasi ha 200/u],
  ['tk_TM', /azyndan 200 piksel bolan bitewi san/u],
  ['wa-RR', /bug-os nga numero nga pinakagutiay 200 pixels/u],
  ['ny', /nambala yathunthu ya mapikiselo 200 kapena kuposerapo/u],
  ['sah', /бүтүн чыыһыла ≥ 200 пиксел/u],
  ['cv', /пӗтӗм хисеп ≥ 200 пиксель/u],
  ['ur', /کم از کم 200 پکسل کا مکمل عدد/u],
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
for (const code of ['bm', 'ee', 'wa-RR', 'ny', 'sah', 'cv', 'ur']) {
  assert.match(ledger.find(row => row.locale === code && row.key === key).reason,
    /low-confidence pending native grammar review/u, code);
}
(async () => {
  const i18n = require('i18next').createInstance();
  await i18n.init({ lng: 've', fallbackLng: false,
    resources: { ve: { translation: read('ve') } } });
  assert.equal(i18n.t(key), read('ve')[key]);
  console.log(`${cases.length} native list-width rules and Venda runtime pass.`);
})().catch(error => { console.error(error); process.exitCode = 1; });
