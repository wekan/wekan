# Rspack 1 to 2 in Meteor

Use this branch for Meteor 3.6, verified on `3.6-beta.0`, with
`rspack@1.4.0-beta360.0` and `@meteorjs/rspack@3.0.0-beta.1`.
Meteor 3.5.2 keeps `rspack@1.3.0`, `@meteorjs/rspack@2.2.0` and Rspack 1.x.
Do not force Rspack 2 into a constrained older release.

## Upgrade the coordinated dependency set

1. Checkpoint `.meteor/release`, `.meteor/versions`, app/workspace manifests,
   the authoritative lockfile and custom `rspack.config.*`.
2. With default `meteor.autoInstallDeps` enabled, update then start normally:

   ```bash
   meteor update --release 3.6-beta.0
   meteor run
   ```

   Startup checks and updates the required Rspack project dependencies. A
   separate `meteor update --npm` is unnecessary. Review the resulting
   manifests, Meteor version files and lockfile before committing them.
   If `meteor.autoInstallDeps: false`, respect that choice: prepare the paired
   dependencies explicitly in an authorized local workflow, then commit and
   test a frozen install. `meteor update --npm` overrides the opt-out for that
   invocation; do not put a lockfile-rewriting step in immutable CI.
3. The beta's required npm minimums are core/CLI/dev-server 2.2.0, Meteor integration
   3.0.0-beta.1, SWC core 1.15.32, helpers 0.5.23 and Rsdoctor 1.5.9.
   Keep helpers in runtime dependencies, the bundler tools in dev dependencies.
   Detected React adds refresh plugin 2.0.0 and refresh runtime 0.17.0.
   Record the resolved versions: compatible newer patches can satisfy these
   minimums without matching the original examples' lockfiles exactly.
4. With npm and installed Rspack 1.x peers, the automatic upgrade uses
   `--legacy-peer-deps`. The beta's manual warning can omit it. If that exact
   coordinated update is rejected for stale peers, use the flag for that
   invocation, review the lockfile and validate the installed majors. Do not
   use `--force`, a global peer bypass or a flag copied into pnpm/Yarn.
5. Keep pnpm/Yarn workspace ownership. Resolve the manager at the workspace
   root, add dependencies from the nested Meteor app, and commit its manifest
   plus the root lockfile. Preserve intentional local dependency protocols.

## Review app-owned overrides

Meteor composes its base integration configuration and creates a default file
if none exists. It does not rewrite an existing `rspack.config.*` or migrate
every third-party loader/plugin. Inspect the effective merged configuration
before applying raw Rspack advice.

| Existing customization | Action on the beta pairing |
|---|---|
| `experiments.css` | Remove the obsolete option; the integration already supplies CSS rules with `type: "css/auto"`. Test CSS Modules and loader output. |
| `experiments.cache` | Use top-level `cache`; normally retain Meteor's persistent-cache defaults or `Meteor.setCache(false)` for a measured diagnostic. |
| `output.libraryTarget` | The upstream form is `output.library.type`, but Meteor owns final output. Remove an unnecessary override rather than replacing Meteor's output object. |
| `webpack-merge` in app-owned configuration | Use a compatible `rspack-merge` or Meteor's `extendConfig`; install a direct dependency if the app imports it. Preserve nested rules. |
| Missing TypeScript re-export diagnostic | Meteor defaults `module.parser.javascript.exportsPresence` to `"warn"` for SWC-stripped type exports. Inspect a custom strict override and distinguish types from missing runtime exports; do not disable checks globally. |
| `.swcrc`, `swc.config.js`, `swc.config.ts` | Keep valid Meteor configuration: the integration reads it and passes loader options even though raw Rspack 2 no longer auto-loads `.swcrc`. |
| Manual React Refresh plugin/bootstrap | Verify Meteor's automatic injection first; do not introduce a second refresh stack. |

Also check these [upstream migration boundaries](https://www.rspack.dev/guide/migration/rspack_1.x):

| Surface | Migration check |
|---|---|
| Node and ESM | Rspack 2 requires Node `^20.19.0 \|\| >=22.12.0`. Meteor 3.6-beta.0 bundles Node 24.15.0; host Node 18 alone does not prove a Meteor build incompatibility. Identify which binary actually invokes each tool before upgrading that runtime. Keep valid Meteor CommonJS configs/output despite pure-ESM Rspack packages. |
| Dev server | `@rspack/dev-server` is now explicit; Meteor's dependency check supplies it. Review custom `devServer.proxy` and `watchFiles` against the v2 guide before reusing old shapes. |
| Resolution | Upstream changes cover `.wasm` extension lookup, CSS `@import` conditions and empty `resolve.roots`. Meteor supplies explicit extensions and project roots. Inspect `resolve.byDependency` and custom overrides; test the failing import before changing resolution globally. |
| Custom plugins | Review the plugin's Rspack 2 support and the [2.0 breaking-change overview](https://www.rspack.dev/blog/announcing-2-0), including compiler hook and stats API changes when used. |

Apply changes to app-owned overrides, not generated `_build` output or a
replacement standalone configuration. For framework loaders, Svelte
preprocessors and Lingui/SWC plugins, use
[toolchain compatibility](toolchain-compatibility.md).

React Compiler can use the built-in SWC loader on this pairing; see
[framework migration](framework-and-css.md). Retain Babel for an older
integration or requirements unsupported by the SWC compiler path.

## Prove the result

Use `meteor npm ci` for an npm lockfile, `pnpm install --frozen-lockfile` at
the pnpm workspace root, or the installed Yarn version's frozen/immutable
install. Keep dev dependencies in the build stage. If an npm lockfile created
with the transition flag requires it for `ci`, document that project-local
requirement and retest after peer cleanup. Do not convert managers to fix CI.

Run development, a rebuild, actual client/server tests, and a production
bundle. Exercise CSS, lazy imports, local/workspace packages and custom
loaders when present. Boot the extracted bundle and load the browser page.
Follow the [validation matrix](validation-matrix.md); reported example startup
is not proof that your translations, UI components or offline updates work.
For a failure, capture the [migration report](troubleshooting.md#reporting-issues)
before applying another workaround.

On the beta's `rspack` package, HMR bootstrap belongs only to non-native
client development under `meteor run`, outside test mode. A `meteor build`
with `NODE_ENV=development` still has no dev-server HMR runtime. Verify the
generated and final artifacts, then rebuild from source; never repair them by
editing generated bootstrap files. Native HCP is a separate workflow.

---
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/about/modern-build-stack/rspack-bundler-integration.md
