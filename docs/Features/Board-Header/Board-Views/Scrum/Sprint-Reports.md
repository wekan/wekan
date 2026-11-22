# Sprint Report and Velocity

## What it is

A sprint report tells what happened in one sprint: what the team committed
to, what it completed, what was added or removed during the sprint and what
was left unfinished. Velocity lists those results for every closed sprint, so
the team can plan the next sprint from what it really did. Board View / Sprint
Report displays a selected closed sprint. Board View / Velocity lists closed
sprints chronologically. Both use persisted start and close snapshots, so later
estimate changes do not rewrite finished results.

## Read more

- Wikipedia: [Velocity (software development)](https://en.wikipedia.org/wiki/Velocity_(software_development)),
  [Burndown chart](https://en.wikipedia.org/wiki/Burndown_chart) and
  [Scrum (project management)](https://en.wikipedia.org/wiki/Scrum_(project_management)).
- [The Scrum Guide](https://scrumguides.org/scrum-guide.html).
- In WeKan: [Sprints](Sprints.md), [Product Backlog](Product-Backlog.md),
  [the Scrum design](Scrum-Design.md),
  [Burndown and Velocity Chart](../Charts/Burndown-and-Velocity-Chart.md) and
  [Scrum settings](../../../Board-Sidebar/Board-Settings/Scrum-Settings.md).

## How to use it

**Sprint Report:**

1. Open a board, click the **Board View** menu and choose **Scrum → Sprint
   Report**.
2. Choose the sprint in **Sprint**.
3. Choose **Cards** or **Estimate** in the selector above the bars.
4. Under the report, read **Daily scope and remaining work (observations)**
   and **Scope and burndown, change by change**.
5. **Export** in the toolbar downloads the sprint results as **PDF** or
   **Excel**; the daily section has an **Export** of its own for the
   observations. **Refresh** reloads the report.

**Velocity:**

1. Open **Board View → Scrum → Velocity**.
2. Choose **Cards** or **Estimate**, and read one row per closed sprint.
3. **Export** downloads the rows as PDF or Excel.

## How the numbers are calculated

From [models/lib/scrumReports.js](../../../../../models/lib/scrumReports.js):

- **Committed** = the cards of the sprint's start snapshot.
- **Completed** = the cards marked done in the close snapshot (done under the
  sprint's completion policy: the card is marked complete, or it is in a list
  whose Scrum category is Done).
- **Completed commitment** = the committed cards that are completed, with
  their start estimates.
- **Added to scope** = close snapshot cards not in the start snapshot;
  **Removed from scope** = start snapshot cards not in the close snapshot;
  **Incomplete** = close snapshot cards not done.
- Every total is `{ count, estimate, unknown }`: the number of cards, the sum of
  the known estimates (numbers of 0 or more) and the number of cards whose
  estimate is unknown.
- **Velocity** = one row per closed sprint with a close snapshot, oldest close
  first.
- **Planned working days** (`plannedWorkingDays`): the days from the planned
  start to the planned end, both included, in UTC, that are working days of
  the calendar in the start snapshot (Monday to Friday by default). Whole weeks
  count `weeks × working days per week`, and the remaining days are checked one
  by one. Unknown (a dash, or an empty export cell) without both dates or a
  recorded calendar.
- **Bars**: each bar's width is `value / largest value of its group × 100%`.
  A group is the reports with the same unit, estimate source, custom field,
  completion policy and partial flag
  (`reportChartGroups`); sprints without both snapshots are left out.
- **Daily observations**
  ([models/lib/scrumDailyHistory.js](../../../../../models/lib/scrumDailyHistory.js)):
  a server job runs every 15 minutes and records the first observation of each
  UTC day for every active sprint ([server/scrumDailySnapshots.js](../../../../../server/scrumDailySnapshots.js),
  [server/lib/scrumDailyCapture.js](../../../../../server/lib/scrumDailyCapture.js)).
  Each shows scope, remaining and completed totals. The latest 366 are shown.
- **Scope and burndown, change by change**
  ([models/lib/scrumScopeReplay.js](../../../../../models/lib/scrumScopeReplay.js)):
  the board's History since the sprint started is replayed, one row for each
  change to the sprint's cards, estimates or completed work. At most 20,000
  History rows are read; beyond that the replay is marked incomplete. When the
  replay does not reproduce the sprint's own start or close snapshot, it is
  marked inconsistent.

## How it works in WeKan

The reports distinguish original commitments, completed work, added and removed
scope, and incomplete work. Each total includes card count, known estimate sum
and number of cards with unknown estimates. Unknown estimates are not zeroes.
Compare results only when units and completion policies match.
Native transfers require each sprint's start and close snapshots to agree on
estimate unit, estimate source, custom-field identifier and completion policy.
Mixed snapshot policies are rejected before import creates a board, matching
the rule that active sprints cannot change these settings. Workweek calendars
may differ; planned duration continues to use the start calendar. Supporting
external historical sprints with mixed policies requires separate report
contexts and remains pending, rather than treating unlike totals as comparable.

An unfinished sprint does not produce a completed-sprint velocity result.
Assigned-only members receive snapshots filtered to cards they can currently
see. Those partial reports must not be treated as whole-team totals.

The Export action uses the existing chart export popup and produces Excel or
PDF with the same report data and requesting user's access restrictions.
Exports retain the snapshot estimate source, custom-field identifier and
completion policy as stable identifiers. They also include the count, original
estimate total and unknown-estimate count for completed original commitments.
That subtotal excludes work added after sprint start and uses start estimates,
whereas the general completed total uses close-snapshot estimates. These columns
make changing estimates and unlike completion policies visible outside WeKan.
Excel uses columns. PDF prints wrapped labelled values for each sprint so the
wide set of metrics does not get clipped into narrow columns.
Selecting a sprint also displays its daily scope and remaining-work observations.
Each UTC day has at most one measured state, shown with its actual capture
timestamp. The bars offer card counts or known estimates with unknown counts;
they omit unobserved days and do not interpolate changes. Active sprints can
have daily observations before a closed-sprint result exists. Empty history,
partial visibility and truncation to the latest 366 observations are labelled.
Refreshing reloads the selected report. The daily section's own Export action
downloads those observations as Excel or PDF; the toolbar Export action still
exports sprint results. Both daily formats use the same permission-scoped,
bounded reader as the view. They retain sprint names, exact UTC capture times,
units, estimate sources, custom-field identifiers, completion policies and
separate count/known-estimate/unknown totals. Excel includes a Notes sheet and
PDF includes wrapped notices explaining observations, partial results and any
366-observation truncation, including when the result is empty. PDF prints
wrapped labels rather than clipping sixteen columns into a page-width table.
Unobserved days are never fabricated. The event-complete historical burndown
listed in [the Scrum design](Scrum-Design.md) is now the **Scope and burndown,
change by change** section, replayed from History (2026-10-02).

Reports and Excel/PDF exports also show the planned working-day count. The
calendar is retained in the sprint's start snapshot, so subsequent board
calendar changes do not alter the result. Planned start and end dates are
inclusive UTC dates. A weekend-only range can have zero working days. Legacy
snapshots without a recorded calendar, or sprints without both planned dates,
show an unknown value (a dash on screen and an empty export cell). Native
transfer and full-board duplication preserve the snapshot calendar. This is
planned calendar duration, not a measurement of hours worked or daily progress.

### Charts

Responsive horizontal bars appear above the report table. A metric
selector switches between card counts and known estimates. Velocity compares
committed and completed work; Sprint Report also shows added, removed and
incomplete work. Exact values and unknown-estimate counts remain visible beside
the bars.
Scales are separated by snapshot unit, estimate source, custom field and
completion policy. Partial results use a separate scale from complete results.
Partial-snapshot warnings remain visible. Empty or unfinished
sprints produce no bars. Charts use native HTML/CSS, requiring no additional
dependency, and retain
the existing permission-filtered report data and export actions.

### Files and tests

- View: [client/components/boards/scrum/scrumView.jade](../../../../../client/components/boards/scrum/scrumView.jade)
  (`scrumReportTable`), [scrumDailyHistory.jade](../../../../../client/components/boards/scrum/scrumDailyHistory.jade)
  and [scrumScopeHistory.jade](../../../../../client/components/boards/scrum/scrumScopeHistory.jade).
- Server: `scrum.getBoardData`, `scrum.getDailyHistory` and
  `scrum.getScopeHistory` in [server/scrum.js](../../../../../server/scrum.js);
  exports through [server/lib/scrumChartData.js](../../../../../server/lib/scrumChartData.js);
  snapshot rows in [server/lib/scrumSnapshotStore.js](../../../../../server/lib/scrumSnapshotStore.js);
  collections `ScrumSprints` ([models/scrumSprints.js](../../../../../models/scrumSprints.js))
  and `ScrumDailySnapshots` ([models/scrumDailySnapshots.js](../../../../../models/scrumDailySnapshots.js)).
- Tests: [tests/scrumReports.test.cjs](../../../../../tests/scrumReports.test.cjs),
  [tests/scrumDailyChart.test.cjs](../../../../../tests/scrumDailyChart.test.cjs),
  [tests/scrumScopeReplay.test.cjs](../../../../../tests/scrumScopeReplay.test.cjs),
  [tests/scrumSnapshotRows.test.cjs](../../../../../tests/scrumSnapshotRows.test.cjs),
  [tests/integration/scrumDailySnapshots.test.cjs](../../../../../tests/integration/scrumDailySnapshots.test.cjs)
  and the UI specs [scrum-chart-scope.e2e.js](../../../../../tests/playwright/specs/scrum-chart-scope.e2e.js),
  [scrum-daily-history.e2e.js](../../../../../tests/playwright/specs/scrum-daily-history.e2e.js)
  and [scrum-scope-history.e2e.js](../../../../../tests/playwright/specs/scrum-scope-history.e2e.js).

## Commits

 - [Release reports count a card in each of its releases](https://github.com/wekan/wekan/commit/727ceedd011106189b16013d710409caf3b690ca)
 - [Sprint snapshot rows are kept outside the sprint document](https://github.com/wekan/wekan/commit/b6ca287df3b2adb744abed37cae779c750a9bf96)
 - [The scope chart is told apart from the History view](https://github.com/wekan/wekan/commit/29adf8be5c9dc5580ef3f522be4b733d1c89d02a)
 - [A sprint's scope and burndown change by change, from History](https://github.com/wekan/wekan/commit/306f127a31b64b501f7ee3a0dff58f62dbeac04b)
 - [Incomplete Scrum imports are left out of reports](https://github.com/wekan/wekan/commit/8cb463722a5eee831a64b27a4361de5b99b4f491)
 - [Daily observations export to Excel and PDF](https://github.com/wekan/wekan/commit/15ff19d2a841e41008a1b2c47b936216f66ca160)
 - [Measured daily history in the Sprint Report](https://github.com/wekan/wekan/commit/634abca4138faea1463b005416538c25d100bec5)
 - [Native transfer checks that snapshot policies agree](https://github.com/wekan/wekan/commit/d269c8c70521945486b5cc19a6987a8ef51f433f)
 - [Exports keep the report context and commitment totals](https://github.com/wekan/wekan/commit/8e4cf5f76fd6521649e7a1191b4b5c720d9035d5)
 - [Sprint calendars and planned working days](https://github.com/wekan/wekan/commit/196faa9cd5c49ffdc5ee7cfa598e76c480415da9)
 - [Commitment reports without quadratic matching](https://github.com/wekan/wekan/commit/5ac57edde2e9992a3b471c432650cb18d2e2e1c1)
 - [Partial reports get their own chart scale](https://github.com/wekan/wekan/commit/89f7aa985c534e760a7454ca6774cf53e50dc949)
 - [Sprint report and velocity bars with a metric selector](https://github.com/wekan/wekan/commit/676536bcd52110af6167fc67d703b22a0cb09f95)
 - [Sprint planning and snapshot reports](https://github.com/wekan/wekan/commit/83eac102113623f8e0bc91b012c994b3c8291765)
