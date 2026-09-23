# Classic `react-meteor-data`

Use the classic import when the component owns explicit loading UI or needs
synchronous Tracker and Minimongo values:

```javascript
import {
  useFind,
  useSubscribe,
  useTracker,
  withTracker,
} from "meteor/react-meteor-data";
```

`react-meteor-data` versions move independently from Meteor core releases.
Inspect `.meteor/versions` before relying on a signature or bug fix. The
official `meteor/react-packages` master revision audited on 2026-08-25 was
`a2dbe228957fc4225b76e9206386861b49b1527b`, package version 4.0.1.

Use these package floors to diagnose existing apps, not to recommend old
package lines for a Meteor 3 app:

| Capability | First `react-meteor-data` version | Meteor 3 guidance |
|---|---|---|
| `useTracker` | 2.0.0 | Use 3.0.0+; current examples target 4.0.1. |
| `useSubscribe` and `useFind` | 2.4.0 | Use 3.0.0+ and verify the installed signature. |
| Suspense hook entry point | 2.7.0 | Use 3.0.0+; do not infer it from the Meteor release. |
| Isomorphic Suspense `useFind` | 2.7.2 | Use 3.0.0+ for Meteor 3 compatibility. |
| Official Meteor 3 compatibility | 3.0.0 | Minimum package line for Meteor 3 apps. |
| `useSubscribeSuspenseServer` | 3.0.3 | Require 3.0.3+ only when that server helper is needed. |

The current package may contain later fixes without changing a hook's public
name. Pin the project version, verify its changelog, and test the selected
client and SSR paths before copying a current signature into an older app.

## Hook selection

| Hook | Use it for | Return |
|------|------------|--------|
| `useSubscribe(name, ...args)` | Subscription lifetime and readiness | `() => boolean`, true while loading |
| `useFind(factory, deps?)` | Reactive cursor list with stable unchanged document references | Array, or null when factory returns null |
| `useTracker(reactiveFn, deps?, skipUpdate?)` | Any other Tracker-derived value | Value returned by `reactiveFn` |
| `withTracker(mapper)` | Existing function or class component container | Wrapped component |

## `useSubscribe`

The return value is a function:

```javascript
const isLoading = useSubscribe("tasks.byList", listId);

if (isLoading()) return <Loading />;
```

Calling `isLoading()` both reads readiness and opts the component into the
readiness update. Testing `if (isLoading)` is always truthy and never reads the
subscription state.

Use a falsy name to bypass the subscription without conditionally calling a
hook:

```javascript
const isLoading = useSubscribe(enabled ? "tasks.byList" : null, listId);
```

When bypassed, `isLoading()` returns false. Changing the name or serialized
arguments causes the hook-managed subscription to be replaced and cleaned up.

## `useFind`

Return a `Mongo.Cursor`, not its fetched documents:

```javascript
const tasks = useFind(
  () => Tasks.find({ listId }, {
    fields: { title: 1, done: 1 },
    sort: { createdAt: -1 },
  }),
  [listId],
);
```

`useFind` creates its own cursor observer. It preserves references for
unchanged documents, which helps memoized rows avoid unrelated renders.
Calling `.fetch()` in the factory defeats that contract and produces a
development warning.

The current v4 implementation defaults `deps` to `[]`. Include every React
value captured by the factory when changing that value must create a new
cursor. Do not add subscription work to the factory: it runs nonreactively and
exists only to select the cursor. Call `useSubscribe` separately.

Return `null` or `undefined` to disable the cursor without conditionally
calling the hook:

```javascript
const tasks = useFind(
  () => enabled ? Tasks.find({ listId }) : null,
  [enabled, listId],
);
```

Handle the nullable return before mapping.

## `useTracker`

Without a dependency array, the hook recreates its computation around renders
and returns the first reactive value synchronously:

```javascript
const user = useTracker(() => Meteor.user());
```

With dependencies, the computation is retained until a dependency changes:

```javascript
const task = useTracker(
  () => Tasks.findOne({ _id: taskId }),
  [taskId],
);
```

Use dependencies for captured inputs and measured expensive computations. Do
not add `[]` mechanically to a closure that reads changing props or state.

The reactive function can receive the current `Tracker.Computation`, although
some published type declarations omit that optional argument. Return data from
the function. Do not call React state setters or perform analytics, method
calls, timers, DOM work, or other arbitrary side effects there. Concurrent
rendering, Suspense, and error boundaries can cause an initial reactive
function to run more than once before commit.

Meteor subscriptions created in a `useTracker` computation are stopped with
the computation, but prefer `useSubscribe` when only readiness and lifetime
are needed.

## `skipUpdate`

The comparator returns true to skip an update:

```javascript
const task = useTracker(
  () => Tasks.findOne(taskId),
  [taskId],
  (previous, next) =>
    previous?._id === next?._id &&
    previous?.updatedAt?.getTime() === next?.updatedAt?.getTime(),
);
```

Use it only after measuring a render problem. Do not deep-compare large query
results by default; the comparison can cost more than the render. Prefer
`useFind` plus memoized rows for lists.

## `withTracker`

Do not rewrite a working class-component container during unrelated
maintenance. Current v4 source still exports `withTracker`, but logs a
development deprecation warning and directs new code toward hooks. Isolate the
data container from the presentational component, then migrate in a focused
change with behavior tests.

## Data and authority boundaries

- Client hooks query Minimongo synchronously. Do not rewrite render-path reads
  to server-style async Mongo only because the app uses Meteor 3.
- A subscription only delivers what its publication authorizes. Filters and
  fields in a component are not security controls.
- Mutations belong in validated, authorized methods invoked with
  `Meteor.callAsync`.
- Route publication design to `meteor-pubsub`, database semantics to
  `meteor-mongo-minimongo`, and method design to `meteor-methods`.

Additional primary source:
[`meteor/react-packages`](https://github.com/meteor/react-packages/tree/master/packages/react-meteor-data)

---
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/packages/react-meteor-data.md
