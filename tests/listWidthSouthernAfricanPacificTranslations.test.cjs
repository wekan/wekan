'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const key = 'list-width-error-message';
const read = code => JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data', `${code}.i18n.json`), 'utf8'));
const ledger = JSON.parse(fs.readFileSync(path.join(root, 'releases/translations/audited-corrections.json'), 'utf8'));
const cases = [
  ['nd', /yinombolo epheleleyo okungenani amaphikseli angu-200/u],
  ['ss', /yinombolo lephelele lokungenani emapikseli langu-200/u],
  ['tn', /palogotlhe ya bonnye dipiksele di le 200/u],
  ['rw', /umubare wuzuye wa nibura 200 pixels/u],
  ['xh', /linani elipheleleyo lee-pixels ezingama-200 ubuncinane/u],
  ['st', /nomoro e felletseng ya bonyane dipiksele tse 200/u],
  ['sm', /numera atoa e lē itiiti ifo i le 200 pixels/u],
  ['yo', /odidi o kere ju 200 piksẹli/u],
  ['mi', /tau tōpū, i te iti rawa 200 pika/u],
];
assert.equal(read('en')[key], 'List width must be a whole number of at least 200 pixels');
for (const [code, phrase] of cases) {
  const value = read(code)[key];
  assert.match(value, phrase, code);
  assert.doesNotMatch(value, /270|۲۷۰/u, code);
  const rows = ledger.filter(row => row.locale === code && row.key === key);
  assert.equal(rows.length, 1, `${code}: one correction record`);
  assert.match(rows[0].before, /270/u, code);
  assert.equal(rows[0].after, value, code);
}
for (const code of ['rw', 'xh', 'yo', 'mi']) {
  assert.match(ledger.find(row => row.locale === code && row.key === key).reason,
    /low-confidence pending native grammar review/u, code);
}
(async () => {
  const i18n = require('i18next').createInstance();
  await i18n.init({ lng: 'sm', fallbackLng: false,
    resources: { sm: { translation: read('sm') } } });
  assert.equal(i18n.t(key), read('sm')[key]);
  console.log(`${cases.length} native list-width rules and Samoan runtime pass.`);
})().catch(error => { console.error(error); process.exitCode = 1; });
