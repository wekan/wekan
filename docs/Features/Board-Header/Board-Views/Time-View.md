# Time view

## What it is

The Time view is the board's time tracking in one place: how much time is
spent, by whom and on which cards, and how much time is left until the cards
are due. Time is entered on the cards themselves
([Time tracking](../../Cards/Time-Tracking.md)); this view only reports it. A
site admin can turn it off with "Time views" in Admin Panel / Settings /
Features.

## Read more

- [Timesheet](https://en.wikipedia.org/wiki/Timesheet) and
  [Time-tracking software](https://en.wikipedia.org/wiki/Time_tracking_software)
  at Wikipedia.
- [Audit trail](https://en.wikipedia.org/wiki/Audit_trail) at Wikipedia - what
  the time adjustments by author are built from.
- WeKan: [Time tracking](../../Cards/Time-Tracking.md),
  [Statistics](Status.md), [Timeline](Timeline-View.md),
  [report charts](Charts/Board-Report-Charts.md) (the same export popup),
  [History](../../General/History/History.md),
  [Roles](../../Board-Sidebar/Members/Roles.md).

## How to use it

1. Open a board.
2. Board header → **Board View** → **Time** (in the menu's **Calendar and
   time** group).
3. Read the sections:
   - **Time spent summary**: Total time spent (hours), Cards with time spent,
     Overtime cards and Remaining time until due (#1121).
   - **Breakdown** (#812), when there is any: **Assignees** - hours by
     assignee (cards without one are "No assignee") - and **Card** - hours by
     card, with overtime marked.
   - **Time adjustments by author**: every change to a card's recorded hours,
     grouped by who made it, from the change history, and below it each
     change with its date, card, author, the change (Δ hours) and the new
     total. These are corrections to a total, not work sessions; a negative
     value is a correction, and time recorded before the history existed
     cannot be attributed.
4. **Export**: click **Export** for the time report as PDF or Excel, through
   the same export popup as the [report charts](Charts/Board-Report-Charts.md).

**Permissions.** The summary counts only the cards you may see: for an
assigned-only role, the cards assigned to you. The breakdown, the remaining
time, the adjustments and the export need the right to export the board's
data, which assigned-only roles do not have, so for them those sections stay
empty (the remaining time shows `…`). See
[Roles](../../Board-Sidebar/Members/Roles.md).

## How the numbers are calculated

**Time spent summary** (`boardStatus` in
[server/publications/boards.js](../../../../server/publications/boards.js)),
over the board's cards that are not archived (and the cards of its subtasks
board when you can see it):

- **Total time spent** = the sum of `spentTime` of the cards that have more
  than 0, shown with `h`.
- **Cards with time spent** = how many cards have `spentTime` over 0.
- **Overtime cards** = how many of those are flagged overtime.

**Remaining time until due** (`computeRemainingTimeSum` and
`formatRemainingTime` in
[models/lib/chartCalculations.js](../../../../models/lib/chartCalculations.js)):

- Only open cards count: not archived, no End date, and a Due date set.
- The sum is `Σ (Due - now)` over those cards. An overdue card adds a negative
  amount, so the total gets smaller when a card slips past its due date.
- It is shown as `X days, Y hours`: the absolute hours are rounded to whole
  hours, split into days of 24 hours and the rest; a negative total gets one
  leading minus, for example `-6 days, 9 hours`.

**Breakdown** (`computeTimeByGroup`, `computeTimeByCard`, same file), over the
cards that are not archived and have `spentTime` over 0:

- **Hours by assignee** = the sum of `spentTime` of the cards of each
  assignee; a card with two assignees counts fully for both; rounded to two
  decimals; most hours first.
- **Hours by card** = each card's `spentTime`, rounded to two decimals, most
  hours first.

**Time adjustments by author** (`timeAdjustments` in
[models/lib/timeHistory.js](../../../../models/lib/timeHistory.js)):

- Each change history row of a card's `spentTime` is one adjustment:
  **Δ hours** = new value - previous value (a missing value counts as 0); a
  change of 0 and a value that is not a number are skipped.
- **Hours per author** = the sum of their adjustments, with the number of
  adjustments; most hours first. The list of changes is newest first.
- A restore is counted once, for the person who performed it.
- Cards deleted since are still named, from the removal snapshot the history
  kept.

**Export** ([models/lib/chartExportRows.js](../../../../models/lib/chartExportRows.js)
`'time'`): a two-column Name / Hours table with the sections Remaining time
until due, Time adjustments by author, Assignees and Card.

## How it works in WeKan

- **View**:
  [client/components/boards/timeView.jade](../../../../client/components/boards/timeView.jade)
  and [timeView.js](../../../../client/components/boards/timeView.js). It calls
  the `boardStatus` method for the summary, and `boardChartData` with chart
  key `time` for the rest; card titles use the shared title viewer
  ([Board-view titles](Title-Rendering.md)).
- **Server**: the `boardStatus` method in
  [server/publications/boards.js](../../../../server/publications/boards.js);
  [server/lib/boardChartData.js](../../../../server/lib/boardChartData.js)
  (`'time'`), which reads the card change history rows of `spentTime` and the
  card lifecycle rows; the permission is
  [models/lib/exportAccess.js](../../../../models/lib/exportAccess.js)
  `canExportBoardData`.
- **Pure modules**:
  [models/lib/timeHistory.js](../../../../models/lib/timeHistory.js),
  [models/lib/chartCalculations.js](../../../../models/lib/chartCalculations.js).
- **Menu and feature switch**: `board-view-time` in
  [models/lib/boardViewSettings.js](../../../../models/lib/boardViewSettings.js),
  feature `views-time` in
  [models/lib/instanceFeatures.js](../../../../models/lib/instanceFeatures.js).
- **Tests**:
  [tests/timeViewReportAndExport.test.cjs](../../../../tests/timeViewReportAndExport.test.cjs),
  [tests/timeHistory.test.cjs](../../../../tests/timeHistory.test.cjs),
  [tests/chartCalculations.test.cjs](../../../../tests/chartCalculations.test.cjs),
  [tests/playwright/specs/time-history.e2e.js](../../../../tests/playwright/specs/time-history.e2e.js),
  [tests/playwright/specs/time-view-title.e2e.js](../../../../tests/playwright/specs/time-view-title.e2e.js).

## Commits

 - [Time view card titles fixed by the source guards](https://github.com/wekan/wekan/commit/4ff3a2c91df3bf61e75f3e2ecc38d9bab68bfaea)
 - [Time history kept, and time adjustments by author](https://github.com/wekan/wekan/commit/6d99ad73c4361a44a0445cf396ddaaf697575833)
 - [Optional features: a site admin can turn the time views off](https://github.com/wekan/wekan/commit/18d57b2b8f789b11409afbd485cff139adeb3095)
 - [The plain-link security setting covered in both modes](https://github.com/wekan/wekan/commit/a7b333dad70b1757a0de88d1e40609feed3ec8fe)
 - [Time view card titles rendered with the security-aware viewer](https://github.com/wekan/wekan/commit/dc08557113ad9fbd18c08e2e2a805f0473fa952e)
 - [Remaining time until due in the summary and the export](https://github.com/wekan/wekan/commit/120a1b66511c8e90df606985effedd3c59f9dcf3)
 - [Hours by assignee and by card, and the PDF and Excel export](https://github.com/wekan/wekan/commit/070a1ad10bdf9a5ad64f2ee7346ff05e8392f7d9)
 - [The Time view split out of Statistics](https://github.com/wekan/wekan/commit/876b0a2c12edffcff323900a2f50807816cfabf6)
