'use strict';

// Pure planner for "restore the swimlane a list was bound to" — no DB access,
// so it is unit-testable (tests/listSwimlaneRestore.test.cjs). The server side
// (server/methods/restoreListSwimlanes.js) applies the plan, and
// Admin Panel / Problems / Summary counts it and offers the button.
//
// WHY THERE IS ANYTHING TO RESTORE. Before #6515 the board data-repair ran
// automatically on startup and on every board open, and it treated ANY list with
// a swimlaneId as #6484 corruption and cleared it:
//
//   await Lists.direct.updateAsync(
//     { _id: { $in: ids }, boardId }, { $set: { swimlaneId: null } }, { multi: true });
//
// A per-swimlane list is a legitimate layout and is indistinguishable from a
// corrupted board-wide one at the data level, so that pass un-bound every
// per-swimlane list on every board it opened. #6515 stopped it; nothing put the
// bindings back, and a list with no swimlaneId renders under EVERY swimlane
// (Swimlanes.myLists), which is #6670 as the user sees it.
//
// WHY THE OLD VALUE IS STILL THERE. That update went through `.direct`, which
// bypasses collection hooks, so it only ever touched the list document. The
// binding a list was created with is recorded separately, in `positionHistory`:
//
//   // models/lists.js — Lists.after.insert -> trackOriginalPosition()
//   originalSwimlaneId: this.swimlaneId || null,
//   ...
//   if (!existingHistory) { PositionHistory.insertAsync(document); }
//
// That insert is insert-ONLY — it is written once, when the list is created, and
// nothing overwrites it afterwards. So for every list created since list
// position tracking landed (2025-10-16, commit 2543df942) the original binding
// survived the un-binding untouched, and can be restored exactly rather than
// guessed at.
//
// WHAT IS DELIBERATELY NOT DONE. Nothing is inferred from the cards. It is
// tempting — "all this list's cards are in one swimlane, so bind it there" — and
// it is wrong: on a board whose second swimlane was added recently every card is
// still in the first one, so inference would bind every list to swimlane 1 and
// hide them from every other swimlane. That is #6484 again, which is the bug the
// un-binding existed to fix in the first place. A list with no recorded original
// is left board-wide, which is a legitimate layout and is what it looks like now
// anyway.

// #6766: the automatic un-binding stopped with #6515, first released in
// v10.31 (2026-07-23). A list created after that release cannot have lost its
// binding to it: if it is board-wide, it is board-wide by design (a list
// created board-wide, or made board-wide since), and binding it back to the
// swimlane it was created in would take it out of every other swimlane. The
// end of the release day, so a list from that day still counts as before it.
// An installation that upgraded later keeps a few such lists board-wide - which
// is what they look like already, and hides nothing.
const LIST_UNBINDING_STOPPED_AT = Date.parse('2026-07-24T00:00:00Z');

/* A list is "unbound" when it renders under every swimlane: no swimlaneId. */
function isUnbound(list) {
  if (!list) return false;
  const id = list.swimlaneId;
  return id === undefined || id === null || id === '';
}

/*
 * Plan the restorations.
 *
 *   lists      [{ _id, boardId, title, swimlaneId }]
 *   history    [{ entityType, entityId, boardId, originalSwimlaneId }]  positionHistory
 *   swimlanes  [{ _id, boardId, title }]                                still existing
 *
 * Returns [{ listId, boardId, swimlaneId, listTitle, swimlaneTitle }], one per
 * list that can be put back exactly. Every rule below is a reason to SKIP:
 * this restores what was recorded, and nothing else.
 */
/*
 *   cardSwimlanes  Map listId -> Set of the swimlaneIds its cards are in
 *                  (archived ones too: restoring one must not hide it).
 *
 * #6766: a list whose cards are in a swimlane other than the one it would be
 * bound to is never restored - binding it would hide those cards ("TE DOEN"
 * used across several swimlanes: 490 cards on one installation).
 */
function planListSwimlaneRestore(lists, history, swimlanes, cardSwimlanes = new Map(), { stoppedAt = LIST_UNBINDING_STOPPED_AT } = {}) {
  const original = new Map();
  for (const entry of Array.isArray(history) ? history : []) {
    if (!entry || entry.entityType !== 'list') continue;
    if (typeof entry.entityId !== 'string' || entry.entityId.length === 0) continue;
    const was = entry.originalSwimlaneId;
    // null is recorded for a list that was created board-wide - there is
    // nothing to restore, and writing '' over '' would be noise.
    if (typeof was !== 'string' || was.length === 0) continue;
    // Created after the un-binding stopped: board-wide by design (#6766).
    const created = entry.createdAt ? new Date(entry.createdAt).getTime() : NaN;
    if (Number.isFinite(created) && created >= stoppedAt) continue;
    original.set(entry.entityId, was);
  }

  const swimlaneById = new Map();
  for (const swimlane of Array.isArray(swimlanes) ? swimlanes : []) {
    if (swimlane && typeof swimlane._id === 'string' && swimlane._id.length > 0) {
      swimlaneById.set(swimlane._id, swimlane);
    }
  }

  const plan = [];
  for (const list of Array.isArray(lists) ? lists : []) {
    if (!list || typeof list._id !== 'string' || list._id.length === 0) continue;
    // Already bound: leave it. This is what makes the repair idempotent, and
    // what stops it overwriting a binding an admin has since set by hand.
    if (!isUnbound(list)) continue;

    const swimlaneId = original.get(list._id);
    if (!swimlaneId) continue;

    // The swimlane has to still exist, and to be on this list's own board -
    // binding a list to a swimlane of another board would hide it everywhere,
    // which is worse than leaving it shared.
    const swimlane = swimlaneById.get(swimlaneId);
    if (!swimlane) continue;
    if (swimlane.boardId !== list.boardId) continue;

    // Its cards are elsewhere too: binding it would hide them (#6766).
    const inSwimlanes = cardSwimlanes instanceof Map ? cardSwimlanes.get(list._id) : null;
    if (inSwimlanes && [...inSwimlanes].some(id => id !== swimlaneId)) continue;

    plan.push({
      listId: list._id,
      boardId: list.boardId,
      swimlaneId,
      listTitle: typeof list.title === 'string' ? list.title : '',
      swimlaneTitle: typeof swimlane.title === 'string' ? swimlane.title : '',
    });
  }
  return plan;
}

module.exports = { planListSwimlaneRestore, isUnbound, LIST_UNBINDING_STOPPED_AT };
