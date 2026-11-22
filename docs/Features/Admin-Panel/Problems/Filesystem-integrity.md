# Admin Panel / Problems / Filesystem integrity

## What it is

Whether this server stopped cleanly, what crashed it, and whether the
continuous backup failed - plus the read-only file status checks. It is the
place an administrator looks after an unexpected outage: a crash, a quick
restart without a clean stop, an uncaught error or a broken backup stream each
leave a row here. Address: `/admin/problems/integrity`. Site administrators
only.

## Read more

- [Heartbeat (computing)](https://en.wikipedia.org/wiki/Heartbeat_(computing)) -
  how a periodic "still alive" mark shows a server died.
- [Crash (computing)](https://en.wikipedia.org/wiki/Crash_(computing)) and
  [Signal (IPC)](https://en.wikipedia.org/wiki/Signal_(IPC)) - `SIGTERM` and
  `SIGINT`, the clean-stop signals.
- [File integrity monitoring](https://en.wikipedia.org/wiki/File_integrity_monitoring),
  [SHA-2](https://en.wikipedia.org/wiki/SHA-2) and
  [EdDSA (ed25519)](https://en.wikipedia.org/wiki/EdDSA) - the daily file scan.
- WeKan: [File status checks](File-status.md),
  [Security Report](Security-Report.md), [Database problems](Database-problems.md),
  [Continuous backup](../../../Backup/Backup.md),
  [Security remediation design](../../../Security/Remediation/WeKan.md),
  section 13.

## How to use it

**Read what happened**

1. Sign in as a site administrator and open **Admin Panel → Problems →
   Filesystem integrity**.
2. Read the table, newest first: Date and time, Category, Name, Severity,
   Action, Source, Username, IPv4, Location, IPv6, Location, Attempts and
   Detail. 10 rows a page; the search box filters as you type.
3. To acknowledge or clear the stream, open **Problems → Summary**, tick the
   row for Filesystem integrity and press **Acknowledge** or **Clear**.

**Check the files**

1. At the top of the pane press **Check files and history**, **Check file
   types and extensions** or **Check missing and untracked files** - the same
   checks as on the Files Report and Recovery panes.
2. **Cancel check** stops one while it runs; **Download status summary**
   saves the result when one has finished. They change no file and no record.
   See [File-status.md](File-status.md).

**Read the rows without a browser**

- `GET /api/admin/problems/integrity`
  ([REST API](../../../API/REST-API.md#admin-panel-problems)).

## How the numbers are calculated

From [server/lib/uptimeWatch.js](../../../../server/lib/uptimeWatch.js):

- A **heartbeat** is written every minute (`HEARTBEAT_MS` = 60,000 ms) with
  `cleanShutdown: false`; `SIGTERM` or `SIGINT` writes `cleanShutdown: true`.
- At the next start, the time down is now minus the last heartbeat. The
  threshold is three heartbeats, `DOWNTIME_THRESHOLD_MS` = 180,000 ms (3
  minutes): a gap longer than two heartbeats is a real gap, not a slow write.
  - no previous heartbeat: first run, not recorded;
  - a clean-shutdown mark: clean stop, not recorded;
  - no mark and down for less than 3 minutes: a quick restart, `low`;
  - no mark and down for 3 minutes or more: a crash, `high`.
- The minutes in the Detail are the time down divided by 60,000 and rounded.
- **Attempts** is the row's count: rows that repeat are folded into one
  summary row whose count grows (`server/lib/eventLogFold.js`).
- Rows older than `EVENTLOG_RETENTION_DAYS` (default 90; `0` keeps them) are
  deleted daily ([models/eventLog.js](../../../../models/eventLog.js)).

The daily file scan ([models/lib/fileIntegrity.js](../../../../models/lib/fileIntegrity.js))
runs once every 24 hours, does not start or continue while CPU is at 60 % or
more, pauses 50 ms between files plus 20 ms per megabyte of the file, and stops
after 15 minutes to continue the next day.

## How it works in WeKan

The rows are the `integrity` stream of the `eventlog` collection:

| Name | Severity | Recorded when | Written by |
| --- | --- | --- | --- |
| `DowntimeBleed` (category `availability`) | `high` | the previous run left no clean-shutdown mark and the server was down for more than three minutes: a crash | `server/lib/uptimeWatch.js` |
| `DowntimeBleed` (category `availability`) | `low` | no clean-shutdown mark, but back within three minutes: a quick restart | `server/lib/uptimeWatch.js` |
| `CrashBleed` (category `crash`) | `critical` | an uncaught exception or an unhandled promise rejection, with its message | `server/lib/uptimeWatch.js` |
| `ContinuousBackup` (category `backup`) | `high` | the continuous backup stream failed | `server/continuousBackup.js` |

The heartbeat is the `heartbeat` document of the `IntegrityKeys` collection
([models/fileIntegrity.js](../../../../models/fileIntegrity.js)), and
`classifyPreviousRun` in
[server/lib/uptimeWatch.js](../../../../server/lib/uptimeWatch.js) is the whole
decision. A clean stop and a first run are not recorded. A database that is
only momentarily unreachable is not a crash (`isTransientDatabaseError` in
`server/00processErrors.js`): it is recorded on
[Database problems](Database-problems.md) instead.

The daily scan of stored files (same name, size, modification time, md5,
sha256 and sha512, signed with ed25519;
[server/lib/fileIntegrityScan.js](../../../../server/lib/fileIntegrityScan.js))
and the hourly change history audit
([server/lib/historyIntegrityScan.js](../../../../server/lib/historyIntegrityScan.js))
report what they find to the [Security Report](Security-Report.md), as
**StorageBleed** and **HistoryIntegrity**, not to this stream. They can be
turned off with `WEKAN_INTEGRITY_SCAN=false` and
`WEKAN_HISTORY_INTEGRITY_SCAN=false`; `WEKAN_INTEGRITY_PRIVATE_KEY` supplies the
signing key instead of one generated and kept in the database.

The table is the same read-only event table as the other streams
([Security Report](Security-Report.md)), rendered by `eventStreamReport` in
[client/components/settings/adminProblems.jade](../../../../client/components/settings/adminProblems.jade).

Tests: [tests/fileIntegrity.test.cjs](../../../../tests/fileIntegrity.test.cjs)
(drives `classifyPreviousRun`),
[tests/restartIsNotACrash.test.cjs](../../../../tests/restartIsNotACrash.test.cjs),
[tests/databaseDnsRestart.test.cjs](../../../../tests/databaseDnsRestart.test.cjs)
and [tests/integrityBaselineForgottenOnDelete.test.cjs](../../../../tests/integrityBaselineForgottenOnDelete.test.cjs).

## Commits

 - [The History integrity audit streams each board](https://github.com/wekan/wekan/commit/7459c5bde66ea22966526a7179eede62b5233f0e)
 - [The daily file integrity audit runs once per installation](https://github.com/wekan/wekan/commit/4e28465964b7ae758e29b35875ff4fb7adb12822)
- [Lint fix: the heartbeat promise is handled](https://github.com/wekan/wekan/commit/f1d2a497bc6bd2861973a7f2b5f4c8712ee430ae)
 - [A MongoDB pod restarting is a lost connection, not a critical crash](https://github.com/wekan/wekan/commit/f37204b1c374f098d1ef9933ffacece24d69507c)
 - [A clean file-integrity scan is not a security event](https://github.com/wekan/wekan/commit/52f127c0a5e6758a9fd9df24f40f349462a5f421)
 - [The file integrity scan waits for a quiet CPU](https://github.com/wekan/wekan/commit/483f3cd53826173e967f719607ef67112474961d)
 - [Continuous backup, whose failures are recorded in this stream](https://github.com/wekan/wekan/commit/6b9bc496b1b56a54b40f5403341272c33770561a)
 - [The read-only file status checks on this pane](https://github.com/wekan/wekan/commit/1f5cb0d13476083e7d9cb67481d8d6bfb9bf7095)
 - [A restart is not a crash](https://github.com/wekan/wekan/commit/034a23edef3676ced4ba3e724708b574daef473d)
 - [Filesystem integrity: the file scan and the clean-stop check](https://github.com/wekan/wekan/commit/2cc0d42ddfaa72dcd04ef59abc541503c7703352)
