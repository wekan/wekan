The full-scale tables below were measured on 2026-10-23 with FerretDB v1.99.0.
Every change in this section came after it (FerretDB v1.100.0 to v1.105.0,
2026-10-24 to 2026-10-31, WeKan up to 2026-11-02), so **those tables do not show
them**; [Results.md](Results.md) is a new, small-scale run that does. The
figures quoted in this section are the ones in FerretDB's own
[CHANGELOG](https://github.com/wekan/FerretDB/blob/main-v1/CHANGELOG.md), each
measured on a smaller database (61,507 cards, 92,000 boards or the 615,070 cards
of this test, as stated), so they show the size of a change, not a place in the
table.

# WeKan database speed test

How fast does WeKan's database answer the queries WeKan actually makes - on
every database WeKan supports, with as much data as a big real instance has?
And does every database answer them **the same**?

```sh
docs/Databases/FerretDB/1/SpeedTest/speedtest.sh     # or: ./build.sh -> Tests -> Database speed test
```

`build.bat` has the same entry on Windows (it runs the same script through bash).
The results of the last run are in [Results.md](Results.md).

## The databases

The same ones as the [conformance run](../Conformance.md), started the same way -
the speed test IS that run, `releases/db-conformance.sh` with
`WEKAN_DB_SUITE=speedtest`, so the two can never disagree about which databases
exist, which images they use or how they are started:

| Database | How it runs |
| --- | --- |
| FerretDB v1 + SQLite | FerretDB built from `.tools/FerretDB` (the newest source), data under `.tools/tmp` |
| FerretDB v1 + PostgreSQL | `postgres:18`, the image of [docker-compose-ferretdb-v1-postgresql.yml](../../../../../docker-compose-ferretdb-v1-postgresql.yml) |
| FerretDB v1 + MySQL | `mysql:9`, from [docker-compose-ferretdb-v1-mysql.yml](../../../../../docker-compose-ferretdb-v1-mysql.yml) |
| FerretDB v1 + MariaDB | `mariadb:12`, from [docker-compose-ferretdb-v1-mariadb.yml](../../../../../docker-compose-ferretdb-v1-mariadb.yml) |
| FerretDB v1 + pgrust | `malisper/pgrust:v0.4-beta`: [PostgreSQL rewritten in Rust](https://github.com/malisper/pgrust), wire compatible, so FerretDB's PostgreSQL handler talks to it unchanged. In the conformance run only with `WEKAN_CONFORMANCE_PGRUST=1` |
| FerretDB v1 + TiDB | `pingcap/tidb:latest` (Apache-2.0, MySQL protocol) as one process on its own storage, no PD or TiKV. In the conformance run only with `WEKAN_CONFORMANCE_TIDB=1` |
| FerretDB v1 + Dolt | `dolthub/dolt-sql-server:latest`: [git for data](https://github.com/dolthub/dolt), MySQL protocol, run as it comes (no commit per write). In the conformance run only with `WEKAN_CONFORMANCE_DOLT=1`. What its version history gives WeKan's undo is in [VersionHistory](../VersionHistory/) |
| MongoDB 6, 7, 8, 9 | `mongo:6.0`, `mongo:7` ([docker-compose-mongodb-v7.yml](../../../../../docker-compose-mongodb-v7.yml)), `mongo:8.0`, `mongo:9.0` - queried directly, no FerretDB |
| FerretDB v1 + SAP HANA | only with `WEKAN_CONFORMANCE_HANA=1` (amd64, ~16 GB RAM, SAP's licence) |
| FerretDB 2 + PostgreSQL with DocumentDB | `ghcr.io/ferretdb/ferretdb:2` and `ghcr.io/ferretdb/postgres-documentdb:17`, the images of [docker-compose-ferretdb-v2-postgresql.yml](../../../../../docker-compose-ferretdb-v2-postgresql.yml), on a network of their own; in the conformance run only with `WEKAN_CONFORMANCE_FERRETDB2=1` |

Only the databases whose image has a build for this CPU run (`docker manifest
inspect` decides), **one at a time**: a database being timed must not share the
CPU and the disk with another. Each runs with its image's default configuration -
the speed test measures what an administrator gets, not a tuned benchmark. On a
Linux kernel MongoDB refuses (6.19 to 7.0.13) MongoDB is a skip with the reason.

## The data

[data.cjs](data.cjs) generates a WeKan database of **twice** the size of a
production WeKan whose administrator counted it:

| Collection | Production | Speed test |
| --- | ---: | ---: |
| users | 15,058 | 30,116 |
| boards | 46,153 | 92,306 |
| lists | 110,519 | 221,038 |
| swimlanes | 111,273 | 222,546 |
| cards | 307,535 | 615,070 |

about 1.2 million documents, 650 MB as JSON. The documents have WeKan's own
shape - a card has its `boardId`, `listId`, `swimlaneId`, `sort`, `archived`,
`members`, `assignees`, `labelIds`, dates, a description on some - and the
proportions of a real instance, **skewed** the way real ones are: most boards
have a handful of cards and the biggest has about 15,000; most users are on a few
boards and the busiest are on thousands. A flat distribution would hide exactly
the queries that are slow in practice, which are the ones on the big boards and
the busy users.

It is **deterministic**: a fixed seed and a seeded generator, never
`Math.random()`, so every database is loaded with byte-for-byte identical
documents - which is what makes it possible to ask whether they answer the same.
`WEKAN_SPEEDTEST_SCALE` changes the size (1 = production, 2 = twice that, the
default). **`WEKAN_SPEEDTEST_SCALE=0.05` is 1/20 of a production WeKan - 15,377
cards - and the whole run, every database, takes under half an hour instead of
hours** (with the images already pulled) (the SQLite indexes alone take 19 minutes at scale 2 and 7 seconds at
0.05). Results.md says which scale it was measured at.

After loading, the test creates **the indexes WeKan creates**. They are not
listed here: [indexes.cjs](indexes.cjs) reads every `ensureIndex(...)` call in
`server/` and `models/` from the source (plus the `username` and
`emails.address` indexes Meteor's accounts-base creates), so a new index in
WeKan is in the next run without anybody editing the test.

## The queries

[queries.cjs](queries.cjs) - each is the query WeKan itself sends, and where WeKan
builds the selector with a helper (`boardVisibilitySelectors`,
`sortWithIdTiebreaker`) the helper is called, so the query cannot drift from the
app's:

| Column | What WeKan does |
| --- | --- |
| Login | `users.findOne({ username })` at sign-in |
| User by id | `users.findOne({ _id })` - every method and publication |
| All Boards count / page | the All Boards selector (membership `$elemMatch`, starred public boards), counted, and its first page sorted by title |
| Board by id | opening a board |
| Board lists / swimlanes | `find({ boardId, archived: false })` sorted |
| Board cards | the board publication: every unarchived card of the board |
| Card window | lazy loading: one list and swimlane, sorted, first 25 ids |
| Card count | `countDocuments({ boardId, archived: false })` |
| Cards per list | `$match` + `$group` by list - the All Boards card counters |
| Card by id | opening a card |
| Card search | a title regex within a board |
| Due Cards | the `dueCards` publication: the visible boards, then their due cards by date |
| People page | Admin Panel / People: newest users first, paged, with the total |
| Edit / Move / Add card | `updateOne` `$set` title, `$set` list and sort, `insertOne` |

Each is asked with fixed **parameters** taken from the data plan, not from the
database: the 3 biggest boards (or busiest users) and 12 ordinary ones. Every
query runs once per parameter to warm up, then repeats for up to 5 passes or 10
seconds (`WEKAN_SPEEDTEST_BUDGET_MS`). Each parameter gets its own median; the
speed table shows the **average of those medians** (so the big boards count for
the share of the questions they are), and a second table the **slowest
parameter** - the person who waits longest. A median over all calls together
would be an ordinary board's time and hide the big ones.

The writes change a different card on every call, so no write is a no-op one
database could skip and another not, and they always make all 5 passes: what they
leave behind is compared, and a database stopped by the time budget would have
written less.

## Same data

The warm-up answers of every query and parameter are **fingerprinted** - typed
values, keys sorted, order kept for queries whose order WeKan relies on - and the
cards the writes changed are read back afterwards. [report.cjs](report.cjs)
compares every database with MongoDB (8 when it ran, else 7, 9, 6, else SQLite)
and the run **fails** when any database answered differently: a database that is
fast because it is wrong does not pass.

## Results.md

[report.cjs](report.cjs) writes [Results.md](Results.md): the speed table - a row
per database, its name and version on the left, a column per query, ordered by
the total so the fastest database is at the top - then the time loading the data
and creating the indexes took, then whether each database answered the same.
The raw timings are in `.tools/log/test-db-speedtest/<datetime>/speedtest-<database>.json`.

To repeat some databases into an earlier run - after a change to one of them -
`WEKAN_DB_BACKENDS=postgresql,mysql WEKAN_LOGDIR=<that run's directory>` runs
only those, and Results.md is written again from every result in the directory.
`run.cjs --queries <file>` times another catalogue of the same shape, which is how
the "before" column below was measured with the Due Cards query as WeKan sent it.

Things to know when reading the numbers:

- FerretDB runs with `--repl-set-name=rs0`, as WeKan runs it, so every write is
  also written to its oplog; the MongoDB containers run standalone, without one.
  That costs FerretDB some load and write time MongoDB does not pay here.
- Each database runs with its image's default settings - what an administrator
  gets - not tuned.
- Results.md was measured at scale 0.05 (see "The data"), with FerretDB v1.105.0
  plus the changes of "Improvements since the last run". A row's FerretDB commit
  is in its name; the rows differ because a database is re-run alone after a
  change to FerretDB, which does not touch the others. The full-scale tables
  further down are from 2026-10-23 (v1.98 and v1.99) and are kept as the record
  of what each change was worth.
- A row's FerretDB commit is in its name: the databases were measured as their
  FerretDB fixes went in (the PostgreSQL row after its index fix, MySQL and
  MariaDB after their `_id` fix).

## What the speed test found, and what was improved

The first run - FerretDB v1.98.0 on SQLite, the database WeKan ships by default -
was 30 to 1,000 times slower than MongoDB on the queries over many documents.
Profiles of FerretDB while it answered them showed where the time went, and these
were changed in [wekan/FerretDB](https://github.com/wekan/FerretDB) and WeKan.
Every change kept the answers the same: the speed test's own comparison and the
[conformance catalogue](../Conformance.md), which gained a case of writes by
string `_id` and answers its 111 cases the same on every database.

SQLite at full scale, the same data and the same machine, average of the
per-parameter medians:

| Query | FerretDB v1.98.0, before | after | MongoDB 8 |
| --- | ---: | ---: | ---: |
| All Boards count | 6,545 ms | 1,388 ms | 6.8 ms |
| All Boards page | 6,563 ms | 1,408 ms | 16.8 ms |
| Board cards | 496 ms | 222 ms | 48.5 ms |
| Card count | 228 ms | 87 ms | 1.9 ms |
| Cards per list | 237 ms | 120 ms | 2.9 ms |
| Due Cards | 33,921 ms | 12,777 ms | 470 ms |
| People page | 1,918 ms | 408 ms | 15.6 ms |
| Login, by id, writes | 1-8 ms | 1-9 ms | 0.7-1 ms |

For an ordinary user All Boards went from 6.2 s to 2 ms; the busiest, a member of
6,399 boards, from 8.2 s to 4.6 s.

**FerretDB, every backend**

- **Decoding a stored document** - JSON into a map by reflection, then every
  string and nested value again, and a SHA-256 of its schema - took 65 µs for a
  card and was most of the time of every query returning or counting many
  documents. A scanner now splits the document without reflection: 3 to 8 times
  faster. A fuzz test compares it with the original decoder.
- **Leak tracking** captured a stack and set a finalizer for every document
  iterator in release builds: an eighth of the CPU. Now debug builds only.
- **Counting a whole collection** (People's total, `estimatedDocumentCount`)
  decoded every document; it is `SELECT COUNT(*)` now.

**FerretDB on SQLite**

- **Arrays could not be indexed**: an index on `members.userId` indexes NULL for
  every document whose `members` is an array, so a membership test parsed the
  array of almost every board. An index whose leading key is `array.field` now
  has a side table of element values and `_id`s, kept by triggers.
- **The index choice ignored `$or`**, so Due Cards' card query used `{type: 1}`
  and parsed every card's JSON; a field every branch constrains now counts.
- Found while testing: `$elemMatch` failed with "malformed JSON" as soon as one
  document's array held a string, and a field named `key`, `value`, `type`, `id`
  or `path` compared with that `json_each` column instead - real matches lost.

**FerretDB on PostgreSQL** - an equality wrote the field name as a parameter
(`_jsonb->$1 @> $2`), which no expression index can match: every query read the
whole table. A card by `_id` went from 1,294 ms to 1.15 ms, a login from 81 to
1.25 ms.

**FerretDB on MariaDB** - **every update and delete by a string `_id` was lost**:
MariaDB 12.3 compares two equal JSON strings as different, so the update matched
nothing and was reported as made. They now use the `_id` index's column with an
exact comparison (on MySQL too, where each one read the whole table), and new
index columns are `utf8mb4_bin`, so `_id` `"A"` beside `"a"` is no longer a
duplicate key.

**WeKan** - Due Cards fetched every visible board whole (every public board of the
instance among them) to read its `_id` and members; it asks for those two only,
and its board scope is a plain `boardId` list when no board is assigned-only. Its
docker-compose for FerretDB 2 could not start with the current DocumentDB image
(`POSTGRES_DB` must be `postgres`).

## Improvements since the last run

[Results.md](Results.md) was measured on 2026-10-23 with FerretDB v1.99.0. Every
change below came after it (FerretDB v1.100.0 to v1.105.0, 2026-10-24 to
2026-10-31, and WeKan up to 2026-11-02), so **the tables in Results.md do not
show them yet** - run the speed test again for full-scale numbers. The figures
quoted here are the ones in FerretDB's own
[CHANGELOG](https://github.com/wekan/FerretDB/blob/main-v1/CHANGELOG.md), each
measured on a smaller database (61,507 cards, 92,000 boards or the 615,070 cards
of this test, as stated), so they show the size of a change, not a place in the
table.

**FerretDB on SQLite**

- **SQLite sorts in the database** (v1.100.0). A sorted query used to read,
  decode and keep every matching document in Go to return a few - People's ten
  newest users, the first page of a list. SQLite now orders the row ids by a key
  that reproduces MongoDB's order for simple values, and documents are fetched a
  batch at a time in that order: the ten newest of 30,000 users allocate 2.6 MB
  instead of 264 MB. A document whose sort field holds an array, a document, NaN
  or an infinity comes first, and then everything is sorted in Go as before, so
  the answer is the same. The key is read once per row, in one JSON path.
- **Documents are stored as SQLite JSONB** (v1.101.0). Every filter, sort key,
  index and multikey trigger used to parse the JSON text of a document again.
  New collections are binary, and an existing database is converted once when
  it is opened, table by table in a transaction (204,212 documents took 81 s; a
  table that fails stays text and keeps working). On 61,507 cards, due cards went
  from 1,003 to 519 ms, All Boards from 95 to 42 ms and creating the 44 indexes
  from 107 to 70 s. After the conversion an older FerretDB cannot read the
  database.
- **`distinct` works when documents lack the field** (v1.105.0), which a database
  migrated from MongoDB 3 needs on its first start.

- **A membership test reads the array from the column, not from the text of `->`**
  (found by profiling Due Cards, fixed after v1.105.0). `{members: {$elemMatch:
  {userId: X}}}` was `json_each(col->"members")`: `->` renders the whole array as
  JSON text and `json_each` parses that text again, for every row. It is now
  `json_each(col, '$."members"')`, which SQLite walks in place. The visible-boards
  query went from 26.2 to 15.7 ms on 2,308 boards, and in the speed test All Boards
  count from 6.9 to 4.9 ms, All Boards page from 5.9 to 3.9 ms and Due Cards from
  54.5 to 43.9 ms (the SQLite total 82.7 → 68.3 ms); the 169 answers of 12 queries
  are identical to before.

**FerretDB on PostgreSQL**

- **Membership tests use a GIN index** (v1.100.0): an index whose leading key is
  `ARRAY.FIELD` (`members.userId`) also gets a `jsonb_path_ops` GIN index of the
  array, and `{members: {$elemMatch: {userId: X}}}` uses it.
- **`$or` and `$elemMatch` are conditions in the database** (v1.101.0), so Due
  Cards' query went from 2,031 to 815 ms on 61,507 cards.
- **A top-level `$and` is pushed down** (v1.100.0). WeKan's Due Cards wraps its
  conditions in one, and every document was read.

- **A table is analyzed once its indexes are created** (found by the small run,
  fixed after v1.105.0). PostgreSQL has statistics for an expression index
  (`_jsonb->'field'`) only after `ANALYZE`, which autovacuum runs a minute or
  more after a bulk load. Before that the planner guessed **one row** for a Due
  Cards query that returns 2,000, and chose a plan with no parallelism: 407 ms
  on 15,377 cards, 84 ms after. The whole PostgreSQL row went from 454 ms to
  145 ms and from last place to eighth. The same `ANALYZE TABLE` was tried on
  MySQL and MariaDB and made no difference (100 and 279 ms before, 106 and 283
  after), so it was not kept.

**FerretDB on MySQL and MariaDB**

- **Reads use their indexes** (v1.100.0): an equality or `$in` narrows through
  the index's generated column. A card by `_id` among 615,070 went from 3.4 s
  (MySQL) and 18.7 s (MariaDB) to 1.8 ms. Generated columns are `VIRTUAL`, so
  adding the 44 indexes of a 600,000-document database takes 157 s, not 20
  minutes; an index of four or more fields indexes prefixes, so it fits the
  3,072-byte key limit that three of WeKan's compound indexes used to exceed;
  and a path with a dash or a digit (`services.accounts-lockout.unlockTime`, `profile.emailBuffer.0`) no longer
  fails with "Invalid JSON path expression".
- **Multikey side tables** (v1.100.0), as on SQLite, so a membership test reads
  only the matching documents. Without the right to create triggers (MySQL with
  binary logging and no SUPER) nothing is created and queries read as before.
- **An `$or` of `_id` sets is one `UNION ALL`** (v1.100.0): All Boards for a user
  with a starred board went from 900 ms (MySQL) and 5.7 s (MariaDB) among 92,000
  boards to 6-7 ms.
- **A long `$in` is one `IN`** (v1.101.0), not 2,596 `JSON_CONTAINS` in an OR
  (52 million comparisons over 20,000 cards).
- **Updates and deletes by `_id` use the `_id` index** (v1.99.0, listed above).

**WeKan** - less work for the database, which matters more the bigger it is:

- **Collection scans are gone from the hourly and startup paths.** The recurring
  cards job has a partial index on `recurrenceInterval` (it read 1,108,017 cards
  in 1,155 ms every hour); search sessions have the indexes their upsert and
  lookup use, and the stale sessions of every user are removed (one instance had
  4,751 taking 10 GB); the board key backfill is one `$in` on the key index; the
  list sync scan and the due-date lookup have partial and sparse indexes.
- **One server does it, not all of them.** The startup schema re-check is claimed
  in `_wekan_migration`, the daily due-date reminder scan and the database
  health probe are claimed per period, so 24 replicas no longer scan, send or
  report 24 times.
- **Admin Panel / Problems / Database** reports what makes an instance slow: a
  query that read a whole collection of at least 10,000 documents (which
  collection, the command, the operators per field and the `queryHash`), and a
  high read rate. The speed test's Due Cards and All Boards numbers say what a
  query costs on one database; this says which query an instance is actually
  asking.

## What could still be improved

- **Due Cards on SQLite, 44 ms of the 68 ms total.** A CPU profile of FerretDB
  while it ran Due Cards (taken before the change above): half the CPU was inside
  SQLite, and about a fifth of all of it converting JSON between binary and text
  (`_jsonTranslateBlobToText` 10%, `_jsonTranslateTextToBlob` 10%, besides
  `_jsonLookupStep`); another quarter was Go runtime (thread signalling,
  `madvise`, the network poller). Of the cards query's 24 ms, 18 ms is the index
  lookups (the 700-board `IN` list) and 6 ms the five per-user conditions
  (`members`, `assignees`, `requesters`, `assigners`, `userId`), each of which
  evaluates `->` three times per row. Reading each once, as
  `json_type(col,'$."f"') = 'array' OR col->>'$."f"' = ?`, took that step from
  24.4 to 20.5 ms with the same rows - **not done**, because it may only be applied
  to a field no index covers (an index is matched by the expression `col->"f"`),
  and FerretDB's WHERE builder does not know which fields are indexed.
- **Tried on SQLite and not worth it, or not conclusive**: `ANALYZE` made no
  difference (FerretDB chooses its indexes itself); a Unix socket instead of TCP
  saves about 0.05 ms (20%) on a point read (0.24 → 0.19 ms), which is free when
  WeKan and FerretDB share a machine (`--listen-unix`); `GOGC=400` gave 10-15% on
  some queries in one test (board cards 5.3 → 4.4 ms) and nothing in another that
  also set a memory limit, so it is a lead, not a result.

- **The busiest users.** What remains of All Boards for a member of thousands of
  boards, and of Due Cards, is decoding those boards and sorting them in Go on
  the databases that do not sort in SQL.
- **Sorting in the database on PostgreSQL, MySQL and MariaDB.** Only SQLite does
  it. PostgreSQL was tried (2026-11-03): an `ORDER BY` of type class, number and
  text (`COLLATE "C"`, MongoDB's byte order) with the documents that cannot be
  ordered first, as on SQLite, and the tests matched the Go sort over mixed
  types. It was **not faster**: the ten newest of 30,116 users took 52 ms, against
  38-49 ms for fetching, decoding and sorting them in Go, because the Go path is
  already fast after the decoding changes and the sort expressions cost about as
  much. It would only save memory and transfer, so it was not kept. A sort that
  wins needs an expression index on the sort field, which has to know the field
  in advance; MySQL and MariaDB have the same cost structure and no measurement
  that says otherwise.
- **MariaDB stores JSON as text** that every JSON function parses again, so it
  keeps only what an index answers (`$or` and `$elemMatch` are not pushed down).
- **Existing MySQL/MariaDB tables** keep their case-insensitive index columns
  until rebuilt.
- **Measuring it again at full scale.** Results.md is scale 0.05. A full-scale
  run (`WEKAN_SPEEDTEST_SCALE=2`, hours) would show the busiest users, where the
  differences are largest.

## Other databases tried

Asked for: any other fast database that FerretDB can use and that is open source.
FerretDB v1 has handlers for PostgreSQL, MySQL, SQLite and SAP HANA, so a
candidate has to speak one of those protocols **and** run the SQL the handler
writes: `jsonb` expression indexes, `@>` and GIN on PostgreSQL; `JSON`,
`JSON_EXTRACT`, generated columns and triggers on MySQL.

| Database | Result |
| --- | --- |
| [pgrust](https://github.com/malisper/pgrust) v0.4-beta (PostgreSQL in Rust, AGPL-3.0) | **Works**, same answers as MongoDB, and is in Results.md. It is not faster than PostgreSQL for WeKan's queries: 174 ms against 145 ms in total, and creating the 47 indexes takes 38 s against 1 s. |
| [TiDB](https://github.com/pingcap/tidb) 7.5 (Apache-2.0, MySQL protocol) | **Works**, same answers, and is in Results.md (240 ms, between pgrust and MariaDB). It needed one change in FerretDB: its metadata table's generated columns are `VIRTUAL`, because TiDB refuses `ALTER TABLE ... ADD COLUMN ... STORED`. This is one process with its own storage; a real cluster (PD and TiKV) is a different test. |
| [Dolt](https://github.com/dolthub/dolt) 2.6.2 (git for data, Apache-2.0, MySQL protocol) | **Works with the existing MySQL handler, no new handler**, same answers as MongoDB, and is in Results.md - and is **by far the slowest: 20,470 ms in total, 1,230x MongoDB**. Every query over cards takes about 2.8 s on 15,377 cards (a whole-table scan, about 187 µs a document: the generated-column indexes the handler relies on do not narrow a read there), All Boards 850 ms, and creating the indexes 106 s. Its point is version history, not speed; see [VersionHistory](../VersionHistory/). |
| [Noria](https://github.com/mit-pdos/noria) (MIT research prototype, Apache-2.0) | **Cannot run FerretDB.** It is a streaming dataflow system that precomputes the results of a fixed set of prepared queries. Its SQL has no `JSON` type (the parser's type list is `INT`, `VARCHAR`, `TEXT`, `BLOB`, `DATE`, ...), no triggers and no generated columns, and the MySQL handler needs all three: it uses `JSON` 79 times, `JSON_EXTRACT` 74 times and 7 generated columns. It also needs unpinned nightly Rust (2021) and ZooKeeper, and has not changed since October 2021. Not built or run. |
| [YugabyteDB](https://github.com/yugabyte/yugabyte-db) 2026.1.2 (core Apache-2.0, PostgreSQL 15 compatible) | **Cannot run FerretDB.** Started, and FerretDB's first `CREATE INDEX` fails: `INDEX on column of type 'JSONB' not yet supported`. Every FerretDB v1 index on PostgreSQL is an expression of type `jsonb`, and so is every query that uses one; YugabyteDB can index a `jsonb` column only with GIN. Supporting it means writing the indexes and conditions as `->>` text, which is a different handler. |
| [CockroachDB](https://github.com/cockroachdb/cockroach) | **Not tried: not open source.** Its LICENSE is the proprietary CockroachDB Software License, not an open-source one. |

Tried with the MySQL handler, to see how far it gets (both speak the MySQL protocol):

| Database | Result |
| --- | --- |
| [ClickHouse](https://github.com/ClickHouse/ClickHouse) 26.10 (Apache-2.0) | **Needs a handler of its own.** The first statement FerretDB sends through its MySQL interface fails: `sql: expected 0 arguments, got 2`. Behind that it has no `JSON_EXTRACT`, `JSON_CONTAINS`, triggers or generated columns as the handler uses them (it has `JSONExtract*`), and a row update is an asynchronous mutation, which is not what WeKan's edits and moves are. |
| [StarRocks](https://github.com/StarRocks/starrocks) 4.1 (Apache-2.0) | **Needs a handler of its own.** The first `CREATE TABLE` fails: `Data type of first column cannot be JSON`; its tables need a key column and a distribution. An analytical engine again, with no triggers. |

A handler for either is a new backend of the size of the SAP HANA one (about
2,000 lines of Go: query, insert, update, delete, indexes, statistics) plus its own
SQL for every filter FerretDB can push down; without the pushdown a query reads
the whole collection, which the speed test would measure as slow. That has not
been written. Not tried at all: DuckDB (no server; the Go driver needs cgo, which
FerretDB's builds do not use) and SingleStore (not open source, and its image
needs a licence key). A MongoDB-protocol database needs no FerretDB and joins the
MongoDB rows; FerretDB 2 with DocumentDB is already there.

## Opening a board in WeKan

The same databases, one level up: [app/](app/) opens a WeKan board of 200, 2,000 and
5,000 cards on FerretDB (SQLite) and on MongoDB 8 and profiles both the Meteor server
and FerretDB. The Meteor server's CPU is the same on both (0.1-0.5 s); on a 5,000-card
board FerretDB (SQLite) takes **400-600 ms longer** (to the first card +42-48%), a
small board only 70-100 ms, and it uses about 4 s of CPU to open the 5,000-card board,
a third of it filtering in Go what it read; the browser receives the same ~210 KB at
every size.

## Go databases linked into FerretDB

Could a database implemented in Go be linked into the FerretDB binary beside its
SQLite, and be faster? [embedded/](embedded/) asks that of the
[awesome-go list](https://github.com/avelino/awesome-go#databases-implemented-in-go):
Pebble, Badger, bbolt, BuntDB, Nutsdb and Clover against SQLite set up as FerretDB
sets it, on the speed test's cards, in minutes. **None is faster where it counts**:
a board's cards take the same time on every engine that is not slower, because
decoding the JSON dominates; the key-value stores win single reads and writes by
microseconds that the 0.2 ms floor of a FerretDB call hides, and would make the
handler do in Go what SQL does in SQLite. bbolt with its default fsync is 100-160x
slower on writes, Pebble 12x slower on fetching a board, Clover 90-190x slower.

## FerretDB 2

FerretDB 2.7 with PostgreSQL 17 and the DocumentDB extension stores documents as
BSON in PostgreSQL, with no JSON text to parse and indexes of its own for arrays.
It answered every query of the speed test, and stored every write, the same as
MongoDB, and is the closest to MongoDB of the alternatives - except on one query:

| | FerretDB 2 | FerretDB 1 + SQLite | MongoDB 8 |
| --- | ---: | ---: | ---: |
| Loading the data | 54 s | 8 min | 31 s |
| Creating the 44 indexes | 219 s | 1,167 s | 45 s |
| All Boards count | 183 ms | 1,388 ms | 6.8 ms |
| People page | 118 ms | 408 ms | 15.6 ms |
| Board cards | 113 ms | 222 ms | 48.5 ms |
| Due Cards | **88 s** | 12.8 s | 0.47 s |

Due Cards - a `boardId` `$in` of some 9,000 board ids - is what puts it below
FerretDB 1 + SQLite in the total; without it, its total would be about 0.9 s.

In the conformance catalogue (`WEKAN_CONFORMANCE_FERRETDB2=1`) it answers 108 of
the 111 cases as MongoDB does. The three that differ: a capped collection created
with `max: 3` keeps all five documents (the cap is not applied); `$group`'s `$min`
returns `null` where MongoDB, which ignores nulls, returns `-3`; and `$meta:
"recordId"` is not supported. The capped one matters to anything that relies on
a capped collection staying small.

WeKan's [docker-compose-ferretdb-v2-postgresql.yml](../../../../../docker-compose-ferretdb-v2-postgresql.yml)
could not start with the current DocumentDB image: its `pg_cron` may only be
installed in the database named `postgres`, so `POSTGRES_DB` is `postgres` now.
