# Design: FerretDB automatic security & speed remediation, logging and reports

Status: **Design for approval** · Owner: xet7 · Related: [WeKan.md](WeKan.md) (the WeKan side and
the shared on-disk layout), [Snap-Core](../../Design/Autoupdate/Forks/Snap-Core.md).

This is the FerretDB (v1, SQLite backend — the `wekan/FerretDB` fork on `main-v1`) counterpart of
[WeKan.md](WeKan.md). It specifies, for the database process:

1. **Automatic remediation** of security and performance problems it can handle itself.
2. **Logging** of each event, with **counts per category** and a **summary**.
3. The shared on-disk layout under `WRITABLE_PATH/files/`, but with **`ferretdb-*.txt`** filenames.

FerretDB is Go, so the logger is a small Go package; the events are surfaced in WeKan's
**Admin Panel → Reports → Security / Speed** (WeKan reads the shared directory — see
[WeKan.md](WeKan.md) §8), so there is **no separate UI here**.

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

## 2. On-disk layout (shared with WeKan)

Same root and dated-run directory as [WeKan.md](WeKan.md) §3
(`WRITABLE_PATH/files/`), only the filenames differ so the two processes never clash:

```
<WRITABLE_PATH>/files/security/2026-07/19/14_03_22/ferretdb-log.txt
<WRITABLE_PATH>/files/security/2026-07/19/14_03_22/ferretdb-summary.txt
<WRITABLE_PATH>/files/speed/2026-07/19/14_03_22/ferretdb-speed-log.txt
<WRITABLE_PATH>/files/speed/2026-07/19/14_03_22/ferretdb-speed-summary.txt
```

- `WRITABLE_PATH` is read from the environment (FerretDB is started by WeKan/the snap with the
  same `WRITABLE_PATH`); if unset, fall back to the SQLite data directory's parent, else the CWD.
- The **run directory is created once at process start** (UTC).
- Filenames are `ferretdb-log.txt` / `ferretdb-summary.txt` (and `ferretdb-speed-*`), so WeKan's
  Security/Speed reports read **both** `wekan-*.txt` and `ferretdb-*.txt` from the same directory.

### Disk-space guard (required, Go)

`hasEnoughDiskSpace(dir, needBytes)` uses `golang.org/x/sys/unix.Statfs` (or `syscall.Statfs`) and
requires `Bavail * Bsize > needBytes + 16 MiB`. On low space the logger **drops the event** and
increments a `dropped` counter surfaced in the summary — it never blocks a query. This mirrors the
`statfs` free-space check already used in `migrate-gridfs-to-fs.mjs` on the WeKan side.

---

## 3. Logger package

`internal/util/seclog/seclog.go` (new), a tiny package with a process-global logger:

```go
seclog.Record(seclog.Event{
    Category: "query-abuse",     // general category (§1)
    Bleed:    "SlowQueryBleed",  // a *Bleed-style name; generic if none in hall-of-fame
    Severity: "medium",          // info|low|medium|high|critical
    Action:   "detected",        // remediated|blocked|detected
    Source:   "sqlite.query",
    Detail:   "full-collection scan on cards (no pushdown), 1.8s",
})
```

- Line format identical to [WeKan.md](WeKan.md) §4 (tab-separated, one line, `Detail` truncated to
  500 chars, newlines stripped, **never** logs document contents / credentials).
- Counts per category kept in memory (guarded by a `sync.Mutex`); `ferretdb-summary.txt` rewritten
  after each event with the same shape as [WeKan.md](WeKan.md) §5 but headed
  `FerretDB security summary …`.
- Emitting is **best-effort and non-blocking**: a background buffered channel + single writer
  goroutine, so recording never adds latency to a query. On channel-full, drop + count.

The logger is also given a `slog.Logger` so the same events appear in FerretDB's normal log stream
(alongside the slow-query WARN added for #6480).

---

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

**Detected-but-not-auto-fixed → `ferretdb-speed-log.txt`:**

- A statement at or above `FERRETDB_SLOW_QUERY_THRESHOLD` (default 1s) — the existing slow-query
  WARN (`internal/util/fsql`) also calls `seclog`/`speedlog.Record({category:'slow-query', …})`.
- A query that could **not** be pushed down and fell back to a full scan + in-Go filter
  (`category:'no-pushdown'`).
- WAL file growth beyond a threshold, or a checkpoint taking too long
  (`category:'wal-growth'` / `'slow-checkpoint'`).
- Connection-pool wait time above a threshold (`category:'pool-wait'`).

Each carries a short `Detail` (statement shape — **not** its bound argument values) and is counted
per category, summarized like [WeKan.md](WeKan.md) §5, and shown in WeKan's **Reports → Speed**.

---

## 6. Tests & negative tests

- Go unit tests for `seclog`: the dated-path builder, the `Statfs` disk-space guard (low space →
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
- WeKan's **Reports → Security / Speed** read every `*-log.txt` / `*-summary.txt` in the current
  run directory, so **one** admin screen shows both processes, each row labeled by `source`
  (`wekan…` vs `sqlite…`).
- Category/`*Bleed` naming is shared; FerretDB adds a few DB-specific generic names
  (`OrphanTableBleed`, `NonFiniteBleed`, `SlowQueryBleed`) that do not (yet) have hall-of-fame
  pages — the Report shows the general category alongside them.
