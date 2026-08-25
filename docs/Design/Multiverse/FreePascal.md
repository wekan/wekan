# Rewriting WeKan in Free Pascal

This page evaluates Free Pascal as a possible implementation language for
WeKan. It uses the dependencies and design choices already explored in the
local [Omi](https://github.com/wekan/omi) and
[Wami](https://github.com/wekan/wami)
prototypes. It is a design exploration, not a commitment to replace the current
Meteor application.

Omi demonstrates a maintained, standalone Free Pascal HTTP server using
`fphttpapp`, `HTTPDefs`, `httproute`, `fpjson`, `jsonparser` and a statically
linked SQLite amalgamation. Wami demonstrates server-rendered WeKan-shaped pages
for modern, no-JavaScript and retro browsers, backed by a proposed SQLite schema.
Wami's scale-up design selects mORMot 2, or alternatively Brook, only when the
small `fcl-web` server is no longer sufficient.

References:

- [Free Pascal](https://www.freepascal.org/)
- [Free Component Library](https://www.freepascal.org/docs-html/fcl/)
- [Lazarus](https://www.lazarus-ide.org/)
- [mORMot 2](https://github.com/synopse/mORMot2)
- [Brook framework](https://github.com/risoflora/brookfreepascal)
- [SQLite](https://sqlite.org/)

## Summary

Free Pascal could produce a small native WeKan server for more operating systems
and CPUs than the current Node.js distribution. Static HTML forms can make the
core board workflow usable without JavaScript, including old and text-mode
browsers. Modern browsers can progressively add drag-and-drop and richer widgets
without making them prerequisites for reading or changing a board.

This is not a source translation. Meteor currently supplies accounts, methods,
publications, subscriptions, DDP over SockJS, Minimongo, Tracker reactivity,
optimistic method simulation and the build lifecycle. The selected Pascal stack
does not reproduce those facilities automatically. They must be replaced by the
server-rendered Wami interaction model, retained through a compatibility layer,
or implemented explicitly.

The most coherent first target is therefore not a pixel-identical Meteor clone.
It is the Wami design: a server-rendered, SQLite-backed, accessible core WeKan
with immediate form submissions and optional browser enhancements. Compatibility
with existing data, permissions, imports and integrations remains mandatory.

## Existing prototype decisions

| Area | Omi selection | Wami selection | Consequence for a Free Pascal WeKan |
| --- | --- | --- | --- |
| Compiler | Free Pascal 3.x, native executable | Free Pascal, including AmigaOS/AROS/MorphOS targets | Keep the portable language subset small and test every promised target. |
| HTTP server | FCL `fphttpapp`, `HTTPDefs`, `httproute` | The same lightweight server initially | This is the default scale-down stack. |
| High-scale HTTP/realtime | Not required by Omi | mORMot 2; Brook as an alternative | Add only after measurements show that `fphttpapp` is insufficient. |
| TLS and public edge | Reverse proxy | Caddy 2 reverse proxy | Keep certificate automation, HTTP/2/3 and edge policy outside the minimal app binary. |
| Data | SQLite amalgamation linked into the executable | SQLite schema modeled from WeKan data | One local database file is the primary offline/small-server design. |
| JSON | `fpjson`, `jsonparser` | JSON fields and structure detection | Prefer FCL units at small scale; mORMot JSON is an optional modern-server optimization. |
| HTML | Generated server-side, no cookies or required JavaScript | HTML 4-compatible pages with forms and buttons | Core operations must work before progressive JavaScript is loaded. |
| Modern interaction | None required | `interact.js` for drag-and-drop and multi-touch | Keep it as an optional browser asset, not a server dependency. |
| Authentication model | Stateful sessions, signed hidden POST fields, token rotation and context binding | File-backed prototype login | Reuse the server-owned session concept, but redesign password storage and proxy-aware binding for production. |
| Assets and translations | Files beside the executable; WeKan JSON locale files | Existing WeKan CSS, images and locale files copied for experiments | Add a generated Pascal resource/embed step for a true single-file build. |
| Attachments | Filesystem operations and streaming | Filesystem paths with metadata in SQLite | Stream large files and never load whole attachments into memory. |

Omi and Wami are prototypes, not proof that every production requirement is
complete. In particular, plaintext prototype password files must not become the
production account store, and IP/User-Agent binding must account for trusted
reverse proxies and mobile address changes.

## Dependency equivalents

The entries below prefer dependencies already selected by Omi and Wami. Other
libraries are mentioned only where those prototypes deliberately identify a
scale-up option or where the current WeKan feature has no selected implementation.
A **custom** entry means product behaviour must be designed and tested.

### Platform, realtime and data

| Current WeKan dependency or facility | Selected Free Pascal equivalent | Compatibility and migration notes |
| --- | --- | --- |
| Meteor application platform | FCL `fphttpapp` + `HTTPDefs` + `httproute`, with explicit application services | This is Omi and Wami's small default. There is no single Meteor-equivalent Pascal package. |
| Node.js runtime | Free Pascal native executable | Removes the server JavaScript runtime. Optional browser tooling and assets remain separate. |
| Meteor methods | Routed POST forms and JSON endpoints in `httproute` | Preserve validation, authorization, error results, idempotency and audit side effects. Wami prefers immediate form submission for core operations. |
| DDP over SockJS | Custom compatibility service, or replace it with normal HTTP plus optional WebSockets | The Wami server-rendered design does not require DDP. Existing Meteor clients would require a tested DDP/SockJS bridge. |
| Publications and subscriptions | Server-rendered partial/full responses; optional mORMot 2 WebSocket PubSub | Authorization must be rechecked for every response and realtime event. A broadcast queue alone is not a reactive database observer. |
| Tracker | Server request/response state; optional browser enhancement state | Pascal server threads do not replace Tracker's browser dependency graph. The no-JS design avoids requiring that graph. |
| ReactiveVar, ReactiveDict and Session | Signed form state, server session records and ordinary Pascal records/classes | Define ownership, expiry and concurrency explicitly. Never trust hidden fields merely because the server generated them. |
| Minimongo | No client database in the minimal design | Render only visible data from SQLite. A rich offline modern client would need a separate browser store and reconciliation protocol. |
| MongoDB Meteor driver | FerretDB as a separate compatibility service, or a custom database adapter | No MongoDB driver was selected in Omi/Wami. Direct SQLite is the selected Wami path; Mongo compatibility needs its own adapter and conformance suite. |
| FerretDB v1 | Keep as a separate process when existing MongoDB documents must remain authoritative | Both being native programs does not create an in-process API. SQLite mode should not depend on FerretDB internals. |
| MongoDB collections | Wami's SQLite schema plus a repository/data-mapper layer | The current schema is exploratory and stores many values as text. Normalize types, indexes, foreign keys and JSON fields based on measured queries. |
| `aldeed:collection2` and SimpleSchema | Pascal record/class types plus custom boundary validators | Compile-time types do not validate HTTP fields, JSON, imported data or old rows. |
| `matb33:collection-hooks` | Explicit service procedures and transaction hooks | Preserve activities, rules, webhooks, attachment cleanup and denormalized fields in the same transaction where possible. |
| BSON and EJSON | `fpjson`/`jsonparser` for APIs; custom BSON/EJSON codecs only for compatibility | Object IDs, dates, binary data and special numbers need round-trip fixtures before old data can be declared compatible. |
| `check` and argument auditing | Typed parsers, length/range checks and centralized request validation | Every route must reject unknown, missing and malformed fields before authorization-sensitive work. |
| Synced Cron | Dedicated Pascal worker thread plus persistent SQLite job and lease tables | `Sleep` or an in-memory timer alone does not survive restarts or coordinate replicas. |
| High-scale server | mORMot 2; Brook is the selected alternative | Wami intentionally defers these larger dependencies until load testing justifies them. Do not assume benchmark claims apply to WeKan. |

### Templates and browser UI

| Current WeKan dependency or facility | Selected Free Pascal equivalent | Compatibility and migration notes |
| --- | --- | --- |
| Jade templates | Pascal HTML rendering helpers, as used by Omi/Wami | Pug is Jade's JavaScript successor, but it is not required by the selected server-rendered Pascal design. A template engine could be added later if helpers become unmanageable. |
| Blaze | Server-rendered HTML pages and forms | Helpers, events and lifecycle code become route handlers and view helpers. Preserve names and selectors needed by accessibility tools and tests where practical. |
| Flow Router | `httproute` server routes | Existing board, card, public and authentication URLs remain compatibility requirements. |
| Tracker reactivity | Page reloads or targeted modern-browser updates | The core path must remain functional without JavaScript. Optional realtime enhancement must not create a second authorization model. |
| jQuery and jQuery UI | No dependency for core UI; retain selected client files only where still needed | Prefer HTML controls and CSS. Every retained widget remains a browser dependency, not a Pascal library. |
| Touch Punch and dragscroll | Wami's selected `interact.js` enhancement | Use Pointer Events through the library where supported; forms and selection controls provide the non-drag fallback. |
| Multi-card drag | `interact.js` multi-touch experiment | Keep keyboard and checkbox/button alternatives so touch gestures are never the only operation path. |
| Autosize | Normal textarea plus optional small browser script | The server cannot measure rendered browser controls. |
| Hotkeys | Access keys and ordinary HTML navigation; optional browser keyboard handler | Avoid shortcuts that conflict with assistive technology or text entry. |
| Textcomplete | Full-page or form-based selection in the minimal UI; optional modern component | Mentions and emoji can work through explicit selection before a caret-aware enhancement exists. |
| FullCalendar | Server-rendered table calendar | Wami specifically prefers one table for screen-reader compatibility. Rich interaction may progressively enhance that table. |
| Font Awesome | Existing copied CSS/fonts for modern browsers; text labels for universal UI | Icons must not be the only accessible name or status indicator. |
| DOMPurify | Avoid injecting untrusted HTML; escape output in Pascal and use a strict server sanitizer for allowed markup | Omi's `HtmlEncode` pattern is the baseline. A new sanitizer requires adversarial fixtures; simple string replacement is insufficient. |
| Markdown-it and plugins | Omi's server-side Markdown subset, expanded behind a tested renderer interface | Exact compatibility, raw HTML handling and sanitization are more important than matching every plugin immediately. |
| Temml/math rendering | Retain an optional browser renderer | Basic browsers may show the source expression. Do not make math JavaScript block the rest of a card. |
| i18next and sprintf | `fpjson` locale loading and an escaped Pascal `t()` helper | Omi already consumes WeKan-style JSON locale files. Placeholder inventories and fallback rules must match English exactly. |
| JSZip | Server-side archive implementation or retained optional browser asset | No archive unit is selected yet. Any choice needs traversal, expanded-size and entry-count limits. |

### Authentication, integrations and files

| Current WeKan dependency or facility | Selected Free Pascal equivalent | Compatibility and migration notes |
| --- | --- | --- |
| Accounts Password | Omi-style server sessions and brute-force lockout, upgraded with a maintained password KDF and secure random source | Do not retain plaintext password files. Support migration from current hashes, resume-token revocation and constant-time verification. |
| Session cookies | Omi's signed hidden POST fields and rotating one-use counter; cookies may remain an optional modern mode | Omi deliberately avoids cookies. Bind tokens to the action and expiry; make IP binding configurable because mobile networks and proxies change addresses. |
| CSRF protection | Action-bound one-use form token checked on every state change | Token rotation is useful only with replay-safe server state and correct concurrent-tab behaviour. |
| OIDC, OAuth, LDAP and CAS | Custom adapters over maintained Pascal HTTP/TLS and protocol libraries; none selected by Omi/Wami yet | Treat these as prototype gates. Provider discovery, signatures, redirects, TLS and logout require integration tests before parity is claimed. |
| Sandstorm | Custom header/capability adapter | Preserve identity, sharing and lifecycle semantics; it is independent of HTML rendering. |
| Meteor Email | SMTP client selected after supported-platform testing | No mail dependency is selected yet. TLS availability on retro targets will differ from modern Linux and Windows. |
| `ostrio:files` | Omi-style filesystem storage with SQLite metadata and `TFileStream` responses | Canonicalize paths, authorize before opening, support ranges, and stream rather than buffering large files. |
| Local attachments | Filesystem beside a writable data directory | Keep executables/assets read-only and data outside the install directory where platform conventions require it. |
| AWS S3, Azure Blob and Google Cloud Storage | Storage interface plus provider adapters; no SDK selected by Omi/Wami | Do not hand-code cloud signing casually. A helper service is acceptable when a maintained Pascal SDK is unavailable. |
| Webhooks | Pascal HTTP client with explicit TLS, timeout, redirect and SSRF policy | User-configured URLs must not reach loopback, metadata services or private networks unless explicitly allowed. |
| PDFKit | Server-side PDF adapter or an external helper | No selected Pascal PDF library exists in the prototypes. Verify Unicode, fonts and pagination against fixtures. |
| ExcelJS | Spreadsheet adapter or an external helper | No selected library exists. Preserve XLSX import/export behaviour before removing the current implementation. |
| Papa Parse | FPC CSV parsing using `Classes`/`SysUtils` or a small audited parser | Cover quoting, embedded newlines, encodings, delimiters and spreadsheet formula injection. |
| Archiver and unzipper | FPC archive units selected per target, or a supervised helper | Enforce path containment, entry limits and decompression limits consistently. |
| Filesystem globbing | `FindFirst`, `FindNext`, `FindClose` and explicit matching helpers | Restrict every operation to a resolved root; do not concatenate untrusted paths. |

### Build, tests and distribution

| Current WeKan dependency or facility | Selected Free Pascal equivalent | Compatibility and migration notes |
| --- | --- | --- |
| Meteor build tool and Rspack | `fpc` build script plus an explicit asset-generation step | Omi compiles SQLite C to an object and links it into the executable. CSS/JS/images/translations need their own reproducible resource step. |
| npm dependency download | Repository-owned minimal code and pinned source archives | Wami's goal is offline compilation. Vendored code still needs provenance, checksums, licenses and security update procedures. |
| SQLite runtime | Pinned SQLite amalgamation statically linked, as in Omi | This produces no separate SQLite runtime library, but the database file remains external writable data. |
| Static web assets | FPC resources compiled into the binary, or files beside it during development | Omi currently uses adjacent files. Embedding them is additional work required for a true one-file server. |
| Mocha, Chai and Sinon | FPCUnit plus small unit executables and HTTP fixture tests | Keep existing JavaScript tests as behavioural specifications during migration. |
| Playwright | Keep Playwright for modern Chromium, Firefox and WebKit | Add HTML-level tests with JavaScript disabled and selected retro-browser smoke tests. Free Pascal does not replace browser automation. |
| Import tests | Shared fixtures run against Meteor and Pascal implementations | Round-trip existing board, user, permission, attachment and activity shapes. |
| Database conformance | Identical operation fixtures for SQLite mode, MongoDB and FerretDB adapters | Explicitly document intentional SQLite semantic differences rather than hiding them. |
| Docker and Compose | Keep for modern server deployments | The Pascal binary can make the image smaller, while Caddy and database topology remain deployment choices. |
| Snap, Flatpak and AppImage | Keep where useful | Native binaries simplify packaging but do not remove metadata, sandbox permissions, migrations or updates. |
| Retro platforms | Direct FPC builds with platform-specific feature matrices | `fphttpapp`, SQLite, TLS, threads and mORMot do not have identical capabilities on every FPC target. |
| Single executable | FPC executable + linked SQLite + compiled resources | This can contain the application and read-only assets. Writable SQLite data and attachments must remain outside it. |

## Advantages

### Scale down first

The Omi/Wami stack can run without Node.js, npm or a client JavaScript runtime.
Simple HTML, a native server and SQLite can substantially reduce startup, memory
and disk needs. This also gives old, text-mode and accessibility-oriented browsers
a useful core interface instead of an unsupported blank page.

### Broad native platform coverage

Free Pascal supports modern Linux, Windows and macOS as well as targets that are
not served by current Node.js releases. The promise must be per dependency, not
per compiler: a CPU supported by FPC may still lack compatible threads, TLS,
SQLite locking, WebSockets or mORMot optimizations.

### Progressive enhancement

Wami separates product operations from drag-and-drop gestures. Checkboxes,
buttons and form submissions create an auditable baseline; modern browsers can
add `interact.js`, richer styling and realtime updates. This benefits keyboard
navigation and provides a fallback when scripts fail or networks are unreliable.

### Native SQLite deployment

Omi demonstrates linking a pinned SQLite amalgamation into the executable. A
single database file is attractive for personal, offline and small-team WeKan
installations, backups and transfers. Streaming attachments separately avoids
inflating that file with large binary content.

## Disadvantages and risks

### The selected stack does not replace Meteor semantics

`fphttpapp` handles requests and `fpjson` parses JSON. Neither provides reactive
queries, DDP, optimistic writes, subscription teardown or accounts. The Wami
server-rendered design intentionally changes those mechanics; compatibility tests
must distinguish acceptable redesign from missing behaviour.

### Ecosystem gaps

Pascal has fewer current, widely reviewed packages for OIDC, cloud SDKs, office
documents, browser tooling and some security protocols than JavaScript, Go or
the JVM. External helper processes may be safer and cheaper than maintaining
private protocol implementations, although they weaken the one-file goal.

### Two scale targets can split the implementation

The small FCL server and the high-scale mORMot 2 server should share domain and
storage interfaces, not become two unrelated WeKans. Adding mORMot pre-emptively
would conflict with Wami's minimal/offline goal; adding it late without clean
boundaries would require another rewrite.

### SQLite changes database behaviour

MongoDB documents, arrays and update operators do not map mechanically to a wide
SQLite schema of text columns. Transactions, ordering, nullability, indexes and
concurrent writes need a deliberate relational design. Wami's schema is valuable
input, not yet a production migration guarantee.

### Retro compatibility constrains dependencies

Modern TLS, Unicode, threading and filesystem guarantees cannot be assumed on
every old target. A small offline/LAN edition may support fewer integrations than
the modern server edition. The feature matrix must say so explicitly rather than
silently weakening security to make an old platform compile.

## Effects on performance and tests

Native compilation and the small FCL stack should make server startup and pure
unit tests fast. Server-rendered pages may reduce browser JavaScript parsing and
reactive work. SQLite can be fast for a single-server workload when transactions,
indexes and journal mode suit the operating system.

Performance claims in Wami's scale notes are hypotheses until measured with
WeKan data and behaviour. WAL mode is not available or appropriate on every
retro filesystem, and one writer remains a serialization point. Benchmark board
loads, permission filtering, card moves, activities, attachments and realtime
fan-out with realistic contention.

The complete test suite still needs real browsers, imports, databases and
integrations. Add a JavaScript-disabled browser profile and HTML form tests, but
keep Playwright's three modern engines. Faster Pascal unit tests complement those
tests; they do not make them unnecessary.

## Suggested prototype

Extend Wami rather than beginning a third unrelated Pascal experiment:

1. Extract reusable HTML escaping, translation, routing, session and SQLite code
   from Omi into small reviewed Pascal units.
2. Normalize the Wami SQLite schema for users, boards, swimlanes, lists, cards,
   memberships and activities, with typed fields and required indexes.
3. Implement login with a production password KDF, secure randomness, lockout,
   revocation and Omi-style one-use action tokens.
4. Render one board using only visible cards, with keyboard-accessible forms to
   create, move and archive a card without JavaScript.
5. Add `interact.js` as progressive enhancement while keeping the same server
   authorization and form fallback.
6. Stream an attachment from a canonicalized filesystem path with range and size
   tests.
7. Run the same permission, import and browser fixtures against Meteor and Wami,
   including JavaScript-disabled and reconnect cases.
8. Load-test `fphttpapp` first. Prototype mORMot 2 behind the same interfaces only
   if measured concurrency or WebSocket requirements exceed it.
9. Build offline for modern amd64/arm64 and one retro target, documenting which
   TLS, SQLite, realtime and integration features each artifact supports.

## Recommendation

Use Omi's maintained Free Pascal server as the implementation reference and
Wami's scale-down, server-rendered design as the product reference. Start with
FCL `fphttpapp`, `httproute`, `fpjson`, statically linked SQLite, server-rendered
HTML and optional `interact.js`. Keep Caddy at the public TLS edge. Do not add
mORMot 2 or Brook until a compatible vertical slice has been measured and the
small stack is demonstrably the limit.

Treat a Free Pascal WeKan as a deliberate accessible/offline architecture, not
as a line-by-line port of Blaze and Meteor. A single executable containing the
server, SQLite engine and read-only assets is realistic; writable databases,
attachments and external identity/storage services remain outside the binary.
