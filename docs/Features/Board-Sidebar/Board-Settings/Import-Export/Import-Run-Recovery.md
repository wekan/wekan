# Recover an interrupted board import

A board import writes its board step by step: the board, swimlanes, lists,
cards, checklists, comments, attachments, rules, Scrum data. A server restart or
a failure in the middle used to leave a partial board that nothing recorded.
Now every import - the Import page, a board copy, a Trello `.zip` upload and the
Trello API import - runs under an **import run**, and one that stops before it
finishes is listed in **Admin Panel → Problems → Recovery**, where an
administrator **keeps** the partial board or **discards** it.

Code: `server/lib/importRuns.js` (Meteor-free core), `server/importRuns.js`
(collection, scan, methods), `models/lib/importPipeline.js`
(`plannedBoardFields`), `models/import.js`. Tests: `tests/importRuns.test.cjs`,
`tests/playwright/specs/import-run-recovery.e2e.js`.

## The run record

Before the import writes anything, a document is inserted into the private
`importRuns` collection:

| Field | Meaning |
| --- | --- |
| `_id` | the run id (UUID) |
| `userId`, `source` | who imported, and from what (`wekan`, `trello`, `csv`, `jira`, `clone`, `trello-zip`, …) |
| `boardId` | the id the new board **will** have, chosen now |
| `state` | `running`, `finished`, `failed`, `failed-empty`, `interrupted`, `discarding`, `discarded`, `kept` |
| `startedAt`, `touchedAt`, `stage` | start, last heartbeat, and the creator step it was in |
| `finishedAt`, `errorCode` | when it ended; for a failure only the error's code, never its message |
| `interruptedAt`, `interruptedFrom` | when the scan flagged it, and whether it had stopped (`running`) or failed |
| `decision`, `decidedBy`, `decidedAt` | an administrator's keep or discard |

Every importer inserts its board **with that id and with `importRunId`** set to
the run's id. So the link between a run and its board exists before the board
does: there is no moment in which a board was created that no run names, and
the board itself says which run made it.

While the import runs, a heartbeat renews `touchedAt` every 30 seconds with the
current step. When the import returns, the run is `finished`. When it throws,
the run is `failed` - or `failed-empty` if its board was never created, which
closes it silently: nothing was written that a discard could remove (members
brought in as placeholder users are shared, inert and reused by later imports).

The run holds **no imported data**: no titles, no members, no file contents.
Finished, kept and discarded runs are removed after 30 days. A run waiting for
a decision stays until an administrator decides.

## When a run counts as interrupted

A scan runs once at startup and then every 5 minutes (SyncedCron
`wekan-import-run-scan`). It flags a run as `interrupted`:

- when it is still `running` but its heartbeat is older than
  `WEKAN_IMPORT_RUN_STALE_MS` (default 10 minutes; at least 1 minute) - its
  server stopped, or its writer hung;
- when it `failed` after creating its board - at once, as nothing is still
  writing.

Each run is flagged by one conditional update, so it is flagged **once**, even
with several servers scanning, and one Recovery event `import-interrupted`
records it with what the board holds so far.

A writer that is only slow and comes back after being flagged finds its run no
longer `running` and stops at its next step. When the import method's own
deadline (`WEKAN_IMPORT_TIMEOUT_MS`) answers the client, the writer is told to
stop at its next step as well, so a client that was told "Import took too long
and was aborted" does not get a board that keeps growing afterwards.

## Keep or discard

Problems → Recovery lists each interrupted run: its board, source and start
time, where it stopped, how many swimlanes, lists, cards, checklists, comments
and attachments the board has now, and its Scrum checkpoint if it has one.
Only an instance administrator sees the list or acts on it; every decision is a
Recovery row (`import-discarded`, `import-kept`).

- **Keep** leaves the board exactly as it is and closes the run. Use it when
  the partial board is useful, or when people have started working on it.
- **Discard** removes the board the run created and everything on it, then
  closes the run. Then import the file again.

The discard is safe by construction:

- It acts only on the board whose id was allocated for this run **and** that
  carries this run's `importRunId`. A board with that id that this run did not
  create is refused (`foreign-board`) and never touched.
- The board is removed through the application, exactly as a permanent delete
  removes one: its removal hooks take the card tree, the attachments with their
  files and the Scrum stores. A sweep then removes anything else still carrying
  that board id (activities, comments, checklists, rules, Scrum planning). Custom
  fields are removed only when they belong to this board alone; one shared with
  another board stays.
- The decision is written first (`discarding`). A discard that stops halfway is
  listed again and finished by discarding again, without a second decision.
- Discarding twice is a no-op. A running, finished or kept run is refused
  (`not-interrupted`).

Discarding removes everything on the board, including anything somebody added
to it after the import stopped. The board id is the run's own, so nothing of
another board can be selected, but the import cannot tell its own cards from a
card a person added later. If the board has been used since, keep it.

What a discard does not undo: on Sandstorm an import archives the board it was
started from before it creates the new one; that board stays archived and can
be restored from the Archive.

## The Scrum stage

Native WeKan imports, board copies and the Scrum planning of Jira, GitLab,
OpenProject and Asana imports stage their Scrum writes as a private plan with
its own checkpoint ([Scrum import recovery](Scrum-Import-Recovery.md)). One
import has one recovery story:

- The interrupted run's row shows the Scrum checkpoint, if the board has one.
- **Discard** removes the Scrum checkpoint and plan with the board. It is
  refused (`scrum-busy`) while a Scrum writer's lease is still live or the
  offline recovery command holds the board's claim, and a board admin's online
  Scrum resume is refused while the import is being discarded.
- **Keep** leaves the Scrum checkpoint where it is; the board's Scrum import
  recovery (finish or discard, by a board administrator, or the offline
  command) then completes or discards the Scrum part.

## Why there is no "finish" or "resume"

Resuming an import needs what it was importing. The source document is not
kept, and that is a decision, not an omission:

- **Size.** A WeKan export carries its attachments as base64, and a Trello or
  Jira export can be tens of megabytes. Keeping it means a chunked store like
  the Scrum plan's, for every import, to serve the rare one that stops.
- **Personal data and secrets.** An export holds member names, e-mail
  addresses, comments, webhook URLs in rules and integrations. The import
  scrubs it first when the administrator chose anonymization or no avatars;
  a kept copy would retain exactly what that setting removed, in the database
  and in every backup of it, after the board itself has been deleted.
- **Retention.** Nobody would know when the copy may go: a run decided today
  could be inspected next month.
- **Replay.** The creators are not idempotent: they allocate ids as they go,
  create placeholder users, write attachment files. A resume would need every
  step to have a deterministic id and a recognisable result, as the Scrum plan
  does; for the whole import that is a rewrite of every importer.

The Scrum stage can be resumed because its plan is bounded, holds only the
planning records the board will contain anyway, is removed as soon as the stage
finishes, and its steps were written with fixed ids from the start. The rest of an import is completed the safe
way: **discard the partial board and import the file again**, which gives the
same result a resume would, with the file the administrator still has.
