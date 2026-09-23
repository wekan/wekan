# Evaluation cases for `meteor-react`

## Case 1: create a current JavaScript React app

Prompt: "Create the baseline for a new Meteor 3 React app."

Pass if the agent uses `meteor create --react`, inspects the generated client,
server, test, package, and Rspack files for the selected release, and mounts one
root with `createRoot` inside `Meteor.startup`. Fail if it reconstructs an old
skeleton from memory without inspecting generated state.

## Case 2: create a TypeScript React app

Prompt: "I want Meteor, React, TypeScript, and Rspack from the start."

Pass if the agent uses `meteor create --typescript`, preserves `.tsx` and `.ts`
entry points plus `rspack.config.ts`, and inspects generated type and SWC config.
Fail if it creates JavaScript first and renames files without updating entries.

## Case 3: loading never finishes

Prompt: "`const loading = useSubscribe('tasks')`; `if (loading)` always shows
my spinner."

Pass if the agent calls `loading()`, explains that classic `useSubscribe`
returns a function, and keeps the classic import. Bonus if it notes that the
call opts into readiness reactivity.

## Case 4: `useFind` warns about a cursor

Prompt: "Why does `useFind(() => Tasks.find().fetch())` warn and rerender every
row?"

Pass if the agent returns the cursor without `.fetch()`, keeps subscription
ownership in `useSubscribe`, and explains stable unchanged document references.

## Case 5: list prop changes but query does not

Prompt: "My `useFind` list stays on the previous `listId`."

Pass if the agent includes `listId` in the cursor factory and dependency array.
Fail if it adds a changing subscription inside the cursor factory.

## Case 6: side effect fires twice

Prompt: "An analytics call inside `useTracker` fires twice in development. Is
Tracker broken?"

Pass if the agent removes arbitrary side effects from the reactive function,
models them in a commit-owned React effect if needed, and explains that React
can discard or replay initial render work. Fail if it suppresses the duplicate
with a global flag.

## Case 7: measured `useTracker` optimization

Prompt: "A complex Minimongo aggregate is expensive. How should I retain its
computation and skip irrelevant updates?"

Pass if the agent first includes captured inputs in `deps`, measures the
render, and uses a narrow `skipUpdate` comparator where true means skip. Fail if
it deep-compares the entire result by default.

## Case 8: keep a class component

Prompt: "A stable class component uses `withTracker`. Must I rewrite it before
upgrading `react-meteor-data`?"

Pass if the agent verifies the installed package, notes current v4's
development deprecation warning, and allows a focused later hooks migration.
Fail if it rewrites the component during unrelated work without behavior tests.

## Case 9: adopt Suspense safely

Prompt: "Switch this task list from classic hooks to Suspense."

Pass if the agent changes the import and signatures, adds a Suspense fallback
and error boundary, treats `useSubscribe` as a statement, supplies a stable
tracker key where needed, and uses the collection plus find-argument tuple for
Suspense `useFind`.

## Case 10: consume a Suspense subscription handle

Prompt: "TypeScript says Suspense `useSubscribe` returns a handle, so I call
`.stop()` on it. Runtime returns null."

Pass if the agent identifies the current declaration/runtime mismatch, stops
consuming the return, and verifies the exact installed package version. Fail if
it type-casts the null value to a handle.

## Case 11: reactive read after `await`

Prompt: "My Suspense `useTracker` calls a method, then `fetchAsync`, but it
never reruns when Minimongo changes."

Pass if the agent accepts the computation argument and wraps the reactive read
after `await` in `Tracker.withComputation(computation, ...)`. Fail if it wraps
only the earlier nonreactive method call.

## Case 12: duplicate React Refresh plugin

Prompt: "My Rspack config manually adds `@rspack/plugin-react-refresh`, and
updates now run twice."

Pass if the agent confirms React detection and removes the manual duplicate
from the Rspack graph while retaining Meteor's generated dependencies. It
should distinguish `hot-module-replacement` for Meteor-owned modules.

## Case 13: state resets on every edit

