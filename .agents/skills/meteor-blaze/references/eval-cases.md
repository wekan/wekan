# Evaluation cases for `meteor-blaze`

## Case 1: create a current Blaze app

Prompt: "Start a new Meteor 3 Blaze app and explain the generated frontend and
bundler files before adding my feature."

Pass if the agent uses `meteor create --blaze`, inspects the generated
`package.json`, `.meteor/packages`, client entry, and `rspack.config.js`, and
recognizes Rspack as the Meteor 3.4+ default without claiming every Meteor 3
release generated the same tree. Fail if it copies a historical skeleton or
adds a custom Rspack config without a requirement.

## Case 2: template is undefined under Rspack

Prompt: "`Template.profileCard` is undefined after I moved Blaze files into
`imports/ui`. The app uses Rspack."

Pass if the agent traces the client entry graph, imports `profile-card.html`
from the JavaScript registration module, and imports that module from the
client graph. Fail if it relies on eager directory scanning or imports the UI
from the server entry.

## Case 3: reactive read after await

Prompt: "My async Blaze helper renders once, but a later Minimongo change does
not update it. The query runs after `await Meteor.callAsync(...)`."

Pass if the agent identifies the lost Tracker computation, first considers a
synchronous client Minimongo helper, and otherwise captures
`Tracker.currentComputation` before `await` and restores it only around the
later reactive read with `Tracker.withComputation`.

## Case 4: distinct Promise states

Prompt: "A Blaze helper returns a Promise of users. I need separate loading,
error, empty, and populated states."

Pass if the agent binds the Promise with `#let`, uses `@pending`, `@rejected`,
and `@resolved`, and checks the resolved array separately for empty. Fail if it
uses only the `{{#each}}{{else}}` branch, which conflates pending, rejected, and
empty.

## Case 5: stale Promise race

Prompt: "Switching users quickly sometimes shows the profile for the previous
user. `{{#let profile=loadProfile}}` receives a Promise on each userId change."

Pass if the agent explains that Blaze stores the latest resolved value rather
than synchronizing to the latest started Promise, then uses cancellation, a
generation token, or a justified serial queue. Fail if it claims `#let`
automatically rejects stale results.

## Case 6: template-owned subscription

Prompt: "A reusable comments template subscribes by `postId`. How should it
resubscribe and clean up when its data context changes?"

Pass if the agent uses an ordinary-function `onCreated`, a template-owned
`this.autorun`, reactive `Template.currentData()`, and `this.subscribe`. It
uses `Template.subscriptionsReady` or `this.subscriptionsReady()` for readiness
and relies on instance destruction for subscription cleanup.

## Case 7: imperative widget duplicates

Prompt: "A chart initialized from `onRendered` duplicates canvases after data
changes and hot edits."

Pass if the agent scopes DOM lookup to the instance, initializes once after the
DOM and data are ready, updates through the chart API, and destroys the widget
in `onDestroyed`. Fail if it constructs a new widget on every autorun without
teardown or uses a global selector.

## Case 8: confusing child context

Prompt: "Inside `taskRow`, `{{title}}` sometimes resolves to a helper instead
of the task field, and the component also needs a parent callback."

Pass if the agent explains helper precedence, changes the inclusion to named
arguments such as `task=task onToggle=onToggle`, renders `{{task.title}}`, and
calls the passed callback. Fail if it adds more `../` lookups or a global
helper.

## Case 9: HMR duplicates module effects

Prompt: "With the Meteor bundler, editing a Blaze template works without a
reload, but every edit adds another window listener and resets a template-local
filter."

Pass if the agent distinguishes Blaze registration cleanup from arbitrary
module effects, moves the listener into lifecycle ownership or adds a proven
HMR disposal path, and explains that replacement constructs a new template
instance. It moves only deliberately durable state to an external reactive
store.

## Case 10: unsafe raw HTML

Prompt: "Render a comment body's HTML using triple braces. The value comes
from users but our publication is authenticated."

Pass if the agent rejects authentication as an HTML-safety guarantee, defaults
to double-brace escaped text, and requires explicit sanitization before triple
braces or `Spacebars.SafeString`. It routes a broader sanitization or CSP review
to `meteor-security`.

## Case 11: programmatic View leaks

Prompt: "A map popup mounts Blaze with `Blaze.renderWithData`. Closing popups
removes their host nodes, but autoruns keep firing."

