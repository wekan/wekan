'use strict';

// Regression guard for #6630. Action descriptions belong to Actions; putting
// the same `desc` key in a Rule document makes SimpleSchema reject the whole
// rule with keyNotInSchema.
//
// #2713 routed every card-action handler through
// rulesSaveHelper.saveRuleTriggerAction(boardId, ruleId, ruleName, trigger,
// actionDoc) instead of raw Actions.insert()/Rules.insert() calls, so this
// now checks: the action object literal passed to that helper still carries
// `desc`, and the rule document server/rulesButton.js actually persists
// (both rules.createRule's `ruleDoc` and rules.updateRule's `ruleSet`) never
// does.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(
  path.join(__dirname, '..', 'client/components/rules/actions/cardActions.js'),
  'utf8',
);
const rulesButtonSource = fs.readFileSync(
  path.join(__dirname, '..', 'server/rulesButton.js'),
  'utf8',
);

function handler(selector, nextSelector) {
  const start = source.indexOf(`'click ${selector}'`);
  assert.notEqual(start, -1, `${selector} handler exists`);
  const end = source.indexOf(`'click ${nextSelector}'`, start + selector.length);
  assert.notEqual(end, -1, `${nextSelector} follows ${selector}`);
  return source.slice(start, end);
}

function savedActionObjects(block) {
  return [...block.matchAll(/saveRuleTriggerAction\([^,]*,[^,]*,[^,]*,[^,]*,\s*\{([\s\S]*?)\}\);/g)]
    .map((match) => match[1]);
}

const cases = [
  ['set current date', '.js-set-date-action', '.js-remove-datevalue-action'],
  ['remove date value', '.js-remove-datevalue-action', '.js-add-label-action'],
  ['add member', '.js-add-member-action', '.js-add-removeall-action'],
];

for (const [name, selector, nextSelector] of cases) {
  const block = handler(selector, nextSelector);
  const actions = savedActionObjects(block);
  assert.ok(actions.length > 0, `${name}: calls saveRuleTriggerAction`);
  assert.ok(actions.some((object) => /\bdesc\b/.test(object)), `${name}: action object keeps desc`);
}

// Negative guard: the RULE document the server actually persists must never
// carry `desc` - neither on create nor on update (#2713's rules.updateRule).
for (const [methodName, docVar] of [
  ["rules.createRule", 'ruleDoc'],
  ["rules.updateRule", 'ruleSet'],
]) {
  const methodStart = rulesButtonSource.indexOf(`async '${methodName}'`);
  assert.notEqual(methodStart, -1, `${methodName} exists in server/rulesButton.js`);
  const nextMethod = rulesButtonSource.indexOf("async '", methodStart + methodName.length);
  const block = rulesButtonSource.slice(methodStart, nextMethod === -1 ? undefined : nextMethod);
  const docLiteral = block.match(new RegExp(`const ${docVar} = \\{([\\s\\S]*?)\\};`));
  assert.ok(docLiteral, `${methodName}: builds a ${docVar} literal`);
  assert.ok(!/\bdesc\b/.test(docLiteral[1]), `${methodName}: ${docVar} must not carry desc`);
}

console.log('\nruleCardActionSchema: 8 checks passed');