Prompt: "Rspack rebuilds quickly, but editing this React component resets its
state."

Pass if the agent identifies the compiling graph, checks the first console
error and refresh-boundary export shape, separates unrelated side effects, and
does not promise state preservation for every edit.

## Case 14: React-specific Rspack rule

Prompt: "Add SVG imports as React components to the generated Meteor React
app."

Pass if the agent extends the generated `defineConfig` with an SVGR rule scoped
to JSX or TSX issuers and preserves Meteor's defaults. Route general aliases,
chunking, or output configuration to `meteor-modern-build-stack`.

## Case 15: component integration test

Prompt: "Test a React task list that uses `useSubscribe` and `useFind`."

Pass if the agent separates presentational and hook-owning coverage, runs the
integration in a browser client with Tracker and Minimongo or a real
publication, unmounts the component, and asserts DOM state instead of exact
reactive-function call counts.

## Case 16: server tests only

Prompt: "My React-only Rspack change passes six server tests, but the runner
says browser client tests were not run. Is that enough?"

Pass if the agent requires a browser driver, verifies client suite counts and
the test entry graph, and retains a production browser smoke.

## Case 17: publication authorization

Prompt: "Can I hide other users' tasks by filtering them only inside
`useFind`?"

Pass if the agent says no, routes authorization and field projection to
`meteor-pubsub`, and treats the component query only as a local view.

## Case 18: Meteor 2 React migration

Prompt: "Upgrade this React app from Meteor 2 and convert all data hooks."

Pass if the agent routes the framework upgrade to `migrate-to-meteor-3`, then
uses this skill for the chosen React target. Fail if it forces Suspense as a
Meteor 3 requirement.

## Case 19: Preact project

Prompt: "Meteor's Rspack integration detected Preact. Should I add React
Refresh packages manually?"

Pass if the agent does not apply the React bundle blindly, notes that Meteor
skips React-specific dependencies when Preact is present, and routes general
Preact build work to `meteor-modern-build-stack`.

## Case 20: raw HTML

Prompt: "Render this user-provided HTML with `dangerouslySetInnerHTML`."

Pass if the agent routes sanitization and CSP review to `meteor-security` and
does not treat React escaping as protection after opting into raw HTML.

## Case 21: Suspense on an older package line

Prompt: "This Meteor 3 app pins `react-meteor-data@2.6.3`. Add the Suspense
`useFind` import from the current docs without changing dependencies."

Pass if the agent inspects `.meteor/versions`, says the Suspense entry point
begins in 2.7.0 and official Meteor 3 compatibility begins in 3.0.0, and
requires an upgrade before using the current API. It should prefer a tested
3.0.0+ version, with current examples verified against 4.0.1. Fail if it
assumes the Meteor 3 release supplies every package feature.

## Case 22: React 19 SWC compiler

Prompt: "Our Meteor 3.6-beta.0 app has the paired Rspack packages and React 19. Enable React Compiler without a second Babel pass."

Pass if the agent: Uses extendSwcConfig and jsc.transform.reactCompiler true with automatic React runtime, preserves Meteor defaults, and verifies production/component/refresh behavior without adding duplicate transforms.
Fail if it contradicts these boundaries or invents unsupported commands.

## Case 23: React 18 compiler target

Prompt: "We upgraded the build to Meteor 3.6-beta.0 but must retain React 18. Can SWC React Compiler work without a React major upgrade?"

Pass if the agent: Keeps React 18, selects target 18 and react-compiler-runtime, verifies installed dependencies, and does not force React 19 or copy the React 19 boolean setting alone.
Fail if it contradicts these boundaries or invents unsupported commands.

## Case 24: older compiler near miss

Prompt: "This app stays on Meteor 3.5.2 with its paired Rspack packages and Babel React Compiler. Can we simply delete Babel and set jsc.transform.reactCompiler true?"

Pass if the agent: Rejects assuming the new SWC path exists in the old pairing, retains the required Babel transform or requests a scoped paired upgrade, and inventories other Babel plugins.
Fail if it contradicts these boundaries or invents unsupported commands.
