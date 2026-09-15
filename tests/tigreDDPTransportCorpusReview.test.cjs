'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = code => JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data', `${code}.i18n.json`), 'utf8'));
const tigre = read('tig');
const tigrinya = read('ti');
const english = read('en');
const key = 'DDP_transport';
const value = 'መዋሰላት DDP (DDP_TRANSPORT)';
assert.equal(english[key], 'DDP transport (DDP_TRANSPORT)');
assert.equal(tigre[key], value);
assert.notEqual(tigre[key], tigrinya[key], 'transport noun is no longer a Tigrinya copy');
assert.equal(tigrinya[key], 'መጓዓዝያ DDP (DDP_TRANSPORT)');
assert.match(tigre[key], /DDP \(DDP_TRANSPORT\)$/u);
const ledger = JSON.parse(fs.readFileSync(path.join(root, 'releases/translations/audited-corrections.json'), 'utf8'));
const rows = ledger.filter(row => row.locale === 'tig' && row.key === key);
assert.equal(rows.length, 1);
assert.equal(rows[0].before, tigrinya[key]);
assert.equal(rows[0].after, value);
assert.match(rows[0].reason, /low-confidence pending native grammar review/u);
(async () => {
  const i18n = require('i18next').createInstance();
  await i18n.init({ lng: 'tig', fallbackLng: false,
    resources: { tig: { translation: tigre } } });
  assert.equal(i18n.t(key), value);
  console.log('Tigre DDP transport term, technical identifier and runtime pass.');
})().catch(error => { console.error(error); process.exitCode = 1; });
