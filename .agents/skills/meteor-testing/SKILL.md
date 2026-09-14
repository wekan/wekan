---
name: meteor-testing
description: >
  Use when setting up, designing, writing, or repairing tests and test
  harnesses in a Meteor 3 app. Triggers on
  meteortesting:mocha, --driver-package, TEST_WATCH, TEST_BROWSER_DRIVER,
  MOCHA_GREP, meteor.testModule, focused tests, .only,
  Meteor.server.method_handlers, Meteor.server.publish_handlers,
  DDP.connect, --full-app integration mode, sinon, async test signatures,
  Playwright/Cypress E2E. Use this skill when the user asks about test
  runners, asks about testing publications, or asks about Jest vs Mocha
  in Meteor. For a failing, hanging, or flaky test whose failing layer or root
  cause is unknown, use meteor-debugging before changing the test or app.
metadata:
  author: meteor
  kind: knowledge
  meteor: ">=3.0"
  area: testing
  tagline: "Set up and write Meteor 3 tests (`meteortesting:mocha`, async signatures, methods/publications, Playwright/Cypress E2E)."
  bundle: ["fullstack"]
  docs_synced_at: "2026-09-11"
license: MIT
---

# Testing Meteor 3 apps

`meteortesting:mocha` is the canonical Meteor test driver. It boots the
app in test mode (no app code runs except the test files) and reports
results in the server console.

If an existing test fails, hangs, or flakes and the failing layer is unknown,
use `meteor-debugging` to isolate the cause. Return here when evidence points to
test setup, design, driver behavior, fixtures, or regression coverage.

## Decision flow

1. Unknown failure in an existing test? Use `meteor-debugging` to classify
   application, data, harness, browser, environment, or shared-state causes.
2. Pure logic, no Meteor APIs? Plain Mocha or any test runner; nothing
   Meteor-specific.
3. Method or publication? Integration test it with `meteortesting:mocha`
   using `Meteor.server.method_handlers[name].apply(ctx, args)` or
   `publish_handlers`.
4. Need to drive a real DDP client (cross-process or end-to-end DDP
   semantics)? Use `--full-app` mode and `DDP.connect`.
5. UI flow / browser interaction? Start the normal app with deterministic
   test settings and run Playwright or Cypress against it. Use
   `meteor test --full-app` only when the browser flow must load app-test
   modules.

## Setup

```bash
meteor add meteortesting:mocha
meteor npm install --save-dev @types/mocha
```

```json
// package.json
{
  "scripts": {
    "test": "TEST_WATCH=1 meteor test --driver-package meteortesting:mocha",
    "test:ci": "meteor test --once --driver-package meteortesting:mocha",
    "test:full": "meteor test --full-app --driver-package meteortesting:mocha"
  }
}
```

Test-mode conventions:

- Normal test mode eagerly loads `*.test[s].*` and `*.spec[s].*` files, while
  ordinary application code loads only when imported by a test.
- Filename discovery ignores `tests/` directories. A configured
  `meteor.testModule` instead loads its explicit entry module and imports.
- `--full-app` eagerly loads the normal app plus `*.app-test[s].*` and
  `*.app-spec[s].*` files, and sets `Meteor.isAppTest`.

For Meteor 3.5.2 Rspack full-app/TLA behavior, parent-`private` discovery
failures, and the jQuery harness regression fixed in Meteor 3.6-beta.0, read
[release-specific test setup](references/meteor-3.5.2-testing.md). Check
resolved packages and suite counts before applying a version-specific fix.

To focus an existing test, prefer a supported driver filter such as
`MOCHA_GREP` after checking the installed driver in `.meteor/versions`; use
`.only` only temporarily. These select registered tests but do not prevent
other test modules from evaluating. If loading itself causes interference,
inspect `meteor.testModule` and read `references/focused-runs.md` before
narrowing entrypoint imports. Restore every temporary focus or import change,
then run the normal affected suite. Read the configured entrypoint paths from
the project; do not invent paths, scripts, ports, or helpers.

## Method test (server-side)

