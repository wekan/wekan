# Admin Panel / Problems / Security Report

Every attempt a security guard refused or noticed: what it was, how severe,
who tried it, from where and how many times. Address:
`/admin/problems/security-report`. Site administrators only. It is called
Security Report, not Security, because Admin Panel / Settings /
[Security](../Settings/Security.md) is the pane of security switches.

## Where the rows come from

The `security` stream of the `eventlog` collection (`models/eventLog.js`).
Every runtime guard reports through `server/lib/securityLog.js` when it blocks,
sanitizes, rate-limits or detects something, using a key from the catalog in
`models/lib/securityCategories.js` (category, Hall of Fame name, severity,
CWE). Besides the guards, this stream also receives:

- the canaries - operations WeKan never issues, such as a database canary
  marked by FerretDB (`server/lib/databaseProblems.js`);
- the daily filesystem integrity scan's findings (`integrity.file`,
  **StorageBleed**, `server/lib/fileIntegrityScan.js`) and the hourly change
  history audit (`integrity.history`, **HistoryIntegrity**,
  `server/lib/historyIntegrityScan.js`);
- denied passwordless code requests after five requests per source address in
  one minute;
- the Meteor 3.5.3 refusals, recorded as **Meteor DDP**, **Meteor allow-deny**,
  **Meteor dynamic-import** and **Meteor OAuth**
  ([details](../../../Security/Meteor-3.5.3-Security-Fixes-2026-10-22.md));
- **ImportExportValidation** (an import or export refused by the transfer
  boundary) and **ImportExportFailure** (one that failed for another reason,
  recorded as detected, never as an attempt).

Each problem is one row that accumulates (`server/lib/eventLogFold.js`): the
kind of thing that happened is the row, and the user name and address describe
its most recent occurrence ([Design.md](Design.md)).

## Consequence for the account

When a row is `blocked`, of severity `high` or `critical`, names a logged-in
user and its catalog key does not say otherwise, that account is disabled
(`loginDisabled`) with the reason "Attempted <name> at <source> while logged
in" (`server/lib/blockOnSecurityEvent.js`). The address is recorded, never
blocked. An administrator re-enables the account in Admin Panel /
[People](../People/People.md).

## The table

The shared [table page](../../General/Table.md), newest row first, 10 rows a
page, read-only:

| Column | Holds |
| --- | --- |
| Date and time | when it last happened |
| Category | the guard's class, for example `ssrf` or `integrity` |
| Name | the Hall of Fame name (`...Bleed`) or another fixed name |
| Severity | `info`, `low`, `medium`, `high` or `critical` |
| Action | `blocked`, `sanitized`, `rate-limited`, `remediated`, `detected` or `failed` |
| Source | the guard or module that recorded it |
| Username | the account, as it was called at the time; click it for the Edit user popup |
| IPv4, Location, IPv6, Location | the address, resolved with `HTTP_FORWARDED_COUNT`, and a location only when a trusted proxy supplies one |
| Attempts | how many times this row happened; empty when once |
| Detail | what the guard said |

The search box filters as you type, case-insensitively, over category, name,
source, detail, username and address. The rows come from the admin-only
`eventLogCount` and `eventLogPage` methods.

Nothing is acknowledged here: the new-problem count is acknowledged or the
stream cleared on [Summary](Summary.md). Rows older than
`EVENTLOG_RETENTION_DAYS` (default 90) are deleted daily. The same rows are on
`GET /api/admin/problems/security`
([REST API](../../../API/REST-API.md#admin-panel-problems)).

## Related

- [Security remediation design](../../../Security/Remediation/WeKan.md)
- [Hall of Fame](https://wekan.fi/hall-of-fame/) - the names in the Name column.
