# Resolve a Scrum History undo or redo that stopped on a conflict

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

## What counts as stopped on a conflict

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

## The two ways out

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

## Online: the notice on the board

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

## Offline: with every writer stopped

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

## How it stays safe with several servers

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

## Problems -> Recovery

Every online resolution, successful or not, is a row of type
`scrum-history-checkpoint-resolved` with the administrator, address and board:
what was done, how many records, and why the checkpoint was stuck. A roll back
that removed planning records the operation had created is marked as deleting
data.

## Tests

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
