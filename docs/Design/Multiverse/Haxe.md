# Rewriting WeKan in Haxe

This page evaluates Haxe as a possible implementation language for WeKan. It
is a design exploration, not a commitment to replace the current Meteor
application.

Haxe is a statically typed language that compiles to JavaScript, HashLink, JVM,
C++, PHP, Lua, Python and other targets. That makes it attractive for a project
that wants to share types and business rules between a browser client, a server
and native applications. It does not, however, provide an equivalent of the
Meteor application platform. Rewriting WeKan in Haxe therefore means replacing
Meteor's runtime services as well as translating the application code.

References:

- [Haxe](https://haxe.org/)
- [Haxe compiler targets](https://haxe.org/documentation/introduction/compiler-targets.html)
- [Haxe JavaScript target](https://haxe.org/manual/target-javascript.html)
- [Haxe C++ target](https://haxe.org/manual/target-cpp-getting-started.html)
- [Haxelib](https://lib.haxe.org/)

## Summary

Haxe could give a future WeKan strong typing, shared client/server models and a
choice of deployment runtimes. A Haxe/JavaScript version could retain Node.js
and npm compatibility. A Haxe/C++, HashLink or JVM server could eventually
remove Node.js and support a different set of CPU architectures.

Those benefits come with a very large cost. Meteor currently supplies WeKan's
publications, subscriptions, DDP over SockJS, Minimongo, optimistic method
simulation, Tracker reactivity, accounts, routing integration, build system and
package lifecycle. Haxe is a language and compiler, not a replacement for those
services. They would have to be retained through JavaScript interoperability or
implemented again.

The lowest-risk way to evaluate Haxe is to use it for a new isolated module and
compile that module to JavaScript. A complete client and server rewrite should
only follow after a prototype has demonstrated authentication, reactive board
updates, offline/reconnect behaviour and database compatibility.

## Possible approaches

| Approach | What remains | Main benefit | Main cost |
| --- | --- | --- | --- |
| Haxe module compiled to JavaScript | Meteor, Blaze, Node.js and the current database | Tests Haxe interoperation with little risk | A mixed-language codebase and only local benefits |
| Haxe browser client | Current Meteor server and DDP API | Typed UI and shared client models | Blaze, routing, reactivity and every screen must be replaced or wrapped |
| Haxe server compiled to JavaScript | Node.js and npm packages | Typed server code while retaining the Node ecosystem | Meteor server facilities still have to be replaced |
| Haxe client and Haxe/Node server | Node.js runtime and selected npm dependencies | One language and shared types on both sides | Almost the whole application is rewritten; packaging still includes Node |
| Haxe client and HashLink/C++ server | Browser plus a native Haxe server | Potentially smaller/faster server and no Node.js | Maximum porting work and fewer compatible libraries |
| Haxe client and JVM server | Browser plus a Haxe-generated JAR | Mature JVM networking, database and monitoring ecosystem | Requires a JRE and target-specific Java interoperation |

## Dependency equivalents

The entries below are candidates, not promises of drop-in compatibility. Where
the table says **custom**, Haxe has language primitives or lower-level libraries
but no equivalent that preserves WeKan's present behaviour.

### Platform, reactivity and data

| Current WeKan dependency or facility | Haxe-side candidate | Compatibility and migration notes |
| --- | --- | --- |
| Meteor application platform | No single equivalent | Compose a server framework, client framework, transport, authentication and build pipeline. This is the central rewrite cost. |
| Node.js 24 runtime | Haxe JavaScript + `hxnodejs`; or HashLink/hxcpp/JVM | JavaScript output retains Node/npm access. Native targets require replacements for every Node-specific dependency. |
| Meteor methods | `tink_web`/`tink_http` RPC or a custom typed command API | Method names, argument validation, authorization, error codes and client simulation need an explicit compatibility layer. |
| DDP over SockJS | Keep `sockjs-client` through JavaScript externs, or implement a typed WebSocket/HTTP transport | There is no Haxe equivalent of the complete DDP protocol. Reconnect, subscription state and method-result ordering require tests. |
| Publications/subscriptions | Custom observable query service | Must preserve authorization, added/changed/removed messages, subscription teardown and reactive query updates. |
| Tracker | `tink_state`, framework-specific signals, or a custom dependency graph | No candidate automatically reproduces Tracker computations, invalidation and Blaze integration. |
| ReactiveVar/ReactiveDict/Session | `tink_state` observables/signals or typed application stores | Session lifetime and persistence rules should be specified before replacing them. |
| Minimongo | Custom normalized client store; retain Minimongo through externs during transition | Query semantics, optimistic writes and server reconciliation are the difficult parts, not storage in a map. |
| MongoDB Meteor driver | Node MongoDB npm driver through externs; JVM MongoDB driver; custom/native driver | FerretDB speaks the MongoDB wire protocol, but each target needs a driver with the operators WeKan uses. |
| FerretDB v1 with SQLite | Keep FerretDB as a separate process | Haxe does not remove the database process. Direct SQLite access would require rewriting MongoDB query and update semantics. |
| `aldeed:collection2` and schemas | Haxe typedefs/classes plus generated runtime validators | Static types do not validate untrusted JSON by themselves. Generate validation for API, database and import boundaries. |
| `matb33:collection-hooks` | Explicit service/repository hooks | Prefer visible domain operations over implicit global database hooks. Preserve audit and automation side effects. |
| EJSON/BSON | Haxe serializers plus BSON/EJSON implementation or target-native driver | Dates, binary values, object IDs and special numeric values need wire-compatible encodings. |
| `check` and `audit-argument-checks` | Typed request decoders and generated validators | Authorization and validation must still happen at runtime for every external input. |

### Browser UI

| Current WeKan dependency or facility | Haxe-side candidate | Compatibility and migration notes |
| --- | --- | --- |
| Blaze | Haxe React externs, Coconut UI, HaxeUI, or a custom DOM component layer | None is source-compatible with Blaze. Helpers, events, lifecycle and reactive rerendering must be redesigned. |
| Jade templates | Haxe JSX/DSL of the selected UI framework | Templates require manual conversion; CSS selectors used by tests and integrations should remain stable. |
| Flow Router | A Haxe router library or a small typed History API router | Existing URLs, redirects, query parameters and deep links are compatibility requirements. |
| jQuery and jQuery UI | JavaScript externs during migration; native DOM/component replacements later | Wrapping retains behaviour but also retains the dependency. Replacing widgets changes focus, drag and event behaviour. |
| Touch Punch and dragscroll | Pointer Events implementation or JavaScript externs | Board and card dragging requires real-browser regression coverage on mouse and touch devices. |
| Autosize | Custom textarea measurement or an extern for the npm package | Small and suitable for an early native Haxe replacement. |
| Hotkeys | DOM keyboard-event service or an extern for `hotkeys-js` | Preserve input-field exclusions, platform modifiers and accessibility behaviour. |
| Textcomplete | Custom completion component or JavaScript externs | Mentions and emoji completion depend on caret geometry and contenteditable behaviour. |
| FullCalendar | JavaScript externs for the existing calendar or a Haxe UI replacement | Keeping the JavaScript library is considerably cheaper than recreating calendar layout. |
| Font Awesome | Keep CSS/fonts or generate typed icon identifiers | It is an asset dependency and does not require a Haxe replacement. |
| DOMPurify | Keep DOMPurify through externs | Security-sensitive sanitization should not be replaced merely to make the stack uniformly Haxe. |
| Markdown-it and plugins | JavaScript externs, or a maintained target-specific Markdown parser | Exact rendered HTML and sanitization must remain compatible with existing cards. |
| Temml/math rendering | Keep the JavaScript library through externs | Mathematical layout is browser-specific and expensive to reproduce. |
| i18next and sprintf postprocessor | Keep through externs, or generate typed accessors over WeKan locale JSON | All existing locale keys, placeholders and fallback behaviour must remain intact. |
| Client file ZIP handling (`jszip`) | Keep through externs or use target/browser compression APIs | Large archives, streaming and ZipBleed path validation require equivalent negative tests. |

### Server integrations and files

| Current WeKan dependency or facility | Haxe-side candidate | Compatibility and migration notes |
| --- | --- | --- |
| Accounts Password | Custom account service using target crypto libraries | Password hashing, resume tokens, throttling, lockout and session revocation are security-critical. |
| LDAP, CAS and OIDC packages | Target-specific LDAP/CAS/OIDC libraries behind typed adapters | Availability differs greatly between Node, JVM, C++ and HashLink targets. |
| OAuth/service configuration | Typed provider configuration plus target OAuth libraries | Existing provider settings and callback URLs must remain compatible. |
| `ostrio:files` | Custom upload/download service | Must retain authorization, storage backends, filename sanitization, range requests and migrations. |
| AWS S3 SDK and storage adapter | Node SDK through externs; JVM/AWS SDK; native HTTP implementation | Do not implement cloud signing protocols from scratch when an official target SDK exists. |
| Azure Blob SDK | Node SDK through externs; JVM/.NET SDK where applicable | Native Haxe targets may need a REST adapter and credential-signing implementation. |
| Google Cloud Storage SDK | Node SDK through externs; JVM SDK where applicable | Authentication and resumable upload behaviour need integration tests. |
| Meteor Email | Nodemailer through externs or a target SMTP library | Preserve TLS, authentication, timeouts and observable delivery failures. |
| Synced Cron | Haxe timers plus a persistent job/lease table | A timer alone is insufficient for multiple servers, restarts and exactly-once expectations. |
| PDFKit | JavaScript externs or a target PDF library | Layout parity and fonts should be compared using generated fixtures. |
| ExcelJS fork | JavaScript externs or a target spreadsheet library | Import/export compatibility matters more than using a Haxe-native implementation. |
| Papa Parse | JavaScript externs or a Haxe CSV parser | Preserve delimiter, quoting, encoding and formula-injection protections. |
| Archiver/unzipper | Target archive libraries | Retain streaming limits, traversal checks, size limits and partial-failure handling. |
| Filesystem globbing | `sys.FileSystem` plus a glob library | Only available on system targets; browser code needs a different abstraction. |

### Build, tests and distribution

| Current WeKan dependency or facility | Haxe-side candidate | Compatibility and migration notes |
| --- | --- | --- |
| Meteor build tool and Rspack | Haxe compiler plus a JS/CSS asset bundler | Haxe compiles code but does not by itself reproduce Meteor package processing, CSS handling or asset manifests. |
| Babel/SWC helpers | Usually unnecessary for Haxe-owned code | Still required for retained JavaScript/npm dependencies or a mixed build. |
| Mocha, Chai and Sinon | `utest`, Buddy or MUnit; keep JS tests during migration | Existing tests are valuable executable specifications and should not be rewritten before the behaviour they protect. |
| Playwright | Keep Playwright | Haxe does not replace real Chromium, Firefox and WebKit testing. Tests may remain JavaScript or use generated clients. |
| Puppeteer Node E2E harness | Keep temporarily, then consolidate with Playwright | Replacing the application language does not make browser automation unnecessary. |
| Docker and Compose | Keep | Runtime images may become smaller, but database and deployment orchestration remain. |
| Snap, Flatpak and AppImage | Keep existing packaging concepts | A native target changes the payload, not the need for desktop/distribution metadata and release automation. |
| Offline bundle launcher | Native Haxe entry point, or retain shell/PowerShell launchers | FerretDB lifecycle, signals, writable paths and external MongoDB configuration still need orchestration. |

## Advantages

### Stronger application types

Boards, cards, lists, permissions, activities and API messages could be modeled
once and checked at compile time. Algebraic data types are particularly useful
for roles, activity kinds, import results and state machines where an unexpected
string currently becomes a runtime branch.

Static types do not replace validation. Data from HTTP requests, databases,
imports, plugins and older WeKan versions remains untrusted and must be decoded
and validated at runtime.

### Shared client and server code

Haxe can compile common types, validation rules and pure transformations to both
browser JavaScript and the chosen server target. This could reduce duplication
in filtering, sorting, permission descriptions, serialization and API clients.

Only pure code is naturally portable. Browser DOM code, Node APIs, filesystem
operations, database drivers and concurrency require target-specific adapters.

### Choice of runtime

Haxe/JavaScript offers the easiest migration because it can interoperate with
Node and browser libraries. HashLink, C++ and JVM targets offer different
deployment and architecture options after target-specific dependencies have
been replaced. The target should be chosen deliberately; compiling the same
server to every Haxe target is not a realistic first goal.

### Dead-code elimination and generated code

The Haxe compiler can remove unused Haxe code and macros can generate repetitive
serializers, schemas and clients. This can produce a smaller, more consistent
application, provided generated output remains inspectable and tested.

## Disadvantages and risks

### It is a rewrite, not a translation

Changing JavaScript syntax to Haxe syntax is a small part of the work. The hard
part is recreating the behaviour supplied by Meteor and the accumulated WeKan
packages. A successful rewrite must preserve existing URLs, database documents,
REST APIs, permissions, imports, exports, automation rules and realtime update
semantics.

### Smaller web ecosystem

Haxe has a capable community, but fewer maintained web/backend libraries and
fewer contributors than JavaScript/TypeScript, Go or the JVM. JavaScript externs
can bridge that gap on the JS target, but every extern retained reduces the
portability benefit. Native targets may require new bindings or implementations.

### Target abstractions leak

Networking, threads, strings, native libraries and filesystem behaviour differ
between targets. Conditional compilation and target-specific syntax are useful,
but too much of either turns one shared codebase into several implementations
hidden in the same files.

### Debugging becomes layered

A browser failure may involve Haxe source, generated JavaScript, source maps, a
JavaScript framework and the browser. Native failures add generated C++ or a VM
runtime. Maintainers need tooling and documentation for both the source and the
generated target.

### Contributor and migration cost

Most current WeKan contributors and dependency maintainers work in JavaScript.
A Haxe rewrite raises the entry cost and temporarily requires knowledge of both
systems. Running old and new implementations in parallel also multiplies tests,
release paths and security maintenance.

### A native build does not automatically become one process

FerretDB remains a database service unless its internals are integrated behind
a new storage API. Cloud storage, LDAP, OIDC, email and conversion tools still
bring external protocols and sometimes external programs. Haxe/C++ can produce
a native executable, but it does not automatically fold the whole deployed
system into that executable.

## Effects on performance and tests

A native Haxe server could start faster and use less memory than the current
Meteor server. Pure Haxe unit tests may also compile and run quickly. That does
not guarantee a faster complete test run: most of WeKan's wall-clock test time
is spent starting real browsers, navigating pages, waiting for reactive UI
state, exercising the database and checking Chromium, Firefox and WebKit.

During migration, the existing tests should be treated as the compatibility
contract. Add the new implementation behind the same REST/DDP-level fixtures,
run both implementations against the same cases, and retain the three-browser
suite. Rewriting tests and implementation simultaneously would make behavioural
regressions difficult to distinguish from changed expectations.

## Suggested prototype

Before considering a rewrite, build one vertical slice in a separate prototype:

1. Compile shared `Board`, `List`, `Card`, role and command types to JavaScript.
2. Implement login with a resumable session and explicit lockout behaviour.
3. Publish one board and update it reactively over SockJS or WebSocket.
4. Maintain a normalized client cache with reconnect and conflict handling.
5. Create, move and archive a card with the same authorization rules as WeKan.
6. Read and write the existing MongoDB/FerretDB document shapes without a data
   migration.
7. Run the existing positive, negative and Playwright tests for that slice.
8. Measure executable size, startup, memory, request latency and build time on
   amd64, arm64 and at least one architecture that motivates the rewrite.

The prototype succeeds only if it demonstrates the platform behaviour, not
merely a Haxe page that can display a board-shaped JSON document.

## Recommendation

Do not begin with a complete rewrite. Start with typed, pure modules compiled to
JavaScript and keep Meteor at the boundary. This tests Haxe's contributor
experience, source maps, npm interoperability and build integration without
forking the product.

If the objective is only stronger typing, incremental TypeScript in the current
application has much lower migration risk. If the objective is a portable
native server, compare a Haxe prototype with a Go prototype using the same
vertical slice and tests. If the objective is one-file distribution, finish the
AppImage or use a self-extracting launcher; changing the implementation language
is not required for that outcome.
