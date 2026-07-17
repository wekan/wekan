'use strict';

// Plain-Node unit test (no Meteor) for the #2769 drag-geometry helpers.
// Run: ELECTRON_RUN_AS_NODE=1 <node> tests/cardDragGeometry.test.cjs
//
// #2769 "Card moves to wrong swimlane when moving to target column where a
// new card is being added": jQuery UI sortable snapshots the geometry of all
// connected .js-minicards containers once at drag start and never notices
// Blaze DOM mutations, so a card reactively inserted mid-drag (another user
// submitting the add-card composer) — or the dragging user's own composer
// being closed by the drag's start callback — shifts every list/swimlane
// below while the cached rectangles stay put. The drop then resolves against
// the stale map: the placeholder is parked in the NEIGHBOURING swimlane's
// list (no drop shadow where the user aims) and the stop handler persists
// that wrong swimlane.
//
// The fix (client/components/lists/listBody.js) observes each list's
// minicards and, when a REAL layout change happens during an active drag,
// calls sortable('refresh') on the drag's source instance. The pure decision
// helpers live in client/lib/cardDragGeometry.js and are tested here.

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const {
  nodeChangesDragGeometry,
  mutationsChangeDragGeometry,
  findActiveCardDrag,
} = require('../client/lib/cardDragGeometry');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// Minimal DOM-node stand-ins (MutationRecord nodes duck-typed).
function el(...classes) {
  return {
    nodeType: 1,
    classList: { contains: c => classes.includes(c) },
  };
}
const textNode = { nodeType: 3 };
function childList(added, removed) {
  return { type: 'childList', addedNodes: added || [], removedNodes: removed || [] };
}

// --- POSITIVE: real layout changes during a drag must trigger a re-measure --

test('#2769: a minicard inserted by another user mid-drag is a geometry change', () => {
  // Blaze inserts <a class="minicard-wrapper js-minicard"> when the other
  // user's Cards.insert arrives over DDP — the exact trigger of the issue.
  const mutations = [childList([el('minicard-wrapper', 'js-minicard')], [])];
  assert.strictEqual(mutationsChangeDragGeometry(mutations), true);
});

test('the add-card composer opening mid-drag is a geometry change', () => {
  const mutations = [childList([el('inlined-form', 'js-inlined-form')], [])];
  assert.strictEqual(mutationsChangeDragGeometry(mutations), true);
});

test('the add-card composer CLOSING mid-drag is a geometry change (removal counts)', () => {
  // The drag start callback closes the open composer via EscapeActions —
  // after sortable already snapshotted the layout that still contained it.
  const mutations = [childList([], [el('inlined-form', 'js-inlined-form')])];
  assert.strictEqual(mutationsChangeDragGeometry(mutations), true);
});

test('an element without a usable classList is conservatively a geometry change', () => {
  assert.strictEqual(nodeChangesDragGeometry({ nodeType: 1 }), true);
});

test('a mixed batch (placeholder churn plus a real insertion) is a geometry change', () => {
  const mutations = [
    childList([el('ui-sortable-placeholder', 'minicard-wrapper', 'placeholder')], []),
    childList([el('minicard-wrapper', 'js-minicard')], []),
  ];
  assert.strictEqual(mutationsChangeDragGeometry(mutations), true);
});

// --- NEGATIVE: jQuery UI's own drag churn must NOT trigger a re-measure -----
// (the placeholder moves on every mousemove; reacting to it would re-measure
// the whole board constantly and duplicate the library's own refresh)

test("NEGATIVE: the sortable's own placeholder moving is not a geometry change", () => {
  const placeholder = el('ui-sortable-placeholder', 'minicard-wrapper', 'placeholder');
  const mutations = [
    childList([placeholder], []),
    childList([], [placeholder]),
  ];
  assert.strictEqual(mutationsChangeDragGeometry(mutations), false);
});

test('NEGATIVE: the drag helper clone is not a geometry change', () => {
  const helper = el('ui-sortable-helper', 'minicard-wrapper', 'js-minicard');
  assert.strictEqual(mutationsChangeDragGeometry([childList([helper], [])]), false);
});

test('NEGATIVE: text/comment nodes are not geometry changes', () => {
  assert.strictEqual(mutationsChangeDragGeometry([childList([textNode], [])]), false);
});

test('NEGATIVE: non-childList batches and empty/missing input are ignored', () => {
  assert.strictEqual(mutationsChangeDragGeometry([{ type: 'attributes' }]), false);
  assert.strictEqual(mutationsChangeDragGeometry([]), false);
  assert.strictEqual(mutationsChangeDragGeometry(null), false);
  assert.strictEqual(mutationsChangeDragGeometry([null]), false);
});

// --- Active drag detection ---------------------------------------------------

test('the dragging sortable instance is found even when the mutation is in ANOTHER list', () => {
  // The drag starts in list A; the new card arrives in list B. The refresh
  // must go to A's instance — it owns the cached geometry of all connected
  // containers.
  const idle = { dragging: false, currentItem: null };
  const active = { dragging: true, currentItem: {} };
  assert.strictEqual(findActiveCardDrag([idle, active, idle]), active);
});

test('NEGATIVE: no refresh target when no card drag is running', () => {
  // Ordinary reactive updates (and non-sortable .js-minicards, e.g. the
  // search popup, whose $.data lookup yields undefined) must be no-ops.
  const idle = { dragging: false, currentItem: null };
  assert.strictEqual(findActiveCardDrag([idle, undefined, null]), null);
  assert.strictEqual(findActiveCardDrag([]), null);
  assert.strictEqual(findActiveCardDrag(null), null);
});

test("NEGATIVE: sortable('cancel') aftermath is not an active drag", () => {
  // At drop time list.js calls sortable('cancel'), whose DOM restore fires
  // the observer once more — but sortable has already set dragging=false, so
  // no refresh must run after the drag ended.
  const ended = { dragging: false, currentItem: {} };
  assert.strictEqual(findActiveCardDrag([ended]), null);
});

// --- Wiring: listBody must actually observe and refresh ----------------------

test('listBody.js wires the observer to the helpers and refreshes the active drag', () => {
  const src = fs.readFileSync(
    path.join(__dirname, '..', 'client', 'components', 'lists', 'listBody.js'),
    'utf8',
  );
  assert.ok(
    src.includes("from '/client/lib/cardDragGeometry'"),
    'listBody.js must import the geometry helpers',
  );
  assert.ok(
    src.includes('new MutationObserver'),
    'listBody.js must observe minicard DOM changes',
  );
  assert.ok(
    src.includes('mutationsChangeDragGeometry(mutations)'),
    'the observer must filter out placeholder/helper churn',
  );
  assert.ok(
    src.includes('findActiveCardDrag('),
    'the observer must locate the active drag instance',
  );
  assert.ok(
    src.includes('active.refresh()'),
    "the active drag's cached geometry must be re-measured",
  );
  assert.ok(
    src.includes('dragGeometryObserver.disconnect()'),
    'the observer must be disconnected when the list body is destroyed',
  );
});

console.log(`\n${passed} passing`);
