# Design: FerretDB automatic security & speed remediation, logging and reports

Status: **Design for approval** · Owner: xet7 · Related: [WeKan.md](WeKan.md) (the WeKan side and
the shared on-disk layout), [Snap-Core](../../Design/Autoupdate/Forks/Snap-Core.md).

This is the FerretDB (v1, SQLite backend — the `wekan/FerretDB` fork on `main-v1`) counterpart of
[WeKan.md](WeKan.md). It specifies, for the database process:

1. **Automatic remediation** of security and performance problems it can handle itself.
2. **Reporting** each such event to WeKan, which records it.

Crucially, **FerretDB does NOT write to any database or file itself.** It surfaces a problem to
WeKan (as an error/warning on the operation, or via its log stream), and **WeKan records it into the
`eventlog` collection with a normal Meteor JavaScript query** ([WeKan.md](WeKan.md) §3). This keeps
storage DB-agnostic — the feature works identically whether WeKan runs on FerretDB or MongoDB — and
there is **no separate FerretDB UI or logger DB**; events appear in WeKan's
**Admin Panel → Reports → Security / Speed**.

---

## 1. Threat model (what FerretDB can remediate)

FerretDB sits behind WeKan and speaks the MongoDB wire protocol over a **local** socket; it is
not internet-facing, so classic web vulns (SSRF/XSS/CSRF) do not apply here. The FerretDB-relevant
categories are:

| General category | What it is here | Auto-remediation |
| --- | --- | --- |
| `query-abuse` | a query/aggregation that would scan or sort an unbounded result set, or a pathological `$regex`/`$where` | pushdown to SQLite where safe; bound/timeout; log if it still runs long |
| `resource-exhaustion` | connection-pool starvation, WAL growth, oversized documents, memory blowups | bounded warm pool, `busy_timeout`, size limits |
| `injection` | building SQL from a collection/field name | deterministic table-name hashing + parameterized SQL (already the design); log any rejected name |
| `auth` / `access` | (when FerretDB auth is enabled) failed handshakes/authn | count + log; never log credentials |
| `corruption-guard` | orphaned tables, non-finite doubles, schema drift | self-heal (adopt orphan table, sanitize NaN/Inf) — already shipped |

Performance categories (the bigger part): see §5.

---

## 2. How FerretDB reports problems to WeKan (no DB writes by FerretDB)

FerretDB must not create files or open its own log database. Instead it **returns the problem to
WeKan**, and WeKan saves it:

- **On an operation error** (e.g. `SQLITE_BUSY` exhausted, an orphaned-table adopt, a rejected
  name): FerretDB returns a normal MongoDB-wire error/warning to WeKan. WeKan's DB-call sites catch
  it and call `securityLog.record(...)` / `speedLog.record(...)`, which insert into `eventlog`
  (source `ferretdb`/`sqlite.*`).
