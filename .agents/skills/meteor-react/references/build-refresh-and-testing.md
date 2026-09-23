# React build, refresh, and testing

## Generated application contract

Create from the selected Meteor release, then inspect the result:

```bash
meteor create --react my-app
meteor create --typescript my-ts-app
```

Current JavaScript React skeletons use:

```text
client/main.jsx
server/main.js
tests/main.js
rspack.config.js
```

Current TypeScript skeletons use `.tsx` and `.ts` entries, a
`rspack.config.ts`, `swc.config.ts`, `tsconfig.json`, Meteor package types, and
a Rspack type-checking plugin. Both skeletons declare `meteor.mainModule`,
`meteor.testModule`, and `meteor.modern` in `package.json`.

Do not paste dependency versions from documentation into an older app. Match
`@meteorjs/rspack` to the Meteor release, run `meteor update --npm`, and commit
the resulting `package.json` and lockfile changes.

## React-specific Rspack behavior

The Meteor Rspack package currently recognizes React when `react` exists in
the app's npm dependencies and `preact` does not. It then:

- enables JSX for JavaScript entries or TSX for TypeScript entries;
- configures the SWC React transform;
- keeps `react` and `react-dom` external to the Rspack app bundle;
- ensures `@rspack/plugin-react-refresh` and `react-refresh` are installed;
- injects the refresh plugin only for client development runs.

The generated JavaScript config adds only an SVGR rule:

```javascript
const { defineConfig } = require("@meteorjs/rspack");

module.exports = defineConfig(() => ({
  module: {
    rules: [{
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: ["@svgr/webpack"],
    }],
  },
}));
```

Keep this project layer limited to real application needs. Use
`Meteor.extendConfig` for composable Rspack fragments and
`Meteor.extendSwcConfig` for a narrow SWC change. Do not use
`Meteor.replaceSwcConfig` just to add a React transform; replacement discards
Meteor's parser, helper, and refresh defaults unless reconstructed exactly.

## React Compiler

Meteor 3.6-beta.0 pairs Atmosphere `rspack@1.4.0-beta360.0` with npm
`@meteorjs/rspack@3.0.0-beta.1` and Rspack 2.2.0. Beta.1 pairs
`rspack@1.4.0-beta360.1` with `@meteorjs/rspack@3.0.0-beta.2` and retains
that Rspack minimum. Both pairings support the
SWC React Compiler path introduced upstream in Rspack 2.1. Inspect the resolved
packages and React major before selecting it. Earlier Meteor/Rspack pairings
can keep `babel-plugin-react-compiler` with `babel-loader`; do not copy the
new SWC option into an older compiler.

For React 19:

```javascript
const { defineConfig } = require("@meteorjs/rspack");

module.exports = defineConfig((Meteor) => ({
  ...Meteor.extendSwcConfig({
    jsc: {
      transform: {
        react: { runtime: "automatic" },
        reactCompiler: true,
      },
    },
  }),
}));
```

For React 17 or 18, install `react-compiler-runtime` with the project's package
manager and use `reactCompiler: { target: "17" }` or `{ target: "18" }`.
Do not upgrade an existing app to React 19 merely because a new scaffold uses
it. Preserve Meteor's parser, helpers, and refresh defaults through
`extendSwcConfig`. Do not compile the same modules with both compiler paths.

Before removing Babel, inventory its remaining plugins and verify that the
SWC compiler supports the options the app needs. Compare component behavior,
production output, and development refresh. Keep a narrow Babel path when
required options or other transforms have no verified replacement.

## Two HMR graphs

Rspack compiles application modules. Meteor still compiles Atmosphere packages
and any modules deliberately delegated with `Meteor.compileWithMeteor`.

| Module owner | Refresh mechanism |
|--------------|-------------------|
| Rspack client graph | Rspack HMR plus `@rspack/plugin-react-refresh` |
| Meteor bundler graph | `hot-module-replacement` plus Meteor's React Fast Refresh integration |

Current Rspack React skeletons include `hot-module-replacement` for the second
graph. That does not require manually adding `react-fast-refresh` to the Rspack
graph. Identify the module owner before changing packages.

Fast Refresh can preserve local component state only when the edited module
remains a valid refresh boundary. If state resets or a full reload occurs:

1. Inspect the first client console or build error.
2. Confirm whether Rspack or Meteor compiled the edited module.
3. Keep component modules focused. Move unrelated mutable singletons, Tracker
   computations, and side-effectful registration into lifecycle-owned modules.
4. Verify component export shape and hook order did not change.
5. Remove duplicate refresh plugins or manual `module.hot.accept()` code added
   without a specific non-React resource owner.

Never use refresh as resource cleanup. Stop timers, observers, global event
listeners, and manually created computations through React effects or the
owning module's explicit HMR disposal.

## React-specific test shape

Use `meteor-testing` for runner and browser-driver setup. This reference only
owns React integration behavior.

Split components when possible:

```jsx
export function TaskListView({ loading, tasks }) {
  if (loading) return <p>Loading...</p>;
  return <ul>{tasks.map((task) => <li key={task._id}>{task.title}</li>)}</ul>;
}

export function TaskListContainer({ listId }) {
  const isLoading = useSubscribe("tasks.byList", listId);
  const tasks = useFind(() => Tasks.find({ listId }), [listId]);
  return <TaskListView loading={isLoading()} tasks={tasks} />;
}
```

Test `TaskListView` with the React test library already selected by the
project. Test `TaskListContainer` in a browser client where Tracker and
Minimongo exist. Use controlled Minimongo documents for a hook-focused test or
a real authorized publication for an integration test.

Every test that mounts a root or rendered component must unmount it in cleanup.
Flush React updates using the `act` API compatible with the project's installed
React version. Do not hardcode an import copied from a different React major.

Assert user-visible state:

- loading before subscription readiness;
- empty after ready with zero documents;
- rows update when Minimongo changes;
- rejected method or Suspense Promise reaches error UI;
- unmount stops owned work and prevents later state updates.

Do not assert that a reactive function or effect ran exactly once. Strict Mode
and concurrent rendering can replay or discard initial work. Test the committed
DOM and resource cleanup instead.

## Test-mode build checks

The client test entry is a separate Rspack graph. A green server-only run does
not prove JSX or TSX client compilation. In CI:

1. Configure a browser driver.
2. Confirm expected client suites and assertions ran.
3. Exercise the real `meteor.testModule` entry.
4. Retain a production browser smoke for build-only differences.

Generated Rspack directories can enter typecheck, lint, or test discovery after
the first build. Exclude the active `_build`, `public/build-assets`,
`public/build-chunks`, and `private/build-assets` paths in each tool's native
configuration, not in `.meteorignore`.

---
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/about/modern-build-stack/rspack-bundler-integration.md
