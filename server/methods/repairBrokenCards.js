import { Meteor } from 'meteor/meteor';
import { ReactiveCache } from '/imports/reactiveCache';
import Boards from '/models/boards';
import Cards from '/models/cards';
import Lists from '/models/lists';
import Swimlanes from '/models/swimlanes';
import { repairAllBoards } from '/server/lib/repairBoardData';
import { setBoardRepairStatus } from '/server/lib/systemStatus';
import {
  brokenCardsSelector,
  repairableCardsSelector,
  unfixableCardsSelector,
  planBrokenCardRepair,
} from '/models/lib/brokenCardsRepair';

// Admin Panel → Problems → Summary: the "Repair" button behind the
// "Broken cards N" problem (client/components/settings/problemsSummary.js).
//
// Why this exists as its own method instead of just calling repairAllBoards():
// the count shown in the Summary (countBrokenCards() in server/lib/systemStatus.js)
// counts every card with a missing boardId OR swimlaneId OR listId, but
// repairAllBoards() only walks NON-ARCHIVED boards and only ever fixes
// swimlaneId. So three kinds of counted card could never be repaired by anything
// in the app, and the count sat there forever with nothing an admin could press:
//
//   * cards on an ARCHIVED board          — skipped by repairAllBoards()
//   * cards with a missing/empty listId   — no repair ever set listId
//   * cards with a missing/empty boardId  — belong to no board at all, so no
//                                           per-board pass can reach them
//
// The first two are repaired here (assigned to the board's first usable list /
// swimlane, creating one if the board has none). The third cannot be repaired
// automatically — there is no way to know which board an orphan belonged to, and
// guessing would move a user's card onto an unrelated board — so those are
// reported back as `unfixable` for the admin to deal with, never deleted.
//
// Idempotent: running it twice is harmless. Writes go through `.direct` so
// collection hooks (activities, notifications) do not fire for a repair.

// The board's first usable list / swimlane, creating a default one when the
// board has none. Mirrors firstSwimlaneId() in /server/lib/repairBoardData.js.
async function firstListId(boardId) {
  const existing = await Lists.findOneAsync(
    { boardId, type: { $ne: 'template-list' }, archived: false },
    { sort: { sort: 1 } },
  );
  if (existing) return existing._id;
  return Lists.insertAsync({
    title: 'Default',
    boardId,
    archived: false,
    sort: 0,
    type: 'list',
    swimlaneId: '',
  });
}

async function firstSwimlaneId(boardId) {
  const existing = await Swimlanes.findOneAsync(
    { boardId, type: { $ne: 'template-swimlane' }, archived: false },
    { sort: { sort: 1 } },
  );
  if (existing) return existing._id;
  return Swimlanes.insertAsync({
    title: 'Default',
    boardId,
    archived: false,
    sort: 0,
    type: 'swimlane',
  });
}

// Cards that still have a board but are missing a listId or swimlaneId, on ANY
// board including archived ones. Returns how many of each were fixed.
async function repairCardsMissingListOrSwimlane() {
  const broken = await Cards.find(
    repairableCardsSelector(),
    { fields: { _id: 1, boardId: 1, listId: 1, swimlaneId: 1 } },
  ).fetchAsync();

  // Pure planner (models/lib/brokenCardsRepair.js) decides what each card needs;
  // this function only performs the writes.
  const plan = planBrokenCardRepair(broken);
  const needsList = new Set(plan.needsList);
  const needsSwimlane = new Set(plan.needsSwimlane);

  let listsAssigned = 0;
  let swimlanesAssigned = 0;
  // Resolve each board's default list/swimlane ONCE, not once per card: a board
  // with hundreds of broken cards would otherwise re-query (and possibly
  // re-create) them for every single card.
  const listByBoard = new Map();
  const swimlaneByBoard = new Map();

  for (const card of broken) {
    try {
      const set = {};
      if (needsList.has(card._id)) {
        if (!listByBoard.has(card.boardId)) {
          listByBoard.set(card.boardId, await firstListId(card.boardId));
        }
        set.listId = listByBoard.get(card.boardId);
      }
      if (needsSwimlane.has(card._id)) {
        if (!swimlaneByBoard.has(card.boardId)) {
          swimlaneByBoard.set(card.boardId, await firstSwimlaneId(card.boardId));
        }
        set.swimlaneId = swimlaneByBoard.get(card.boardId);
      }
      if (Object.keys(set).length === 0) continue;
      await Cards.direct.updateAsync({ _id: card._id }, { $set: set });
      if (set.listId) listsAssigned += 1;
      if (set.swimlaneId) swimlanesAssigned += 1;
    } catch (error) {
      console.error('[repairBrokenCards] card', card._id, error);
    }
  }

  return { listsAssigned, swimlanesAssigned };
}

