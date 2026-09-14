---
name: meteor-modern-build-stack
description: >
  Use when configuring or tuning the Meteor 3 modern build stack: SWC
  transpiler, SWC-based minifier, modern @parcel/watcher, web-arch skipping
  in development, .meteorignore, and the Rspack bundler integration via the
  rspack Atmosphere package. Triggers on package.json "meteor": { "modern":
  true }, .swcrc, swc.config.js, [Transpiler] Used Babel Fallback logs,
  rspack.config.js, rspack.config.ts, defineConfig from @meteorjs/rspack, Meteor.compileWith*
  helpers, Meteor.extendConfig, Meteor.extendSwcConfig vs Meteor.replaceSwcConfig,
  Meteor.splitVendorChunk, Meteor.persistDevFiles, Meteor.disablePlugins,
  Meteor.enablePortableBuild, HtmlRspackPlugin customization,
  RSPACK_DEVSERVER_PORT, TOOL_NODE_FLAGS, pnpm workspaces, Rspack 2,
  skeleton selection, PWA, Workbox and service-worker build setup.
  Use this skill when the user asks about SWC vs Babel or Rspack configuration.
  Route existing-app bundler migration to migrate-to-rspack, Blaze PWA
  scaffolding to meteor-blaze, and jam:offline data to meteor-community-packages.
metadata:
  author: meteor
  kind: knowledge
  meteor: ">=3.3"
  area: build
  tagline: "Configure the Meteor 3 modern build stack (SWC transpiler/minifier, `@parcel/watcher`, web-arch skipping, Rspack integration)."
  bundle: ["essentials"]
  docs_synced_at: "2026-09-11"
license: MIT
---

# Modern build stack

The modern build stack is two independent tracks. Enable either or both.

1. **Meteor Bundler Optimizations** (Meteor 3.3+). One flag, SWC replaces
   Babel, SWC minifier replaces Terser, `@parcel/watcher` replaces the
   legacy watcher, development skips legacy archs.
2. **Rspack Bundler Integration** (Meteor 3.4+). Atmosphere package
   delegates app-code compilation to Rspack. Tree shaking, ESM, code
   splitting via HTTP, modern bundler plugins.

Standard current `meteor create` application skeletons ship both enabled.
Purposefully small or compatibility-oriented skeletons, including `minimal`
and `legacy`, may omit Rspack or the modern flag. Inspect the generated
`package.json` and `.meteor/packages` instead of inferring features only from
the Meteor version. For existing apps, enable optimizations first, then add
Rspack once the app code is standards-clean.

## Enable Meteor Bundler Optimizations

Add to `package.json`:

```json
"meteor": {
  "modern": true
}
```

This enables SWC, the SWC minifier, the modern watcher, and dev-mode web
arch skipping. Each falls back to legacy when something is incompatible, so
this is backward compatible.

Opt out of pieces:

```json
"meteor": {
  "modern": {
    "transpiler": false,
    "minifier": false,
    "watcher": false,
    "webArchOnly": false
  }
}
```

Or scope SWC: `transpiler.excludeApp`, `transpiler.excludeNodeModules`,
`transpiler.excludePackages`, `transpiler.excludeLegacy`. Accept `true` or
an array of paths/regexes.

Verbose transpiler logs to diagnose Babel fallbacks:

```json
"meteor": {
  "modern": {
    "transpiler": { "verbose": true }
  }
}
```

Look for `[Transpiler] Used Babel for <file> Fallback`. The common cause is
nested imports; see `references/meteor-bundler-optimizations.md`.

## Enable Rspack integration

```bash
meteor add rspack
```

On first run the package installs the project-level Rspack setup. App code
moves to Rspack; Meteor still handles Atmosphere packages and produces the
final bundle. Requires entry points in `package.json` and no nested imports
in app code. To migrate an existing app, use the `migrate-to-rspack` skill.

Inspect `.meteor/versions`, `package.json`, and the lockfile. Meteor
3.6-beta.0 pairs `rspack@1.4.0-beta360.0`, `@meteorjs/rspack@3.0.0-beta.1`
and Rspack 2.2.0; 3.5.2 retains the 1.3.0/2.2.0 integration pairing.
See [release pairings](references/rspack-config.md) and
[3.6 dependencies and workspaces](references/meteor-3.6-workspaces.md).
For Rspack 1-to-2 config migration, use `migrate-to-rspack`.

## Scaffolds, PWA and offline behavior

For new-app skeleton selection or framework-neutral PWA/Workbox setup, read
[scaffolds and service workers](references/scaffolds-and-pwa.md).
Meteor 3.6 (verified on `3.6-beta.0`) adds separate `--pnpm` workspace and
`--pwa` Blaze starters; neither converts an existing app. A worker caches
shell/assets, not offline Meteor data. Existing bundler migrations remain
owned by `migrate-to-rspack`.

## SWC config files

```text
.swcrc > swc.config.js > swc.config.ts
```

