# Other databases: which ones run on many CPUs, and what FerretDB v1 would need

## In one page

WeKan runs on every CPU Node.js runs on — amd64, arm64, ppc64le, s390x, riscv64 —
and that is the whole reason this fork of FerretDB v1 exists: **MongoDB does not
publish a server for most of them**, and FerretDB v1's embedded SQLite needs no
server at all.

Everything below, in five sentences:

- **PostgreSQL is the only widely-portable database server.** It is the one image
  that covers ppc64le, s390x *and* riscv64. MariaDB covers ppc64le and s390x,
  MySQL neither, and MongoDB itself — like upstream FerretDB 2 — is amd64 + arm64
  only.
- **A database that speaks the PostgreSQL or MySQL wire protocol needs no new
  code**, only proof that the existing handler survives its SQL dialect. That is a
  test run, not a project, and it is where CockroachDB's s390x image could be won.
- **A genuinely new backend is 1700–3600 lines of Go**, and it is not the
  connection that costs: it is the metadata registry, capped collections (which
  the OpLog is built on), the pushdowns and MongoDB's own semantics.
- **Two hard gates decide whether a database can ever be a backend**: a pure-Go
  driver — the binaries are built `CGO_ENABLED=0`, which is what makes one build
  serve nine architectures — and row-level `UPDATE`/`DELETE` with per-row
  uniqueness, which rules out the columnar and key-value families however good
  their images are.
- **The most valuable work is not a new backend at all**: MySQL, MariaDB and SAP
  HANA already have code and no live verification, and removing that word
  "experimental" is cheaper than any of the alternatives on this page.

