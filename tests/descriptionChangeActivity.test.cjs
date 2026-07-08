'use strict';

// Plain-Node unit test (no Meteor) for the pure description-change detector.
// Run: node tests/descriptionChangeActivity.test.cjs
//
// Regression guard for #5482 ("adding or editing a card description does NOT
// trigger an outgoing webhook, although other card operations do"): outgoing
// webhooks fire from the Activities.after.insert hook, so a change only reaches a
// webhook if it logs an activity. Description changes logged none. The pure
// descriptionChanged() helper decides whether the Cards.before.update hook should
// emit an a-changedDescription activity: it must emit when a description is set
// for the first time and when it is edited to a different value, and must NOT
// emit on no-op / empty->empty saves.

const assert = require('assert');

// The helper is authored as an ES module (export function ...). Load it without a
// bundler by evaluating its body with a tiny CommonJS shim for `export`.
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(
  path.join(__dirname, '..', 'server', 'lib', 'descriptionChangeActivity.js'),
  'utf8',
);
const moduleExports = {};
// eslint-disable-next-line no-new-func
new Function('exports', src.replace(/export function/g, 'exports.descriptionChanged = function'))(
  moduleExports,
);
const { descriptionChanged } = moduleExports;

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// --- POSITIVE: should emit ---------------------------------------------------
test('#5482: emits when a description is set for the first time', () => {
  const oldDoc = {};
  const modifier = { $set: { description: 'First description' } };
  assert.strictEqual(descriptionChanged(oldDoc, modifier), true);
});

test('#5482: emits when the description is edited to a different value', () => {
  const oldDoc = { description: 'Old description' };
  const modifier = { $set: { description: 'New description' } };
  assert.strictEqual(descriptionChanged(oldDoc, modifier), true);
});

test('emits when an existing description is cleared (non-empty -> empty)', () => {
  const oldDoc = { description: 'Had text' };
  const modifier = { $set: { description: '' } };
  assert.strictEqual(descriptionChanged(oldDoc, modifier), true);
});

// --- NEGATIVE: should NOT emit -----------------------------------------------
test('does NOT emit when the description is unchanged', () => {
  const oldDoc = { description: 'Same description' };
  const modifier = { $set: { description: 'Same description' } };
  assert.strictEqual(descriptionChanged(oldDoc, modifier), false);
});

test('does NOT emit on an empty->empty save (missing -> "")', () => {
  const oldDoc = {};
  const modifier = { $set: { description: '' } };
  assert.strictEqual(descriptionChanged(oldDoc, modifier), false);
});

test('does NOT emit on an empty->empty save ("" -> "")', () => {
  const oldDoc = { description: '' };
  const modifier = { $set: { description: '' } };
  assert.strictEqual(descriptionChanged(oldDoc, modifier), false);
});

test('does NOT emit when description is absent from the modifier', () => {
  const oldDoc = { description: 'Old description' };
  const modifier = { $set: { title: 'changed title' } };
  assert.strictEqual(descriptionChanged(oldDoc, modifier), false);
});

test('does NOT emit for falsy / malformed modifiers', () => {
  assert.strictEqual(descriptionChanged({ description: 'x' }, undefined), false);
  assert.strictEqual(descriptionChanged({ description: 'x' }, null), false);
  assert.strictEqual(descriptionChanged({ description: 'x' }, {}), false);
  assert.strictEqual(descriptionChanged({ description: 'x' }, { $set: {} }), false);
});

test('tolerates a missing oldDoc', () => {
  const modifier = { $set: { description: 'New description' } };
  assert.strictEqual(descriptionChanged(undefined, modifier), true);
  assert.strictEqual(descriptionChanged(null, modifier), true);
});

console.log('\n' + passed + ' passed');
