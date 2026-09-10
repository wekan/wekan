'use strict';

// #4256: whether a minicard shows label TEXT is resolved the same way as the
// existing global theme override (a global/board default with an optional
// per-user override that wins when set). This pins the pure resolution rule
// in models/lib/labelTextVisibility.js: per-user override > board setting >
// historical default (text shown), plus the migration-safety case that an
// existing board/user with nothing stored sees no behaviour change.
// Run: node tests/labelTextVisibility.test.cjs

const assert = require('assert');
const {
  resolveShowLabelText,
  nextShowLabelTextOverride,
} = require('../models/lib/labelTextVisibility.js');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log(`  ok - ${name}`);
}

console.log('labelTextVisibility:');

test('migration safety: no board setting and no user override still shows text', () => {
  assert.strictEqual(resolveShowLabelText(null, null), true);
  assert.strictEqual(resolveShowLabelText(undefined, undefined), true);
});

test('board setting alone decides when there is no user override', () => {
  assert.strictEqual(resolveShowLabelText(null, true), true);
  assert.strictEqual(resolveShowLabelText(null, false), false);
});

test('a user override wins over the board setting, in both directions', () => {
  assert.strictEqual(resolveShowLabelText(false, true), false);
  assert.strictEqual(resolveShowLabelText(true, false), true);
});

test('a user override wins even when the board has no setting stored', () => {
  assert.strictEqual(resolveShowLabelText(false, null), false);
  assert.strictEqual(resolveShowLabelText(true, null), true);
});

test('an existing board that never touched the setting defaults to shown', () => {
  // Boards created before #4256 have no `showLabelText` field at all.
  assert.strictEqual(resolveShowLabelText(null, undefined), true);
});

test('the override cycles no-override -> shown -> hidden -> no-override', () => {
  assert.strictEqual(nextShowLabelTextOverride(null), true);
  assert.strictEqual(nextShowLabelTextOverride(undefined), true);
  assert.strictEqual(nextShowLabelTextOverride(true), false);
  assert.strictEqual(nextShowLabelTextOverride(false), null);
});

test('junk override values are not treated as a real override (negative)', () => {
  assert.strictEqual(resolveShowLabelText('true', false), false);
  assert.strictEqual(resolveShowLabelText(0, true), true);
});

console.log(`\nlabelTextVisibility: ${passed} tests passed`);
