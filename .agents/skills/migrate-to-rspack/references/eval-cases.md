# Evaluation cases for `migrate-to-rspack`

## Case 1: nested-import diagnosis

Prompt: "After `meteor add rspack`, my build fails with `Error: 'import'
and 'export' cannot be used outside of module code` on `imports/app.js`.
What do I do?"

Pass if the agent identifies a nested import (an ES `import` inside a
conditional, function, or block), explains it is not standard syntax, and
shows the three fixes: move to top, dynamic `import()`, or `require`.
Bonus: mentions verbose mode for finding more `(app)` failures.

## Case 2: SCSS plugin replacement

Prompt: "I use `fourseven:scss` and want to add Rspack. How do I migrate
my SCSS?"

Pass if the agent removes `fourseven:scss` from `.meteor/packages`,
installs `sass-embedded` and `sass-loader`, and adds an SCSS rule to
`rspack.config.js` using `type: 'css/auto'` and the
`api: 'modern-compiler'` option. Bonus: notes that `meteor create --full`
on 3.4.1+ ships this exact setup.

## Case 3: default-import breaks after migration

Prompt: "After enabling Rspack, `import x from "some-cjs-lib"` returns
undefined. The package uses `module.exports = ...`. What changed?"

Pass if the agent explains that Rspack + SWC do not provide the old
Meteor default-import interop, and proposes `import * as x` as the first
fix. If the agent also explains the `.swcrc` `noInterop: false`
workaround, it must call out the tree-shaking cost.

## Case 4: CI cannot find rspack.config.js

Prompt: "Local builds work but Docker fails with `Could not find
rspack.config.js`. What's missing?"

Pass if the agent checks the project root, config file and earlier dependency
errors, treating an incomplete npm upgrade as a hypothesis. It should prefer
resolving required dependencies locally, committing `package.json` and the
lockfile, then using `meteor npm ci` with build-time dev dependencies in Docker.
Fail if it asserts the cause from this error alone or suppresses install errors.

## Case 5: server-only app

Prompt: "I have a background-worker Meteor app with no UI. Can I use
Rspack? How do I configure it?"

Pass if the agent confirms it works, shows a `package.json` with only
`mainModule.server`, and notes that Rspack will skip the client build
entirely.

## Case 6: integration major mismatch

Prompt: "I upgraded from Meteor 3.4 to 3.4.1 but kept
`@meteorjs/rspack@^1.0.0`. The config now fails in a clean build. Should I
align it with my `@rspack/core` major?"

Pass if the agent requires `@meteorjs/rspack` v2 for Meteor 3.4.1, explains
that Meteor 3.4.1 pairs `rspack@1.1.0` with `@meteorjs/rspack@2.0.1`, keeps its
version independent from core/CLI, and uses startup auto-install or explicit
`meteor update --npm` to update and commit the dependency files.

## Case 7: generated files break Biome

Prompt: "The app builds with Rspack, but `biome check .` now reports errors
inside `_build/main-dev`. The directory is already in `.gitignore`."

Pass if the agent explains that Git ignores do not necessarily configure
Biome and adds all active Rspack output folders to the tool's own ignore.
It should rerun Biome after a build.

## Case 8: cached migration passes, clean clone fails

Prompt: "Rspack works in my existing checkout, but a fresh clone cannot
start because an ignored settings file is missing. Is the migration done?"

Pass if the agent rejects the cached-checkout result, requires a tracked
nonsecret settings fixture or documented environment setup, and verifies
development, tests, E2E, production build, and clean Git status from a fresh
clone.

## Case 9: CommonJS assignment in the client graph

Prompt: "After Rspack, every page is blank. A helper imported through a shared
model uses `module.exports`, but the file lives outside `client/`. Server tests
pass. Should I enable global CommonJS interop?"

Pass if the agent traces reachability from the client entry, distinguishes this
from default-import interop, and either converts the reachable module to
consistent ESM or moves it behind a server boundary. Fail if it classifies the
file by pathname or changes `.swcrc` globally without inspecting the graph.

## Case 10: Node built-in enters the browser

Prompt: "The client build now fails on `crypto` and `stream`. The import comes
from a local Atmosphere package whose `api.mainModule('index.js')` contains
server lockout logic."

Pass if the agent inspects the package architecture, restricts the entry to
`server` when appropriate, and verifies a browser production smoke. Accept a
polyfill only when the behavior is intentionally browser-compatible.

## Case 11: `_build` added to `.meteorignore`

Prompt: "I copied generated paths from `.gitignore` into `.meteorignore`. Now
Meteor says it cannot find `_build/main-prod/server-meteor.js`."

Pass if the agent identifies `_build` as the Rspack-to-Meteor handoff, removes
the active build context from `.meteorignore`, checks renamed contexts, and
keeps the path ignored only by Git and unrelated recursive tools.

## Case 12: lazy chunks under a path prefix

Prompt: "The production app works at `/`, but under `ROOT_URL=https://host/app`
opening a lazy route requests `build-chunks/build-chunks/x.js`."

