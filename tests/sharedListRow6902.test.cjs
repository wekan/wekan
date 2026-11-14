'use strict';
// #6902: with Board Settings / Swimlane / "One shared list header row" every
// swimlane shows the same lists - all of the board's - and the swimlanes
// scroll sideways together, as swimlanes were before lists belonged to one.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const load = () => import('../client/components/swimlanes/sharedListRow.js');

// A swimlane that clamps scrollLeft to how far its row can scroll.
function lane(max = 1000, scrollLeft = 0) {
  return {
    max,
    _x: scrollLeft,
    get scrollLeft() { return this._x; },
    set scrollLeft(v) { this._x = Math.max(0, Math.min(this.max, v)); },
  };
}

test('the setting, and the lists every swimlane then shows', async () => {
  const { hasSharedListRow, sharedListSelector } = await load();
  assert.equal(hasSharedListRow({ hasSharedListHeaders: () => true }), true);
  assert.equal(hasSharedListRow({ hasSharedListHeaders: () => false }), false);
  assert.equal(hasSharedListRow({}), false);
  assert.equal(hasSharedListRow(null), false);
  // Every list of the board, whatever swimlane it was made in, but not an
  // archived or deleted one.
  assert.deepEqual(sharedListSelector('b1'), { boardId: 'b1', archived: false, deletedAt: null });
  assert.equal('swimlaneId' in sharedListSelector('b1'), false, 'not limited to one swimlane');
});

test('scrolling one swimlane scrolls the others to the same place', async () => {
  const { syncSharedSwimlaneScroll } = await load();
  const a = lane(); const b = lane(); const c = lane();
  const recent = new WeakMap();
  a.scrollLeft = 300;
  assert.equal(syncSharedSwimlaneScroll(a, [a, b, c], recent), 2);
  assert.equal(b.scrollLeft, 300);
  assert.equal(c.scrollLeft, 300);
  // The scroll events that setting fires on b and c are not passed on again.
  assert.equal(syncSharedSwimlaneScroll(b, [a, b, c], recent), 0);
  assert.equal(syncSharedSwimlaneScroll(c, [a, b, c], recent), 0);
  // The user then scrolls b: that is passed on.
  b.scrollLeft = 120;
  assert.equal(syncSharedSwimlaneScroll(b, [a, b, c], recent), 2);
  assert.equal(a.scrollLeft, 120);
  assert.equal(c.scrollLeft, 120);
});

test('negative: a swimlane that cannot scroll as far does not pull the others back', async () => {
  const { syncSharedSwimlaneScroll } = await load();
  const wide = lane(1000); const short = lane(200);
  const recent = new WeakMap();
  wide.scrollLeft = 800;
  syncSharedSwimlaneScroll(wide, [wide, short], recent);
  assert.equal(short.scrollLeft, 200, 'clamped to its own limit');
  // Its own scroll event, at 200, is the one this set - not a user scroll.
  assert.equal(syncSharedSwimlaneScroll(short, [wide, short], recent), 0);
  assert.equal(wide.scrollLeft, 800, 'the wide row stays where the user put it');
  assert.equal(syncSharedSwimlaneScroll(null, [wide], recent), 0);
  assert.equal(syncSharedSwimlaneScroll(wide, null, recent), 0);
});

test('the scroll listener is installed once, capturing, and only for shared-row boards', async () => {
  const { installSharedSwimlaneScroll, SHARED_SWIMLANE_SELECTOR } = await load();
  assert.equal(SHARED_SWIMLANE_SELECTOR, '.board-canvas.shared-list-headers .js-swimlane');
  const added = [];
  const doc = { addEventListener: (type, fn, options) => added.push({ type, fn, options }) };
  assert.equal(installSharedSwimlaneScroll(doc), true);
  assert.equal(installSharedSwimlaneScroll(doc), false);
  assert.equal(added.length, 1);
  assert.equal(added[0].type, 'scroll');
  assert.equal(added[0].options.capture, true, 'scroll events do not bubble');
  assert.equal(added[0].options.passive, true);
  // A swimlane of a board without the setting is not matched: left alone.
  const other = lane(); const plain = { ...lane(), matches: () => false, closest: () => { throw new Error('not reached'); } };
  plain.scrollLeft = 50;
  added[0].fn({ target: plain });
  assert.equal(other.scrollLeft, 0);
  // A shared-row board's swimlane moves its siblings in the same canvas.
  const sibling = lane();
  const source = lane();
  const canvas = { querySelectorAll: () => [source, sibling] };
  source.matches = sel => sel === SHARED_SWIMLANE_SELECTOR;
  source.closest = () => canvas;
  source.scrollLeft = 70;
  added[0].fn({ target: source });
  assert.equal(sibling.scrollLeft, 70);
});

test('the Swimlanes view uses it: lists, empty state, opened list, list drop and scrolling', () => {
  const js = read('client/components/swimlanes/swimlanes.js');
  assert.match(js, /if \(typeof document !== 'undefined'\) installSharedSwimlaneScroll\(document\);/);
  const lists = js.slice(js.indexOf('  lists() {'), js.indexOf('// Additionally, detect lists whose swimlaneId'));
  assert.match(lists, /if \(hasSharedListRow\(ReactiveCache\.getBoard\(swimlane\.boardId\)\)\) \{\s*\n\s*return ReactiveCache\.getLists\(sharedListSelector\(swimlane\.boardId\), \{ sort: \['sort'\] \}\);/);
  const empty = js.slice(js.indexOf('  swimlaneHasNoLists() {'), js.indexOf('  isEmptyAddListOpen('));
  assert.match(empty, /hasSharedListRow\(ReactiveCache\.getBoard\(this\.boardId\)\)/);
  const current = js.slice(js.indexOf('function currentListIsInThisSwimlane('), js.indexOf('function currentCardIsInThisList('));
  assert.match(current, /if \(hasSharedListRow\(Utils\.getCurrentBoard\(\)\)\) return true;/);
  // Negative: a list dropped under another swimlane is never moved there,
  // which would re-home every card of the list.
  assert.match(js, /const isDifferentSwimlane =\s*\n\s*!hasSharedListRow\(ReactiveCache\.getBoard\(list\.boardId\)\) &&\s*\n\s*originalSwimlaneId &&/);
  // Nothing is written by the setting: no list or card update in the module.
  const mod = read('client/components/swimlanes/sharedListRow.js');
  assert.doesNotMatch(mod, /updateAsync|insertAsync|Meteor\.call/);
  // Cards still come from the swimlane a list is shown in.
  assert.match(read('client/components/lists/listBody.jade'), /each \(cardsWithLimit \(idOrNull containerSwimlaneId\)\)/);
  assert.match(read('models/lists.js'), /return cardSwimlaneId === swimlaneId;/);
});
