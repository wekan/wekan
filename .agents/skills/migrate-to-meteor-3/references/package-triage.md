# Atmosphere package triage

Atmosphere packages are the largest single source of friction in a 2.x to
3.x migration. Many are unmaintained, depend on Fibers, or pin
`api.versionsFrom('1.x')`. Decide for every package: replace, fork, or remove.

## Triage matrix

| Situation                                                    | Action                                                            |
|--------------------------------------------------------------|-------------------------------------------------------------------|
| Maintained package with a 3.x-compatible release             | Update.                                                           |
| Maintained package, no 3.x release yet                       | Open an issue. Track on the project tracker.                      |
| Unmaintained package, npm replacement exists                 | Replace. Move the call sites to the npm API.                      |
| Unmaintained package, no replacement, source available       | Fork. Apply minimal changes to ship on 3.x.                       |
| Unmaintained package, no replacement, you do not need it     | Remove. Inline the small piece you depended on.                   |

## Before the framework upgrade

1. Save `.meteor/packages`, `.meteor/versions`, `package.json`, and the npm
   lockfile as a resolution checkpoint.
2. Inventory `.meteor/packages`. List every non-core package.
3. Look up each on Packosphere or its GitHub repo. Note the latest version
   and whether it ships a 3.x release.
4. For packages with no 3.x release, search community forks. Several
   ecosystem groups maintain community forks of common Atmosphere packages.
5. For packages still missing, decide replace vs fork vs remove now,
   before the framework flip.

Review the resolved version diff after every package operation. Keep critical
schema, accounts, router, collection-hook, and build-plugin major upgrades in
separate commits when possible. If behavior changes after the release flip,
first determine whether the responsible package version changed too.

Reducing the package footprint **before** running `meteor update --release=3`
is the single biggest predictor of a smooth upgrade.

## Resolve a stable target completely

When moving from a prerelease to a stable target, compare declarations in
`.meteor/release`, `.meteor/packages`, and `package.json` with resolved versions
in `.meteor/versions` and the npm lockfile. Remove only unintended resolved
prereleases. Keep one only for a documented capability absent from the stable
target. Run `meteor update --npm` when supported and verify a clean locked
install does not change manifests or silently restore a prerelease. Do not fold
unrelated dependency major upgrades into this cleanup.

## Forking a package

```bash
# clone the source somewhere
git clone <repo-url> lib/<package-name>
cd lib/<package-name>
git checkout -b migrate-to-meteor-3

# link from your app's packages/ folder
cd /path/to/app/packages
ln -sf ../lib/<package-name>/path/to/package <package-name>
```

Inside the cloned package, edit `package.js`:

```javascript
Package.describe({
  name: '<package-name>',
  version: '<bump>',
  /* ... */
});

Package.onUse(function (api) {
  api.versionsFrom(['2.x', '3.0']);                  // dual-version
  api.use([
    'ecmascript',
    'mongo@1.16.0 || 2.0.0',                         // multi-version refs
    /* ... */
  ]);
  api.mainModule('main.js');                         // optional modular entry point
});
```

Common edits inside the package code:

- Server-side sync Mongo: rewrite to `*Async`.
- `Meteor._sleepForMs` and Fibers helpers: rewrite to native async.
- Implicit globals at file top level: convert to `const` or `export`.

## Package API decisions

`api.addFiles`, `api.export`, and `api.mainModule` all remain supported in
Meteor 3. Do not convert a package only to satisfy the framework version.
Choose `api.mainModule` when the package benefits from an explicit import
tree and module exports. Retain `api.addFiles` for ordered or build-plugin
sources and `api.export` when consumers still rely on package globals.

Actual migration replacements include:

| Removed or changed in 3.x | Replacement                        |
|---------------------------|------------------------------------|
| `_ensureIndex`            | `createIndexAsync` on the server   |
| `HTTP.get`                | `meteor/fetch` or native `fetch`   |
| Sync Mongo methods        | `*Async` siblings on the server    |

## Custom validators in package methods

Schemas validators that pre-3 packages bundled often need an upgrade for
breaking changes in major versions (typically array shorthand and decimal
options). Keep the schema definitions next to the collection definitions
so a single audit pass covers them.

## Known replacements

Common Atmosphere packages that have a community-blessed 3.x successor:

| Was                                 | Replace with                                       |
|-------------------------------------|----------------------------------------------------|
| `kadira:flow-router`                | `ostrio:flow-router-extra`                         |
| `percolate:synced-cron`             | `quave:synced-cron`                                |
| `aldeed:collection2` (1.x/2.x)      | `aldeed:collection2@4.0.0` (bundles `aldeed:simple-schema`; drop the npm `simpl-schema` dep) |
| `mquandalle:jade`                   | Removed. Migrate templates to Blaze HTML or another templating package. |
| `simple:json-routes` / Restivus     | `WebApp.handlers` with Express routes (see `webapp-express.md`). |
| `tmeasday:publish-counts`           | `compat:publish-counts` (community fork)           |
| `meteor/http` (`HTTP.get`/`post`)   | `meteor/fetch` or native `fetch`                   |
| `underscore` (Atmosphere)           | Native ES `Array` / `Object` methods, or the npm `underscore` if you really need it. |

This is a starting set, not exhaustive. For any package not listed,
search the community fork organizations or Packosphere before forking
yourself.

## When to publish back

If the original package is dormant, publish your fork under a different
publisher prefix (the community convention is the org name plus
the original short name). Submit a pull request to the original repo as
well; sometimes the maintainer re-engages.

---
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/v3-migration-docs/guide/package-replacements.md
