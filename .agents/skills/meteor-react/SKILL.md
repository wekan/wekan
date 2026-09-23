---
name: meteor-react
description: >
  Use when building or debugging React interfaces in Meteor 3: meteor create
  --react, createRoot, JSX or TSX entry points, Rspack React detection, Fast
  Refresh, react-meteor-data, useTracker, useSubscribe, useFind, withTracker,
  Suspense, and Tracker.withComputation. Triggers on isLoading being treated as
  a boolean, useFind receiving fetch(), stale closure inputs, duplicate tracker
  side effects, unstable Suspense keys, lost reactivity after await, state reset
  after refresh, or React tests leaking computations. Use this skill when the
  user asks about a React skeleton, React Compiler, React-specific rspack.config rules, reactive
  data hooks, or classic versus Suspense integration. Route general bundler
  configuration to meteor-modern-build-stack and Meteor 2 upgrades to
  migrate-to-meteor-3.
metadata:
  author: meteor
  kind: knowledge
  meteor: ">=3.0"
  area: data
  tagline: "Build and debug Meteor 3 React interfaces (Rspack scaffold, reactive data hooks, Suspense, Fast Refresh, and testing)."
  bundle: ["react"]
  docs_synced_at: "2026-09-23"
license: MIT
---

# React interfaces for Meteor 3

React owns rendering and local UI state; Meteor owns reactive data and the
build handoff. Components consume authorized data and invoke methods.
Publications and methods remain the server authority.

## Decision flow

1. For a new JavaScript app, run `meteor create --react <name>`; React is also
   the default skeleton. For TypeScript and TSX, run
   `meteor create --typescript <name>`.
2. Inspect `package.json`, `.meteor/packages`, `.meteor/versions`, the client
   entry, and `rspack.config.*`. Skeletons and `react-meteor-data` versions can
   change independently of this skill.
3. Mount one React root from `Meteor.startup` with `createRoot`.
4. Pick one `react-meteor-data` surface for a component:
   - Classic hooks for explicit loading UI and synchronous Minimongo reads.
   - Suspense hooks only when an upstream Suspense fallback and rejection
     boundary already own the pending and error states.
5. Use `useSubscribe` for readiness, `useFind` for reactive lists with stable
   document references, and `useTracker` for other Tracker values.
6. Keep React-specific Rspack rules here. Route aliases, loaders, code
   splitting, cache, output, or migration work to the build skills.
7. Test UI behavior in a browser-backed client suite and always unmount the
   rendered root so Tracker computations and subscriptions can stop.

## Current scaffold

```bash
meteor create --react my-app
cd my-app
meteor
```

Current Meteor 3.4+ scaffolds use Rspack and `react-meteor-data`. Inspect
`.meteor/versions`: Meteor 3 requires 3.0.0+, these examples target 4.0.1, and
`references/react-meteor-data.md` records feature floors.

```jsx
import { Meteor } from "meteor/meteor";
import { createRoot } from "react-dom/client";
import { App } from "/imports/ui/App";
import "/imports/ui/styles.css";

Meteor.startup(() => {
  const container = document.getElementById("react-target");
  if (!container) throw new Error("Missing #react-target");
  createRoot(container).render(<App />);
});
```

TypeScript uses `client/main.tsx`, a `tsconfig.json`, and usually
`rspack.config.ts`. Meteor discovers that TypeScript config directly.

## Reactive data selection

| Need | API | Contract |
|------|-----|----------|
| Subscription readiness | Classic `useSubscribe` | Returns an `isLoading` function. Call it. |
| Reactive list | Classic `useFind` | Return a cursor, never `fetch()`. |
| User, count, single document, ReactiveVar | Classic `useTracker` | Return the reactive value. Avoid arbitrary side effects. |
| Async value with Suspense | Suspense `useTracker` | Supply a stable key and Promise-producing function. |
| SSR-capable collection query | Suspense `useFind` | Pass the collection and the `find` argument tuple. |
| Existing class component | `withTracker` | Keep it during focused maintenance; plan hooks separately. |

Classic list scaffold:

```jsx
import { useFind, useSubscribe } from "meteor/react-meteor-data";
import { Tasks } from "/imports/api/tasks";

export function TaskList({ listId }) {
  const isLoading = useSubscribe("tasks.byList", listId);
  const tasks = useFind(
    () => Tasks.find({ listId }, { sort: { createdAt: -1 } }),
    [listId],
  );

  if (isLoading()) return <p>Loading...</p>;
  if (tasks.length === 0) return <p>No tasks.</p>;
  return <ul>{tasks.map((task) => <li key={task._id}>{task.title}</li>)}</ul>;
}
```

