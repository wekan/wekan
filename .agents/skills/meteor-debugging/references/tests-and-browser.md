# Tests and browser

Read this reference for an existing Meteor test that fails, hangs, or flakes,
or a browser flow that needs trace, console, network, or DOM evidence. Use
`meteor-testing` to create the test setup or design new coverage.

## Separate execution from module loading

Meteor tests have two independent focus layers:

| Layer | Controls | Typical mechanism |
|---|---|---|
| Test execution | Which registered suites and tests run | Driver title filter or Mocha `.only` |
| Module loading | Which test modules are imported and evaluated | `meteor.testModule` and its entry-module imports, or Meteor's filename discovery |

Inspect `package.json` for `meteor.testModule` before choosing a focus method.
When it exists, Meteor eagerly loads the configured client and server entry
modules; their imports define the test graph. Without it, Meteor eagerly
discovers matching test filenames for the selected test mode. See
[Meteor test entry modules](https://github.com/meteor/meteor/blob/devel/v3-docs/docs/packages/modules.md).

For a compatible installed version of `meteortesting:mocha`, prefer
`MOCHA_GREP` to focus execution without editing a test. Its value is a regular
expression matched against the full Mocha title:

```bash
MOCHA_GREP='items\.add.*rejects unauthenticated' \
  meteor test --once --driver-package meteortesting:mocha
```

Check `.meteor/versions` before relying on driver-specific options. Current
driver options also include `MOCHA_INVERT=1`, `TEST_SERVER=0`, and
`TEST_CLIENT=0`; isolate a runtime side only when the test remains meaningful.
See the
[`meteortesting:mocha` run options](https://github.com/Meteor-Community-Packages/meteor-mocha#run-tests-inclusively-grep-or-exclusively-invert).

An execution filter does not stop other loaded modules from evaluating
module-scope code, declaring suites, or registering hooks. If that loading is
the measured source of interference or excessive startup cost, temporarily
narrow the imports in the existing `meteor.testModule` entrypoint. Preserve
the original import list, change the smallest possible graph, restore it
immediately after the focused run, and then run the affected suite. Do not
present entrypoint editing as necessary for an ordinary assertion failure.

## Focus the failure

1. Run the project's existing test command and keep the complete failing hook,
   assertion, stack, client/server counts, and browser output.
2. Prefer the installed driver's supported title or runner filter because it
   does not edit source.
3. With Mocha, use `describe.only` or `it.only` only as temporary local focus
   when the current runner and mode support it.
4. Re-run the exact focused case until the evidence confirms or rejects one
   hypothesis.
5. Remove the focus marker and run the affected or full suite.

Mocha still runs hooks for selected suites. Exclusive tests are incompatible
with Mocha parallel mode. Do not invent a rule that every ancestor suite also
needs `.only`; use the semantics of the resolved Mocha version. See
[Mocha exclusive tests](https://mochajs.org/declaring/exclusive-tests/) and
[Mocha `--forbid-only`](https://mochajs.org/running/cli/#--forbid-only).

Before handoff, scan source for common focus markers:

```bash
rg -n '\b(describe|it|test)\.only\b|\b(fdescribe|fit)\b' \
  --glob '!node_modules/**' --glob '!.meteor/**'
```

Use `--forbid-only` only when the actual test command forwards that Mocha flag.
Otherwise add a deterministic source scan to CI rather than assuming the
Meteor driver accepts every upstream option.

Also restore any temporarily narrowed `meteor.testModule` entrypoint imports.
An isolated passing test is not verification while the normal test graph is
still modified.

## Passes alone, fails together

An isolated pass narrows the failure; it does not fix it. Compare:

- database and Minimongo cleanup;
- `before`, `beforeEach`, `afterEach`, and `after` failures;
- replaced globals, fake timers, stubs, subscriptions, DDP connections, and
  server jobs that were not restored or stopped;
- order dependence and shared fixture IDs;
- serial versus parallel execution and worker count.

Find the first test or hook that changes the later case's precondition. Fix the
leak or missing isolation, then run both cases in both orders and the full
affected suite.

## Wait for a condition

Wait for the behavior being asserted, not a guessed delay:

| Boundary | Readiness condition |
|---|---|
| Subscription | `sub.ready()` observed reactively with a diagnostic timeout |
| Method | Returned Promise settles with the expected result or error |
| Mongo or Minimongo | Expected document or count becomes observable |
| Browser | Web-first assertion on the stable user-visible result |

A fixed delay is valid only when elapsed time is the contract, such as debounce
or long-press behavior. Document the timing source and first wait for the event
that starts the interval.

## Existing Playwright tests

Read the report and trace before editing. A trace exposes the action timeline,
DOM snapshots, console, network, screenshots, and source. Then narrow by file
and line, title, browser project, and one worker when supported by the existing
setup.

```bash
npx playwright test tests/items.spec.ts:42 --project=chromium --workers=1
npx playwright test tests/items.spec.ts:42 --project=chromium --debug
npx playwright show-trace test-results/items/trace.zip
```

See [Playwright debugging](https://playwright.dev/docs/debug),
[Trace Viewer](https://playwright.dev/docs/trace-viewer), and the
[test CLI](https://playwright.dev/docs/test-cli).

Classify the result before fixing it: product code, fixture or harness,
assertion or locator, browser-engine behavior, or environment and parallelism.
Do not hide the distinction with a sleep, broader selector, skip, or retry.

## Optional `playwright-cli`

Use `playwright-cli` for an ad hoc browser reproduction only when it is already
available or the user authorizes installation and browser downloads. Prefer a
local or staging Meteor URL.

Use only the application path or URL in the task scope. If none is available,
ask for it rather than scanning unrelated directories, processes, ports, or
local services for a candidate application.

```bash
playwright-cli -s=meteor-debug open http://localhost:3000 --headed
playwright-cli -s=meteor-debug snapshot
playwright-cli -s=meteor-debug console
playwright-cli -s=meteor-debug requests
playwright-cli -s=meteor-debug tracing-start
playwright-cli -s=meteor-debug tracing-stop
playwright-cli -s=meteor-debug close
```

The CLI can collect browser evidence; it is not a server debugger or a default
Meteor dependency. Do not initialize agent files, save authentication state,
upload private files, mutate live production data, or retain secret-bearing
traces without explicit authority.

Do not use `networkidle` as Meteor application readiness. Playwright
[discourages it for tests](https://playwright.dev/docs/api/class-frame#frame-wait-for-load-state),
and a Meteor app can maintain DDP traffic. Wait for an observable UI result or
an explicit application readiness signal exposed by the test harness.

---
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/tutorials/testing/testing.md
