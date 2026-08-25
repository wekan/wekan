'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const list = fs.readFileSync(
  path.join(root, 'client', 'components', 'lists', 'listBody.jade'),
  'utf8',
);
const card = fs.readFileSync(
  path.join(root, 'client', 'components', 'cards', 'cardDetails.jade'),
  'utf8',
);
const listCss = fs.readFileSync(
  path.join(root, 'client', 'components', 'lists', 'list.css'),
  'utf8',
);
const cardCss = fs.readFileSync(
  path.join(root, 'client', 'components', 'cards', 'cardDetails.css'),
  'utf8',
);
const browser = fs.readFileSync(
  path.join(root, 'tests', 'playwright', 'specs', '47-speech-scroll.e2e.js'),
  'utf8',
);

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

test('#2499 each list scroll container is a named focusable region', () => {
  assert.match(
    list,
    /\.list-body\([\s\S]*?role="region" tabindex="0" aria-label="\{\{_ 'list'\}\}: \{\{title\}\}"\)/,
  );
  assert.match(listCss, /\.list-body\s*\{[\s\S]*?overflow-y:\s*scroll/);
});

test('#2499 card details is a named focusable scroll region', () => {
  assert.match(
    card,
    /section\.card-details\.js-card-details[\s\S]*?role="region" tabindex="0" aria-label="\{\{_ 'card'\}\}: \{\{title\}\}"\)/,
  );
  assert.match(cardCss, /\.card-details\s*\{[\s\S]*?overflow-y:\s*auto/);
});

test('negative: focusability is on the actual overflow elements', () => {
  assert.doesNotMatch(list, /\.minicards[^\n]*tabindex=/);
  assert.doesNotMatch(card, /\.card-details-canvas[^\n]*tabindex=/);
});

test('browser regression scrolls both focused regions by keyboard', () => {
  assert.match(browser, /listBody\.focus\(\)/);
  assert.match(browser, /keyboard\.press\('PageDown'\)/);
  assert.match(browser, /cardDetails\.focus\(\)/);
  assert.match(browser, /scrollTop/);
});

console.log(`\nspeechScrollableRegions: all ${passed} tests passed`);
