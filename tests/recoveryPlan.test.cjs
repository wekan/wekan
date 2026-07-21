'use strict';

// Unit tests for the #6492 automatic-recovery decision logic (models/lib/recoveryPlan.js).
//
// The whole point is that recovery is SAFE: nothing destructive happens unless the
// database is KNOWN corrupt, and then the least-invasive known-good source is chosen.
// These tests pin both the positive choices and the negatives (healthy/unknown ->
// never act; corrupt with a bad backup -> fall through, not restore garbage).
//
// Run: node tests/recoveryPlan.test.cjs

const assert = require('assert');
const { decideRecovery, isDestructive } = require('../models/lib/recoveryPlan');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('recoveryPlan:');

// ── healthy / unknown never trigger anything (negatives) ─────────────────────
test('healthy database -> no action', () => {
  const r = decideRecovery({ integrity: 'ok', hasBackup: true, hasMongo: true });
  assert.strictEqual(r.action, 'none');
  assert.strictEqual(isDestructive(r.action), false);
});

test('unknown integrity -> no automatic action (never act on a guess)', () => {
  assert.strictEqual(decideRecovery({ integrity: 'unknown', hasBackup: true }).action, 'none');
  assert.strictEqual(decideRecovery({}).action, 'none'); // missing integrity == unknown
  assert.strictEqual(decideRecovery().action, 'none'); // missing options entirely
});

// ── corrupt: prefer latest good backup, then prev, then re-migrate, then manual ──
test('corrupt + good latest backup -> restore-backup', () => {
  const r = decideRecovery({ integrity: 'corrupt', hasBackup: true, hasMongo: true });
  assert.strictEqual(r.action, 'restore-backup');
  assert.ok(isDestructive(r.action));
});

test('corrupt + latest backup itself bad -> restore-prev (do NOT restore garbage)', () => {
  const r = decideRecovery({
    integrity: 'corrupt', hasBackup: true, backupHealthy: false, hasPrevBackup: true,
  });
  assert.strictEqual(r.action, 'restore-prev');
});

test('corrupt + no latest backup -> restore-prev', () => {
  const r = decideRecovery({ integrity: 'corrupt', hasPrevBackup: true });
  assert.strictEqual(r.action, 'restore-prev');
});

test('corrupt + both backups bad + MongoDB -> remigrate', () => {
  const r = decideRecovery({
    integrity: 'corrupt',
    hasBackup: true, backupHealthy: false,
    hasPrevBackup: true, prevHealthy: false,
    hasMongo: true,
  });
  assert.strictEqual(r.action, 'remigrate');
});

test('corrupt + no backup + MongoDB -> remigrate', () => {
  assert.strictEqual(
    decideRecovery({ integrity: 'corrupt', hasMongo: true }).action,
    'remigrate',
  );
});

// ── nothing to recover from -> manual (never invent a destructive action) ────
test('corrupt + no backup + no MongoDB -> manual (negative: no auto-destroy)', () => {
  const r = decideRecovery({ integrity: 'corrupt' });
  assert.strictEqual(r.action, 'manual');
  assert.strictEqual(isDestructive(r.action), false, 'manual must not be destructive');
});

test('every action has a human-readable reason', () => {
  for (const opts of [
    { integrity: 'ok' },
    { integrity: 'corrupt', hasBackup: true },
    { integrity: 'corrupt', hasPrevBackup: true },
    { integrity: 'corrupt', hasMongo: true },
    { integrity: 'corrupt' },
  ]) {
    const r = decideRecovery(opts);
    assert.ok(typeof r.reason === 'string' && r.reason.length > 0, `reason for ${JSON.stringify(opts)}`);
  }
});

console.log(`\n${passed} tests passed`);
