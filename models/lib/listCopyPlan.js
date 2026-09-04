'use strict';

// Pure decision for List.copy(boardId, swimlaneId, cardIdMap) — no DB access, so
// it is unit-testable (tests/listCopySwimlane.test.cjs). models/lists.js applies
// it. This is the copy-side twin of models/lib/listMovePlan.js, and it exists
// because List.copy carried both of the faults #6670 fixed in List.move, plus
// one of its own.
//
// 1. WHICH CARDS TRAVEL. copy() selected them with
//
//      { swimlaneId: this.swimlaneId || null, listId: oldId, archived: false }
//
//    A list that is not bound to a swimlane — an empty or missing swimlaneId,
//    which is what every list on a board predating per-swimlane lists still has
//    — turned that into `swimlaneId: null`, while its cards carry the real
//    swimlaneIds of the swimlanes they are in. The selector therefore matched
//    NOTHING and the copy produced an empty list. Even for a bound list the
//    filter could only ever remove cards that are in the list being copied.
//
//    A list is the unit of a copy: every card in it travels, exactly as in
//    List.move (`for (const card of await this.cards())`). So the selector is
//    the list's own cards, unfiltered by swimlane.
//
// 2. WHICH LIST IS WRITTEN INTO. copy() searched the TARGET board for a list
//    with this title to reuse, without first asking whether the target board IS
//    this list's own board. On a same-board copy that search finds THIS LIST,
//    so `_id` became the original: the "copy" wrote the cards back into the
//    source list, doubling them, and returned the source list's id — which the
//    REST endpoint then repositioned, moving the original the user had asked to
//    copy. Same shape as the #6670 bug in List.move.
//
//    Reusing a same-titled list is only meaningful across boards. A copy on the
//    same board is always a NEW list, the way Swimlane.copy already creates one
//    ("Always create a new list for the copied swimlane, even if title already
//    exists"), so:
//
//      same board                -> 'create' (a new list, bound to the swimlane)
//      other board, name exists  -> 'merge'  (cards copied into that list)
//      other board, name is new  -> 'create'
//
// An empty targetSwimlaneId is not an error: the copy is board-wide, which is
// what shared lists were before per-swimlane lists and is still a legitimate
// layout. It is also the default of the REST endpoint
// (POST /api/boards/:boardId/lists/:listId/copy with no `toSwimlaneId`), which
// is where fixing (1) raises a question that could not come up while the copy
// was empty: WHERE do the cards land. Pinning every card to the target swimlane
// would, for a board-wide same-board copy, dump the cards of three swimlanes
// into none at all. So when no swimlane is asked for and the copy stays on the
// same board, each card keeps the swimlane it is in and the duplicate looks
// like the original. Across boards it cannot: the source card's swimlaneId
// belongs to the OTHER board and would be orphaned there, so those cards take
// the copy's own (possibly empty) swimlane.

function planListCopy({
  listId,
  listBoardId,
  targetBoardId,
  targetSwimlaneId,
  existingListId,
} = {}) {
  const swimlaneId = typeof targetSwimlaneId === 'string' ? targetSwimlaneId : '';

  // Every card of the source list, whatever swimlane each one is in. Scoping
  // this by the list's own swimlaneId is what emptied the copy of a board-wide
  // list, and can never do anything but drop cards that belong to the list.
  const cardSelector = { listId, archived: false };

  const sameBoard = listBoardId === targetBoardId;
  // See the note above: only a same-board copy can keep the cards where they
  // are, and only when the caller named no swimlane to put them in.
  const keepCardSwimlanes = sameBoard && swimlaneId === '';

  if (!sameBoard && existingListId) {
    // The destination board's own list keeps its own swimlane binding; only the
    // cards are copied into it.
    return {
      action: 'merge',
      listId: existingListId,
      swimlaneId,
      keepCardSwimlanes,
      cardSelector,
    };
  }

  return {
    action: 'create',
    listId: null,
    swimlaneId,
    keepCardSwimlanes,
    cardSelector,
  };
}

// The swimlaneId one copied card gets. Kept beside the plan so the rule lives
// in one place and models/lists.js only applies it.
function copiedCardSwimlaneId(plan, card) {
  if (plan && plan.keepCardSwimlanes) {
    const own = card && card.swimlaneId;
    return typeof own === 'string' ? own : '';
  }
  return (plan && plan.swimlaneId) || '';
}

module.exports = { planListCopy, copiedCardSwimlaneId };
