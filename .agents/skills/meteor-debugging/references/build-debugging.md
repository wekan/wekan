# Build debugging

Read this reference when the failure occurs before the spawned server runs, or
when build, rebuild, bundle size, memory, SWC, or Rspack behavior is unclear.

## Separate tool from server

`--inspect` and `--inspect-brk` target the spawned server process, not the
Meteor tool or bundler. Start with:

1. Complete build output and the earliest error.
2. `.meteor/release`, `.meteor/versions`, `.meteor/packages`, `package.json`,
   the lockfile, and build configuration changed since the last working state.
3. `meteor run --verbose` for build output hidden by normal formatting.
4. One profile or build-specific log source selected below.

## Blaze compile errors in the browser

During `meteor run`, the development proxy's `Meteor App - Error` page
includes the tool log. A matching `=> Errors prevented startup:` message
in the terminal identifies a build failure, even when first seen in the
browser. Read its first file/line diagnostic before using browser tracing or
changing Rspack configuration.

| Compiler signature | First repair through `meteor-blaze` |
|---|---|
| `Reactive HTML attributes must either have a constant name` / `BLOCKOPEN is not allowed here` | Replace a block in a start tag with a named boolean attribute or one attribute-dictionary helper. |
| `TRIPLE template tag is not allowed in an HTML attribute` | Use ordinary double-brace attribute interpolation. |
| `Expected "li" end tag` | Close the list items explicitly. |
| `Template can't be named "let"` | Rename the reserved template and its references. |

