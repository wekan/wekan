'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = code =>
  JSON.parse(
    fs.readFileSync(
      path.join(root, 'imports/i18n/data', code + '.i18n.json'),
      'utf8',
    ),
  );
const english = read('en');
const tigre = read('tig');
let boardContexts = 0;
let cardContexts = 0;
for (const [key, value] of Object.entries(tigre)) {
  if (/\bboards?\b/i.test(english[key])) {
    assert.doesNotMatch(value, /ሰሌዳ/, key + ': Tigrinya Board noun');
    boardContexts += 1;
  }
  if (/\bcards?\b/i.test(english[key])) {
    assert.doesNotMatch(
      value,
      /(?<!ወረቀት )ካርድ/u,
      key + ': bare Tigrinya Card noun',
    );
    assert.doesNotMatch(
      value,
      /ወረቀት ወረቀት/u,
      key + ': duplicated Tigre Card prefix',
    );
    cardContexts += 1;
  }
}
assert.match(tigre.clipboard, /ሰሌዳ/);
assert.match(tigre['copy-link-to-clipboard'], /ሰሌዳ/);
assert.equal(tigre.board, 'ምዱድ');
assert.equal(tigre.card, 'ወረቀት ካርድ');
console.log(
  'Tigre Board contexts: ' +
    boardContexts +
    '; Card contexts: ' +
    cardContexts,
);
