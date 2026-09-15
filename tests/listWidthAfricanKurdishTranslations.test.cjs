'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const key = 'list-width-error-message';
const read = code => JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data', `${code}.i18n.json`), 'utf8'));
const ledger = JSON.parse(fs.readFileSync(path.join(root, 'releases/translations/audited-corrections.json'), 'utf8'));
const cases = [
  ['ba', /кәм тигәндә 200 пиксел.*бөтөн һан/u],
  ['ha', /cikakkiyar lamba ta aƙalla 200 pixels/u],
  ['ku', /hejmareke tam a herî kêm 200 pîksel/u],
  ['mg', /isa feno farafahakeliny 200 piksel/u],
  ['nso', /palotlalo ya bonyane dipiksele tše 200/u],
  ['om', /lakkoofsa guutuu yoo xiqqaate piikselii 200/u],
  ['so', /tiro dhan oo ugu yaraan 200 pixels/u],
  ['sw', /nambari kamili ya angalau pikseli 200/u],
  ['zu', /yinombolo ephelele okungenani amaphikseli angu-200/u],
  ['zu-ZA', /yinombolo ephelele okungenani amaphikseli angu-200/u],
  ['ckb', /ژمارەیەکی تەواوی لانی کەم 200 پیکسڵ/u],
  ['yi', /גאַנצע צאָל פֿון כאָטש 200 פּיקסלען/u],
];
assert.equal(read('en')[key], 'List width must be a whole number of at least 200 pixels');
for (const [code, nativeRule] of cases) {
  const value = read(code)[key];
  assert.match(value, nativeRule, code);
  assert.doesNotMatch(value, /270|۲۷۰/u, code);
  const rows = ledger.filter(row => row.locale === code && row.key === key);
  assert.equal(rows.length, 1, `${code}: one correction record`);
  assert.match(rows[0].before, /270/u, code);
  assert.equal(rows[0].after, value, code);
}
assert.equal(read('zu')[key], read('zu-ZA')[key]);
for (const code of ['ckb', 'yi']) {
  assert.match(ledger.find(row => row.locale === code && row.key === key).reason,
    /low-confidence pending native grammar review/u, code);
}
(async () => {
  const i18n = require('i18next').createInstance();
  await i18n.init({ lng: 'sw', fallbackLng: false,
    resources: { sw: { translation: read('sw') } } });
  assert.equal(i18n.t(key), read('sw')[key]);
  console.log(`${cases.length} native list-width rules and Swahili runtime pass.`);
})().catch(error => { console.error(error); process.exitCode = 1; });
