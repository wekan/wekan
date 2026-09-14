---
name: migrate-to-rspack
description: >
  Use when migrating an existing Meteor app to Rspack (Meteor 3.4+), or
  upgrading Rspack 1 to 2 on Meteor 3.6 beta. Triggers on nested imports,
  mainModule entry points, server-only apps, replacing fourseven:scss /
  meteor/less / coffeescript / jorgenvatle:vite / zodern:melte with loaders,
  Svelte/TypeScript preprocessing or Lingui SWC plugin failures after upgrade,
  CommonJS default-import interop, module.exports in client graphs, Node
  built-ins in browser code, _build / build-assets / build-chunks,
  .meteorignore hiding handoff files, dynamic chunks under ROOT_URL,
  meteor.modules for CSS/HTML, resolve.symlinks or resolve.alias migration,
  automatic dependency updates and immutable CI/Docker builds.
  Use this skill when the user asks about migration compatibility or a build
  plugin's Rspack replacement. For new-app setup and rspack.config.js helpers,
  use meteor-modern-build-stack instead.
metadata:
  author: meteor
  kind: knowledge
  meteor: ">=3.4"
  area: migration
  tagline: "Migrate an existing Meteor 3 app to the Rspack bundler integration (`mainModule`, replacing legacy build plugins with loaders)."
  bundle: ["migration"]
  docs_synced_at: "2026-09-11"
license: MIT
---

# Migrate an existing app to Rspack

Rspack compiles app code; Meteor builds Atmosphere packages and assembles the
bundle. Keep packages, but audit their architecture and browser dependencies.

Prerequisite: Meteor 3.4+. Recommended before activation: enable
`"meteor": { "modern": true }` and fix Babel fallbacks. For setup and helpers,
use `meteor-modern-build-stack`.

Match `@meteorjs/rspack` to the Meteor release, not to
`@rspack/core` or `@rspack/cli`:

| Meteor | `rspack` | `@meteorjs/rspack` | Capability boundary |
|---|---|---|---|
| 3.4 | `1.0.0` | `1.0.0` | Base integration and helpers. |
| 3.4.1 and 3.5 | `1.1.0` | `2.0.1` | Adds v2 helpers and inherited `TOOL_NODE_FLAGS`. |
| 3.5.1 | `1.2.0` | `2.1.0` | Revised client polyfills and extension discovery. |
| 3.5.2 | `1.3.0` | `2.2.0` | Dependency diagnostics, mode isolation, full-app/TLA and cache fixes. |
| 3.6-beta.0 | `1.4.0-beta360.0` | `3.0.0-beta.1` | Rspack 2.2.0 and workspace-aware installs. |

The Atmosphere, Meteor npm integration, and Rspack core package versions are
independent. Inspect `.meteor/versions`, `package.json`, and the lockfile.
Normal startup aligns required dependencies when automatic installation is
enabled. Review and commit those changes. Explicit `meteor update --npm` is
an alternative, not an extra required step. Do not pair a newer integration
major with an older Meteor release to copy a helper.

Already using Rspack? For the Meteor 3.6 beta upgrade, follow
[Rspack 1 to 2](references/rspack-2-upgrade.md) and its toolchain checks.
Keep valid entries/configuration; skip the first-activation steps below.

## Decision flow

1. Does the app define client and server entry points in `package.json`
   `meteor.mainModule`? If no, define them. Required.
2. Trace the client and client-test graphs. Do they reach CommonJS export
   assignments, Node built-ins, server-only local package entries, or missing
   generated inputs in a clean checkout? If yes, repair the boundary before
   activation. See
   `references/client-graph-preflight.md`.
3. Does the app code contain nested imports (ES `import` inside an `if`,
   function, or other block)? If yes, move them to top level or convert
   them to dynamic `import()` / `require`. Required for app code; OK in
   Atmosphere packages.
4. Does the app rely on a Meteor build plugin (`less`, `fourseven:scss`,
   `coffeescript`, `zodern:melte`, `jorgenvatle:vite`)? Plan an Rspack
   loader replacement and prove capability parity before removal. See
   `references/framework-and-css.md`.
5. Does the app rely on bare default imports from CommonJS packages
   (`import x from "some-cjs"`)? Decide between rewriting to
   `import * as x` or restoring Meteor-style interop in `.swcrc`. See
   `references/code-migrations.md`.
6. Is the app server-only? Set only `mainModule.server`. Rspack still
   bundles the server; client is skipped.
7. Does the app keep CSS or HTML outside its entry folder, or import app-local
   symlinks? Preserve the boundary with `meteor.modules` or
   `resolve.symlinks: false`; see the references.
8. Run `meteor add rspack` and watch the verbose `[Transpiler]` log for
   remaining `(app)` failures.

