# Admin Panel → Problems: automatic board data-repairs

Status: **Implemented** · Owner: xet7 · Related: `models/lib/boardRepair.js`,
`models/lib/listUnbindRepair.js`, `server/lib/repairBoardData.js`,
`server/methods/repairBoardData.js`, `server/startup/repairBoardsOnStartup.js`,
`client/components/boards/boardBody.js`,
`client/components/settings/migrationProgress.*`.

## What it is

WeKan repairs a small set of board data problems automatically: cards that do
not show in the Swimlanes view because their swimlane is missing or was
deleted. The repair runs at server start, when a board admin opens a board,
and during the database migration, so nobody has to remember to run it. All
repairs are **idempotent** (a clean board changes nothing) and **scoped to one
board** at a time.

## Read more

- [Idempotence](https://en.wikipedia.org/wiki/Idempotence) on Wikipedia - why
  running the repair again changes nothing.
- [Kanban (development)](https://en.wikipedia.org/wiki/Kanban_(development)) on
  Wikipedia - boards, lists and swimlanes.
- In WeKan: [Migrations.md](Migrations.md), [Summary.md](Summary.md) (the
  Repair broken cards and Restore buttons), [Data-Health.md](Data-Health.md),
  [Broken-Cards.md](Broken-Cards.md).

## How to use it

Nothing has to be started: the repairs run by themselves.

**Repair one board**

1. Log in as an admin of that board.
2. Open the board. If something needs fixing, the **Board Migration in
   Progress** dashboard appears while the repair runs, and closes when it is
   done. A board member who is not a board admin sees nothing and nothing is
   changed.

**See a repair that is running**

1. Open Admin Panel → **Problems** → **Summary**. A running board data-repair
   is listed under **Status** as `done/total` boards.
2. Or run `snap run wekan.problems migrations` on a snap server
   ([Snap.md](Snap.md)).

**Skip the startup pass**

1. Set `WEKAN_SKIP_STARTUP_REPAIR=true`.
2. Restart WeKan.

**Cards with no board at all, and lists that lost their swimlane**

These are not part of this automatic set. Use **Repair broken cards** and
**Restore** on Problems → Summary ([Summary.md](Summary.md)).

## How the numbers are calculated

From [models/lib/boardRepair.js](../../../../models/lib/boardRepair.js) and
[server/startup/repairBoardsOnStartup.js](../../../../server/startup/repairBoardsOnStartup.js):

| Number | How it is computed |
| --- | --- |
| `cardsAssigned` | cards of the board whose `swimlaneId` is not a non-empty string (null, `''` or missing). |
| `cardsRescued` | cards whose `swimlaneId` is a string that is not the id of any swimlane of the board. A swimlane that exists but is archived counts as existing. |
| `listsUnbound` | always 0: the automatic set no longer un-binds lists (see below); the field is kept so the counters keep their shape. |
| `total` | `listsUnbound + cardsAssigned + cardsRescued`; the board-open repair runs only when it is above 0. |
| Startup delay | 30 seconds after boot (`START_DELAY_MS = 30 * 1000`). |
| Startup version gate | the pass runs when the stored marker is below `REPAIR_VERSION` (2 today), then stores 2, so it runs once per repair version, not on every boot. |
| `boardsDone/boardsTotal` | boards processed so far of all boards; the progress is persisted every 25 boards (`PERSIST_EVERY`), and the final state is written once when it finishes. |
| Dashboard progress | the board-open repair shows 20 % while it runs, then completes. |

## How it works in WeKan

### What is repaired

| Problem | Symptom | Repair |
| --- | --- | --- |
| **Missing-swimlane card** | A card with no `swimlaneId` (null / '' / missing) never renders in the Swimlanes view. | Assign it to the board's first usable swimlane (not archived, not a template, lowest sort), creating a `Default` swimlane if the board has none. |
| **Orphaned card** | A card whose `swimlaneId` points at a **deleted** swimlane is invisible. | Reassign it to the board's first usable swimlane. A card on an existing but *archived* swimlane is **not** treated as orphaned. |

The decision of what to fix is a pure, unit-tested planner
(`models/lib/boardRepair.js`, `planBoardRepair`); the server applies it
([server/lib/repairBoardData.js](../../../../server/lib/repairBoardData.js)).

**No longer repaired automatically: the \#6484 bound list.** This page used to
list a third repair: a board-wide list (shown under every swimlane) that was
nudged in the Swimlanes view and got bound to one swimlane, so it
**disappeared from the other swimlanes**, was un-bound by clearing its
`swimlaneId` back to `null`. Since \#6515 the automatic repair never clears a
list's `swimlaneId`: a list that belongs to one swimlane is a legitimate
per-swimlane layout and cannot be told apart from a \#6484 list in the data, and
un-binding them on upgrade made every per-swimlane list show in every swimlane.
The \#6484 code bug itself is fixed. A board admin can still un-bind one board's
lists on purpose with the `repairBoardWideLists` method
([server/models/lists.js](../../../../server/models/lists.js), uses
[models/lib/listUnbindRepair.js](../../../../models/lib/listUnbindRepair.js));
no menu calls it. Lists the old repair un-bound are put back with **Restore** on
[Summary](Summary.md) (\#6670).

### When repairs run

The **same** repair set runs in three places, so it does not depend on any one
trigger — in particular it does **not** depend on a user staying on a progress
page:

1. **Server startup** — `server/startup/repairBoardsOnStartup.js` runs the repairs
   across every board once, in the background, ~30 s after boot. It is
   **version-gated** (a full scan is expensive, so it runs once per repair version,
   not on every boot) and can be skipped with `WEKAN_SKIP_STARTUP_REPAIR=true`.
   Before the boards, the same pass also restores the date each card entered its
   list from the movement history (`server/lib/cardListEntryBackfill.js`); if
   that is deferred by concurrent changes, the pass fails and runs again on the
   next start.
2. **Board open** — when a board opens, the client
   ([client/components/boards/boardBody.js](../../../../client/components/boards/boardBody.js))
   calls `boardRepairNeeded` once per board; if something needs fixing and the
   viewer is a board admin (`canRepair`), it runs `repairBoardData` for that
   board. This catches anything corrupted after the startup pass. The method
   completes server-side even if the browser navigates away. A failed repair is
   allowed to run again.
3. **During the database migration** — the MongoDB ↔ SQLite text migration runs the
   repairs on the live database **before** copying, so the migrated copy is clean
   too (`server/methods/migrateTextDatabase.js`). See [Migrations.md](Migrations.md).

### Permissions

[server/methods/repairBoardData.js](../../../../server/methods/repairBoardData.js):
`boardRepairNeeded` needs a logged-in board member and returns the counts plus
`canRepair`; `repairBoardData` needs a board admin and refuses anybody else
with `not-authorized`.

### Progress dashboard

While a repair (or migration) runs, the shared **migration-progress dashboard**
([client/components/settings/migrationProgress.js](../../../../client/components/settings/migrationProgress.js))
is shown. It is:

- mounted app-wide, so it appears on a board and on the Admin Panel alike;
- styled in WeKan blue (a `#2573a7` to `#1a5276` gradient in its header; this
  page used to say `#2980b9`, which the dashboard does not use);
- branded with the configured **Product name** (Admin Panel → Settings →
  Appearance → Custom Product Name), falling back to `WeKan`, followed by
  "Board Migration in Progress".

The startup and migration repairs also **persist** their progress (the
`board-repair` document of `text_migration_status`), so Problems → Summary and
`snap run wekan.problems` show them even with no browser open.

### Limits

Repairs make invisible cards visible. They do **not** reconstruct which swimlane
a card was *originally* in (that information is lost once the swimlane is
deleted) — cards are moved to the first swimlane. To restore an exact prior
layout, recover from a backup.

### Tests

- [tests/boardRepair.test.cjs](../../../../tests/boardRepair.test.cjs) - the
  planner: missing and orphaned cards, archived swimlanes, and that lists are
  never un-bound.
- [tests/listUnbindRepair.test.cjs](../../../../tests/listUnbindRepair.test.cjs) -
  the explicit list un-bind.
- [tests/listSwimlaneRestore.test.cjs](../../../../tests/listSwimlaneRestore.test.cjs) -
  the \#6670 restore.
- [tests/cardListEntryStartup.test.cjs](../../../../tests/cardListEntryStartup.test.cjs) -
  the startup pass restores list entry dates first.

## Commits

 - [Restore the date each card entered its list in the startup pass](https://github.com/wekan/wekan/commit/800ec4e95b66a186b247965835384844dc9014d2)
 - [Restore the lists the old repair un-bound, from Problems / Summary](https://github.com/wekan/wekan/commit/290cdc6a4dec20f62e09fdcd4978709e3fb7333c)
 - [Stop showing a finished board-repair as running](https://github.com/wekan/wekan/commit/1fb382f0eb14763a0a51b3269ff2f19466f31d4b)
 - [The startup and board-open repair no longer un-binds per-swimlane lists](https://github.com/wekan/wekan/commit/337035eb4c09f2ce410b2bb28f1af88738928d01)
 - [First version of this page](https://github.com/wekan/wekan/commit/c4a76e0e3d73afef090b160bb78743fa699bce2d)
 - [Show a running repair in the Problems Status overview and in snap](https://github.com/wekan/wekan/commit/5a1c9a61e98d0e1bc2ce566229bcdce3f81745ae)
 - [Shared board repairs on board open and during the migration, with the progress dashboard](https://github.com/wekan/wekan/commit/136a14c88a5c7f3f78a46a948641999362f86ce5)
