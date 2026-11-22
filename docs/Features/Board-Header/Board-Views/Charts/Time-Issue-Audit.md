# Time and time-tracking issue audit

## What it is

This page records an audit of the open WeKan issues about time and time
tracking, what WeKan already had for them, and the pieces that were then
built: keeping history when cards and checklists are deleted, an optional
**reason** for a card move, and a **Time adjustments by author** report in the
Time view. The reports these feed are in [Flow analytics](Flow-Analytics.md).

## Read more

- Wikipedia: [Time-tracking software](https://en.wikipedia.org/wiki/Time-tracking_software),
  [Timesheet](https://en.wikipedia.org/wiki/Timesheet),
  [Cycle time](https://en.wikipedia.org/wiki/Cycle_time) and
  [Lead time](https://en.wikipedia.org/wiki/Lead_time).
- The issues: [#1476](https://github.com/wekan/wekan/issues/1476),
  [#1598](https://github.com/wekan/wekan/issues/1598),
  [#1673](https://github.com/wekan/wekan/issues/1673) and
  [#1618](https://github.com/wekan/wekan/issues/1618).
- In WeKan: [Time View](../Time-View.md),
  [Time Tracking](../../../Cards/Time-Tracking.md),
  [Flowtime and Pomodoro](../../../Cards/Flowtime-and-Pomodoro.md),
  [Move Card](../../../Cards/Move-Card.md) and
  [Board Settings / Card](../../../Board-Sidebar/Board-Settings/Card.md).

## How to use it

**Give a reason when moving a card:**

1. Open a card, open its menu and choose **Move Card**.
2. Fill in **Move reason (optional)**, pick the destination and click **Done**.

**Be asked for a reason on every list move:**

1. Open **Board Settings → Card**.
2. Tick **Ask for a reason when moving cards**. From then on, moving a card to
   another list or board by dragging asks for a reason; leaving it empty is
   allowed.

**See the time adjustments:**

1. Open **Board View → Time**.
2. Read **Time adjustments by author** under the totals. **Export** includes it.

## How the numbers are calculated

- **Time adjustments by author** (`timeAdjustments` in
  [models/lib/timeHistory.js](../../../../../models/lib/timeHistory.js)): each
  universal History row that changed `spentTime` is one adjustment of
  `hours = new value − old value` (a missing value counts as 0); rows that
  change nothing are skipped, and negative values are corrections. Each
  author's hours are the sum of their adjustments, with the number of them,
  the biggest total first. A restore is counted once, for the person who
  restored it.
- The existing card and assignee totals of the Time view sum each card's
  `spentTime` ([models/lib/chartCalculations.js](../../../../../models/lib/chartCalculations.js)
  `computeTimeByGroup`, `computeTimeByCard`).
- A move reason is trimmed and kept up to 1,000 characters.

## How it works in WeKan

### The audit

Checked the live open issue list on 2026-09-26 (162 open issues), including
all descriptions, then read each relevant issue and all comments. Searching
for time tracking, time spent, spent time, cycle/lead time, duration, elapsed,
Pomodoro, timesheets and work logs finds these two open work-metric requests:

| Issue | Existing source evidence | Remaining work |
| --- | --- | --- |
| [#1476: Metrics](https://github.com/wekan/wekan/issues/1476), sojournerc | `chartCalculations.js` and `boardChartData.js` already implement cycle/lead times, throughput, WIP, and velocity-based completion estimates. | Add the five flow reports described in [Flow analytics](Flow-Analytics.md), using the same board data and export mechanism. |
| [#1598: Activity/time history and move reasons](https://github.com/wekan/wekan/issues/1598), ladistrupl | Universal History records dates, spent-time changes and checklist completion. Activities already record checked/unchecked items. Activity timestamps use `displayDate` and are selectable, formatted date/time text. Time view totals `spentTime` by card and current assignee. | Preserve history on card/checklist deletion, capture move reasons, and expose time adjustments by their recorded author. An assignee is not necessarily the person who entered a time adjustment. |

Related requests were also read in full:

- [#1673: Activity date display](https://github.com/wekan/wekan/issues/1673),
  zombah: exact timestamps already render inline through
  `client/config/blazeHelpers.js` and `client/lib/dateDisplay.js`. Current user,
  board and administrator date-format preferences apply. The old
  relative-time-only/hover-only limitation is already gone.
- [#1618: Action summaries](https://github.com/wekan/wekan/issues/1618),
  martinbruno90: this is a broader checklist ownership, cross-board personal
  overview and calendar request, rather than elapsed-time tracking. My Cards,
  card assignees and calendar/Gantt views already exist; checklist due dates
  are supported by `server/lib/checklistDeadlines.js`. Do not close this entire
  request merely because card-level time reports exist.

The general history feature is reused for these reports. Existing Flowtime
sessions already add their elapsed hours to `spentTime`; manual time entry
and the Time view use that same field. No second timer or timesheet store is
introduced. Database query support is not the missing feature here: the new
reports use plain board-scoped reads and pure calculations, rather than new
aggregation operators requiring a FerretDB implementation.

### Implemented missing pieces of #1598

- Keep card and checklist Activities when their source item is deleted. Their
  stored titles and timestamps remain visible from the board activity feed.
  Keep a card-removal snapshot in the existing universal History for reports;
  deleting the whole board still follows the normal board purge policy.
- Add an optional **Move reason (optional)** field to the existing Move Card
  dialog and an **Ask for a reason when moving cards** board card setting
  (Board Settings → Card). When enabled, ordinary interactive list moves ask
  for an optional reason. Automation can supply a reason without a dialog. The
  reason is recorded with the move, not inferred from a comment or another
  field. Skipping a reason is allowed.
- Record whole positions centrally in the existing collection history hook.
  The old server-only `Card.move` logger missed direct client collection moves
  and REST updates. One combined position row also keeps its reason attached
  to the move and makes undo/redo restore the pair together.
- Extend the existing Time view with timestamped `spentTime` adjustments grouped
  by the history author. This is explicitly an adjustment audit, not a claim
  that the person editing the total personally performed all of the work.
  Existing card and assignee totals remain available, and exports include both.

### Files and tests

- The reason is stored as `lastMoveReason` on the card and the setting as
  `askForMoveReason` on the board ([models/cards.js](../../../../../models/cards.js),
  [models/boards.js](../../../../../models/boards.js)); the dialog is
  `moveCardPopup` in [client/components/cards/cardDetails.jade](../../../../../client/components/cards/cardDetails.jade)
  and the setting is in [client/components/sidebar/sidebar.jade](../../../../../client/components/sidebar/sidebar.jade).
- One position History row per move: `positionChange` in
  [models/lib/timeHistory.js](../../../../../models/lib/timeHistory.js); the
  Time view reads the adjustments through
  [server/lib/boardChartData.js](../../../../../server/lib/boardChartData.js).
- Tests: [tests/timeHistory.test.cjs](../../../../../tests/timeHistory.test.cjs),
  [tests/timeViewReportAndExport.test.cjs](../../../../../tests/timeViewReportAndExport.test.cjs)
  and the UI spec [tests/playwright/specs/time-history.e2e.js](../../../../../tests/playwright/specs/time-history.e2e.js).

## Commits

 - [Board Settings / Card is the opened card's Card Settings, with the move reason setting](https://github.com/wekan/wekan/commit/52de57c844a750e2f4a0fb18d9fd81f04e5a1015)
 - [Ask for a reason is a checkbox like Show empty fields](https://github.com/wekan/wekan/commit/37b3c8f599304768dc4d9fd9676fd85b1d83e6e9)
 - [Time history kept on deletion, reversible move reasons and time adjustments](https://github.com/wekan/wekan/commit/6d99ad73c4361a44a0445cf396ddaaf697575833)
 - [The flow analytics reports and dependency history asked for in #1476](https://github.com/wekan/wekan/commit/0b411b54769db56f6a5a2d9473e11e70dec9300f)
