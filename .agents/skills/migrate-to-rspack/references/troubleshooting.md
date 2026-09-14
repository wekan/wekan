# Troubleshooting Rspack integration

## Preserve evidence first

Create a checkpoint. Reproduce with one exact command and record the build mode,
Meteor and integration versions, duration, exit status, first exception, and
expected artifact. Change one variable per attempt. Keep a change only when the
failure or a quantitative measurement improves, and revert disproven changes
before testing the next hypothesis.

## Startup failure and cache recovery

Meteor 3.5.2 stops promptly when Rspack cannot spawn, exits, or panics before
its first compilation. Read the preceding child-process error before retrying.
Older integrations can hang at this boundary; check the release before adding
timeouts or application startup delays.

After capturing the failure, if it identifies a stale or incompatible
persistent cache, stop the affected build processes and remove only the Rspack
cache (resolve a custom cache path before deleting anything):

```bash
rm -rf ./node_modules/.cache/rspack
meteor run
```

If that fails, inspect the new error before considering `meteor reset`.
Meteor 3's default reset preserves local Mongo; `meteor reset --db` and direct
deletion of `.meteor/local` do not. Never use either database-deleting form as
a routine build-cache fix. Preserve generated evidence before any reset.

## Memory crashes (OOM)

Rspack runs as a child process. Large apps may exhaust the default heap. First
distinguish a one-shot build failure from growth across a long watch session.
Inventory large directories beneath the app root and compare `.meteorignore`
with `.gitignore`. Check the exact Meteor/Rspack release for known fixes.

Meteor 3.4.1+:

```bash
TOOL_NODE_FLAGS="--max-old-space-size=16384" meteor run
```

Meteor 3.4.0:

```bash
NODE_OPTIONS="--max-old-space-size=16384" meteor run
```

`TOOL_NODE_FLAGS` propagates to Rspack and other Meteor tool processes.

As a separate experiment, disable Rspack's persistent cache when investigating
watch-mode growth:

```javascript
module.exports = defineConfig(Meteor => ({
  ...Meteor.setCache(false),       // or 'memory'
}));
```

Do not combine both changes initially. A heap increase is a temporary mitigation;
cache disabling trades rebuild performance for memory. Measure each separately.
If neither changes the retained-memory shape, capture a heap snapshot or Rspack
stats instead of stacking more configuration changes.

## Generated output differs from source

Meteor still assembles the final bundle after Rspack compiles app code. If only
production or a legacy web architecture fails, compare source, Rspack output,
the generated Meteor-facing module, and the final bundle. Identify the first
stage that introduces an invalid helper import or syntax before changing
application code or `.swcrc`. Check for a framework fix and reduce a reproducer
before keeping a pipeline workaround.

## CI and Docker

Error in CI or Docker:

```text
Could not find rspack.config.js, rspack.config.ts, rspack.config.mjs, or rspack.config.cjs
```

Check the app root, config file, resolved integration versions, and preceding
dependency warnings. An incomplete npm upgrade is one possible cause, not
proof from this error alone. Meteor 3.4.0 uses `@meteorjs/rspack` v1;
3.4.1 uses v2; 3.5.2 pairs `rspack@1.3.0` and `@meteorjs/rspack@2.2.0`.

In ordinary builds with `rspack@1.3.0`, `meteor.autoInstallDeps: false` suppresses installs but
retains minimum-version checks and manual commands. Resolve those commands
locally, preserving runtime versus dev dependency categories. Older opt-out
implementations can skip checks entirely. Automatic installation existed before
3.5.2; the shared manager and actionable opt-out warnings are the new behavior.

`meteor update --npm` explicitly requests dependency updates and overrides the
opt-out for that invocation without changing the stored flag. Run it during
local dependency preparation, not inside an immutable CI build.

Preferred fix: run the update locally, review it, and commit the lockfile:

The commands below apply to npm apps. For Meteor 3.6-beta.0, pnpm/Yarn
workspaces and the Rspack 1.x peer transition, use
[Rspack 1 to 2](rspack-2-upgrade.md). Preserve the detected manager and root
lockfile; do not create an app-local npm lockfile in a pnpm workspace.

