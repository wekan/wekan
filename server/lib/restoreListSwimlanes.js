import Lists from '/models/lists';
import PositionHistory from '/models/positionHistory';
import Swimlanes from '/models/swimlanes';
import { planListSwimlaneRestore } from '/models/lib/listSwimlaneRestore';

// Server side of the #6670 restore: put back the swimlane a list was bound to
// before the pre-#6515 automatic repair cleared it. What may be restored and why
// is decided in /models/lib/listSwimlaneRestore.js (pure, unit-tested); this
// gathers the three collections it needs and applies the plan.
//
// Used by:
//   * server/lib/systemStatus.js -> the "Lists missing their swimlane N" problem
//     in Admin Panel / Problems / Summary (count only, no writes)
//   * server/methods/restoreListSwimlanes.js -> the Restore button beside it
//
// Reads are scoped to what the plan can possibly use: only UNBOUND lists, and
// only the list rows of positionHistory. On a big installation this is the
// difference between a page load and a table scan of every card's history.

async function loadPlanInputs() {
  const [lists, history, swimlanes] = await Promise.all([
    Lists.find(
      { $or: [{ swimlaneId: { $exists: false } }, { swimlaneId: null }, { swimlaneId: '' }] },
      { fields: { _id: 1, boardId: 1, title: 1, swimlaneId: 1 } },
    ).fetchAsync(),
    PositionHistory.find(
      { entityType: 'list' },
      { fields: { entityType: 1, entityId: 1, boardId: 1, originalSwimlaneId: 1 } },
    ).fetchAsync(),
    Swimlanes.find({}, { fields: { _id: 1, boardId: 1, title: 1 } }).fetchAsync(),
  ]);
  return { lists, history, swimlanes };
}

// What could be restored right now. Never writes, so it is safe to poll from the
// Problems page (it reloads every 30 seconds).
export async function planRestorableListSwimlanes() {
  try {
    const { lists, history, swimlanes } = await loadPlanInputs();
    return planListSwimlaneRestore(lists, history, swimlanes);
  } catch (error) {
    // A detection that throws must not take the whole Problems overview down
    // with it - the other problems on that page are what an admin came for.
    console.error('[restoreListSwimlanes] detection failed:', error);
    return [];
  }
}

export async function countRestorableListSwimlanes() {
  return (await planRestorableListSwimlanes()).length;
}

// Apply it. Idempotent: a list that already has a swimlaneId is never in the
// plan, so running this twice restores nothing the second time.
//
// Writes go through `.direct`, like every other repair here: this is putting a
// value back, not a user moving a list, so it should not raise activities or
// notifications for everybody watching the board.
export async function restoreListSwimlanes() {
  const plan = await planRestorableListSwimlanes();

  // One update per swimlane rather than per list: a board that lost thirty
  // lists across three swimlanes is three writes, not thirty.
  const bySwimlane = new Map();
  for (const item of plan) {
    if (!bySwimlane.has(item.swimlaneId)) bySwimlane.set(item.swimlaneId, []);
    bySwimlane.get(item.swimlaneId).push(item.listId);
  }

  let restored = 0;
  for (const [swimlaneId, listIds] of bySwimlane) {
    await Lists.direct.updateAsync(
      { _id: { $in: listIds } },
      { $set: { swimlaneId } },
      { multi: true },
    );
    restored += listIds.length;
  }

  const boards = new Set(plan.map(item => item.boardId));
  return {
    restored,
    boardsAffected: boards.size,
    // What is left afterwards, counted the same way the Problems page counts it,
    // so the number reported back matches what the page shows on reload.
    remaining: await countRestorableListSwimlanes(),
  };
}
