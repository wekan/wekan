'use strict';

// Plain-Node unit test (no Meteor) for the outgoing-webhook label name helper.
// Run: node tests/labelDisplayName.test.cjs
//
// Regression guard for #5442 ("outgoing webhook on add/remove label did not
// include the label name"): a label has an optional `name` and a `color`, and a
// nameless label is shown by its color in the UI. The webhook text must resolve
// a real display value (name -> color -> id) instead of a bare, generic "label".

const assert = require('assert');
const { labelDisplayName } = require('../models/lib/labelDisplayName');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

test('name present -> the name is used', () => {
  assert.strictEqual(
    labelDisplayName({ _id: 'l1', name: 'Bug', color: 'red' }),
    'Bug',
  );
});

test('empty / whitespace name -> falls back to the color', () => {
  assert.strictEqual(
    labelDisplayName({ _id: 'l1', name: '', color: 'green' }),
    'green',
  );
  assert.strictEqual(
    labelDisplayName({ _id: 'l1', name: '   ', color: 'blue' }),
    'blue',
  );
  assert.strictEqual(
    labelDisplayName({ _id: 'l1', color: 'yellow' }),
    'yellow',
  );
});

test('no name and no color -> falls back to the label id', () => {
  assert.strictEqual(labelDisplayName({ _id: 'l42' }), 'l42');
  assert.strictEqual(labelDisplayName({ _id: 'l42', name: '', color: '' }), 'l42');
});

test('missing / null label -> empty string, never throws', () => {
  assert.strictEqual(labelDisplayName(null), '');
  assert.strictEqual(labelDisplayName(undefined), '');
  assert.strictEqual(labelDisplayName({}), '');
});

console.log(`\n${passed} passed`);
