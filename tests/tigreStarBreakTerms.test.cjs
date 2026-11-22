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
let contexts = 0;
for (const [key, value] of Object.entries(tigre)) {
  if (!/\b(?:unstar|star|starred|starring|stars)\b/i.test(
    english[key] || '')) continue;
  assert.doesNotMatch(value, /ኮኾብ|ኮኾባ/u, `${key}: Tigrinya Star spelling`);
  if (key !== 'starred-pages') {
    assert.match(value, /ኮከብ|ከዋክብ/u,
      `${key}: corpus-attested Tigre Star`);
    contexts += 1;
  }
}
// Every English Star string has its Tigre one checked. This was a fixed 20
// until the help button's texts (2026-11-22) added five more that mention
// Star; counting them from English keeps the guard exact without a number
// that every new string has to edit.
const expected = Object.keys(english).filter(key => key !== 'starred-pages'
  && key in tigre && /\b(?:unstar|star|starred|starring|stars)\b/i.test(english[key])).length;
assert.ok(expected >= 20, 'the Star strings it was written for are still there');
assert.equal(contexts, expected);
assert.equal(tigre['board-nb-stars'], '%s ከዋክብ');
assert.equal(english['pomodoro-break'], 'Break');
assert.equal(tigre['pomodoro-break'], 'ዕርፍቲ');
assert.notEqual(tigre['pomodoro-break'], tigrinya['pomodoro-break']);
console.log('Tigre Star contexts:', contexts, '; Pomodoro Break repaired');
