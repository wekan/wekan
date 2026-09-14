# Scaffolds and service workers

Choose framework, workspace layout and offline requirements separately.
Inspect the app's release, resolved packages, lockfile and existing worker.
Enabling `meteor.modern` or adding Rspack does not itself make an app a PWA.

## Choose a starting point

These starters are documented for `3.6-beta.0`. Check the selected release's
[CLI documentation](https://docs.meteor.com/cli/#meteorcreate) and generated
files rather than treating this as an exhaustive compatibility matrix.

| Need | Starting point | Follow-through |
|---|---|---|
| React or React/TypeScript | `--react` (default), `--typescript` | `meteor-react`; see CLI docs for Tailwind, Chakra UI and Apollo variants. |
| Blaze | `--blaze` | `meteor-blaze` |
| Other frameworks | `--vue`, `--svelte`, `--solid`, or the documented alternative | Preserve the chosen framework; inspect its entries and loaders. |
| pnpm workspace | Meteor 3.6+: `--pnpm` | [Workspace ownership](meteor-3.6-workspaces.md); app at `apps/app`, shared packages under `packages/`. |
| New Blaze PWA | Meteor 3.6+: `--pwa` | `meteor-blaze`, `references/pwa-scaffold.md`: dependency-free worker, manifest, offline page. |
| Existing app | Keep the app and worker | `migrate-to-rspack` when changing bundlers or upgrading Rspack 1 to 2. |

Starter flags are not composable feature switches. `--pnpm` does not add
offline support; `--pwa` is not a React/workspace modifier. Smaller starters
such as `--minimal` may omit Rspack. `meteor create --list` lists examples,
not skeleton flags. Never scaffold over an existing app.

Meteor 3.5.2 and earlier do not have these new `--pnpm`/`--pwa` starters.
Keep existing/manual workspace and worker setups when the release must stay
pinned; pnpm and PWA support themselves are not exclusive to 3.6.

## Framework-neutral PWA build setup

Workbox and app-owned workers are framework-neutral. Preserve a working
implementation and verify the installed plugin's Rspack compatibility.

For Meteor 3.4.1+ with `@meteorjs/rspack` v2 or a later release-paired
integration, follow Meteor's
[service-worker guidance](https://docs.meteor.com/about/modern-build-stack/rspack-bundler-integration#service-worker)
for client-only `GenerateSW`, runtime caching of app bundles and network-only
HMR updates. Adapt asset/chunk matching and caching to the app.

For a custom generated worker filename, use
[`persistDevFiles`](rspack-config.md#persistdevfiles-meteor-341) with the
`once` strategy; default `sw.js` is already handled. Rewriting workers on each
rebuild can defeat HMR. Production output is written normally. On Meteor
3.4.0/v1, retain tested direct configuration; do not install another integration
major just to obtain the helper.

Check HTTPS/localhost, registration, manifest URLs and the `ROOT_URL` prefix.
Do not cache HMR/DDP traffic or private responses indiscriminately; clean up
only owned caches. A root `/sw.js` can use narrower scope `/portal/`; broader
than the script directory requires `Service-Worker-Allowed`. See the browser
[scope rules](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerContainer/register#scope)
before moving a worker or rewriting a working scaffold's prefix.

## Notes Offline: two separate offline layers

[Notes Offline at the reviewed examples PR #50 revision](https://github.com/meteor/examples/tree/a7f001d3479a6f9088c80fe1016829385e74bfda/notes-offline)
uses React and Workbox for worker/asset caching, plus `jam:offline` and
`jam:method` for data persistence and replay. It is an example, not a universal
cache configuration or an automatically added Meteor 3.6 capability.

Use `meteor-community-packages` and its `references/offline.md` for
selective persistence, replay and logout cleanup. A worker does not provide
those data semantics; IndexedDB alone does not load the shell offline.

Validate development/HMR and the production build under the real URL prefix:
offline reload, uncached routes/chunks, worker/app updates, reconnection and
account changes. Test data replay separately. Startup is not offline evidence.

---
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/cli/index.md
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/about/modern-build-stack/rspack-bundler-integration.md
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/community-packages/offline.md
