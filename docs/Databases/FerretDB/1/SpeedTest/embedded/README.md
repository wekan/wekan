# Go databases that could be linked into FerretDB, against its SQLite

FerretDB is one Go binary, and its SQLite handler is the pure-Go driver
[modernc.org/sqlite](https://gitlab.com/cznic/sqlite) inside it. Is any database
implemented in Go (the [awesome-go list](https://github.com/avelino/awesome-go#databases-implemented-in-go))
one that could be linked in beside it, has enough to take SQLite's place, and is
faster for what WeKan asks?

**Short answer: no. Nothing is faster in a way that matters, and the ones that are
faster at a single read or write are key-value stores that would make the handler
do SQLite's job.**

This is the engine level of the question, so it can be answered in minutes and
without writing a handler for each: [bench.go](main.go) loads the speed test's cards
and asks each engine the questions WeKan asks of cards, the way a FerretDB handler
written for it would ask them.

```sh
node docs/Databases/FerretDB/1/SpeedTest/embedded/export.cjs 0.05 <dir>   # the speed test's cards as JSON lines
cd docs/Databases/FerretDB/1/SpeedTest/embedded && go run . -data <dir>   # go 1.24+, pure Go, no cgo
```

Run on 2026-11-03 on an Apple M2 Max, Go 1.27, one engine at a time, each in its own
directory. `-only "Pebble (CockroachDB's LSM),Nutsdb"` runs some.

## What is asked

| Column | The question |
| --- | --- |
| By id | one card by `_id` |
| Board cards | the unarchived cards of a board (an index on boardId and archived), **decoded** from JSON as FerretDB must |
| (raw, not decoded) | the same fetch without the decoding: the part that differs between engines |
| Count | how many unarchived cards a board has |
| Edit, Move | read the card, change it in Go, write it back (FerretDB's `updateOne`), 200 different cards |
| Add | insert a card |

Each read is asked of 15 boards - the 3 biggest and 12 ordinary ones, as in the
speed test - and a cell is the average of the 15 medians. Times are milliseconds
for one call, **Total** is the sum of the six and the table is ordered by it. Every
engine first has to give the right number of cards and the right counts for every
board, and the writes must be there afterwards: a fast wrong answer is no answer.

**SQLite is set up as FerretDB sets it**: WAL, `synchronous=NORMAL`, a 64 MiB cache
and 256 MiB of mmap, the document as JSON and the indexes on `json_extract`
expressions. A row with plain columns shows what SQLite could do and FerretDB does not.
The key-value stores keep a document under `d/<id>` and an index of
(boardId, archived) as keys, which is what a handler on them would have to build.
No engine fsyncs per commit except where the row says so, to match SQLite's
`NORMAL`.

## 15,377 cards (scale 0.05)

| # | Engine | Total | By id | Board cards | (raw, not decoded) | Count | Edit | Move | Add | Load (s) | Size (MB) |
| ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | Nutsdb | **1.394** | 0.0004 | 1.332 | 0.057 | 0.0066 | 0.019 | 0.032 | 0.0041 | 0.0 | 13 |
| 2 | bbolt, no fsync | **1.481** | 0.0005 | 1.349 | 0.055 | 0.0047 | 0.037 | 0.054 | 0.035 | 0.2 | 27 |
| 3 | SQLite, plain columns (not what FerretDB does) | **1.598** | 0.0067 | 1.385 | 0.116 | 0.025 | 0.057 | 0.067 | 0.058 | 0.1 | 15 |
| 4 | Badger | **1.623** | 0.0015 | 1.536 | 0.152 | 0.012 | 0.027 | 0.040 | 0.0065 | 0.0 | n/a |
| 5 | SQLite as FerretDB uses it (JSON, expression indexes) | **1.677** | 0.0078 | 1.421 | 0.113 | 0.037 | 0.073 | 0.082 | 0.057 | 0.2 | 14 |
| 6 | SQLite as FerretDB uses it, synchronous=FULL | **1.747** | 0.0079 | 1.421 | 0.118 | 0.037 | 0.098 | 0.099 | 0.084 | 0.2 | 14 |
| 7 | BuntDB (in memory with an append-only file) | **1.795** | 0.0003 | 1.470 | 0.186 | 0.166 | 0.066 | 0.072 | 0.021 | 0.3 | 12 |
| 8 | Pebble (CockroachDB's LSM) | **1.841** | 0.0028 | 1.770 | 0.298 | 0.011 | 0.021 | 0.034 | 0.0010 | 0.1 | 16 |
| 9 | bbolt, fsync on every commit (its default) | **25.5** | 0.0005 | 1.370 | 0.057 | 0.0048 | 8.062 | 8.025 | 8.015 | 0.2 | 27 |
| 10 | Clover (document database over Badger) | **145** | 0.016 | 59.1 | 58.5 | 57.2 | 9.412 | 9.635 | 9.751 | 0.7 | 41 |

## 153,768 cards (scale 0.5)

| # | Engine | Total | By id | Board cards | (raw, not decoded) | Count | Edit | Move | Add | Load (s) | Size (MB) |
| ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | SQLite, plain columns (not what FerretDB does) | **5.950** | 0.0071 | 5.693 | 0.418 | 0.062 | 0.052 | 0.072 | 0.064 | 1.1 | 147 |
| 2 | Nutsdb | **6.007** | 0.0005 | 5.923 | 0.326 | 0.024 | 0.022 | 0.033 | 0.0044 | 0.3 | 132 |
| 3 | bbolt, no fsync | **6.065** | 0.0005 | 5.909 | 0.289 | 0.019 | 0.042 | 0.056 | 0.039 | 14.5 | 274 |
| 4 | SQLite as FerretDB uses it, synchronous=FULL | **6.118** | 0.0089 | 5.726 | 0.413 | 0.103 | 0.098 | 0.097 | 0.085 | 1.8 | 141 |
| 5 | SQLite as FerretDB uses it (JSON, expression indexes) | **6.153** | 0.0082 | 5.830 | 0.430 | 0.103 | 0.072 | 0.079 | 0.062 | 1.8 | 141 |
| 6 | BuntDB (in memory with an append-only file) | **7.001** | 0.0003 | 6.130 | 0.753 | 0.682 | 0.080 | 0.083 | 0.026 | 4.3 | 124 |
| 7 | Badger | **7.419** | 0.0025 | 7.273 | 1.483 | 0.060 | 0.032 | 0.042 | 0.0096 | 0.4 | n/a |
| 8 | Pebble (CockroachDB's LSM) | **10.5** | 0.023 | 10.3 | 4.992 | 0.056 | 0.033 | 0.032 | 0.0012 | 2.0 | 67 |
| 9 | bbolt, fsync on every commit (its default) | **42.0** | 0.0006 | 5.923 | 0.296 | 0.019 | 11.8 | 12.2 | 12.1 | 14.4 | 274 |
| 10 | Clover (document database over Badger) | **1176** | 0.017 | 577 | 571 | 563 | 11.9 | 11.7 | 11.8 | 25.7 | 301 |

## What it says

- **Nothing is faster where it counts.** A board's cards cost 1.4 ms at 15,000 cards
  and 5.7-6.2 ms at 154,000 for every engine that is not slower, and nearly all of
  it is decoding the JSON, which is the same work whatever stores it. Totals are
  within 5% of SQLite's for Nutsdb and bbolt.
- **The key-value stores win single reads and writes, by microseconds.** A card by
  id takes 0.0003-0.0006 ms on bbolt, Nutsdb and BuntDB against SQLite's 0.008; an insert
  0.001 ms on Pebble against 0.062; an edit 0.022 ms on Nutsdb against 0.072. But the
  cheapest call through FerretDB costs about 0.2 ms in the speed test (the protocol,
  the handler, the network) and most cost more, so an engine that took nothing at all would make one call
  at most a few percent faster.
- **Some are slower, and by a lot.** Pebble's LSM is 12x SQLite on fetching a big
  board's cards (5.0 ms against 0.43), Badger 3.5x, Clover about 1,300x (it decodes every
  document to answer anything), 90-190x in total. **bbolt with its default - an fsync on every commit
  - takes 8-12 ms per write, 100-160x SQLite's**; without it, it is as fast as
  SQLite and not durable the same way.
- **The cost is in what is not there.** A key-value store has keys. FerretDB's SQLite
  handler is about 8,500 lines because filters, sorting, `$or`, `$in`, regular
  expressions, aggregation, indexes and statistics are SQL there. On a key-value
  store the handler would do them in Go, and this benchmark asked only the six
  easiest questions. Of the stores here only BuntDB and Clover have indexes on JSON
  fields, and neither has a query language that could take SQLite's place.
- **Loading** at 154,000 cards: Badger 0.4 s, Nutsdb 0.3 s, Pebble 2.0 s, SQLite 1.8
  s, BuntDB 4.3 s, bbolt 14.5 s (unsorted inserts), Clover 26 s.
- Disk: SQLite 141 MB, Pebble 67, Nutsdb 132, BuntDB 124, bbolt 274, Clover 301.

## The list, entry by entry

Tested (Go library, open source, maintained, pure Go):

| Entry | Licence, last push | Result |
| --- | --- | --- |
| [go-sqlite](https://gitlab.com/cznic/sqlite) | BSD-3, FerretDB's own | the baseline, three ways |
| [Pebble](https://github.com/cockroachdb/pebble) | BSD-3, 2026-11 | fastest insert and edit, 12x slower board fetch |
| [Badger](https://github.com/dgraph-io/badger) | Apache-2.0, 2026-10 | fast writes, 3.5x slower board fetch |
| [bbolt](https://github.com/etcd-io/bbolt) | MIT, 2026-10 | as fast as SQLite without fsync, 100x slower writes with it |
| [BuntDB](https://github.com/tidwall/buntdb) | MIT, 2026-05 | fastest by id, slowest count (index scan), in memory |
| [Nutsdb](https://github.com/nutsdb/nutsdb) | Apache-2.0, 2026-10 | on par with SQLite, faster point operations |
| [Clover](https://github.com/ostafen/clover) | MIT, 2025-09 | has indexes and queries, 90-190x slower in total |

Not tested, and why:

| Entry | Why not |
| --- | --- |
| goleveldb (2024-05), tiedot (2021), pudge (2021), scribble (2023), ledisdb (2023), hare, diskv, libradb | not maintained since 2021-2024, or toys; the engines that matter of their kind (LSM, B+tree) are Pebble, Badger and bbolt, tested |
| Bitcask, pogreb, moss, LotusDB, RoseDB, Coffer, tempdb | more key-value stores of the same kind; they would also need the handler to do what SQL does |
| gedb, [minisql](https://github.com/RichardKnop/minisql) (54 stars) | not looked at beyond their descriptions: a MongoDB-like store and a young single-file SQL database |
| [rqlite](https://github.com/rqlite/rqlite), [redka](https://github.com/nalgeon/redka) | they are SQLite underneath, so not faster by construction |
| [Dolt](https://github.com/dolthub/dolt), [TiDB](https://github.com/pingcap/tidb) | tested as servers in the [speed test](../) (Dolt the slowest of all, TiDB 2.3x MySQL's total); embedding their engines (go-mysql-server) would bring the same engines and far more code |
| CockroachDB | not open source (proprietary licence) |
| immudb | GitHub does not recognise its licence as an open-source one (`NOASSERTION`); an immutable ledger |
| DiceDB, godis, rotom, Vasto, ledisdb | Redis-style servers, not libraries |
| Dgraph, EliasDB, NornicDB, MemHop | graph databases |
| InfluxDB, Prometheus, VictoriaMetrics, LinDB, lynxdb, nanotdb, unitdb | time series and logs |
| Milvus | vector database |
| column | in-memory columnar store |
| objectbox-go | needs cgo |
| CovenantSQL, Databunker, NoKV, piladb | blockchain, a PII vault, a metadata service, a stack |

## What would be needed to know more

A real answer for one engine means a handler for it: query pushdown, updates,
indexes, statistics, 2,000-8,000 lines each. This benchmark says where it could pay:
nowhere on reads (decoding dominates), and only on small writes, which the protocol
hides. It does not measure what SQLite does in the engine and a key-value store
would do in Go - sorting, `$or`, regular expressions, aggregation - where SQLite can
only be ahead.