## Required: entry points

```json
{
  "meteor": {
    "mainModule": {
      "client": "client/main.js",
      "server": "server/main.js"
    },
    "testModule": "tests.js"
  }
}
```

Without `mainModule`, Rspack has no entry. Meteor's eager-loading model
does not apply: Rspack does not auto-discover modules. See
`references/framework-and-css.md` for CSS and HTML routing.

## Required: no nested imports in app code

```javascript
// app code: NOT allowed under Rspack
if (condition) {
  import { a as b } from "./c";
  console.log(b);
}
```

Three fixes:

```javascript
// 1. Move to top
import { a as b } from "./c";
if (condition) console.log(b);

// 2. Dynamic import (standardized, supported)
if (condition) {
  const { a: b } = await import("./c");
  console.log(b);
}

// 3. require (CommonJS interop)
if (condition) {
  const { a: b } = require("./c");
  console.log(b);
}
```

Diagnose with verbose mode and look for `(app)` files failing with
`Error: 'import' and 'export' cannot be used outside of module code`.
`(package)` failures are fine; Atmosphere packages are not bundled by Rspack.

## Required: reserve build folders

The integration writes to `_build/`, `public/build-assets/`,
`public/build-chunks/`, `private/build-assets/`. Auto-added to `.gitignore`.
If the project already uses any of these names, rename in `package.json`:

```json
{
  "meteor": {
    "buildContext": "build",
    "assetsContext": "assets",
    "chunksContext": "chunks"
  }
}
```

Do not edit any file under those folders. Exclude them from IDE indexing and
from every recursive formatter, linter, typechecker, test-discovery, and
coverage scan. `.gitignore` does not configure those tools.

Do not match the active build context in `.meteorignore` or `METEOR_IGNORE`.
Rspack writes Meteor-facing entry modules there, then Meteor reads them to
assemble the final bundle. Resolve renamed contexts before auditing ignores.

## Replacing build plugins

Most app-file build plugins move to Rspack loaders. Prove capability parity
before removal; make conflicting activation and removal one reversible change.
See `references/framework-and-css.md`.

| Old plugin                | Replacement                                                          |
|---------------------------|----------------------------------------------------------------------|
| `meteor/less`             | `less-loader`. See `references/framework-and-css.md`.                |
| `fourseven:scss`          | `sass-loader` + `sass-embedded`. See refs. Skeleton in `meteor create --full`. |
| `meteor/coffeescript`     | `coffee-loader` (optionally chained with `swc-loader`).              |
| `zodern:melte` (Svelte)   | Official Rspack Svelte loader.                                       |
| `jorgenvatle:vite` (Vue/Solid) | Native Rspack Vue/Solid loaders.                                |
| `babel-plugin-react-compiler` | SWC on the 3.6 beta pairing; earlier integrations retain Babel. See framework reference. |
| `zodern:types`            | Still compatible. Keep it.                                           |

Plugins acting only on Atmosphere package files can stay. Plugins acting on
app-folder files (entry folder excluded) must move to Rspack.

## CommonJS default-import interop

Old Meteor accepted `import x from "some-cjs-lib"` for a `module.exports = ...`
package. Rspack + SWC do not by default. Two options:

```javascript
// preferred: switch to namespace import
import * as x from "some-cjs-lib";
```

Or restore interop in `.swcrc`:

```json
{
  "module": {
    "type": "commonjs",
    "noInterop": false,
    "importInterop": "node"
  }
}
```

This emits CommonJS, defeating tree-shaking and static analysis app-wide.
Migrate imports instead unless you cannot.

## CI and Docker

Resolve required npm updates locally and commit `package.json` and the lockfile.
Use the existing manager's frozen install with dev dependencies, then build.
On `rspack@1.3.0` (Meteor 3.5.2), `meteor.autoInstallDeps: false` still reports
missing/outdated dependencies and manual commands; earlier opt-out behavior
can skip those checks. Inspect the first dependency/config error and the actual
project root before choosing a fix. See `references/troubleshooting.md`.

## Anti-patterns

- Add Rspack before fixing Babel fallbacks. Find them with
  `"meteor": { "modern": { "transpiler": { "verbose": true } } }` and fix
  them while still on the optimization-only stack.
- Restore CJS interop globally in `.swcrc` to avoid migrating a handful of
  imports. Trades real bundle-size wins for short-term convenience.
- Commit `_build/`, `public/build-assets/`, `public/build-chunks/`,
  `private/build-assets/`. Autogenerated.
- Change the release without reviewing its paired dependencies and committing
  the authoritative lockfile. Validate a clean install and production build.

## See also

- `references/eval-cases.md`
- For setup, helpers, and `rspack.config.js` API: `meteor-modern-build-stack`.