| Family | Examples | What is missing |
| --- | --- | --- |
| PostgreSQL-wire | CockroachDB, YugabyteDB, TimescaleDB, openGauss, Greenplum | Nothing to write — a live run of the `postgresql` handler against its dialect |
| MySQL-wire | Percona, TiDB, SingleStore | Nothing to write — the same run with the `mysql` handler, and the functional-index question MariaDB already answered |
| Enterprise SQL | SQL Server, Oracle, IBM Db2 | A whole backend each. SQL Server and Oracle have pure-Go drivers; Db2 does not |
| Embedded / file | DuckDB, libSQL/Turso | A pure-Go driver first (today's are cgo), then a whole backend. SQLite is already done |
| Columnar / analytical | ClickHouse, StarRocks, Doris | Row-level `UPDATE`/`DELETE`, `_id` uniqueness and capped collections — a mismatch of purpose, not of effort |
| Key-value / wide-column | Cassandra, ScyllaDB, FoundationDB, TiKV | Everything: there is no SQL to translate into, so indexes, filters and joins would have to be implemented in FerretDB |
| Already MongoDB-compatible | MongoDB, DocumentDB, Cosmos DB | Nothing — WeKan talks to them directly, no FerretDB in between |

The rest of this page is the evidence for those rows.

## The two questions

1. Which databases even *have* images for those CPUs?
2. What would be missing in FerretDB v1 before it could store into them?

Every architecture list below was read from the registry's own manifest on
2026-07-28, not from documentation. Check one yourself with:

```sh
docker buildx imagetools inspect postgres:18
```

## What has images for which CPUs

| Image | amd64 | arm64 | ppc64le | s390x | riscv64 | Other |
| --- | --- | --- | --- | --- | --- | --- |
| `postgres:18` (also 17, 16) | yes | yes | **yes** | **yes** | **yes** | 386, armv5, armv7 |
| `mariadb:12` (also 11.8 LTS) | yes | yes | **yes** | **yes** | no | — |
| `ibmcom/db2` | yes | no | **yes** | **yes** | no | — |
| `cockroachdb/cockroach` | yes | yes | no | **yes** | no | — |
| `mysql:9` (also 8.4 LTS) | yes | yes | no | no | no | — |
| `mongo:8` | yes | yes | no | no | no | windows/amd64 |
| `clickhouse` | yes | yes | no | no | no | — |
| `yugabytedb/yugabyte` | yes | yes | no | no | no | — |
| `pingcap/tidb` | yes | yes | no | no | no | — |
| `percona/percona-server` | yes | yes | no | no | no | — |
| `opengauss/opengauss` | yes | yes | no | no | no | — |
| `timescale/timescaledb` | yes | yes | no | no | no | 386, armv6, armv7 |
| `gvenzl/oracle-free` | yes | yes | no | no | no | — |
| `cassandra` | yes | yes | **yes** | **yes** | no | armv7 |
| `mcr.microsoft.com/mssql/server` | yes | no | no | no | no | — |
| `saplabs/hanaexpress` | yes | no | no | no | no | — |
| **`wekanteam/ferretdb`** (this fork) | yes | yes | **yes** | **yes** | **yes** | 386, armv5, armv7, **loong64** |
| `ferretdb/ferretdb` (upstream v2) | yes | yes | no | no | no | — |

Two things are worth reading twice.

**PostgreSQL is the only widely-portable database server here.** It is the one
that publishes ppc64le, s390x *and* riscv64 — which is why
[docker-compose-ferretdb-v1-postgresql.yml](https://github.com/wekan/wekan/blob/main/docker-compose-ferretdb-v1-postgresql.yml)
is the recommended choice when a separate database server is wanted at all.
MariaDB covers ppc64le and s390x but not riscv64; MySQL covers neither.

**MongoDB itself is amd64 + arm64 only.** So is upstream FerretDB 2. On ppc64le,
s390x, riscv64 and loong64 there is nothing to run WeKan against except this fork
with its embedded SQLite — which is exactly what the WeKan bundles for those
platforms ship.

## The families, and what each one is missing

The databases above are not seven separate problems. They fall into families, and
within a family the answer is the same — which is the useful way to read the
table.

### 1. PostgreSQL-wire — nothing to write

**PostgreSQL, CockroachDB, YugabyteDB, TimescaleDB, openGauss, Greenplum,** and
the managed PostgreSQL services.

They speak the protocol `jackc/pgx` already speaks, so the `postgresql` handler
connects to them today. PostgreSQL itself is the widest-ported database server
there is (ppc64le, s390x, riscv64) and is confirmed working with WeKan;
CockroachDB is the only other database on this page with an s390x image.

**Missing: a live run, not code.** The wire protocol is the easy half — the
backend leans on PostgreSQL's SQL *dialect*: `CREATE SCHEMA` as the unit a MongoDB
database maps to, `jsonb` with `@>` containment and `jsonb_typeof`, expression
indexes, `information_schema`, and a parseable `EXPLAIN`. CockroachDB's DDL and
index support differ; YugabyteDB's `jsonb` surface is PostgreSQL 11-era. Point the
handler at one, run the integration suite, and the gap is a list rather than a
guess.

### 2. MySQL-wire — nothing to write either

**MySQL, MariaDB, Percona Server, TiDB, SingleStore.**

The `mysql` backend does not check the vendor or the version, so all of them go
through `go-sql-driver/mysql` unchanged. MariaDB is the worked example of what
"unchanged" is worth: everything ran, except that MariaDB has no functional key
parts, so the OpLog `ts` index silently failed to build until this fork added a
`GENERATED ... STORED` column fallback.

**Missing: the same live run**, and per vendor the one question MariaDB already
answered — how it builds an index on a JSON expression. Note that of this family
only MariaDB brings CPUs that MySQL does not (ppc64le, s390x).

### 3. Enterprise SQL — a whole backend each

**SAP HANA (exists, experimental), Microsoft SQL Server, Oracle, IBM Db2.**

**Missing for SQL Server and Oracle: the backend itself** — 1700–3600 lines, all
six pieces listed below. The driver is not the obstacle for either
(`microsoft/go-mssqldb` and `sijms/go-ora` are both pure Go), and neither is
capability: both have JSON functions, expression indexes and real transactions.
What they do not have is a reason — SQL Server is amd64-only and Oracle
amd64+arm64, so neither adds a CPU that PostgreSQL does not already cover.

**Missing for Db2: a pure-Go driver, which does not exist.** `go_ibm_db` needs
IBM's CLI driver through cgo, and cgo is exactly what the nine-architecture build
cannot have. That is a pity, because `ibmcom/db2` is one of only three images here
with both ppc64le *and* s390x.

### 4. Embedded / file databases — driver first, then a backend

**SQLite (done), DuckDB, libSQL/Turso, and the Rust SQLite rewrite.**

SQLite is the default backend and the reason a WeKan install can be
self-contained; `modernc.org/sqlite` is a Go translation of SQLite itself, so it
needs no cgo.

**Missing: a pure-Go driver, before anything else.** `go-duckdb` bundles the C++
library through cgo, and Turso's embedded driver is cgo as well (its pure-Go
client speaks to a *remote* server, which is a different product). After that,
a whole backend — an embedded database gives none of the concurrency the
metadata registry assumes, which is the same weakness the SQLite backend already
has under load.

### 5. Columnar / analytical — a mismatch, not a workload

**ClickHouse, StarRocks, Doris, and Greenplum in its analytical role.**

`clickhouse-go` is pure Go, so the driver gate is passed. It is the second gate
they fail.

**Missing: the shape of the workload.** WeKan updates single cards constantly, and
a document store on top needs row-level `UPDATE`/`DELETE` by `_id`, uniqueness on
`_id`, a transaction around a multi-document write, and capped collections that
evict oldest-first (which is how the OpLog exists at all). Columnar engines are
built for the opposite: append many, read wide, update rarely and asynchronously.
A backend could be written; it would be slow at exactly what WeKan does most.

### 6. Key-value and wide-column — no SQL to translate into

**Cassandra, ScyllaDB, FoundationDB, TiKV, etcd.**

Cassandra is interesting on paper: its image covers ppc64le and s390x, and `gocql`
is pure Go.

**Missing: everything the SQL does for the other backends.** FerretDB v1's
backends are translators — they hand filtering, indexing, joining and transactions
to the database. A key-value store gives none of that back, so a backend would
have to *implement* secondary indexes, filter evaluation and multi-key atomicity
inside FerretDB. That is not a backend, it is a database.

### 7. Already MongoDB-compatible — no FerretDB needed

**MongoDB, Amazon DocumentDB, Azure Cosmos DB (Mongo API), Percona Server for
MongoDB.**

**Missing: nothing.** WeKan points `MONGO_URL` straight at them —
[docker-compose-mongodb-v7.yml](https://github.com/wekan/wekan/blob/main/docker-compose-mongodb-v7.yml)
does exactly that. The reason this page exists is that on ppc64le, s390x, riscv64
and loong64 this family has no members.

## What FerretDB v1 would need for another database

FerretDB v1 does not "connect to" a database, it **stores documents in it**. A
backend is a full translation layer: BSON documents in, SQL out, and MongoDB
semantics preserved on the way back. The four that exist are 1700–3600 lines of Go
each (`postgresql` 3637, `mysql` 3497, `sqlite` 3328, `hana` 1716, tests
excluded), so this is the size of the job, per database.

### 1. A pure-Go driver

The released binaries are built with `CGO_ENABLED=0`, which is what makes one `go
build` produce a binary for nine architectures without a cross-compiler per CPU.
A backend whose driver needs cgo would take that away — the very property WeKan
needs FerretDB for.

The existing ones are all pure Go: `jackc/pgx` (PostgreSQL),
`go-sql-driver/mysql` (MySQL/MariaDB), `modernc.org/sqlite` (SQLite, a Go
translation of SQLite itself), `SAP/go-hdb` (HANA). So are
`microsoft/go-mssqldb` (SQL Server), `sijms/go-ora` (Oracle, which implements the
TNS protocol itself and needs no Oracle client) and `clickhouse-go`. **IBM Db2
does not have one** — `go_ibm_db` needs IBM's CLI driver through cgo — so Db2's
ppc64le and s390x images do not help. Oracle's own `godror` is cgo too, but
`go-ora` means the driver is not what blocks Oracle.

### 2. The three interfaces

Every backend implements `internal/backends`:

- **Backend** — `Status`, `Database`, `ListDatabases`, `DropDatabase`, `Close`,
  plus Prometheus metrics.
- **Database** — `Collection`, `ListCollections`, `CreateCollection`,
  `DropCollection`, `RenameCollection`, `Stats`.
- **Collection** — `Query`, `Explain`, `InsertAll`, `UpdateAll`, `DeleteAll`,
  `Stats`, `Compact`, `ListIndexes`, `CreateIndexes`, `DropIndexes`.

None of them may be a stub: the handler calls all of them, and each is wrapped in
a contract that enforces its promises.

### 3. A metadata registry

The largest piece. Each backend keeps a `_ferretdb_database_metadata` table that
maps a MongoDB database + collection to a real table name, remembers whether a
collection is capped, and stores the index definitions. It must survive a restart,
be safe when two connections create the same collection at once, and answer
`ListCollections` without a scan. See
`internal/backends/postgresql/metadata/registry.go`.

### 4. The SQL features the translation actually uses

This is where a database that "speaks the same wire protocol" still fails. The
PostgreSQL backend needs:

- a **JSON column type with path extraction** (`_jsonb`) — documents are stored as
  one JSONB value per row, and `_id` is the expression `_jsonb->'_id'`;
- **containment / type inspection** — `@>` and `jsonb_typeof(...)` for equality and
  `$in` pushdown, `(_jsonb->>'f')::numeric` for range pushdown;
- **schemas** (`CREATE SCHEMA`) as the unit that a MongoDB database maps to;
- **expression / functional indexes**, or something that can stand in for them;
- **`EXPLAIN` in a parseable form** for the `explain` command;
- **`information_schema`** for table and index discovery;
- an extra `_ferretdb_record_id` column and ordering by it, which is how **capped
  collections** — and therefore the **OpLog** — work at all.

MariaDB is the concrete example of how thin the line is: it speaks the MySQL wire
protocol and runs on the `mysql` backend unchanged, except that it has no
functional key parts, so the OpLog `ts` index failed to build until this fork
added a `GENERATED ... STORED` column fallback. One missing SQL feature, one
silently degraded index.

### 5. Correct MongoDB semantics on top of that

Sort order across BSON types, `_id` uniqueness, `$in`/range filters that push down
as a **superset** with an exact in-Go re-filter, index options (`unique`,
`partialFilterExpression`, text weights), collection statistics, and a capped
collection that evicts by size and count. The pushdown rule is the one that is
easy to get wrong in a way tests do not catch: pushing down *too much* silently
loses documents.

### 6. Proof that it works

An integration run against a live server. This is the difference between the
statuses in [README.md](.): SQLite and PostgreSQL are confirmed with a real
Meteor 3 client; MySQL, MariaDB and SAP HANA are experimental — the code is there,
the verification is not.

## The shortcut, concretely

Families 1 and 2 above need **no new backend** — only the existing handler to
survive the dialect. This is where a contributor with one of these machines could
help most:

| Database | Try it with | Likely obstacle |
| --- | --- | --- |
| CockroachDB (has an s390x image) | `--handler=postgresql` | Different DDL; `CREATE SCHEMA` and expression-index support differ from PostgreSQL |
| YugabyteDB | `--handler=postgresql` | PostgreSQL 11-era `jsonb` surface |
| TimescaleDB, openGauss, Greenplum | `--handler=postgresql` | Mostly PostgreSQL; verification is the work |
| TiDB, SingleStore, Percona Server | `--handler=mysql` | Same functional-index question MariaDB had |

Each is a matter of pointing an existing handler at it and running the integration
suite — no Go to write until something breaks.

## What would be worth doing first

1. **Verify what exists.** MySQL, MariaDB and SAP HANA have code and no proof.
   That is cheaper than any new backend and removes the word "experimental" from
   three rows of the table in [README.md](.).
2. **Try the PostgreSQL-wire databases.** CockroachDB brings s390x; if the
   `postgresql` backend survives its dialect, that is a new supported database for
   the price of a test run.
3. **Only then consider a new backend** — and only for a database that has a
   pure-Go driver and images for CPUs PostgreSQL does not already cover. Today
   there is no such database: PostgreSQL covers everything the others do, and more.

## See also

- [README.md](.) — the five backends WeKan ships compose files for
- [../2](../2) — FerretDB 2, PostgreSQL-only
- [../../MongoDB](../../MongoDB) — MongoDB itself, and its own CPU limits
- [wekan/FerretDB](https://github.com/wekan/FerretDB) — the fork: `ROADMAP.md` tracks backend parity
