'use strict';

// Pure decision for List.move(boardId, swimlaneId) — no DB access, so it is
// unit-testable (tests/listMoveSwimlane.test.cjs). models/lists.js applies it.
//
// #6670 "Lists lose swimlane ID". Moving a list to another swimlane ON THE SAME
// BOARD did not bind it to that swimlane, so the list stayed board-wide and
// rendered under every swimlane — and deleting it from one swimlane deleted the
// one and only list document, i.e. it vanished from all of them.
//
// The cause was that move() looked for "a list with this title on the target
// board" to merge into, without first asking whether the target board IS this
// list's board. On a same-board move that search finds THIS LIST, so the merge
// branch was taken, and the merge branch is the one branch that never writes a
// swimlaneId — only the create-on-another-board branch did. The user's chosen
// swimlane was therefore discarded every time.
//
// Merging is only meaningful across boards, where a list of the same name may
// already exist. On the same board a move is a re-bind (and a reposition), so
// that is what this plans:
//
//   same board                -> 'rebind'  (this list, set its swimlaneId)
//   other board, name exists  -> 'merge'   (move the cards into that list)
//   other board, name is new  -> 'create'  (make the list there, bound)
//
// An empty targetSwimlaneId is a deliberate un-bind: the list becomes
// board-wide again, which is what shared lists were before per-swimlane lists
// and is still a legitimate layout.

function planListMove({
  listId,
  listBoardId,
  listSwimlaneId,
  targetBoardId,
  targetSwimlaneId,
  existingListId,
} = {}) {
  const swimlaneId = typeof targetSwimlaneId === 'string' ? targetSwimlaneId : '';
  const current = typeof listSwimlaneId === 'string' ? listSwimlaneId : '';

  if (listBoardId === targetBoardId) {
    return {
      action: 'rebind',
      listId,
      swimlaneId,
      // Writing the same value again would be a pointless update, and the
      // before/after hooks it triggers are not free on a large board.
      rebind: current !== swimlaneId,
    };
  }

  if (existingListId) {
    // The destination board's own list keeps its own swimlane binding; only the
    // cards travel.
    return { action: 'merge', listId: existingListId, swimlaneId, rebind: false };
  }

  return { action: 'create', listId: null, swimlaneId, rebind: false };
}

module.exports = { planListMove };
