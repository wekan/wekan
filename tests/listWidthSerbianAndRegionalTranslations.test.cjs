'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const key = 'list-width-error-message';
const read = code => JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data', `${code}.i18n.json`), 'utf8'));
const ledger = JSON.parse(fs.readFileSync(path.join(root, 'releases/translations/audited-corrections.json'), 'utf8'));
const serbianKeys = ['setListWidthPopup-title', 'set-list-width', 'set-list-width-value',
  key, 'list-width-shared-note', 'list-width-personal-note',
  'personal-list-width', 'personal-list-width-description', 'fixed-list-width',
  'click-to-enable-fixed-list-width', 'click-to-disable-fixed-list-width',
  'fixed-list-width-note', 'listWidthErrorPopup-title'];
const serbian = read('sr');
assert.match(serbian[key], /Ширина листе мора бити цео број од најмање 200 пиксела/u);
assert.equal(serbian['setListWidthPopup-title'], 'Подеси ширину листе');
assert.equal(serbian['set-list-width'], 'Подеси ширину листе');
assert.match(serbian['list-width-shared-note'], /све кориснике ове табле/u);
assert.match(serbian['list-width-personal-note'], /само за вас/u);
assert.match(serbian['personal-list-width-description'], /Када је укључено.*Када је искључено/u);
assert.match(serbian['fixed-list-width-note'], /промена ширине једне листе мења све/u);
for (const name of serbianKeys) {
  assert.doesNotMatch(serbian[name], /захват|дела тока|поступка|списа|270/u, name);
  const matches = ledger.filter(row => row.locale === 'sr' && row.key === name);
  assert.equal(matches.length, 1, `sr/${name}: one correction record`);
  assert.equal(matches[0].after, serbian[name], `sr/${name}: final ledger value`);
}
const cases = [
  ['ve-CC', /intiero de almanco 200 pixel/u],
  ['ve-PP', /kogonaine luk, vähemba 200 piksel'ad/u],
  ['ak', /nɔma a ɛyɛ mu, anyɛ yie koraa no 200 piksel/u],
  ['to', /mataʻi fika ≥ 200 pikiseli/u],
];
for (const [code, phrase] of cases) {
  const value = read(code)[key];
  assert.match(value, phrase, code);
  assert.doesNotMatch(value, /270|greater than|integer/u, code);
  const rows = ledger.filter(row => row.locale === code && row.key === key);
  assert.equal(rows.length, 1, `${code}: one correction record`);
  assert.match(rows[0].before, /270/u, code);
  assert.equal(rows[0].after, value, code);
  assert.match(rows[0].reason, /low-confidence pending native grammar review/u, code);
}
assert.equal(read('en')[key], 'List width must be a whole number of at least 200 pixels');
(async () => {
  const i18n = require('i18next').createInstance();
  await i18n.init({ lng: 'sr', fallbackLng: false,
    resources: { sr: { translation: serbian } } });
  assert.equal(i18n.t(key), serbian[key]);
  console.log('Serbian list-width controls, four native locale rules and runtime pass.');
})().catch(error => { console.error(error); process.exitCode = 1; });
