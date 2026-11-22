# Recover an interrupted Scrum import

## What it is

New native board imports, board copies, the Scrum planning of Jira, GitLab,
OpenProject and Asana imports, and Scrum planning imported into an existing
board stage private Scrum write plans before changing Scrum data. An interrupted plan keeps the incomplete-import warning and
blocks Scrum edits and reports. The maintenance command below can continue a
complete stored plan using the original destination IDs.

This recovers **only the Scrum segment**. It does not replay later native-import
stages such as checklists, rules, activities or backgrounds, or complete an
interrupted overall board-copy operation. Legacy marker-only imports have no
recoverable plan.

The import as a whole has its own record: an interrupted import is listed in
Admin Panel → Problems → Recovery with its Scrum checkpoint, where an
administrator keeps the partial board or discards it with its Scrum plan
([Recover an interrupted board import](Import-Run-Recovery.md)). Keep the board
first, then finish or discard its Scrum stage here; a discard of the whole
import is refused while this command holds the board's claim.

## Read more

- [Wikipedia: Scrum (software development)](https://en.wikipedia.org/wiki/Scrum_(software_development))
- [Wikipedia: Rollback (data management)](https://en.wikipedia.org/wiki/Rollback_(data_management))
- [Recover an interrupted board import](Import-Run-Recovery.md)
- [Scrum settings](../Scrum-Settings.md)

## How to use it

Each task below has its own commands, run with
[releases/recover-scrum-import.cjs](../../../../../releases/recover-scrum-import.cjs).

### Inspect without changing the database

Run from a matching WeKan source checkout with its npm dependencies installed.
Use the destination database connection in `MONGO_URL`, including its database
name. Keep credentials in the environment; the command does not print the URI.

```sh
mkdir -p .tools/tmp
export TMPDIR="$PWD/.tools/tmp"
node releases/recover-scrum-import.cjs --board BOARD_ID
```

The default is read-only. It reports the checkpoint state and acknowledged step
count, whether the plan is resumable, and any existing recovery claim token. It
does not print the plan or card contents. Every stored step must have the right
board, operation, position, collection and target, with exactly one final board
settings update. Missing steps, duplicate targets, moved/deleted records and
changed metadata stop recovery. All targets are checked before the first write.

### Continue with all writers stopped

Stop **every WeKan instance**, scheduled job, other recovery process and external
writer using this database. A paused or slow process is not a stopped process.
Keep the database running and take a backup. This command does not stop processes
or independently prove that they are stopped; `--offline` is the operator's
explicit confirmation of this prerequisite.

```sh
node releases/recover-scrum-import.cjs --board BOARD_ID --apply --offline
```

The command claims the board exclusively, validates the plan, applies remaining
steps, clears the imported sprint markers and cleans the private plan. A write
that completed before its acknowledgement can be recognized by exact data
equality; it does not allocate new IDs. The result identifies `scope: "scrum"`.

A fully staged `preparing` plan can be sealed and continued. A partially staged
plan cannot: absent intended writes cannot be reconstructed from counters.
Preserve the checkpoint and original import file for further recovery; do not
clear sprint markers to make an incomplete import appear finished.

Final cleanup has its own durable `cleaning` state in both normal imports and
offline recovery. The board checkpoint remains until private-plan removal is
acknowledged; cleanup failures propagate instead of silently leaving an orphan
plan. If removing plan rows stops halfway, the next recovery finishes cleanup
without replaying data writes or requiring the already deleted rows.

### Undo the stored Scrum segment instead

With the same all-writers-stopped prerequisite, inspect rollback first, then
explicitly apply it:

```sh
node releases/recover-scrum-import.cjs --board BOARD_ID --rollback
node releases/recover-scrum-import.cjs --board BOARD_ID --rollback --apply --offline
```

Inspection is read-only and reports `canRollback`. Rollback first validates
the entire plan, then reverses its steps. It restores original Scrum metadata,
including absent fields versus explicit nulls, and deletes only unchanged
planning records and daily observations created by this import. Unrelated
fields such as card titles remain intact. Changed or moved targets stop the
operation; an exact-document condition also protects each planning deletion.

The durable `rolling-back` state and reverse cursor let an interrupted rollback
continue, including writes whose acknowledgements were lost. After rollback
starts, forward resume is refused: retry with `--rollback` after resolving the
failure and clearing the stopped owner's claim. `rollback-cleaning` resumes
private-plan cleanup without requiring already removed rows. A successful
result reports `state: "rolled-back"` and `scope: "scrum"`.

A `preparing` plan can be discarded even if staging was incomplete, because
destination writes have not started. This removes only the private plan and
checkpoint. It does not remove the board or ordinary imported cards. Once
forward recovery reaches `cleaning`, or the original import has discarded its
plan, rollback is unavailable. Legacy marker-only imports remain unsupported.
This is recovery of interrupted imports, not a general undo of completed board
imports or recovery of their other stages.

### A failed or stopped recovery retains its claim

Recovery claims have **no expiry**. Automatically timing one out would let a
replacement overlap a delayed write from the first process. On failure, inspect
again to obtain the claim token and error. Confirm that the old recovery process
has exited and no writes are still running before clearing its exact token:

```sh
node releases/recover-scrum-import.cjs --board BOARD_ID
node releases/recover-scrum-import.cjs --board BOARD_ID --clear-claim TOKEN --offline
node releases/recover-scrum-import.cjs --board BOARD_ID --apply --offline
```

A stale token cannot clear a replacement process's claim. A database timeout
does not itself prove that a write has finished. Do not clear a claim merely
because it is old. Resolve changed targets rather than replacing their newer
values with the plan's old values.

If the checkpoint was already removed and only its claim remains after a final
connection failure, inspection reports no recoverable checkpoint and the token;
the explicit claim-clear action removes only that claim. It never deletes cards,
planning records or boards.

## How the numbers are calculated

The command has no numbers of its own: a recovery claim has **no expiry**, by
design, and the command continues or undoes the one stored plan of the board
with its original destination IDs; it does not count, sample or time anything.

## How it works in WeKan

The command is
[releases/recover-scrum-import.cjs](../../../../../releases/recover-scrum-import.cjs).
It reads the board's private Scrum write plan and checkpoint, checks the whole
plan before writing (missing, foreign or changed targets refuse it), and either
continues it (`--apply`) or undoes it (`--rollback --apply`); `--offline` is
required for every change, and `--clear-claim TOKEN` clears only that exact
claim.

### Verified scope and unfinished work

MongoDB integration tests cover complete and incomplete staging, whole-plan
preflight, missing/foreign/changed targets, lost acknowledgements, stored BSON
dates, partially cleared sprint markers, interrupted plan cleanup, two competing
recovery callers, exact-token clearing and the real CLI. Rollback coverage
includes every planned collection, partial preparation, reverse-write gaps,
changed targets, exact-document deletion and interrupted private-plan cleanup.
Normal-import failure injection covers marker removal, transition to cleanup,
partial plan deletion and final checkpoint removal, followed by offline resume.
The command's argument
checks run without a database and prevent accidental online mutation.

Online recovery, automated stale-owner fencing, conflict-resolution UI,
partial-staging reconstruction and the rest of the board import remain pending.
Old orphan plans left by earlier versions without a checkpoint are not reclaimed
by this command; it cannot infer the state of their original import.
This command has not been verified against FerretDB. It is intentionally not a
release-menu action or an automatic startup repair.

## Commits

 - [Retain Scrum import checkpoints until plan cleanup completes](https://github.com/wekan/wekan/commit/8a3a1d1b34efd178e96dc75219973f5b23c0a760)
 - [Rollback interrupted Scrum imports during offline maintenance](https://github.com/wekan/wekan/commit/bde8c3010fe9921927a204911db00bfdc76256f4)
 - [Resume stored Scrum import plans through explicit offline maintenance](https://github.com/wekan/wekan/commit/3b2bb233564697716d33caf4fc834cbf95c4c6e9)
