'use strict';

// Plain-Node unit test (no Meteor) for the imported-placeholder reconciliation planner.
// Run: node tests/importedUserReconciliationPlan.test.cjs

const assert = require('assert');
const { planReconciliation } = require('../models/lib/importedUserReconciliationPlan');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

const imported = (id, username) => ({ _id: id, username, authenticationMethod: 'imported' });
const real = (id, username) => ({ _id: id, username, authenticationMethod: 'ldap' });

// ── positive: a placeholder with a matching real account is merged ───────────
test('merges a placeholder into the matching real account', () => {
  const plan = planReconciliation([imported('ph1', 'alice')], [real('u1', 'alice')]);
  assert.deepStrictEqual(plan.merges, [{ placeholderId: 'ph1', targetId: 'u1' }]);
  assert.deepStrictEqual(plan.deactivations, []);
});
test('mixed set: matched ones merge, unmatched ones deactivate', () => {
  const plan = planReconciliation(
    [imported('ph1', 'alice'), imported('ph2', 'bob'), imported('ph3', 'carol')],
    [real('u1', 'alice'), real('u3', 'carol')],
  );
  assert.deepStrictEqual(
    plan.merges.sort((a, b) => a.placeholderId.localeCompare(b.placeholderId)),
    [{ placeholderId: 'ph1', targetId: 'u1' }, { placeholderId: 'ph3', targetId: 'u3' }],
  );
  assert.deepStrictEqual(plan.deactivations, ['ph2']);
});

// ── negative: nothing merges when there is no valid match ────────────────────
test('deactivates when no real account has that username', () => {
  const plan = planReconciliation([imported('ph1', 'alice')], [real('u1', 'bob')]);
  assert.deepStrictEqual(plan.merges, []);
  assert.deepStrictEqual(plan.deactivations, ['ph1']);
});
test('never matches another imported placeholder (not a valid account)', () => {
  const plan = planReconciliation(
    [imported('ph1', 'alice')],
    [imported('ph2', 'alice')], // same username but also a placeholder → not valid
  );
  assert.deepStrictEqual(plan.merges, []);
  assert.deepStrictEqual(plan.deactivations, ['ph1']);
});
test('never matches itself even if returned in the real set', () => {
  const plan = planReconciliation([imported('ph1', 'alice')], [{ _id: 'ph1', username: 'alice', authenticationMethod: 'password' }]);
  // the only candidate is the placeholder's own id → cannot merge into self
  assert.deepStrictEqual(plan.merges, []);
  assert.deepStrictEqual(plan.deactivations, ['ph1']);
});
test('placeholder without a username is deactivated, not merged', () => {
  const plan = planReconciliation([imported('ph1', undefined)], [real('u1', 'alice')]);
  assert.deepStrictEqual(plan.merges, []);
  assert.deepStrictEqual(plan.deactivations, ['ph1']);
});
test('empty inputs produce empty plan', () => {
  assert.deepStrictEqual(planReconciliation([], []), { merges: [], deactivations: [] });
  assert.deepStrictEqual(planReconciliation(null, null), { merges: [], deactivations: [] });
});
test('first matching valid account wins on duplicate usernames', () => {
  const plan = planReconciliation([imported('ph1', 'alice')], [real('u1', 'alice'), real('u2', 'alice')]);
  assert.deepStrictEqual(plan.merges, [{ placeholderId: 'ph1', targetId: 'u1' }]);
});

console.log(`\nimportedUserReconciliationPlan: ${passed} tests passed`);
