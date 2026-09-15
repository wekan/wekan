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
  ['da', /heltal.*mindst 200 pixels/u],
  ['et-EE', /täisarv.*vähemalt 200 pikslit/u],
  ['eu', /gutxienez 200 pixeleko zenbaki osoa/u],
  ['fi', /kokonaisluku.*vähintään 200 pikseliä/u],
  ['fo', /heilt tal.*í minsta lagi 200 myndpunkt/u],
  ['ga', /shlánuimhir.*200 picteilín ar a laghad/u],
  ['gd', /shlàn-àireamh.*co-dhiù 200 piogsailean/u],
  ['hu', /legalább 200 pixeles egész szám/u],
  ['id', /bilangan bulat.*setidaknya 200 piksel/u],
  ['is', /heil tala.*að minnsta kosti 200 dílar/u],
  ['ka', /მთელი რიცხვი.*მინიმუმ 200 პიქსელი/u],
  ['kk', /кемінде 200 пиксель.*бүтін сан/u],
  ['ky', /кеминде 200 пиксел.*бүтүн сан/u],
  ['lt', /sveikasis skaičius.*bent 200 pikselių/u],
  ['lv', /veselam skaitlim.*vismaz 200 pikseļiem/u],
  ['mn', /дор хаяж 200 пикселийн бүхэл тоо/u],
  ['nb', /heltall.*minst 200 piksler/u],
  ['sk', /celé číslo.*aspoň 200 pixelov/u],
  ['sv', /heltal.*minst 200 pixlar/u],
  ['tr', /en az 200 piksel.*tam sayı/u],
  ['sq', /numër i plotë.*të paktën 200 pikselësh/u],
  ['bg', /цяло число.*поне 200 пиксела/u],
  ['be', /цэлым лікам.*не менш за 200 пікселяў/u],
  ['hy', /ամբողջ թիվ.*առնվազն 200 պիքսել/u],
  ['mk', /цел број.*најмалку 200 пиксели/u],
  ['se', /ollislohku.*unnimusat 200 pikseala/u],
  ['tg', /адади бутуни.*на камтар аз 200 пиксел/u],
  ['mt', /wisa' tal-lista.*numru sħiħ.*mill-inqas 200 pixel/u],
];
assert.equal(read('en')[key],
  'List width must be a whole number of at least 200 pixels');
for (const [code, lowerBoundAndInteger] of cases) {
  const value = read(code)[key];
  assert.match(value, lowerBoundAndInteger, code);
  assert.doesNotMatch(value, /270|۲۷۰/u, code);
  const rows = ledger.filter(row => row.locale === code && row.key === key);
  assert.equal(rows.length, 1, `${code}: one correction`);
  assert.match(rows[0].before, /270/u, code);
  assert.equal(rows[0].after, value, code);
}
for (const code of ['mt', 'se', 'ka', 'lv']) {
  assert.match(ledger.find(row => row.locale === code && row.key === key).reason,
    /low-confidence pending native grammar review/u, code);
}
assert.equal(cases.length, 28);
(async () => {
  const i18n = require('i18next').createInstance();
  await i18n.init({ lng: 'mt', fallbackLng: false,
    resources: { mt: { translation: read('mt') } } });
  assert.equal(i18n.t(key), read('mt')[key]);
  console.log(`${cases.length} Eurasian list-width rules and Maltese runtime pass.`);
})().catch(error => { console.error(error); process.exitCode = 1; });
