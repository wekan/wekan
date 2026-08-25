# Rewriting WeKan in Go

This page evaluates Go as a possible implementation language for the WeKan
server. It is a design exploration, not a commitment to replace the current
Meteor application or its browser client.

Go is especially attractive for a small native server executable, fast startup,
straightforward cross-compilation and direct use of FerretDB's implementation
language. It does not provide an equivalent of the Meteor application platform.
A Go rewrite would therefore replace Meteor's accounts, methods, publications,
subscriptions, DDP, reactivity and build lifecycle rather than merely translate
JavaScript syntax.

References:

- [Go](https://go.dev/)
- [Go standard library](https://pkg.go.dev/std)
- [`embed` package](https://pkg.go.dev/embed)
- [MongoDB Go Driver](https://www.mongodb.com/docs/drivers/go/current/)
- [FerretDB](https://github.com/FerretDB/FerretDB)

## Summary

Go could make the server a native executable containing its templates, static
assets and migrations. Its standard library covers HTTP, TLS, JSON, templates,
archives, CSV, logging and testing. Maintained packages cover MongoDB, realtime
WebSockets, authentication protocols, cloud storage and observability.

The browser remains a separate execution environment. A Go executable can embed
JavaScript, CSS, images and compiled templates, but the browser still downloads
and runs those files. Go does not replace Blaze, Tracker, Minimongo, drag-and-drop
widgets or Playwright merely by embedding their assets. Go compiled to WebAssembly
is possible, but it is generally a poor first replacement for a large DOM-heavy
JavaScript client because of payload size, runtime interoperability and ecosystem
costs.

The lowest-risk design is a Go server that first preserves WeKan's document
formats and externally visible APIs while the existing browser client remains in
place. Replacing the client can then be evaluated independently.

## Possible approaches

| Approach | What remains | Main benefit | Main cost |
| --- | --- | --- | --- |
| Isolated Go service | Meteor server, browser client and database | Tests Go operations and deployment with little migration risk | Adds a service and does not simplify the main process |
| Go HTTP/API server beside Meteor | Blaze client and selected Meteor realtime services | Moves bounded server workloads gradually | Two servers, two authorization paths and temporary duplication |
| Go server with DDP compatibility | Existing Blaze, Tracker and Minimongo client | Replaces Node/Meteor without rewriting every screen at once | Implementing compatible DDP, publications and method semantics is difficult |
| Go server with a new web API | Existing client only where adapted to the new API | Simpler protocol and explicit service boundaries | Realtime cache, optimistic updates and much client code must change |
| Go server and new JavaScript/TypeScript client | Database documents and public compatibility contracts | Conventional, well-supported web architecture | A nearly complete application rewrite |
| Go server and Go WebAssembly client | Primarily Go source on both sides | Shared types and selected business logic | Large browser migration with weaker DOM tooling and no direct Blaze replacement |
| Go code integrated into the FerretDB binary | One server process can own app and database lifecycles | Potential single-file, single-process distribution | Tight coupling to FerretDB internals, security boundaries and upgrade cadence |

## Dependency equivalents

These are candidates, not drop-in replacements. Standard-library choices are
preferred where they are sufficient. A row marked **custom** represents product
behaviour that must be designed and tested, not a missing package name that can
be solved by selecting another framework.

### Platform, realtime and data

| Current WeKan dependency or facility | Go candidate | Compatibility and migration notes |
| --- | --- | --- |
| Meteor application platform | No single equivalent; compose `net/http`, services and explicit adapters | Meteor combines many facilities that Go deliberately leaves separate. |
| Node.js runtime | Compiled Go executable | Removes the server-side Node runtime, but retained browser tooling may still use Node during builds. |
| Meteor methods | Typed `net/http` or RPC handlers | Preserve names, validation, authorization, error codes, idempotency and any client simulation relied upon by the UI. |
| DDP over SockJS | Custom DDP/SockJS compatibility layer, or a new protocol over [`coder/websocket`](https://github.com/coder/websocket) | A WebSocket library supplies transport, not DDP method, subscription, reconnect or ordering semantics. SockJS can be retained if old-browser/fallback compatibility is required. |
| Publications and subscriptions | Custom authorized query and change-stream service | It must emit correct added, changed and removed state and stop observing promptly when access is revoked. |
| Tracker | No server-side equivalent | Go channels coordinate server goroutines; they do not replace Tracker's browser dependency graph. Retain Tracker or choose a client state system. |
| ReactiveVar, ReactiveDict and Session | Client-side signals/store; custom protocol state | These are browser facilities. Go server state has different ownership and lifetime rules. |
| Minimongo | Retain Minimongo initially or build a normalized browser store | A Go map is not an equivalent. Query matching, optimistic updates, rollback and server reconciliation are the important behaviours. |
| MongoDB Meteor driver | [`go.mongodb.org/mongo-driver/v2`](https://pkg.go.dev/go.mongodb.org/mongo-driver/v2) | Use the official MongoDB Go Driver and test every operator against both MongoDB and the supported FerretDB version. |
| FerretDB v1 with SQLite | Keep FerretDB as a process, supervise it, or design a stable in-process boundary | Direct SQLite access would require reproducing MongoDB query, update and index semantics. Importing internal FerretDB packages would create upgrade coupling. |
| `aldeed:collection2` and SimpleSchema | Go structs, explicit decoders and [`validator/v10`](https://github.com/go-playground/validator) where useful | Struct types do not validate untrusted JSON, old database documents or imports automatically. |
| `matb33:collection-hooks` | Explicit domain services and repository hooks | Visible operations are easier to reason about than global implicit hooks; all audit and automation side effects must remain. |
| BSON and EJSON | MongoDB driver's `bson` packages plus an explicit EJSON codec | Preserve object IDs, dates, binary values and special numeric representations at API boundaries. |
| `check` and `audit-argument-checks` | Typed request decoding, size limits and validation at every boundary | Static typing begins only after bytes have been decoded successfully. |
| Mongo observers | Change streams where supported, polling or application-owned event publication | Choose semantics that work with both supported MongoDB and FerretDB configurations. |
| Synced Cron | [`robfig/cron/v3`](https://github.com/robfig/cron) plus persistent leases/jobs | A cron parser alone does not provide multi-server exclusion, retry history or restart recovery. |

### Templates and browser UI

| Current WeKan dependency or facility | Go candidate | Compatibility and migration notes |
| --- | --- | --- |
| Jade templates | **Pug** is Jade's direct successor; Go-native choices are [`html/template`](https://pkg.go.dev/html/template) or [`templ`](https://github.com/a-h/templ) | Pug remains a JavaScript template compiler, not a Go package. Existing Jade can be converted to Pug and compiled during the asset build, while a move to `html/template` or templ requires rewriting templates. |
| Blaze | Retain the compiled browser client; or replace it with server-rendered templ/`html/template` plus HTMX, or a JavaScript framework | Server rendering can simplify some screens but does not reproduce Blaze lifecycle, helpers and fine-grained reactivity automatically. |
| Flow Router | Server routes with Go 1.22+ `http.ServeMux` or [`chi`](https://github.com/go-chi/chi); browser routes remain client-side | Existing URLs, redirects, query parameters and deep links are compatibility requirements. |
| jQuery and jQuery UI | Retain as browser assets or replace with browser-native components | They have no meaningful server-side Go equivalent. Widget replacement changes focus, keyboard, drag and event behaviour. |
| Touch Punch and dragscroll | Pointer Events and a maintained client drag-and-drop implementation | Requires real-browser mouse, touch and accessibility coverage. |
| Autosize | Retain the package or implement with browser DOM APIs | Go cannot measure a browser textarea from the server. |
| Hotkeys | Retain `hotkeys-js` or use browser keyboard events | Preserve platform modifiers, editable-field exclusions and accessibility. |
| Textcomplete | Retain or replace with a client completion component | Mentions and emoji depend on caret and contenteditable behaviour. |
| FullCalendar | Retain the browser library or replace it on the client | It is independent of the server implementation language. |
| Font Awesome | Keep CSS, fonts and generated assets | It is an asset dependency, not a Go runtime dependency. |
| DOMPurify | Keep DOMPurify in the browser; optionally add [`bluemonday`](https://github.com/microcosm-cc/bluemonday) on the server | Server sanitization is useful defence in depth but is not automatically equivalent to DOM-aware client sanitization. |
| Markdown-it and plugins | Keep client rendering; or use [`goldmark`](https://github.com/yuin/goldmark) on the server | Choose one canonical rendering path and test HTML compatibility and sanitization. |
| Temml/math rendering | Keep Temml or KaTeX in the browser | Mathematical layout remains browser work even when source text is rendered on the server. |
| i18next and sprintf postprocessor | Keep for the browser; [`go-i18n/v2`](https://github.com/nicksnyder/go-i18n) for server messages | Existing locale JSON, fallback rules and placeholders must remain intact. Avoid maintaining divergent translations for client and server. |
| Client ZIP handling with JSZip | Keep JSZip for local browser archives; `archive/zip` for server archives | Server and browser ZIP paths need the same traversal, size and decompression-limit protections. |
| Rspack and CSS processing | Keep a frontend asset build, or use prebuilt assets with `go:embed` | `go build` embeds outputs but does not compile arbitrary JavaScript, Pug, Stylus or CSS by itself. |

### Authentication, integrations and files

| Current WeKan dependency or facility | Go candidate | Compatibility and migration notes |
| --- | --- | --- |
| Accounts Password | Custom account service using `golang.org/x/crypto`, `crypto/rand`, `net/http` cookies and persistent sessions | Preserve password-hash migration, resume tokens, throttling, lockout, session revocation and constant-time comparisons. |
| OIDC | [`coreos/go-oidc/v3`](https://github.com/coreos/go-oidc) with `golang.org/x/oauth2` | Validate issuer, audience, nonce, state, signatures and callback configuration. |
| LDAP | [`go-ldap/ldap/v3`](https://github.com/go-ldap/ldap) behind an authentication adapter | Test TLS modes, referrals, filters, group mapping, timeouts and connection recovery. |
| CAS | A small tested CAS protocol adapter or a maintained CAS client | Package adoption alone is not enough; verify the exact CAS versions and logout behaviour WeKan supports. |
| Sandstorm integration | Custom HTTP/header/capability adapter | Preserve Sandstorm identity, permissions, sharing and lifecycle conventions. |
| OAuth/service configuration | `golang.org/x/oauth2` plus provider-specific adapters | Existing callback URLs, scopes, token refresh and stored settings must remain compatible. |
| `ostrio:files` | Custom upload/download service using `net/http`, `io` and storage interfaces | Retain authorization, range requests, metadata, filename safety, quotas and migrations. |
| AWS S3 | [AWS SDK for Go v2](https://github.com/aws/aws-sdk-go-v2) | Use the official signer and credential chain rather than implementing signing manually. |
| Azure Blob Storage | [Azure SDK for Go `azblob`](https://pkg.go.dev/github.com/Azure/azure-sdk-for-go/sdk/storage/azblob) | Test emulator, cloud and credential variants used by deployments. |
| Google Cloud Storage | [`cloud.google.com/go/storage`](https://pkg.go.dev/cloud.google.com/go/storage) | Preserve resumable uploads, metadata and service-account/application-default credentials. |
| Meteor Email | A maintained SMTP package such as [`wneessen/go-mail`](https://github.com/wneessen/go-mail), or provider APIs | Preserve TLS, authentication, timeouts, templates and visible delivery errors. |
| Webhooks and outbound HTTP | `net/http.Client` with explicit timeouts, redirects and SSRF controls | Never use the default unbounded client for user-configured destinations. |
| PDFKit | A maintained Go PDF library, or retain a PDFKit helper process for exact parity | Compare fonts, pagination, links and Unicode output using fixtures before switching. |
| ExcelJS fork | [`excelize/v2`](https://github.com/qax-os/excelize) | Test imports and exports against existing WeKan files, formulas, dates and large workbooks. |
| Papa Parse | `encoding/csv` | Preserve delimiter detection, quoting, encodings and spreadsheet formula-injection defences. |
| Archiver and unzipper | `archive/zip`, `archive/tar`, `compress/gzip` and `io` | Enforce path containment, entry count, expanded-size and compression-ratio limits. |
| HTML-to-Markdown | [`html-to-markdown/v2`](https://github.com/JohannesKaufmann/html-to-markdown) or explicit conversion rules | Fixture-test WeKan's supported HTML rather than assuming generic conversion is identical. |
| Limax slugs | [`gosimple/slug`](https://github.com/gosimple/slug) or a small compatibility implementation | Existing generated URLs may depend on transliteration details, so avoid silently changing old slugs. |
| Filesize and duration formatting | Small project-owned formatting helpers | Translation, rounding and unit conventions are product decisions. |
| Filesystem globbing | `path/filepath.Glob`, `path.Match` and `io/fs` | Validate roots before matching when patterns can be influenced by configuration. |

### Operations, tests and distribution

| Current WeKan dependency or facility | Go candidate | Compatibility and migration notes |
| --- | --- | --- |
| Meteor build tool | `go build`, `go generate`, frontend asset build and `go:embed` | Generated assets must be reproducible and versioned independently of Go compilation. |
| Meteor settings and environment variables | `os`, `flag` and an explicit typed configuration struct | Validate once at startup and retain existing environment names during migration. |
| Meteor logging | [`log/slog`](https://pkg.go.dev/log/slog) | Define stable fields, redaction and request correlation rather than leaking credentials or tokens. |
| Rate limiting | [`golang.org/x/time/rate`](https://pkg.go.dev/golang.org/x/time/rate) plus shared state where necessary | In-memory limiters do not coordinate multiple replicas. |
| Prometheus metrics | [`prometheus/client_golang`](https://github.com/prometheus/client_golang) | Keep metric cardinality bounded and avoid board, user or card IDs as labels. |
| Tracing | [OpenTelemetry Go](https://github.com/open-telemetry/opentelemetry-go) | Propagate context across HTTP, database, storage and job boundaries. |
| Mocha, Chai and Sinon | `testing`, `httptest`, fuzz tests and optional [`testify`](https://github.com/stretchr/testify) | Keep existing JavaScript tests as behavioural specifications while porting, then move tests with their implementation. |
| Playwright | Keep Playwright | Go does not replace Chromium, Firefox and WebKit. Browser tests can target a Go server without being rewritten. |
| Database conformance tests | Go integration tests run against MongoDB and FerretDB | Share fixtures so both backends receive identical operations and assertions. |
| Docker and Compose | Keep | A smaller server image does not remove database, proxy and orchestration needs. |
| Snap, Flatpak and AppImage | Keep where useful | A native executable simplifies the payload, but desktop metadata, sandbox permissions and update delivery remain. |
| Offline bundle launcher | Go supervisor using `os/exec`, signals and explicit writable directories | If FerretDB remains separate, the launcher can still present one user-facing command while supervising two processes. |
| Single executable | `go:embed` for web assets, templates and migrations | Embedded files run in the browser or are read by Go; embedding JavaScript does not make it execute as Go. External databases and tools remain separate unless deliberately integrated. |

## Advantages

### Native server and straightforward distribution

Go commonly produces one native executable with no language runtime to install.
`go:embed` can include the compiled browser bundle, locale files, templates and
migrations. Cross-compilation and startup are generally simpler than packaging a
Meteor server with Node.js.

This does not mean the complete deployment becomes one process. FerretDB, an
external MongoDB, SMTP, object storage, identity providers and browsers remain
separate systems. A launcher may package or supervise some of them without
merging their implementations.

### Strong server-side types and concurrency

Go structs and interfaces can make request, permission, storage and integration
boundaries explicit. Goroutines and contexts are well suited to concurrent HTTP,
uploads and background jobs when cancellation and resource limits are designed
from the beginning.

Types do not replace runtime validation or authorization. Every request, database
document, imported file and integration response remains untrusted input.

### Fast build and test loop for server code

Pure Go unit tests and HTTP handler tests can be fast, deterministic and easy to
run without a browser. Fuzzing is built into the Go toolchain and is useful for
imports, archive paths, parsers and API decoders.

The complete WeKan test suite would not become proportionally faster. Browser
startup, UI synchronization, database integration and three-engine Playwright
coverage remain. A rewrite may shorten server startup and server unit tests but
cannot remove the tests that verify browser behaviour.

### Mature infrastructure ecosystem

Go has widely used libraries and official SDKs for databases, cloud storage,
identity, metrics and tracing. Its standard HTTP interfaces also make it possible
to replace routers and middleware without designing the whole application around
one framework.

## Disadvantages and risks

### Meteor behaviour must be recreated

The largest work item is not HTTP routing. It is publication authorization,
reactive queries, DDP ordering, reconnect, optimistic writes, method simulation,
accounts and the coupling between Tracker, Minimongo and Blaze. A basic REST and
WebSocket demo would not prove behavioural compatibility.

### Go does not solve the browser rewrite

Most user interaction still needs HTML, CSS and browser JavaScript. Server-side
templates plus HTMX may suit administration and simpler screens, but board drag
and drop, live editing, offline state, calendar views and accessibility need a
carefully chosen client architecture.

### Shared client/server code becomes harder

Unlike TypeScript or Haxe-to-JavaScript, ordinary Go server code cannot be imported
directly into the current browser application. Schemas and API clients can be
generated from an interface definition, and pure code can sometimes target Go
WebAssembly, but these add a generation or runtime boundary.

### A FerretDB merge creates tight coupling

Because both components would use Go, it is technically possible to build WeKan
and FerretDB into one binary. Language compatibility is not an architectural API.
Depending on FerretDB internal packages could make database upgrades, security
fixes and upstream synchronization harder. It would also combine application and
database privileges, resource limits and failure modes.

A safer one-command package embeds WeKan's web assets in its own Go server and
starts a versioned FerretDB child process, or connects to an external database.
An in-process design should proceed only through an intentionally stable FerretDB
library boundary with independent conformance and lifecycle tests.

### Migration doubles systems temporarily

For a meaningful period, maintainers would debug Meteor and Go implementations,
keep authorization rules aligned and run compatibility suites against both.
Replacing tests at the same time as their implementation would remove the best
evidence that behaviour has been preserved.

## Suggested prototype

Build one vertical slice before selecting a full rewrite:

1. Serve the existing compiled browser assets from `embed.FS`.
2. Read one board using the official MongoDB Go Driver against both MongoDB and
   FerretDB.
3. Implement login, resumable sessions, lockout and revocation for prototype
   users without weakening the current password migration path.
4. Implement one authorized board subscription, including access revocation,
   reconnect and added/changed/removed messages.
5. Create, move and archive a card while preserving existing document shapes,
   permission checks, activities and hooks.
6. Run the existing positive, negative, import and Playwright tests for that
   slice against both servers.
7. Fuzz request decoding, import parsing and archive extraction.
8. Measure executable and embedded-asset size, cold start, memory, request
   latency, realtime fan-out and build/test duration on supported CPUs.

The prototype succeeds only if it preserves a real slice of WeKan behaviour. A
Go endpoint that returns board-shaped JSON is not enough.

## Recommendation

Do not start by rewriting the browser or merging WeKan into FerretDB. Prototype a
standalone Go server boundary and keep the current client and database documents
as compatibility constraints. This directly tests whether Go improves startup,
packaging, memory use and server development without making every architectural
decision at once.

For Jade specifically, convert it to Pug only if preserving the current template
pipeline is valuable. Choose `html/template` or templ when intentionally moving
rendering to Go; neither is a mechanical rename. For one-file distribution, a Go
server with `go:embed` is a strong option, but an AppImage or self-extracting
launcher can already package the current application without requiring a rewrite.
