'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const locale = code =>
  JSON.parse(
    fs.readFileSync(
      path.join(root, 'imports/i18n/data', code + '.i18n.json'),
      'utf8',
    ),
  );
const english = locale('en');
const tigre = locale('tig');
let editContexts = 0;
let templateContexts = 0;

for (const [key, value] of Object.entries(tigre)) {
  if (/\bedit(?:ing)?\b/i.test(english[key])) {
    assert.doesNotMatch(value, /ኣርም/, key + ': copied Tigrinya Edit component');
    if (value.includes('አስነ')) editContexts += 1;
  }
  if (/\btemplates?\b/i.test(english[key])) {
    assert.doesNotMatch(
      value,
      /ኣብነት/,
      key + ': copied Tigrinya Template component',
    );
    if (/ሞደል|ሞደላት/.test(value)) templateContexts += 1;
  }
}
assert.equal(tigre.edit, 'አስነ');
assert.equal(tigre.template, 'ሞደል');
assert.ok(editContexts >= 18, 'expected repeated Edit contexts');
assert.ok(templateContexts >= 20, 'expected singular and plural Template contexts');
assert.match(tigre['bucket-example'], /ንኣብነት/);
console.log(
  'Tigre Edit contexts: ' +
    editContexts +
    '; Template contexts: ' +
    templateContexts,
);