Only the first found is used. Use `.swcrc` for static config, `swc.config.js`
for environment-driven config. The file name must be exactly `.swcrc`, not
`config.swcrc`.

Install `@swc/helpers` to externalize SWC helpers (smaller bundles):

```bash
meteor npm install --save @swc/helpers
```

New apps ship with this preinstalled. Normally no further setup is needed;
Meteor's pipeline detects it and emits imports instead of inlining. If only a
production or legacy bundle fails on a helper import, inspect Rspack-generated
and final Meteor output before changing `.swcrc` or adding manual imports.

## Rspack config files

```text
rspack.config.js | rspack.config.ts | rspack.config.mjs | rspack.config.cjs
```

Use `defineConfig` from `@meteorjs/rspack`. The function receives a
`Meteor` parameter with build flags and helpers. See
`references/rspack-config.md` for the full table and the most useful
helpers (`extendSwcConfig`, `compileWithRspack`, `compileWithMeteor`,
`extendConfig`, `splitVendorChunk`, `persistDevFiles`, `disablePlugins`,
`enablePortableBuild`, `setCache`).

## .meteorignore

Skip directories the bundler does not need to watch. Same syntax as
`.gitignore`. Place at any depth; rules apply to the subtree.

```gitignore
docs/
design/
cypress/
scripts/
*.md
!README.md
```

For per-command rules, set the `METEOR_IGNORE` env var.

Do not copy `.gitignore` into `.meteorignore` blindly. Exclude unrelated large
trees that Meteor does not need, but never match the active Rspack build context:
Meteor consumes its generated main and test modules during final assembly.

Rspack also generates `_build/`, `public/build-assets/`,
`public/build-chunks/`, and `private/build-assets/`. Include active suffixed
variants such as `build-assets-test` and `build-chunks-app-test` on Meteor
3.5.2, plus custom context names. Add those paths to the
native ignore configuration of recursive formatters, linters, typecheckers,
test discovery, coverage, and IDEs. `.gitignore` alone is insufficient.

## Minifier ownership

`"modern": true` selects Meteor's modern standard minifier. A third-party
Atmosphere package that provides the JavaScript minifier remains part of the
final Meteor assembly even when Rspack compiles app modules. Inventory custom
minifier packages before migration. Keep or remove one only after comparing
production output, source maps, build time, and runtime behavior.

## Production legacy builds

Dev skips `web.browser.legacy` and `web.cordova` with `"modern": true`.
Production still ships legacy by default. To drop legacy in production
too, add `modern` to `.meteor/platforms`:

```text
server
browser
modern
```

## Memory limits

Rspack runs as a child process and may OOM on large apps. Raise the heap
for tool processes temporarily when capturing evidence (Meteor 3.4.1+):

```bash
TOOL_NODE_FLAGS="--max-old-space-size=16384" meteor run
```

On Meteor 3.4.0, use `NODE_OPTIONS="--max-old-space-size=16384"`.

First distinguish a one-shot build failure from growth during a long watch
session. Audit large directories visible to Meteor and check the exact release
for fixes. Test heap size and persistent cache as separate variables; revert a
change that does not improve the failure or a measured memory trend.

## Multiple instances

Meteor 3.5.2 separates development, normal test, and full-app test output
within one context (`_build/main-dev`, `_build/test`, `_build/app-test`, plus
mode-suffixed assets/chunks). This does not isolate Meteor caches, local Mongo,
or ports. For separate local state or two instances of the same mode, use
distinct ports and `METEOR_LOCAL_DIR` values; older integrations also need this
for cross-mode output isolation:

```bash
PORT=3000 METEOR_LOCAL_DIR=.meteor/local-1 meteor run
PORT=3001 METEOR_LOCAL_DIR=.meteor/local-2 meteor run
```

## Anti-patterns

- Enable optimizations and Rspack at the same time on a legacy app. Enable
  `"modern": true` first, clean up Babel fallbacks, then add Rspack.
- Edit files inside `_build/`, `public/build-assets/`,
  `public/build-chunks/`, or `private/build-assets/`. Autogenerated.
- Assume `.gitignore` prevents code-quality tools from scanning generated
  Rspack output. Configure each tool's own ignore mechanism.
- Copy `.gitignore` to `.meteorignore`. Git may ignore Rspack's generated
  handoff even though Meteor must read it.
- Remove a custom Atmosphere minifier only because Rspack is enabled.
  Benchmark the final production bundle first.
- Disable Rspack persistent cache without need. It is the default and the
  main rebuild-speed win. Disable only when investigating OOM or a
  cache-related Rspack bug.
- Name an SWC config `config.swcrc` or `rc.swc`. Only `.swcrc` is read.

## See also

- `references/meteor-bundler-optimizations.md`
- `references/rspack-config.md`
- `references/eval-cases.md`
- For converting an existing app to Rspack: `migrate-to-rspack` skill.
