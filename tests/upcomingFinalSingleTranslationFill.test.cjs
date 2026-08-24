'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const read = code => JSON.parse(fs.readFileSync(path.join(ROOT,
  'imports/i18n/data', `${code}.i18n.json`), 'utf8'));
assert.strictEqual(read('fi')['color-magenta'], 'purppuranpunainen');
for (const language of ['hi-IN', 'hi']) {
  const value = read(language)['copy-link-to-clipboard'];
  assert.match(value, /[\u0900-\u097f]/u);
  assert.notStrictEqual(value, 'Copy link to clipboard');
}
for (const language of ['uk-UA', 'uk']) {
  assert.strictEqual(read(language).email, 'Електронна пошта');
}
console.log('upcomingFinalSingleTranslationFill: 5 tests passed');
