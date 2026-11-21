'use strict';

// #5910: free-text search, global and board-level (board:) alike, also finds a
// card by the text of its comments. Both run through the same text selector in
// server/publications/cards.js, which this test reads.
//
// It used to be tested through server/lib/cardMatch.js, a cardMatchesQuery()
// helper that nothing in the app called: the search is a Mongo selector, not
// that function, so the test passed whatever the selector did.
//
// Run: node tests/boardSearchComments.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'server/publications/cards.js'), 'utf8');
let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const start = src.indexOf('#5910: free-text search must match text inside card comments');
const selector = src.slice(start, src.indexOf('];', start));

test('the text search looks the words up in comments, with the same regex', () => {
  assert.ok(start > -1, 'the free-text search block exists');
  assert.match(selector, /getCardComments\(\s*\{\s*text: regex\s*\}/);
});

test('a card whose comment matches is one of the alternatives, beside title and description', () => {
  assert.match(selector, /let cardsSelector = \[/);
  assert.match(selector, /\{ title: regex \}/);
  assert.match(selector, /\{ description: regex \}/);
  assert.match(selector, /\{ _id: \{ \$in: comments\.map\(com => com\.cardId\) \} \}/);
});

test('negative: the helper the search never called is not back', () => {
  assert.ok(!fs.existsSync(path.join(ROOT, 'server/lib/cardMatch.js')));
  assert.doesNotMatch(src, /cardMatchesQuery/);
});

console.log(`\nboardSearchComments: ${passed} tests passed`);
