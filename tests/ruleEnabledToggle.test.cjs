'use strict';

// #2322: a way to temporarily DISABLE a rule without deleting it, so its
// trigger/action configuration is preserved and it can be re-enabled later.
//
// This pins three things:
//  - models/rules.js: the schema has an `enabled` Boolean field that
//    defaults to `true`, so every rule that existed before this field was
//    added (and any rule created without explicitly setting it) keeps
//    firing exactly as before.
//  - server/rulesButton.js: `rules.setEnabled` flips ONLY the `enabled`
//    flag - it must never touch the rule's title/triggerId/actionId or
//    remove/insert Trigger/Action documents.
//  - server/rulesHelper.js: `findMatchingRules()` skips a rule whose
//    `enabled` is explicitly `false`, and only that case.
//
// Run: node tests/ruleEnabledToggle.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const rulesModel = fs.readFileSync(path.join(root, 'models/rules.js'), 'utf8');
const button = fs.readFileSync(path.join(root, 'server/rulesButton.js'), 'utf8');
const helper = fs.readFileSync(path.join(root, 'server/rulesHelper.js'), 'utf8');
const rulesListJs = fs.readFileSync(
  path.join(root, 'client/components/rules/rulesList.js'),
  'utf8',
);
const rulesListJade = fs.readFileSync(
  path.join(root, 'client/components/rules/rulesList.jade'),
  'utf8',
);

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

test('Rules schema has an `enabled` Boolean field defaulting to true', () => {
  const start = rulesModel.indexOf('enabled: {');
  assert.ok(start > 0, '`enabled` field not found in models/rules.js');
  const end = rulesModel.indexOf('createdAt: {');
  const block = rulesModel.slice(start, end);
  assert.match(block, /type: Boolean/);
  assert.match(block, /optional: true/);
  assert.match(block, /defaultValue: true/);
});

test('rules.setEnabled method exists and requires board-admin authorization', () => {
  const start = button.indexOf("async 'rules.setEnabled'");
  assert.ok(start > 0, 'rules.setEnabled method not found');
  const block = button.slice(start, start + 900);
  assert.match(block, /check\(ruleId, String\)/);
  assert.match(block, /check\(enabled, Boolean\)/);
  assert.match(block, /board\.hasAdmin\(this\.userId\)/);
  assert.match(block, /not-authorized/);
});

test('rules.setEnabled only $sets the `enabled` field, nothing else', () => {
  const start = button.indexOf("async 'rules.setEnabled'");
  const block = button.slice(start, start + 900);
  assert.match(block, /Rules\.updateAsync\(ruleId, \{ \$set: \{ enabled \} \}\)/);
});

test('negative: rules.setEnabled never touches Triggers/Actions collections', () => {
  const start = button.indexOf("async 'rules.setEnabled'");
  const end = button.length;
  const block = button.slice(start, end);
  assert.ok(!/Triggers\.(update|remove|insert)Async/.test(block));
  assert.ok(!/Actions\.(update|remove|insert)Async/.test(block));
});

test('findMatchingRules skips rules with enabled === false, and only that case', () => {
  const start = helper.indexOf('async findMatchingRules(');
  assert.ok(start > 0);
  const end = helper.indexOf('\n};', start);
  const block = helper.slice(start, end === -1 ? helper.length : end);
  assert.match(block, /matchingRules\.filter\(rule => rule\.enabled !== false\)/);
});

test('the rules list has a toggle wired to rules.setEnabled', () => {
  assert.match(rulesListJs, /Meteor\.call\('rules\.setEnabled', ruleId, nextEnabled\)/);
  assert.match(rulesListJade, /js-toggle-rule-enabled/);
});

// --- logic-level behaviour: default-true, skip-when-disabled, re-enable ---

function findMatchingRulesLogic(rules) {
  // Mirrors the filter added to server/rulesHelper.js's findMatchingRules().
  return rules.filter(rule => rule.enabled !== false);
}

test('logic: a rule with no `enabled` field (pre-existing rule) still matches', () => {
  const rules = [{ _id: 'r1', title: 'Old rule' }];
  const matched = findMatchingRulesLogic(rules);
  assert.strictEqual(matched.length, 1);
});

test('logic: a newly created rule (enabled defaults true) matches', () => {
  const rules = [{ _id: 'r2', enabled: true }];
  assert.strictEqual(findMatchingRulesLogic(rules).length, 1);
});

test('logic negative: a disabled rule (enabled === false) does not match/fire', () => {
  const rules = [{ _id: 'r3', enabled: false }];
  assert.strictEqual(findMatchingRulesLogic(rules).length, 0);
});

test('logic: re-enabling a disabled rule restores firing, with the same trigger/action ids', () => {
  const rule = { _id: 'r4', triggerId: 't4', actionId: 'a4', enabled: false };
  assert.strictEqual(findMatchingRulesLogic([rule]).length, 0);

  // Simulate rules.setEnabled(ruleId, true): only `enabled` changes.
  const reenabled = { ...rule, enabled: true };
  assert.strictEqual(findMatchingRulesLogic([reenabled]).length, 1);
  assert.strictEqual(reenabled.triggerId, 't4');
  assert.strictEqual(reenabled.actionId, 'a4');
});

test('logic: toggling enabled never changes triggerId/actionId/title (mirrors rules.setEnabled)', () => {
  function setEnabled(rule, enabled) {
    return { ...rule, enabled };
  }
  const rule = { _id: 'r5', title: 'My rule', triggerId: 't5', actionId: 'a5', enabled: true };
  const disabled = setEnabled(rule, false);
  assert.strictEqual(disabled.title, 'My rule');
  assert.strictEqual(disabled.triggerId, 't5');
  assert.strictEqual(disabled.actionId, 'a5');
  assert.strictEqual(disabled.enabled, false);
});

console.log(`\nruleEnabledToggle: ${passed} tests passed`);
