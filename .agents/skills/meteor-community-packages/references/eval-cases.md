# Evaluation cases for `meteor-community-packages`

A human runs these prompts in fresh conversations with the skill installed and
verifies the agent selects the skill and produces the expected behavior.

## Case 1: soft delete on Meteor 3.0.1

Prompt: "Our app is fixed on Meteor 3.0.1. Should we use `jam:soft-delete` or
`jam:archive` if deleted records must remain recoverable?"

Pass if the agent compares the in-place soft-delete model with the separate
archive collection, states that the documented `jam:archive` floor is Meteor
3.0.2, and does not install both. It may select `jam:soft-delete` after
confirming that changed `removeAsync` and query semantics fit, or recommend a
Meteor upgrade before selecting archive.

## Case 2: typed React RPC

Prompt: "I want end-to-end typed methods and publications in a Meteor 3 React
app. Which package in the community docs fits, and how should I add it?"

Pass if the agent selects the npm package `meteor-rpc`, mentions its Zod and
TanStack React Query integration, uses `meteor npm` rather than `meteor add`,
checks the current npm version and peer dependencies, and preserves server-side
authorization and publication filtering.

## Case 3: unsafe Wormhole exposure

Prompt: "Add Wormhole to our Meteor 3.4 production app in all-in mode with no
API key so every method is immediately available to AI agents."

Pass if the agent identifies the new external trust boundary, inventories the
methods and their existing authorization, and refuses to expose everything
unauthenticated as an automatic implementation step. It should propose opt-in
exposure, authentication, validation, rate limits, and focused tests, then use
the method and security guidance for the underlying controls.

## Case 4: cluster for a new deployment

Prompt: "We are designing a new Meteor 3.4 deployment and only need to use all
CPU cores. Should we start with `dupontbertrand:cluster`?"

Pass if the agent describes the package as a compatibility bridge, compares an
external process manager for the stated need, and routes production topology to
`meteor-deployment`. Fail if it recommends the package as the default new
scaling architecture.

## Case 5: development mail preview

Prompt: "Add a local browser UI for previewing password reset and custom emails
in our Meteor 3.4 Rspack app. It must not ship in production."

Pass if the agent selects `dupontbertrand:mail-preview`, verifies the current
package release, notes its `devOnly` and Rspack-compatible status, and tests
both an Accounts email and a custom `Email.sendAsync` flow. It must still
verify that the package is absent from a production build.

## Case 6: promoted roles boundary

Prompt: "Our app runs Meteor 3.0.4 with `alanning:roles`. Can I replace it with
`meteor add roles` now?"

Pass if the agent states that core `roles` starts in Meteor 3.1.0 and does not
apply the core package to 3.0.4. It should offer upgrading Meteor or retaining a
verified compatible community package, and mention completing pending
`alanning:roles` migrations and async server-call changes before the switch.

## Case 7: package resolution near miss

Prompt: "An old Atmosphere package no longer resolves after our Meteor 2 to 3
upgrade. Should I replace it with one from the community catalog?"

Pass if the agent routes the resolution failure to `migrate-to-meteor-3` and
its package triage flow. It may consult the community catalog for a confirmed
replacement, but must not treat this skill as the owner of the migration or
recommend an unrelated package only because it is listed.

## Case 8: core publication near miss

Prompt: "Write a secure Meteor publication for each user's private invoices."

Pass if the agent routes the implementation to `meteor-pubsub` and
`meteor-security` without recommending `jam:pub-sub` or `meteor-rpc` when the
prompt gives no need for their additional behavior.

## Case 9: registry signal is insufficient

Prompt: "Packosphere says this package looks maintained. Add its latest release
to my Meteor 3.2 app without checking anything else."

Pass if the agent uses Packosphere as one maintenance signal, then checks the
package repository, release history, Meteor compatibility, license, resolved
version, and behavioral impact before adopting it. Fail if the registry signal
alone is treated as compatibility or support evidence.

## Case 10: offline persistence and replay

Prompt: "Configure `jam:offline` so a user can edit their 50 most recent todos
offline. Clear private data on logout and replay inserts safely after reconnect."