Pass if the agent tests a real dynamic import under the deployed URL prefix,
fixes the public base without making the import static, and verifies that the
chunk loads and executes.

## Case 13: server healthy, browser blank

Prompt: "The Rspack production bundle builds, starts, and returns HTTP 200, but
the browser page is blank. Can I call the migration complete?"

Pass if the agent rejects server health as sufficient, finds the first browser
module exception, inspects the client graph, and requires a browser smoke
against the extracted production bundle.

## Case 14: CSS outside the entry folder

Prompt: "After defining `client/main.js` for Rspack, a global stylesheet in
`styles/main.css` is no longer included. I need Meteor to keep compiling it and
do not want to import it through an Rspack loader."

Pass if the agent adds the stylesheet to `meteor.modules`, does not add
JavaScript there, and verifies the final stylesheet output. Bonus if it explains
that importing through an Rspack loader is the faster-HMR alternative.

## Case 15: app-local source symlink

Prompt: "My Meteor app imports `imports/shared` through a source-directory
symlink. Rspack resolves the real directory outside the app and breaks relative
imports. Should every pnpm workspace set `resolve.symlinks: false`?"

Pass if the agent distinguishes app-local source symlinks from package-name
workspace imports, sets `resolve.symlinks: false` only for the former, and
validates watching and production bundling from the consumer app.

## Case 16: CSS delegation depends on Meteor version

Prompt: "I configured `postcss-loader` while migrating a Meteor 3.4.0 app to
Rspack. Meteor and Rspack both emit the stylesheet. Should I add every generated
folder to `.meteorignore`?"

Pass if the agent identifies automatic stylesheet delegation as Meteor 3.4.1+
behavior, prefers upgrading, and uses only a narrow temporary stylesheet ignore
when 3.4.0 is an intentional constraint. It must protect the active build
context and verify the expected CSS appears exactly once in development and
production.

## Case 17: custom build plugin has hidden behavior

Prompt: "A custom Meteor build plugin compiles `.theme` files, copies fonts in
production, and injects an alias in tests. Rspack has a loader for `.theme`, so
can I remove the plugin now?"

Pass if the agent inventories all three capabilities, configures equivalent
Rspack behavior, and validates development, test, and production outputs before
removal. If the two pipelines conflict, it must use a checkpoint and one
reversible activation/removal change. Fail if it treats the matching extension
as complete parity or upgrades the UI framework unnecessarily.

## Case 18: ignored generated module in the client graph

Prompt: "Server tests pass, but a clean production client build cannot resolve
`./generated/schema.json`. The file is Gitignored and exists on developer
machines after another tool runs. Should I commit it?"

Pass if the agent traces the client and client-test graph, identifies and runs
the deterministic producer before every consuming path, and validates clean
test-mode and production client builds. It must not commit generated output
automatically. Fail if it accepts server tests as client compilation evidence.

## Case 19: successful test command runs no client tests

Prompt: "`meteor test --once` exits zero and reports six server tests, followed
by `browser client tests were not run`. The Rspack changes are client-only. Can
I merge?"

Pass if the agent requires a browser driver or browser-backed client suite,
checks expected suite counts, compiles the real test-mode client entry, and
retains a production browser smoke. Fail if it treats exit zero or server-only
tests as sufficient.

## Case 20: current helper copied into Meteor 3.4.0

Prompt: "A current Rspack example uses `Meteor.persistDevFiles`,
`Meteor.replaceSwcConfig`, and `Meteor.enablePortableBuild`. My migration is
fixed on Meteor 3.4.0. Can I paste those helpers?"

Pass if the agent identifies Meteor 3.4.1 and `@meteorjs/rspack` v2 as the
minimum for all three helpers, checks the resolved Atmosphere and npm package
versions, and either upgrades the paired Meteor integration or designs and
tests direct Rspack equivalents. Fail if it installs v2 alone or assumes
current `devel` helper availability applies to Meteor 3.4.0.

## Case 21: cache panic with valuable local data

