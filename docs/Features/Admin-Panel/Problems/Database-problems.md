# Admin Panel / Problems / Database problems

## What it is

What the database said, read for the administrator: which database said it,
what it means, and what to do. Address: `/admin/problems/database`. Site
administrators only. An error message from MongoDB, SQLite, PostgreSQL, MySQL,
MariaDB or SAP HANA is usually written for the database's own developers; this
pane classifies it, names the database, and puts a plain explanation and the
next step beside the original text.

## Read more

- [SQLSTATE](https://en.wikipedia.org/wiki/SQLSTATE) and
  [Deadlock](https://en.wikipedia.org/wiki/Deadlock) on Wikipedia - two of the
  error families the rules recognise.
- [Database index](https://en.wikipedia.org/wiki/Database_index) and
  [Full table scan](https://en.wikipedia.org/wiki/Full_table_scan) on
  Wikipedia - what the "query without an index" finding means.
- MongoDB: [serverStatus](https://www.mongodb.com/docs/manual/reference/command/serverStatus/),
  [dbStats](https://www.mongodb.com/docs/manual/reference/command/dbStats/),
  [getLog](https://www.mongodb.com/docs/manual/reference/command/getLog/) and the
  [production notes](https://www.mongodb.com/docs/manual/administration/production-notes/)
  (network filesystems, storage) - what the health probe asks.
- WeKan: [Supported databases](../../../Databases/Supported.md),
  [Recovery.md](Recovery.md) (SQLite corruption and the recovery history),
  [FerretDB remediation design](../../../Security/Remediation/FerretDB.md) (the
  database canaries), [REST API](../../../API/REST-API.md#admin-panel-problems).

## How to use it

1. Open your member menu (your avatar at the top right) and click
   **Admin Panel**.
2. Click the **Problems** tab at the top.
3. In the left menu, under **Reports**, click **Database problems**.
4. Read the newest rows first. **Detail** says what the problem means and what to
   do, then `—` and what the database itself said.
5. Type in the search box to filter as you type: it also finds the database
   name, the rule id and words of the database's own message.
6. When it is dealt with, go to [Summary](Summary.md) and acknowledge or clear
   the Database problems stream.

| Column | Holds |
| --- | --- |
| Date and time | when it last happened |
| Category | which database: `mongodb`, `sqlite`, `postgresql`, `mysql`, `mariadb`, `hana` or `unknown` |
| Name | the kind of problem, for example `disk`, `auth`, `syntax`, `timeout` or `health` |
| Severity | the rule's severity |
| Action | the classifier's rule id |
| Source | the operation, or `Meteor._debug`, or `health` |
| Username, addresses and locations | who and from where, when known |
| Attempts | how many times, when more than once |
| Detail | what it means and what to do, then `—` and what the database itself said |

The rows are also on `GET /api/admin/problems/database`
([REST API](../../../API/REST-API.md#admin-panel-problems)).

## How the numbers are calculated

- **At most once a minute**: the same problem (rule id) on the same database is
  recorded at most once per 60 seconds (`QUIET_MS` in
  [server/lib/databaseProblems.js](../../../../server/lib/databaseProblems.js));
  the in-memory map of recent problems drops entries not seen for an hour once it
  holds more than 200.
- **The health probe** runs 30 seconds after startup and then every five minutes
  (`PROBE_MS`), on one server of the installation per period
  ([server/lib/databaseHealth.js](../../../../server/lib/databaseHealth.js),
  thresholds in [models/lib/databaseHealth.js](../../../../models/lib/databaseHealth.js)):
  - **restart**: MongoDB's `uptime` is more than 5 seconds lower than at the
    previous probe;
  - **slow storage**: average read latency between two probes
    (Δlatency / Δops / 1000, in ms) is 100 ms or more over at least 20 reads;
  - **disk space**: from `dbStats`, free = `fsTotalSize − fsUsedSize`; critical
    when free is under 512 MiB or under 5% of the total;
  - **high read rate**: documents scanned per second between two probes
    (Δ`scannedObjects` / seconds) above 50,000;
  - **queries without an index**: "Slow query" lines in MongoDB's log whose plan
    is a collection scan (`COLLSCAN`) that examined at least 10,000 documents,
    grouped by the query's shape
    (field names and operators, never values), only lines newer than the last
    probe;
  - **network filesystem**: the data directory's filesystem type is CIFS, SMB2,
    NFS, FUSE or another remote type, reported once.
- **Attempts** is the row's `count`, shown only when it is above 1.
- **Retention**: rows older than `EVENTLOG_RETENTION_DAYS` (default 90) are
  deleted daily.
- **Rows per page**: 10, newest first.

## How it works in WeKan

### Where the rows come from

The `database` stream of the `eventlog` collection, written by
[server/lib/databaseProblems.js](../../../../server/lib/databaseProblems.js):

- **What the database said.** Every uncaught error of a method or publication
  passes `Meteor._debug`; one whose text looks like a database or process
  resource failure (MongoDB, SQLite, PostgreSQL, MySQL, MariaDB, SAP HANA,
  `SQLSTATE`, out of memory, `EMFILE`, read-only filesystem, a malformed
  database image, an oversized document) is recorded. The startup, process
  error and busy-write retry handlers record theirs too.
- **What WeKan measured.** The database health probe
  ([server/lib/databaseHealth.js](../../../../server/lib/databaseHealth.js), at
  startup and every five minutes on one server of the installation) records
  restarts, a data directory on a network filesystem, storage latency, disk
  space running out, a high read rate and queries without an index; startup
  records an index it had to create
  ([server/lib/mongoStartup.js](../../../../server/lib/mongoStartup.js)).
  FerretDB answers only some of these commands; what it cannot answer is
  skipped.

Each message is classified by the pure rules in
[models/lib/databaseErrors.js](../../../../models/lib/databaseErrors.js) (23
rules, for example `connection-lost`, `disk-full`, `auth-failed`,
`mysql-syntax`, `deadlock`, `timeout`, `duplicate-key`, `database-corrupt`,
`memory-exhausted`, and `unclassified` for anything no rule knows).

A FerretDB **canary** - an operation WeKan never issues, such as server-side
JavaScript, dropping a database or SQL that looks injected - is not a database
problem: it goes to the [Security Report](Security-Report.md) instead.

### The table

The same read-only event table as the other streams
([Security Report](Security-Report.md)): the `eventStreamReport` template in
[client/components/settings/adminProblems.js](../../../../client/components/settings/adminProblems.js)
(`EVENT_STREAM_COLUMNS`, which puts `db` in Category and joins `detail` and
`message` in Detail), reading the admin-only `eventLogPage` / `eventLogCount`
methods of [models/eventLog.js](../../../../models/eventLog.js), whose search
covers `db`, `kind`, `type` and `message` as well as the common columns.

## Commits

 - [A cleared connection pool is a lost connection](https://github.com/wekan/wekan/commit/abc23a7eda42e32c7e7e59f8e59fc024806fb470)
 - [One server probes the database per period, so a finding is reported once](https://github.com/wekan/wekan/commit/114e9ecd5a4c94c6684a4f50e436997c9c247f8e)
 - [Report queries without an index and a high read rate](https://github.com/wekan/wekan/commit/b87858baaf91e5979058b7c968cd17d16ccd1647)
 - [A MongoDB pod restarting is a lost connection, not a critical crash](https://github.com/wekan/wekan/commit/f37204b1c374f098d1ef9933ffacece24d69507c)
 - [A lost connection inside a validation error is a connection problem](https://github.com/wekan/wekan/commit/a9e680d4b2b18bd218f290618dc5c2e782baf705)
 - [Explain and remediate the MongoDB 8.2 crash loop after a full disk](https://github.com/wekan/wekan/commit/faaa83ed0922603bb143317213911d7e38691641)
 - [Report database health, and create a missing index automatically](https://github.com/wekan/wekan/commit/4a095513971dd11e3cba48f598a791f2347fd14b)
 - [Bound platform resources and report runtime failures](https://github.com/wekan/wekan/commit/6ec619e438f82e59fb66407b98f78f31f0135776)
 - [Fix the two bugs this pane was reporting](https://github.com/wekan/wekan/commit/30e8e38f6c221cba7cd2a69c80d0dc7b03e6c46e)
 - [A busy write is retried, and its failure recorded (#6533)](https://github.com/wekan/wekan/commit/08be34b70dbe5de5ecf981fdffd52a596fdbab12)
 - [Show what the database actually said](https://github.com/wekan/wekan/commit/ca0e36e371408ecdda2785edb36f8696b8443528)
 - [Say which database has which problem](https://github.com/wekan/wekan/commit/21300f5cb419dc4cfa503e5a39d9774c9d7e85fa)
