'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = code => JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data', `${code}.i18n.json`), 'utf8'));
const ledger = JSON.parse(fs.readFileSync(path.join(root, 'releases/translations/audited-corrections.json'), 'utf8'));
const cases = [
  ['ay', /Suti siqina irwaqapa/u, /pachpa jakhu ≥ 200 pixels wakisiwa/u],
  ['qu', /Listapa patan/u, /hunt'a yupay ≥ 200 pixels kanan/u],
];
for (const [code, label, rule] of cases) {
  const data = read(code);
  assert.match(data['set-list-width-value'], label, code);
  assert.match(data['list-width-error-message'], label, code);
  assert.match(data['list-width-error-message'], rule, code);
  for (const key of ['set-list-width-value', 'list-width-error-message']) {
    assert.doesNotMatch(data[key], /270|greater than|must be|integer|widthta|lista ancho/u, `${code}/${key}`);
    const rows = ledger.filter(row => row.locale === code && row.key === key);
    assert.equal(rows.length, 1, `${code}/${key}: one correction record`);
    assert.equal(rows[0].after, data[key], `${code}/${key}: final ledger value`);
    assert.match(rows[0].reason, /low-confidence pending native grammar review/u, `${code}/${key}`);
  }
  assert.match(ledger.find(row => row.locale === code && row.key === 'list-width-error-message').before, /270/u);
}
assert.equal(read('en')['list-width-error-message'], 'List width must be a whole number of at least 200 pixels');
(async () => {
  const i18n = require('i18next').createInstance();
  const aymara = read('ay');
  await i18n.init({ lng: 'ay', fallbackLng: false,
    resources: { ay: { translation: aymara } } });
  assert.equal(i18n.t('list-width-error-message'), aymara['list-width-error-message']);
  console.log('Aymara and Quechua width labels, bounds and runtime pass.');
})().catch(error => { console.error(error); process.exitCode = 1; });
