'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = code => JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data', `${code}.i18n.json`), 'utf8'));
const ledger = JSON.parse(fs.readFileSync(path.join(root, 'releases/translations/audited-corrections.json'), 'utf8'));
const key = 'list-width-error-message';
const cases = [
  ['chr', /ᏗᎪᏪᎵ ᎾᏯᏍᏗ: ᎢᎦᎢ ᎬᏩᏃᏍᏓ ≥ 200 pixels ᎨᏎᏍᏗ/u],
  ['wal', /Mazgabaa aaho qoodaa ≥ 200 pixels koshshiyo/u],
];
for (const [code, phrase] of cases) {
  const value = read(code)[key];
  assert.match(value, phrase, code);
  assert.doesNotMatch(value, /270|greater than|integer|width must|ᎤᏟ 200/u, code);
  const rows = ledger.filter(row => row.locale === code && row.key === key);
  assert.equal(rows.length, 1, `${code}: one rule correction`);
  assert.match(rows[0].before, /270/u);
  assert.equal(rows[0].after, value);
  assert.match(rows[0].reason, /low-confidence pending native grammar review/u);
}
const wolaytta = read('wal');
assert.equal(wolaytta['set-list-width-value'], 'Mazgabaa aaho (pixels)');
const labelRows = ledger.filter(row => row.locale === 'wal' && row.key === 'set-list-width-value');
assert.equal(labelRows.length, 1);
assert.equal(labelRows[0].after, wolaytta['set-list-width-value']);
assert.match(labelRows[0].reason, /low-confidence pending native grammar review/u);
assert.equal(read('en')[key], 'List width must be a whole number of at least 200 pixels');
(async () => {
  const i18n = require('i18next').createInstance();
  const cherokee = read('chr');
  await i18n.init({ lng: 'chr', fallbackLng: false,
    resources: { chr: { translation: cherokee } } });
  assert.equal(i18n.t(key), cherokee[key]);
  console.log('Cherokee and Wolaytta list-width rules and runtime pass.');
})().catch(error => { console.error(error); process.exitCode = 1; });
