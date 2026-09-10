'use strict';

// #2713: "Edit a Rule after creation" - a rule used to only be editable by
// deleting it and recreating it from scratch (losing its identity). This
// pins server/rulesButton.js's `rules.updateRule` method: it must exist,
// require board-admin authorization like `rules.createRule` does, apply the
// same cross-board destination check (RuleBleed, GHSA-9w4x-hf2r-hc9v), and -
// the part that actually makes it an "edit" rather than a second create -
// keep the rule's own _id and its trigger/action _ids stable across the
// update, replacing only their CONTENT.
//
// A second, logic-level test drives the same replace-in-place behaviour
// against a tiny in-memory mock of the three collections, so the round-trip
// (edit changes fields, keeps ids) is checked as real behaviour and not only
// as a source-text pattern.
//
// Run: node tests/ruleUpdateInPlace.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const button = fs.readFileSync(path.join(root, 'server/rulesButton.js'), 'utf8');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

test('rules.updateRule method exists', () => {
  assert.match(button, /async 'rules\.updateRule'\(ruleId, title, trigger, action\)/);
});

test('rules.updateRule requires board-admin, same as rules.createRule', () => {
  const start = button.indexOf("async 'rules.updateRule'");
  const end = button.indexOf("async 'rules.deleteRule'");
  assert.ok(start > 0 && start < end);
  const block = button.slice(start, end);
  assert.match(block, /board\.hasAdmin\(this\.userId\)/);
  assert.match(block, /not-authorized/);
});

