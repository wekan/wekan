# Design: WeKan automatic security & speed remediation, logging and reports

Status: **Implemented and audited 2026-08-23** · Owner: xet7 · Related: [FerretDB.md](FerretDB.md),
[History.md](../../Features/Reports/History/History.md) (the Reports UI pattern),
[hall-of-fame](https://wekan.fi/hall-of-fame/).

This document describes the implemented subsystem for vulnerability classes and
performance problems WeKan can detect at runtime:

1. **Remediates automatically** where possible (block / sanitize / pin / rate-limit / tune).
2. **Logs** each event into the existing WeKan database, with **counts per category** and a **summary**.
3. **Surfaces** it in **Admin Panel → Problems → Security** and **→ Speed**, using the same
   table + search + pagination design as [History.md](../../Features/Reports/History/History.md).

The sibling [FerretDB.md](FerretDB.md) covers FerretDB. Both write to the
same `eventlog` collection in the existing WeKan database (FerretDB reports problems to WeKan, which
records them — §7), so it works the same on FerretDB and MongoDB.

---

## Implementation and platform audit (2026-08-23)

The subsystem is active on every WeKan package because detection and reporting run
in the server bundle, not a platform-specific wrapper. Source, Linux and Windows
bundles, Docker, Snap and Sandstorm use the same `eventlog` collection and Admin
Panel Problems methods. Launchers also bound Node and bundled FerretDB memory
relative to host or cgroup memory; explicit limits win.

Runtime self-checks cover database round trips, writable file storage, V8 heap
headroom and free space on the attachment/database filesystem. Heap use at or above
90 percent and free space below 256 MiB (override with `WEKAN_MIN_FREE_DISK_MB`)
are reported to Problems → Tests before allocation or writes fail. Passing checks
write nothing. Positive and negative tests live in `tests/runtimeHealth.test.cjs`.

Database/process classification covers exhausted memory or file descriptors,
read-only volumes, corrupt database storage and oversized BSON documents. These
are reported with actionable guidance; unsafe automatic repair of corruption or
mount permissions is deliberately not attempted.

“Every possible failure” is not a finite claim. This audit covers failures
observable from current code: authorization and input guards, database errors,
resource pressure, file integrity, process crashes, startup health and slow
requests. A new class must add remediation, reporting and a regression.

## 1. Goals (from the request)

- Audit WeKan (and FerretDB, see the sibling doc) for **all possible vulnerabilities**; add
  **tests and negative tests** for each.
- Add **automatic protection/remediation** for all possible vulnerabilities.
- **Log** each into the existing WeKan database with a **count per category** and a **summary**,
  using **general vulnerability names** and the **`*Bleed` names already in
  [hall-of-fame/index.html](https://wekan.fi/hall-of-fame/)**.
- **Do not create new files or databases** under `WRITABLE_PATH` — use the existing WeKan DB via
  normal Meteor JavaScript queries (works on FerretDB, MongoDB, …).
- Add **Admin Panel → Problems → Security** showing summary + details of these logs (pagination
  etc., History.md design).
- Add **automatic remediation of all possible performance problems**; anything not
  auto-remediated is logged/summarized in the existing WeKan database and shown in
  **Admin Panel → Problems → Speed** (same design).

---

## 2. Architecture

```
            detect (guard fires)                      remediate (block/sanitize/pin/limit)
 request ─────────────────────────►  guard  ──────────────────────────────────────────►  safe outcome
                                        │
                                        ▼  emit SecurityEvent { category, bleed, severity, action, source, detail }
                                 securityLog.record()
                                        │  EventLog.insertAsync(...)  (Meteor JS query, fire-and-forget)
                                        ▼
      existing WeKan database → collection `eventlog` (stream:'security')
                                        │
                                        ▼  find({stream}).sort({at:-1}).skip().limit() · grouped count (summary)
             Admin Panel → Problems → Security  (summary panel + details table)
```

The **speed** and **tests** paths are identical with `speedLog.record()` /
`testLog.recordFailure()`, inserting into the same `eventlog` collection with
`stream:'speed'` / `stream:'tests'`.

The three loggers live in **`server/lib/securityLog.js`**, **`server/lib/speedLog.js`** and
**`server/lib/testLog.js`** (server only), each a thin wrapper that inserts one document into the
**`eventlog`** collection (**`models/eventLog.js`**) with a Meteor JS query. They are the single
choke point every guard (and the test reporter) funnels through — the same way
`localizeAvatarFromBuffer` is the single avatar-import choke point today.

---

## 3. Storage — the existing WeKan database (NO new files/DBs)

Events are stored **in the existing WeKan database** as documents in one Meteor collection —
**no new files, no new `.sqlite`, nothing extra under `WRITABLE_PATH/files/`**. WeKan's database
is MongoDB or FerretDB (whose engine is the existing `wekan.sqlite`); either way it is reached the
normal Meteor way (`Mongo.Collection`), so this is exactly how the other Admin Reports already
work.

One collection, **`eventlog`** (`models/eventLog.js`), with a `stream` discriminator so the three
Reports share it:

```js
// models/eventLog.js — one document per event
{
  _id,
  stream:   'security' | 'speed' | 'tests',
  at:       Date,           // server time
  severity: 'info'|'low'|'medium'|'high'|'critical',
  category: String,         // general class (ssrf, xss, authz, slow-method, test-failure, …)
  bleed:    String,         // hall-of-fame *Bleed name (or a generic one)
  action:   String,         // blocked|remediated|sanitized|rate-limited|detected|failed
  source:   String,         // guard/module/test name
  cwe:      String,
  userId:   String | null,
  detail:   String,         // short, sanitized (§4)
}
```

Indexes (via `ensureIndex`, like the rest of WeKan): `{ stream: 1, at: -1 }` for the paginated
Report, `{ stream: 1, category: 1 }` for the summary. The **summary** is a Mongo aggregation /
grouped count and the **details** a `find({stream}).sort({at:-1}).skip().limit()` — the same
server-paginated pattern the existing reports use, so pagination and counts are the database's job.

### Bounded growth (no disk-space file check needed)

Because events live in the WeKan DB (not a growing file we manage), there is no `statfs` file
guard. Instead the collection is **capped by policy**: a light retention (`eventlog` keeps the
newest **N per stream**, default 100000, trimmed on insert or by the existing cron) so it cannot
grow without bound. `record()` is still **best-effort and never throws** into the caller — an
insert failure is swallowed (fire-and-forget `insertAsync().catch()`).

---

## 4. The security event model & log line format

```js
// server/lib/securityLog.js
securityLog.record({
  category: 'ssrf',          // general vulnerability class (see §6 catalog)
  bleed: 'RedirectBleed',    // matching hall-of-fame name (or a general one if none)
  severity: 'high',          // info | low | medium | high | critical
  action: 'blocked',         // blocked | remediated | sanitized | rate-limited | detected
  source: 'localizeAvatar',  // the guard/module that fired
  cwe: 'CWE-918',            // optional
  userId,                    // optional (null for unauthenticated)
  detail: 'redirect to 127.0.0.1 refused', // short, must NOT contain secrets/PII payloads
});
```

`record()` builds one document and stores it with `EventLog.insertAsync({...})` — a normal Meteor
query, so it works identically on FerretDB or MongoDB. `at` is filled server-side.

Rules: the logger **truncates `detail` to 500 chars and strips control characters**, and never
stores tokens, passwords, raw request bodies or full attacker payloads — only a classification
and a short reason (defence against the log becoming an exfiltration sink). Fields are stored as
document values via the Meteor query, never concatenated into any query string.

---

## 5. Counts per category & the summary (a query, not a file)

The summary is computed **from the `eventlog` collection** with grouped counts (a Mongo
aggregation on `EventLog.rawCollection()`, or a few `find().countAsync()` calls), always consistent
with the details:

```js
EventLog.rawCollection().aggregate([
  { $match: { stream } },
  { $group: { _id: { category: '$category', bleed: '$bleed' }, n: { $sum: 1 } } },
  { $sort: { n: -1 } },
]);
// severity / action / grand total are the same, grouped by those fields (or $match+countAsync)
```

The Report renders this as a summary panel (both the **general category** and the **`*Bleed`
breakdown**, as requested):

```
Total events: 42   (blocked 39, remediated 2, detected 1)   dropped (low disk): 0
By category:  ssrf 18 [RedirectBleed 7, LiveBleed 9, DnsBleed 2] · xss 11 [SourceBleed 6, …] · authz 7 [ImpersonateBleed 4, …]
By severity:  critical 0, high 30, medium 9, low 3, info 0
```

`dropped (low disk)` is the store's in-memory counter (§3). Optional time filters are just
`WHERE at >= ?`.

---

## 6. Category ↔ `*Bleed` catalog

Every guard maps a **general category** to the **existing hall-of-fame `*Bleed` name** (or a
generic label when no specific `*Bleed` exists). Non-exhaustive; the code keeps the mapping in
one table (`server/lib/securityCategories.js`).

| General category | `*Bleed` name(s) | Guard / remediation point |
| --- | --- | --- |
| `ssrf` | RedirectBleed, LiveBleed, DnsBleed, ProxyBleed, IntegrationBleed | `ssrfGuard.fetchSafe`, `validateAttachmentUrl`, `localizeAvatar`, `trelloApiImport`, outgoing webhooks |
| `xss` | SourceBleed, InputBleed, MimeBleed, ReactionBleed | activity `sourceLink` scheme check, import sanitizers, upload MIME validation |
| `authz` (broken access control) | ImpersonateBleed, SortBleed, BoardBleed, ChecklistBleed, ExcelBleed, BFLABleed, CloneBleed, ReadOnlyBleed, PositionHistoryBleed | export `canExport`, collection `allow`/`deny` rules, REST board/card guards, undo history |
| `authn` | MiniProfileBleed, CasBleed | logged-out publications, external-login account linking |
| `auth-race` | CasBleed, (OidcBleed) | CAS/OIDC login handlers |
| `spoofing` | MetricsBleed, ProxyBleed | `/metrics` XFF handling, trusted-proxy parsing |
| `weak-random` / `brute-force` | InviteBleed, RandomBleed, BruteBleed | invitation code CSPRNG, `DDPRateLimiter` on `createUser`/login |
| `injection` (shell/regex/selector) | ScannerBleed, EscapeBleed | external scanner `shellQuote`, mongo selector safety |
| `file` | FileBleed, FloppyBleed, SpaceBleed, MimeBleed | upload path/type/size validation, disk-space guards |
| `auth` (token/session) | TokenBleed, AuthBleed, UserBleed | login-token handling, session checks |

When a guard has no specific `*Bleed`, it uses the general category as the `bleed` value (e.g.
`bleed: 'InjectionBleed'` generic) so the Report is never blank.

---

## 7. Detection & remediation points (audit result)

Each existing/added guard calls `securityLog.record(...)` when it fires. The remediation is
already the block/sanitize; the logging is the new part. Representative wiring:

| Point | Remediation (already present or added) | Logged as |
| --- | --- | --- |
| `server/lib/ssrfGuard.js` `fetchSafe` | reject non-http(s), blocked IP, redirect | `ssrf` / DnsBleed·RedirectBleed |
| `models/lib/attachmentUrlValidation.js` | reject private/loopback/metadata attachment URL | `ssrf` / LiveBleed |
| `server/lib/localizeAvatar.js` | fetch via fetchSafe; scheme-validate avatarUrl | `ssrf` / RedirectBleed |
| `client`+`models` activity `sourceLink` | drop non-http(s) href | `xss` / SourceBleed |
| `models/server/metrics.js` | ignore forged XFF unless METRICS_TRUST_PROXY | `spoofing` / MetricsBleed |
| `models/export*.js` | require real `canExport` (no impersonation bypass) | `authz` / ImpersonateBleed |
| `packages/wekan-accounts-cas/cas_server.js` | per-token user data | `auth-race` / CasBleed |
| `packages/wekan-accounts-cas/cas_server.js` | refuse implicit linking to an existing non-CAS account | `authn` / CasBleed |
| `server/publications/users.js` | refuse logged-out mini-profile subscriptions | `authn` / MiniProfileBleed |
| `server/permissions/userPositionHistory.js` + undo model | refuse forged or cross-board history | `authz` / PositionHistoryBleed |
| `server/models/settings.js` + `users.js` | CSPRNG invite code + `DDPRateLimiter` | `weak-random`/`brute-force` / InviteBleed |
| `models/fileValidation.js` | MIME sniff + `shellQuote` scanner | `xss`·`injection` / MimeBleed·ScannerBleed |
| collection `allow`/`deny` (`server/permissions/*`) | field-scoped authorization | `authz` / BoardBleed·SortBleed·ChecklistBleed |

New guards discovered during the audit are added to this table and to the tests (§9).

UserSearchBleed and SubtaskExportBleed deliberately have no Problems event. Those fixes
change the safe result of otherwise legitimate search and export requests; no denied
permission boundary identifies an attack, so logging them would record ordinary use.

### 7a. Attachment & avatar upload remediation (explicit)

Every time an **attachment or avatar upload** is **rejected** or **remediated** — not only the
Trello-import paths above — a security event is recorded, so admins can see upload abuse. This
covers the whole upload choke point (`Attachments`/`Avatars` FilesCollection `onBeforeUpload` /
`onAfterUpload`, `models/fileValidation.js`, `models/lib/avatarUrlSafety.js`,
`server/lib/localizeAvatar.js`):

| Upload event | Remediation | Logged as (`action`) |
| --- | --- | --- |
| MIME type spoofed / on the dangerous-MIME deny-list | rejected (not stored) | `file`·`xss` / MimeBleed — `blocked` |
| Filename with path traversal / shell metacharacters | sanitized to a safe name (or scanner path single-quoted) | `file`·`injection` / FileBleed·ScannerBleed — `sanitized` |
| Upload over the size limit | rejected | `file` / SpaceBleed — `blocked` |
| Not enough disk space for the upload | rejected | `file` / FloppyBleed — `blocked` |
| SVG/HTML content sanitized before storing/serving | sanitized | `xss` / MimeBleed — `sanitized` |
| Avatar URL with a non-http(s)/data:image scheme | rejected at write time | `ssrf`·`xss` / RedirectBleed — `blocked` |
| Avatar/attachment URL resolving to a private/loopback/metadata IP | rejected before fetch | `ssrf` / RedirectBleed·LiveBleed — `blocked` |
| Import-avatars disabled by Admin Panel security setting | skipped | `file` / (policy) — `blocked` |

The event records **the category, the reason, and the filename shape only** (never the file
bytes), and `action` distinguishes a hard **rejection** (`blocked`) from a **sanitization**
(`sanitized`/`remediated`), as the request specifies.

---

## 8. Admin Panel → Problems (menu restructuring)

The Admin Panel 2nd header bar gains a **Problems** button placed to the **right of the Info
(version) button** (rightmost), with a **warning icon** (`fa-exclamation-triangle`). When there
are any new (unacknowledged) problems it is shown with a **red background**
(`settingHeader.js` polls `eventLogProblemAreas`; the `has-problems` class → red). The old
**Reports** button is **removed** — its page is reused as the Problems page. Opening the Admin
Panel still starts on **Settings** (unchanged), not Problems.

The Problems page is the existing `client/components/settings/adminProblems.{jade,js,css}` with a
left menu whose **top** entries are the event streams and whose **lower** entries are the moved
former-Reports items:

```
Problems (left menu)
  Summary      ← the acknowledge checkbox list (problemsSummary)
  Security     ← read-only event table (eventStreamReport stream=security)
  Speed        ← read-only event table
  Tests        ← read-only event table
  ── separator ──
  Broken Cards · Files · Rules · Boards · Cards · Impersonation   (moved from Reports)
```

- **Summary** (`problemsSummary`, the page opens here): a **checkbox list** of problem areas with
  each area's menu path + new-problem count and **one Acknowledge button** that acknowledges every
  checked area. **This is the ONLY place problems are acknowledged.**
- **Security / Speed / Tests** (`eventStreamReport`): **read-only** paginated, searchable tables of
  that stream's events (datetime · category · Bleed · severity · action · source · detail), read
  through the admin-only `eventLogPage` / `eventLogCount` methods
  (`find({stream, <search>}).sort({at:-1}).skip().limit()`). No acknowledge control here.
- The moved report items keep their existing publications/pagination unchanged.

Acknowledging problems happens **only** on the **Summary** page
(`client/components/settings/problemsSummary`) — the checkbox list + one Acknowledge button,
which resets the per-stream new-problem count (and clears the red on the Problems button). The
Security/Speed/Tests pages are **read-only**.

Server side (admin-only, all reading the `eventlog` collection — no SQLite files, no publications
that leak non-admin data):

- `eventLogProblemAreas()` — per stream, the count of events newer than its ack; drives the
  Summary checkboxes and the red Problems button.
- `acknowledgeEventLog(streams)` — upsert the ack timestamp for one or many streams.
- `eventLogCount(stream, search)` and `eventLogPage(stream, limit, skip, search)` — the read-only
  Security/Speed/Tests tables (newest first, server-side search + skip/limit).
- All **admin-gated** (`user.isAdmin`).

New i18n keys: `problems`, `summary`, `securityReportTitle`, `speedReportTitle`,
`testsReportTitle`, `new-problems`, `acknowledge`, `no-new-problems`, `problems-summary-help`,
and the `event-*` column headers.

---

## 9. Performance remediation (WeKan side)

Auto-remediations already shipped or added, logged to **speed** only when a problem is detected
that is **not** auto-fixed:

- **Cards loading** `lazy`/`all`, bounded queries, indexes (`ensureIndex`), pagination on reports
  and history — already present.
- **Detected-but-not-auto-fixed** (→ `speedLog.record({ category, detail })`): a request/method
  slower than `WEKAN_SLOW_REQUEST_MS` (default 2s), a publication returning more than
  `WEKAN_LARGE_PUBLICATION` docs, a board exceeding a card/attachment threshold, repeated
  full-collection scans. Each is logged with a category (`slow-method`, `large-publication`,
  `big-board`, …) and a short detail, summarized like §5, shown in Reports → Speed.

FerretDB-side performance remediation (SQLite pragmas, slow-query WARN) is in
[FerretDB.md](FerretDB.md).

---

## 9b. Tests logging (`eventlog`, `stream:'tests'`)

The **third stream** logs **test failures** — "anything that would fail some existing WeKan
test". It uses the same `events` schema and the same disk-space discipline, in the
`eventlog` collection (`stream:'tests'`), via `server/lib/testLog.js`.

- **No Playwright dependency:** WeKan must NOT require Playwright to be installed. The Tests
  stream only logs failures **detectable without a browser/Playwright** — the runtime self-checks
  (below) and the unit/mocha suites. Browser-only end-to-end (Playwright) failures are out of
  scope here; no runtime code imports Playwright (asserted by `tests/securityLog.test.cjs`).
- **Runtime self-checks (`server/lib/selfChecks.js`):** at startup (and via an admin-only
  `runSelfChecks` method) WeKan runs cheap invariants that a unit test would assert — a database
  round-trip, `WRITABLE_PATH/files` writable — and records any failure to the Tests stream. These
  need no browser, so an admin sees real problems in Problems → Tests without any test run.
- **What is a "test event":** every **failing** self-check, plus (when the non-Playwright unit/
  mocha suites run) each failing test. Passing checks are not logged (only failures, so the report
  is a defect list, not noise).
- **How it is captured:** a thin **reporter** records one event per failure:
  - `category = 'test-failure'` (or `'test-error'` / `'test-timeout'`),
  - `bleed = 'TestBleed'` (generic; no hall-of-fame page — the report shows the general category),
  - `action = 'failed'`, `severity` from the suite (unit=`medium`, security=`high`, e2e=`low`),
  - `source = "<file>:<test name>"`, `detail = <first line of the assertion/error message>`
    (sanitized, ≤500 chars — never the full stack or secret values).
  - The **node** `.test.cjs` guards call `testLog.record()` from their failure branch; **mocha**
    tests use a small custom reporter (`onFail → testLog.record`); **Playwright** uses a reporter
    hook. A wrapper in `build.sh` can also parse each suite's summary and insert failures,
    so the collection is populated even when a runner cannot `require` the logger (it then inserts
    through the running WeKan server's method instead).
- **Report:** Admin Panel → Reports → **Tests** shows the same summary + paginated details
  (which tests failed, how often, newest first), so a maintainer sees the current failing set and
  the failure counts per suite/category without re-reading raw CI logs.

---

## 10. Tests & negative tests

- Source-guard `tests/*.test.cjs` (node, no DB) asserting each remediation is present and each
  vulnerable pattern absent — extending `tests/securityMeifukun.test.cjs`.
- Unit tests for the **pure logic** (node-testable): `sanitizeDetail` truncation/control-stripping
  and the category catalog — with **negative tests** (oversize detail → truncated; unknown key →
  generic); plus source-guards that the loggers insert into `eventlog` and touch no filesystem.
- Collection integration test (with a running Meteor/Mongo or FerretDB): insert events, assert the
  grouped summary and the `find().sort().skip().limit()` page match; assert `record()` never throws
  even if the insert is rejected (fire-and-forget).
- The **tests stream** is dogfooded: the node `.test.cjs` failure branch calls `testLog.record`,
  so a run that has failures populates `eventlog` (`stream:'tests'`).
- Each test is run/validated (Python mirror where no node/SQLite runtime), per the project rule.

---

## 12. Canary tokens — who tried it, and from where

§7 records what a guard **did**: a request was blocked, a filename sanitized, an
upload refused. That answers "is WeKan defending itself". It does not answer the
question an admin actually asks after seeing one — **who did that, and from
where** — and it does not distinguish a browser that got confused from somebody
working through the [hall of fame](https://wekan.fi/hall-of-fame/) one entry at
a time.

A **canary token** is a tripwire placed at a point that **only a permission-override
attempt reaches**. Ordinary use never gets there: the code path runs when a
request asks for something the rules forbid. So a trip is not noise, and it is
worth an admin's attention with the actor attached.

Three properties define one. Each is enforced by `tests/canaryTokens.test.cjs`
and `tests/canaryCoverage.test.cjs`.

### 12.1 SILENT — the attacker learns nothing

Tripping a canary changes **nothing the caller can observe**. The refusal keeps
its wording, its status, its timing and its shape. This is not politeness: a
canary that announces itself is a map of which paths are watched, and a probe
would simply avoid them.

So the trip function is written as a drop-in for the refusal it replaces:

```js
if (somethingForbidden) return false;                        // before
if (somethingForbidden) return tripCanary('card.vote-field', { userId });  // after
```

`tripCanary()` **always returns `false`**, and `tripCanaryDeny()` — for a Meteor
`deny` rule, which refuses by returning **true** — always returns `true`. The
return value is decided **before** any reporting is attempted, and the reporting
is wrapped, so a canary can never throw into, delay, or otherwise disturb the
request it is watching. A REST handler that must throw re-throws **the original
error object**, never a new one.

### 12.2 BOUNDED — probing must not cost more than it does now

A canary sits where an attacker can loop. Writing one database row per attempt
would be a denial of service they get for free: CPU on every insert, and a
collection that grows until the disk is full.

`models/lib/canaryTokens.js` (pure, no Meteor, no clock of its own — the runtime
passes the time in, which is how the tests drive it) decides per trip:

- the **first** trip of a `(canary, actor)` pair is recorded immediately, so a
  probe shows up promptly;
- further trips **inside the window** (default 60 s) write nothing and are
  **counted**;
- the first trip **after** the window writes **one summary** carrying the total,
  which is what the `count` column shows;
- a pair that has already written `maxEventsPerPair` summaries (default 60)
  keeps counting but **stops writing** until it goes quiet — so an endless slow
  probe cannot write one row a minute forever;
- the map of tracked pairs is **capped** (default 5000) and evicts the **least
  recently seen** entry, so a long-running attacker is not pushed out by a
  passing one, and a botnet varying its address cannot grow it without bound;
- idle pairs are **swept** on a timer, so a long-lived server does not hold a row
  per address seen since boot.

A thousand attempts in a minute therefore cost **one row**, and the decision to
suppress costs **one map lookup** — which is what makes a canary safe to put on a
path an attacker chooses to hammer. The username lookup is cached (60 s, capped
at 1000 entries), so probing cannot make WeKan do a database read per attempt
either, and neither the lookup nor the insert is awaited on the caller's path.

### 12.3 ATTRIBUTED — who, and from where

Every event carries:

| Field | Where it comes from |
| --- | --- |
| `userId` | the caller's own knowledge, else the DDP invocation |
| `username` | looked up once and cached; **stored on the event**, not resolved later |
| `ip` | the request, resolved with `resolveClientKey` — the SAME spoofing-safe rule as the login throttle |
| `location` | display-only country, region, city and coordinates already supplied by Cloudflare or another supported proxy/CDN |
| `count` | how many attempts this one row stands for (§12.2) |

The username is **denormalised at write time on purpose**: it is what the account
was *called when it tried*, so a later rename does not rewrite history and a
deleted account does not erase it.

The address honours `X-Forwarded-For` **only as far as `HTTP_FORWARDED_COUNT`
says to trust it**, exactly as `server/lib/loginAttemptThrottle.js` does.
Otherwise an attacker would write somebody else's address into the security log
by sending a header — turning the report into a way to frame a colleague.

The report separates IPv4 and IPv6, and shows the location as a country flag plus
city/region label when those headers exist. Location is informational only: WeKan
does no third-party lookup, and proxy location headers never authorize, block,
group, or rate-limit anything. The shared event fold fills a missing username
from an available `userId`, so every Problems stream receives the same attribution
even when its caller knew only the account id.

`detail` says what was **attempted**, in the words of the feature ("tried to move
a card into a board they cannot write to"), and **never the payload**: it is
attacker-controlled text, and §4's truncation and control-character stripping is
the second line of defence behind that rule.

### 12.4 Where the canaries are

Each is `canaryId → the guard that trips it → the published vulnerability whose
ATTEMPT it watches`. The table is pinned by `tests/canaryCoverage.test.cjs`,
which also fails on a canary in the catalog that nothing trips.

| Canary | Tripped in | Watches the attempt behind |
| --- | --- | --- |
| `card.cross-board-move` | `server/permissions/cards.js` | BoardBleed |
| `card.invisible-parent` | `server/permissions/cards.js` | ParentBleed |
| `card.vote-field`, `card.poker-field` | `server/permissions/cards.js` | direct field writes that must go through a method |
| `list.cross-board-move` | `server/permissions/lists.js` | BoardBleed |
| `swimlane.cross-board-move` | `server/permissions/swimlanes.js` | BoardBleed |
| `checklist.cross-board-move` | `server/permissions/checklists.js` | ChecklistBleed |
| `checklist-item.cross-board-move` | `server/permissions/checklistItems.js` | ChecklistBleed |
| `avatar.version-path`, `avatar.restricted-field`, `avatar.not-owner` | `server/permissions/avatars.js` | PathBleed |
| `attachment.version-path`, `attachment.restricted-field` | `server/permissions/attachments.js` | PathBleed |
| `reaction.foreign` | `server/permissions/cardCommentReactions.js` | writing another user's reaction |
| `comment.foreign-delete` | `server/models/cardComments.js` | CommentBleed |
| `export.path-outside-storage` | `models/exporter.js` | PathBleed (a path poisoned some other way) |
| `database.canary` | `server/lib/databaseProblems.js` | [FerretDB.md](FerretDB.md) — an operation WeKan never issues |

**No Playwright, no browser.** Every canary above fires inside a server-side
permission check, so it works on any WeKan server with nothing installed. A
published vulnerability whose attempt leaves no server-side trace — a fixed XSS,
say, where the payload is refused in the browser — has no canary, and that is a
statement of what is detectable rather than an omission.

Two ratchets keep that distinction reviewable. `tests/securityRegressionCoverage.test.cjs`
accounts for every published Hall of Fame name and requires each named regression
suite to remain present. As of the 2026-09-05 audit, 71 of 93 have named coverage and
22 older fixes remain explicit test gaps. `tests/hallOfFameProblemsCoverage.test.cjs`
reads the real `.tools/wekan.fi` Hall of Fame and requires every name to be either a
Problems catalog entry, a reasoned non-attributable case, or an explicit pending
review. A missing companion checkout may skip the website comparison, but it can no
longer silently use the obsolete `~/repos/w/wekan.fi` location when `.tools/wekan.fi`
is present.

This does not equate safe output with an attack attempt. CookieTokenBleed,
MailTitleBleed and ErrorBleed harden ordinary authentication, notification and error
responses; emitting a Security row for every normal use would be false reporting.
ScannerBleed is attributable: an exploit-looking filename presented while the
external scanner command is configured is rejected before command construction and
is now reported under that exact Hall of Fame name.

### 12.5 What the admin sees

Admin Panel → **Problems → Security** (§8), unchanged except for three columns:
**Username**, **IP address** and **Attempts**. Both new columns are **searchable**,
because the thing an admin does with one security event is pivot on it: every
other event from this address, every other event from this account.

A row reads:

```
2026-08-09 14:02:11 · authz · PathBleed · high · detected · canary:avatar.version-path
  · mallory · 203.0.113.7 · 214
  · tried to write the on-disk path of an avatar; 214 attempts in this window
```

---

### 12.6 Injection, sanitization, and the other common attacks

§12.4 watches **permission overrides**. Three more families are watched the same
way, and each has the same problem in common: the defence already existed and was
**silent**, so nobody ever learned that it had fired.

**NoSQL injection** (`models/lib/injectionDetect.js`, pure and unit-tested). Two
shapes, and they are different problems:

- an **execution operator** in a client-supplied selector — `$where`,
  `$function`, `$accumulator`, `$out`, `$merge`. A selector is data; these turn
  it into code the database runs. → `injection.nosql-selector`
- an **operator object where a scalar was expected** — `{"$ne": null}`,
  `{"$gt": ""}`, `{"$regex": ".*"}` in a field that should hold the string a
  user typed. This is how "match every row" is spelled in a document database
  and it needs no JavaScript at all. → `injection.nosql-operator`

The detector is deliberately narrow about the second: **every** key must be an
operator. A plain object with ordinary keys is somebody sending the wrong type,
which is a validation error, and calling it an attack would fill the report with
noise. A `$` inside a *string* is text — a card titled `$100 refund` puts nobody
in the security report.

**SQL injection.** WeKan builds no SQL, so it cannot detect this itself. The
database does: FerretDB's `internal/util/sqlguard` refuses a statement carrying
what only injection produces, and now **marks the refusal** so the attempt
reaches the admin instead of dying in a log file
([FerretDB.md §3b](FerretDB.md)). → `injection.sql-statement`

**Sanitization.** Sanitizing is routine — a filename gets trimmed, a pasted
`<b>` gets stripped from a comment — and routine is not worth an admin's
attention. What is worth it is sanitization that removed something that would
have **done** something:

| Canary | Fires when |
| --- | --- |
| `sanitize.dangerous-filename` | an uploaded name carried an exploit pattern, invisible characters or URL encoding |
| `sanitize.path-traversal` | a file path tried to leave its directory |
| `sanitize.dangerous-content` | active markup was removed from an uploaded file (a script or `javascript:` URI inside an SVG) |
| `sanitize.dangerous-text` | active markup was removed from submitted text (a comment carrying `<script>`, an `onerror=`, a `javascript:` URI) |

`removedActiveMarkup()` decides the last two by comparing what the sanitizer took
**out**: text that never had any is not interesting, and text that still has it
was not sanitized at all — which would be a different bug.

**Other common attacks.**

| Canary | Fires when |
| --- | --- |
| `spoof.forwarded-header` | `/metrics` denied a request that carried `X-Forwarded-For` — nothing legitimate sends one to an endpoint that does not trust it |
| `brute.login-lockout` | a REST login was refused while the address was locked out, i.e. it had already failed the configured number of attempts in a row |

Both replaced a **direct `securityLog.record()`**. That matters for more than
tidiness: those two paths are **unauthenticated**, so a bare `record()` was one
database insert per request an attacker chose to send. Going through the canary
gives them the §12.2 rate limit and the §12.3 attribution, and the responses —
the 401 and the 429 — are untouched.

## 13. Filesystem storage integrity, crashes and downtime

§12 watches what somebody **tries to do through WeKan**. This section is about
what happened to WeKan's own files and process **when nobody was asking it
anything**.

WeKan's attachments and avatars are files under `WRITABLE_PATH`, and the database
holds one document per file. **Nothing checked that the two still agree.** A file
can be replaced, truncated, back-dated or deleted by anything that reaches the
filesystem — a bad restore, a sync tool, a container rebuild, a shell on the
volume — and WeKan would keep serving whatever is there now, silently.

### 13.1 The baseline, and the four hashes

One document per file in the existing WeKan database (`fileIntegrity`; **no new
files under `WRITABLE_PATH`**, per §3): the path, the size, the modification
time, and **md5, sha256 and sha512**.

Three digests, not one, because they answer different questions. **md5** is fast
and is what most other tools print, so an admin can compare against a backup with
the tool they already have — it is never alone here, because its collision
resistance is gone. **sha256** is the working digest. **sha512** is a second,
different-width one, and it earns its place on the day the two *disagree*: two
digests over the same bytes cannot disagree, so when they do, the bytes were not
read the same way twice — a failing disk, a partial write, a truncated copy —
which is a different problem from a substitution and is reported as its own,
**critical**, finding.

**ed25519 is the fourth, and it is not a hash — it is a signature**, which is the
only thing that answers the question the three digests cannot: *who says these
are the right hashes?* Anybody who can rewrite a file can rewrite a row of
hashes. So each baseline entry is signed over a canonical line
(`manifestLine()` — fixed field order, no JSON, whose key order and escaping are
not guaranteed stable across versions), and the signature is verified on every
scan. A record that does not match its signature is a **critical** finding, and
it is never explained away by an ordinary edit: WeKan does not rewrite a baseline
without re-signing it.

The key:

| Source | What it protects against |
| --- | --- |
| `WEKAN_INTEGRITY_PRIVATE_KEY` (PKCS#8 PEM), supplied by the operator and **never stored by WeKan** | an attacker who reaches the **database** as well as the disk |
| otherwise, generated on first run and kept in the database | filesystem-only tampering — a restore, a sync tool, a container rebuild, a shell on the volume |

The second is the common case and is honest about not being more than that. A
**malformed** supplied key is reported and the scan runs **without** signing
rather than silently falling back to a generated one, which would look like it
was working while checking nothing the operator meant.

### 13.2 The scan: once a day, when nothing else needs the machine

Reading every stored byte is the last thing that should compete with users, so
the scan is paced by policy rather than by hope (`models/lib/fileIntegrity.js`,
pure and time-injected):

- **once a day** (`intervalMs`), checked hourly — not on every restart;
- **not while the machine is busy**: at or above **60% CPU** it does not start,
  and it stops if the load rises mid-run. It is never urgent;
- **a pause between every file** — 50 ms, plus 20 ms per megabyte, so a
  directory of large files does not become a sustained read;
- **a time budget** (15 minutes). A scan that stops and continues tomorrow is
  better than one that holds a machine down;
- **one read per file for all three digests.** Three passes would be three times
  the disk for the same bytes.

A run that stopped early does **not** report the files it never reached as
missing — it has not looked everywhere, and saying otherwise would be a lie.

### 13.3 The finding: changed, with no record saying why

Files change when people use WeKan; reporting that would be noise. So each change
is classified against WeKan's own record of the file:

| Situation | Result |
| --- | --- |
| unchanged | nothing recorded |
| changed, and WeKan has a record of the operation | `info` — reported once, then **re-baselined** so it does not repeat daily |
| **changed, with nothing to account for it** | **the warning** — at least `medium`, and deliberately **not** re-baselined, so it keeps showing until somebody looks |
| the record's signature does not verify | `critical`, never explained |
| recorded and now missing | `high` |
| present and never recorded | `low` — a leftover or a backup copy is not evidence of anything |

A modification time that moved **backwards** is called out separately: nothing
does that by accident.

The event carries the object kind/ID, bounded path, expected and observed size and
digests, detection time, and last known legitimate writer/time. It never carries
file contents. Background scans explicitly have no username or IP; an interactive
check records the authenticated user and proxy-aware address when available.

### 13.4 Crashes, downtime and errors nobody caught

Admin Panel → Problems answered "what did WeKan refuse" and "what did the
database say", and not the plainest question: **did this server stop, and did it
stop cleanly?**

A crash leaves nothing behind — the process is gone, so it cannot write a message
about being gone. A **heartbeat** is the only thing that works: WeKan writes the
time every minute, and the NEXT start reads it.

| What the next start finds | Recorded as |
| --- | --- |
| no previous run | nothing — a first run is not a problem |
| last heartbeat with a **clean-shutdown mark** | nothing — a deliberate restart is not a problem |
| a **short** gap, no mark | `low` — the shutdown hook may simply not have run |
| a **long** gap, no mark | **`high`** — it stopped without shutting down cleanly, and here is how long it was down |

Recording every deliberate restart is how a Problems page becomes a page nobody
opens, which is why the first two record nothing at all.

Two more land in the same stream, because they are the same question one level
down: an **uncaught exception** and an **unhandled promise rejection**. This app
turns the second into a process exit, so it is a crash *with a cause attached* —
and the cause is worth recording before the process goes. The listeners are
**added, never replaced**: removing whatever else is listening would change how
the app handles its own failures.

### 13.5 Where it appears

Integrity findings use the `security` event stream and appear in Admin Panel →
**Problems → Security**, with the Username / IP address / Attempts columns from
§12.3. They count towards the red **Problems** button like every other security
finding. Recovery outcomes remain in Problems → Recovery; a recovery checksum
mismatch is both a recovery failure and a security-integrity finding.

The `fileIntegrity` baseline itself is **never published and never client-writable**:
it is a map of every file on the server, and the key document is a private key.
Neither belongs on a client, admin or not — Admin Panel reads the **findings**,
which are ordinary event rows.

---

## 14. Out of scope / follow-ups

- Rotating/retention: a cron trims `eventlog` to the newest N per stream (`remove` older docs).
- Shipping logs to an external SIEM (kept local by design).
- FerretDB internals — see [FerretDB.md](FerretDB.md).
