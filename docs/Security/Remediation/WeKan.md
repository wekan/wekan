# Design: WeKan automatic security & speed remediation, logging and reports

Status: **Design for approval** · Owner: xet7 · Related: [FerretDB.md](FerretDB.md),
[History.md](../../Features/History/History.md) (the Reports UI pattern),
[hall-of-fame](https://wekan.fi/hall-of-fame/).

This document specifies one subsystem that, for **every vulnerability class and every
performance problem** WeKan can detect at runtime:

1. **Remediates automatically** where possible (block / sanitize / pin / rate-limit / tune).
2. **Logs** each event to a text log, with **counts per category** and a **summary**.
3. **Surfaces** it in **Admin Panel → Reports → Security** and **→ Speed**, using the same
   table + search + pagination design as [History.md](../../Features/History/History.md).

It is a design doc only; the sibling [FerretDB.md](FerretDB.md) covers the Go side. The two
share the same on-disk layout under `WRITABLE_PATH/files/`.

---

## 1. Goals (from the request)

- Audit WeKan (and FerretDB, see the sibling doc) for **all possible vulnerabilities**; add
  **tests and negative tests** for each.
- Add **automatic protection/remediation** for all possible vulnerabilities.
- **Log** each with a **count per category** and a **summary**, using **general vulnerability
  names** and the **`*Bleed` names already in
  [hall-of-fame/index.html](https://wekan.fi/hall-of-fame/)**.
- Write the security log to
  **`WRITABLE_PATH/files/security/YYYY-MM/DD/HH_MM_SS/wekan-log.txt`** and
  **`wekan-summary.txt`** in the same directory.
- **Check there is enough disk space** before writing any of these.
- Add **Admin Panel → Reports → Security** showing summary + details of these logs (pagination
  etc., History.md design).
- Add **automatic remediation of all possible performance problems**; anything not
  auto-remediated is logged/summarized under **`WRITABLE_PATH/files/speed/…`** and shown in
  **Admin Panel → Reports → Speed** (same design).

---

## 2. Architecture

```
            detect (guard fires)                      remediate (block/sanitize/pin/limit)
 request ─────────────────────────►  guard  ──────────────────────────────────────────►  safe outcome
                                        │
                                        ▼  emit SecurityEvent { category, bleed, severity, action, source, detail }
                                 securityLog.record()
                                        │  (disk-space check → append)
                                        ▼
      WRITABLE_PATH/files/security/YYYY-MM/DD/HH_MM_SS/wekan-log.txt      (one event per line)
      WRITABLE_PATH/files/security/YYYY-MM/DD/HH_MM_SS/wekan-summary.txt  (counts per category + totals)
                                        │
                                        ▼  read back, paginate
             Admin Panel → Reports → Security  (summary panel + details table)
```

The **speed** path is identical with `speedLog.record()` and `WRITABLE_PATH/files/speed/…`.

Both loggers live in **`server/lib/securityLog.js`** and **`server/lib/speedLog.js`** (server
only), and are the single choke point every guard funnels through — the same way
`localizeAvatarFromBuffer` is the single avatar-import choke point today.

---

## 3. On-disk layout

`filesRoot = filesRootFrom(process.env.WRITABLE_PATH || process.cwd())` (the same root
attachments/avatars use). A **new dated run-directory is created once per server start**
(timestamp = process start), so a run's events stay together and a busy server does not create
thousands of directories:

```
<filesRoot>/security/2026-07/19/14_03_22/wekan-log.txt
<filesRoot>/security/2026-07/19/14_03_22/wekan-summary.txt
<filesRoot>/speed/2026-07/19/14_03_22/wekan-speed-log.txt
<filesRoot>/speed/2026-07/19/14_03_22/wekan-speed-summary.txt
```

- `YYYY-MM` / `DD` / `HH_MM_SS` are UTC of the run start.
- `wekan-log.txt` — **append-only**, one event per line (see §4). Human-readable and
  grep-friendly; the Report parses it back.
- `wekan-summary.txt` — rewritten (atomically) after each event with the current counts
  (see §5). Small and cheap to render in the Report.

### Disk-space guard (required)

Before creating a directory or appending, `hasEnoughDiskSpace(dir, needBytes)` uses
`fs.statfsSync(dir)` and requires `bavail * bsize > needBytes + SAFETY_MARGIN` (16 MiB). If
space is low the logger **drops the event** (never throws into the caller's request path) and
increments an in-memory `dropped` counter that the summary reports (`# dropped (low disk): N`).
The migration tooling already uses this `statfsSync` pattern
(`snap-src/bin/migrate-gridfs-to-fs.mjs`).

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

Log line (tab-separated, single line, values sanitized to one line each):

```
2026-07-19T14:03:59.123Z  high  ssrf  RedirectBleed  blocked  localizeAvatar  CWE-918  user:abc123  redirect to 127.0.0.1 refused
```

Rules: the logger **truncates `detail` to 500 chars and strips newlines**, and never logs
tokens, passwords, raw request bodies or full attacker payloads — only a classification and a
short reason (defence against the log itself becoming an exfiltration/log-injection sink).

---

## 5. Counts per category & the summary file

The logger keeps an in-memory tally `{ [category]: { total, byBleed, bySeverity, byAction } }`
plus grand totals, and rewrites `wekan-summary.txt` after each event:

```
WeKan security summary — run started 2026-07-19T14:03:22Z — updated 2026-07-19T14:05:10Z
Total events: 42   (blocked 39, remediated 2, detected 1)   dropped (low disk): 0

By category (general name → count):
  ssrf ................. 18   [RedirectBleed 7, LiveBleed 9, DnsBleed 2]
  xss .................. 11   [SourceBleed 6, InputBleed 3, MimeBleed 2]
  authz ................  7   [ImpersonateBleed 4, SortBleed 2, BoardBleed 1]
  auth-race ...........   3   [CasBleed 3]
  spoofing ............   2   [MetricsBleed 2]
  weak-random / brute .   1   [InviteBleed 1]

By severity: critical 0, high 30, medium 9, low 3, info 0
```

Both the general category and the `*Bleed` breakdown are shown, as requested.

---

## 6. Category ↔ `*Bleed` catalog

Every guard maps a **general category** to the **existing hall-of-fame `*Bleed` name** (or a
generic label when no specific `*Bleed` exists). Non-exhaustive; the code keeps the mapping in
one table (`server/lib/securityCategories.js`).

| General category | `*Bleed` name(s) | Guard / remediation point |
| --- | --- | --- |
| `ssrf` | RedirectBleed, LiveBleed, DnsBleed, ProxyBleed, IntegrationBleed | `ssrfGuard.fetchSafe`, `validateAttachmentUrl`, `localizeAvatar`, `trelloApiImport`, outgoing webhooks |
| `xss` | SourceBleed, InputBleed, MimeBleed, ReactionBleed | activity `sourceLink` scheme check, import sanitizers, upload MIME validation |
| `authz` (broken access control) | ImpersonateBleed, SortBleed, BoardBleed, ChecklistBleed, ExcelBleed, BFLABleed, CloneBleed, ReadOnlyBleed | export `canExport`, collection `allow`/`deny` rules, REST board/card guards |
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
| `server/models/settings.js` + `users.js` | CSPRNG invite code + `DDPRateLimiter` | `weak-random`/`brute-force` / InviteBleed |
| `models/fileValidation.js` | MIME sniff + `shellQuote` scanner | `xss`·`injection` / MimeBleed·ScannerBleed |
| collection `allow`/`deny` (`server/permissions/*`) | field-scoped authorization | `authz` / BoardBleed·SortBleed·ChecklistBleed |

New guards discovered during the audit are added to this table and to the tests (§9).

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

## 8. Admin Panel → Reports → Security & Speed

Extends the existing `client/components/settings/adminReports.{jade,js,css}`, which already has a
side-menu + server-paginated report pattern (`reportConfig` → `{ page, count, search, pub,
countMethod }`). Add two entries:

```
li a.js-report-security(data-id="report-security")  i.fa.fa-shield  {{_ 'securityReportTitle'}}
li a.js-report-speed(data-id="report-speed")        i.fa.fa-tachometer  {{_ 'speedReportTitle'}}
```

Each report body follows [History.md](../../Features/History/History.md) §1:

- **Summary panel** (top / left): the parsed `wekan-summary.txt` — total, per-category counts
  (general name + `*Bleed` breakdown), per-severity.
- **Details table** (right, same layout as History): **select checkbox · category/Bleed ·
  severity · action · source · datetime**, with **Search** (left), **pagination** (middle) above
  it. **Server-side pagination** — only the current page is read from the log file.
- **RTL** mirrors the layout, exactly as History specifies.

Server side (admin-only, mirrors the other reports):

- Publication `securityReport` / method `getSecurityReportCount` — read the current run's
  `wekan-log.txt` (and optionally older run-dirs), filter by search, return the requested page.
- `speedReport` / `getSpeedReportCount` — same over the speed logs.
- Both **admin-gated** (`currentUser.isAdmin`), never exposing the raw files over HTTP.

New i18n keys: `securityReportTitle`, `speedReportTitle`, `security-summary`,
`speed-summary`, plus column headers (reuse History's where possible).

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

## 10. Tests & negative tests

- Source-guard `tests/*.test.cjs` (node, no DB) asserting each remediation is present and each
  vulnerable pattern absent — extending `tests/securityMeifukun.test.cjs`.
- Unit tests for the **logger logic** (pure, node-testable): the dated-path builder, the
  disk-space guard (`hasEnoughDiskSpace` with a mocked `statfs`), the summary tally
  (counts per category / `*Bleed` / severity), `detail` truncation/newline-stripping, and the
  log-line parser used by the Report — with **negative tests** (low disk → drop + counter;
  malformed line → skipped; oversize detail → truncated).
- Where a full Meteor/DB run is needed (allow-rule authz, rate-limit), the existing
  `server/**/tests/*.security.tests.js` mocha pattern (e.g. `dnsbleed.security.tests.js`) is
  extended.
- Each test is run/validated (mirror script where no runtime), per the project rule.

---

## 11. Out of scope / follow-ups

- Rotating/retention policy for old run-dirs (a future `securityLog.prune(olderThanDays)`).
- Shipping logs to an external SIEM (kept local by design).
- FerretDB internals — see [FerretDB.md](FerretDB.md).
