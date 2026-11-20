# Board reports

Twelve reports of the Board View menu, added on 2026-11-20 after comparing
WeKan's charts with the reports of Jira, Azure DevOps, Nave, ActionableAgile and
the Flow Framework. Each opens like the other charts: the **export bar at its
top** (PDF and Excel, the same as every board chart), the chart drawn with
Chart.js, and the data table under it, which is also what the export writes.

The calculations are `models/lib/boardReports.js` (`BOARD_REPORTS`), pure
functions tested by `tests/boardReports.test.cjs`; the server loads only what a
report reads (`server/lib/boardChartData.js` `loadBoardReport`). A card is
**finished** at its end date, else when it was archived - as in the other
charts. Weeks start on Monday (UTC); the weekly reports show the board's weeks,
at most the last 52, and the chart the last 24 of them.

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

## Who sees them

The same as the other charts (`models/lib/exportAccess.js`): a member who may
see only the cards assigned to them gets none of these reports, because each
reads every card of the board. The instance can turn them off with the other
flow charts in Admin Panel → Settings → Features, and a board admin can hide
each in Board Settings → Board View.

## Export

The export bar at the top of each report writes its title and table as PDF or
Excel (`models/exportCharts.js`, `models/lib/chartExportRows.js`). An export
follows Admin Panel → Anonymize export users for the names in Workload.
