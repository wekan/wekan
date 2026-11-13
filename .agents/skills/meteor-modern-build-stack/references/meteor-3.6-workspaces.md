# Meteor 3.6 dependencies and workspaces

Workspace integration starts with Meteor 3.6. Select the
[release pairing](rspack-config.md); `tools-core` and `rspack` both resolve
to 1.4.0. Inspect the manifest and workspace lockfile. Earlier 3.x releases
retain their manually managed workspace setup.

## Rspack 2 dependency set

Meteor 3.6 pairs Atmosphere `rspack@1.4.0` and `tools-core@1.4.0` with npm
`@meteorjs/rspack@3.0.0`. Inspect the actual release and resolved packages.

| Package | Meteor 3.6 minimum | Category |
|---|---|---|
| `@meteorjs/rspack` | `3.0.0` | Development |
| `@rspack/core`, `@rspack/cli` | `2.2.7` each | Development |
| `@rspack/dev-server` | `2.2.1` | Development |
| `@swc/core` | `1.16.2` | Development |
| `@rsdoctor/rspack-plugin` | `1.6.4` | Development |
| `@swc/helpers` | `0.5.23` | Runtime |
| React only: `@rspack/plugin-react-refresh`, `react-refresh` | `2.0.2`, `0.19.0` | Development |

The Meteor npm integration's major 3 is distinct from Rspack's major 2.
`swc-loader` is not selected by the dependency manager; add a compatible
version only for an actual app-owned loader path. Later Meteor releases
require their resolved pairing.

Automatic installation updates the coordinated set. With
`meteor.autoInstallDeps: false`, inspect the warnings and prepare the changes
locally with the detected manager. `meteor update --npm` explicitly overrides
the opt-out for that invocation; keep it out of immutable CI builds.

On npm apps with installed Rspack 1.x core, CLI, or React Refresh peers,
the coordinated automatic transition uses `--legacy-peer-deps`. The manual npm
command includes it. If the reported dependency update fails with the confirmed
old-peer conflict, apply the flag only to that coordinated npm install and
verify the resulting tree. Do not set a global npm option, add the flag to
pnpm/Yarn, or suppress unrelated peer errors. Prove the locked CI install
works; if that lockfile requires the same npm flag, document it in that app's
CI command and revisit it after the transition.

## Create a pnpm workspace

```bash
meteor create --release 3.6.1 --pnpm my-workspace
cd my-workspace
meteor npm start
```

Inspect the generated structure:

```text
package.json                  # packageManager pin and root scripts
pnpm-workspace.yaml
pnpm-lock.yaml
apps/app/.meteor/release       # Meteor commands target this app
apps/app/package.json          # app dependencies and workspace:* links
packages/domain/              # shared npm package
packages/server-tools/        # server-only npm package
packages/ui/                  # client npm package
```

Creation installs through pnpm, using Corepack when available. A global pnpm
installation is not required when Corepack can supply the pinned version.
`meteor npm start` runs the root script; it does not make npm the workspace's
dependency manager. Run direct Meteor commands from `apps/app`.

For a Meteor 3.5.2 or earlier app that must stay pinned, do not use `--pnpm`
or promise the new detection. Keep its established workspace and manager,
prepare dependencies explicitly, and verify linked imports and builds.

## Preserve installation ownership

1. Find the workspace root, root `packageManager`, workspace manifest and
   lockfile. The root manager takes precedence over the nested app's hint.
2. Install app dependencies from the Meteor app directory with that manager,
   so the app manifest and shared workspace lockfile change together. Do not
   add them to the root manifest or create a competing `package-lock.json`.
   If conflicting hints or lockfiles already exist, inspect their history and
   preserve local changes before selecting an authority. Do not delete an
   existing lockfile or `node_modules` merely because npm was mentioned.
   pnpm can legitimately create `apps/app/node_modules` links; a shared root
   lockfile does not require a root-only `node_modules` tree.
3. Keep `file:`, `link:`, `portal:` and `workspace:` declarations when they
   are intentional. Check the actual installed package version and linkage;
   the protocol text is not a semver range. Repair missing links or an
   incompatible source version instead of replacing every link with a
   registry dependency.
4. npm, pnpm and Yarn can auto-install. Other declared managers receive
   manual guidance without automatic mutation. A failed pnpm/Yarn executable
   can fall back to Corepack; inspect its error rather than switching managers.
5. Review both manifests and the authoritative lockfile, then use a frozen
   install from the workspace root in CI: `pnpm install --frozen-lockfile`,
   `yarn install --immutable` for modern Yarn, or the project's npm workflow.
   Yarn Classic uses `--frozen-lockfile`. Include build-time dev dependencies.

Keep default symlink resolution for packages imported by name. Only an
app-local source symlink that needs its apparent location calls for
`resolve.symlinks: false`. Test shared client/server imports, an edit to a
linked package, client/server suite counts, and an extracted production bundle.

Move the bundle outside the checkout and test used workspace `.bin` commands
and adjacent resource reads without source access. 3.6 repairs copied
command links, including cross-workspace links; verify older tools explicitly.
Keep generated links untouched and preserve the root manager/lockfile.

## Test selection and generated ignores

These rules apply to the Meteor 3.6 pairing. Earlier integrations need
their supported test-discovery workflow.

| Rule source | Decision |
|---|---|
| `.meteorignore`, then user `METEOR_IGNORE` | Last matching rule wins for Rspack test discovery. `!` can re-include a file only when its parents remain included. |
| Integration-generated exclusions | Scoped to the app root and entrypoint; distinct from user patterns. A root `test/` folder must not hide `_build/test/`. Do not set private `METEOR_IGNORE_*` variables to repair this. |
| Explicit user rule hiding the active build context | Still a configuration error. Keep Meteor-facing generated entries readable. |
| Edited ignore file during watch | 3.6 invalidates the cached source scan. Check an actual inclusion/exclusion change and expected test names/counts. A zero-test exit is not success. |

Use `meteor-testing` for setup. On a constrained earlier integration, use a
verified explicit test entry/import graph when eager discovery fails; keep
production source loading unchanged.

---
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/about/modern-build-stack/rspack-bundler-integration.md
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/cli/index.md
