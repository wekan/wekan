'use strict';

// Plain-Node unit test (no Meteor) for the default rule-title generator.
// Run: node tests/generateDefaultRuleTitle.test.cjs
//
// #4294: rules had no default title and an empty one silently failed to
// create the rule. Once a trigger and an action are chosen, generate a
// sensible title from their existing human-readable descriptions (the same
// description strings the "View rule" page already shows, see
// models/triggers.js / models/actions.js `description()`), so a rule is
// never left unnamed even if the user does not type a title.

const assert = require('assert');
const {
  generateDefaultRuleTitle,
} = require('../models/lib/generateDefaultRuleTitle');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

test('trigger + action both present composes "When ..., then ..."', () => {
  const title = generateDefaultRuleTitle(
    'a card is added to list "Doing"',
    'set due date',
  );
  assert.strictEqual(
    title,
    'When a card is added to list "Doing", then set due date',
  );
});

test('only a trigger description composes "When ..."', () => {
  assert.strictEqual(
    generateDefaultRuleTitle('a card is moved to list "Done"', ''),
    'When a card is moved to list "Done"',
  );
});

test('only an action description composes "Then ..."', () => {
  assert.strictEqual(
    generateDefaultRuleTitle(undefined, 'archive the card'),
    'Then archive the card',
  );
});

test('neither description present falls back to "Rule"', () => {
  assert.strictEqual(generateDefaultRuleTitle('', ''), 'Rule');
  assert.strictEqual(generateDefaultRuleTitle(null, undefined), 'Rule');
});

test('leading whitespace/case is normalized without mangling the rest', () => {
  assert.strictEqual(
    generateDefaultRuleTitle('  A Card Is Created  ', '  Send Email  '),
    'When a Card Is Created, then send Email',
  );
});

test('a single-character description is lowercased safely', () => {
  assert.strictEqual(generateDefaultRuleTitle('X', 'Y'), 'When x, then y');
});

console.log(`generateDefaultRuleTitle: ${passed} passed`);
