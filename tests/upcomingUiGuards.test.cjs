'use strict';

// Source-level regression guards for the Upcoming UI changes that are Blaze/CSS-
// coupled and can't be exercised in plain Node: the #6465 Add List restructure and
// its density/clip CSS, and the #6478 high-impact list-move confirmation. Each has
// a positive assertion and, where a regression is easy to reintroduce, a negative
// guard.
//
// Run: node tests/upcomingUiGuards.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// --- #6465: Add List is a per-list header button + inline composer, not a column ---
test('#6465: header add-list button + inline composer template exist', () => {
  const header = read('client/components/lists/listHeader.jade');
  assert.ok(/js-add-list-here/.test(header), 'far-right add-list button in the list header');
  const swim = read('client/components/swimlanes/swimlanes.jade');
  assert.ok(/template\(name="addListInline"\)/.test(swim), 'inline composer template');
  assert.ok(/if isAddListAfter _id\s*\n\s*\+addListInline/.test(swim), 'composer renders after the targeted list');
  const js = read('client/components/swimlanes/swimlanes.js');
  assert.ok(/'click \.js-add-list-here'|js-add-list-here/.test(read('client/components/lists/listHeader.js')),
    'header button handler');
  assert.ok(/isAddListAfter\(listId\)/.test(js), 'isAddListAfter helper');
});

test('#6465: the standing leading Add List column is replaced by empty-state gating', () => {
  const swim = read('client/components/swimlanes/swimlanes.jade');
  // The non-mini swimlane + listsGroup branches now only show the composer for an
  // empty swimlane/board (swimlaneHasNoLists / boardHasNoLists), instead of an
  // unconditional leading +addListForm column. (The mini-screen path is unchanged.)
  assert.ok(/if swimlaneHasNoLists/.test(swim) && /if boardHasNoLists/.test(swim),
    'non-mini branches gate the composer on the empty state');
});

test('#6465: empty swimlane/board shows a + button that reveals the form on click', () => {
  const swim = read('client/components/swimlanes/swimlanes.jade');
  // The empty state renders a + button; the composer appears only once it is open.
  assert.ok(/js-open-empty-add-list/.test(swim), 'empty state shows a + button');
  assert.ok(/if isEmptyAddListOpen[\s\S]{0,60}\+addListInline/.test(swim),
    'the create-list form is gated behind isEmptyAddListOpen (revealed by the button)');
  const js = read('client/components/swimlanes/swimlanes.js');
  assert.ok(/isEmptyAddListOpen\(swimlaneId\)/.test(js), 'reveal helper');
  assert.ok(/'click \.js-open-empty-add-list': openEmptyAddList/.test(js), 'button opens the composer');
  assert.ok(/Session\.set\('wekan-add-list-empty'/.test(js), 'reveal is scoped to the clicked swimlane');
});

// --- #6465: minicard white-space + swimlane header clip CSS ---
test('#6465: minicard title viewer no longer reserves empty height', () => {
  const css = read('client/components/cards/minicard.css');
  const i = css.indexOf('.minicard .minicard-title .viewer {');
  assert.ok(i !== -1);
  // Window (not brace-matched — a `}` lives inside the explanatory comment).
  const block = css.slice(i, i + 800);
  assert.ok(/min-height:\s*0\b/.test(block), 'min-height:0 collapses the reserved band');
});

test('#6465: swimlane header does not clip at non-100% zoom', () => {
  const css = read('client/components/swimlanes/swimlanes.css');
  const i = css.indexOf('.swimlane .swimlane-header-wrap .swimlane-header {');
  assert.ok(i !== -1);
  const block = css.slice(i, css.indexOf('}', i));
  assert.ok(/overflow:\s*visible/.test(block), 'overflow:visible so the gray bar cannot be sliced');
  assert.ok(/height:\s*auto/.test(block), 'height:auto so it grows to fit');
});

// --- #6478: confirmation before a high-impact cross-swimlane list move on touch ---
test('#6478: cross-swimlane list move confirms on touch/small screens', () => {
  const js = read('client/components/swimlanes/swimlanes.js');
  const i = js.indexOf('if (isDifferentSwimlane) {');
  assert.ok(i !== -1, 'the swimlane-move branch exists');
  const block = js.slice(i, i + 1500);
  assert.ok(/isMiniScreen\(\)\s*\|\|\s*Utils\.isTouchScreenOrShowDesktopDragHandles\(\)/.test(block),
    'gated on touch / small screen');
  assert.ok(/window\.confirm\(TAPi18n\.__\('confirm-move-list-to-swimlane'\)\)/.test(block),
    'shows a confirmation');
  // NEGATIVE guard: a decline must abort (return) before applying the move.
  assert.ok(/!window\.confirm/.test(block) && /\n\s*return;/.test(block),
    'declining aborts the move (return before applying)');
});

console.log(`\nAll ${passed} Upcoming UI guard tests passed`);
