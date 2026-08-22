# Design: FerretDB automatic security & speed remediation, logging and reports

Status: **Implemented and audited 2026-08-23** · Owner: xet7 · Related: [WeKan.md](WeKan.md) (the WeKan side and
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
**Admin Panel → Problems → Security / Speed**.

---

## Implementation audit (2026-08-23)

Implemented in the current `main-v1` fork: SQLite pragmas, bounded idle pools,
unlimited open connections where parked cursors require them, slow-query warnings,
SQL injection guards, canary markers and the WeKan-side database error classifier.
The classifier reports disk-full, authentication, permission, connection, timeout,
contention, unsupported-operation and backend SQL failures in Problems → Database.

The current fork does **not** emit structured markers for no-pushdown, WAL growth,
slow checkpoints or pool waits. Those remain audit follow-ups below and must not be
described as already visible in Problems. Slow-query warnings are observable in the
FerretDB service log; only errors reaching the MongoDB wire client are currently
recorded automatically by WeKan.


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
shown on WeKan's one Problems screen. No `statfs` file guard and no separate summary are needed —
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

---

## 3b. Canary tokens — operations the client never issues

The database is reached over a **local socket by one application**, whose driver
is a Meteor 3 one. That makes a class of operations interesting **by their mere
presence**: server-side JavaScript evaluation, an aggregation writing its result
into a collection, dropping a database, a server-administration command. The
driver does not send them. A request that does is either a bug or somebody who
has reached the socket and is looking around — and both are worth telling the
operator about.

`internal/util/canary` (paired with `tests` in the same package) is the FerretDB
half of [WeKan.md §12](WeKan.md), and it keeps the same three properties:

- **SILENT.** A tripped canary returns the ordinary *"operation not supported by
  this build"* refusal — the same answer an unimplemented command gets. The id is
  appended as `canary:<id>`, which the client parses and the operator reads;
  nothing in it says that anything was detected or recorded, so a probe cannot
  tell a watched operation from an unimplemented one and route around the watched
  ones. A Go test asserts the message contains none of *detect*, *record*, *log*,
  *alert*.
- **BOUNDED.** The package writes **nothing** — no file, no table, no counter. It
  is a map lookup and an error value, so a caller hammering it in a loop costs
  this process one string comparison per request and this package **no memory at
  all**. This is what §2's "FerretDB does not write to any database or file"
  means for canaries, and a Go test asserts the package is stateless.
- **ATTRIBUTED.** The marker names *which* canary, so the operator's report says
  "tried to run server-side JavaScript" rather than "an error".

The canaries:

| Id | Operations | Why the client never sends it |
| --- | --- | --- |
| `db.javascript` | `eval`, `$where`, `$function`, `$accumulator`, `mapReduce` | the driver has no feature that evaluates JavaScript in the database |
| `db.result-to-collection` | `$out`, `$merge` | aggregation results are read, never persisted by the database |
| `db.drop-database` | `dropDatabase`, `dropAllDatabases` | the application drops collections it owns; dropping the database is an operator action taken with the database's own tools |
| `db.server-admin` | `shutdown`, `setParameter`, `getParameter`, `profile`, `logRotate` | these manage the server, not the data |

`Check(op)` returns `nil` for everything else, and a Go test pins the ordinary
vocabulary — `find`, `insert`, `update`, `aggregate`, `$match`, `$group`,
`$lookup`, … — as **not** tripping. A canary that fires on normal traffic is
worse than no canary: it buries the real ones.

### How it reaches the operator

Exactly as §2 describes for every other FerretDB event — the database reports,
the client records:

```
FerretDB                                     WeKan
  Check(op) → canary:<id> in the error   ──►  recordDatabaseProblem()
                                                │ databaseCanaryId() reads the marker
                                                ▼
                                              tripCanary('database.canary')   ← rate-limited,
                                                │                               aggregated,
                                                ▼                               attributed
                                              eventlog (stream:'security')
                                                │
                                                ▼
                                     Admin Panel → Problems → Security
```

Two things that are deliberate on the WeKan side
(`server/lib/databaseProblems.js`):

1. The id is **not trusted as a category**. It is matched against a known list,
   and anything else is recorded generically. An error string is
   attacker-influenced, and a marker parsed out of one must never be able to
   choose which security category it lands in — or to inject anything, which is
   why the extractor accepts only `[a-z][a-z0-9.-]{0,60}`.
2. A canary goes to the **security** stream and does **not** fall through to the
   `database` stream. Filing it under "the database said something" would put an
   intrusion attempt in the list of things to triage as configuration problems.

On **MongoDB** there is no FerretDB to mark anything, and these operations simply
never appear — the WeKan side is inert, and the feature degrades to nothing
rather than misbehaving. That is the same property as §2: storage and reporting
are WeKan's job, so nothing here depends on which database is underneath.

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
  fsyncs under WAL), `cache_size(-65536)`, `mmap_size(268435456)`, `temp_store(memory)`,
  `busy_timeout(30000)`, `journal_mode(wal)` — see
  `internal/backends/sqlite/metadata/pool/uri.go`.
- Filter pushdown (`$in`/`$regex`/ranges) turning WeKan's whole-collection scans into indexed
  lookups; bounded warm connection pool; unlimited open connections to avoid cursor starvation.

**Observable now:** operation errors carrying classifiable wire messages are recorded
by WeKan in Problems → Database. Slow statements emit bounded, value-free WARN
lines in the FerretDB service log.

**Audit follow-ups, not yet automatic Problems events:** structured markers for a
no-pushdown fallback, WAL growth or a slow checkpoint, connection-pool wait time,
and ingestion of slow-query WARN lines. These require a bounded authenticated bridge
from the separate database process; claiming they are recorded before that bridge
exists would be misleading. When implemented, each event must carry statement shape,
never bound values, and be counted per category in Problems → Speed.

---

## 6. Tests & negative tests

- Current Go tests cover canary silence, bounded stateless behavior, SQL guarding,
  slow-query threshold parsing, SQLite pragmas and pool limits. WeKan Node tests
  cover marker parsing, error classification, credential redaction and Admin
  Problems wiring.
- Positive and negative runtime-health tests cover healthy and pressured heap and
  disk states. Future structured performance markers require Go producer tests and
  WeKan ingestion tests before this document may call them implemented.

---

## 7. Relationship to WeKan.md

FerretDB writes no event database or report file. It returns bounded, classifiable
errors or service-log warnings; WeKan owns storage, aggregation, acknowledgment and
the Admin Panel Problems UI. The shared platform launchers allocate proportional
memory to Node and Go, while explicit administrator limits win.

Database-independent Problems reporting works with MongoDB and every FerretDB SQL
backend. SQLite-specific pragmas and filesystem checks apply only to SQLite; backend
authentication, permission, syntax, connection and timeout errors use the shared
classifier.
