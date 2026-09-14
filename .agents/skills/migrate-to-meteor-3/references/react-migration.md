# React migration

Tight scope: what changes for an existing React-on-Meteor-2 app during
the upgrade to Meteor 3. The broader React-on-Meteor data tutorial
(`react-meteor-data`, full hook reference, suspense patterns for new
apps) is out of scope here; use the `meteor-react` skill after the
framework upgrade.

## What changes

`react-meteor-data` is independently versioned. Suspense hooks began in package
2.7.0, before Meteor 3, while package 3.0.0 began official Meteor 3
compatibility. Inspect `.meteor/versions` before choosing an API. For a Meteor
3 app, use a tested 3.0.0+ package; current examples are verified against
4.0.1. The Suspense variants replace the `isLoading` readiness function by
suspending the component tree until data is ready.

```javascript
// Classic surface, supported on Meteor 2 and 3
import { useTracker, useSubscribe } from 'meteor/react-meteor-data';

function PostsScreen() {
  const isLoading = useSubscribe('posts');
  const posts     = useTracker(() => Posts.find().fetch());
  if (isLoading()) return <Spinner />;
  return <List posts={posts} />;
}
```

```javascript
// Suspense surface, react-meteor-data 2.7.0+; use 3.0.0+ with Meteor 3
import { useTracker, useSubscribe } from 'meteor/react-meteor-data/suspense';

function PostsScreen() {
  useSubscribe('posts');                                  // suspends
  const posts = useTracker('posts', () => Posts.find().fetchAsync());
  return <List posts={posts} />;                          // no isLoading()
}
```

Two concrete changes:

1. Import from `meteor/react-meteor-data/suspense` instead of
   `meteor/react-meteor-data` when you want Suspense semantics. Wrap the
   component in `<Suspense fallback={...}>` somewhere upstream.
2. `useTracker(key, fn)` takes a string key as the first argument under
   the suspense API. The key isolates the computation; passing the same
   key with a different `fn` is undefined.

The classic `useTracker(fn)` and `useSubscribe(...)` (returning
`isLoading`) keep working under the non-suspense import path. Migration
is optional.

## `useFind`

Classic `useFind` is unchanged. Continue passing a cursor factory:

```javascript
const posts = useFind(() => Posts.find({}));
```

Suspense `useFind` has a different signature. Pass the collection and the
argument tuple for `Collection.find`:

```javascript
const posts = useFind(Posts, [{}, { sort: { createdAt: -1 } }]);
```

Use `meteor-react` for the complete classic and Suspense contracts.

## Client-side Mongo

React components that call `Collection.find().fetch()` directly on the
client work the same way as in Meteor 2. Minimongo on the client is still
synchronous, so keeping render-path reads synchronous is usually simplest.
Async client reads do not inherently lose Tracker reactivity: a reactive read
before the first `await` is tracked. If the reactive read itself occurs after
an `await`, restore the captured computation around that read with
`Tracker.withComputation`. See `client-reactivity.md`.

## Symptoms

- After the upgrade, a `useSubscribe` call no longer returns an
  `isLoading` function. The component was migrated to the suspense
  import without a wrapping `<Suspense>`. Either add a Suspense
  boundary, or import from `meteor/react-meteor-data` (non-suspense).
- `useTracker` reruns on every render or never reruns. The key argument
  is missing under the suspense API. Add a stable string key.
- The Suspense import cannot be resolved. Inspect `.meteor/versions`; upgrade
  `react-meteor-data` to a Meteor 3-compatible 3.0.0+ line before copying the
  current API.

Package version evidence:
[`react-meteor-data` changelog](https://github.com/meteor/react-packages/blob/master/packages/react-meteor-data/CHANGELOG.md)

---
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/v3-migration-docs/front-end/react.md
