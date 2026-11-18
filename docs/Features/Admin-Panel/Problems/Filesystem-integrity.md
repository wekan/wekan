# Admin Panel / Problems / Filesystem integrity

Whether this server stopped cleanly, what crashed it, and whether the
continuous backup failed - plus the read-only file status checks. Address:
`/admin/problems/integrity`. Site administrators only.

## File status checks

At the top of the pane, the same checks as on the Files Report and Recovery
panes: **Check files and history**, **Check file types and extensions** and
**Check missing and untracked files**, with **Cancel check** while one runs and
**Download status summary** when one has finished. They change no file and no
record. See [File-status.md](File-status.md).

## Where the rows come from

The `integrity` stream of the `eventlog` collection:

| Name | Severity | Recorded when | Written by |
| --- | --- | --- | --- |
| `DowntimeBleed` (category `availability`) | `high` | the previous run left no clean-shutdown mark and the server was down for more than three minutes: a crash | `server/lib/uptimeWatch.js` |
| `DowntimeBleed` (category `availability`) | `low` | no clean-shutdown mark, but back within three minutes: a quick restart | `server/lib/uptimeWatch.js` |
| `CrashBleed` (category `crash`) | `critical` | an uncaught exception or an unhandled promise rejection, with its message | `server/lib/uptimeWatch.js` |
| `ContinuousBackup` (category `backup`) | `high` | the continuous backup stream failed | `server/continuousBackup.js` |

WeKan writes a heartbeat every minute and marks a clean stop on `SIGTERM` or
`SIGINT`; the next start compares the two. A clean stop and a first run are not
recorded. A database that is only momentarily unreachable is not a crash: it is
recorded on [Database problems](Database-problems.md) instead.

The daily scan of stored files (same name, size, modification time, md5,
sha256 and sha512, signed with ed25519) and the hourly change history audit
report what they find to the [Security Report](Security-Report.md), as
**StorageBleed** and **HistoryIntegrity**, not to this stream. They can be
turned off with `WEKAN_INTEGRITY_SCAN=false` and
`WEKAN_HISTORY_INTEGRITY_SCAN=false`; `WEKAN_INTEGRITY_PRIVATE_KEY` supplies the
signing key instead of one generated and kept in the database.

## The table

The same read-only event table as the other streams
([Security Report](Security-Report.md)): Date and time, Category, Name,
Severity, Action, Source, Username, IPv4, Location, IPv6, Location, Attempts
and Detail, newest first, 10 rows a page, with a search box that filters as you
type.

Acknowledge or clear the stream on [Summary](Summary.md). Rows older than
`EVENTLOG_RETENTION_DAYS` (default 90) are deleted daily. The rows are also on
`GET /api/admin/problems/integrity`
([REST API](../../../API/REST-API.md#admin-panel-problems)).

## Related

- [Security remediation design](../../../Security/Remediation/WeKan.md),
  section 13.
- [Continuous backup](../../../Backup/Backup.md)
