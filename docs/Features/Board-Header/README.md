# Board header

The bar above a board's lists: the board title, its visibility and watch
controls, search, filter, multi-selection, and the **Board View** chooser.
The chooser is drawn from `BOARD_VIEWS` in `models/lib/boardViewSettings.js`
(`boardChangeViewPopup` in `client/components/boards/boardHeader.jade`), and
`client/components/boards/boardBody.jade` renders the chosen view. Which views a
board offers, and which one it opens in, is set in
[Board Settings / Board View](../Board-Sidebar/Board-Settings/Board-View.md).

- [Search](Search.md)
- [Board View Settings popup](Board-Views/Settings-Popup.md)
- [Board-view titles](Board-Views/Title-Rendering.md) and [activity rendering](Board-Views/Activity-Rendering.md)
- [Time and time-tracking issue audit](Board-Views/Charts/Time-Issue-Audit.md)
- [Scrum design](Board-Views/Scrum/Scrum-Design.md) and [Scrum History recovery](Board-Views/Scrum/Scrum-History-Recovery.md)

## Board View menu

Every entry of the menu, in its order, with the template that draws it.
Role permissions apply in every view; see
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
