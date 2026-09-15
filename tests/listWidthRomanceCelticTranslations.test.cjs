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
const cases = [
  ['an', /amplaria d’a lista.*entero ≥ 200 pixels/u],
  ['ast-ES', /anchor de la lista.*enteru.*polo menos 200 píxeles/u],
  ['co', /larghezza di a lista.*numeru interu.*almenu 200 pixel/u],
  ['fur', /largjece de liste.*numar intîr.*almancul 200 pixel/u],
  ['lld', /larghezza dla lista.*numer intríek.*almanco 200 pixel/u],
  ['nap', /larghezza d'a lista.*numero intero.*almeno 200 pixel/u],
  ['rm', /ladezza da la glista.*dumber entir.*almain 200 pixels/u],
  ['rup', /Lãrdzimea ali listã.*numir ãntreg.*minimum 200 pixeli/u],
  ['sc', /largària de sa lista.*nùmeru intreu.*a su mancu 200 pixel/u],
  ['scn', /larghezza dâ lista.*nùmmiru nteru.*almenu 200 pixel/u],
  ['oc', /largor de la tièra.*entièr.*almens 200 pixèls/u],
  ['pap', /ancho di e lista.*entero.*na e ménos 200 píxeles/u],
  ['lb', /Breet vun der Lëscht.*ganz Zuel.*mindestens 200 Pixel/u],
  ['wa', /lårdjeur del djîveye.*nombe etîr.*å moens 200 picsels/u],
  ['ht', /Lajè lis la.*nonb antye.*omwen 200 piksèl/u],
  ['eo', /Listlarĝo.*entjero.*almenaŭ 200 rastrumeroj/u],
  ['la', /Latitudo indicis.*numerus integer.*saltem 200 pixelorum/u],
  ['gv', /lheead y rolley.*slane-earroo ≥ 200 pixellyn/u],
  ['br', /Ledander ar roll.*niver anterin.*200 piksel da nebeutañ/u],
  ['kw', /ledander an rol.*niver kowal ≥ 200 picselow/u],
];
assert.equal(read('en')[key],
  'List width must be a whole number of at least 200 pixels');
for (const [code, terms] of cases) {
  const value = read(code)[key];
  assert.match(value, terms, code);
  assert.doesNotMatch(value, /270|۲۷۰/u, code);
  const rows = ledger.filter(row => row.locale === code && row.key === key);
  assert.equal(rows.length, 1, `${code}: one correction row`);
  assert.match(rows[0].before, /270/u, code);
  assert.equal(rows[0].after, value, code);
}
for (const code of ['an', 'lld', 'nap', 'rm', 'rup', 'pap', 'la', 'gv', 'br', 'kw']) {
  assert.match(ledger.find(row => row.locale === code && row.key === key).reason,
    /low-confidence pending native grammar review/u, code);
}
assert.equal(cases.length, 20);
(async () => {
  const i18n = require('i18next').createInstance();
  await i18n.init({ lng: 'eo', fallbackLng: false,
    resources: { eo: { translation: read('eo') } } });
  assert.equal(i18n.t(key), read('eo')[key]);
  console.log(`${cases.length} Romance/Celtic list-width meanings and runtime pass.`);
})().catch(error => { console.error(error); process.exitCode = 1; });
