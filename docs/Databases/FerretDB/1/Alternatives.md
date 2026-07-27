# Other databases: which ones run on many CPUs, and what FerretDB v1 would need

WeKan runs on every CPU Node.js runs on — amd64, arm64, ppc64le, s390x, riscv64 —
and that is the whole reason this fork of FerretDB v1 exists: **MongoDB does not
publish a server for most of them**, and FerretDB v1's embedded SQLite does not
need one.

This page answers two questions that keep coming back:

1. which databases even *have* images for those CPUs, and
2. what would be missing in FerretDB v1 before it could store into them.

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
`microsoft/go-mssqldb` (SQL Server) and `clickhouse-go`. **Oracle and IBM Db2 do
not have one** — `godror` needs Oracle's OCI client and `go_ibm_db` needs the Db2
CLI driver — so Db2's excellent ppc64le/s390x coverage does not help.

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

## The shortcut: databases that already speak a supported dialect

A database that speaks the PostgreSQL or MySQL wire protocol needs **no new
backend** — it needs the existing one to survive its SQL dialect. That is a much
smaller job, and it is where a contributor with one of these machines could help
most:

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
