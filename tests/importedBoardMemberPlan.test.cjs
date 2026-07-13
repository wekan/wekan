'use strict';

// Plain-Node unit test (no Meteor) for how an imported board member becomes a member of
// the new board. Run: node tests/importedBoardMemberPlan.test.cjs

const assert = require('assert');
const { planImportedBoardMember } = require('../models/lib/importedBoardMemberPlan');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

const IMPORTER = 'importer-id';

// ── positive: original member kept, inactive + non-admin when unmapped ───────
test('unmapped member is kept by original id, inactive and non-admin', () => {
  const e = planImportedBoardMember({ userId: 'alice', isActive: true, isAdmin: true }, IMPORTER);
  assert.strictEqual(e.userId, 'alice');
  assert.strictEqual(e.wekanId, 'alice');
  assert.strictEqual(e.isActive, false, 'imported member must be inactive until reconciled');
  assert.strictEqual(e.isAdmin, false, 'imported member must not silently gain admin');
});
test('supports the id field (client mapper renames userId -> id)', () => {
  const e = planImportedBoardMember({ id: 'bob' }, IMPORTER);
  assert.strictEqual(e.userId, 'bob');
  assert.strictEqual(e.wekanId, 'bob');
});
test('a real mapping preserves the mapped role (active + admin)', () => {
  const e = planImportedBoardMember({ userId: 'src', wekanId: 'target', isActive: true, isAdmin: true }, IMPORTER);
  assert.strictEqual(e.userId, 'target');
  assert.strictEqual(e.wekanId, 'target');
  assert.strictEqual(e.isActive, true);
  assert.strictEqual(e.isAdmin, true);
});
test('a mapped-but-inactive member stays inactive', () => {
  const e = planImportedBoardMember({ userId: 'src', wekanId: 'target', isActive: false }, IMPORTER);
  assert.strictEqual(e.isActive, false);
  assert.strictEqual(e.isAdmin, false);
});

// ── negative: no member is produced ──────────────────────────────────────────
test('the importer themselves is not re-added', () => {
  assert.strictEqual(planImportedBoardMember({ userId: IMPORTER, isAdmin: true }, IMPORTER), null);
  assert.strictEqual(planImportedBoardMember({ wekanId: IMPORTER }, IMPORTER), null);
});
test('a member with no id is dropped', () => {
  assert.strictEqual(planImportedBoardMember({ isAdmin: true }, IMPORTER), null);
  assert.strictEqual(planImportedBoardMember({}, IMPORTER), null);
});
test('null / undefined member is dropped', () => {
  assert.strictEqual(planImportedBoardMember(null, IMPORTER), null);
  assert.strictEqual(planImportedBoardMember(undefined, IMPORTER), null);
});

console.log(`\nimportedBoardMemberPlan: ${passed} tests passed`);