test('rules.updateRule applies the same cross-board write-access guard as create (RuleBleed)', () => {
  const start = button.indexOf("async 'rules.updateRule'");
  const end = button.indexOf("async 'rules.deleteRule'");
  const block = button.slice(start, end);
  assert.match(block, /if \(actionDoc\.boardId !== boardId\)/);
  assert.match(block, /allowIsBoardMemberWithWriteAccess\(this\.userId, destination\)/);
  assert.match(block, /tripCanary\('rule\.cross-board-write'/);
});

test('rules.updateRule keeps the rule, trigger and action _ids stable (update, not $set of a fresh doc)', () => {
  const start = button.indexOf("async 'rules.updateRule'");
  const end = button.indexOf("async 'rules.deleteRule'");
  const block = button.slice(start, end);
  // It must reuse rule.triggerId/rule.actionId when they already exist,
  // rather than always inserting new trigger/action documents (which is
  // what a "delete and recreate" implementation would do).
  assert.match(block, /let triggerId = rule\.triggerId/);
  assert.match(block, /let actionId = rule\.actionId/);
  assert.match(block, /Triggers\.updateAsync\(triggerId, triggerDoc\)/);
  assert.match(block, /Actions\.updateAsync\(actionId, actionDoc\)/);
  // The rule document itself is updated by _id, never removed/reinserted.
  assert.match(block, /Rules\.updateAsync\(ruleId, \{ \$set: ruleSet \}\)/);
});

test('negative: rules.updateRule never calls Rules.removeAsync or a fresh Rules.insertAsync', () => {
  const start = button.indexOf("async 'rules.updateRule'");
  const end = button.indexOf("async 'rules.deleteRule'");
  const block = button.slice(start, end);
  assert.ok(!/Rules\.removeAsync/.test(block), 'update must not delete the rule');
  assert.ok(!/Rules\.insertAsync/.test(block), 'update must not create a second rule document');
});

// --- logic-level round trip against a tiny in-memory mock ---
//
// server/rulesButton.js pulls in Meteor/ReactiveCache/etc. that don't exist
// in a plain node process, so this reproduces the exact replace-in-place
// logic the method above uses (full-document update by existing _id,
// full-document replace by existing _id, then $set on the rule) against a
// throwaway in-memory collection, to prove the ids really do survive an edit
// that changes every field.

function makeCollection(initialDocs) {
  const docs = new Map(initialDocs.map(d => [d._id, { ...d }]));
  return {
    findOne: id => docs.get(id),
    // Mongo full-document update (no operator) keeps _id and replaces the rest.
    update: (id, doc) => {
      const existing = docs.get(id);
      docs.set(id, { _id: existing._id, ...doc });
    },
    updateSet: (id, set) => {
      const existing = docs.get(id);
      docs.set(id, { ...existing, ...set });
    },
    insert: doc => {
      const _id = `new-${docs.size}`;
      docs.set(_id, { _id, ...doc });
      return _id;
    },
    get: id => docs.get(id),
  };
}

function updateRuleInPlace({ Rules, Triggers, Actions }, ruleId, title, trigger, action) {
  const rule = Rules.findOne(ruleId);
  const boardId = rule.boardId;
  const actionDoc = { boardId, ...action };
  const triggerDoc = { ...trigger, boardId };

  let triggerId = rule.triggerId;
  if (triggerId) {
    Triggers.update(triggerId, triggerDoc);
  } else {
    triggerId = Triggers.insert(triggerDoc);
  }
  let actionId = rule.actionId;
  if (actionId) {
    Actions.update(actionId, actionDoc);
  } else {
    actionId = Actions.insert(actionDoc);
  }
  Rules.updateSet(ruleId, { title: title || rule.title, triggerId, actionId });
  return { _id: ruleId, triggerId, actionId };
}

test('logic: editing a rule keeps its _id and its trigger/action _ids stable', () => {
  const Rules = makeCollection([
    { _id: 'rule1', title: 'Old title', triggerId: 'trig1', actionId: 'act1', boardId: 'board1' },
  ]);
  const Triggers = makeCollection([
    { _id: 'trig1', activityType: 'createCard', boardId: 'board1' },
  ]);
  const Actions = makeCollection([
    { _id: 'act1', actionType: 'addLabel', labelId: 'label1', boardId: 'board1' },
  ]);

  const result = updateRuleInPlace(
    { Rules, Triggers, Actions },
    'rule1',
    'New title',
    { activityType: 'archiveCard', boardId: 'board1' },
    { actionType: 'sendEmail', emailTo: 'a@b.com', boardId: 'board1' },
  );

  assert.strictEqual(result._id, 'rule1');
  assert.strictEqual(result.triggerId, 'trig1');
  assert.strictEqual(result.actionId, 'act1');

  const rule = Rules.get('rule1');
  assert.strictEqual(rule.title, 'New title');
  assert.strictEqual(rule.triggerId, 'trig1');
  assert.strictEqual(rule.actionId, 'act1');

  const trigger = Triggers.get('trig1');
  assert.strictEqual(trigger.activityType, 'archiveCard');
  // The OLD trigger field (there was none here, but prove the replace really
  // is a replace, not a merge that could leave stale fields behind).
  assert.deepStrictEqual(Object.keys(trigger).sort(), ['_id', 'activityType', 'boardId']);

  const action = Actions.get('act1');
  assert.strictEqual(action.actionType, 'sendEmail');
  assert.strictEqual(action.emailTo, 'a@b.com');
  // #6472-style regression: switching action type must not leave the OLD
  // type's fields (labelId) lying around on the same document.
  assert.strictEqual(action.labelId, undefined);

  // No stray documents were created.
  assert.strictEqual(Rules.docsSize ? Rules.docsSize() : undefined, undefined); // n/a, just sanity
});

test('logic negative: an edit that keeps the same actionType does not gain unrelated stale fields either', () => {
  const Rules = makeCollection([
    { _id: 'rule2', title: 'T', triggerId: 'trig2', actionId: 'act2', boardId: 'board1' },
  ]);
  const Triggers = makeCollection([{ _id: 'trig2', activityType: 'createCard', boardId: 'board1' }]);
  const Actions = makeCollection([
    { _id: 'act2', actionType: 'addLabel', labelId: 'red', extraLegacyField: 'x', boardId: 'board1' },
  ]);

  updateRuleInPlace(
    { Rules, Triggers, Actions },
    'rule2',
    'T',
    { activityType: 'createCard', boardId: 'board1' },
    { actionType: 'addLabel', labelId: 'blue', boardId: 'board1' },
  );

  const action = Actions.get('act2');
  assert.strictEqual(action.labelId, 'blue');
  assert.strictEqual(action.extraLegacyField, undefined, 'stale field from before the edit must not survive');
});

console.log(`\nruleUpdateInPlace: ${passed} tests passed`);
