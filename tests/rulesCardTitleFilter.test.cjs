'use strict';

// Plain-Node unit test (no Meteor) for the board-rule card-title filter.
// Run: ELECTRON_RUN_AS_NODE=1 <node> tests/rulesCardTitleFilter.test.cjs
//
// Regression guard for #2345 ("basic card title filter rules issue"):
//   - Setting a "Card Title Filter" on a rule trigger did not show up in the
//     created rule's description, and for the generic "when a card is moved"
//     and archive/unarchive triggers the filter was never stored at all.
//   - Those triggers stored NO cardTitle field, and the server matches
//     triggers with `cardTitle: { $in: [...] }` — a document lacking the field
//     never satisfies that query, so such rules never fired.
//   - A stored filter must be enforced: the rule fires only for cards whose
//     title matches; an empty filter (stored as '*') keeps matching every card.

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const {
  cardTitleFilterOrWildcard,
  cardTitleMatchList,
  cardTitleFilterMatches,
  appendCardTitleFilterToDesc,
} = require('../models/lib/ruleCardTitleFilter');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// --- filter stored -----------------------------------------------------------

test('a typed filter is stored as-is (trimmed)', () => {
  assert.strictEqual(cardTitleFilterOrWildcard('Part A'), 'Part A');
  assert.strictEqual(cardTitleFilterOrWildcard('  Part A  '), 'Part A');
});

test('an empty/unset filter is stored as the "*" wildcard (per the UI note)', () => {
  assert.strictEqual(cardTitleFilterOrWildcard(''), '*');
  assert.strictEqual(cardTitleFilterOrWildcard('   '), '*');
  assert.strictEqual(cardTitleFilterOrWildcard(undefined), '*');
  assert.strictEqual(cardTitleFilterOrWildcard(null), '*');
});

test('every board trigger doc built by the wizard now carries a cardTitle field', () => {
  // #2345 root cause 1: the generic moved / archive triggers stored no
  // cardTitle, so `cardTitle: { $in: [...] }` could never match them.
  const src = fs.readFileSync(
    path.join(__dirname, '..', 'client', 'components', 'rules', 'triggers', 'boardTriggers.js'),
    'utf8',
  );
  const triggerDocs = src.match(/triggerVar\.set\(\{[\s\S]*?\}\)/g) || [];
  assert.ok(triggerDocs.length >= 6, `expected >= 6 triggerVar.set blocks, got ${triggerDocs.length}`);
  for (const doc of triggerDocs) {
    assert.ok(
      /\bcardTitle\b/.test(doc),
      `a trigger doc is missing cardTitle:\n${doc}`,
    );
  }
  // The stored value goes through the wildcard normalizer.
  assert.ok(src.includes('cardTitleFilterOrWildcard'), 'wizard must normalize the filter');
});

test('the trigger description shows the filter (rule details feedback)', () => {
  // #2345 root cause 2: "it does not show Part A" in the rule details.
  const desc = appendCardTitleFilterToDesc(
    'when a card is moved to list x',
    'Part A',
    'card title filter',
  );
  assert.ok(desc.includes('Part A'), `desc must mention the filter: ${desc}`);
  assert.ok(desc.startsWith('when a card is moved to list x'), 'original desc kept');
});

test('NEGATIVE: a wildcard/empty filter leaves the description untouched', () => {
  assert.strictEqual(
    appendCardTitleFilterToDesc('when a card is moved', '*'),
    'when a card is moved',
  );
  assert.strictEqual(appendCardTitleFilterToDesc('d', ''), 'd');
  assert.strictEqual(appendCardTitleFilterToDesc('d', undefined), 'd');
});

// --- filter enforced (matching) ----------------------------------------------

test('a trigger with filter "Part A" fires for a card titled "Part A"', () => {
  assert.strictEqual(cardTitleFilterMatches('Part A', 'Part A'), true);
  assert.ok(cardTitleMatchList('Part A').includes('Part A'));
});

test('a single-word filter matches any card whose title contains that word', () => {
  // Historic matching semantics: the activity title is split on non-word chars.
  assert.strictEqual(cardTitleFilterMatches('Part555', 'Part555'), true);
  assert.strictEqual(cardTitleFilterMatches('Part', 'Part A555'), true);
});

test('NEGATIVE: a non-matching title does not fire the rule', () => {
  assert.strictEqual(cardTitleFilterMatches('Part A', 'Part B555'), false);
  assert.strictEqual(cardTitleFilterMatches('Part A', 'Something else'), false);
  assert.strictEqual(cardTitleFilterMatches('Part555', 'Card'), false);
  assert.ok(!cardTitleMatchList('Other card').includes('Part A'));
});

test('empty filter (stored as "*") matches every card', () => {
  assert.strictEqual(cardTitleFilterMatches('*', 'Part A'), true);
  assert.strictEqual(cardTitleFilterMatches('*', 'anything at all'), true);
  assert.ok(cardTitleMatchList('whatever').includes('*'));
});

test('legacy triggers saved without a cardTitle field keep matching every card', () => {
  // The $in list must contain null: in MongoDB `$in: [null, ...]` also matches
  // documents lacking the field, so pre-fix "when a card is moved" rules
  // (which stored no cardTitle) fire again instead of never firing.
  assert.ok(cardTitleMatchList('Part A').includes(null));
  assert.ok(cardTitleMatchList(undefined).includes(null));
  assert.strictEqual(cardTitleFilterMatches(null, 'Part A'), true);
  assert.strictEqual(cardTitleFilterMatches(undefined, 'Part A'), true);
});

test('an activity without a resolvable card title only fires wildcard/legacy triggers', () => {
  const list = cardTitleMatchList(undefined);
  assert.deepStrictEqual(list, ['*', null]);
  assert.strictEqual(cardTitleFilterMatches('Part A', undefined), false);
});

test('server matching uses the shared helper for the cardTitle field', () => {
  const src = fs.readFileSync(
    path.join(__dirname, '..', 'server', 'rulesHelper.js'),
    'utf8',
  );
  assert.ok(
    src.includes("from '/models/lib/ruleCardTitleFilter'"),
    'rulesHelper must import the shared filter helper',
  );
  assert.ok(
    src.includes('cardTitleMatchList(value)'),
    'rulesHelper must build the cardTitle $in list with cardTitleMatchList',
  );
});

console.log(`\n${passed} tests passed`);