```javascript
import assert from "node:assert/strict";
import { Meteor } from "meteor/meteor";
import { Items } from "/imports/api/items";

if (Meteor.isServer) {
  describe("items.add", function () {
    beforeEach(async function () {
      await Items.removeAsync({});
    });

    it("inserts when authed", async function () {
      const _id = await Meteor.server.method_handlers["items.add"].apply(
        { userId: "u1" },
        [{ title: "x", qty: 1 }],
      );
      const doc = await Items.findOneAsync(_id);
      assert.equal(doc.title, "x");
    });

    it("rejects when unauthed", async function () {
      await assert.rejects(() =>
        Meteor.server.method_handlers["items.add"].apply({ userId: null }, [{}]),
      );
    });
  });
}
```

`.apply(context, argsArray)` is the documented form;
`Meteor.server.method_handlers[name]` is the registered method
implementation. Pass a stub `this` with `userId` (and `unblock`,
`connection`, etc. when needed).

## Publication test (server-side)

```javascript
if (Meteor.isServer) {
  describe("items.mine publication", function () {
    it("only ships the subscribing user's items", async function () {
      await Items.removeAsync({});
      await Items.insertAsync({ _id: "a", ownerId: "u1" });
      await Items.insertAsync({ _id: "b", ownerId: "u2" });

      const cursor = await Meteor.server.publish_handlers["items.mine"]
        .apply({ userId: "u1" }, []);
      const docs = await cursor.fetchAsync();
      assert.deepEqual(docs.map((d) => d._id), ["a"]);
    });
  });
}
```

For publications using the low-level `this.added` / `this.changed` API,
test with a real DDP client via `--full-app` mode (next section).

Always await the direct publish handler. Conventional handlers return the
cursor immediately; async handlers return a Promise of the cursor.

## End-to-end DDP test (`--full-app` mode)

```javascript
import { DDP } from "meteor/ddp-client";
import { Mongo } from "meteor/mongo";
import { Tracker } from "meteor/tracker";

const conn = DDP.connect(Meteor.absoluteUrl());
const RemoteItems = new Mongo.Collection("items", { connection: conn });

function ready(sub) {
  return new Promise((resolve) => {
    const computation = Tracker.autorun((c) => {
      if (sub.ready()) {
        c.stop();
        resolve();
      }
    });
  });
}

const sub = conn.subscribe("items.mine");
await ready(sub);
const docs = RemoteItems.find().fetch();
```

Run with `meteor test --full-app --driver-package meteortesting:mocha`.

## Client unit test (Minimongo)

```javascript
if (Meteor.isClient) {
  describe("Items minimongo", function () {
    beforeEach(function () { Items.remove({}); });

    it("filters by ownerId", function () {
      Items.insert({ _id: "a", ownerId: "u1" });
      Items.insert({ _id: "b", ownerId: "u2" });
      assert.equal(Items.find({ ownerId: "u1" }).count(), 1);
    });
  });
}
```

Client tests run in the browser the driver spawns. With
`TEST_BROWSER_DRIVER=puppeteer`, the browser is headless Chromium and
results flow back to the server console.

Do not treat a server-only green run as complete client coverage. The driver
prints a message when no browser is connected; configure
`TEST_BROWSER_DRIVER` in CI and confirm client test counts are present.

## Browser E2E

Run Playwright or Cypress against the normal application unless the test
needs Meteor's app-test modules. The server command must work from a clean
clone with a tracked, nonsecret settings fixture or fully documented test
environment variables. Do not point it at an ignored developer settings file.

Cover at least one complete mutation flow and one rejected server action.
Basic page-title checks do not exercise async method stubs, authorization, or
publication readiness.

## Anti-patterns

- Reach for Jest. Jest does not understand Meteor's build system. Use
  `meteortesting:mocha`.
- Mock Mongo. Run the real driver against a clean DB.
- Forget `if (Meteor.isServer) { ... }` guards. Server tests crash if
  they run in the browser harness.
- Skip `beforeEach` cleanup. Tests leak state across runs.
- Catch and log a `beforeEach` failure without rethrowing. The test then runs
  against unknown state and can report a misleading assertion.
- Assert only the database postcondition for a rejected method. Also require
  the Promise to reject with the expected `Meteor.Error`.
- Replace `Meteor.userId` or another global without restoring it in
  `afterEach`.
- Use `Meteor.call` with callbacks in async test code. Use
  `Meteor.callAsync` or unwrap `method_handlers` directly.

## See also

- `references/mocha-setup.md`
- `references/focused-runs.md`
- `references/ddp-test-helpers.md`
- `references/eval-cases.md`
