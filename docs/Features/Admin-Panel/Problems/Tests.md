# Admin Panel / Problems / Tests

Runtime self-checks that failed: the kind of invariant a WeKan unit test
asserts, checked on the running server without a browser and without
Playwright. Address: `/admin/problems/tests`. Site administrators only.

## Where the rows come from

The `tests` stream of the `eventlog` collection, written by
`server/lib/selfChecks.js` through `server/lib/testLog.js`. The checks run once,
15 seconds after the server starts. Only a failure is recorded; a passing check
writes nothing.

| Check (Source column) | Fails when |
| --- | --- |
| `self-check:database-roundtrip` | a one-document query to the database fails |
| `self-check:writable-path` | a probe file cannot be written and removed in `WRITABLE_PATH/files` |
| `self-check:heap-headroom` | the V8 heap uses 90 % or more of its limit |
| `self-check:free-disk-space` | the files filesystem has less free space than `WEKAN_MIN_FREE_DISK_MB` (default 256 MiB) |

A failure is recorded with category `test-failure`, name `TestBleed`, action
`failed` and severity `medium`; the Detail column is the check's error message.

The admin-only method `runSelfChecks` runs the checks again on demand. The pane
itself has no button for it.

## The table

The same read-only event table as the [Security Report](Security-Report.md):
Date and time, Category, Name, Severity, Action, Source, Username, IPv4,
Location, IPv6, Location, Attempts and Detail, newest first, 10 rows a page,
with a search box that filters as you type. "No new problems." means no check
has failed since the stream was last cleared.

Acknowledge or clear the stream on [Summary](Summary.md). Rows older than
`EVENTLOG_RETENTION_DAYS` (default 90) are deleted daily. The rows are also on
`GET /api/admin/problems/tests`
([REST API](../../../API/REST-API.md#admin-panel-problems)).

## Related

- [RAM-usage.md](RAM-usage.md) and [Disk-usage.md](Disk-usage.md) - the
  continuous memory and disk monitors.
