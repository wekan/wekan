# Board header

## What it is

The board header is the bar above a board's lists: the board title, its
visibility and watch controls, card sorting, filter, search, multi-selection,
and the **Board View** chooser. It is where you decide how the board is shown
to you and who else may see it. The same bar is the first header bar of WeKan;
the board's controls are drawn in it next to the logo, the starred boards, the
notification bell and the member menu.

## Read more

- [Kanban board](https://en.wikipedia.org/wiki/Kanban_board) and
  [Kanban (development)](https://en.wikipedia.org/wiki/Kanban_(development)) on
  Wikipedia - what the board under this bar is.
- [Toolbar](https://en.wikipedia.org/wiki/Toolbar) on Wikipedia - the kind of
  control this bar is.
- [The header](../Header-Bar/Header.md) - the whole first header bar, its
  folding caret and its labels.
- [Board Settings / Board View](../Board-Sidebar/Board-Settings/Board-View.md) -
  which views a board offers and which one it opens in.

## How to use it

**The header controls.** The board's controls in the first header bar, in their
order (`boardHeaderButtons` in `client/components/boards/boardHeader.jade`). The
caret before them folds all of them away except the buttons a board's Rules
add; see [the header](../Header-Bar/Header.md).

| Control | Guide | Who can use it |
| --- | --- | --- |
| Visibility (Private / Signed-in users / Public) | [Visibility](Visibility.md) | Board admin; others see it disabled |
| Watch (Watching / Tracking / Muted) | [Watch](Watch.md) | Signed-in users; hidden when watching is disabled |
| Sort Cards | [Sort Cards](Sort-Cards.md) | Signed-in users |
| Filter | [Filter](../Board-Sidebar/Filter/README.md) | Signed-in users |
| Search | [Search](Search.md) | Signed-in users |
| Multi-Selection | [Multi-Selection](../General/Multi-Selection.md) | Users who can modify the board |

Signed out, the bar shows only a **Log in** button.

**Change the board view.**

1. Open a board.
2. Click the view button in the header bar. It shows the icon and the name of
   the view that is on now, for example **Swimlanes**, with a caret before it.
3. The **Board View** menu opens. Its entries are grouped under the headings
   **Board**, **Calendar and time**, **Scrum**, **Kanban flow**, **Overview**
   and **Communication and code**; the current view has a check mark.
4. Click a view. The menu closes and the board is drawn in that view.

Which views the menu offers, and which one a board opens in, is set in
[Board Settings / Board View](../Board-Sidebar/Board-Settings/Board-View.md);
see also the [Board View Settings popup](Board-Views/Settings-Popup.md). A view
that a site admin turned off in
[Admin Panel / Settings / Features](../Admin-Panel/Settings/Features.md) is not
in the menu at all.

**More pages.**

- [Search](Search.md)
- [Board View Settings popup](Board-Views/Settings-Popup.md)
- [Board-view titles](Board-Views/Title-Rendering.md) and [activity rendering](Board-Views/Activity-Rendering.md)
- [Time and time-tracking issue audit](Board-Views/Charts/Time-Issue-Audit.md)
- [Scrum design](Board-Views/Scrum/Scrum-Design.md) and [Scrum History recovery](Board-Views/Scrum/Scrum-History-Recovery.md)

## How the numbers are calculated

The board header itself counts nothing. The Board View menu has one entry per
row of `BOARD_VIEWS` in
[models/lib/boardViewSettings.js](../../../models/lib/boardViewSettings.js) - 53
views today - in 6 groups (`BOARD_VIEW_GROUPS`). The menu lists the views
ordered by group first and, inside a group, by the board's own order
(`groupedBoardViews`), leaving out views hidden for the board's visibility or
disabled for the instance. When nothing is chosen the default view is
**Swimlanes** (`DEFAULT_BOARD_VIEW`). Each view's own numbers are explained on
its own page, linked in the table below.

## How it works in WeKan

- The chooser is drawn from `BOARD_VIEWS` in
  [models/lib/boardViewSettings.js](../../../models/lib/boardViewSettings.js)
  (`boardChangeViewPopup` in
  [client/components/boards/boardHeader.jade](../../../client/components/boards/boardHeader.jade),
  entries from `boardViewMenuEntries`), and
  [client/components/boards/boardBody.jade](../../../client/components/boards/boardBody.jade)
  renders the chosen view.
- The view button is `boardViewMenu`, and the board's controls are
  `boardHeaderButtons`; both are included in the first header bar
  ([client/components/main/header.jade](../../../client/components/main/header.jade)).
  Their handlers are in
  [client/components/boards/boardHeader.js](../../../client/components/boards/boardHeader.js).
- Choosing a view calls `Utils.setBoardView()`
  ([client/lib/utils.js](../../../client/lib/utils.js)). Signed in, the choice is
  saved per board on your profile through the `setBoardView` method; signed
  out, it is kept in the browser's `localStorage` (`boardView`).
  `Utils.boardView()` then resolves the view to draw with `resolveBoardView`:
  your choice when the board offers it, otherwise the board's default for its
  visibility, otherwise Swimlanes.
- Tests: [tests/boardViewSettings.test.cjs](../../../tests/boardViewSettings.test.cjs)
  (checks that the table below has one row per view, naming a template that
  exists and that `boardBody.jade` renders, and that each row links a guide that
  exists), [tests/boardViewMenu.test.cjs](../../../tests/boardViewMenu.test.cjs),
  [tests/boardViewPerBoard.test.cjs](../../../tests/boardViewPerBoard.test.cjs)
  and [tests/headerBars.test.cjs](../../../tests/headerBars.test.cjs).

### Board View menu

Every entry of the menu, in the order of `BOARD_VIEWS`, with the template that
draws it. Role permissions apply in every view; see
[Roles](../Board-Sidebar/Members/Roles.md).

| Menu entry | View | Implementation | Guide |
| --- | --- | --- | --- |
| Swimlanes | `board-view-swimlanes` | `swimlane` in `client/components/swimlanes/swimlanes.jade` | [Swimlanes](../Swimlanes/Swimlanes.md) |
| Lists | `board-view-lists` | `listsGroup` in `client/components/swimlanes/swimlanes.jade` | [Lists](../Lists/Lists.md) |
| Table | `board-view-table` | `tableView` in `client/components/boards/tableView.jade` | [Table-View](Board-Views/Table-View.md) |
| Calendar | `board-view-cal` | `calendarView` in `client/components/boards/boardBody.jade` | [Calendar](Board-Views/Calendar.md) |
| Calendar Mode | `board-view-calendar-mode` | `calendarModeView` in `client/components/boards/calendarModeView.jade` | [Calendar-Mode](Board-Views/Calendar-Mode.md) |
| Multi Board Calendar | `board-view-multiboard-cal` | `multiboardCalendarView` in `client/components/boards/multiboardCalendarView.jade` | [Multi-Board-Calendar](Board-Views/Multi-Board-Calendar.md) |
| Time | `board-view-time` | `timeView` in `client/components/boards/timeView.jade` | [Time-View](Board-Views/Time-View.md) |
| Timeline | `board-view-timeline` | `timelineView` in `client/components/boards/timelineView.jade` | [Timeline-View](Board-Views/Timeline-View.md) |
| Statistics | `board-view-stats` | `statsView` in `client/components/boards/statsView.jade` | [Status](Board-Views/Status.md) |
| Group by Assignee | `board-view-group-by-assignee` | `groupByAssigneeView` in `client/components/boards/groupByAssigneeView.jade` | [Group-By-Assignee](Board-Views/Group-By-Assignee.md) |
| Gantt | `board-view-gantt` | `ganttView` in `client/components/gantt/gantt.jade` | [Gantt](Board-Views/Gantt.md) |
| Frappe Gantt | `board-view-gantt-frappe` | `frappeGanttView` in `client/components/gantt/frappeGantt.jade` | [Gantt](Board-Views/Gantt.md) |
| DHTMLX Gantt | `board-view-gantt-dhtmlx` | `dhtmlxGanttView` in `client/components/gantt/dhtmlxGantt.jade` | [Gantt](Board-Views/Gantt.md) |
| Product Backlog | `board-view-product-backlog` | `scrumView` in `client/components/boards/scrum/scrumView.jade` | [Product-Backlog](Board-Views/Scrum/Product-Backlog.md) |
| Sprints | `board-view-sprints` | `scrumView` in `client/components/boards/scrum/scrumView.jade` | [Sprints](Board-Views/Scrum/Sprints.md) |
| Sprint Report | `board-view-sprint-report` | `scrumView` in `client/components/boards/scrum/scrumView.jade` | [Sprint-Reports](Board-Views/Scrum/Sprint-Reports.md) |
| Velocity | `board-view-velocity` | `scrumView` in `client/components/boards/scrum/scrumView.jade` | [Sprint-Reports](Board-Views/Scrum/Sprint-Reports.md) |
| Roadmap | `board-view-roadmap` | `roadmapView` in `client/components/boards/roadmapView.jade` | [Roadmap](Board-Views/Roadmap.md) |
| Dashboard | `board-view-dashboard` | `dashboardView` in `client/components/boards/chartPlaceholderViews.jade` | [Board-Report-Charts](Board-Views/Charts/Board-Report-Charts.md) |
| Bigboard | `board-view-bigboard` | `bigboardView` in `client/components/boards/bigboardView.jade` | [Bigboard](Board-Views/Bigboard.md) |
| Burndown | `board-view-burndown` | `burndownView` in `client/components/boards/chartPlaceholderViews.jade` | [Burndown-and-Velocity-Chart](Board-Views/Charts/Burndown-and-Velocity-Chart.md) |
| Burnup | `board-view-burnup` | `burnupView` in `client/components/boards/chartPlaceholderViews.jade` | [Board-Report-Charts](Board-Views/Charts/Board-Report-Charts.md) |
| Cumulative Flow | `board-view-cumulative-flow` | `cumulativeFlowView` in `client/components/boards/chartPlaceholderViews.jade` | [Board-Report-Charts](Board-Views/Charts/Board-Report-Charts.md) |
| Control | `board-view-control-chart` | `controlChartView` in `client/components/boards/chartPlaceholderViews.jade` | [Board-Report-Charts](Board-Views/Charts/Board-Report-Charts.md) |
| Cycle Time | `board-view-cycle-time` | `cycleTimeView` in `client/components/boards/chartPlaceholderViews.jade` | [Board-Report-Charts](Board-Views/Charts/Board-Report-Charts.md) |
| Flow Efficiency | `board-view-flow-efficiency` | `flowEfficiencyView` in `client/components/boards/chartPlaceholderViews.jade` | [Board-Report-Charts](Board-Views/Charts/Board-Report-Charts.md) |
| Lead Time | `board-view-lead-time` | `leadTimeView` in `client/components/boards/chartPlaceholderViews.jade` | [Board-Report-Charts](Board-Views/Charts/Board-Report-Charts.md) |
| Throughput Histogram | `board-view-throughput-histogram` | `throughputHistogramView` in `client/components/boards/chartPlaceholderViews.jade` | [Board-Report-Charts](Board-Views/Charts/Board-Report-Charts.md) |
| WIP Run | `board-view-wip-run` | `wipRunView` in `client/components/boards/chartPlaceholderViews.jade` | [Board-Report-Charts](Board-Views/Charts/Board-Report-Charts.md) |
| Pulse | `board-view-pulse` | `pulseView` in `client/components/boards/chartPlaceholderViews.jade` | [Board-Report-Charts](Board-Views/Charts/Board-Report-Charts.md) |
| Aging WIP | `board-view-aging-wip` | `agingWipView` in `client/components/boards/chartPlaceholderViews.jade` | [Flow-Analytics](Board-Views/Charts/Flow-Analytics.md) |
| Blocker Analysis | `board-view-blocker-analysis` | `blockerAnalysisView` in `client/components/boards/chartPlaceholderViews.jade` | [Flow-Analytics](Board-Views/Charts/Flow-Analytics.md) |
| Monte Carlo Forecasts | `board-view-monte-carlo` | `monteCarloView` in `client/components/boards/chartPlaceholderViews.jade` | [Flow-Analytics](Board-Views/Charts/Flow-Analytics.md) |
| Process Behavior (XmR) | `board-view-process-behavior` | `processBehaviorView` in `client/components/boards/chartPlaceholderViews.jade` | [Flow-Analytics](Board-Views/Charts/Flow-Analytics.md) |
| Work Item Size vs. Cycle Time | `board-view-size-cycle-time` | `sizeCycleTimeView` in `client/components/boards/chartPlaceholderViews.jade` | [Flow-Analytics](Board-Views/Charts/Flow-Analytics.md) |
| Map | `board-view-map` | `mapView` in `client/components/boards/mapView.jade` | [Map-View](Board-Views/Map-View.md) |
| Email | `board-view-email` | `emailView` in `client/components/boards/emailView.jade` | [Email-View](Board-Views/Email-View.md) |
| Chat | `board-view-chat` | `chatView` in `client/components/boards/chatView.jade` | [Chat-View](Board-Views/Chat-View.md) |
| Version Control | `board-view-version-control` | `versionControlView` in `client/components/boards/versionControlView.jade` | [Version-Control-View](Board-Views/Version-Control-View.md) |
| Column sets | `board-view-column-sets` | `columnSetsView` in `client/components/boards/columnSetsView.jade` | [Column-Sets](Board-Views/Column-Sets.md) |
| Created vs. Resolved | `board-view-created-resolved` | `createdResolvedView` in `client/components/boards/chartPlaceholderViews.jade` | [Board-Reports](Board-Views/Charts/Board-Reports.md) |
| Net Flow | `board-view-net-flow` | `netFlowView` in `client/components/boards/chartPlaceholderViews.jade` | [Board-Reports](Board-Views/Charts/Board-Reports.md) |
| Time in List | `board-view-time-in-list` | `timeInListView` in `client/components/boards/chartPlaceholderViews.jade` | [Board-Reports](Board-Views/Charts/Board-Reports.md) |
| Average Age | `board-view-average-age` | `averageAgeView` in `client/components/boards/chartPlaceholderViews.jade` | [Board-Reports](Board-Views/Charts/Board-Reports.md) |
| Throughput Run Chart | `board-view-throughput-run` | `throughputRunView` in `client/components/boards/chartPlaceholderViews.jade` | [Board-Reports](Board-Views/Charts/Board-Reports.md) |
| Due Date Performance | `board-view-due-date-performance` | `dueDatePerformanceView` in `client/components/boards/chartPlaceholderViews.jade` | [Board-Reports](Board-Views/Charts/Board-Reports.md) |
| Release Burndown | `board-view-release-burndown` | `releaseBurndownView` in `client/components/boards/chartPlaceholderViews.jade` | [Board-Reports](Board-Views/Charts/Board-Reports.md) |
| Epic Progress | `board-view-epic-progress` | `epicProgressView` in `client/components/boards/chartPlaceholderViews.jade` | [Board-Reports](Board-Views/Charts/Board-Reports.md) |
| Workload | `board-view-workload` | `workloadView` in `client/components/boards/chartPlaceholderViews.jade` | [Board-Reports](Board-Views/Charts/Board-Reports.md) |
| Distribution | `board-view-distribution` | `distributionView` in `client/components/boards/chartPlaceholderViews.jade` | [Board-Reports](Board-Views/Charts/Board-Reports.md) |
| Dependency Map | `board-view-dependency-map` | `dependencyMapView` in `client/components/boards/chartPlaceholderViews.jade` | [Board-Reports](Board-Views/Charts/Board-Reports.md) |
| Activity Heatmap | `board-view-activity-heatmap` | `activityHeatmapView` in `client/components/boards/chartPlaceholderViews.jade` | [Board-Reports](Board-Views/Charts/Board-Reports.md) |
| Website | `board-view-website` | `websiteView` in `client/components/boards/websiteView.jade` | [Website](../Board-Sidebar/Board-Settings/Import-Export/Website/Website.md) |
| Shop | `board-view-shop` | `shopView` in `client/components/boards/shopView.jade` | [Shop](Board-Views/Shop.md) |

## Commits

 - [The Board View menu is grouped under headings](https://github.com/wekan/wekan/commit/257835733b0ec5d950fac6feb2e13c589219bb9d)
 - [Remember the board view per board](https://github.com/wekan/wekan/commit/80fb317fda1b069562b76263dc135007d4104c6e)
 - [Administrators choose which optional views WeKan offers](https://github.com/wekan/wekan/commit/18d57b2b8f789b11409afbd485cff139adeb3095)
 - [Board View rows reorder by drag and drop](https://github.com/wekan/wekan/commit/2d80e6e4ee4afec3dff380e53fa90f419af450f2)
 - [The default menu order is the one the menu had before views became orderable](https://github.com/wekan/wekan/commit/bbe8b40d903c516491c45c69d3b220415dfd2b32)
 - [Reorder the Board View menu with up and down arrows](https://github.com/wekan/wekan/commit/82646e4bc0f891ed044bdc5c6cf910cd8dd4a4ea)
 - [Which views a public or private board offers, and which one it opens in](https://github.com/wekan/wekan/commit/349c7490e72f93b4e692ff1ff22c7f0eda2431da)
 - [Group the Board View menu with separators](https://github.com/wekan/wekan/commit/14136a5b0c6aaff80964bbe62d385c4e8925ab43)
 - [Reorder the Board View menu and add its planned views](https://github.com/wekan/wekan/commit/876b0a2c12edffcff323900a2f50807816cfabf6)
 - [The board's controls fold into one caret](https://github.com/wekan/wekan/commit/7d0396ebec899e0ade36d78cf6a19ad8f6fba4ff)
 - [The visibility and watch buttons are named too](https://github.com/wekan/wekan/commit/7ac766992f79878f114434844ecbaa6b68091e9e)
 - [Buttons show their names where there is room](https://github.com/wekan/wekan/commit/dfaf196a83dcb015a1f23d34f2eedc5ffcfa5a39)
 - [The board's controls wrap one button at a time](https://github.com/wekan/wekan/commit/2fb4f471204935e92156c4756e1705aef790dc88)
 - [Named view menus, and a Filter button that closes its panel](https://github.com/wekan/wekan/commit/f62258b5cbcd58c1366ae8e67929e56724385ec9)
 - [The board's second header bar is removed](https://github.com/wekan/wekan/commit/0461de062fe111b930c1d39f159039464190ccc5)
 - [Both view menus move to the first header bar](https://github.com/wekan/wekan/commit/6e9cb2d33bab9bd3fab31345426a2d2f717aa3a5)
 - [Popup selection of the Lists, Swimlanes and Calendar views](https://github.com/wekan/wekan/commit/96abe3c6914ce37d9fb44da8fda375e40ad65c9e)