Prompt: "Meteor 3.5.2 Rspack exits before its first compile and reports an
incompatible persistent cache. I have valuable data in local Mongo. Give me
the smallest recovery step."

Pass if the agent preserves the first error, stops affected build processes,
resolves and clears only the Rspack cache, and retries. It may escalate to
`meteor reset` only after checking its release behavior. Fail if it deletes
`.meteor/local`, uses `--db`, disables cache permanently, or raises heap limits
without evidence of OOM.

## Case 22: cache recovery on an earlier integration

Prompt: "Our Rspack migration must remain on Meteor 3.4.0. The first compile
hangs after a child-process error. Can I rely on the 3.5.2 fail-fast behavior
and delete .meteor/local to reset it?"

Pass if the agent captures the child error, identifies the later fail-fast fix,
honors the pinned release, and protects local Mongo. It checks reset semantics
or chooses targeted cache recovery only when cache evidence supports it.

## Case 23: upgrade with immutable CI dependencies

Prompt: "We migrated to Meteor 3.5.2 and opted out of npm auto-install. A
clean Docker build lists outdated Rspack dependencies. Prepare the dependency
workflow without letting CI rewrite our lockfile."

Pass if the agent checks the 1.3.0/2.2.0 integration pairing and reported
minimums, resolves and reviews the dependency files locally, preserves runtime
helpers and build-time dev dependencies, and verifies a clean immutable build.

## Case 24: Rspack 2 config migration

Prompt: "Upgrade our Meteor 3.5.2 Rspack app to 3.6-beta.0. Its config uses experiments.css, experiments.cache, output.libraryTarget, webpack-merge, and .swcrc. What must change?"

Pass if the agent: Uses the beta package pairing, removes obsolete CSS experiment, moves cache top-level, reviews library.type while preserving Meteor output, replaces webpack-merge with rspack-merge, and preserves Meteor wrapper .swcrc discovery despite raw Rspack 2 behavior.
Fail if it contradicts these boundaries or invents unsupported commands.

## Case 25: npm peer transition warning

Prompt: "On Meteor 3.6-beta.0 autoInstallDeps is false and installed Rspack core/CLI/React Refresh are 1.x. The printed npm update command hits old peer constraints. Should we set legacy-peer-deps globally?"

Pass if the agent: Rejects a global bypass, verifies the coordinated Rspack 2 transition, permits a scoped npm --legacy-peer-deps invocation for confirmed old peers, and notes the beta manual warning may omit the flag. Does not apply the flag to pnpm or Yarn.
Fail if it contradicts these boundaries or invents unsupported commands.

## Case 26: preserve an existing Workbox migration

Prompt: "We are moving an existing Meteor app to the 3.6 beta Rspack pairing. It uses a Workbox-generated service worker. Must we discard it for the new Blaze PWA scaffold?"

Pass if the agent: Treats Workbox as optional but valid, inventories generation and cache/update behavior, proves migration parity, and does not overwrite the existing app or promise offline data.
Fail if it contradicts these boundaries or invents unsupported commands.

## Case 27: automatic upgrade of an existing Rspack app

Prompt: "Our existing Meteor 3.5.2 app already uses Rspack and automatic npm installation is enabled. Upgrade to 3.6-beta.0. Must we run meteor update --npm separately, re-add rspack, or regenerate our working config?"

Pass if the agent gives the release update then normal `meteor run`, explains
startup's paired dependency update, and reviews/commits the resulting version
files and authoritative lockfile. It keeps valid entries/configuration and
checks custom tooling separately. Fail if it requires the extra npm command,
re-adds Rspack or promises automatic rewriting of all custom configuration.

## Case 28: beta startup with deliberate auto-install opt-out

Prompt: "We are upgrading our Rspack app to Meteor 3.6-beta.0, but meteor.autoInstallDeps is false and CI must never rewrite dependencies. Will normal startup still upgrade everything? Give the local preparation and CI boundary."

Pass if the agent respects the opt-out, prepares the coordinated dependency
set locally, reviews and commits changes, then uses the existing manager's
frozen install with build-time dev dependencies. It explains that explicit
`meteor update --npm` overrides the opt-out for that invocation. Fail if it
silently enables auto-install, mutates locks in CI or treats opt-out as success
despite unresolved required dependencies.

## Case 29: Svelte preprocessing after the beta upgrade

Prompt: "After upgrading to Meteor 3.6-beta.0/Rspack 2, a Skeleton Svelte component fails during TypeScript preprocessing. We use svelte-loader and svelte-preprocess with PostCSS. Our tsconfig has extends and path aliases. What can we learn from Complex Todos without replacing our build setup?"

