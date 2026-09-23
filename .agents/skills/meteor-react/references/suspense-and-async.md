# Suspense and async Tracker data

Import Suspense hooks from a distinct subpath:

```javascript
import {
  useFind,
  useSubscribe,
  useTracker,
} from "meteor/react-meteor-data/suspense";
```

Do not switch import paths without changing signatures and adding pending and
error ownership.

## Classic versus Suspense

| Concern | Classic | Suspense |
|---------|---------|----------|
| Loading | `const isLoading = useSubscribe(...); isLoading()` | `useSubscribe(...)` throws until ready |
| Tracker | `useTracker(reactiveFn, deps?)` | `useTracker(key, asyncReactiveFn, deps?)` |
| Find | `useFind(() => Collection.find(...), deps?)` | `useFind(Collection, [selector, options], deps?)` |
| Errors | Component state or returned error | Rejected Promise reaches an error boundary |
| Server query | First synchronous Tracker read | `useTracker` and `useFind` can suspend server rendering |

Classic hooks remain supported. Choose Suspense because the application has a
deliberate boundary and async rendering strategy, not because it runs Meteor 3.

## Boundaries

Every suspending subtree needs a fallback and a rejection owner:

```jsx
<AppErrorBoundary>
  <Suspense fallback={<TaskListSkeleton />}>
    <TaskList listId={listId} />
  </Suspense>
</AppErrorBoundary>
```

The nearest Suspense boundary owns pending Promises. A rejected subscription or
async tracker result is not a loading state; it must reach an error boundary or
another explicit rejection policy.

Place boundaries by user-visible loading unit. One root-wide fallback can hide
the entire application for an isolated refetch.

## Stable tracker keys

The first `useTracker` argument indexes a module-level cache. Use a stable,
specific key for one logical computation and avoid generic keys reused by
unrelated mounted components:

```javascript
const task = useTracker(
  `task-details:${taskId}`,
  () => Tasks.findOneAsync(taskId),
  [taskId],
);
```

Keep dependency inputs in the dependency array. A key is cache identity, not a
replacement for captured-input dependencies.

## Reactivity after `await`

Tracker captures reactive dependencies while its computation is current. An
unrelated `await` clears that ambient context. Restore the hook's computation
around a later reactive read:

```javascript
import { Tracker } from "meteor/tracker";

const tasks = useTracker(
  `visible-tasks:${listId}`,
  async (computation) => {
    const access = await Meteor.callAsync("lists.access", listId);
    if (!access.allowed) return [];

    return Tracker.withComputation(
      computation,
      () => Tasks.find({ listId }).fetchAsync(),
    );
  },
  [listId],
);
```

If the reactive read occurs before the first `await`, the hook captures it
without the extra wrapper. Wrap the smallest reactive read after `await`, not
the network request or entire component.

## Suspense `useSubscribe`

Use it as a statement:

```javascript
useSubscribe("tasks.byList", listId);
```

At `react-meteor-data` 4.0.1, the published declaration says the hook returns a
`Meteor.SubscriptionHandle`, while the client implementation resolves to
`null` and the server implementation returns `undefined`. The package docs
also say it does not return a handle. Do not consume the return value. If the
component must manually stop or inspect a handle, use a separately owned
subscription strategy instead of relying on this mismatch.

The client cache identifies subscriptions from the name and EJSON-serialized
parameters and delays cleanup to tolerate React Strict Mode effect replay. Do
not reproduce that cache in application code.

## Suspense `useFind`

The second argument is the argument tuple passed to `Collection.find`:

```javascript
const tasks = useFind(Tasks, [
  { listId },
  { fields: { title: 1 }, sort: { createdAt: -1 } },
], [listId]);
```

Pass `null` to disable the query. Do not pass a cursor factory or call
`.fetch()` as with the classic signature. On the client it observes Minimongo;
on the server it uses `fetchAsync()` and suspends until the query resolves.

## Server rendering limits

Suspense `useFind` and `useTracker` have server paths, but a client subscription
does not populate server-rendered Minimongo. The current Suspense
`useSubscribe` server path is a no-op. Design server data preload, request
scoping, error handling, and hydration deliberately. Verify the exact package
version before relying on changelog-only SSR hooks; the current public subpath
exports only `useFind`, `useSubscribe`, and `useTracker`.

## Anti-patterns

- Consume the Suspense `useSubscribe` return as a handle.
- Use the same key such as `"user"` for multiple unrelated mounted trackers.
- Put a changing prop only in the key while omitting it from dependencies.
- Add Suspense without an error boundary for rejected Promises.
- Assume a server-side subscription populated data during SSR.
- Wrap every sync Minimongo query in an async Suspense tracker.

Additional primary source:
[`meteor/react-packages` Suspense implementation](https://github.com/meteor/react-packages/tree/master/packages/react-meteor-data/suspense)

---
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/packages/react-meteor-data.md
