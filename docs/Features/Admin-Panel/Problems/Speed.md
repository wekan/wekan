# Admin Panel / Problems / Speed

HTTP requests that took too long. Address: `/admin/problems/speed`. Site
administrators only.

## Where the rows come from

The `speed` stream of the `eventlog` collection. Today one detector writes it:
`server/lib/speedMiddleware.js` times every HTTP request that is not a static
asset (`.js`, `.css`, images, fonts, source maps) or under `/cdn/`, and when one
takes at least `WEKAN_SLOW_REQUEST_MS` milliseconds (default `2000`; `0` turns
the detector off) it records, through `server/lib/speedLog.js`:

- category `slow-request`, name `SlowRequest`, action `detected`, source `http`;
- severity `low`, or `medium` when it took three times the threshold or more;
- detail `<METHOD> <path> — <ms>ms >= <threshold>ms`, without the query string.

DDP methods and publications are not timed here; their live call counts and
durations are on [Instrumentation](Instrumentation.md). The CPU monitor writes
its own stream, shown on [CPU usage](CPU-usage.md).

The same request path that is slow again is folded into the same row, whose
count and date go up ([Design.md](Design.md)).

## The table

The same read-only event table as the [Security Report](Security-Report.md):
Date and time, Category, Name, Severity, Action, Source, Username, IPv4,
Location, IPv6, Location, Attempts and Detail, newest first, 10 rows a page,
with a search box that filters as you type. It shows "No new problems." when the
stream is empty.

Acknowledge or clear the stream on [Summary](Summary.md). Rows older than
`EVENTLOG_RETENTION_DAYS` (default 90) are deleted daily. The rows are also on
`GET /api/admin/problems/speed`
([REST API](../../../API/REST-API.md#admin-panel-problems)).

## Related

- [Performance](Performance.md) - how boards load their cards.
- [Large-Boards.md](Large-Boards.md)