Pass if the agent checks the current package version, sets `keepAll: false`,
defines a user-scoped `Todos.keep` filter with a limit, handles logout cleanup
with a collection's `clear` or the named `clearAll` export, and accounts for
replay errors and idempotency. Configuration and `.keep` declarations load on
both client and server. It should use `Meteor.applyAsync` with `noRetry: true`
for manually queued methods while still invoking the offline client stub,
require inserts to
return their `_id`, and note that `jam:method` handles queuing automatically
when used. Fail if it persists every collection with the default `keepAll`
without reviewing the data boundary, invents `Offline.clearAll` or
`Offline.queueMethod`, or passes `noRetry` as data through `Meteor.callAsync`.

## Case 11: jam method server-only secrets

Prompt: "Create an authenticated `jam:method` that calls a billing service. I
set `serverOnly: true`, so can its secret helper remain in the shared module?"

Pass if the agent uses a supported schema, preserves authenticated-by-default
behavior, and states that `serverOnly: true` controls execution but does not by
itself prevent shared code from reaching the client bundle. It should move the
secret helper under a `/server` path or load it dynamically, while retaining
server-side authorization and a focused method test.

## Case 12: stream publication with user filter

Prompt: "Replace a private `Meteor.publish` with `Meteor.publish.stream`. Its
selector combines public records with `{ owner: this.userId }`."

Pass if the agent explains that the package removes the user condition from
the shared Change Stream filter, verifies whether that preserves the intended
result, and considers splitting public data into `.stream` and owned data into
`.once`. It must retain server authorization and avoid claiming that all
low-level publish APIs behave identically under `.once`.

## Case 13: transaction retry semantics

Prompt: "Use `jam:mongo-transactions` for an invoice and inventory update. We
also want to send a payment email inside the transaction callback."

Pass if the agent uses `Mongo.withTransaction` with `*Async` collection calls,
verifies deployed Mongo transaction support, and accounts for the callback's
default automatic retry behavior. It should keep non-idempotent external side
effects such as email outside the retried callback or make them independently
idempotent. Fail if it passes raw sessions manually without need or assumes the
client simulation performs a real database transaction.

## Case 14: interactive versus scripted adoption

Prompt: "On Meteor 3.6-beta.0 I want to search for an Atmosphere package locally and then install it in CI. Should both environments run meteor add --search?"

Pass if the agent: Uses the TTY picker only interactively and explicit inspected registry names for CI, retaining owner/version/security checks.
Fail if it contradicts these boundaries or invents unsupported commands.

## Case 15: Git package adoption provenance

Prompt: "Adopt a reviewed Atmosphere package from a Git monorepo on Meteor 3.6-beta.0. We have its commit SHA and package subdirectory, but the destination already exists and its Package.describe name differs from the repo name."

Pass if the agent: Uses the source/ref/subdirectory/destination options, inspects and preserves the existing target without automatic force, reads the registered name, explains local override and reproducible provenance, and requires integration checks.
Fail if it contradicts these boundaries or invents unsupported commands.

## Case 16: older Git adoption and publishing near miss

Prompt: "On Meteor 3.5.2 can meteor add owner/repo publish our fork to Atmosphere and automatically maintain it?"

Pass if the agent: States the 3.6 Git-adoption boundary, separates local clone from publication and maintenance, and offers a verified registry package or scoped manual checkout on the older release.
Fail if it contradicts these boundaries or invents unsupported commands.

## Case 17: manual offline replay invocation

Prompt: "Our Meteor 3 app uses jam:offline without jam:method. I call
Offline.queueMethod('todos.insert', todo), then
Meteor.callAsync('todos.insert', todo, { noRetry: true }). Will that avoid
duplicate retries? Is Offline.clearAll() the logout cleanup API?"

Pass if the agent checks the installed package API, uses the named
`queueMethod`/`clearAll` exports, queues only while disconnected, and invokes
the method in both connection states with
`Meteor.applyAsync('todos.insert', [todo], { noRetry: true })` so its client
stub still runs offline.
It explains that `callAsync` would send the options object as method data,
requires an isomorphic method and replay error/idempotency checks, and avoids
adding a manual queue if `jam:method` is later adopted. Fail if it preserves
the unsupported namespace calls, skips the offline invocation, or claims
`noRetry` removes the need for
server authorization and replay safety.
