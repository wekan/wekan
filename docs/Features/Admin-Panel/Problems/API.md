# Admin Panel → Problems → API

## What it is

**Which REST API endpoints are used, by whom, and how often.**
Address: `/admin/problems/api`. Site administrators only.

Every other pane under Problems answers *what went wrong*. This one answers
*what is being done*: `POST /api/boards` called 34 times by alice last month,
812 times yesterday by nobody with an account. Without it the only record of API
use is whatever the reverse proxy happens to keep, and most instances keep none.

The REST API is off unless `WITH_API=true`, so on an instance that never turned
it on this pane is empty — which is itself the answer.

## Read more

- [REST](https://en.wikipedia.org/wiki/REST) and
  [Web API](https://en.wikipedia.org/wiki/Web_API) on Wikipedia - what a REST
  API endpoint is.
- [Express routing](https://expressjs.com/en/guide/routing.html) - where the
  route pattern (`/api/boards/:boardId`) that names each row comes from.
- [X-Forwarded-For](https://en.wikipedia.org/wiki/X-Forwarded-For) and
  [Reverse proxy](https://en.wikipedia.org/wiki/Reverse_proxy) on Wikipedia -
  how the caller's address is found behind a proxy.
- WeKan: [REST API](../../../API/REST-API.md), [README.md](README.md) (every
  pane of this page), [Design.md](Design.md) (why Problems records summaries and
  not events), [Table page](../../General/Table.md) (the shared table this pane
  draws with).

## How to use it

1. Start WeKan with `WITH_API=true`, otherwise nothing calls the API and the
   pane says so.
2. Open your member menu (your avatar at the top right) and click
   **Admin Panel**.
3. Click the **Problems** tab at the top.
4. In the left menu, under **Reports**, click **API**.
5. Read the table: busiest endpoint first. Type in the search box to narrow it
   to an endpoint (`boards`, `export`, `POST`), a username or an address; the
   table filters as you type.
6. Use the previous / next buttons to page through it, 10 rows a page.

The table:

| Username | API | Calls | First called | Last called | IPv4 address | Location | IPv6 address | Location (IPv6) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| alice | `POST /api/boards` | 34 | 2026-02-02 09:14:03 | 2026-05-05 17:22:51 | 100.100.100.100 | | | |
| alice | `GET /api/boards/:boardId` | 210 | 2026-02-02 09:14:07 | 2026-05-05 17:22:55 | 100.100.100.100 | | | |
| | `POST /api/users` | 812 | 2026-05-04 23:01:12 | 2026-05-05 02:44:39 | | | 2001:db8::1 | |

- **Username** — the account that made the call, as it was named at the time.
  Empty for an unauthenticated call, which is not a gap: it is the row for
  *somebody with no account*, and the addresses beside it are what identify
  them. The third line above is what a registration sweep looks like.
- **API** — the route **pattern**, not the path that was requested.
- **Calls**, **First called**, **Last called** — how many, and the window they
  fall in. A count without a window says nothing: 34 calls in a day and 34 in a
  year are different instances.
- **IPv4 address** / **IPv6 address** and their **Location** columns — where the
  most recent call came from, in two address columns rather than one, because an
  instance reached over IPv6 and one reached over IPv4 are different situations
  and a single column that sometimes holds one and sometimes the other cannot be
  scanned. A location (flag and city) is shown only when the proxy sent
  geolocation headers, and only beside the address family of that row. The
  address is resolved with the same spoofing-safe rule as the login throttle:
  `X-Forwarded-For` is trusted only as far as `HTTP_FORWARDED_COUNT` says to
  trust it.

## How the numbers are calculated

- **Calls** is the number of finished requests (counted on the response's
  `finish` event) for one account and one route pattern, summed over every flush
  into the row (`count` in the `eventlog` row,
  [models/lib/apiUsage.js](../../../../models/lib/apiUsage.js)).
- **First called** / **Last called** are the earliest and the latest request
  time folded into the row (`firstAt` and `at`), shown as
  `YYYY-MM-DD HH:MM:SS`.
- **The addresses** are those of the most recent call: when a later call of the
  same row arrives, its address replaces the stored one.
- **Sort**: by Calls, busiest first, with Last called as the tie-break
  (`{ count: -1, at: -1 }` in `eventLogPage`,
  [models/eventLog.js](../../../../models/eventLog.js)) - a usage report's
  question is *what is used most*, where a problem report's is *what happened
  last*.
- **Flush interval**: counts are written every 10 seconds
  (`WEKAN_API_USAGE_FLUSH_MS`, default `10000`), or at once when 200 distinct
  (account, endpoint) rows are waiting (`FLUSH_AT_ROWS`,
  [server/lib/apiUsageLog.js](../../../../server/lib/apiUsageLog.js)). Up to
  that many seconds of counts are lost if the process stops between flushes.
- **Cap**: at most 500 distinct (account, endpoint) pairs are held between
  flushes (`MAX_TRACKED`). Past the cap the rest are counted in an overflow
  counter rather than dropped, so *"and 12,000 calls to something else"* still
  appears — that being the signal that something unusual is going on.
- **Retention**: rows whose Last called is older than `EVENTLOG_RETENTION_DAYS`
  (default 90; 0 keeps them for ever) are deleted once a day.
- **Page size**: 10 rows (`TABLE_PAGE_ROWS_PER_PAGE`); the server returns at
  most 200 rows per request.

## How it works in WeKan

**The name is the route pattern.** `/api/boards/:boardId/lists` is one endpoint;
`/api/boards/abc123/lists` and ten thousand of its siblings are that one
endpoint being used. Recording the concrete path would put a row per board in
the database — the same one-row-per-event cost the rest of this page exists to
remove. A request that matched **no route at all** is counted under a single
`(no route)` name rather than under the path it invented, because a 404 sweep is
an attacker walking a wordlist and a row per guess would let them fill the
collection. Only paths under `/api` are counted: the client's own DDP traffic,
static assets and the health check are not API use.

**One row per account and endpoint — the actor is part of the identity here.**
That is the one deliberate exception to the rule every other stream follows
(*the actor is never part of a problem's identity*, see
[Design.md](Design.md)). For every other stream the question is *what is
happening* and including the caller would multiply the rows; here *who called
what* **is** the report, and the cardinality is bounded by real accounts times
real endpoints rather than by whoever is sending. The account is stored by its
**id** (`apiUserId`), so renaming an account does not split its history into two
rows.

**What it costs.** Nothing per request. Ordinary API traffic is not rare the way
a guard firing is rare, so calls are counted **in memory** and folded into their
rows on a timer — a thousand requests become one write instead of a thousand.
Losing a few seconds of counts is acceptable here and would not be anywhere else
on this page: this report decides nothing, and nothing is protected by it.

| | |
| --- | --- |
| [models/lib/apiUsage.js](../../../../models/lib/apiUsage.js) | the naming and the accumulator — no Meteor, so it is tested as arithmetic |
| [server/lib/apiUsageLog.js](../../../../server/lib/apiUsageLog.js) | the middleware and the flush |
| [server/apiMiddleware.js](../../../../server/apiMiddleware.js) | where it is installed, in front of every route, and the `WITH_API` gate |
| [server/lib/eventLogFold.js](../../../../server/lib/eventLogFold.js) | the shared fold that writes the `api` stream of the `eventlog` collection |
| [models/lib/eventLogSummary.js](../../../../models/lib/eventLogSummary.js) | the `api` / `apiUserId` identity fields |
| [models/eventLog.js](../../../../models/eventLog.js) | the admin-only `eventLogPage` / `eventLogCount` methods, the search and the sort |
| [client/components/settings/adminProblems.js](../../../../client/components/settings/adminProblems.js) | `API_COLUMNS`, the menu entry `report-api` |
| [models/lib/addressReportColumns.js](../../../../models/lib/addressReportColumns.js) | the four address and location columns |
| [tests/apiUsageReport.test.cjs](../../../../tests/apiUsageReport.test.cjs) | the guards |

Counting hooks the middleware chain rather than the routes, so **a route cannot
be added without being counted** — there is nothing per route to forget. The
methods refuse anybody who is not a site administrator (`requireAdmin`). The
rows are also available on `GET /api/admin/problems/api`
([REST API](../../../API/REST-API.md#admin-panel-problems)).

## Commits

 - [Pair each IPv4 and IPv6 address with its own location column](https://github.com/wekan/wekan/commit/e8d9bf9f119d053d0943b0ecb3f15ad1a1ffccf1)
 - [Allow the API usage fields in the eventlog schema, so the flush is stored](https://github.com/wekan/wekan/commit/bd668f6b8f0ccd2a68d8c0aee03107bcfa4b3dfd)
 - [Add the API pane: who called which endpoint, and how often](https://github.com/wekan/wekan/commit/6dc2651b48005f26f769feebfffc751d3022bf50)
