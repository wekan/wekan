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
const keys = [
  'import-trello-json-file-hint', 'trello-api-import',
  'trello-api-import-desc', 'trello-api-key', 'trello-api-token',
  'trello-api-credentials-required', 'trello-api-credentials-saved',
];
const ledger = JSON.parse(fs.readFileSync(path.join(root,
  'releases/translations/audited-corrections.json'), 'utf8'));
for (const key of keys) {
  assert.match(tigre[key], /መፍቲሕ/u, `${key}: Tigre key noun`);
  assert.doesNotMatch(tigre[key], /መፍትሕ/u,
    `${key}: earlier Tigrinya-like key spelling`);
  assert.match(tigre[key], /Trello|token/u, `${key}: Trello/token context`);
  const rows = ledger.filter(row => row.locale === 'tig' && row.key === key);
  assert.equal(rows.length, 1, `${key}: consolidated correction`);
  assert.equal(rows[0].after, tigre[key]);
  assert.notEqual(rows[0].before, rows[0].after);
}
assert.equal(english['trello-api-credentials-required'],
  'Please enter both the Trello API key and token.');
assert.equal(tigre['trello-api-credentials-required'],
  'ዐይብከ፡ መፍቲሕ Trello API ወ token ክልኢቶም ኣተ።');
assert.notEqual(tigre['trello-api-credentials-required'],
  tigrinya['trello-api-credentials-required']);
assert.match(tigre['trello-api-credentials-required'],
  /ዐይብከ.*መፍቲሕ Trello API ወ token.*ክልኢቶም ኣተ/u,
  'please, key and token, both and enter all remain');
assert.match(tigre['trello-api-key'], /https:\/\/trello\.com\/app-key/u);
assert.match(tigre['import-trello-json-file-hint'], /\.json/u);
const jade = fs.readFileSync(path.join(root,
  'client/components/import/import.jade'), 'utf8');
const js = fs.readFileSync(path.join(root,
  'client/components/import/import.js'), 'utf8');
assert.ok(jade.includes("label(for='trello-api-key') {{_ 'trello-api-key'}}"));
assert.ok(jade.includes("label(for='trello-api-token') {{_ 'trello-api-token'}}"));
assert.match(js, /tpl\.error\.set\('trello-api-credentials-required'\)/,
  'missing-credentials validation selects this message');
(async () => {
  const i18n = require('i18next').createInstance();
  await i18n.init({ lng: 'tig', fallbackLng: false,
    resources: { tig: { translation: tigre } } });
  assert.equal(i18n.t('trello-api-credentials-required'),
    tigre['trello-api-credentials-required']);
  console.log('Tigre Trello key terminology: 7 contexts, prompt and runtime pass.');
})().catch(error => { console.error(error); process.exitCode = 1; });
