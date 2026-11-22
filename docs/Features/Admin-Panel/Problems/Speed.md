# Admin Panel / Problems / Speed

## What it is

The Speed pane lists the HTTP requests that took too long to answer. WeKan
times every request that is not a static file, and when one takes at least two
seconds (by default) it records it here, so an administrator can see which
pages or REST API calls are slow and how often. Address:
`/admin/problems/speed`. Site administrators only.

## Read more

- [Response time](https://en.wikipedia.org/wiki/Response_time_(technology)) on
  Wikipedia - what the timed duration is.
- [Application performance management](https://en.wikipedia.org/wiki/Application_performance_management)
  on Wikipedia - the wider practice this pane is a small part of.
- In WeKan: [Performance](Performance.md) (how boards load their cards),
  [Large-Boards.md](Large-Boards.md), [Instrumentation](Instrumentation.md)
  (DDP method and publication timings), [CPU usage](CPU-usage.md),
  [Design.md](Design.md).

## How to use it

**Read the slow requests**

1. Log in as a site administrator.
2. Click your avatar or username at the top right and choose **Admin Panel**.
3. Click the **Problems** tab.
4. In the left menu, under **Reports**, click **Speed**.
5. Read the table, newest first. The Detail column says which request it was
   and how long it took, for example `GET /b/abc/my-board — 5120ms >= 2000ms`.
6. Type part of a path, a username or an address in the search box to filter
   the rows as you type.

**Acknowledge or clear the stream**

1. Open Problems → **Summary**.
2. Tick **Admin Panel → Problems → Speed**.
3. Click **Acknowledge** or **Clear** ([Summary.md](Summary.md)).

**Change or turn off the threshold**

1. Set `WEKAN_SLOW_REQUEST_MS` to the number of milliseconds a request may take
   before it is recorded, or to `0` to turn the detector off.
2. Restart WeKan.

## How the numbers are calculated

From [server/lib/speedMiddleware.js](../../../../server/lib/speedMiddleware.js):

| Number | How it is computed |
| --- | --- |
| Duration (`<ms>ms`) | `Date.now()` when the request arrives, subtracted from `Date.now()` when the response's `finish` event fires. |
| Threshold | `WEKAN_SLOW_REQUEST_MS`, default `2000`; `0` (or any value that is not above 0) turns the detector off. |
| Severity | `medium` when the duration is at least three times the threshold (6000 ms by default), otherwise `low`. |
| Attempts | how many slow requests were folded into this row (`count`); empty when it happened once. |
| New-problem count on Summary | rows newer than the last acknowledgement whose severity is not `info`. |
| Rows per page | 10 (`TABLE_PAGE_ROWS_PER_PAGE`). |
| Retention | rows older than `EVENTLOG_RETENTION_DAYS` (default 90) are deleted once a day. |

Folding: a row's identity is its stream, name, category, action, source,
severity and CWE ([models/lib/eventLogSummary.js](../../../../models/lib/eventLogSummary.js)),
not its path. So every slow request of the same severity is folded into the
same row, whose count and date go up, and the Detail column shows the most
recent request. (An earlier version of this page said rows were folded per
request path; the detail text is not part of the identity.)

## How it works in WeKan

### Where the rows come from

The `speed` stream of the `eventlog` collection. Today one detector writes it:
`server/lib/speedMiddleware.js` times every HTTP request that is not a static
asset (`.js`, `.css`, `.png`, `.jpg`/`.jpeg`, `.gif`, `.svg`, `.woff`/`.woff2`,
`.ico`, `.map`, `.webp`, `.avif`) or under `/cdn/`, and when one takes at least
`WEKAN_SLOW_REQUEST_MS` milliseconds (default `2000`; `0` turns the detector off)
it records, through [server/lib/speedLog.js](../../../../server/lib/speedLog.js):

- category `slow-request`, name `SlowRequest`, action `detected`, source `http`;
- severity `low`, or `medium` when it took three times the threshold or more;
- detail `<METHOD> <path> — <ms>ms >= <threshold>ms`, without the query string.

Rows stored under the old name `SlowBleed` are renamed to `SlowRequest` at
startup. Timing never breaks a request: any error in the middleware is
swallowed.

DDP methods and publications are not timed here; their live call counts and
durations are on [Instrumentation](Instrumentation.md). The CPU monitor writes
its own stream, shown on [CPU usage](CPU-usage.md).

The same kind of slow request that happens again is folded into the same row,
whose count and date go up ([Design.md](Design.md)).

### The table

The same read-only event table as the [Security Report](Security-Report.md):
Date and time, Category, Name, Severity, Action, Source, Username, IPv4,
Location, IPv6, Location, Attempts and Detail, newest first, 10 rows a page,
with a search box that filters as you type. It shows "No new problems." when the
stream is empty. The rows come from the admin-only `eventLogCount` and
`eventLogPage` methods in [models/eventLog.js](../../../../models/eventLog.js).

Acknowledge or clear the stream on [Summary](Summary.md). Rows older than
`EVENTLOG_RETENTION_DAYS` (default 90) are deleted daily. The rows are also on
`GET /api/admin/problems/speed`
([REST API](../../../API/REST-API.md#admin-panel-problems)).

### Tests

- [tests/securityLog.test.cjs](../../../../tests/securityLog.test.cjs) -
  the loggers behind the security, speed and tests streams, including the
  slow-request middleware.
- [tests/eventLogSummary.test.cjs](../../../../tests/eventLogSummary.test.cjs) -
  folding into one row per problem.
- [tests/resourceStreamNames.test.cjs](../../../../tests/resourceStreamNames.test.cjs) -
  the `SlowRequest` name.
- [tests/eventLogClearAndRetention.test.cjs](../../../../tests/eventLogClearAndRetention.test.cjs) -
  Clear and the 90-day retention.

## Related

- [Performance](Performance.md) - how boards load their cards.
- [Large-Boards.md](Large-Boards.md)

## Commits

 - [Name the rows SlowRequest instead of SlowBleed](https://github.com/wekan/wekan/commit/cfd9a62466a64b58d514d46c3c6560f003704523)
 - [Clear button and 90-day retention for the problem streams](https://github.com/wekan/wekan/commit/fefabbf1134fd7d4c56c4375c0ac103032b75770)
 - [Show the origin context (address, location) in every event report](https://github.com/wekan/wekan/commit/fa68600bb5754609cef3768cdcbec93102030c16)
 - [One summary row per problem, with who and how often](https://github.com/wekan/wekan/commit/3d08c65bb2e51ac9e0a21547e5b206f386c369a6)
 - [Record slow HTTP requests to the Speed stream](https://github.com/wekan/wekan/commit/5ee3987d0da179e2c6bffea721aa073604d5af70)
 - [Store the security, speed and tests streams in the WeKan database](https://github.com/wekan/wekan/commit/1d82ef8eae344ca0565d0858fc697f470e471dd7)
 - [First security and speed loggers](https://github.com/wekan/wekan/commit/9f07aa4506e5cdb54e4de42c7f551f83a1ae5b07)
 - [Add the Problems page with its Speed pane](https://github.com/wekan/wekan/commit/0085f7fbfa81e820ce0736dd28b2b0786ac6e41c)
