# Problems / Instrumentation

## What it is

Live counters of what this WeKan server is doing, from Meteor 3.6's
instrumentation events: how many DDP connections are open, and how often each
method and publication is called, how often it fails, and how long it takes.
It answers "which part of WeKan is busy or failing right now" without a
separate monitoring tool. Only a site admin can see it.

## Read more

- [Instrumentation (computer programming)](https://en.wikipedia.org/wiki/Instrumentation_(computer_programming)) -
  measuring a running program from inside it.
- [Meteor instrumentation package](https://github.com/meteor/meteor/tree/devel/packages/instrumentation)
  and [Meteor documentation](https://docs.meteor.com/) - the events this page
  counts.
- WeKan: [Speed](Speed.md), [CPU usage](CPU-usage.md), [Problems](README.md).

## How to use it

1. Sign in as a site administrator and open **Admin Panel → Problems →
   Instrumentation**.
2. Read the DDP connection line: active, opened and closed connections, and
   when the counters started.
3. Above the table, one bar per area of WeKan - Cards, Boards, Lists, Login,
   People, Notifications, Attachments, Settings, Problems and the rest - gives
   the whole picture at a glance: beside each bar are the calls, the average
   duration and the errors.
4. Click an area to show only its methods and publications in the table;
   click it again to show all.
5. Type in the search box to filter the table by type and name. The table has
   10 rows a page with the columns Type, Method or publication, Calls,
   Completed, Errors, Avg ms and Max ms.

The page refreshes every five seconds.

## How the numbers are calculated

Per operation, in
[server/lib/instrumentationSummary.cjs](../../../../server/lib/instrumentationSummary.cjs):

- **Calls** - +1 on each `method.start` or `publication.start`.
- **Completed** - +1 on each `method.end` or `publication.ready`.
- **Errors** - +1 on each `method.error` or `publication.error`.
- **Avg ms** - the sum of the durations Meteor supplied on end, ready and error
  events, divided by how many had a duration, rounded to whole milliseconds.
  Empty when Meteor supplied none.
- **Max ms** - the longest of those durations, rounded.
- **DDP connections** - opened +1 and active +1 on `ddp.connection.open`;
  closed +1 and active -1 (never below 0) on `ddp.connection.close`.
- At most **200** operation names are kept; a new name after that is not
  counted. Names are cut at 120 characters. The page's own
  `getInstrumentationReport` poll is not counted.
- Rows are sorted by calls, most first.

Per area, in
[models/lib/instrumentationAreas.js](../../../../models/lib/instrumentationAreas.js)
(`summarizeByArea`):

- Calls, completed and errors are the sums over the area's operations.
- The average duration is weighted by completed calls: the sum of each
  operation's average × its completed count, divided by the completed count of
  the timed operations, rounded.
- The bar's length is the area's calls divided by the busiest area's calls
  (`share`), shown as a percentage with at least 1 % so a small area still
  shows. Its red end is errors divided by calls (at most 100 %), shown with at
  least 4 % when there are any errors.
- An area with no calls and no errors is not shown; areas are sorted by calls.

## How it works in WeKan

- [server/methods/instrumentationReport.js](../../../../server/methods/instrumentationReport.js)
  listens with `Instrumentation.on(type, ...)` for the nine event types and
  answers `getInstrumentationReport`, which refuses anybody who is not
  `isAdmin`.
- The counters exist only in this WeKan server process. They start when the
  server starts, reset on restart, and show one process when multiple
  instances run. Operation names and counts are retained in memory (at most 200
  names). Arguments, results, error details, addresses, and user/connection IDs
  are never retained by this report.
- The grouping is
  [models/lib/instrumentationAreas.js](../../../../models/lib/instrumentationAreas.js):
  an operation belongs to the first area whose name pattern matches it, so the
  specific areas come before the general ones. An operation that fits no area
  is under Other, and
  [tests/instrumentationAreas.test.cjs](../../../../tests/instrumentationAreas.test.cjs)
  keeps that to a handful of WeKan's own.
- The page is the `instrumentationReport` template in
  [client/components/settings/adminProblems.jade](../../../../client/components/settings/adminProblems.jade)
  and [adminProblems.js](../../../../client/components/settings/adminProblems.js),
  which calls the method every 5,000 ms.
- Tests: [tests/instrumentationReport.test.cjs](../../../../tests/instrumentationReport.test.cjs),
  [tests/instrumentationAreas.test.cjs](../../../../tests/instrumentationAreas.test.cjs)
  and [tests/playwright/specs/admin-instrumentation.e2e.js](../../../../tests/playwright/specs/admin-instrumentation.e2e.js).

## Commits

- [Cloud Panel methods get an area of their own](https://github.com/wekan/wekan/commit/240f0dad935cba56618346fa0781ac1e72159af6)
 - [Budget and billing methods get an area of their own](https://github.com/wekan/wekan/commit/604b3dbe84c17d11af722826741866c8953e91b3)
 - [Workload and capacity methods get an area of their own](https://github.com/wekan/wekan/commit/165dfa3c1676f6069d456ead021fa0db69f92e22)
 - [The whole picture as one bar per area of WeKan](https://github.com/wekan/wekan/commit/2b8a33022b74417397f0c53890d13c10eb37a29a)
 - [Meteor instrumentation in Admin Panel / Problems](https://github.com/wekan/wekan/commit/23ed8d927fa0ad110b341dc346a4ea11937a2047)
