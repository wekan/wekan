# Admin Panel → Problems → API

**Which REST API endpoints are used, by whom, and how often.**
Address: `/admin/problems/api`

Every other pane under Problems answers *what went wrong*. This one answers
*what is being done*: `POST /api/boards` called 34 times by alice last month,
812 times yesterday by nobody with an account. Without it the only record of API
use is whatever the reverse proxy happens to keep, and most instances keep none.

The REST API is off unless `WITH_API=true`, so on an instance that never turned
it on this pane is empty — which is itself the answer.

## The table

| Username | API | Calls | First called | Last called | IPv4 | IPv6 |
| --- | --- | --- | --- | --- | --- | --- |
| alice | `POST /api/boards` | 34 | 2026-02-02 09:14:03 | 2026-05-05 17:22:51 | 100.100.100.100 | |
| alice | `GET /api/boards/:boardId` | 210 | 2026-02-02 09:14:07 | 2026-05-05 17:22:55 | 100.100.100.100 | |
| | `POST /api/users` | 812 | 2026-05-04 23:01:12 | 2026-05-05 02:44:39 | | 2001:db8::1 |

- **Username** — the account that made the call, as it was named at the time.
  Empty for an unauthenticated call, which is not a gap: it is the row for
  *somebody with no account*, and the addresses beside it are what identify
  them. The third line above is what a registration sweep looks like.
- **API** — the route **pattern**, not the path that was requested.
- **Calls**, **First called**, **Last called** — how many, and the window they
  fall in. A count without a window says nothing: 34 calls in a day and 34 in a
  year are different instances.
- **IPv4** / **IPv6** — where the most recent call came from, in two columns
  rather than one, because an instance reached over IPv6 and one reached over
  IPv4 are different situations and a single column that sometimes holds one and
  sometimes the other cannot be scanned. Resolved with the same spoofing-safe
  rule as the login throttle: `X-Forwarded-For` is trusted only as far as
  `HTTP_FORWARDED_COUNT` says to trust it.

Sorted by **Calls**, busiest first — a usage report's question is *what is used
most*, where a problem report's is *what happened last*. The search box matches
the endpoint, the username and the address.

## Two decisions worth knowing about

**The name is the route pattern.** `/api/boards/:boardId/lists` is one endpoint;
`/api/boards/abc123/lists` and ten thousand of its siblings are that one
endpoint being used. Recording the concrete path would put a row per board in
the database — the same one-row-per-event cost the rest of this page exists to
remove. A request that matched **no route at all** is counted under a single
`(no route)` name rather than under the path it invented, because a 404 sweep is
an attacker walking a wordlist and a row per guess would let them fill the
collection.

**One row per account and endpoint — the actor is part of the identity here.**
That is the one deliberate exception to the rule every other stream follows
(*the actor is never part of a problem's identity*, see
[Design.md](Design.md)). For every other stream the question is *what is
happening* and including the caller would multiply the rows; here *who called
what* **is** the report, and the cardinality is bounded by real accounts times
real endpoints rather than by whoever is sending. The account is stored by its
**id**, so renaming an account does not split its history into two rows.

## What it costs

Nothing per request. Ordinary API traffic is not rare the way a guard firing is
rare, so calls are counted **in memory** and folded into their rows on a timer —
a thousand requests become one write instead of a thousand. Up to a few seconds
of counts are lost if the process stops between flushes, which is acceptable
here and would not be anywhere else on this page: this report decides nothing,
and nothing is protected by it.

The number of tracked (account, endpoint) pairs is capped. Past the cap the rest
are counted together rather than dropped, so *"and 12,000 calls to something
else"* still appears — that being the signal that something unusual is going on.

## Where it is implemented

| | |
| --- | --- |
| `models/lib/apiUsage.js` | the naming and the accumulator — no Meteor, so it is tested as arithmetic |
| `server/lib/apiUsageLog.js` | the middleware and the flush |
| `server/apiMiddleware.js` | where it is installed, in front of every route |
| `models/lib/eventLogSummary.js` | the `api` / `apiUserId` identity fields |
| `tests/apiUsageReport.test.cjs` | the guards |

Counting hooks the middleware chain rather than the routes, so **a route cannot
be added without being counted** — there is nothing per route to forget.

## See also

- [README.md](README.md) — every pane of this page
- [Design.md](Design.md) — why Problems records summaries and not events
- [../../Page/Table.md](../../Page/Table.md) — the shared table this pane draws with
