'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const dir = path.join(root, 'imports/i18n/data');
const key = 'list-width-error-message';
const read = code => JSON.parse(fs.readFileSync(path.join(dir, `${code}.i18n.json`), 'utf8'));
const groups = [
  { codes: ['ar', 'ar-DZ', 'ar-EG'], value: 'يجب أن يكون عرض القائمة عدداً صحيحاً لا يقل عن 200 بكسل.', terms: /عدداً صحيحاً.*لا يقل عن 200 بكسل/u },
  { codes: ['he', 'he-IL'], value: 'רוחב הרשימה חייב להיות מספר שלם של לפחות 200 פיקסלים', terms: /מספר שלם.*לפחות 200 פיקסלים/u },
  { codes: ['ru', 'ru-UA', 'ru_RU'], value: 'Ширина списка должна быть целым числом не менее 200 пикселей', terms: /целым числом.*не менее 200 пикселей/u },
  { codes: ['uk', 'uk-UA'], value: 'Ширина списку має бути цілим числом не менше 200 пікселів', terms: /цілим числом.*не менше 200 пікселів/u },
  { codes: ['ja', 'ja-JP', 'ja-HI'], value: 'リストの幅は 200 ピクセル以上の整数でなければなりません。', terms: /200 ピクセル以上の整数/u },
  { codes: ['ko', 'ko-KR'], value: '목록 너비는 200픽셀 이상의 정수여야 합니다.', terms: /200픽셀 이상의 정수/u },
  { codes: ['pl', 'pl-PL'], value: 'Szerokość listy musi być liczbą całkowitą wynoszącą co najmniej 200 pikseli.', terms: /liczbą całkowitą.*co najmniej 200 pikseli/u },
  { codes: ['cs', 'cs-CZ'], value: 'Šířka seznamu musí být celé číslo alespoň 200 pixelů.', terms: /celé číslo.*alespoň 200 pixelů/u },
  { codes: ['nl', 'nl-NL', 'vl-SS'], value: 'De lijstbreedte moet een geheel getal van ten minste 200 pixels zijn.', terms: /geheel getal.*ten minste 200 pixels/u },
];
const ledger = JSON.parse(fs.readFileSync(path.join(root, 'releases/translations/audited-corrections.json'), 'utf8'));
assert.equal(read('en')[key], 'List width must be a whole number of at least 200 pixels');
let count = 0;
for (const group of groups) {
  for (const code of group.codes) {
    const value = read(code)[key];
    assert.equal(value, group.value, code);
    assert.match(value, group.terms, code);
    assert.doesNotMatch(value, /270|２７０|۲۷۰/u, code);
    const rows = ledger.filter(row => row.locale === code && row.key === key);
    assert.equal(rows.length, 1, `${code}: exactly one correction record`);
    assert.equal(rows[0].after, value, code);
    assert.match(rows[0].before, /270/u, code);
    count++;
  }
}
assert.equal(read('ru-RU')[key], read('ru_RU')[key], 'Russian alias resolves to tracked file');
assert.equal(count, 22);
(async () => {
  const i18n = require('i18next').createInstance();
  await i18n.init({ lng: 'ru', fallbackLng: false,
    resources: { ru: { translation: read('ru') } } });
  assert.equal(i18n.t(key), groups[2].value);
  console.log(`${count} multilingual list-width rules and runtime pass.`);
})().catch(error => { console.error(error); process.exitCode = 1; });
