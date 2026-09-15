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
const key = 'preview-pdf-not-supported';
assert.equal(english[key],
  'Your device does not support previewing PDF. Try downloading instead.');
assert.equal(tigre[key],
  'ርእየት-ሰልፍ PDF እት ጀሃዝከ ኢልትረከብ። በደል PDF እግል ጸዐን ፈትን።');
assert.notEqual(tigre[key], tigrinya[key], 'Tigrinya seed removed');
assert.match(tigre[key], /ርእየት-ሰልፍ PDF.*ጀሃዝከ.*ኢልትረከብ/u,
  'preview is unavailable on the device');
assert.match(tigre[key], /በደል PDF.*ጸዐን ፈትን/u,
  'alternative download attempt remains');
assert.equal((tigre[key].match(/PDF/g) || []).length, 2,
  'literal format appears in both warning and action');
const jade = fs.readFileSync(path.join(root,
  'client/components/cards/attachments.jade'), 'utf8');
assert.match(jade, /pdf-preview-error \{\{_ 'preview-pdf-not-supported' \}\}/,
  'PDF attachment fallback displays this translation');
const rows = JSON.parse(fs.readFileSync(path.join(root,
  'releases/translations/audited-corrections.json'), 'utf8'))
  .filter(row => row.locale === 'tig' && row.key === key);
assert.equal(rows.length, 1);
assert.equal(rows[0].before, tigrinya[key]);
assert.equal(rows[0].after, tigre[key]);
(async () => {
  const i18n = require('i18next').createInstance();
  await i18n.init({ lng: 'tig', fallbackLng: false,
    resources: { tig: { translation: tigre } } });
  assert.equal(i18n.t(key), tigre[key]);
  console.log('Tigre PDF preview warning: meaning, fallback, seed and runtime pass.');
})().catch(error => { console.error(error); process.exitCode = 1; });
