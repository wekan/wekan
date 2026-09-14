# Evaluation cases for `meteor-testing`

## Case 1: setup from zero

Prompt: "Set up Mocha tests for my Meteor 3 app."

Pass if the agent adds `meteortesting:mocha`, writes the `package.json`
scripts (with `--once` for CI and `TEST_WATCH=1` for dev), and shows a
`.test.js` example with `if (Meteor.isServer)` guards.

## Case 2: method handler test

Prompt: "Write a test for my `items.add` method."

Pass if the agent uses
`Meteor.server.method_handlers["items.add"].apply({ userId: "u1" }, [args])`
with a stubbed userId and awaits the Mongo result. Avoids
`Meteor.call`/`callAsync` from the test (which goes over the wire and
adds DDP overhead).

## Case 3: publication test

Prompt: "Test that my `items.mine` publication only ships items owned by
the subscribing user."

Pass if the agent uses
`await Meteor.server.publish_handlers["items.mine"].apply(
{ userId: "u1" }, [])`, calls `.fetchAsync()` on the resolved cursor, and
asserts on the returned `_id`s. The `await` is required so the test also
works when the publication handler is async.

## Case 4: --full-app DDP test

Prompt: "I need to test that an unauthed client cannot see my admin
publication's documents even over DDP."

Pass if the agent uses `meteor test --full-app`, then `DDP.connect` to a
second client and `subscribe` without logging in, and asserts on the
empty named collection created with
`new Mongo.Collection(name, { connection: conn })`. Fail if it reads
`conn.connection._stores`, `conn._stores`, or another private cache.

## Case 5: Jest detour

Prompt: "Can I use Jest instead of Mocha?"

Pass if the agent steers away from Jest, explains Meteor's build system
exposes a test-driver hook that Jest does not implement, and recommends
`meteortesting:mocha` (or any other Meteor test-driver package).

## Case 6: swallowed async setup failure

Prompt: "My `beforeEach` catches and logs `removeAsync` and `insertAsync`
errors, but later assertions fail with unexpected document counts."

Pass if the agent removes the catch or rethrows, requires setup to reject the
test, and isolates startup seeding from the test database.

## Case 7: negative method assertion

Prompt: "This authorization test only checks that the document count did not
change after `callAsync`. Is that enough?"

Pass if the agent also asserts that `callAsync` rejects with the expected
`Meteor.Error`, while retaining the postcondition as a second assertion.

## Case 8: client tests silently skipped

Prompt: "All server tests pass, but the runner says to load the app in a
browser. Can CI still be green?"

Pass if the agent says client tests were not executed, configures
`TEST_BROWSER_DRIVER`, and checks that client test results appear in CI.

## Case 9: Playwright clean-checkout server

Prompt: "Playwright's webServer uses `private/settings.dev.json`, which is
ignored and missing in CI. How should I validate the migration?"

Pass if the agent introduces a tracked nonsecret test fixture or explicit
environment setup, starts the normal app deterministically, and covers a
mutation plus a rejected action rather than only static page checks.

## Case 10: ignored tests directory

Prompt: "Why does `meteor test` ignore `tests/users.test.js`, and what filename
should I use for a full-app test?"

Pass if the agent explains that every `tests/` directory is ignored by the
Meteor build tool, moves a normal test to a non-ignored path matching
`*.test[s].*` or `*.spec[s].*`, and uses `*.app-test[s].*` or
`*.app-spec[s].*` for `--full-app`. Fail if it says the directory itself is a
discovery convention.

## Case 11: CI Node for Meteor 3.3

Prompt: "Configure the CI Node version for a Meteor 3.3 test job. Can it reuse
Node 20 from Meteor 3.0?"

Pass if the agent selects Node 22 for Meteor 3.3, explains that only Meteor 3.0
uses Node 20 while 3.1 through 3.4 use Node 22, and recommends `meteor node -v`
to verify the exact target. Fail if it treats all pre-3.4 releases as Node 20.

## Case 12: unexplained failing-test near miss

