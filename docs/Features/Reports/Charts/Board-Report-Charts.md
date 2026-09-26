# Board report charts

Dashboard, Burndown, Burnup, Cumulative Flow, Control Chart, Cycle Time,
Flow Efficiency, Lead Time, Throughput Histogram, WIP Run and Pulse.

WeKan draws 10 report charts directly from a board's cards and activity
history - no separate reporting tool or export/import step is needed. Every
chart is a thin wrapper (`client/components/boards/chartPlaceholderViews.jade`)
around one shared view (`client/components/boards/charts/boardCharts.jade`)
that reads live numbers from the `boardChartData` server method
(`server/lib/boardChartData.js`, calculations in
`models/lib/chartCalculations.js`), draws a Chart.js canvas plus the
underlying data table, and offers **Export to PDF** / **Export to Excel**
buttons for the same numbers. See `docs/Features/Reports/charts.tsv` for how
each chart's formula compares to Jira/Businessmap/Azure DevOps equivalents.

## Where to find it

Open a board, then **Board View menu (top bar) →** one of: Dashboard,
Burndown, Burnup, Cumulative Flow, Control Chart, Cycle Time, Flow
Efficiency, Lead Time, Throughput Histogram, WIP Run, Pulse.

```
┌─ Board View ▾ ─────────────────────┐
│ Swimlanes  Lists  Table             │
│ Calendar  Multi Board Calendar      │
│ Time                                │
│ Stats                               │
│ Group by Assignee                   │
│ Gantt  Gantt (Frappe)  Gantt (dhtmlx)│
│ Roadmap                             │
│ Dashboard                           │
│ Bigboard                            │
│ Burndown                            │
│ Burnup                              │
│ Cumulative Flow                     │
│ Control Chart                       │
│ Cycle Time                          │
│ Flow Efficiency                     │
│ Lead Time                           │
│ Throughput Histogram                │
│ WIP Run                             │
│ Pulse                               │
└──────────────────────────────────────┘
```

Every chart page shares the same layout:

```
┌ <Chart Title> ─────────────────────────────┐
│ [Export to PDF]  [Export to Excel]          │
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

## Steps to use any of them

1. Open a board that has at least some cards with the relevant dates/moves
   (see the per-chart list below).
2. Click the **Board View** menu at the top of the board.
3. Select the chart's name.
4. The chart renders from the board's existing cards and activity log - there
   is nothing to configure first.
5. Optionally click **Export to PDF** or **Export to Excel** to download the
   same chart/table.

## What each chart needs to show non-empty data

- **Dashboard** - card counts grouped by assignee/label; needs cards with
  assignees or labels set.
- **Burndown** - remaining work over time; needs cards with `dueAt` (or the
  board's target date) and some completed cards (`endAt`, or `archivedAt`).
- **Burnup** - completed work vs. total scope over time; needs cards created
  over a span of time and some archived/moved to a done list.
- **Cumulative Flow** - needs cards that have been created and moved between
  lists (`createCard`/`moveCard`/`archivedCard`/`restoredCard` activity) -
  a board with only one list and no history shows nothing.
- **Control Chart** - needs cards that were moved through lists so a
  cycle-time-per-card series exists.
- **Cycle Time** - needs cards with a start (`startAt`) and completion time.
- **Flow Efficiency** - needs cards with active-work time recorded (time
  tracking / `spentTime`) versus their total cycle time.
- **Lead Time** - needs cards with `createdAt` and a completion date.
- **Throughput Histogram** - needs cards completed (`endAt`, or `archivedAt`)
  across more than one time period, to show a bar per period.
- **WIP Run** - needs at least 3 lists (so the middle lists count as "in
  progress") and cards moved through them over time; a WIP limit line is
  drawn when lists have a [WIP Limit](../../Lists/WipLimit/WipLimit.md) set.
- **Pulse** - a 30-day activity count, independent of card dates; any board
  activity (card create/move/comment/etc.) in the last 30 days is enough -
  see [#1292](https://github.com/wekan/wekan/issues/1292).

## Additional flow analytics

At the bottom of the menu, after Pulse, open **Aging WIP**, **Blocker Analysis**,
**Monte Carlo Forecasts**, **Process Behavior (XmR)**, or
**Work Item Size vs. Cycle Time**. See [Flow analytics](Flow-Analytics.md) for
the data sources, controls, formulas, history requirements and export behavior.
These use the current board’s existing data and extend universal History only
where dependency timestamps were missing.

## Related

- [Gantt](../Gantt.md) - a timeline view, a separate timeline report.
- [Group by Assignee](../../Board/Group-By-Assignee.md) and
  [Bigboard](../../Board/Bigboard.md) - other Board View menu entries that
  are layouts, not charts.
- [Burndown and Velocity Chart](../Burndown-and-Velocity-Chart.md) - the
  older, separate burndown/velocity write-up.
- [WIP Limits](../../Lists/WipLimit/WipLimit.md).