Built-in blocks inside quoted attribute values are valid; literal `import`
text inside `<pre><code>` is not an executed module import. Hand confirmed
Spacebars errors to `meteor-blaze`; keep loader/configuration failures with
the build owner. Verify startup and rendering after the template repair.
Evidence: [development proxy error page](https://github.com/meteor/meteor/blob/4c94e92457c06cb73082a8d59908257bf6b518d1/tools/runners/run-proxy.js).

## Profile by Meteor release

Meteor 3.0 and 3.1 use the earlier build timing output:

```bash
METEOR_PROFILE=1 meteor
```

Meteor 3.2+ adds `meteor profile`:

```bash
meteor profile --build
meteor profile --size-only
```

Compare the same release, dependency state, architecture, command, and warm or
cold cache. A single profile does not prove the cause. Change one variable and
repeat.

## Debug output and source maps

```bash
meteor build ../build --debug
```

This creates unminified output and preserves source maps. Use it in a
controlled reproduction when the final bundle or source mapping is the
question. Do not deploy it as an incident-response shortcut.

## Modern stack and Rspack

Inspect the resolved `rspack` Atmosphere package and `@meteorjs/rspack` npm
versions before selecting an API. Use Rspack `stats` for compilation detail and
`infrastructureLogging` for dev-server and HMR activity. Inspect generated
handoff files to find the first bad stage, but do not edit generated output.

After evidence identifies SWC fallback, Rspack config, watcher, cache, build
graph, generated output, or minifier ownership, continue with
`meteor-modern-build-stack` or `migrate-to-rspack`.

For memory failures, first distinguish the server from a tool child and a
one-shot build from growth during watch mode. Meteor 3.4.1+ can pass a measured
tool heap change through `TOOL_NODE_FLAGS`; Meteor 3.4.0 uses `NODE_OPTIONS` for
the Rspack child. Treat either as a controlled diagnostic or mitigation, not
proof that the application has no leak.

Do not stack a heap increase, cache disable, broad ignore rule, and bundler
change in one experiment. The result cannot identify which variable mattered.

Meteor 3.5.2 fails promptly if Rspack exits or panics before its first compile.
Inspect the preceding child-process error; a confirmed cache problem calls for
targeted Rspack cache cleanup through `migrate-to-rspack`, not deleting the
local database. `rspack@1.3.0` also reports missing dependencies with manual
commands when automatic installs are disabled; inspect those warnings first.

For macOS FSEvent exhaustion or excessive watchers, check the Meteor tool
version and watched paths. Meteor 3.5.2 stops watching immutable package
warehouse files. Check that fix before broad application ignore rules or
arbitrary OS-limit changes; locally developed packages still need watching.

## HMR rejection and missing Rspack assets

On Meteor 3.4.4, 3.5.5 and 3.6.1, rejected HMR registration requires checking
that the tool and generated client share the current app ID and run secret,
including `web.cordova`. Rebuild/reconnect a stale client; do not log secrets,
trust Origin alone or bypass the handshake. Malformed messages can close this
development socket; distinguish it from DDP and native hot code push. Earlier
tools lack this hardening. Rspack's non-native bootstrap restriction still applies.

For Rspack static assets on older release lines, inspect these backports:

| Meteor | `rspack` | `webapp` |
|---|---|---|
| 3.4.4 | 1.1.1 | 2.1.4 |
| 3.5.5 | 1.3.2 | 2.3.1 |

These pairs retain Rspack 1 and fix stale asset resolution and response headers
after rebuilds. Missing assets return a non-cacheable 404 instead of app HTML.
Check that the asset exists, then compare URL/prefix, status, content type and
cache headers before/after rebuilding. For older packages, inspect a compatible
patch before changing bundlers, disabling HMR or editing generated manifests.

## SWC native binding cache

For a resolved SWC carrier distribution that unpacks its native addon,
distinguish `ERR_SWC_NATIVE_CACHE` from a stale Meteor or
Rspack build cache. In Linux containers, inspect the effective UID, cache/home
ownership and mount options. Use an absolute cache directory owned and writable
by that container user on an executable filesystem, for example:

```bash
SWC_NATIVE_BINDING_CACHE=/tmp/meteor-swc-native meteor
```

Verify the actual filesystem permits addon execution; a writable `noexec`
mount still fails. Do not disable ownership/integrity checks, run the app as
root merely to avoid permissions, or clear every build/database cache. A
relative override is invalid. The 3.6 dependency minimum `@swc/core@1.16.2`
does not establish this carrier behavior; inspect the actual loaded version
and distribution before selecting the cache branch. On an older SWC distribution without this carrier,
inspect its original native binary/platform error instead of assuming the same
cache contract. See the modern build skill's SWC cache guidance.
After correcting the cache, rerun the same binding load/build path as the
effective container user to confirm the failure is resolved.

## Meteor 3.6 dependency and development boundaries

These changes start in Meteor 3.6 and its paired packages. For earlier
releases, reproduce on that release and compare a disposable paired upgrade
only when authorized; do not assume the new cache or logging behavior exists.

| Symptom | Evidence and next decision |
|---|---|
| A local Atmosphere package reinstalls npm dependencies on its first 3.6 build | Inspect its committed `.npm/package/npm-shrinkwrap.json`. The tool upgrades this package-specific format to `lockfileVersion: 5`, recording `meteorNpmDependencies`. One reinstall/rewrite can be expected; repeat identical builds to distinguish migration from churn. Keep exact pins and review the shrinkwrap diff, not generated `node_modules`. |
| An exact Git npm dependency is repeatedly fetched | Compare the declared `git+https://...#v<semver>` spec, recorded source, and installed resolved tree. The cache requires agreement; it does not make branch refs immutable. Do not change the dependency to a floating ref as a cache fix. |
| Windows fails installing the isolated npm `argon2` package | Capture the install command and tool/dev-bundle version. The 3.6 dev bundle adds `cross-env` to that isolated environment. Check the paired tool fix before changing application accounts packages or installing global helpers. |
| Rspack assets return 502 or the development WebSocket closes | In the Meteor 3.6 integration, proxy logs identify the assets versus WS scope, error code, method, request, and target. Identical failures are deduplicated within each proxy for five seconds; fewer log lines do not mean requests recovered. Every failed HTTP request still gets 502 and failed sockets close. Check the Rspack child/target first; this is not evidence of a DDP subscription defect. |
| HMR client is absent from a native app or `meteor build` output | The Meteor 3.6 bootstrap is for development web app runs, not tests, native targets, or build output, even with `NODE_ENV=development`. Verify command and target before adding a refresh client manually. |
| SWC reports a temporary cache-write failure during cleanup | Meteor 3.6 catches asynchronous writes; missing temporary paths (`ENOENT`/`ENOTDIR`) are non-fatal and other errors warn in verbose mode. Reproduce compilation separately. Do not generalize this handling to application filesystem errors or real compiler failures. |

Meteor 3.6 includes these fixes:

| Symptom | Version evidence and verification |
|---|---|
| TypeScript/Rspack server repeatedly restarts without an app edit | Check `rspack@1.4.0` and `@meteorjs/rspack@3.0.0` together. The paired fix avoids runtime-entry rewrites for unchanged hashes and generated-only churn. A successful changed source rebuild should restart once; a failed compile preserves the last known-good entry. Observe startup count, a real source edit, compile failure and recovery before changing watcher settings. Do not edit `_build` markers or ignore the handoff directory. |
| `--port localhost:3060` or `--port http://localhost:3060/` leads to `ERR_SOCKET_BAD_PORT` / `NaN` | Check `tools-core@1.4.0`, which extracts the numeric port before deriving the Rspack port. Preserve valid host/URL syntax on the fixed version. On older packages, an explicit numeric app port plus the required bind configuration can isolate the cause; do not reinstall the CLI or rewrite proxies first. |
| `--inspect` dumps full Rspack configuration repeatedly | The 3.6 npm integration prints full configuration only in verbose mode. Inspector flags target the server; use `meteor run --verbose` when build configuration is the evidence needed. |

Native declaration generation is separate from transpilation. On Meteor 3.6,
`meteor types` can skip for a direct `zodern:types` dependency or missing root
config; `meteor run` does not generate native declarations. Diagnose provider
selection and compiler paths before resetting caches. For an upgrade, use
`migrate-to-meteor-3`'s TypeScript reference.

Meteor 3.6 also includes the following fixes:
For an upgrade comparison, use fresh disposable local data or complete the
retained-data preflight under the previous release before 3.6 starts.

| Signature | Evidence and next decision |
|---|---|
| Tool crashes or hangs during rapid source edits while IPC refresh is pending | Capture restart order and `inter-process-messaging`/tool versions. 3.6 tolerates shutdown races and does not block future restarts waiting for an old child. Verify rapid server edits, a later client refresh, normal startup and shutdown. Do not suppress every IPC exception or disable hot code push. |
| Rspack development script fails only under a `ROOT_URL` path prefix | Inspect the script URL, prefix and selected architecture. 3.6's `boilerplate-generator@2.2.0` includes the prefix in the dev script URL. Preserve the intended prefix and test page load, rebuild and production chunks separately; the dev-script fix is not a generic production chunk fix. |
| Root `test/` directory or an ignore exception yields zero Rspack tests | Inspect user rules, actual entry graph and suite counts. 3.6's paired tool/integration separates root-scoped generated excludes from user rules and refreshes source-scan rules. Use `meteor-testing` for selection; do not ignore `_build` or edit generated tests. |

For local MongoDB startup immediately after a 3.6 upgrade, inspect server
version/FCV and host libraries before cache cleanup. Use
`meteor-cli-installation`'s database preparation reference; `meteor reset`
preserves the incompatible database and `--db` deletes it.

Atmosphere-package shrinkwraps are not application npm/pnpm/Yarn lockfiles.
Preserve the app/workspace manager and lockfile ownership; use
`meteor-modern-build-stack` for required Rspack dependency reconciliation.
Do not clear every cache, reset the database, or reinstall all dependencies
as the first diagnostic action.

---
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/about/modern-build-stack/rspack-bundler-integration.md
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/cli/index.md
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/generators/changelog/versions/3.5.2.md
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/generators/changelog/versions/3.6.0.md
