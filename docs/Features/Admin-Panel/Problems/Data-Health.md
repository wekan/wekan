# Admin Panel → Problems → Summary → Data health

## What it is

**Data WeKan should never have written, found by a read-only scan.**

"Broken cards" counts cards whose board, list or swimlane id is *empty*. It does
not see a card whose list exists but belongs to another board, and nothing looked
at what hangs under a card. Data health is a scan of 31 checks over boards,
lists, swimlanes, cards, checklists, comments, attachments, custom fields and
accounts, with a Repair button where the repair is safe. On one production
instance (32,612 boards, 115,326 lists, 1.1 million cards) a scan like this one
found 706 cards on a list of another board - shown nowhere - 842 card numbers
used twice, 2,335 checklist items of deleted checklists and 110 custom field
values of fields not on the card's board. Each of those turned out to be a bug
that was still happening.

## Read more

- [Referential integrity](https://en.wikipedia.org/wiki/Referential_integrity)
  and [Data integrity](https://en.wikipedia.org/wiki/Data_integrity) on
  Wikipedia - what the checks look for.
- WeKan: [Summary](Summary.md) (where it is shown), [Broken Cards](Broken-Cards.md),
  [Repairs.md](Repairs.md) and [Migrations.md](Migrations.md) (the startup steps
  some repairs reuse).

## How to use it

**To run a scan now:**

1. Open your member menu (your avatar at the top right) and click
   **Admin Panel**.
2. Click the **Problems** tab at the top; it opens on **Summary**.
3. Under **Data health**, click **Start**. **Last Run** shows when the last scan
   finished and how many checks found something.

**To repair what it found:**

1. On Summary, find the row titled "Data health: ..." under **Problems**. It
   gives the count, what it means, what to do and up to three example ids.
2. If the row has a **Repair** button, click it.
   - A **safe** repair runs at once.
   - A **confirm** repair deletes data that is shown nowhere: the button changes
     to **Confirm**, and only a second click runs it.
3. While it runs the button says **Repairing…**; then it says how many it fixed,
   and a new scan starts in the background.

## How the numbers are calculated

- **Count** of a row: how many documents that check found (one per card, list,
  checklist item, ...), counted while streaming; up to **3 example ids** are kept
  (`EXAMPLES` in [models/lib/dataHealth.js](../../../../models/lib/dataHealth.js)).
- **Last Run**: `<time of the last finished scan, UTC> - Checks with findings:
  found / checks`, where *checks* is the number of checks (31, `CHECKS.length`)
  and *found* the number of them whose count is above 0. Before the first scan it
  says **Never**; an error of the last scan is added at the end.
- **Batches**: cards and what hangs under them are streamed and looked up 1,000
  at a time (`CHUNK`), with a 100 ms pause between batches whenever the CPU is
  busy (`pauseIfBusy(100)`).
- **Schedule**: an hourly timer runs the nightly scan when the server's local
  hour is 1, 2, 3, 4 or 5 (so between 01:00 and 06:00), only when the last scan
  is older than 20 hours (`EVERY_MS`), and only once the CPU is quiet
  (`runWhenCpuLow`, waiting at most 55 minutes for that).
- **Claims**: a scan or repair claims the `scan` document of the `dataHealth`
  collection; a claim older than six hours (`STALE_MS`) is treated as dead and
  can be taken over.
- On 1.1 million cards a scan took about 2.5 minutes.

## How it works in WeKan

### When it runs

- **At night**, as above, once a day, when the CPU is quiet, pausing whenever the
  machine gets busy.
- **Start** under **Data health** in Problems / Summary runs it straight away,
  without waiting for a quiet CPU (it still slows down under load).
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
runs on FerretDB; where `aggregate` is missing that one check is skipped. There
is no switch to turn it off: it only reads.

### What it shows

Each check that found something is one row in Problems / Summary, titled
"Data health: ...", with the count, what it means, what to do and up to three
example ids. **Last Run** under **Data health** says when it ran and how many of
the checks found something.

### The checks

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
| Custom fields on no board | - |
| Custom fields listing a board that does not exist next to a live one (`boardIds`, or the legacy `boardId`) | Safe: removes the deleted boards from the field |
| Custom fields whose boards were all deleted | Confirm: deletes the field definitions; no existing board shows them, and a value left on a card is listed under the card check above |
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

### Code and tests

| File | What it does |
| --- | --- |
| [models/lib/dataHealth.js](../../../../models/lib/dataHealth.js) | the checks and repairs, plain Node |
| [server/lib/dataHealthScan.js](../../../../server/lib/dataHealthScan.js) | the schedule, the claim, the status (`dataHealth` collection) |
| [server/methods/dataHealth.js](../../../../server/methods/dataHealth.js) | the admin-only `dataHealthScanNow` and `repairDataHealth(checkId, confirmed)` methods |
| [server/lib/schemaUpgradeSteps.js](../../../../server/lib/schemaUpgradeSteps.js) | the startup steps the card repairs run |
| [client/components/settings/problemsSummary.js](../../../../client/components/settings/problemsSummary.js) and `.jade` | the Data health block and the Repair buttons on Summary |
| [tests/dataHealth6818.test.cjs](../../../../tests/dataHealth6818.test.cjs) | the checks, the repairs, the confirm guard, "Never" |

## Commits

 - [Summary counts read as sentences, in every language](https://github.com/wekan/wekan/commit/7c92cf3298bef9ec1199bef5edb48bd334b5fb21)
 - [Tests for the Data health "Never" status](https://github.com/wekan/wekan/commit/79c40407d105e6ded167eb7a84795ad7ebf62641)
 - [Custom fields whose boards were all deleted get their own check](https://github.com/wekan/wekan/commit/9dc3fc3f31e563d3b925173282a7a389b18fea13)
 - [Data health's "Never" has a key of its own](https://github.com/wekan/wekan/commit/77956c98eda8c8bbd0c7fbc609dc0e46c6101385)
 - [Document the Data health repairs](https://github.com/wekan/wekan/commit/30e960e129004426337dc5dc3db3ce80ad4cd448)
 - [Data health: a nightly scan of broken references, with repairs](https://github.com/wekan/wekan/commit/d9cf523f9e86ec7c7c26a8def5380e249add7ca3)
