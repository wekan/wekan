# Spacebars, data lookup, and async rendering

Use this reference for helper lookup, data contexts, Promise behavior, async
state, lost Tracker context after `await`, and overlapping request races.

## Version gates

Inspect `.meteor/versions` before depending on a feature.

| Blaze release | Relevant behavior |
|---------------|-------------------|
| 2.7.0 | Promise support in `Spacebars.call` and `Spacebars.dot`; async `#let` bindings |
| 2.8.0 | Async content and attributes |
| 2.9.0 | Async dynamic attributes |
| 3.0.0 | Fibers removed; Meteor 3 compatibility |
| 3.0.1 | Promise support in `#with` |
| 3.0.2 | More helper context in thrown errors |
| 3.0.3 | SWC compatibility fix for generated functions using `arguments` |

The authoritative version record is
[`meteor/blaze` HISTORY.md](https://github.com/meteor/blaze/blob/master/HISTORY.md).

## Lookup and explicit context

Blaze resolves a name in this order; the template-name step applies to
inclusions such as `{{> name}}`:

1. Helper on the current template.
2. Current `#let` or `#each item in items` binding.
3. Template name.
4. Global helper.
5. Field on the current data context.

Use named bindings and named inclusion arguments to remove ambiguity:

```html
{{#each task in tasks}}
  {{> taskRow task=task onToggle=toggleTask}}
{{/each}}
```

```javascript
Template.taskRow.events({
  "change .js-done"(event) {
    this.onToggle(this.task._id, event.currentTarget.checked);
  },
});
```

Prefer `task=task` over replacing the entire child context with `task`. Avoid
`../` lookups in reusable templates. Pass a value or callback explicitly.

A local helper named `panel` also wins over the template in `{{> panel}}`.
If it returns `true`, inclusion throws `Expected template or null, found: true`.
Rename the helper, for example `isPanel` or `panelData`. See
[template diagnostics](template-diagnostics.md#runtime-traps).

## Promise behavior

| Spacebars location | Pending or rejected behavior | Better choice when states differ |
|--------------------|------------------------------|----------------------------------|
| `{{helper}}`, path, helper argument, attribute | Produces `undefined` or no attribute | Bind with `#let` |
| `{{#if promise}}` or `{{#unless promise}}` | Renders neither branch until resolution | Bind with `#let` and test state |
| `{{#each value in promise}}` | Renders `else` for pending, rejected, or empty | Bind with `#let` to distinguish them |
| `{{#with promise}}` | Waits for resolution | Bind with `#let` when errors need UI |
| Direct Promise content, such as `{{helper}}` returning a Promise | Recreates its awaiting View on reactive rerender; a replaced View's late result does not replace the new content | Use `#let` for explicit states, with separate ordering protection for its persistent binding |

`#let` unwraps each Promise and exposes `@pending`, `@rejected`, and
`@resolved`. Each helper accepts binding names. With no names, it checks all
bindings in the nearest `#let`.

```html
{{#let users=loadUsers permissions=loadPermissions}}
  {{#if @pending}}<p>Loading...</p>{{/if}}
  {{#if @rejected "users"}}<p>Users failed.</p>{{/if}}
  {{#if @rejected "permissions"}}<p>Permissions failed.</p>{{/if}}
  {{#if @resolved "users" "permissions"}}
    {{> userList users=users permissions=permissions}}
  {{/if}}
{{/let}}
```

Do not use `@resolved` to mean a truthy value. It reports Promise state. Test
the resolved value separately when `false`, `null`, or an empty array matters.

## Preserve Tracker dependencies across `await`

Code before the first `await` runs in the helper's Tracker computation. Code
after it does not. Prefer a synchronous Minimongo read in a synchronous helper:

```javascript
Template.profile.helpers({
  user() {
    return Meteor.users.findOne(this.userId);
  },
});
```

If a reactive read must occur after other async work, capture the computation
before starting the async continuation and restore it only around that read:

```javascript
import { Tracker } from "meteor/tracker";

Template.profile.helpers({
  enrichedProfile() {
    const computation = Tracker.currentComputation;
    const userId = this.userId;

    return (async () => {
      const enrichment = await Meteor.callAsync("profiles.enrich", userId);
      const user = await Tracker.withComputation(
        computation,
        () => Meteor.users.findOneAsync(userId),
      );
      return { ...user, ...enrichment };
    })();
  },
});
```

Do not wrap nonreactive work in `Tracker.withComputation`. It has a cost and
does not make an external Promise reactive.

## Prevent stale Promise results

Persistent `#let` bindings and `#if` / `#unless` conditions can accept an old
Promise's late result. Each pending Promise can write to the same binding;
resolution order need not match request order. For conditions, use opposite
truth values to expose the race.

`#with` (Promise support from Blaze 3.0.1) combines a condition and a data
context. Its condition can also accept a late stale falsy result and show
`else` after a newer truthy result. Two truthy results need not reproduce that
branch race: the inner context can still display the newer data. Do not claim
every `#with` result behaves identically to `#let`; test branch selection and
rendered data separately. See
[`Spacebars.With`](https://github.com/meteor/blaze/blob/068f0c09f4851bdc150e2e30f1a09bae3700914b/packages/spacebars/spacebars-runtime.js).

Direct Promise content in `{{helper}}` has a different lifetime: reactive
rerender replaces its `_Await` View and destroys the old View. Its late result
does not overwrite the new content. Do not add a generation token solely
because this direct helper returns a Promise. This does not cancel requests
or protect side effects, shared state, or a helper that writes a ReactiveVar.

This distinction is verified in Blaze 3.0.3 and 3.1.0-beta.0 through
[`_createBinding` / `_Await`](https://github.com/meteor/blaze/blob/068f0c09f4851bdc150e2e30f1a09bae3700914b/packages/blaze/builtins.js),
[`_materializeDOM`](https://github.com/meteor/blaze/blob/068f0c09f4851bdc150e2e30f1a09bae3700914b/packages/blaze/materializer.js),
and [View replacement](https://github.com/meteor/blaze/blob/068f0c09f4851bdc150e2e30f1a09bae3700914b/packages/blaze/view.js).
Own persistent request state when ordering matters:

```javascript
import { Meteor } from "meteor/meteor";
import { ReactiveVar } from "meteor/reactive-var";
import { Template } from "meteor/templating";

Template.profile.onCreated(function () {
  this.requestGeneration = 0;
  this.profileState = new ReactiveVar({ status: "idle" });

  this.autorun(() => {
    const userId = Meteor.userId();
    const generation = ++this.requestGeneration;
    this.profileState.set({ status: "pending" });

    Meteor.callAsync("profiles.get", userId).then(
      (value) => {
        if (generation === this.requestGeneration) {
          this.profileState.set({ status: "resolved", value });
        }
      },
      (error) => {
        if (generation === this.requestGeneration) {
          this.profileState.set({ status: "rejected", error });
        }
      },
    );
  });
});

Template.profile.onDestroyed(function () {
  this.requestGeneration += 1;
});

Template.profile.helpers({
  profileState() {
    return Template.instance().profileState.get();
  },
});
```

Prefer `AbortController` when the underlying API accepts a signal. Use a
generation token when cancellation is unavailable. Use a serialized queue only
when every result must be applied in order.

## Raw HTML boundary

Double braces escape text. Triple braces insert raw HTML. A
`Spacebars.SafeString` asserts that its value is already safe. Use ordinary
double braces for user content. Only use triple braces or `SafeString` for
static, trusted, or explicitly sanitized markup, and keep sanitization next to
the trust boundary.

Further API detail:

- [Spacebars API](https://www.blazejs.org/api/spacebars)
- [Understanding Blaze](https://www.blazejs.org/guide/understanding-blaze)

---
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/v3-migration-docs/front-end/blaze.md
