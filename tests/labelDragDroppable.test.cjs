'use strict';

// Plain-Node regression guard (no Meteor) for issue #1554: dragging labels or
// members from the sidebar onto cards stopped working for any minicard
// rendered AFTER the list's initial render (new cards, cards dragged in,
// Blaze re-renders) — it only worked again after leaving and re-entering the
// board. Root cause: commit 7673c77c5 (2023) deleted the reactive dependency
// (`Cards.find({boardId}).fetch()`) from the droppable-initializing autorun in
// client/components/lists/list.js instead of converting it to the
// ReactiveCache, so the autorun ran exactly once per list render.
// Run: node tests/labelDragDroppable.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const src = fs.readFileSync(path.join(repoRoot, 'client/components/lists/list.js'), 'utf8');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

test('the droppable autorun depends reactively on the board\'s cards (#1554)', () => {
  const autorun = src.match(/\/\/ We want to re-run this function any time a card is added\.[\s\S]*?Tracker\.afterFlush/);
  assert.ok(autorun, 'droppable autorun found');
  assert.ok(autorun[0].includes('ReactiveCache.getCards({ boardId: currentBoardId })'),
    'without this dependency the autorun runs once and later-added cards never become droppable');
});

test('negative: the dependency is a reactive read, not wrapped in Tracker.nonreactive', () => {
  const autorun = src.match(/\/\/ We want to re-run this function any time a card is added\.[\s\S]*?Tracker\.afterFlush/)[0];
  const depIndex = autorun.indexOf('ReactiveCache.getCards');
  const nonreactiveBlock = autorun.match(/Tracker\.nonreactive\(\(\) => \{[\s\S]*?\}\);/);
  assert.ok(depIndex > autorun.indexOf(nonreactiveBlock[0]) + nonreactiveBlock[0].length,
    'the getCards read must be OUTSIDE the nonreactive block or it registers no dependency');
});

test('the droppable still accepts sidebar members and labels', () => {
  assert.ok(src.includes("accept: '.js-member,.js-label'"),
    'sidebar member/label drags must remain accepted drop payloads');
});

console.log(`labelDragDroppable.test.cjs: ${passed} tests passed`);
