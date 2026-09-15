'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const key = 'list-width-error-message';
const read = code => JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data', `${code}.i18n.json`), 'utf8'));
const ledger = JSON.parse(fs.readFileSync(path.join(root, 'releases/translations/audited-corrections.json'), 'utf8'));
const cases = [
  ['haw', /Ka laulā o ka papa inoa.*helu piha ≥ 200 pixels/u],
  ['tlh', /tetlh 'ab: mI' naQ \(≥ 200 pixel\) poQlu'/u],
  ['iu', /ᑎᑎᖅᑲᓕᐊᑉ ᓴᓂᒧᑦ ᐊᖏᓂᖓ.*ᑭᓯᑦᓯᐅᑎᐅᔭᕆᐊᓕᒃ ≥ 200 pixels/u],
];
for (const [code, phrase] of cases) {
  const value = read(code)[key];
  assert.match(value, phrase, code);
  assert.doesNotMatch(value, /270|greater than|integer|nIvbogh 200|ᐊᖏᓂᖅᓴᐅᔪᒥᒃ 200/u, code);
  const rows = ledger.filter(row => row.locale === code && row.key === key);
  assert.equal(rows.length, 1, `${code}: one correction record`);
  assert.match(rows[0].before, /270/u, code);
  assert.equal(rows[0].after, value, code);
  assert.match(rows[0].reason, /low-confidence pending native grammar review/u, code);
}
assert.equal(read('en')[key], 'List width must be a whole number of at least 200 pixels');
(async () => {
  const i18n = require('i18next').createInstance();
  const hawaiian = read('haw');
  await i18n.init({ lng: 'haw', fallbackLng: false,
    resources: { haw: { translation: hawaiian } } });
  assert.equal(i18n.t(key), hawaiian[key]);
  console.log('Hawaiian, Klingon and Inuktitut list-width rules and runtime pass.');
})().catch(error => { console.error(error); process.exitCode = 1; });
