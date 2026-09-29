# Focused Meteor test runs

Use two separate controls. Do not confuse test execution with module loading.

| Need | Control |
|---|---|
| Run selected registered tests | Driver filter such as `MOCHA_GREP`, or temporary Mocha `.only` |
| Prevent unrelated test modules from evaluating | `meteor.testModule` entrypoints and their import graph |

## Focus test execution

For an installed `meteortesting:mocha` version that supports it, set
`MOCHA_GREP` to a regular expression matching the full Mocha title:

```bash
MOCHA_GREP='items\.add.*rejects unauthenticated' \
  meteor test --once --driver-package meteortesting:mocha
```

Use `MOCHA_INVERT=1` to exclude matching titles. Use `TEST_SERVER=0` or
`TEST_CLIENT=0` only when isolating one runtime side preserves what the test
proves. Inspect `.meteor/versions` and the
[`meteortesting:mocha` run options](https://github.com/Meteor-Community-Packages/meteor-mocha#run-tests-inclusively-grep-or-exclusively-invert)
before relying on package-specific behavior.

`describe.only` and `it.only` are temporary source-local alternatives. They do
not require `.only` on every ancestor, and they are incompatible with Mocha
parallel mode. Remove every focus marker before handoff and run the affected
suite. See [Mocha exclusive tests](https://mochajs.org/declaring/exclusive-tests/).

## Control the loaded test graph

Configure explicit entry modules when the project needs deterministic test
loading. `meteor.testModule` accepts one shared entry-module string or a runtime
map, usually `client` and `server`. Read those values from the project's
`package.json`; do not invent an entrypoint path. Each entry module imports the
tests for its runtime.

With `meteor.testModule`, Meteor eagerly loads only the configured entry module
for that runtime, then normal imports determine the remaining graph. Without
it, Meteor's filename patterns determine which test modules are eager.

`MOCHA_GREP` and `.only` filter registered test execution. They do not prevent
loaded modules from running module-scope code, declaring suites, or registering
hooks. Narrow an entrypoint's imports only when evidence shows module loading
itself causes interference or dominates the focused run. Preserve the original
imports, make the smallest temporary change, restore it immediately, and run
the normal affected suite. Never commit a narrowed test graph or a focus marker.

## Rspack architecture and ignore boundaries

Meteor 3.6-beta.3 with `rspack@1.4.0-beta360.3` and
`@meteorjs/rspack@3.0.0-beta.3` supports separate `testModule.legacy` and
exact `web.browser`, `web.browser.legacy`, `web.cordova` entries. Preserve the
matching app entries in `--full-app` mode. Enable legacy development/test
programs with `modern.webArchOnly: false` and do not exclude that architecture.
Use `meteor-modern-build-stack` for graph/config details.

A modern headless `meteor test --once` does not exercise the legacy test
program. Select it explicitly and check test names/counts for both programs.
A user-agent override tests delivery, not an old JS engine. Beta.0/beta.1
and older Rspack integrations lack this complete flow; retain their supported
test graph or select a compatible paired upgrade.

For beta.3 eager Rspack test selection, `.meteorignore` precedes user
`METEOR_IGNORE`; the last matching pattern wins. Keep parent directories
included before a file exception:

```bash
METEOR_IGNORE='**/*.tests.* !imports/accounts/*.tests.*' \
  meteor test --once --driver-package meteortesting:mocha
```

This selects files, not test titles. `MOCHA_GREP` remains a separate control.
Generated Rspack exclusions are separate and scoped to the app root: a root
`test/` data directory must not hide `_build/test/`. User rules can still
incorrectly hide the handoff. Do not copy internal `METEOR_IGNORE_*` variables
into CI or ignore the active build context. For older integrations, use a
verified explicit entry/import graph when eager discovery is broken. Reject
zero tests when cases were expected, even if the process exits successfully.

---
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/packages/modules.md
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/cli/environment-variables.md
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/about/modern-build-stack/rspack-bundler-integration.md
