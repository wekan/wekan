# Time view

Board header → **Board View** → **Time**. The board's time tracking in one
place: how much time is spent, by whom and on which cards. Time is entered on
the cards themselves ([Time tracking](../../Cards/Time-Tracking.md)); this view
only reports it. A site admin can turn it off with "Time views" in Admin Panel /
Settings / Visibility / Features.

## What it shows

**Time spent summary**

- Total time spent (hours), cards with time spent and overtime cards - of the
  board's cards that are not archived.
- Remaining time until due (#1121): for open cards with a due date and no end
  date; an overdue card counts as negative.

**Breakdown** (#812), when there is any: hours by assignee (cards without one
are "none") and hours by card, with overtime marked.

**Time adjustments by author**: every change to a card's recorded hours,
grouped by who made it, from the change history. These are corrections to a
total, not work sessions; a negative value is a correction, and time recorded
before the history existed cannot be attributed.

## Controls

- **Export**: the time report as PDF or Excel, through the same export popup as
  the [report charts](Charts/Board-Report-Charts.md).

## Permissions

The summary counts only the cards you may see: for an assigned-only role, the
cards assigned to you. The breakdown, the adjustments and the export need the
right to export the board's data, which assigned-only roles do not have, so for
them those sections stay empty. See [Roles](../../Board-Sidebar/Members/Roles.md).

## Implementation

`client/components/boards/timeView.jade` and `.js`; the `boardStatus` method in
`server/publications/boards.js`; `server/lib/boardChartData.js` (`'time'`);
`models/lib/timeHistory.js`. Tests: `tests/timeViewReportAndExport.test.cjs`,
`tests/timeHistory.test.cjs`, `tests/playwright/specs/time-history.e2e.js`.