Pass if the agent checks resolved compiler/loader/preprocessor versions and
the first error, describes the example's Svelte update and TypeScript dev
dependency/configuration, and merges relevant `target`/`verbatimModuleSyntax`
options while preserving existing settings. It retains needed PostCSS and
verifies an affected component and CSS in development and production. Fail if
it treats observed versions as universal minimums, overwrites the config or
migrates the app to Vite/SvelteKit.

## Case 30: Lingui plugin major differs from the application toolchain

Prompt: "On Meteor 3.6-beta.0 with @rspack/core 2.2.0, our builtin:swc-loader fails loading @lingui/swc-plugin 5.11.0. The other Lingui tools are 5.x. Should I update only @swc/core, remove the plugin, or upgrade every Lingui package to 6? Notes Offline changed the plugin to 6.7.0."

Pass if the agent identifies Rspack's embedded SWC as the relevant host,
checks resolved plugin/runtime compatibility, and treats the example's
plugin update as a candidate rather than a universal pin. It preserves
required macro transforms, explains independently versioned tooling, and
verifies representative transformed and translated output. Fail if any of the
three proposed shortcuts is presented as sufficient without that evidence.

## Case 31: newer example fix on a pinned older compiler

Prompt: "Our Meteor 3.5.2 app must keep Rspack 1 for now. Lingui builds correctly. Should we copy Notes Offline's @lingui/swc-plugin 6.7.0 upgrade to prepare for Meteor 3.6?"

Pass if the agent preserves the working release/integration pairing, rejects
a speculative plugin upgrade and requires compatibility with the actual
resolved compiler before any later change. Fail if it treats the PR's plugin
version as a Meteor-wide floor or silently moves this app to Rspack 2.

## Case 32: raw Rspack 2 advice versus Meteor configuration

Prompt: "The Rspack 2 guide says its packages are pure ESM, dev-server is explicit, and resolve.roots defaults to empty. After upgrading our Meteor app to 3.6-beta.0, should I replace our working CommonJS rspack.config.js with a standalone ESM config and rebuild all resolution rules? Our host CI image still uses Node 18."

Pass if the agent distinguishes host Node from Meteor's build runtime,
checks Rspack 2's supported Node floor, preserves valid Meteor CommonJS
configuration/output and notes that Meteor supplies dev-server and project
roots. It inspects effective configuration and custom overrides before
changing resolution. Fail if it assumes raw defaults replace Meteor's values,
converts the project to ESM unconditionally or ignores the old host runtime.
Also fail if it calls host Node 18 the proven build blocker without checking
whether the command uses Meteor's supported bundled Node instead.

## Case 33: beta feedback without overstating validation

Prompt: "All five examples in PR #50 started, so can we say every plugin and offline/production behavior is verified? My beta app still fails in a custom loader. Help me prepare feedback; do not post anything."

Pass if the agent limits the PR claim to reported migration/startup, requires
the affected feature and applicable production/offline checks, and drafts a
redacted reproduction checklist with releases, resolved toolchain, runtime,
config, command/mode, expected/actual result and first error. It distinguishes
base integration from app tooling without assigning unproven blame. Fail if
it claims tests were run, dismisses all plugin issues as outside Meteor, or
posts a report.

## Case 34: new-app setup is not a migration

Prompt: "I'm creating a new Meteor 3.6-beta.0 app, not upgrading an existing one. I need the initial Rspack setup and an explanation of defineConfig versus extendConfig. Which skill owns this?"

Pass if the agent selects `meteor-modern-build-stack` for setup/configuration
helpers, reserving `migrate-to-rspack` for existing-app migration compatibility.
Fail if it requires a legacy-plugin removal or Rspack 1-to-2 migration first.

## Case 35: a working older plugin on Rspack 2

Prompt: "We use Rspack 2.2.0 and @lingui/swc-plugin 5.11.0. A simple macro compiles and renders correctly. Must we upgrade to 6.7.0 because Notes Offline did? Does our smoke prove its reported failure was wrong?"

Pass if the agent rejects both inferences: it preserves compatible working
tooling without a speculative upgrade and limits the smoke to its actual
input/mode. It requires reproduction through the affected JSX/catalog/loader
path and applicable development/production checks before a broader claim.
Fail if it declares all plugin 5.x versions broken on Rspack 2, forces the
example pin, or dismisses a different project's failure from this one smoke.
