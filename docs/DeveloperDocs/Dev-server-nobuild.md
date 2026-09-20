# Dev server nobuild

Choose **Dev server nobuild** immediately below **Dev server** in `build.sh` or
`build.bat`. Both menus use the same host, port, warning and URL prompts.

The source loader reads application JavaScript from the checkout (`models/`,
`server/`, `client/`, `imports/`, etc.). Imports are transformed in memory;
Blaze/Jade templates and styles are served from source. It neither copies the
application into `.build/bundle` nor uses `.meteor/local/build` or `_build`.
Installed Meteor packages are linked in memory and local packages are read from
`packages/`. Meteor package transformations use a persistent Babel cache at
`.tools/dev-source/<app-port>/package-cache/`, avoiding repeated compilation
and uncached-compilation stack traces. Application imports remain in memory.
This is a development runtime, not a production deployment format.

Install this checkout's dependencies and Meteor release using the build menu
first. The launcher finds the matching installed Meteor toolchain under
`METEOR_WAREHOUSE_DIR`, `~/.meteor`, Windows `%LOCALAPPDATA%\.meteor`, or the
repository's `.tools/.meteor`. It uses that toolchain's Node and MongoDB.

```sh
node scripts/dev-source/start.cjs --port 3000
```

Meteor's own development database launcher starts its bundled MongoDB on the
next port: app `3000` / database `3001`, or app `4000` / database `4001`.
The database and small runtime metadata files persist under
`.tools/dev-source/<app-port>/`. Inherited external `MONGO_URL` and
`MONGO_OPLOG_URL` values are replaced. The menu's explicit `27019` variant starts
the bundled development MongoDB on `27019`, using the `wekan` database.

`ROOT_URL` supports a different hostname and a URL path. Source changes restart
the development process; refresh the browser after it becomes ready. Set
`WEKAN_SOURCE_WATCH=0` when another process controls restarts. Ctrl-C stops the
source process and its development database. An occupied database port is an
error; the loader does not take over another database.

The visualizer option reports loaded module sizes at
`<ROOT_URL>/__source/visualizer`. These are source-module sizes after in-memory
transformation, rather than sizes from a release bundle.

Both development menus default to `DEBUG=false` to avoid verbose i18next
initialization output. Set `DEBUG=true` before starting the menu when debugging
is needed (`DEBUG=true ./build.sh`, or `set DEBUG=true` before `build.bat`).
The warning and trace-warning menu options still control Node warnings.

An unresolved attachment-path warning means database metadata refers to a file
the repair step could not locate. Check the affected records and backups before
removing anything. Browser tests now remove their attachment metadata during
board teardown, including deliberately missing image fixtures. They must not
leave false missing-file warnings in the development database.

## Tests

Choose **Tests → EVERYTHING source one by one**, or run:

```sh
WEKAN_TEST_SERVER_MODE=source WEKAN_TEST_BAIL=1 WEKAN_PLAYWRIGHT_PROBE=0 \
  ./build.sh --run-everything sequential
```

This uses source-loaded Node on `localhost:3000` and bundled MongoDB on `3001`.
Server-side Mocha runs in the source process first; a fresh source process then
serves the E2E and Chromium, Firefox and WebKit tests. Plain Node and import
regressions do not require a browser. Database conformance and FerretDB's own
stages remain part of EVERYTHING. Stop-on-first-failure allows a failure to be
fixed before continuing to the next test.

Run the existing server suite directly with:

```sh
WEKAN_TEST_BAIL=1 node scripts/dev-source/start.cjs --port 3000 --server-tests
```

`MOCHA_GREP` can focus a server regression. A focused pass does not replace the
full run. This mode uses the installed `meteortesting:mocha-core` Mocha version
and the existing `server/lib/tests/index.js` entrypoint.

The loader uses private Meteor linking APIs from the pinned release. A Meteor
upgrade therefore needs loader and browser verification too. Windows menu
wiring can be checked on other operating systems, but native Windows runtime
verification requires Windows.

## Startup diagnostics verification (2026-09-20)

Six focused Node suites pass for CAS URLs, source loading, build-menu options
and attachment-fixture cleanup. Three affected browser cases pass sequentially
in each of Chromium, Firefox and WebKit (nine passes). After teardown, the
development database has no unresolved attachment versions. A live source
server with deprecation tracing serves ordinary requests without Babel cache
or `url.parse()` warnings and rejects duplicate CAS tickets with HTTP 400.
An external CAS identity provider and native Windows execution were not tested.

## Verification on Linux arm64 (2026-09-20)

The sequential run stopped for fixes and resumed; these totals combine completed
runs and focused reruns, rather than one uninterrupted run. Tests used source
Node on port 3000 and Meteor's development MongoDB on port 3001.

| Test group | Result |
| --- | --- |
| Chromium | 446 distinct cases passed |
| Firefox | 445 distinct cases passed |
| WebKit | 445 distinct cases passed |
| Node regression suites | 1,182 suites passed |
| Meteor server tests | 527 tests passed |
| Import regressions | 10 tests passed |
| FerretDB | Unit, vet and sequential SQLite integration stages passed |
| Database conformance | All 103 cases agree on SQLite, PostgreSQL, MySQL and MariaDB |

Firefox and WebKit exclude only the raw-touch regression that requires
Chromium's CDP API. The browser totals include a separate deployment under the
`/wekan` URL prefix. Portable drag and organization/team toggle checks run in
all three browsers in sequential mode. SAP HANA was not run on this platform.

Runtime checks also verified app/database ports 4000/4001, the explicit 27019
option, refusal to take over an occupied database port, source-change restarts,
shutdown releasing both ports, and the source visualizer. Inherited external
database settings were overridden with the bundled development database.

One Firefox title-edit failure did not reproduce in a focused diagnostic or
five repetitions; its cause remains unconfirmed. Fail-fast runs now retain the
first failure trace. Native Windows execution remains unverified; menu and
launcher wiring have regression coverage.
