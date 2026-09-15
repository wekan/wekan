'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = code => JSON.parse(fs.readFileSync(path.join(root,
  'imports/i18n/data', `${code}.i18n.json`), 'utf8'));
const english = read('en');
const tigre = read('tig');
const tigrinya = read('ti');
const key = 'twoFactorCode-invalid';
assert.equal(english[key], 'Invalid authentication code. Please try again.');
assert.equal(tigre[key],
  'ኮድ መረጋገጺ ቀለጥ ሀለ። ዐይብከ፡ ካልእ ዶል ፈትን።');
assert.notEqual(tigre[key], tigrinya[key], 'Tigrinya seed must be removed');
assert.match(tigre[key], /ኮድ መረጋገጺ/u,
  'authentication-code subject remains');
assert.match(tigre[key], /ቀለጥ ሀለ/u, 'wrong-code verdict remains');
assert.match(tigre[key], /ዐይብከ.*ካልእ ዶል ፈትን/u,
  'attested please/try-again forms remain');
assert.doesNotMatch(tigre[key], /__\w+__|%\d*\$?[sd]/u,
  'source has no runtime placeholder');
const rows = JSON.parse(fs.readFileSync(path.join(root,
  'releases/translations/audited-corrections.json'), 'utf8'))
  .filter(row => row.locale === 'tig' && row.key === key);
assert.equal(rows.length, 1);
assert.equal(rows[0].after, tigre[key]);
assert.equal(rows[0].before, tigrinya[key]);
(async () => {
  const i18n = require('i18next').createInstance();
  await i18n.init({ lng: 'tig', fallbackLng: false,
    resources: { tig: { translation: tigre } } });
  assert.equal(i18n.t(key), tigre[key]);
  console.log('Tigre authentication-code error: source sense, seed and runtime pass.');
})().catch(error => { console.error(error); process.exitCode = 1; });
