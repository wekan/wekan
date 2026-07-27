# Do all the backends answer the same?

FerretDB v1 translates one MongoDB query into five different SQL dialects. That
`{n: {$gt: 5}}` *runs* on PostgreSQL, MySQL, MariaDB and SAP HANA says very
little; whether it returns **the same documents, in the same order** as on SQLite
is the question that decides whether a backend can be trusted with a board.

```sh
./build.sh          # -> Tests -> All databases (sequential)
./releases/db-conformance.sh    # the same thing, without the menu
```

`build.bat` has the same entry on Windows (it runs the same script through bash).

## What it does

1. **Builds FerretDB v1 from source.** If the `FerretDB` subdirectory is not
   there it is cloned from `git@github.com:wekan/FerretDB` (falling back to
   HTTPS), then updated, then built through its own `build.sh`, which installs
   the Go toolchain and the module dependencies if they are missing. The tests
   run against **that** binary — the newest code — not a downloaded release.
2. **Picks the databases this CPU can actually run.** `docker manifest inspect`
   is asked whether the image has a build for this architecture, so the answer
   stays true as images change. On arm64 that is SQLite, PostgreSQL, MySQL and
   MariaDB; on ppc64le and s390x, SQLite, PostgreSQL and MariaDB; on riscv64,
   SQLite and PostgreSQL.
3. **Runs the query catalogue against each, one at a time.** Sequential on
   purpose: they all use the same FerretDB port, and a database under test should
   not be competing for CPU and disk with three others.
4. **Compares the answers** against SQLite as the reference.

## What is asked

One catalogue of 100 cases in 15 groups, taken from FerretDB v1's own source
rather than from MongoDB's manual — the point is to cover what *this* FerretDB
implements:

- comparison, logical, element, evaluation, array, bitwise and nested-path
  operators;
- projection (including `$slice` and `$elemMatch`), sorting, `skip`/`limit`;
- `count`, `distinct`;
- aggregation: `$match`, `$group` with every accumulator, `$project`,
  `$addFields`, `$facet`, `$bucket`, `$lookup`, `$replaceRoot`, `$sortByCount`;
- every update operator, `findAndModify`, `replaceOne`, the delete commands;
- index creation, listing, uniqueness and dropping;
- capped collections — which is how the OpLog exists at all;
- `explain`, `collStats`, `dbStats`, `listCollections`, `buildInfo`.

The seed data is deliberately awkward: a null, a missing field, a negative
number, a zero, an empty array, an array of documents, mixed-case strings. Tidy
data lets a broken translation pass.

## What "the same" means

Answers are normalised — types spelled out, key order sorted — and compared byte
for byte, so **document order counts**: a sort that returns the right documents in
a different order is a difference, not a detail.

Three cases are compared more loosely, and they say so in the report: an `explain`
plan is a different plan on every engine (only its shape is compared), and
`collStats`/`dbStats` are sizes a different storage engine is entitled to answer
differently (they only have to answer). Everything else must match exactly.

Two backends failing the **same** way is agreement about a limitation, not a
difference. One answering where the other fails is a difference.

## Ports: it runs beside other tests, not instead of them

FerretDB listens on **37017** here, not 27017 — 27017 is where a dev server's
database lives and where the compose files publish FerretDB, so binding it would
either fail or, worse, point these tests at somebody else's database and rewrite
it. The database server it starts is published on **35432** rather than its usual
5432/3306. Both defaults move on if something is already listening, and both can
be set:

```sh
WEKAN_CONFORMANCE_PORT=47017 WEKAN_CONFORMANCE_DB_PORT=45432 ./releases/db-conformance.sh
```

Its containers are named per run (`wekan-conformance-db-<datetime>`), so a stack
started with `docker compose up` — whose containers are `wekan-postgres`,
`wekan-ferretdb` — is never stopped or reused by this.

## Where the results go

`../log/<datetime>/`, with every other WeKan test run:

| File | What is in it |
| --- | --- |
| `db-conformance-build.log` | Cloning, updating and building FerretDB |
| `db-conformance-<backend>.json` | Every answer that backend gave |
| `db-conformance-<backend>.log` | That backend's database and FerretDB output |
| `db-conformance-report.md` | Where they agree, and every case where they do not |
| `db-conformance-summary.txt` | One line per backend: ran, skipped, or why not |

The script exits non-zero when a backend disagrees with the reference.

## SAP HANA

Not run unless `WEKAN_CONFORMANCE_HANA=1` is set. Its image is amd64-only, wants
~16 GB of RAM and tens of GB of disk, and needs SAP's licence accepted — not
something to start because somebody picked a menu entry.

## See also

- [README.md](.) — the five backends and their compose files
- [Alternatives.md](Alternatives.md) — what other databases would need
- `tests/dbConformance/` — the catalogue, the runner and the comparison
