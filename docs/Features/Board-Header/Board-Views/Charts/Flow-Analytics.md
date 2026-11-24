# Flow analytics

## What it is

Five pages of the **Board View** menu, in its **Kanban flow** group:
**Aging WIP**, **Blocker Analysis**, **Monte Carlo Forecasts**,
**Process Behavior (XmR)**, and **Work Item Size vs. Cycle Time**. They tell
which open cards are getting old in their list, which cards block others and
for how long, when a number of cards will probably be done, whether cycle
times are unusually long, and whether bigger estimates really take longer.
Each page has the existing **Export → PDF / Excel** menu at the top.
The exported tables include the selected report parameters and underlying data.

## Read more

- Wikipedia: [Kanban (development)](https://en.wikipedia.org/wiki/Kanban_(development)),
  [Work in process](https://en.wikipedia.org/wiki/Work_in_process),
  [Percentile](https://en.wikipedia.org/wiki/Percentile),
  [Monte Carlo method](https://en.wikipedia.org/wiki/Monte_Carlo_method),
  [Bootstrapping (statistics)](https://en.wikipedia.org/wiki/Bootstrapping_(statistics)),
  [Shewhart individuals control chart](https://en.wikipedia.org/wiki/Shewhart_individuals_control_chart),
  [Control chart](https://en.wikipedia.org/wiki/Control_chart),
  [Cycle time](https://en.wikipedia.org/wiki/Cycle_time),
  [Scatter plot](https://en.wikipedia.org/wiki/Scatter_plot) and
  [Planning poker](https://en.wikipedia.org/wiki/Planning_poker).
- [NIST individuals chart definition](https://www.itl.nist.gov/div898/handbook/pmc/section3/pmc322.htm),
  which the XmR limits follow.
- [Chart.js scatter plots](https://www.chartjs.org/docs/latest/charts/scatter.html).
- In WeKan: [Board report charts](Board-Report-Charts.md),
  [Board reports](Board-Reports.md), [the time issue audit](Time-Issue-Audit.md),
  [Planning Poker](../../../Cards/Planning-Poker.md) and
  [Dependencies export](../../../Board-Sidebar/Board-Settings/Import-Export/Dependencies/README.md).

## How to use it

**Open a report:**

1. Open a board.
2. Click the **Board View** menu at the top of the board.
3. Under **Kanban flow**, choose **Aging WIP**, **Blocker Analysis**,
   **Monte Carlo Forecasts**, **Process Behavior (XmR)** or
   **Work Item Size vs. Cycle Time**.
4. Read the note under the title, which says how the page measures, then the
   chart and table. **Underlying history** opens the detailed rows.
5. **Export** at the top downloads the same tables as **PDF** or **Excel**.

**Monte Carlo Forecasts:**

1. Fill in **Target cards**, **Target date** and **History days**.
2. Click **Apply**. The table shows the 50%, 70%, 85% and 95% results.

**Work Item Size vs. Cycle Time:**

1. In **Size field**, choose **Planning Poker** or one of the board's number
   custom fields.
2. Click **Apply**.

## How the numbers are calculated

The calculations are in [models/lib/flowAnalytics.js](../../../../../models/lib/flowAnalytics.js).
A card is completed at `endAt`, falling back to `archivedAt`; cycle time starts
at `startAt`, falling back to `createdAt`.

### Aging WIP

Show open, unarchived cards in their current lists, with elapsed calendar days
since the last recorded entry to that list. Moves within the same list (for
example to another swimlane), comments and other edits do not reset age.
Archived/deleted cards and completed cards do not count as WIP.

The comparison line is the 85th percentile of recorded completed stays in that
list, shown only after at least five observations. Highlight cards above it.
The table shows the list, current age, comparison threshold and sample count.
Missing list-entry history is **unknown**, not zero and not card creation time.
No particular first/last list naming convention is imposed on the board.

The 85th percentile is the nearest-rank value: of the sorted stays, the one at
position `ceil(0.85 × count)`.

### Blocker Analysis

Group episodes by the blocking card (the cause), showing affected cards and
lists, episode count, currently open episodes and measured blocked card-days.
An episode begins when an unresolved dependency starts blocking an open card.
It ends when the dependency is removed or changes to a non-blocking type, either
card completes/is archived/is deleted, or the cards cease sharing this board.
Moving the affected card to another list splits the episode by workflow stage.
Reverse representations of the same edge count once. Related-to/fixes links,
self-links and targets outside the current board are excluded.

The detailed table includes blocker, affected card, list, start, end and elapsed
days. A still-open episode runs to the report time. Dependencies that predate
recorded history have an **unknown start** and do not contribute invented days.
New card deletions retain a snapshot in universal History, so their prior
episodes remain reportable. Cards purged before snapshots were recorded and
history gaps cannot be reconstructed. Overlapping causes contribute separate
card-days per cause, so sums across causes are not unique wall-clock downtime.

The causes are sorted by blocked card-days, then by episode count.

### Monte Carlo Forecasts

Choose a target number of cards, a target date and a historical window of 7–365
calendar days (default 90). Use full UTC days before today, including days with
zero completions; exclude days before the earliest board card with retained data. Sample
that daily throughput with replacement in 2,000 trials.

The defaults are 10 target cards (1–10,000) and a target date 30 days from
today; the target date may be at most ten years ahead.

Show 50%, 70%, 85% and 95% confidence results for both questions:

- **When will the target number finish?** Upper-tail completion dates/days.
- **How many will finish by the target date?** Lower-tail counts: an 85%
  commitment means at least that count in 85% of trials.

Identical inputs on the same UTC day use a reproducible seed so downloads agree
with the page. Trials are bounded to ten years; a percentile beyond the bound
is reported as unavailable, not as a false promised date. Zero throughput gives
no forecast. The target date represents elapsed days from today's UTC boundary;
a target of today has a zero-day horizon. This is a forecast, not a guarantee:
it assumes similar future throughput and work mix and includes weekends.

### Process Behavior (XmR)

Plot completed-card cycle times in completion order, and a second plot of the
absolute differences between successive cycle times. At least two valid
observations are required. Show the mean and natural process limits, and flag
individuals/ranges outside those limits. Invalid dates, negative durations and
future completions are excluded.

Individuals limits are mean ± 3 × mean moving range / 1.128. Moving-range limits
are 0 and 3.267 × mean moving range. This follows the
[NIST individuals chart definition](https://www.itl.nist.gov/div898/handbook/pmc/section3/pmc322.htm).
A negative individuals lower limit is retained as calculated. These are
retrospective descriptive limits; they do not alone prove process stability.

### Work Item Size vs. Cycle Time

Select Planning Poker or one of the board's number custom fields. Each valid
completed card is a point: X = recorded estimate, Y = cycle days. Tooltips and
the table identify the card and completion date. Missing estimates, non-numeric
values and invalid durations are omitted; a real zero estimate remains valid.
The current estimate is used, so changing an estimate after delivery changes
the plot. The report does not silently substitute actual spent time.

## How it works in WeKan

The pages are `boardChartView` wrappers
([client/components/boards/chartPlaceholderViews.jade](../../../../../client/components/boards/chartPlaceholderViews.jade))
of the shared chart view
([client/components/boards/charts/boardCharts.jade](../../../../../client/components/boards/charts/boardCharts.jade),
chart setup in [flowChartConfig.js](../../../../../client/components/boards/charts/flowChartConfig.js)).
The `boardChartData` method loads the cards, the card Activities and the
universal History rows of the groups `position`, `dates`, `lifecycle` and
`dependencies` ([server/lib/boardChartData.js](../../../../../server/lib/boardChartData.js)),
adds removed cards back from their History snapshots
([models/lib/timeHistory.js](../../../../../models/lib/timeHistory.js)) and
calls `computeFlowAnalytics`. Export rows are built by
[models/lib/flowAnalyticsRows.js](../../../../../models/lib/flowAnalyticsRows.js).
Tests: [tests/flowAnalytics.test.cjs](../../../../../tests/flowAnalytics.test.cjs),
[tests/flowAnalyticsTranslations.test.cjs](../../../../../tests/flowAnalyticsTranslations.test.cjs)
and the UI spec [tests/playwright/specs/flow-analytics.e2e.js](../../../../../tests/playwright/specs/flow-analytics.e2e.js).

### Existing features reused

This design was checked against the current models, server hooks, chart/export
code and feature documentation, rather than adding parallel tracking stores.

| Existing feature | Source | Reuse |
| --- | --- | --- |
| Universal History, including undo/restore | `models/changeHistory.js`, `server/models/changeHistoryHooks.js` | Timestamped before/after dates, estimates and positions; extend the field map to record dependency changes. |
| Activities and Timeline | `models/activities.js`, `models/lib/boardTimeline.js` | Card creation, list entry, archive and restore timestamps. Combine with universal position history without counting the same list entry twice. |
| Red Strings card dependencies | `models/metadata/dependencies.js`, `models/cards.js` | `blocks` and `is-blocked-by` identify blocker causes and affected work on the current board. |
| Card dates and existing chart calculations | `models/lib/chartCalculations.js` | Completion is `endAt`, falling back to `archivedAt`; cycle time starts at `startAt`, falling back to `createdAt`. A list named Done does not itself set completion. |
| Planning Poker | `poker.estimation` on cards | Numeric size estimate; do not use votes or unfinished voting results as estimates. |
| Numeric custom fields | `models/customFields.js`, `card.customFields` | Select one existing number field for story points or estimated hours. Never mix units across fields. |
| Time / Flowtime | `spentTime`, `flowStartAt` | These measure actual work; they are not substituted for estimated size or blocked time. |
| Card aging fade and scheduled aging rules | Board card-aging settings, scheduled rules | Existing inactivity measures are retained. Stage residence is a different measurement: comments must not reset its clock. |
| Board View settings and menu ordering | `models/lib/boardViewSettings.js` | Visibility, default view, ordering and saved user preference work for all five pages. |
| Charts and downloads | `boardChartView`, `chartExportRows`, chart exporters | Reuse Chart.js, authenticated board-scoped methods, safe title rendering, accessible tables, PDF and Excel. |

No new card date, estimation field, blocker collection or parallel history store
is needed. The missing stored information is **dependency changes**: add
`cardDependencies` to the existing universal History field map. Its before/after
values and `createdAt` provide blocker start/end events, including removal,
reopening and dependency-type changes. Capture dependencies on newly inserted
cards too. Existing history already supplies completion, archive and position
changes. Whole position changes are now recorded centrally for both client
and server moves, including reasons; direct REST writes explicitly record
the same diff. Deletion snapshots preserve historical chart inputs.
See [the time issue audit](Time-Issue-Audit.md) for the additional optional
move-reason setting and time-adjustment report. Reads never alter a board or fabricate a historical timestamp.

### Dependencies and loading

Reuse the installed Chart.js 4.x (MIT), which already supports bar, line and
[scatter plots](https://www.chartjs.org/docs/latest/charts/scatter.html).
Its renderer is dynamically imported when a chart mounts; the additional chart
configuration is loaded only for these views. Excel and PDF use the existing
server exporters; no spreadsheet or PDF library is added to the browser.
No new npm dependency, external analytics service or remote data transfer is
needed. Chart options are application-owned; card titles and field names are
only labels, never configuration paths or HTML.

Chart.js [license](https://github.com/chartjs/Chart.js/blob/master/LICENSE.md),
[releases](https://github.com/chartjs/Chart.js/releases), and
[security advisories](https://github.com/chartjs/Chart.js/security/advisories)
were reviewed for this reuse. A dependency check is not a guarantee that software
has no vulnerabilities; these reports do not expose configuration mutation APIs
to board content.

## Commits

 - [The five pages move into the Kanban flow group of the menu](https://github.com/wekan/wekan/commit/257835733b0ec5d950fac6feb2e13c589219bb9d)
 - [Chart data follows the export rule for assigned-only members](https://github.com/wekan/wekan/commit/d2539ca1d22cee30e617c5be9a15a01ed16e2ec9)
 - [The forecast test waits for its answer before checking export links](https://github.com/wekan/wekan/commit/c46730a22f3d1aa0adc87c384a3d794f24d0ca8e)
 - [Duplicate relationships are left out of blocker analysis](https://github.com/wekan/wekan/commit/eb527dd13fee74de89381cfd9b07e088c641eaaa)
 - [Flow chart buttons use the theme](https://github.com/wekan/wekan/commit/d962b6047995e885f5e95a8937a067785034f8b1)
 - [Removed cards and move reasons stay in the history the reports read](https://github.com/wekan/wekan/commit/6d99ad73c4361a44a0445cf396ddaaf697575833)
 - [The five flow analytics pages and reversible dependency history](https://github.com/wekan/wekan/commit/0b411b54769db56f6a5a2d9473e11e70dec9300f)
