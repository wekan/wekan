import Boards from '/models/boards';
import Cards from '/models/cards';
import Lists from '/models/lists';
import Swimlanes from '/models/swimlanes';
import { planBoardRepair, repairCounts } from '/models/lib/boardRepair';

// Server side of the shared board data-repairs (see models/lib/boardRepair.js for
// what is repaired and why). Used by BOTH:
//   * board open  -> server/methods/repairBoardData.js (boardRepairNeeded /
//     repairBoardData), driven by client/components/boards/boardBody.js
//   * the MongoDB <-> FerretDB v1 (SQLite) text migration ->
//     server/methods/migrateTextDatabase.js runs repairAllBoards() on the live
//     database before copying, so the migrated copy is clean too.
// All writes go through `.direct` (skip collection hooks) and are idempotent, so
// re-running is safe.

async function loadBoardData(boardId) {
  const [swimlanes, lists, cards] = await Promise.all([
    Swimlanes.find({ boardId }).fetchAsync(),
    Lists.find({ boardId }).fetchAsync(),
    Cards.find({ boardId }).fetchAsync(),
  ]);
  return { swimlanes, lists, cards };
}

// The board's first usable swimlane (non-archived, non-template, lowest sort);
// creates a 'Default' swimlane if the board has none.
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

// Detect (no writes) what a board needs repaired. Returns
// { listsUnbound, cardsAssigned, cardsRescued, total }.
export async function detectBoardRepairs(boardId) {
  const { swimlanes, lists, cards } = await loadBoardData(boardId);
  return repairCounts(planBoardRepair(swimlanes, lists, cards));
}

// Apply the repairs for one board. Returns the same counts (what was fixed).
export async function runBoardRepair(boardId) {
  const { swimlanes, lists, cards } = await loadBoardData(boardId);
  const plan = planBoardRepair(swimlanes, lists, cards);
  const counts = repairCounts(plan);
  if (counts.total === 0) return counts;

  // #6484: un-bind board-wide lists (clear swimlaneId to null).
  if (plan.listsUnbind.length > 0) {
    await Lists.direct.updateAsync(
      { _id: { $in: plan.listsUnbind }, boardId },
      { $set: { swimlaneId: null } },
      { multi: true },
    );
  }

  // Missing-swimlane and orphaned cards -> the board's first swimlane, so they
  // become visible again in the Swimlanes view.
  const cardsToFix = plan.cardsMissing.concat(plan.cardsOrphaned);
  if (cardsToFix.length > 0) {
    const swimlaneId = await firstSwimlaneId(boardId);
    await Cards.direct.updateAsync(
      { _id: { $in: cardsToFix }, boardId },
      { $set: { swimlaneId } },
      { multi: true },
    );
  }

  return counts;
}

// Repair every (non-archived) board. onProgress(done, total, totals) is called
// after each board so a caller (the DB migration) can report progress. Never
// throws for a single bad board — it logs and continues.
export async function repairAllBoards(onProgress) {
  const boards = await Boards.find(
    { archived: false },
    { fields: { _id: 1 } },
  ).fetchAsync();
  const total = boards.length;
  let done = 0;
  const totals = { boardsRepaired: 0, listsUnbound: 0, cardsAssigned: 0, cardsRescued: 0 };
  for (const board of boards) {
    try {
      const counts = await runBoardRepair(board._id);
      totals.listsUnbound += counts.listsUnbound;
      totals.cardsAssigned += counts.cardsAssigned;
      totals.cardsRescued += counts.cardsRescued;
      if (counts.total > 0) totals.boardsRepaired += 1;
    } catch (error) {
      console.error('[repairAllBoards] board', board._id, error);
    }
    done += 1;
    if (typeof onProgress === 'function') {
      try { onProgress(done, total, totals); } catch (_) {}
    }
  }
  return { boardsScanned: total, ...totals };
}
