'use strict';

// Plain-Node unit test (no Meteor) for the rule-action swimlane/list resolver.
// Run: node tests/ruleActionResolve.test.cjs
//
// Regression guard for #5536 ("Automated Rule Cannot Move Card to a Different
// Board"). A rule that moves / links a card onto another board resolves the
// destination swimlane. The old code fell back with
//     swimlaneId = (await getSwimlane({title:'Default', boardId}))._id;
// which threw "Cannot read properties of undefined (reading '_id')" — shown to
// the user as a generic "Internal Server Error" — whenever the destination
// board had no swimlane titled exactly 'Default' (renamed, translated, or a
// board the rule creator did not own). resolveRuleSwimlaneId()/resolveRuleListId()
// must pick a valid id when one exists and return '' instead of throwing.

const assert = require('assert');
const {
  resolveRuleSwimlaneId,
  resolveRuleListId,
} = require('../models/lib/ruleActionResolve');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

const sw = id => ({ _id: id, title: 'x' });

// --- POSITIVE: a resolvable swimlane/list yields its id ----------------------
test('named swimlane wins when present', () => {
  assert.strictEqual(resolveRuleSwimlaneId(sw('S1'), sw('DEF')), 'S1');
});

test('falls back to the board default swimlane when no named match', () => {
  assert.strictEqual(resolveRuleSwimlaneId(undefined, sw('DEF')), 'DEF');
});

test('named list yields its id', () => {
  assert.strictEqual(resolveRuleListId({ _id: 'L1', title: 'Todo' }), 'L1');
});

// --- NEGATIVE: the #5536 crash (._id on undefined) must NOT come back --------
test('NEGATIVE: no named AND no default swimlane returns "" instead of throwing', () => {
  // This is exactly the destination board that used to crash: the 'Default'
  // swimlane lookup returned undefined and `.._id` threw an Internal Server Error.
  let result;
  assert.doesNotThrow(() => {
    result = resolveRuleSwimlaneId(undefined, undefined);
  });
  assert.strictEqual(result, '');
});

test('NEGATIVE: a swimlane object with no _id does not resolve, no throw', () => {
  let result;
  assert.doesNotThrow(() => {
    result = resolveRuleSwimlaneId({ title: 'orphan' }, { title: 'also-no-id' });
  });
  assert.strictEqual(result, '');
});

test('NEGATIVE: missing destination list returns "" (unassigned), never throws', () => {
  let result;
  assert.doesNotThrow(() => {
    result = resolveRuleListId(undefined);
  });
  assert.strictEqual(result, '');
});

test('NEGATIVE: null inputs are handled without throwing', () => {
  assert.doesNotThrow(() => resolveRuleSwimlaneId(null, null));
  assert.doesNotThrow(() => resolveRuleListId(null));
  assert.strictEqual(resolveRuleSwimlaneId(null, null), '');
  assert.strictEqual(resolveRuleListId(null), '');
});

console.log(`\n${passed} tests passed`);
