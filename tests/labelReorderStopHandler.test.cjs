'use strict';

// Regression guard: reported directly - clicking a label in the Labels
// popup no longer toggled it onto the card (grow wider/apply on first
// click, shrink/remove on second), with the browser console showing
// "Uncaught runtime errors: ERROR card.board is not a function" thrown from
// jQuery UI sortable's `stop` handler (client/components/cards/labels.js,
// the label-reorder drag on `cardLabelsPopup`).
//
// jQuery UI's sortable widget runs its `stop` callback on mouseup whenever a
// drag was registered - which real-world mouse/trackpad clicks can trigger
// even without an intentional drag - so this handler fires far more often
// than "the user actually reordered labels." It used
// `Blaze.getData(this).board()`, where `this` is the sortable's root
// `.edit-labels-pop-over` element: that did not reliably resolve back to a
// real Card document (one with a callable `.board()`), so it threw. An
// uncaught exception inside jQuery UI's own `_clear()` cleanup (which is
// what calls this `stop` callback) aborts the REST of that cleanup, which is
// consistent with the toggle-on-click visuals getting stuck afterward.
//
// The sibling `click .js-select-label` handler two lines below already had
// the right fix for the same "linked card" problem: use the popup
// TEMPLATE's own data (`getCardLabelBoard(...)`, linked-card-aware),
// never `Blaze.getData` on a DOM node that may not carry the card context
// the popup itself was opened with. This pins the `stop` handler to the
// same pattern.
//
// This is a source-read test (no Blaze/jQuery runtime under plain Node).
//
// Run: node tests/labelReorderStopHandler.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(
  path.join(ROOT, 'client', 'components', 'cards', 'labels.js'), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('labelReorderStopHandler:');

test('the sortable stop handler for label reordering exists', () => {
  assert.ok(/stop\(evt, ui\) \{/.test(src));
});

test('it resolves the board via the linked-card-aware getCardLabelBoard(tpl.data), not Blaze.getData(this)', () => {
  const start = src.indexOf('stop(evt, ui) {');
  assert.ok(start !== -1);
  const body = src.slice(start, src.indexOf('},', start));
  assert.ok(/getCardLabelBoard\(tpl\.data\)/.test(body),
    'must resolve the board the same linked-card-aware way as the click handler below it');
  assert.ok(!/const card = Blaze\.getData\(this\)/.test(body),
    'must not go back to resolving the card via Blaze.getData(this) on the sortable\'s '
    + 'root element - that did not reliably carry the card context and threw '
    + '"card.board is not a function" (negative)');
});

test('it guards a missing board before calling setNewLabelOrder', () => {
  const start = src.indexOf('stop(evt, ui) {');
  const body = src.slice(start, src.indexOf('},', start));
  assert.ok(/if \(!board\) return;/.test(body));
});

test('getCardLabelBoard itself falls back through getRealBoard -> board -> current board', () => {
  assert.ok(/const getCardLabelBoard = card =>\s*\n\s*card\?\.getRealBoard\?\.\(\) \|\| card\?\.board\?\.\(\) \|\| Utils\.getCurrentBoard\(\);/.test(src));
});

console.log(`\nlabelReorderStopHandler: ${passed} tests passed`);
