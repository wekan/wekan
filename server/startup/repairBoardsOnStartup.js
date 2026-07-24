import { Meteor } from 'meteor/meteor';
import { repairAllBoards } from '/server/lib/repairBoardData';
import {
  getRepairMarkerVersion,
  setRepairMarkerVersion,
  setBoardRepairStatus,
} from '/server/lib/systemStatus';

// Run the shared board data-repairs (models/lib/boardRepair.js) once, SERVER-SIDE,
// in the background — so corrupted data is fixed even if no user opens the board
// and without anyone watching a progress page. Board open still repairs per board
// for anything corrupted after this pass.
//
// Version-gated (a full scan of every board is expensive, so it must not run on
// every boot): bump REPAIR_VERSION when the repair set changes to make it run once
// more. Progress is persisted (setBoardRepairStatus) so the Admin Panel / Problems
// Status page and `snap run wekan.problems` can see it while it runs.

const REPAIR_VERSION = 1;

// Wait this long after startup so the pass does not compete with boot / first
// requests, then run detached.
const START_DELAY_MS = 30 * 1000;
const PERSIST_EVERY = 25; // persist progress every N boards

Meteor.startup(() => {
  if (!Meteor.isServer) return;
  if (process.env.WEKAN_SKIP_STARTUP_REPAIR === 'true') return;

  Meteor.setTimeout(() => {
    (async () => {
      try {
        const done = await getRepairMarkerVersion();
        if (done >= REPAIR_VERSION) return; // already run for this version

        await setBoardRepairStatus({
          running: true,
          phase: 'repairing',
          kind: 'startup-repair',
          boardsDone: 0,
          boardsTotal: 0,
          startedAt: new Date().toISOString(),
          success: null,
          error: '',
        });

        const summary = await repairAllBoards((boardsDone, boardsTotal, totals) => {
          // Persist INTERMEDIATE progress only. The terminal (boardsDone ===
          // boardsTotal) update is deliberately NOT written here: it carries
          // running:true and, being fire-and-forget, could land AFTER the awaited
          // "completed, running:false" write below and pin the status at "running
          // 146/146 boards" forever (#6520). The completion write owns the final
          // state; the getInProgress read guard (isStatusActive) is the backstop.
          if (boardsDone < boardsTotal && boardsDone % PERSIST_EVERY === 0) {
            setBoardRepairStatus({
              running: true, phase: 'repairing', kind: 'startup-repair',
              boardsDone, boardsTotal, repaired: { ...totals },
            });
          }
        });

        await setRepairMarkerVersion(REPAIR_VERSION, summary);
        await setBoardRepairStatus({
          running: false, phase: 'completed', kind: 'startup-repair',
          finishedAt: new Date().toISOString(), success: true, repaired: summary,
        });
        console.log('[repairBoardsOnStartup] done', summary);
      } catch (error) {
        await setBoardRepairStatus({
          running: false, phase: 'error', kind: 'startup-repair',
          success: false, error: String(error && error.message ? error.message : error).slice(0, 500),
        });
        console.error('[repairBoardsOnStartup]', error);
      }
    })();
  }, START_DELAY_MS);
});
