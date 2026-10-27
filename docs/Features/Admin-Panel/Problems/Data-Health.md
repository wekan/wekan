# Admin Panel → Problems → Summary → Data health

**Data WeKan should never have written, found by a read-only scan.**

"Broken cards" counts cards whose board, list or swimlane id is *empty*. It does
not see a card whose list exists but belongs to another board, and nothing looked
at what hangs under a card. On one production instance (32,612 boards, 115,326
lists, 1.1 million cards) a scan like this one found 706 cards on a list of
another board - shown nowhere - 842 card numbers used twice, 2,335 checklist
items of deleted checklists and 110 custom field values of fields not on the
card's board. Each of those turned out to be a bug that was still happening.

## When it runs

- **At night**, between 01:00 and 05:00 server time, once a day, when the CPU is
  quiet (`runWhenCpuLow`), pausing whenever the machine gets busy.
- **Start** under **Data health** in Problems / Summary runs it straight away.
- **One pod at a time**: the scan claims its status document, so a cluster of
  WeKan pods on one database scans once. The nightly claim also requires the
  last scan to be older than 20 hours, in the same atomic update, so a pod that
  waited for a quiet CPU while another pod finished does not scan again. A pod
  that dies mid-scan frees the claim after six hours. A repair takes the same
  claim, so no two repairs, and no repair and scan, run at once.

It reads ids only - never titles, descriptions or comments - with two- or
three-field projections. Memory grows with the number of boards, lists,
swimlanes and custom fields, not with the number of cards: cards and what hangs
under them are streamed and looked up a thousand at a time. Only `find`,
`distinct` and, for duplicate card numbers, `aggregate` are used, so it also
runs on FerretDB; where `aggregate` is missing that one check is skipped.

## What it shows

Each check that found something is one row in Problems / Summary, titled
"Data health: ...", with the count, what it means, what to do and up to three
example ids. **Last Run** under **Data health** says when it ran and, as
`found/checks`, how many of the checks found something.

## The checks

| Check | Repair |
| --- | --- |
| Boards listing the same member twice | Safe: one entry per person - an active board admin, else an active one, else the first |
| Board members whose account no longer exists | Safe: removes the entries |
| Open boards without an active (`isActive: true`) board admin | - |
| Swimlanes / lists on a board that does not exist | - |
| Lists bound to a swimlane that does not exist, or of another board | Safe: the list becomes shared |
| Lists, swimlanes or cards with a sort that is not a number | - (startup step `nonfinite-sort-repair`) |
| Cards on a board that does not exist | - |
| Cards on a list that does not exist, or on a list of ANOTHER board | Safe: runs the startup steps `card-list-other-board` and `swimlane-structure` - first list of their own board, or a new "Rescued Data" list |
| Open cards in a swimlane that does not exist, or of another board | Safe: runs the startup step `swimlane-structure` |
| Cards without the archived field | - (startup step `archived-flag-backfill`) |
| Card numbers used by more than one open card on a board | - (numbers may be written down elsewhere) |
| Linked cards or boards whose original is gone; subtasks whose parent is gone | - |
| Cards with values for a custom field that is not on their board | Confirm: removes those values |
| Checklists, comments, text notes whose card is gone, or with another board than their card | - (startup step `card-children-boardid` for the board) |
| Checklist items whose checklist is gone | Confirm: deletes them |
| Checklist items on another card than their checklist | - |
| Attachments (not deleted) whose card is gone | - (attachment retention) |
| Custom fields on no board, or listing a board that does not exist (`boardIds`, or the legacy `boardId`) | Safe: removes the deleted boards from the field |
| Accounts sharing an e-mail address, upper/lower case aside | - |

**Safe** repairs put things where they belong and delete nothing anyone can see.
**Confirm** repairs delete data that is shown nowhere; the button asks for a
second click (the button then says Confirm), and the server refuses a confirm
repair unless the call says it was confirmed. Every repair looks for its targets
again instead of trusting the last scan, removes only the entries it found
(`$pull`, or an update guarded by the value it read) so an edit made meanwhile
is kept, and a new scan starts in the background when it is done. The card list
and swimlane repairs are the startup upgrade steps of
`server/lib/schemaUpgradeSteps.js`, not a second copy of them.

Code: `models/lib/dataHealth.js` (checks and repairs, plain Node),
`server/lib/dataHealthScan.js` (schedule, claim, status),
`server/methods/dataHealth.js` (admin-only methods),
`client/components/settings/problemsSummary.*` (the page). Test:
`tests/dataHealth6818.test.cjs`.
