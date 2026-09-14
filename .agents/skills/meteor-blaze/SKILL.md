---
name: meteor-blaze
description: >
  Use when building or debugging Blaze interfaces in Meteor 3: meteor create
  --blaze, Spacebars templates, Template helpers and events, lifecycle hooks,
  Tracker, ReactiveVar or ReactiveDict, template subscriptions, Promise
  helpers, #let async states, Template.dynamic, Blaze.render, and blaze-hot
  HMR with the Meteor bundler. Triggers on stale async helper results, lost
  reactivity after await, data-context lookup surprises, duplicate DOM
  integrations after HMR, Rspack full reloads, or raw
  HTML in triple braces. Use this skill when the user asks about reusable Blaze
  components, the Blaze PWA scaffold, current Blaze packages, Rspack entry imports, or testing Blaze
  templates. For Meteor 2 to 3 upgrades, use migrate-to-meteor-3 instead.
metadata:
  author: meteor
  kind: knowledge
  meteor: ">=3.0"
  area: data
  tagline: "Build and debug Meteor 3 Blaze interfaces (Spacebars, Tracker state, async helpers, lifecycle, bundler-specific HMR, and components)."
  bundle: ["blaze"]
  docs_synced_at: "2026-09-11"
license: MIT
---

# Blaze interfaces for Meteor 3

Blaze compiles Spacebars templates into JavaScript and updates small View
regions when their reactive dependencies invalidate. Keep state, subscriptions,
DOM effects, and async work owned by a template instance. Use public
`Template`, `Blaze`, `Spacebars`, and Tracker APIs in application code.

## Decision flow

1. For a new app, run `meteor create --blaze <name>`. Inspect the generated
   `package.json`, `.meteor/packages`, client entry, and `rspack.config.js`
   before changing packages or build settings.
2. Import each template's `.html` from the JavaScript module that registers its
   helpers, events, and lifecycle hooks. Import that module from the client
   entry graph.
3. Keep synchronous Minimongo reads in ordinary helpers. If a helper returns a
   Promise, render explicit pending, rejected, and resolved states.
4. Put `ReactiveVar`, `ReactiveDict`, `this.autorun`, and `this.subscribe` on
   the template instance. Put DOM initialization in `onRendered` and undo
   external effects in `onDestroyed`.
5. Pass named data and callbacks into reusable child templates. Keep
   publication and mutation authority on the server.
6. Identify the bundler before diagnosing refresh behavior. `blaze-hot` can
   replace templates in the Meteor-bundler graph; Rspack currently performs a
   full live reload for Blaze. Route general build, migration, database, or
   test-runner work to the owning skill.

## Current scaffold

```bash
meteor create --blaze my-app
cd my-app
meteor
```

Meteor 3.4+ creates Blaze apps with Rspack by default. Earlier Meteor 3
releases may use the Meteor bundler. The current scaffold declares explicit
client and server `meteor.mainModule` entries, imports `.html` from the client
entry, enables the modern build stack, and includes `blaze-html-templates`,
`tracker`, `reactive-var`, `hot-module-replacement`, `blaze-hot`, and `rspack`.
Treat the generated files for the selected Meteor release as the baseline.
Those packages do not enable Blaze HMR in the Rspack graph. Blaze edits there
trigger a fast full page reload and reset page-local state. `blaze-hot`
replacement behavior applies when the Meteor bundler owns the module.