`useFind` owns cursor observation and updates only changed document references.
Use `useTracker` when a transformed aggregate is clearer. Read
`references/react-meteor-data.md` before tuning dependencies or `skipUpdate`.

## Suspense and async reactivity

Suspense imports change signatures; they are not drop-in replacements:

```jsx
import { Suspense } from "react";
import { useFind, useSubscribe } from "meteor/react-meteor-data/suspense";
import { Tasks } from "/imports/api/tasks";

function TaskList({ listId }) {
  useSubscribe("tasks.byList", listId);
  const tasks = useFind(Tasks, [
    { listId },
    { sort: { createdAt: -1 } },
  ], [listId]);
  return <ul>{tasks.map((task) => <li key={task._id}>{task.title}</li>)}</ul>;
}

export function TaskScreen({ listId }) {
  return (
    <AppErrorBoundary>
      <Suspense fallback={<p>Loading...</p>}>
        <TaskList listId={listId} />
      </Suspense>
    </AppErrorBoundary>
  );
}
```

Treat Suspense `useSubscribe` as a suspension-only call. In the currently
audited package, its declared return type and runtime value disagree, so do not
consume the return. Read `references/suspense-and-async.md` for stable keys,
rejections, SSR, and `Tracker.withComputation` after `await`.

## Build and refresh ownership

Rspack detects React from the app's npm dependencies, enables JSX or TSX SWC
parsing, and installs and injects React Refresh for client development. A
normal React Rspack app does not add the refresh plugin manually.

Keep `rspack.config.*` minimal. The generated JavaScript skeleton demonstrates
an optional SVGR rule; the TypeScript skeleton demonstrates type checking.
Compose custom rules through `defineConfig` from `@meteorjs/rspack` without
replacing Meteor's SWC defaults.

For React Compiler, the Meteor 3.6-beta.0 pairing supports SWC; older pairings
can retain Babel. Read [compiler setup](references/build-refresh-and-testing.md#react-compiler)
for React-version targets and runtime requirements.

| Request | Owner |
|---------|-------|
| React detection, JSX or TSX, React Refresh boundary | This skill |
| General `rspack.config` helpers, SWC, aliases, cache, chunks | `meteor-modern-build-stack` |
| Convert an existing app or legacy build plugin to Rspack | `migrate-to-rspack` |
| Meteor-bundler HMR or custom `module.hot` lifecycle | Build skill, then this skill for React symptoms |

If edits reload the page or reset component state, first determine which
bundler compiled the module. In a Rspack client graph, inspect React Refresh
boundaries and avoid a second `react-fast-refresh` stack. In a Meteor-bundler
graph, verify `hot-module-replacement` and the bundled React Fast Refresh
integration. See `references/build-refresh-and-testing.md`.

## Mutations and tests

Call `Meteor.callAsync` from event handlers, model pending and rejection in
React state, and leave validation and authorization inside the method. Do not
write sensitive collections directly from a component.

For tests, separate a presentational component that accepts data as props from
the hook-owning container. Unit-test the former with the project's existing
React test library. Test the latter in a browser client with controlled
Minimongo or a real publication. Assert rendered behavior, not the number of
reactive-function calls, because React can discard work and invoke initial
render logic more than once.

## Anti-patterns

- Treat classic `isLoading` as a boolean. It is a function and must be called.
- Pass `Tasks.find().fetch()` to `useFind`. Return the cursor.
- Put a subscription inside a `useFind` factory. Subscribe separately.
- Call React state setters, methods, analytics, or arbitrary effects inside a
  `useTracker` reactive function.
- Force every classic component onto Suspense. Both surfaces remain useful.
- Reuse a generic Suspense key for unrelated mounted computations.
- Read a Tracker source only after `await` without restoring the computation.
- Add `@rspack/plugin-react-refresh` to project config when Meteor already
  injected it.
- Replace all Rspack SWC options to add one React transform. Extend them.
- Mock away all Meteor data behavior in a component integration test.

## Authoritative resources

- [Meteor React tutorial](https://docs.meteor.com/tutorials/react/)
- [`react-meteor-data` documentation](https://docs.meteor.com/packages/react-meteor-data.html)
- [`meteor/react-packages` source and changelog](https://github.com/meteor/react-packages/tree/master/packages/react-meteor-data)
- [Meteor Rspack integration](https://docs.meteor.com/about/modern-build-stack/rspack-bundler-integration.html)
- [React `createRoot`](https://react.dev/reference/react-dom/client/createRoot)
- [React Suspense](https://react.dev/reference/react/Suspense)
- `references/eval-cases.md`