```bash
meteor update --npm
meteor npm install
git add package.json package-lock.json
git commit -m "update rspack npm dependencies"
```

CI can then run `meteor npm ci` followed by the project's `meteor build`
command. Install dev dependencies in the build stage. Set the opt-out when
builds must not mutate dependencies; verify the clean build leaves the manifest
and lockfile unchanged. Do not suppress update/install failures. A separate
Docker stage needs the reviewed dependency files copied into it.

## thread-stream worker error

```text
Error: Cannot find module '/_build/main-dev/lib/worker.js'
```

`thread-stream`, commonly reached through logging stacks such as `pino`, loads
worker scripts via filesystem paths Rspack rewrites. Send it to Meteor:

```javascript
const { defineConfig } = require('@meteorjs/rspack');

module.exports = defineConfig(Meteor => ({
  ...Meteor.compileWithMeteor(['thread-stream']),
}));
```

The same pattern fixes other worker-loading or native deps. Use
`compileWithMeteor` for: native code (`sharp`), Atmosphere-package
internals, large precompiled deps.

## Multiple instances on one machine

Meteor 3.5.2 isolates development, normal-test and full-app-test module output
and mode-specific assets/chunks automatically. This prevents one mode from
cleaning another's output; it does not provide separate Meteor caches, local
Mongo data, or ports. Earlier integrations do not provide the same protection.

Set `METEOR_LOCAL_DIR` when processes need separate Meteor local state or run
the same mode. Its basename suffixes `_build`, `build-assets`, and
`build-chunks`, composing with 3.5.2's `-test` and `-app-test` asset suffixes.

```bash
PORT=3000 METEOR_LOCAL_DIR=.meteor/local-1 meteor run
PORT=3001 METEOR_LOCAL_DIR=.meteor/local-2 meteor run
```

Use distinct `RSPACK_DEVSERVER_PORT` values too if the derived ports collide.
Include all active suffixed outputs in external tools' ignore rules, but never
hide Meteor's generated entry modules in `.meteorignore`.

## Verbose mode

`package.json`:

```json
{
  "meteor": {
    "modern": { "verbose": true }
  }
}
```

Shows the final Rspack config (after `extendConfig` / `extendSwcConfig`
merges) and lists each `[Transpiler]` step. Use this to diagnose Babel
fallbacks and config overrides.

For deeper Rspack-side logging, set `stats` and `infrastructureLogging` in
`rspack.config.js`:

```javascript
module.exports = defineConfig(Meteor => ({
  stats: 'detailed',
  infrastructureLogging: { level: 'info' },
}));
```

## Blaze HMR (limitation)

Blaze compiles under Rspack but Meteor's Blaze HMR is not available with
the integration. Blaze edits trigger a full reload instead of an
in-place update. Page state resets. This is a known limitation, not a
config error. Other frameworks keep HMR.

## Reporting issues

Prepare a minimal reproduction with:

- Previous/target Meteor release, resolved `rspack`, `@meteorjs/rspack`,
  core/CLI/dev-server, relevant loaders/plugins/compiler versions, OS and the
  Node/package manager actually running the build.
- Exact command and mode, expected result, actual result and first complete
  error. Distinguish install, compile, startup, browser and production failures.
- Relevant app-owned configuration, dependency/lockfile diff and the smallest
  input that still fails. Remove credentials, private settings and unrelated
  application code before sharing.
- The default-configuration comparison, when feasible, and each attempted
  workaround with its result. Do not assign ownership until the failure is
  isolated; recurring tooling cases may still motivate Meteor improvements.

For successful migrations, report the modes and features actually exercised,
including any compatibility changes. Do not turn startup into an E2E claim.
Draft the report for review; posting it requires user authorization.

GitHub: https://github.com/meteor/meteor/issues  
Forums: https://forums.meteor.com

Compare before and after with `meteor profile`. Numbers help others
calibrate the migration cost.

---
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/about/modern-build-stack/rspack-bundler-integration.md
