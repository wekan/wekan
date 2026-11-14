// #6902: Board Settings / Swimlane / "One shared list header row" (#2805) is
// the Swimlanes view as it was before lists belonged to one swimlane: every
// swimlane shows the SAME lists - all of the board's lists, in their order -
// under the one header row, and the swimlanes scroll sideways together.
//
// Nothing is written to a list or a card. A board made while lists were per
// swimlane, with different lists in each, shows the union of them in every
// swimlane while the setting is on; each list still holds only the cards of
// the swimlane it is shown in (filterCardsByListAndSwimlane, models/lists.js),
// and turning the setting off shows each swimlane's own lists again.
//
// No Meteor imports, so tests/sharedListRow6902.test.cjs drives it with plain
// objects.

export const SHARED_SWIMLANE_SELECTOR = '.board-canvas.shared-list-headers .js-swimlane';

// Whether the board shows the same lists in every swimlane.
export function hasSharedListRow(board) {
  return !!(board && typeof board.hasSharedListHeaders === 'function' && board.hasSharedListHeaders());
}

// The selector of the lists a swimlane shows when the board has the shared
// row: every list of the board that is not archived or deleted.
export function sharedListSelector(boardId) {
  return { boardId, archived: false, deletedAt: null };
}

// Scrolls every other swimlane of the same board canvas to `source`'s
// horizontal position. `recent` remembers what each one was set to, so the
// scroll event that setting fires is not passed on again: otherwise a swimlane
// that cannot scroll as far (a shorter row) would pull the others back to its
// own limit. Returns how many swimlanes were moved.
export function syncSharedSwimlaneScroll(source, swimlanes, recent) {
  if (!source || !swimlanes) return 0;
  if (recent && recent.has(source)) {
    const expected = recent.get(source);
    recent.delete(source);
    if (expected === source.scrollLeft) return 0;
  }
  let moved = 0;
  for (const lane of swimlanes) {
    if (!lane || lane === source || lane.scrollLeft === source.scrollLeft) continue;
    lane.scrollLeft = source.scrollLeft;
    if (recent) recent.set(lane, lane.scrollLeft);
    moved += 1;
  }
  return moved;
}

// Installs one capturing scroll listener on `doc` (scroll events do not
// bubble) that keeps the swimlanes of a shared-row board together. Boards
// without the setting are not matched by SHARED_SWIMLANE_SELECTOR and are left
// alone. Safe to call more than once.
export function installSharedSwimlaneScroll(doc) {
  if (!doc || doc.__wekanSharedSwimlaneScroll) return false;
  doc.__wekanSharedSwimlaneScroll = true;
  const recent = new WeakMap();
  doc.addEventListener('scroll', (event) => {
    const lane = event.target;
    if (!lane || typeof lane.matches !== 'function' || !lane.matches(SHARED_SWIMLANE_SELECTOR)) return;
    const canvas = lane.closest('.board-canvas');
    if (!canvas) return;
    syncSharedSwimlaneScroll(lane, Array.from(canvas.querySelectorAll('.js-swimlane')), recent);
  }, { capture: true, passive: true });
  return true;
}
