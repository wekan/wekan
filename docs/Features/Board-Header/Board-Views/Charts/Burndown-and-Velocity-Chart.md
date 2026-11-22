# Burndown and Velocity Chart

## What it is

A burndown chart shows how much work is still left, day by day, so a team can
see whether it will finish in time. A velocity chart shows how much work each
finished sprint completed, so the next sprint can be planned from what the
team really did. WeKan draws both itself, from the board's own cards and
sprints, and there are also older external tools that draw a burndown from a
WeKan board.

## Read more

- [Burndown chart](https://en.wikipedia.org/wiki/Burndown_chart) - Wikipedia,
  including the burnup chart.
- Wikipedia: [Velocity (software development)](https://en.wikipedia.org/wiki/Velocity_(software_development)).
- Wikipedia: [Scrum (project management)](https://en.wikipedia.org/wiki/Scrum_(project_management)).
- Atlassian's tutorial [Burndown charts](https://www.atlassian.com/agile/tutorials/burndown-charts),
  for comparison with Jira.
- In WeKan: [Board report charts](Board-Report-Charts.md) (Burndown and Burnup),
  [Sprint Report and Velocity](../Scrum/Sprint-Reports.md),
  [Board reports](Board-Reports.md) (Release Burndown) and
  [Sprints](../Scrum/Sprints.md).

External tools that draw a burndown from a WeKan board:

- [Discussion](https://github.com/wekan/wekan/discussions/4282) about burndown
  and velocity charts.
- WeKan Python Burndown Chart:
  - [Original](https://github.com/Gelmes/Wekan-Python-Burndown)
  - [WeKan fork](https://github.com/wekan/Wekan-Python-Burndown)
- [WeKan Burndown Chart Chrome extension](https://chrome.google.com/webstore/detail/burndown-for-wekan/agdbocbobcbelnekjibocbilodjgopgh?)

## How to use it

**The board's burndown and burnup:**

1. Open a board.
2. Click the **Board View** menu at the top of the board.
3. Under **Scrum**, choose **Burndown** (or **Burnup**).
4. Read the chart and the table under it. **Export** at the top offers
   **PDF** and **Excel** of the same numbers.

**Velocity of finished sprints:**

1. Plan and run sprints in **Board View → Scrum → Sprints** (see
   [Sprints](../Scrum/Sprints.md)) and close at least one.
2. Open **Board View → Scrum → Velocity**.
3. Choose **Cards** or **Estimate** in the selector above the bars.

**The burndown of one sprint:** open **Board View → Scrum → Sprint Report** and
select the sprint. It shows the daily scope and remaining work, and the scope
and burndown change by change (see [Sprint Report and Velocity](../Scrum/Sprint-Reports.md)).

**The burndown of a release:** open **Board View → Scrum → Release Burndown**
(see [Board reports](Board-Reports.md)).

## How the numbers are calculated

From `computeBurndown` and `computeBurnup` in
[models/lib/chartCalculations.js](../../../../../models/lib/chartCalculations.js),
called by [server/lib/boardChartData.js](../../../../../server/lib/boardChartData.js):

- A card is **completed** at its `endAt`, else at its `archivedAt`; a card with
  neither is not completed. Moving a card to a list named Done does not
  complete it.
- The chart runs one point per UTC day, from the day the board's oldest card
  was created until today.
- **Remaining** on a day = the cards created by the end of that day that were
  not completed by the end of that day.
- **Ideal** = a straight line from the number of cards that existed at the
  start of the first day down to 0 on today, i.e.
  `start count - start count × day index / (number of days - 1)`, never below
  0, rounded to two decimals.
- **Burnup**: per day, **total** = cards created by the end of the day, and
  **completed** = cards completed by the end of the day.
- **Velocity** ([models/lib/scrumReports.js](../../../../../models/lib/scrumReports.js)
  `velocityRows`): one row per closed sprint, oldest close first. **Committed**
  is the sprint's start snapshot and **Completed** the cards done in its close
  snapshot, each as a card count, a sum of known estimates and a count of
  unknown estimates.

## How it works in WeKan

- The Burndown and Burnup views are `boardChartView` wrappers in
  [client/components/boards/chartPlaceholderViews.jade](../../../../../client/components/boards/chartPlaceholderViews.jade),
  drawn by [client/components/boards/charts/boardCharts.js](../../../../../client/components/boards/charts/boardCharts.js)
  with Chart.js from the `boardChartData` method
  ([server/publications/boards.js](../../../../../server/publications/boards.js)).
- Velocity is the Scrum view
  ([client/components/boards/scrum/scrumView.jade](../../../../../client/components/boards/scrum/scrumView.jade))
  reading the sprint snapshots; see [Sprint Report and Velocity](../Scrum/Sprint-Reports.md).
- Tests: [tests/chartCalculations.test.cjs](../../../../../tests/chartCalculations.test.cjs)
  and [tests/scrumReports.test.cjs](../../../../../tests/scrumReports.test.cjs).

## Commits

 - [Release Burndown and the other board reports](https://github.com/wekan/wekan/commit/63b5e089f5113960f22fc3d72e3dce3ae86981e2)
 - [A sprint's scope and burndown change by change, from History](https://github.com/wekan/wekan/commit/306f127a31b64b501f7ee3a0dff58f62dbeac04b)
 - [Sprint report and velocity bars with a metric selector](https://github.com/wekan/wekan/commit/676536bcd52110af6167fc67d703b22a0cb09f95)
 - [Sprint snapshot reports and velocity](https://github.com/wekan/wekan/commit/83eac102113623f8e0bc91b012c994b3c8291765)
 - [Report charts drawn with Chart.js](https://github.com/wekan/wekan/commit/5d5317d968907edcaa06011dc8fd760a21121e4f)
 - [Burndown, Burnup and the other report charts, with PDF and Excel export](https://github.com/wekan/wekan/commit/3abc1078c2f060cb3fa373f224c530013f0f38d1)
