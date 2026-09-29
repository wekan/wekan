'use strict';

// #3195: the rule editor's variable picker (models/lib/ruleVariablePicker.js).
// Run: node tests/ruleVariablePicker.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { ruleVariableTokens, insertRuleVariable, BASE_TOKENS } = require('../models/lib/ruleVariablePicker');
const { substituteVars } = require('../models/lib/ruleVarsSubstitute');

const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

test('the board custom fields follow the people, card, list and board tokens', () => {
  assert.deepEqual(ruleVariableTokens([{ name: 'Stage' }, { name: ' Room ' }]),
    [...BASE_TOKENS, '{customField:Stage}', '{customField:Room}']);
});

test('every offered token is one the rule engine resolves', () => {
  const vars = { creator: 'a', assignees: 'b', members: 'c', card: 'd', list: 'e', board: 'f', customfield: { stage: 'g' } };
  for (const token of ruleVariableTokens([{ name: 'Stage' }])) {
    assert.notEqual(substituteVars(token, vars), token, token);
  }
});

test('negative: admin-only fields, brace names, blanks and duplicates are not offered', () => {
  const tokens = ruleVariableTokens([
    { name: 'Secret', adminOnly: true }, { name: 'a{b}' }, { name: '  ' }, { name: 5 }, null,
    { name: 'Stage' }, { name: 'Stage' },
  ]);
  assert.deepEqual(tokens.slice(BASE_TOKENS.length), ['{customField:Stage}']);
  assert.deepEqual(ruleVariableTokens(undefined), BASE_TOKENS);
});

test('a token replaces the selection and the caret follows it', () => {
  assert.deepEqual(insertRuleVariable('To  now', 3, 3, '{members}'), { value: 'To {members} now', caret: 12 });
  assert.deepEqual(insertRuleVariable('To XX now', 3, 5, '{card}'), { value: 'To {card} now', caret: 9 });
});

test('negative: a missing or impossible selection appends instead of corrupting the text', () => {
  for (const [start, end] of [[null, null], [undefined, 2], [5, 2], [-1, 0], [0, 99], [1.5, 2]]) {
    assert.deepEqual(insertRuleVariable('abc', start, end, '{x}'), { value: 'abc{x}', caret: 6 }, `${start},${end}`);
  }
  assert.deepEqual(insertRuleVariable(undefined, 0, 0, '{x}'), { value: '{x}', caret: 3 });
});

test('the picker is in the trigger and action editors, with an English label', () => {
  assert.match(read('client/components/rules/rulesTriggers.jade'), /js-trigger-vars-hint[^\n]*\n\s+\+ruleVariablePicker/);
  assert.match(read('client/components/rules/rulesActions.jade'), /\.triggers-main-body\n\s+\+ruleVariablePicker/);
  const features = read('client/features/rules.js');
  assert.match(features, /ruleVariablePicker\.jade/);
  assert.match(features, /ruleVariablePicker\.js/);
  const js = read('client/components/rules/ruleVariablePicker.js');
  assert.match(js, /ruleVariableTokens\(/);
  assert.match(js, /insertRuleVariable\(/);
  assert.match(js, /dispatchEvent\(new Event\('input'/, 'editors listening for input see the change');
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  assert.ok(en['r-insert-variable']);
});

console.log(`\n${passed} tests passed`);
