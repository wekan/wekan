'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
(async () => {
  const { MIN_LIST_WIDTH, parseListWidthInput } = await import(
    '../models/lib/listWidth.js');
  assert.equal(MIN_LIST_WIDTH, 200);
  for (const [raw, expected] of [
    ['200', 200], ['220', 220], ['1000', 1000], [' 200 ', 200],
    ['199', null], ['200.9', null], ['220px', null],
    ['1e3', null], ['Infinity', null], ['', null],
    ['9007199254740992', null],
  ]) assert.equal(parseListWidthInput(raw), expected, raw);
  assert.equal(parseListWidthInput(200), null,
    'popup parser accepts only the input element string');
  const jade = read('client/components/lists/listHeader.jade');
  const client = read('client/components/lists/listHeader.js');
  assert.ok(jade.includes('min="{{ listWidthMinimum }}" step="1"'),
    'input advertises the shared minimum and whole-pixel step');
  assert.ok(jade.includes("p {{_ 'list-width-error-message'}}"),
    'error popup shows one translated rule without stale numeric suffix');
  assert.doesNotMatch(jade, /min="270"|&gt;=270/u);
  assert.match(client, /listWidthMinimum\(\)\s*\{\s*return MIN_LIST_WIDTH/u);
  assert.match(client,
    /const width = parseListWidthInput\(tpl\.\$\('\.list-width-value'\)\.val\(\)\)/u);
  assert.match(client, /if \(width === null\)/u);
  assert.doesNotMatch(client, /parseInt\(tpl\.\$\('\.list-width-value'/u,
    'decimal input must not be truncated');
  const english = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  const tigre = JSON.parse(read('imports/i18n/data/tig.i18n.json'));
  const tigrinya = JSON.parse(read('imports/i18n/data/ti.i18n.json'));
  const key = 'list-width-error-message';
  assert.equal(english[key],
    'List width must be a whole number of at least 200 pixels');
  assert.match(tigre[key], /ግፍሒ ዝርዝር.*ምሉእ ዕልብ.*≥ 200/u);
  assert.notEqual(tigre[key], tigrinya[key], 'Tigrinya seed removed');
  assert.doesNotMatch(tigre[key], /270/u);
  for (const file of fs.readdirSync(path.join(root, 'imports/i18n/data'))
    .filter(name => /^en[\-_].*\.i18n\.json$/.test(name))) {
    const data = JSON.parse(read(`imports/i18n/data/${file}`));
    assert.equal(data[key], english[key], `${file}: English source parity`);
  }
  const ledger = JSON.parse(read('releases/translations/audited-corrections.json'));
  const row = ledger.filter(record => record.locale === 'tig' && record.key === key);
  assert.equal(row.length, 1);
  assert.equal(row[0].after, tigre[key]);
  console.log('List-width popup: 200px whole-number rule, source and Tigre pass.');
})().catch(error => { console.error(error); process.exitCode = 1; });
