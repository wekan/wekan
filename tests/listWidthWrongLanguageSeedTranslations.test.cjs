'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const key = 'list-width-error-message';
const read = code => JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data', `${code}.i18n.json`), 'utf8'));
const ledger = JSON.parse(fs.readFileSync(path.join(root, 'releases/translations/audited-corrections.json'), 'utf8'));
const cases = [
  ['ary', /خاص عرض الليستة يكون عدد صحيح، 200 بكسل على الأقل/u],
  ['tt', /Исемлек киңлеге кимендә 200 пиксель булган бөтен сан/u],
  ['hsb', /Šěrokosć lisćiny dyrbi cyła ličba ≥ 200 pikselow/u],
  ['csb', /Szërokòsc lëstë mùszi bëc cëłkòwitą lëczbą ≥ 200 pikselów/u],
  ['szl', /cołkowitōm liczbōm ≥ 200 pikseli/u],
  ['ff', /limre timmunde ≥ 200 piksel/u],
  ['wo', /lim bu mat ≥ 200 pixels/u],
  ['kl', /kisitsit ilivitsoq ≥ 200 pixelit/u],
  ['lg', /ennamba ennambilila ≥ 200 pixels/u],
  ['bi', /wan ful namba ≥ 200 piksel/u],
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
  assert.match(rows[0].reason, /low-confidence pending native grammar review/u,
    `${code}: uncertainty recorded`);
}
assert.doesNotMatch(read('tt')[key], /генишлиги|там сайы|олмалыдыр/u);
assert.doesNotMatch(read('hsb')[key], /Šířka|mouzí|čízlo/u);
(async () => {
  const i18n = require('i18next').createInstance();
  await i18n.init({ lng: 'tt', fallbackLng: false,
    resources: { tt: { translation: read('tt') } } });
  assert.equal(i18n.t(key), read('tt')[key]);
  console.log(`${cases.length} repaired list-width rules and Tatar runtime pass.`);
})().catch(error => { console.error(error); process.exitCode = 1; });
