# Board report charts

Dashboard, Burndown, Burnup, Cumulative Flow, Control Chart, Cycle Time,
Flow Efficiency, Lead Time, Throughput Histogram, WIP Run and Pulse.

## What it is

WeKan draws 11 report charts directly from a board's cards and activity
history - no separate reporting tool or export/import step is needed. They
answer the usual Kanban and Scrum questions: how much work is left, how fast
work gets done, how long a card takes, where work piles up and how busy the
board is. Every chart shows the drawing and the table of numbers behind it,
and both can be exported to PDF or Excel.

## Read more

- Wikipedia: [Kanban (development)](https://en.wikipedia.org/wiki/Kanban_(development)),
  [Burndown chart](https://en.wikipedia.org/wiki/Burndown_chart) (also the
  burnup chart), [Cumulative flow diagram](https://en.wikipedia.org/wiki/Cumulative_flow_diagram),
  [Control chart](https://en.wikipedia.org/wiki/Control_chart),
  [Cycle time](https://en.wikipedia.org/wiki/Cycle_time),
  [Lead time](https://en.wikipedia.org/wiki/Lead_time),
  [Throughput (business)](https://en.wikipedia.org/wiki/Throughput_(business)),
  [Work in process](https://en.wikipedia.org/wiki/Work_in_process),
  [Little's law](https://en.wikipedia.org/wiki/Little%27s_law),
  [Histogram](https://en.wikipedia.org/wiki/Histogram) and
  [Moving average](https://en.wikipedia.org/wiki/Moving_average).
- [Chart.js](https://www.chartjs.org/), the library that draws the charts.
- [charts.tsv](charts.tsv) (also as [charts.ods](charts.ods)) - how each chart's
  formula compares to the Jira, Businessmap and Azure DevOps equivalents.
- In WeKan: [Board reports](Board-Reports.md), [Flow analytics](Flow-Analytics.md),
  [Burndown and Velocity Chart](Burndown-and-Velocity-Chart.md),
  [Time View](../Time-View.md) and
  [Admin Panel / Settings / Features](../../../Admin-Panel/Settings/Features.md).

## How to use it

### Where to find it

Open a board, then **Board View menu (top bar) →** one of the charts. The
menu is grouped under headings (`models/lib/boardViewSettings.js`
`BOARD_VIEW_GROUPS`); the charts are in these groups:

```
┌─ Board View ▾ ─────────────────────┐
│ Scrum                               │
│   ...  Burndown  Burnup             │
│ Kanban flow                         │
│   Cumulative Flow  Control          │
│   Cycle Time  Flow Efficiency       │
│   Lead Time  Throughput Histogram   │
│   WIP Run  ...                      │
│ Overview                            │
│   ...  Dashboard  Pulse  ...        │
└──────────────────────────────────────┘
```

The Control Chart's menu entry is labelled **Control**. Inside a group the
board's own order from Board Settings → Board View decides where each entry
is.

Every chart page shares the same layout:

```
┌ <Chart Title> ─────────────────────────────┐
│ [Export]  → PDF / Excel                     │
│ ┌──────────────────────────────────────┐   │
│ │   ▄▄   ▄▄▄▄  ▄  ▄▄▄     (canvas)       │   │
│ │  ▄▄▄▄  ▄▄▄▄▄ ▄▄ ▄▄▄▄▄▄▄▄▄▄             │   │
│ └──────────────────────────────────────┘   │
│ header1 | header2 | header3   (data table) │
│ ...     | ...     | ...                    │
└──────────────────────────────────────────────┘
```

If a chart has nothing to draw yet it shows "No results" instead of an empty
canvas - see each chart's prerequisites below.

### Steps to use any of them

1. Open a board that has at least some cards with the relevant dates/moves
   (see the per-chart list below).
2. Click the **Board View** menu at the top of the board.
3. Select the chart's name.
4. The chart renders from the board's existing cards and activity log - there
   is nothing to configure first.
5. Optionally click **Export** and choose **PDF** or **Excel** to download the
   same chart's table.

### What each chart needs to show non-empty data

- **Dashboard** - card counts grouped by assignee, by label and by list; needs
  some cards, and cards with assignees or labels for those groups.
- **Burndown** - remaining work over time; needs cards created over a span of
  time and some completed cards (`endAt`, or `archivedAt`).
- **Burnup** - completed work vs. total scope over time; needs cards created
  over a span of time and some completed (`endAt` set, or archived). Moving a
  card to a list named Done does not complete it.
- **Cumulative Flow** - needs cards that have been created and moved between
  lists (`createCard`/`moveCard`/`archivedCard`/`restoredCard` activity) -
  a board with only one list and no history shows nothing.
- **Control Chart** - needs completed cards; each one's cycle time is a point.
- **Cycle Time** - needs completed cards; the start is `startAt`, else the
  card's creation.
- **Flow Efficiency** - needs completed cards with active-work time recorded
  (time tracking / `spentTime`); a completed card without it is left out.
- **Lead Time** - needs cards with `createdAt` and a completion date.
- **Throughput Histogram** - needs cards completed (`endAt`, or `archivedAt`)
  across more than one time period, to show a bar per period.
- **WIP Run** - needs at least 3 lists (so the middle lists count as "in
  progress") and cards moved through them over time; a WIP limit line is
  drawn when lists have a [WIP Limit](../../../Lists/WipLimit/README.md) set.
- **Pulse** - a 30-day activity count, independent of card dates; any board
  activity (card create/move/comment/etc.) in the last 30 days is enough -
  see [#1292](https://github.com/wekan/wekan/issues/1292). Pulse also shows a
  year grid of archived cards per UTC day; choose another **year** and
  **Apply**.

### Additional flow analytics

In the **Kanban flow** group, open **Aging WIP**, **Blocker Analysis**,
**Monte Carlo Forecasts**, **Process Behavior (XmR)**, or
**Work Item Size vs. Cycle Time**. See [Flow analytics](Flow-Analytics.md) for
the data sources, controls, formulas, history requirements and export behavior.
These use the current board’s existing data and extend universal History only
where dependency timestamps were missing. Twelve more reports (Created vs.
Resolved, Net Flow and others) are in [Board reports](Board-Reports.md).

## How the numbers are calculated

All in [models/lib/chartCalculations.js](../../../../../models/lib/chartCalculations.js),
fed by [server/lib/boardChartData.js](../../../../../server/lib/boardChartData.js):

- **Completed**: a card's completion date is its `endAt`, else its
  `archivedAt`; with neither, it is not completed. WeKan has no "Done" list
  flag for these charts.
- **Date range**: from the day the board's oldest card was created until today,
  one point per UTC day (except Pulse).
- **Dashboard**: per assignee, label and list, the number of cards in it (a
  card with two labels counts under both; one with none under "No assignee" /
  "No label"), and `percent = count / all cards × 100`, rounded to one
  decimal.
- **Burndown**: per day, remaining = cards created by the end of the day and
  not completed by then. The ideal line falls straight from the number of
  cards that existed at the start of the first day to 0 today, rounded to two
  decimals.
- **Burnup**: per day, total = cards created by the end of the day, completed =
  cards completed by the end of the day.
- **Cumulative Flow**: the Activities are replayed in time order to know each
  card's list at the end of every day. A card in a list counts in that list
  and every list to its left (the "in or past that list" of a CFD); archived
  cards do not count.
- **Control Chart**: per completed card, cycle days = completion − (`startAt`
  or creation), never below 0, plotted on its completion date in completion
  order. The band is the average and the (population) standard deviation of
  the last 5 points.
- **Lead Time** = completion − creation, **Cycle Time** = completion −
  (`startAt` or creation), in days, never below 0.
- **Throughput Histogram**: completed cards per week (weeks start on Monday,
  UTC). The **forecast** under it takes the average of the last 4 weeks in
  that series (weeks with no completions are not in the series), divides the
  open cards by it, rounds up to whole weeks and adds 7 days per week to
  today. With no open cards, or a zero average, no date is given
  ([#1476](https://github.com/wekan/wekan/issues/1476)).
- **Flow Efficiency**: per completed card with `spentTime` (hours),
  `efficiency = spentTime / max(cycle hours, spentTime) × 100`, so at most
  100%.
- **WIP Run**: per day, the cards in the "in progress" lists - every list but
  the first and the last when there are more than 2 lists, else all lists.
  The limit line is the sum of the enabled WIP limits of those middle lists.
- **Pulse**: the number of the board's Activities on each of the last 30 days
  (today and the 29 days before it); a day with no activity is 0, never left
  out. The archive grid
  ([models/lib/archiveContributions.js](../../../../../models/lib/archiveContributions.js))
  counts the cards archived on each UTC day of the chosen year (1900-9998);
  its shading level is 0 for none, else `min(4, 1 + floor(log2(count)))`.
  Restored cards and archives without a date are not counted.

## How it works in WeKan

- Every chart is a thin wrapper
  ([client/components/boards/chartPlaceholderViews.jade](../../../../../client/components/boards/chartPlaceholderViews.jade))
  around one shared view
  ([client/components/boards/charts/boardCharts.jade](../../../../../client/components/boards/charts/boardCharts.jade),
  [boardCharts.js](../../../../../client/components/boards/charts/boardCharts.js))
  that reads live numbers from the `boardChartData` server method
  ([server/publications/boards.js](../../../../../server/publications/boards.js),
  loading in [server/lib/boardChartData.js](../../../../../server/lib/boardChartData.js),
  calculations in [models/lib/chartCalculations.js](../../../../../models/lib/chartCalculations.js)),
  draws a Chart.js canvas plus the underlying data table, and offers the
  **Export** popup
  ([client/components/boards/charts/exportChart.js](../../../../../client/components/boards/charts/exportChart.js))
  with PDF and Excel for the same numbers
  ([models/exportCharts.js](../../../../../models/exportCharts.js),
  [models/lib/chartExportRows.js](../../../../../models/lib/chartExportRows.js)).
- **Who sees them**: `boardChartData` follows the export rule
  ([models/lib/exportAccess.js](../../../../../models/lib/exportAccess.js)): a
  member who may see only the cards assigned to them gets none of these
  charts, because each reads every card of the board. A chart export follows
  Admin Panel → Anonymize export users for names.
- The instance can turn the charts off with the **Flow charts** group in
  [Admin Panel / Settings / Features](../../../Admin-Panel/Settings/Features.md)
  ([models/lib/instanceFeatures.js](../../../../../models/lib/instanceFeatures.js)),
  and a board admin can hide each one in
  [Board Settings / Board View](../../../Board-Sidebar/Board-Settings/Board-View.md).
- Tests: [tests/chartCalculations.test.cjs](../../../../../tests/chartCalculations.test.cjs)
  (the formulas, also against charts.tsv),
  [tests/archiveContributions.test.cjs](../../../../../tests/archiveContributions.test.cjs),
  [tests/chartExportRows.test.cjs](../../../../../tests/chartExportRows.test.cjs),
  [tests/chartExportPopup.test.cjs](../../../../../tests/chartExportPopup.test.cjs),
  [tests/chartExportRoutesAuth.test.cjs](../../../../../tests/chartExportRoutesAuth.test.cjs),
  [tests/exportAccess.test.cjs](../../../../../tests/exportAccess.test.cjs) and
  the UI specs [tests/playwright/specs/board-view-titles.e2e.js](../../../../../tests/playwright/specs/board-view-titles.e2e.js)
  and [tests/playwright/specs/export-access.e2e.js](../../../../../tests/playwright/specs/export-access.e2e.js).

## Related

- [Gantt](../Gantt.md) - a timeline view, a separate timeline report.
- [Group by Assignee](../Group-By-Assignee.md) and
  [Bigboard](../Bigboard.md) - other Board View menu entries that
  are layouts, not charts.
- [Burndown and Velocity Chart](Burndown-and-Velocity-Chart.md) - the
  older, separate burndown/velocity write-up.
- [WIP Limits](../../../Lists/WipLimit/README.md).

## Commits

 - [The menu groups the charts under Scrum, Kanban flow and Overview](https://github.com/wekan/wekan/commit/257835733b0ec5d950fac6feb2e13c589219bb9d)
 - [Every chart export obeys Disable all export and Anonymize export users](https://github.com/wekan/wekan/commit/be6727607ccd4019862db423d4d3a36cd7ce600f)
 - [Administrators can turn the chart views off](https://github.com/wekan/wekan/commit/18d57b2b8f789b11409afbd485cff139adeb3095)
 - [Chart data follows the export rule for assigned-only members](https://github.com/wekan/wekan/commit/d2539ca1d22cee30e617c5be9a15a01ed16e2ec9)
 - [Pulse shows the cards archived per day of a year](https://github.com/wekan/wekan/commit/1c200407a23449395f381497bbebaca7443d9aa3)
 - [Admin-only custom fields are redacted from chart data](https://github.com/wekan/wekan/commit/89a65ee7ce765217b57f9c6be35422b9f3d9a3c4)
 - [Flow chart buttons use the theme](https://github.com/wekan/wekan/commit/d962b6047995e885f5e95a8937a067785034f8b1)
 - [Card titles in the charts use the shared title viewer](https://github.com/wekan/wekan/commit/5ca16f32ed9924f2a4388cf7a5eb4a239d7e9692)
 - [Dates are real date cells in the Excel export](https://github.com/wekan/wekan/commit/278db0ada3c9f695d82ead81b75c5f15c715b959)
 - [Each PDF export row stays on one line in fixed columns](https://github.com/wekan/wekan/commit/e487f8d913bb0ce32504b4363d20fe0ce23b84de)
 - [One translated Export popup for every chart view](https://github.com/wekan/wekan/commit/364903fd8e91f005d596b913c86db5333a11a3eb)
 - [The Dashboard charts render again](https://github.com/wekan/wekan/commit/d0a70473e17c81415dd72a58ac34d779235fa0c0)
 - [Documentation of the chart views](https://github.com/wekan/wekan/commit/191472036028e303b92bec67751101f7c562a2da)
 - [Pulse charts daily board activity](https://github.com/wekan/wekan/commit/2d8fb6070af0229b398f2aeed71b204c7494eb32)
 - [The Throughput Histogram projects a completion date](https://github.com/wekan/wekan/commit/b467f1700858648a463eb3523868b8e931f3d47d)
 - [The Dashboard's empty group label is translated](https://github.com/wekan/wekan/commit/b33e2e1bebb4e1e82d43f180eaa20e3474ddd323)
 - [The charts are drawn with Chart.js](https://github.com/wekan/wekan/commit/5d5317d968907edcaa06011dc8fd760a21121e4f)
 - [The report charts and their PDF and Excel export](https://github.com/wekan/wekan/commit/3abc1078c2f060cb3fa373f224c530013f0f38d1)
 - [The Board View menu gets the chart entries](https://github.com/wekan/wekan/commit/876b0a2c12edffcff323900a2f50807816cfabf6)
