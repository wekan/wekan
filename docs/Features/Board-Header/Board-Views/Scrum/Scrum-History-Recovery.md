# Resolve a Scrum History undo or redo that stopped on a conflict

## What it is

An undo, redo or restore of Scrum changes (sprints, releases, events, and the
Scrum fields of the board, cards, lists and swimlanes) keeps a private
**checkpoint** on its board until every record it writes and its History
records are confirmed. While the checkpoint exists, every other Scrum edit on
that board waits for it, and only the person who started the undo or redo can
retry it, with exactly the same plan. That keeps an interrupted operation from
being applied twice or half.

Sometimes the retry can never succeed: somebody else changed one of its records
since, its History row changed, or its author lost write access to the board.
Every retry then fails the same way, and before this the board's Scrum edits
stayed blocked for good. Such a checkpoint can now be **resolved**, online by a
board administrator or offline by the server's operator.

## Read more

- Wikipedia: [Undo](https://en.wikipedia.org/wiki/Undo),
  [Rollback (data management)](https://en.wikipedia.org/wiki/Rollback_(data_management)),
  [Compare-and-swap](https://en.wikipedia.org/wiki/Compare-and-swap),
  [Idempotence](https://en.wikipedia.org/wiki/Idempotence),
  [Lease (computer science)](https://en.wikipedia.org/wiki/Lease_(computer_science))
  and [Optimistic concurrency control](https://en.wikipedia.org/wiki/Optimistic_concurrency_control).
- In WeKan: [Sprints](Sprints.md) (History and undo),
  [the Scrum design](Scrum-Design.md#an-undo-or-redo-that-stopped-on-a-conflict)
  and [Admin Panel / Problems / Recovery](../../../Admin-Panel/Problems/Recovery.md).

## How to use it

**Online, as a board administrator:**

1. Open the board. The History recovery notice at the bottom of the board
   says that an undo, redo or restore of Scrum changes stopped on a conflict.
2. Read the counts of records written, not written and changed by somebody
   else.
3. Click **Roll back** when it is offered, or **Keep the board as it is** and
   confirm.

**Offline, as the server's operator:**

1. Inspect, read-only:
   `node releases/recover-scrum-history.cjs --board BOARD_ID`, and note the
   checkpoint's `key`.
2. Stop every WeKan instance and other writer, and take a backup.
3. Run the same command with `--rollback` or `--discard`, plus
   `--checkpoint KEY --apply --offline`.

Both are described in full below.

### Online: the notice on the board

When a board has a stopped checkpoint, anyone who can write on it sees the
History recovery notice at the bottom of the board: *"An undo, redo or restore
of Scrum changes stopped on a conflict. Scrum edits on this board are blocked
until it is resolved."* Members are told that a board administrator can resolve
it. A **board administrator** also sees how many records were written, not
written and changed since, and the buttons **Roll back** (when it is offered)
and **Keep the board as it is**.

It is the board administrator, not only the site administrator, because this is
the board's own Scrum data and the same role already finishes or discards an
interrupted Scrum import from the Scrum view. Inspecting a checkpoint never
returns record contents, only record types, IDs and states.

The server method calls are `scrum.inspectHistoryCheckpoint(boardId)` and
`scrum.resolveHistoryCheckpoint(boardId, key, 'rollback' | 'discard')`.

### Offline: with every writer stopped

When WeKan cannot start, or when you want every writer stopped first, use the
command from a matching WeKan source checkout with its npm dependencies
installed. Keep credentials in `MONGO_URL`, including the database name; the
command does not print the URI.

```sh
mkdir -p .tools/tmp
export TMPDIR="$PWD/.tools/tmp"
node releases/recover-scrum-history.cjs --board BOARD_ID
```

The default is read-only. It prints the checkpoint's `key`, its reasons, the
counts and whether roll back is available, and the first 50 records with their
states. It does not print record contents.

Then stop **every WeKan instance** and other writer using this database (a
paused process is not a stopped process), take a backup, and resolve exactly the
inspected checkpoint:

```sh
node releases/recover-scrum-history.cjs --board BOARD_ID --rollback --checkpoint KEY --apply --offline
node releases/recover-scrum-history.cjs --board BOARD_ID --discard --checkpoint KEY --apply --offline
```

`--offline` is your confirmation that every writer has stopped. The same rules
apply as online: a checkpoint that has not stopped on a conflict is refused, a
roll back that would overwrite a newer change is refused, and a checkpoint other
than `KEY` is left alone. A successful resolution adds a
`scrum-history-checkpoint-resolved` row with source `offline-tool` to Admin Panel
-> Problems -> Recovery.

## How the numbers are calculated

From [server/lib/scrumHistoryRecovery.js](../../../../../server/lib/scrumHistoryRecovery.js):

- The notice counts, of the checkpoint's records, how many were **written**
  (at their "after" value), **not written** (still at their "before" value) and
  **changed by somebody else** (neither); the total is all of them.
- An online resolution waits 2 seconds (`SETTLE_MS`) for a write that already
  passed its check to land before it reads every record again.
- An online resolution that crashed is taken over after 5 minutes
  (`RESOLVE_LEASE_MS`); one started offline must be finished offline.
- The offline inspection lists the first 50 records (`TARGET_REPORT_LIMIT`).
- A resolution names one checkpoint: its operation, or `row:<History row ID>`
  for a checkpoint older than operation IDs.

## How it works in WeKan

### What counts as stopped on a conflict

Only a checkpoint that its author cannot finish is resolvable. Inspection
reports one or more of these reasons:

| Reason | Meaning |
| --- | --- |
| `target-conflict` | A record is neither the checkpoint's "before" value nor its "after" value: somebody changed it since |
| `source-changed` | The History row it undoes or redoes is missing, damaged, changed, or (for a redo) superseded |
| `author-cannot-retry` | Its author's account is gone or no longer has write access to the board |
| `retry-failed` | A retry failed for a reason the next retry would meet again (a Scrum conflict, a refused permission, a missing reference); WeKan records that on the checkpoint |
| `malformed` | The checkpoint itself is damaged |
| `board-missing` | The board no longer exists |

A checkpoint with none of these - for example an undo that a restart
interrupted - is **not** resolvable this way. Its author finishes it by pressing
undo or redo again, or **Try again** in the notice. Failures that pass on by
themselves (History could not be saved yet, another server took the operation
over) are not recorded as conflicts.

### The two ways out

**Roll back** puts every record the operation already wrote back to the value
the checkpoint saved from before it, with its original revision. A planning
record the operation deleted comes back as the same record (same lifetime); one
it created is removed. Records it had not written yet are left alone. The board
is then exactly as it was before the undo or redo, and the History row can be
undone or redone again normally. Roll back is offered only when **every**
record is still either its "before" or its "after" value - it never overwrites
somebody else's later change - and only while none of the operation's own
History records has been written yet, since those already say it was applied.

**Keep the board as it is** removes the checkpoint and writes no record.
Records the operation had already written keep their new values, and records it
had not written keep their old ones, so the result can be half of the undo or
redo. That is never silent: the notice shows how many records were written, not
written, and changed by somebody else, the button asks for confirmation, and the
Problems -> Recovery row repeats the counts. A large undo or redo of the same
batch that had stopped on this row is ended too, since it cannot continue past
a discarded row.

Both are **idempotent**. A resolution names the checkpoint it resolves (its
operation; for a checkpoint older than operation IDs, `row:<History row ID>`).
Once that checkpoint is gone - resolved by an earlier click, another
administrator or another server - a repeat changes nothing and reports
`state: "absent"`; it never resolves a newer checkpoint.

### How it stays safe with several servers

- The resolution claims the checkpoint by compare-and-set, replacing its worker.
  A server still retrying it stops at its next check; a new retry, and the
  author's final cleanup, are refused while the checkpoint is being resolved.
- Online, it then waits two seconds for a write that had already passed its
  check to land, and reads every record again before deciding. Each record is
  written by compare-and-set on its exact current value, and every record is
  checked once more before the checkpoint is removed. A record that changed in
  between stops the resolution and keeps the checkpoint.
- Two administrators at once: the second is told to try again later, and its
  retry is a no-op once the first has finished. An online resolution that
  crashed is taken over after five minutes; one started offline must be
  finished offline.
- A failed resolution releases its claim, so the author can retry or another
  resolution can start at once. Records it had already rolled back are at their
  "before" values, which both accept.

### Problems -> Recovery

Every online resolution, successful or not, is a row of type
`scrum-history-checkpoint-resolved` with the administrator, address and board:
what was done, how many records, and why the checkpoint was stuck. A roll back
that removed planning records the operation had created is marked as deleting
data.

### Files

- [server/lib/scrumHistoryRecovery.js](../../../../../server/lib/scrumHistoryRecovery.js) -
  inspection and resolution, used by the methods in
  [server/scrum.js](../../../../../server/scrum.js) and by
  [releases/recover-scrum-history.cjs](../../../../../releases/recover-scrum-history.cjs).
- [client/components/main/historyRecoveryNotice.js](../../../../../client/components/main/historyRecoveryNotice.js) -
  the notice.

### Tests

- `tests/scrumHistoryRecovery.test.cjs` - the decisions without a database:
  roll back, the refusal of a checkpoint nobody is stuck on, a conflict that
  allows only a discard, discard twice, and the wiring of the methods, the
  notice and the offline command.
- `tests/integration/scrumHistoryRecovery.test.cjs` - the same against MongoDB
  (`WEKAN_SCRUM_TEST_MONGO_URL`), plus re-creating deleted records, History
  already written, the worker fence, leases, a write landing mid-resolution, two
  clients at once, the stopped batch job and the real offline command.
- `tests/playwright/specs/scrum-history-checkpoint-recovery.e2e.js` - the notice
  for a board administrator and for an ordinary member.

## Commits

 - [Retry is enabled only once the board lets this person write on it](https://github.com/wekan/wekan/commit/96845f6f4beb4557e8600f52285fdf2d56ffe4f2)
 - [A board admin can resolve a Scrum undo or redo that stopped on a conflict](https://github.com/wekan/wekan/commit/9ad9813c097b72159a1c10123a0f6d638a687b00)
 - [A recreated Scrum record is told from the one History planned against](https://github.com/wekan/wekan/commit/20275418d4aa0fe85ad03c5d059d3480a90f0223)
 - [Workers resuming the same Scrum History operation are serialized](https://github.com/wekan/wekan/commit/bfe4cc73b1a43ed89de16341cff13c07cc9e1c7d)
 - [A raced undo or redo is applied once](https://github.com/wekan/wekan/commit/f2af24351209b8465c62fa43bb1232626a05672a)
 - [An unanswered keyboard undo or redo shows Try again](https://github.com/wekan/wekan/commit/9e3abe02a56634d7ee368653a5362780d6f07e73)
 - [Scrum History completion is saved before checkpoint cleanup](https://github.com/wekan/wekan/commit/16b17c49432ac333bcf3c2d2e654770e17e9c68b)
 - [Complete recovery batches are checked before writes resume](https://github.com/wekan/wekan/commit/46d2039b8a2591d1adbb1209e2ea374f55011177)
 - [Superseded redo checkpoints are refused](https://github.com/wekan/wekan/commit/2bbc13456f406a86f9beb1fa3d3df221bb7c0b9d)
 - [Recoverable History undo and redo for Scrum changes](https://github.com/wekan/wekan/commit/ceb19bc77c91a5aeb2b3e0b374729338edf3e3c2)
