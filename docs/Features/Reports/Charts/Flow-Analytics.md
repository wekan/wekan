# Flow analytics

Five pages at the bottom of **Board View**, after Pulse:
**Aging WIP**, **Blocker Analysis**, **Monte Carlo Forecasts**,
**Process Behavior (XmR)**, and **Work Item Size vs. Cycle Time**.
Each page has the existing **Export → PDF / Excel** menu at the top.
The exported tables include the selected report parameters and underlying data.

## Existing features reused

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
changes. Reads never alter a board or fabricate a historical timestamp.

## Aging WIP

Show open, unarchived cards in their current lists, with elapsed calendar days
since the last recorded entry to that list. Moves within the same list (for
example to another swimlane), comments and other edits do not reset age.
Archived/deleted cards and completed cards do not count as WIP.

The comparison line is the 85th percentile of recorded completed stays in that
list, shown only after at least five observations. Highlight cards above it.
The table shows the list, current age, comparison threshold and sample count.
Missing list-entry history is **unknown**, not zero and not card creation time.
No particular first/last list naming convention is imposed on the board.

## Blocker Analysis

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
Removed cards or history gaps cannot be reconstructed from current board data;
the report states this limitation. Overlapping causes contribute separate
card-days per cause, so sums across causes are not unique wall-clock downtime.

## Monte Carlo Forecasts

Choose a target number of cards, a target date and a historical window of 7–365
calendar days (default 90). Use full UTC days before today, including days with
zero completions; exclude days before the earliest current board card. Sample
that daily throughput with replacement in 2,000 trials.

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

## Process Behavior (XmR)

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

## Work Item Size vs. Cycle Time

Select Planning Poker or one of the board's number custom fields. Each valid
completed card is a point: X = recorded estimate, Y = cycle days. Tooltips and
the table identify the card and completion date. Missing estimates, non-numeric
values and invalid durations are omitted; a real zero estimate remains valid.
The current estimate is used, so changing an estimate after delivery changes
the plot. The report does not silently substitute actual spent time.

## Dependencies and loading

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
