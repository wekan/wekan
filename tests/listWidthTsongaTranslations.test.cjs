'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const key = 'list-width-error-message';
const tsonga = JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/ts.i18n.json'), 'utf8'));
const english = JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/en.i18n.json'), 'utf8'));
const ledger = JSON.parse(fs.readFileSync(path.join(root, 'releases/translations/audited-corrections.json'), 'utf8'));
assert.match(tsonga['set-list-width-value'], /^Vuanami bya nxaxamelo \(pixels\)$/u);
assert.match(tsonga[key], /^Vuanami bya nxaxamelo byi fanele ku va holinamba ≥ 200 pixels$/u);
assert.doesNotMatch(tsonga[key], /270|mhaka mhaka|greater than|integer/u);
for (const name of ['set-list-width-value', key]) {
  const rows = ledger.filter(row => row.locale === 'ts' && row.key === name);
  assert.equal(rows.length, 1, `ts/${name}: one correction record`);
  assert.equal(rows[0].after, tsonga[name]);
  assert.match(rows[0].reason, /low-confidence pending native grammar review/u);
}
assert.match(ledger.find(row => row.locale === 'ts' && row.key === key).before, /270/u);
assert.equal(english[key], 'List width must be a whole number of at least 200 pixels');
(async () => {
  const i18n = require('i18next').createInstance();
  await i18n.init({ lng: 'ts', fallbackLng: false,
    resources: { ts: { translation: tsonga } } });
  assert.equal(i18n.t(key), tsonga[key]);
  console.log('Tsonga list-width label, rule, ledger and runtime pass.');
})().catch(error => { console.error(error); process.exitCode = 1; });