Pass if the agent retains the returned View, calls `Blaze.remove(view)` before
removing the host, and verifies lifecycle cleanup. Fail if it treats direct DOM
removal as equivalent.

## Case 12: template unit test

Prompt: "Write a client test for a Blaze task row that renders named data and
reactively updates."

Pass if the agent imports the registration module, renders into an isolated DOM
host with `Blaze.renderWithData`, changes the actual reactive source, waits for
`Tracker.afterFlush`, asserts observable DOM, and calls `Blaze.remove` in
cleanup. Test-driver setup should route to `meteor-testing`.

## Case 13: migration near miss

Prompt: "Upgrade this Meteor 2 Blaze app to Meteor 3 and fix all Fibers and
async Mongo failures."

Pass if the agent routes the upgrade plan to `migrate-to-meteor-3` and uses
this skill only for current Blaze rendering decisions. Fail if it treats the
request as a frontend-only template rewrite.

## Case 14: build-config near miss

Prompt: "Add Rspack aliases, split vendor chunks, and replace a default plugin
in my Blaze app."

Pass if the agent routes general Rspack configuration to
`meteor-modern-build-stack`, preserving only the Blaze template imports and
HMR lifecycle concerns here.

## Case 15: removed legacy API

Prompt: "An old Blaze package uses `UI.body`, `Template.__define__`, and
`Spacebars.TemplateWith` in a Meteor 3 app. What are the current equivalents?"

Pass if the agent identifies the removed UI-era APIs, uses public application
APIs such as `Template.body` and normal `<template>` compilation where
possible, and treats underscored replacements as package-internal migration
risk rather than normal app guidance. It may route the full upgrade to
`migrate-to-meteor-3`.

## Case 16: reactive dynamic template

Prompt: "A route setting chooses which Blaze panel to render. The panel name
and its data can change reactively."

Pass if the agent uses `Template.dynamic` with explicit `template` and `data`
arguments, keeps both inputs reactive, and validates externally controlled
template names against an application allowlist. Fail if it manually renders a
new View on every invalidation or permits arbitrary stored names.

## Case 17: per-instance filter state

Prompt: "Two copies of my Blaze filter component share query and checkbox
state because its `ReactiveDict` is declared at module scope."

Pass if the agent creates one `ReactiveDict` per template instance in
`onCreated`, uses `setDefault` and reactive `get` calls, and updates it through
the current instance. It keeps module-level state only when cross-instance
sharing is an explicit requirement.

## Case 18: Blaze edit under Rspack

Prompt: "My Meteor 3.4 Blaze scaffold includes `blaze-hot` and `rspack`, but a
template edit reloads the page and loses form state. Fix Blaze HMR."

Pass if the agent says Blaze HMR is not currently supported in the Rspack
graph, recognizes the fast full live reload as expected, and does not promise
state preservation from `blaze-hot`. It may offer the Meteor bundler when hot
template replacement is a hard requirement. Fail if it treats installed
package names as proof that Rspack supports Blaze HMR.

## Case 19: new beta PWA

Prompt: "Create a Meteor 3.6-beta.0 Blaze PWA. Does the scaffold need Workbox, and will it keep my Minimongo data and queued methods offline?"

Pass if the agent: Selects the PWA scaffold with Blaze/Rspack, explains its dependency-free worker and shell/offline page, and excludes automatic offline data or method replay.
Fail if it contradicts these boundaries or invents unsupported commands.

## Case 20: PWA prefix and update behavior

Prompt: "Our 3.6 beta PWA is hosted below /portal. Offline navigation works differently in dev and production, and users sometimes retain an old shell. What should we inspect?"

Pass if the agent: Checks ROOT_URL prefix, worker registration/scope and manifest, static-only development caching versus production navigation fallback, owned cache version/activation, and a real update test without caching DDP or private responses. Recognizes the scaffold already accounts for the prefix instead of assuming a manual registration rewrite is necessary.
Fail if it contradicts these boundaries or invents unsupported commands.

## Case 21: older PWA and native near miss

Prompt: "We must stay on Meteor 3.5.2. Can the new --pwa scaffold both upgrade our existing app in place and generate signed iOS binaries?"

Pass if the agent: Rejects the new-scaffold version assumption and in-place overwrite, preserves an existing/manual worker path, and routes native binary delivery to meteor-native.
Fail if it contradicts these boundaries or invents unsupported commands.
