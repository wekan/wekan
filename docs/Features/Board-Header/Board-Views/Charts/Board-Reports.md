# Board reports

## What it is

Twelve reports of the Board View menu, added on 2026-11-20 after comparing
WeKan's charts with the reports of Jira, Azure DevOps, Nave, ActionableAgile and
the Flow Framework. They show how work flows through a board week by week
(created, finished, ages, due dates), how releases and parent cards progress,
and who has what and how the board's work is spread. Each opens like the other
charts: the **export bar at its top** (PDF and Excel, the same as every board
chart), the chart drawn with Chart.js, and the data table under it, which is
also what the export writes.

## Read more

- Wikipedia: [Kanban (development)](https://en.wikipedia.org/wiki/Kanban_(development)),
  [Cumulative flow diagram](https://en.wikipedia.org/wiki/Cumulative_flow_diagram),
  [Run chart](https://en.wikipedia.org/wiki/Run_chart),
  [Burndown chart](https://en.wikipedia.org/wiki/Burndown_chart),
  [Percentile](https://en.wikipedia.org/wiki/Percentile),
  [Median](https://en.wikipedia.org/wiki/Median),
  [Workload](https://en.wikipedia.org/wiki/Workload),
  [Dependency graph](https://en.wikipedia.org/wiki/Dependency_graph) and
  [Heat map](https://en.wikipedia.org/wiki/Heat_map).
- The products compared: [ActionableAgile](https://www.actionableagile.com/) and
  the [Flow Framework](https://flowframework.org/).
- [Chart.js](https://www.chartjs.org/), which draws the charts.
- In WeKan: [Board report charts](Board-Report-Charts.md),
  [Flow analytics](Flow-Analytics.md), [Sprints](../Scrum/Sprints.md) (releases)
  and [Subtasks](../../../Cards/Subtasks.md).

## How to use it

1. Open a board.
2. Click the **Board View** menu at the top of the board.
3. Choose a report from its group: **Kanban flow** (Created vs. Resolved, Net
   Flow, Time in List, Average Age, Throughput Run Chart, Due Date
   Performance), **Scrum** (Release Burndown, Epic Progress) or **Overview**
   (Workload, Distribution, Dependency Map, Activity Heatmap).
4. Read the chart and the table under it.
5. To keep a copy, click **Export** at the top and choose **PDF** or **Excel**.

| Report | Board View | Group | What it shows |
| --- | --- | --- | --- |
| Created vs. Resolved | `board-view-created-resolved` | Kanban flow | Cards created and finished per week, and how many were open at the end of each week. The chart is the open count. |
| Net Flow | `board-view-net-flow` | Kanban flow | Finished less created per week. Positive: the board empties; negative: work arrives faster than it leaves. |
| Time in List | `board-view-time-in-list` | Kanban flow | For each list, how many stays cards had in it and their median and 85th percentile in days, from the change history of the cards' moves. A card never moved stayed in its list from its creation. |
| Average Age | `board-view-average-age` | Kanban flow | At the end of each week, the open cards and their mean age in days. |
| Throughput Run Chart | `board-view-throughput-run` | Kanban flow | Cards finished per week, in time order, with the median of the weeks (the Throughput Histogram shows the same counts as a distribution). |
| Due Date Performance | `board-view-due-date-performance` | Kanban flow | Cards finished per week on time, late and without a due date, and the average days late. The chart is the share on time. |
| Release Burndown | `board-view-release-burndown` | Scrum | For each Scrum release, its cards, those done and those left, and the projected finish at the weekly rate of the last four weeks. |
| Epic Progress | `board-view-epic-progress` | Scrum | Every card with subtasks: its subtasks done and open, and the share done - the least finished first. |
| Workload | `board-view-workload` | Overview | The open cards of each person (assignees, else members), and how many are in each list. |
| Distribution | `board-view-distribution` | Overview | Open and finished cards by label, and each label's share of the open ones. |
| Dependency Map | `board-view-dependency-map` | Overview | Every dependency of an open card - the relation, the card it depends on and whether that is done - and the length of the chain of open cards it waits on, the longest first. The dependency graph itself is exported as SVG from Board Settings → Export → Dependencies. |
| Activity Heatmap | `board-view-activity-heatmap` | Overview | The board's changes of the last year by weekday and hour (UTC); the table is the heatmap, the chart each weekday's total. |

## How the numbers are calculated

The calculations are `models/lib/boardReports.js` (`BOARD_REPORTS`):

- A card is **finished** at its end date, else when it was archived - as in the
  other charts. A card not finished is **open**.
- Weeks start on Monday (UTC); the weekly reports show the board's weeks, from
  the week of its oldest card but at most the last 52, and the chart the last
  24 of them. The other reports' charts also show at most 24 bars.
- **Created vs. Resolved**: per week, created = cards whose creation is in
  that week, resolved = cards finished in it; open starts as the cards created
  before the first week and not finished before it, and each week adds created
  and subtracts resolved.
- **Net Flow** = departures (finished) − arrivals (created) per week.
- **Time in List**: each card's moves are replayed from the change history
  (`group: 'position'`); a stay lasts from entering a list until the next move,
  and the last one until the card is finished, else until now. Median and 85th
  percentile use linear interpolation between the sorted values, rounded to
  one decimal.
- **Average Age**: at the end of each week (or now, for the current week), the
  cards created by then and not finished by then, and the mean of
  `(that moment − creation)` in days.
- **Throughput Run Chart**: finished cards per week, and the median of all
  those weekly counts.
- **Due Date Performance**: of the cards finished in a week, on time = finished
  at or before `dueAt`, late = after it, no due date = no `dueAt`; average days
  late = mean of `(finished − due)` of the late ones. The chart is
  `on time / (on time + late) × 100`, 0 when neither.
- **Release Burndown**: the weekly rate = cards finished in the last 28 days /
  4. Projected finish = today + `ceil(remaining / rate)` weeks; blank when
  nothing is left, `-` when the rate is 0. A card counts in each of its
  releases.
- **Epic Progress**: subtasks = cards whose `parentId` is that card; progress =
  `done / subtasks × 100`, lowest first.
- **Workload**: open cards per person, from the assignees, or the members when
  there are none; a card with neither counts under `-`. A card counts for
  every person on it.
- **Distribution**: per label, open and finished cards (a card counts under
  each of its labels, `-` for none); share = the label's open cards / all open
  label counts × 100.
- **Dependency Map**: blocked chain = 0 when none of a card's dependencies is
  open, else 1 + the longest chain of the open cards it depends on (a loop
  ends the chain).
- **Activity Heatmap**: the board's Activities of the last 365 days, counted by
  UTC weekday (Monday first) and UTC hour; the bars are each weekday's sum.
- Values are rounded to one decimal.

## How it works in WeKan

The calculations are `models/lib/boardReports.js` (`BOARD_REPORTS`), pure
functions tested by `tests/boardReports.test.cjs`; the server loads only what a
report reads (`server/lib/boardChartData.js` `loadBoardReport`): the cards,
the move history for Time in List, the releases for Release Burndown, the
last year's Activities for Activity Heatmap and the people for Workload. Every
report answers the same `{ bars, table }` shape, drawn by
[client/components/boards/charts/boardCharts.js](../../../../../client/components/boards/charts/boardCharts.js).
Links: [models/lib/boardReports.js](../../../../../models/lib/boardReports.js),
[server/lib/boardChartData.js](../../../../../server/lib/boardChartData.js),
[tests/boardReports.test.cjs](../../../../../tests/boardReports.test.cjs) and
the UI spec [tests/playwright/specs/board-reports.e2e.js](../../../../../tests/playwright/specs/board-reports.e2e.js).

### Who sees them

The same as the other charts (`models/lib/exportAccess.js`): a member who may
see only the cards assigned to them gets none of these reports, because each
reads every card of the board. The instance can turn them off with the other
flow charts in Admin Panel → Settings → Features, and a board admin can hide
each in Board Settings → Board View.

### Export

The export bar at the top of each report writes its title and table as PDF or
Excel (`models/exportCharts.js`, `models/lib/chartExportRows.js`). An export
follows Admin Panel → Anonymize export users for the names in Workload.

## Commits

 - [The Release Burndown UI test gets a release to show](https://github.com/wekan/wekan/commit/905f60a1ea15aa240a65c83d32ba505d6608b6d6)
 - [The twelve Board View reports](https://github.com/wekan/wekan/commit/63b5e089f5113960f22fc3d72e3dce3ae86981e2)
 - [The Board View menu is grouped under headings](https://github.com/wekan/wekan/commit/257835733b0ec5d950fac6feb2e13c589219bb9d)