// Cards whose swimlaneId points at a swimlane that no longer exists, on an
// ARCHIVED board (repairAllBoards only walks archived:false boards, so these are
// counted as broken forever otherwise).
async function repairArchivedBoards() {
  const boards = await Boards.find({ archived: true }, { fields: { _id: 1 } }).fetchAsync();
  let cardsFixed = 0;
  for (const board of boards) {
    try {
      const swimlaneIds = new Set(
        (await Swimlanes.find({ boardId: board._id }, { fields: { _id: 1 } }).fetchAsync())
          .map(s => s._id),
      );
      const orphans = (await Cards.find(
        { boardId: board._id },
        { fields: { _id: 1, swimlaneId: 1 } },
      ).fetchAsync()).filter(
        c => typeof c.swimlaneId === 'string' && c.swimlaneId.length > 0 && !swimlaneIds.has(c.swimlaneId),
      );
      if (orphans.length === 0) continue;
      const swimlaneId = await firstSwimlaneId(board._id);
      await Cards.direct.updateAsync(
        { _id: { $in: orphans.map(c => c._id) } },
        { $set: { swimlaneId } },
        { multi: true },
      );
      cardsFixed += orphans.length;
    } catch (error) {
      console.error('[repairBrokenCards] archived board', board._id, error);
    }
  }
  return cardsFixed;
}

Meteor.methods({
  // Run every broken-card repair. Admin only. Returns what was fixed plus the
  // remaining count, so the Summary can show the result immediately.
  async repairBrokenCards() {
    if (!this.userId || !(await ReactiveCache.getUser(this.userId))?.isAdmin) {
      throw new Meteor.Error('not-authorized', 'You must be an admin.');
    }
    this.unblock();

    await setBoardRepairStatus({
      running: true,
      phase: 'repairing',
      kind: 'admin-broken-cards',
      startedAt: new Date().toISOString(),
      success: null,
      error: '',
    });

    try {
      // 1. The standard per-board repair (missing/orphaned swimlaneId on every
      //    non-archived board), the same pass that runs on startup.
      const boards = await repairAllBoards();
      // 2. The gaps that pass does not cover.
      const archivedCardsFixed = await repairArchivedBoards();
      const { listsAssigned, swimlanesAssigned } = await repairCardsMissingListOrSwimlane();

      // What is left: cards with no boardId cannot be placed on any board.
      // `remaining` uses the SAME selector the Summary counts with, so the
      // number reported back matches what the page shows after reloading.
      const unfixable = await Cards.find(unfixableCardsSelector()).countAsync();
      const remaining = await Cards.find(brokenCardsSelector()).countAsync();

      const summary = {
        boardsScanned: boards.boardsScanned,
        cardsAssigned: boards.cardsAssigned,
        cardsRescued: boards.cardsRescued,
        archivedCardsFixed,
        listsAssigned,
        swimlanesAssigned,
        unfixable,
        remaining,
      };

      await setBoardRepairStatus({
        running: false,
        phase: 'completed',
        kind: 'admin-broken-cards',
        finishedAt: new Date().toISOString(),
        success: true,
        repaired: summary,
      });
      console.log('[repairBrokenCards] done', summary);
      return summary;
    } catch (error) {
      await setBoardRepairStatus({
        running: false,
        phase: 'error',
        kind: 'admin-broken-cards',
        success: false,
        error: String(error && error.message ? error.message : error).slice(0, 500),
      });
      console.error('[repairBrokenCards]', error);
      throw new Meteor.Error('repair-failed', String(error && error.message ? error.message : error));
    }
  },
});
