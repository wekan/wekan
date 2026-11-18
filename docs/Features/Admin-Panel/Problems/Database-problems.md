# Admin Panel / Problems / Database problems

What the database said, read for the administrator: which database said it,
what it means, and what to do. Address: `/admin/problems/database`. Site
administrators only.

## Where the rows come from

The `database` stream of the `eventlog` collection, written by
`server/lib/databaseProblems.js`:

- **What the database said.** Every uncaught error of a method or publication
  passes `Meteor._debug`; one whose text looks like a database or process
  resource failure (MongoDB, SQLite, PostgreSQL, MySQL, MariaDB, SAP HANA,
  `SQLSTATE`, out of memory, `EMFILE`, read-only filesystem, a malformed
  database image, an oversized document) is recorded. The startup, process
  error and busy-write retry handlers record theirs too.
- **What WeKan measured.** The database health probe
  (`server/lib/databaseHealth.js`, at startup and every five minutes on one
  server of the installation) records restarts, a data directory on a network
  filesystem, storage latency and disk space running out; startup records an
  index it had to create (`server/lib/mongoStartup.js`).

Each message is classified by the pure rules in `models/lib/databaseErrors.js`
(for example `connection-lost`, `disk-full`, `auth-failed`, `mysql-syntax`,
`deadlock`, `timeout`, `duplicate-key`, `database-corrupt`,
`memory-exhausted`, and `unclassified` for anything no rule knows). The same
problem on the same database is recorded at most once a minute.

A FerretDB **canary** - an operation WeKan never issues, such as server-side
JavaScript, dropping a database or SQL that looks injected - is not a database
problem: it goes to the [Security Report](Security-Report.md) instead.

## The table

The same read-only event table as the other streams
([Security Report](Security-Report.md)), newest first, 10 rows a page, with a
search box that filters as you type. On this stream:

| Column | Holds |
| --- | --- |
| Category | which database: `mongodb`, `sqlite`, `postgresql`, `mysql`, `mariadb`, `hana` or `unknown` |
| Name | the kind of problem, for example `disk`, `auth`, `syntax`, `timeout` or `health` |
| Severity | the rule's severity |
| Action | the classifier's rule id |
| Source | the operation, or `Meteor._debug`, or `health` |
| Detail | what it means and what to do, then `—` and what the database itself said |

The search also finds the database name, the rule id and words of the
database's own message.

Acknowledge or clear the stream on [Summary](Summary.md). Rows older than
`EVENTLOG_RETENTION_DAYS` (default 90) are deleted daily. The rows are also on
`GET /api/admin/problems/database`
([REST API](../../../API/REST-API.md#admin-panel-problems)).

## Related

- [Supported databases](../../../Databases/Supported.md)
- [Recovery.md](Recovery.md) - SQLite corruption and the recovery history.
- [FerretDB remediation design](../../../Security/Remediation/FerretDB.md) -
  the database canaries.