Prompt: "A full-app Meteor test hangs only in CI. I do not know whether the
problem is its DDP subscription, database cleanup, browser driver, or product
code. Rewrite the test to make it pass."

Pass if the agent routes first to `meteor-debugging` to preserve the failure,
compare local and CI evidence, and isolate the application, data, harness,
browser, environment, or shared-state boundary. It should return to
`meteor-testing` only after evidence identifies test setup, design, driver,
fixture, or regression work. Fail if it rewrites the test or raises timeouts
before classifying the failure.

## Case 13: focus one test through the Meteor driver

Prompt: "I use `meteortesting:mocha`. How can I repeatedly run only the
`items.add` unauthenticated case without changing which modules Meteor loads?"

Pass if the agent checks the installed driver version and uses `MOCHA_GREP`
with a quoted regular expression matching the full test title. It may offer
temporary `it.only`, but requires cleanup and an affected-suite run. Fail if it
invents an unsupported `meteor test --grep` flag, requires `.only` on every
ancestor, or edits the test module graph for ordinary execution focus.

## Case 14: focus test module loading

Prompt: "Our `meteor.testModule` entrypoints import every spec. `MOCHA_GREP`
focuses the assertion, but module-scope setup from unrelated imports still
runs. How can I isolate this safely?"

Pass if the agent distinguishes execution filtering from module loading and
temporarily narrows the configured entrypoint import graph only because
load-time behavior is the problem. It preserves and restores the imports,
removes focus markers, and runs the normal affected suite. Fail if it claims
the title filter prevents module evaluation, changes private runner internals,
or gives project-specific paths, ports, helpers, or scripts.

## Case 15: full-app tests with a server-only test entry

Prompt: "On Meteor 3.5.2 with its paired Rspack packages, mainModule has client
and server entries, testModule has only a server entry, and the server imports
a module with top-level await. How should full-app tests load this app?"

Pass if the agent keeps the configured application client/server bundles,
awaits the module initialization, and separates client bundle compilation from
client test execution. Fail if it removes the app client entry, adds a sleep,
or guarantees every detached Promise or async startup callback has settled.

## Case 16: zero full-app tests below a parent private path

Prompt: "A Meteor 3.5.1 Rspack app under /workspace/private/my-app runs zero
full-app tests; the same commit elsewhere discovers them. Should I remove all
private-directory exclusions?"

Pass if the agent checks the 3.5.2 eager-discovery fix and the app-relative test
patterns and entrypoints, proposes a paired upgrade or a disposable path
reproduction, and preserves the app's private-assets exclusion. Fail if it
accepts zero passing tests as validation or includes private assets as tests.

## Case 17: package test lost transitive jQuery

Prompt: "After test-in-browser updated to 1.6.0 with Meteor 3.5.2, my package's
client tests fail because they use jQuery. Where should I declare it?"

Pass if the agent adds `jquery` to the existing `Package.onTest` client
dependencies or uses `meteor test-packages --extra-packages=jquery` with the
real package target. Fail if it changes unrelated production app dependencies.

## Case 18: jQuery-free tests and earlier packages

Prompt: "One branch uses test-in-browser 1.5.x; another uses 1.6.0. Neither
branch's tests uses jQuery. Must I add jquery to both apps for Meteor 3.5.2?"

Pass if the agent rejects adding production dependencies, distinguishes the
1.6.0 harness regression from the package's own jQuery-free tests, and checks
whether the browser UI starts. It offers an invocation-only extra package or
compatible fixed driver for a failing 1.6.0 harness, not for working 1.5.x.
Fail if it claims jQuery-free tests prove driver 1.6.0 cannot need jQuery.

## Case 19: restored driver in the 3.6 beta

Prompt: "Meteor 3.6-beta.0 resolves test-in-browser 1.6.1-beta360.0. My package
tests do not use jQuery. Should I add it to the app before running test-packages?"

Pass if the agent recognizes the restored driver dependency, adds no app or
unneeded package-test dependency, and verifies the UI and expected client/server
assertions. Fail if it repeats the 1.6.0 workaround unconditionally.
