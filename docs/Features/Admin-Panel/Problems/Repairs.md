# Admin Panel → Problems: automatic board data-repairs

Status: **Implemented** · Owner: xet7 · Related: `models/lib/boardRepair.js`,
`models/lib/listUnbindRepair.js`, `server/lib/repairBoardData.js`,
`server/methods/repairBoardData.js`, `server/startup/repairBoardsOnStartup.js`,
`client/components/boards/boardBody.js`,
`client/components/settings/migrationProgress.*`.

WeKan repairs a small set of board data problems automatically. All repairs are
**idempotent** (a clean board changes nothing) and **scoped to one board** at a
time.

## What is repaired

| Problem | Symptom | Repair |
| --- | --- | --- |
| **#6484 bound list** | A board-wide list (shown under every swimlane) was nudged in the Swimlanes view and got bound to one swimlane, so it **disappeared from the other swimlanes**. | Clear the list's `swimlaneId` back to `null` (board-wide again). |
| **Missing-swimlane card** | A card with no `swimlaneId` (null / '' / missing) never renders in the Swimlanes view. | Assign it to the board's first swimlane (creating a `Default` swimlane if the board has none). |
| **Orphaned card** | A card whose `swimlaneId` points at a **deleted** swimlane is invisible. | Reassign it to the board's first swimlane. A card on an existing but *archived* swimlane is **not** treated as orphaned. |

The decision of what to fix is a pure, unit-tested planner
(`models/lib/boardRepair.js`, `planBoardRepair`); the server applies it
(`server/lib/repairBoardData.js`).

## When repairs run

The **same** repair set runs in three places, so it does not depend on any one
trigger — in particular it does **not** depend on a user staying on a progress
page:

1. **Server startup** — `server/startup/repairBoardsOnStartup.js` runs the repairs
   across every board once, in the background, ~30 s after boot. It is
   **version-gated** (a full scan is expensive, so it runs once per repair version,
   not on every boot) and can be skipped with `WEKAN_SKIP_STARTUP_REPAIR=true`.
2. **Board open** — when a board opens, the client checks `boardRepairNeeded`; if
   something needs fixing and the viewer is a board admin, it runs `repairBoardData`
   for that board. This catches anything corrupted after the startup pass. The
   method completes server-side even if the browser navigates away.
3. **During the database migration** — the MongoDB ↔ SQLite text migration runs the
   repairs on the live database **before** copying, so the migrated copy is clean
   too. See [Migrations.md](Migrations.md).

## Progress dashboard

While a repair (or migration) runs, the shared **migration-progress dashboard** is
shown. It is:

- mounted app-wide, so it appears on a board and on the Admin Panel alike;
- styled in **WeKan blue** (`#2980b9`);
- branded with the configured **Product name** (Admin Panel → Settings → Layout →
  Product name), falling back to `WeKan`.

The startup and migration repairs also **persist** their progress, so Problems →
Status and `snap run wekan.problems` show them even with no browser open.

## Limits

Repairs restore the **list ↔ swimlane binding** and make invisible cards visible.
They do **not** reconstruct which swimlane a card was *originally* in (that
information is lost once the swimlane is deleted or the list is rebound) — cards are
moved to the first swimlane. To restore an exact prior layout, recover from a
backup.