- **On a slow statement**: the slow-query WARN already added for #6480
  (`internal/util/fsql`, `FERRETDB_SLOW_QUERY_THRESHOLD`) is emitted to FerretDB's log stream; a
  thin WeKan-side ingestor (or the operation's own timing) turns it into a `speedLog.record(...)`
  with `source:'sqlite.query'` and a short statement-shape detail.

So every FerretDB event ends up as a document in the **same `eventlog` collection** WeKan writes
(rows labelled by `source` = `sqlite…`/`ferretdb…` vs WeKan's `localizeAvatar`/`setAvatarUrl`),
shown on WeKan's one Reports screen. No `statfs` file guard and no separate summary are needed —
storage and counting are the WeKan DB's job (WeKan.md §3, §5).

## 3. The reporting surface in FerretDB (no logger package)

There is **no `seclog` Go package and no SQLite log file**. FerretDB only needs to make each
problem *observable* to WeKan; the recording is WeKan's job. Concretely:

- Keep returning precise, classifiable **errors/warnings** on the wire for the remediation points
  in §4 (orphan-table adopt, non-finite sanitize, name reject, pool contention, busy-timeout wait),
  so WeKan can attribute and record them.
- Keep the **slow-query WARN** (`internal/util/fsql`) and, where cheap, add a short structured field
  (statement shape, elapsed ms) to make WeKan-side ingestion trivial. **Never** log document
  contents or credentials — only a classification and timing.

WeKan maps these to `eventlog` documents via the category catalog
(`models/lib/securityCategories.js`) using `source:'sqlite.*'`.

## 4. Security remediation points → logger

| Point | Remediation (present/added) | Logged as |
| --- | --- | --- |
| `internal/backends/sqlite/metadata/registry` collection create | adopt orphaned physical table (`IF NOT EXISTS`) instead of crashing | `corruption-guard` / (FloppyBleed-style) `OrphanTableBleed`, `remediated` |
| migration import (`legacyToV2` / `sanitizeNonFinite`) | rewrite bare `NaN`/`Infinity` doubles so cards aren't dropped | `corruption-guard` / `NonFiniteBleed`, `remediated` |
| table-name mapping | deterministic hash + parameterized SQL; reject invalid names | `injection` / generic `InjectionBleed`, `blocked` |
| pool checkout | unlimited `MaxOpenConns` (no starvation) + bounded warm `MaxIdleConns` | `resource-exhaustion`, `remediated` on contention |
| PRAGMA `busy_timeout` handler | contended write waits instead of `SQLITE_BUSY` | `resource-exhaustion`, `remediated` |

Each is a place where FerretDB **already** does the safe thing (mostly shipped for #6467/#6476/
#6480/#6481); this design adds the **event record** so the behavior is counted and reportable.

---

## 5. Performance remediation (the main FerretDB work)

**Auto-remediated (already shipped for #6480 and follow-ups):**

- SQLite connection pragmas as defaults (operator override wins): `synchronous(normal)` (fewer
  fsyncs under WAL), `cache_size(-16384)`, `mmap_size(134217728)`, `temp_store(memory)`,
  `busy_timeout(30000)`, `journal_mode(wal)` — see
  `internal/backends/sqlite/metadata/pool/uri.go`.
- Filter pushdown (`$in`/`$regex`/ranges) turning WeKan's whole-collection scans into indexed
  lookups; bounded warm connection pool; unlimited open connections to avoid cursor starvation.

**Detected-but-not-auto-fixed → reported to WeKan, which records a `speed` event (source `sqlite.*`):**

- A statement at or above `FERRETDB_SLOW_QUERY_THRESHOLD` (default 1s) — the existing slow-query
  WARN (`internal/util/fsql`) is surfaced to WeKan, which records a `speed` event
  (`category:'slow-query'`, `source:'sqlite.query'`).
- A query that could **not** be pushed down and fell back to a full scan + in-Go filter
  (`category:'no-pushdown'`).
- WAL file growth beyond a threshold, or a checkpoint taking too long
  (`category:'wal-growth'` / `'slow-checkpoint'`).
- Connection-pool wait time above a threshold (`category:'pool-wait'`).

Each carries a short `Detail` (statement shape — **not** its bound argument values) and is counted
per category, summarized like [WeKan.md](WeKan.md) §5, and shown in WeKan's **Reports → Speed**.

---

## 6. Tests & negative tests

- Go tests assert the remediation paths return the precise, classifiable errors WeKan keys on (
  drop + counter), the summary tally (counts per category/`Bleed`/severity), `Detail`
  truncation/newline-stripping, and the non-blocking drop-on-full-channel path. Negative tests:
  malformed event, oversize detail, unwritable directory (no panic, event dropped).
- Extend the slow-query test (`internal/util/fsql/slow_test.go`) to assert a slow statement also
  produces a speed event.
- Because this sandbox has **no Go runtime**, the logic is additionally validated with a Python
  mirror (path builder, disk-guard arithmetic, tally) that is actually run, per the project rule;
  the Go tests are for the maintainer to run with `go test ./...`.

---

## 7. Relationship to WeKan.md

- Same directory tree and disk-space discipline; different filename prefix (`ferretdb-`).
- WeKan's **Reports → Security / Speed / Tests** read the one `eventlog` collection, so **one** admin
  screen shows both processes, each row labelled by `source` (`wekan…` vs `sqlite…`/`ferretdb…`).
- Category/`*Bleed` naming is shared; FerretDB adds a few DB-specific generic names
  (`OrphanTableBleed`, `NonFiniteBleed`, `SlowQueryBleed`) that do not (yet) have hall-of-fame
  pages — the Report shows the general category alongside them.
