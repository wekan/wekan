'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = code => JSON.parse(fs.readFileSync(path.join(root,
  'imports/i18n/data', `${code}.i18n.json`), 'utf8'));
const key = 'list-width-error-message';
const ledger = JSON.parse(fs.readFileSync(path.join(root,
  'releases/translations/audited-corrections.json'), 'utf8'));
const groups = [
  [['az', 'az-AZ', 'az-LA'], /ən azı 200 piksel.*tam ədəd/u],
  [['ca', 'ca_ES', 'ca@valencia'], /nombre enter.*almenys 200 píxels/u],
  [['uz', 'uz-UZ', 'uz-LA'], /kamida 200 piksel.*butun son/u],
  [['el', 'el-GR'], /ακέραιος αριθμός.*τουλάχιστον 200 pixels/u],
  [['cy', 'cy-GB'], /gyfanrif.*o leiaf 200 picseli/u],
  [['ro', 'ro-RO'], /număr întreg.*cel puțin 200 de pixeli/u],
  [['sl', 'sl_SI'], /celo število.*vsaj 200 slikovnih pik/u],
  [['vi', 'vi-VN'], /số nguyên.*ít nhất 200 pixel/u],
  [['af', 'af_ZA'], /heelgetal.*ten minste 200 pixels/u],
  [['fy', 'fy-NL'], /hiel getal.*op syn minst 200 piksels/u],
  [['gl', 'gl-ES'], /número enteiro.*polo menos 200 píxeles/u],
  [['hi', 'hi-IN'], /कम से कम 200 पिक्सेल.*पूर्णांक/u],
  [['ms', 'ms-MY'], /nombor bulat.*sekurang-kurangnya 200 piksel/u],
  [['bs', 'hr'], /cijeli broj.*najmanje 200 piksela/u],
  [['km', 'km_KH'], /ចំនួនគត់.*យ៉ាងហោចណាស់ 200 ភីកសែល/u],
];
assert.equal(read('en')[key],
  'List width must be a whole number of at least 200 pixels');
let count = 0;
for (const [codes, terms] of groups) {
  const representative = read(codes[0])[key];
  assert.match(representative, terms, codes[0]);
  for (const code of codes) {
    const value = read(code)[key];
    assert.equal(value, representative, `${code}: sibling wording`);
    assert.doesNotMatch(value, /270|۲۷۰/u, code);
    const rows = ledger.filter(row => row.locale === code && row.key === key);
    assert.equal(rows.length, 1, `${code}: one correction row`);
    assert.match(rows[0].before, /270/u, code);
    assert.equal(rows[0].after, value, code);
    count++;
  }
}
assert.equal(count, 33);
assert.equal(read('km-KH')[key], read('km_KH')[key],
  'Khmer picker alias resolves to corrected tracked locale');
(async () => {
  const i18n = require('i18next').createInstance();
  await i18n.init({ lng: 'ca', fallbackLng: false,
    resources: { ca: { translation: read('ca') } } });
  assert.equal(i18n.t(key), read('ca')[key]);
  console.log(`${count} native lower-bound translations and runtime pass.`);
})().catch(error => { console.error(error); process.exitCode = 1; });
