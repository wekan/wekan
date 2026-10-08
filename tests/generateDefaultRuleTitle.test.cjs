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

// #4294 point 1: "give a Rule a default name and ALLOW RENAMING IT". The
// Add Rule form lets the title be empty, and rules.createRule names the rule
// after what it does instead of storing the literal 'Rule'.
test('Add Rule takes an empty title, and createRule names the rule after its trigger and action', () => {
  const fs = require('fs');
  const path = require('path');
  const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
  const main = read('client/components/rules/rulesMain.js');
  const add = main.slice(main.indexOf("'click .js-goto-trigger'"), main.indexOf("'click .js-edit-rule-full"));
  assert.ok(!/return;/.test(add), 'an empty title no longer stops the wizard');
  assert.ok(!/js-rule-title-error/.test(read('client/components/rules/rulesList.jade')), 'the old error line is gone');
  const server = read('server/rulesButton.js');
  assert.match(server, /const ruleTitle = \(title \|\| ''\)\.trim\(\) \|\| generateDefaultRuleTitle\(trigger && trigger\.desc, actionDoc\.desc\);\s*const ruleDoc = \{\s*title: ruleTitle,/);
  assert.ok(!/title: title \|\| 'Rule'/.test(server), 'not the literal "Rule"');
  // Renaming in place is the rules list's inline editor.
  assert.match(read('client/components/rules/rulesList.jade'), /textarea\.js-edit-rule-input/);
});

console.log(`generateDefaultRuleTitle: ${passed} passed`);