Do not infer the installed Blaze runtime from the release name alone. Inspect
`.meteor/versions`, then use the
[Blaze history](https://github.com/meteor/blaze/blob/master/HISTORY.md) for
feature floors and compatibility changes.

Meteor 3.6-beta.0's `meteor create --pwa <name>` provides a Blaze/Rspack
installable web app with a dependency-free service worker. It does not supply
offline Meteor data or native binaries. Read
[PWA boundaries](references/pwa-scaffold.md) before changing caching or scope.

## Component scaffold

```html
<template name="taskList">
  <label>
    <input type="checkbox" class="js-show-done">
    Show completed
  </label>

  {{#if Template.subscriptionsReady}}
    {{#each task in tasks}}
      {{> taskRow task=task}}
    {{else}}
      <p>No tasks.</p>
    {{/each}}
  {{else}}
    <p>Loading...</p>
  {{/if}}
</template>
```

```javascript
import { Template } from "meteor/templating";
import { ReactiveVar } from "meteor/reactive-var";
import { Tasks } from "/imports/api/tasks";
import "./task-list.html";

Template.taskList.onCreated(function () {
  this.showDone = new ReactiveVar(false);
  this.autorun(() => {
    this.subscribe("tasks.list", { showDone: this.showDone.get() });
  });
});

Template.taskList.helpers({
  tasks() {
    const showDone = Template.instance().showDone.get();
    return Tasks.find(showDone ? {} : { done: false }, {
      sort: { createdAt: -1 },
    });
  },
});

Template.taskList.events({
  "change .js-show-done"(event, instance) {
    instance.showDone.set(event.currentTarget.checked);
  },
});
```

`this.autorun` and `this.subscribe` stop when the instance is destroyed. A
cursor returned from a synchronous helper remains live through Minimongo.
Authorization and field projection still belong in the publication.

## Async helpers

Use `#let` when loading, rejection, and empty results must be distinct:

```html
{{#let profile=loadProfile}}
  {{#if @pending "profile"}}<p>Loading...</p>{{/if}}
  {{#if @rejected "profile"}}<p>Could not load profile.</p>{{/if}}
  {{#if @resolved "profile"}}
    {{> profileCard profile=profile}}
  {{/if}}
{{/let}}
```

Spacebars stores the latest resolved value, not necessarily the result of the
latest Promise. If reactive input can launch overlapping requests, use an
abort signal, generation token, or serialized queue. Do not assume `#let`
orders results. See `references/spacebars-and-async.md`.

## Lifecycle ownership

| Resource | Create | Destroy |
|----------|--------|---------|
| `ReactiveVar` or `ReactiveDict` | `onCreated` | No manual disposal |
| Reactive work | `this.autorun` | Automatic with the instance |
| Subscription | `this.subscribe` | Automatic with the instance |
| DOM widget | `onRendered`, often after `Tracker.afterFlush` | Widget-specific teardown in `onDestroyed` |
| Window, document, timer, observer | Lifecycle callback | Explicit remove, clear, disconnect, or stop in `onDestroyed` |
| Programmatic Blaze View | `Blaze.render` or `Blaze.renderWithData` | `Blaze.remove(view)` |

Read `references/lifecycle-and-components.md` for data-context rules,
callbacks, dynamic templates, DOM scoping, and cleanup patterns.

## Routing boundaries

| Request | Route |
|---------|-------|
| Fresh Blaze UI, Spacebars, template lifecycle, async rendering | This skill |
| General Rspack or SWC setup and configuration helpers | `meteor-modern-build-stack` |
| Convert an existing app to Rspack | `migrate-to-rspack` |
| Upgrade Blaze code from Meteor 2 to Meteor 3 | `migrate-to-meteor-3` |
| Publication design or subscription authorization | `meteor-pubsub` |
| Mongo and Minimongo API decisions | `meteor-mongo-minimongo` |
| Mocha driver, browser runner, or E2E setup | `meteor-testing` |
| CSP, sanitization review, or broader hardening | `meteor-security` |

Use `references/build-hmr-and-testing.md` only for Blaze-specific entry
imports, HMR ownership, and programmatic template tests.

## Anti-patterns

- Return async Minimongo values from every helper. Prefer synchronous client
  reads unless the flow is already async or shared with the server.
- Read reactive data only after `await` without restoring the captured Tracker
  computation.
- Treat `{{#each ...}}{{else}}` as a loading indicator. The `else` branch also
  covers rejection and a resolved empty sequence.
- Pass implicit inherited contexts through reusable templates. Pass named data.
- Use global `$()` or `document.querySelector` for component DOM. Scope lookup
  to the template instance.
- Insert user-controlled content through triple braces or
  `Spacebars.SafeString` without trusted sanitization.
- Remove DOM nodes created by `Blaze.render` without calling `Blaze.remove`.
- Rely on private or removed UI-era APIs such as `UI.body`,
  `Template.__define__`, `Template.__body__`, `Spacebars.TemplateWith`, or
  `Blaze.InOuterTemplateScope`.

## Authoritative resources

- [Meteor Blaze tutorial](https://docs.meteor.com/tutorials/blaze/)
- [Blaze guide](https://www.blazejs.org/guide/introduction.html)
- [Spacebars API](https://www.blazejs.org/api/spacebars)
- [Templates API](https://www.blazejs.org/api/templates.html)
- [Blaze programmatic API](https://www.blazejs.org/api/blaze.html)
- [`meteor/blaze` source and tests](https://github.com/meteor/blaze)
- `references/spacebars-and-async.md`
- `references/lifecycle-and-components.md`
- `references/build-hmr-and-testing.md`
- `references/eval-cases.md`
