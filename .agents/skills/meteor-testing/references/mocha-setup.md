# `meteortesting:mocha` setup

## Install

```bash
meteor add meteortesting:mocha
meteor npm install --save-dev @types/mocha
```

## Assertion imports

A string `meteor.testModule`, such as `"tests/main.js"`, supplies a shared
entry that can be bundled for both client and server. Static imports resolve
before `if (Meteor.isServer)` runs. With the scaffold's `meteor-node-stubs`,
`node:assert/strict` can fail the Rspack browser build with
`Cannot find module 'assert/strict' for matched aliased key 'assert'`.

Use the scaffold's portable import and explicit strict methods:

```javascript
import assert from "assert";

assert.strictEqual(actual, expected);
assert.deepStrictEqual(actualItems, expectedItems);
await assert.rejects(() => rejectedOperation());
```

Changing the import alone would make `equal` and `deepEqual` coercive. Keep
strict assertions when porting an example from `node:assert/strict`.
Do not add a fictitious `assert/strict` package or disable client tests.
`node:assert/strict` remains valid in a genuinely server-only entry graph;
verify the actual `meteor.testModule` mapping and imports before changing it.

Build and execute the selected client and server suites, including the
configured full-app mode when used. A passing server suite alone does not
verify browser bundling. Evidence: [generated scaffold test](https://github.com/meteor/meteor/blob/4c94e92457c06cb73082a8d59908257bf6b518d1/tools/static-assets/skel-blaze/tests/main.js)
and [browser stub map](https://github.com/meteor/meteor/blob/4c94e92457c06cb73082a8d59908257bf6b518d1/npm-packages/meteor-node-stubs/map.json).

## Env vars

| Var                    | Purpose                                                              |
|------------------------|----------------------------------------------------------------------|
| `TEST_WATCH=1`         | Re-run on file change. Use in dev.                                   |
| `TEST_BROWSER_DRIVER`  | Run client tests in a headless browser. `puppeteer`, `playwright`.   |
| `TEST_SERVER=0`        | Skip server tests.                                                   |
| `TEST_CLIENT=0`        | Skip client tests.                                                   |
| `MOCHA_GREP`           | Run titles matching a regular expression.                           |
| `MOCHA_INVERT=1`       | Exclude titles matching `MOCHA_GREP`.                               |
| `MONGO_URL`            | External Mongo for tests (e.g. `mongodb://localhost:27017/test`).    |

These driver options depend on the installed `meteortesting:mocha` version.
Inspect `.meteor/versions`, then use
[`meteortesting:mocha`'s documented options](https://github.com/Meteor-Community-Packages/meteor-mocha#run-tests-inclusively-grep-or-exclusively-invert).

## Scripts

```json
{
  "scripts": {
    "test": "TEST_WATCH=1 meteor test --driver-package meteortesting:mocha",
    "test:once": "meteor test --once --driver-package meteortesting:mocha",
    "test:ci": "TEST_BROWSER_DRIVER=puppeteer meteor test --once --driver-package meteortesting:mocha",
    "test:full": "meteor test --full-app --driver-package meteortesting:mocha"
  }
}
```

`--once`: exit after the first run (CI). Without it, the runner stays
alive and re-runs on file change.

`--full-app`: runs the whole app plus tests. Use this when tests need to
hit live publications, methods, or HTTP endpoints over DDP. Server and
client tests both run; you can `DDP.connect(Meteor.absoluteUrl())` from a
test file.

## GitHub Actions example

```yaml
name: test

on: [pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      mongo:
        image: mongo:7
        ports: ["27017:27017"]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }

      - name: Install Meteor
        run: curl https://install.meteor.com/ | sh

      - run: meteor npm ci

      - name: Run tests
        run: |
          TEST_BROWSER_DRIVER=puppeteer MONGO_URL=mongodb://localhost:27017/test \
          meteor test --once --driver-package meteortesting:mocha
```

Node version must match the bundled Node.js for the Meteor version: 3.0 uses
Node 20, 3.1 through 3.4 use Node 22, 3.5.x uses Node 24, and 3.6.x uses
Node 26. The example above targets
3.1-3.4; adjust its Node selection for the actual job. Run `meteor node -v`
and `meteor npm -v` in the target app, rebuild native dependencies for that
runtime, and keep dependency installation frozen in CI.

## Test discovery

- Normal test mode: `*.test[s].*` and `*.spec[s].*` outside ignored
  `tests/` directories.
- Full-app mode: `*.app-test[s].*` and `*.app-spec[s].*` outside ignored
  `tests/` directories.
- Every `tests/` directory is ignored by Meteor's build tool. Reserve it for
  an external test runner.

Server-only modules stay server-only when imported from tests. Client
tests run in a browser instance the driver spawns.

For focused execution and the separate `meteor.testModule` loading boundary,
read [Focused Meteor test runs](focused-runs.md).

---
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/tutorials/testing/testing.md
