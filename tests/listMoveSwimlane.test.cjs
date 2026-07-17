'use strict';

// Regression test for #6484: nudging a list in swimlanes view made it disappear
// from every swimlane except the one it was shown under.
//
// A board-wide list has swimlaneId === null and renders under EVERY swimlane. In
// swimlanes view the drop handler read targetSwimlaneId = the swimlane the list
// is shown under (always non-null) and did:
//     isDifferentSwimlane = targetSwimlaneId && targetSwimlaneId !== originalSwimlaneId
// For a board-wide list originalSwimlaneId is null, so ANY nudge made this true,
// which set list.swimlaneId AND moved every card to that swimlane — the list then
// vanished from all other swimlanes. The fix also requires originalSwimlaneId, so
// board-wide lists stay board-wide; genuinely swimlane-scoped lists still move.
//
// Run: node tests/listMoveSwimlane.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// Mirrors the FIXED condition in client/components/swimlanes/swimlanes.js.
function isDifferentSwimlane(originalSwimlaneId, targetSwimlaneId) {
  return !!(
    originalSwimlaneId &&
    targetSwimlaneId &&
    targetSwimlaneId !== originalSwimlaneId
  );
}

// The OLD (buggy) condition, kept for a negative control.
function isDifferentSwimlaneOLD(originalSwimlaneId, targetSwimlaneId) {
  return !!(targetSwimlaneId && targetSwimlaneId !== originalSwimlaneId);
}

test('board-wide list (null swimlane) nudged under a swimlane is NOT rebound', () => {
  // This is the reported bug scenario: the fix must NOT treat it as a move.
  assert.strictEqual(isDifferentSwimlane(null, 'swimlaneB'), false);
});

test('NEGATIVE: the old condition WOULD have rebound the board-wide list (the bug)', () => {
  assert.strictEqual(isDifferentSwimlaneOLD(null, 'swimlaneB'), true);
});

test('a swimlane-scoped list moved to a different swimlane still counts as a move', () => {
  assert.strictEqual(isDifferentSwimlane('swimlaneA', 'swimlaneB'), true);
});

test('a swimlane-scoped list nudged within its own swimlane is NOT a move', () => {
  assert.strictEqual(isDifferentSwimlane('swimlaneA', 'swimlaneA'), false);
});

test('no target swimlane (lists view) is never a move', () => {
  assert.strictEqual(isDifferentSwimlane(null, null), false);
  assert.strictEqual(isDifferentSwimlane('swimlaneA', null), false);
});

// Source guard: the real handler must require originalSwimlaneId, so it cannot
// regress to the target-only condition.
test('swimlanes.js gates the swimlane rebind on originalSwimlaneId', () => {
  const src = fs.readFileSync(
    path.join(path.resolve(__dirname, '..'), 'client/components/swimlanes/swimlanes.js'),
    'utf8',
  );
  assert.ok(/const isDifferentSwimlane\s*=\s*\n?\s*originalSwimlaneId\s*&&/.test(src),
    'isDifferentSwimlane must require originalSwimlaneId to be set');
});

console.log(`\nAll ${passed} list-move swimlane tests passed`);
