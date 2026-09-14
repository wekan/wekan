# Blaze build, HMR, and template tests

Use this reference for the generated Blaze entry graph, Blaze-specific Rspack
behavior, hot template replacement, and client template tests. Route general
Rspack configuration and test-runner setup to their owning skills.

## Generated app baseline

Create from the target Meteor release rather than copying a historical tree:

```bash
meteor create --blaze my-app
```

For the current Meteor 3.4+ skeleton, verify these relationships before
customizing them:

| File | Blaze-specific invariant |
|------|--------------------------|
| `package.json` | `meteor.mainModule.client` reaches every UI module; `meteor.modern` is enabled |
| `client/main.js` | Imports the root `.html` or a UI JavaScript module that imports it |
| `.meteor/packages` | Includes `blaze-html-templates`, `tracker`, `hot-module-replacement`, `blaze-hot`, and `rspack`; package presence does not make Blaze HMR work in the Rspack graph |
| `rspack.config.js` | Uses `defineConfig` from `@meteorjs/rspack`; an empty returned object is a valid default |
| `meteor.testModule` | Points at the explicit test entry when the project uses one |

Every UI registration module should pull its template into the client graph:

```javascript
import { Template } from "meteor/templating";
import "./profile-card.html";

Template.profileCard.helpers({
  displayName() {
    return this.profile.displayName;
  },
});
```

If `Template.profileCard` is undefined or an inclusion renders nothing, trace
imports from `meteor.mainModule.client`. Do not add eager imports to unrelated
server or shared modules.

The generated Rspack config can remain small:

```javascript
const { defineConfig } = require("@meteorjs/rspack");

module.exports = defineConfig(() => ({}));
```

Use `meteor-modern-build-stack` for `Meteor.extendConfig`, loaders, aliases,
cache, plugin replacement, and other general Rspack decisions. Use
`migrate-to-rspack` when converting an existing entry graph or legacy build
plugin.

## Refresh behavior by bundler

| Client module owner | Blaze edit behavior |
|---|---|
| Meteor bundler with `hot-module-replacement` and `blaze-hot` | Replaces affected templates without a page reload. |
| Rspack, available from Meteor 3.4 | Rebuilds quickly, then performs a full live reload. Blaze HMR is not currently supported and page-local state resets. |

Do not diagnose package presence alone. Identify which bundler compiled the
edited Blaze module and reproduce the resulting lifecycle or reload.

## Meteor-bundler Blaze HMR ownership

`hot-module-replacement` provides Meteor's module update channel. `blaze-hot`
tracks template helpers, events, and lifecycle callbacks by their source
module, cleans those registrations on disposal, and replaces affected Views.
It is a debug-only package and is not part of the production runtime. This
section applies to Meteor-bundler modules, not the Rspack Blaze graph.

Keep a template registration module side-effect-only when practical:

```javascript
import { Template } from "meteor/templating";
import "./task-row.html";

Template.taskRow.helpers({
  label() {
    return this.task.title;
  },
});
```

Move exported business logic into a separate module and import it here.
`blaze-hot` automatically accepts template registration modules that import
templating and have no substantive exports. Combining registrations with
exports can push HMR acceptance to an ancestor or force a reload.

Template replacement removes the old View and renders a new one. Therefore:

- Expect `onDestroyed` for the old instance and `onCreated` for the new one.
- Do not depend on template-instance state surviving a replacement.
- Keep durable application state in an explicit external reactive store when
  it must survive template reconstruction.
- Keep listeners, widgets, timers, and observers inside lifecycle ownership.
  `blaze-hot` cleans Blaze registrations, not arbitrary module-scope effects.
- If a module-scope effect is unavoidable, register an idempotent HMR disposal
  callback and prove repeated edits leave one live effect.

Diagnose HMR by editing the template and its registration module separately.
Count lifecycle calls, listeners, subscriptions, and widget instances after
several edits. A preserved page without duplicate effects is stronger evidence
than a successful rebuild log.

Implementation evidence:

- [Meteor build-tool HMR note](https://github.com/meteor/meteor/blob/devel/v3-docs/docs/about/build-tool.md#hot-module-replacement-hmr)
- [`blaze-hot/hot.js`](https://github.com/meteor/blaze/blob/master/packages/blaze-hot/hot.js)
- [`blaze-hot/update-templates.js`](https://github.com/meteor/blaze/blob/master/packages/blaze-hot/update-templates.js)
- [templating HMR code generation](https://github.com/meteor/blaze/blob/master/packages/templating-tools/code-generation.js)

## Programmatic client test

Use the Meteor test driver selected by `meteor-testing`. Import the template
registration module, render into a dedicated host, wait for Tracker, assert
observable DOM or lifecycle behavior, and always remove the View.

```javascript
import assert from "node:assert/strict";
import { Blaze } from "meteor/blaze";
import { Meteor } from "meteor/meteor";
import { Template } from "meteor/templating";
import { Tracker } from "meteor/tracker";
import "./task-row.js";

if (Meteor.isClient) {
  describe("taskRow", function () {
    let host;
    let view;

    beforeEach(function () {
      host = document.createElement("div");
      document.body.appendChild(host);
    });

    afterEach(function () {
      if (view) Blaze.remove(view);
      host.remove();
      view = null;
    });

    it("renders its named task argument", async function () {
      view = Blaze.renderWithData(
        Template.taskRow,
        { task: { _id: "t1", title: "Ship" } },
        host,
      );

      await new Promise((resolve) => Tracker.afterFlush(resolve));
      assert.equal(host.querySelector(".js-title").textContent, "Ship");
    });
  });
}
```

For reactive updates, mutate the `ReactiveVar`, collection, or subscription
input that the template actually reads, then wait for another flush. Do not
reach into private View fields to force rendering. Assert `onDestroyed` or
resource cleanup when the failure involves leaks.

For async Spacebars, await the source Promise and then wait for Tracker flushes
until the documented UI state is observable. Keep pending, rejected, and
resolved assertions separate.

Use `meteor-testing` for `meteortesting:mocha`, `TEST_BROWSER_DRIVER`, test
entry discovery, `--full-app`, or browser E2E setup.

---
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/tutorials/blaze/1.creating-the-app.md
