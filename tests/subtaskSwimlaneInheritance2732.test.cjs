'use strict';

// Plain-Node regression guard (no Meteor) for issue #2732: "Feature request:
// Attach subtask to swimlane. It is good to put subtask in same swimlane as
// parent task."
//
// A newly-created subtask is not simply inserted onto the parent's own
// board/list: `addSubtaskCard` (server/models/cards.js) resolves a dedicated
// default subtasks board/list first (see #3868 / #5788 / #2256 /
// tests/subtasksDefaultBoard.test.cjs), so the new card's swimlaneId can never
// literally equal the parent's swimlaneId -- swimlanes are scoped to a single
// board. The correct inheritance on that destination board is therefore BY
// TITLE: reuse the swimlane on the target board whose title matches the
// parent card's swimlane title, and only fall back to the target board's
// default swimlane when no such swimlane exists there yet.
//
// This test proves that behaviour is already implemented (found while fixing
// #2732: already correct in the current code) and pins it so it cannot
// regress to "always use the target board's default swimlane".
//
// Run: node tests/subtaskSwimlaneInheritance2732.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const serverCards = fs.readFileSync(
  path.join(repoRoot, 'server/models/cards.js'),
  'utf8',
);

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

function extract(name) {
  const m = serverCards.match(
    new RegExp(`async ${name}\\([^)]*\\) \\{[\\s\\S]*?\\n  \\},`),
  );
  assert.ok(m, `${name} found in server/models/cards.js`);
  return m[0];
}

const fn = extract('addSubtaskCard');

test('#2732: looks up the parent card\'s own swimlane before choosing a target', () => {
  assert.ok(
    /const parentSwimlane = parentCard\.swimlaneId[\s\S]*?Swimlanes\.findOneAsync\(parentCard\.swimlaneId\)/.test(
      fn,
    ),
    'addSubtaskCard must read the parent card\'s swimlane',
  );
});

test('#2732: reuses a target-board swimlane whose title matches the parent swimlane\'s title', () => {
  assert.ok(
    /Swimlanes\.findOneAsync\(\{\s*boardId: targetBoard\._id,\s*title: parentSwimlane\.title,\s*\}\)/.test(
      fn,
    ),
    'addSubtaskCard must look up the destination swimlane by matching title, scoped to the destination board',
  );
});

test('#2732: only falls back to the destination board\'s default swimlane when no title match exists', () => {
  // The default-swimlane fallback must be reached through the "no match"
  // branch (targetSwimlane falsy), not unconditionally before the lookup.
  const ifIndex = fn.indexOf('if (targetSwimlane)');
  const elseIndex = fn.indexOf('} else {', ifIndex);
  const defaultCallIndex = fn.indexOf('getDefaultSwimlineAsync()', elseIndex);
  assert.ok(ifIndex !== -1, 'must branch on whether a matching swimlane was found');
  assert.ok(
    elseIndex !== -1 && elseIndex > ifIndex,
    'the default-swimlane fallback must live in the else branch',
  );
  assert.ok(
    defaultCallIndex !== -1 && defaultCallIndex > elseIndex,
    'getDefaultSwimlineAsync must only run in the no-match fallback branch',
  );
});

test('#2732 negative: the inserted card actually carries the resolved swimlaneId, not a hardcoded default', () => {
  const insertBlock = fn.slice(fn.indexOf('Cards.insertAsync({'));
  assert.ok(
    /swimlaneId,\s*\n/.test(insertBlock) || /swimlaneId: swimlaneId,/.test(insertBlock),
    'Cards.insertAsync must use the resolved `swimlaneId` variable',
  );
  assert.ok(
    !/swimlaneId:\s*targetBoard\.getDefaultSwimlineAsync/.test(insertBlock),
    'the insert must not bypass the resolved swimlaneId with an unconditional board default',
  );
});

console.log(`\n${passed} passed`);
