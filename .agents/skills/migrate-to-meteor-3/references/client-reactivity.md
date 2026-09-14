# Client reactivity inside async code

In Meteor 2.x, `Collection.findOne` on the client was synchronous and
reactive. Inside a Blaze helper or `Tracker.autorun`, calling it registered
a dependency that re-ran the computation when the underlying data changed.

In Meteor 3.x the sync Minimongo API still exists on the client, and the
`*Async` siblings (`findOneAsync`, `fetchAsync`) also work there. A reactive
read executed before the first `await`, including the first async query, can
register a Tracker dependency. Code after an `await` loses
`Tracker.currentComputation` unless the reactive read is wrapped with
`Tracker.withComputation`.

## The trap

```javascript
// BROKEN: the reactive query runs after an await without its computation.
Template.profile.helpers({
  async user() {
    await Meteor.callAsync('profiles.prepare', this.userId);
    return Meteor.users.findOneAsync(this.userId);
  },
});
```

Blaze can unwrap the returned Promise, but the query runs after the first
`await`. It cannot register the helper's Tracker dependency, so subsequent
document changes do not re-run the helper.

## The rule

On the server, use the `*Async` API. On the client, choose based on the calling
code:

- Prefer sync Minimongo in naturally synchronous Blaze helpers, render paths,
  and Tracker computations. It avoids Promise state and unnecessary async
  propagation while retaining normal reactivity.
- Prefer async Minimongo in shared client/server modules and code that is
  already async.
- A reactive query before the first `await` can register dependencies. Wrap
  each reactive query after an `await` with `Tracker.withComputation`.

```javascript
// Simple and reactive: sync Minimongo in synchronous UI code.
Template.profile.helpers({
  user() {
    return Meteor.users.findOne(this.userId);
  },
});
```

## Async helpers that need reactivity

An async Minimongo call made before any `await` can also be reactive:

```javascript
Tracker.autorun(async () => {
  const users = await Meteor.users.find().fetchAsync();
  renderUsers(users);
});
```

If unrelated async work happens first, save the computation and restore it
around the later reactive read:

```javascript
import { Tracker } from 'meteor/tracker';

Template.profile.helpers({
  enriched() {
    const computation = Tracker.currentComputation;
    return (async () => {
      const more = await Meteor.callAsync('users.enrich', this.userId);
      const doc = await Tracker.withComputation(
        computation,
        () => Meteor.users.findOneAsync(this.userId),
      );
      return { ...doc, ...more };
    })();
  },
});
```

Code before the first `await` keeps the current computation. Code after it does
not. Wrap only the reactive reads that need the saved computation;
`Tracker.withComputation` has a performance cost.

## Blaze async helpers (Blaze 2.7+)

Blaze 2.7+ understands Promises returned by helpers and exposes three
state directives inside `{{#let}}`:

- `@resolved "<name>"`: true once the named `let` binding has settled.
- `@pending "<name>"`: true while the named `let` binding is still
  awaiting.
- `@rejected "<name>"`: true if the named `let` binding threw or its
  Promise rejected.

```handlebars
{{#let user=getUserAsync}}
  {{#if @pending "user"}}<Spinner />{{/if}}
  {{#if @rejected "user"}}<Error msg="Could not load user" />{{/if}}
  {{#if @resolved "user"}}
    {{> profile data=user}}
  {{/if}}
{{/let}}
```

This gives the same surface as React Suspense: a spinner during the
await, an error region on rejection, the resolved value once ready.

## Async iteration in Blaze

`{{#each}}` accepts an async helper that returns a Promise of an array
or cursor. Pair it with `{{else}}` for an empty-state branch:

```handlebars
{{#each user in getUsersAsync}}
  {{> userRow user=user}}
{{else}}
  <p>No users yet.</p>
{{/each}}
```

The minimum Blaze version for these directives is 2.7. If your project
pins an older Blaze, upgrade `blaze-html-templates` and the
`blaze` runtime packages before relying on `@pending`/`@rejected`.

## Symptoms

- Page renders correctly on initial load. Subsequent changes to the data
  never appear. A reactive query runs after an `await` without
  `Tracker.withComputation`.
- A Blaze partial logs `[object Promise]` instead of the value. The helper
  returned a Promise without `@resolved` gating.
- `Tracker.autorun` runs once. Subsequent invalidations are silent. Its
  reactive reads occur only after an `await` without restoring the
  computation.

## Two-phase data patterns

When a publication ships a base document and a second subscription
enriches it, the enrichment runs in a separate `Tracker.autorun`. Keep
both reads sync (minimongo) inside the helper. Use the explicit
`Meteor.subscribe` handle and `subscription.ready()` to gate rendering.

---
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/v3-migration-docs/front-end/blaze.md
