'use strict';

// Regression guard for #6477: "Moving tasks between swimlanes broken" — dragging
// a card from one swimlane to the SAME list in another swimlane dropped it back
// in the SOURCE swimlane, "particularly when task lists are long and overflow".
//
// Root cause: the card sortable's `sort` handler auto-scrolls the board (#443)
// by setting `.js-lists` scrollLeft / `.board-canvas` scrollTop, but jQuery UI
// sortable caches container/item geometry at drag start and only re-caches on
// its OWN placeholder moves — never on our manual scroll. Long/overflowing lists
// are exactly what triggers auto-scroll, so the drop resolved against a stale map
// and `ui.item.parents('.swimlane')` in the stop handler persisted the wrong
// swimlane. The fix re-caches positions (`sortable('refreshPositions')`) whenever
// the sort handler actually scrolled — complementing the #2769 DOM-mutation
// refresh in listBody.js, which does not fire on scroll.
//
// This is jQuery-UI/DOM-coupled runtime code, so we guard it at the source level.
// Run: node tests/cardDragSwimlaneScrollRefresh.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const listJs = fs.readFileSync(path.join(repoRoot, 'client/components/lists/list.js'), 'utf8');

// Isolate the sort() handler body so the assertions can't be satisfied by
// unrelated code elsewhere in the file.
const sortStart = listJs.indexOf('sort(event, ui) {');
const sortEnd = listJs.indexOf('\n    },', sortStart);
assert.ok(sortStart !== -1 && sortEnd > sortStart, 'could not locate the card sortable sort() handler');
const sortBody = listJs.slice(sortStart, sortEnd);

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

test('the sort handler tracks whether it actually scrolled', () => {
  assert.ok(/let scrolled = false;/.test(sortBody), 'a `scrolled` flag must gate the refresh');
  assert.ok(/scrolled = true;/.test(sortBody), 'the flag must be set when a scroll is applied');
  // both axes must set it: horizontal lane scroll and vertical canvas scroll.
  assert.ok((sortBody.match(/scrolled = true;/g) || []).length >= 2,
    'both the horizontal lane scroll and the vertical canvas scroll must mark scrolled');
});

test('after auto-scrolling, the sortable geometry is re-cached', () => {
  assert.ok(/if \(scrolled\)\s*{[\s\S]*sortable\('refreshPositions'\)/.test(sortBody),
    "sort() must call sortable('refreshPositions') when it scrolled, so the drop resolves against the scrolled layout");
});

test('the refresh is gated by scroll (not run on every mousemove)', () => {
  // NEGATIVE guard: refreshPositions must be INSIDE the `if (scrolled)` block, not
  // unconditional (which would thrash geometry on every sort event).
  const refreshIdx = sortBody.indexOf("sortable('refreshPositions')");
  const guardIdx = sortBody.lastIndexOf('if (scrolled)', refreshIdx);
  assert.ok(guardIdx !== -1 && guardIdx < refreshIdx,
    'refreshPositions must be guarded by if (scrolled)');
});

console.log(`\nAll ${passed} card-drag swimlane-scroll-refresh tests passed`);
