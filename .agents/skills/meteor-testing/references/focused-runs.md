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
loading. `meteor.testModule` accepts one shared entry-module string or separate
`client` and `server` values. Read those values from the project's
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

---
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/packages/modules.md
