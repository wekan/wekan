# Code migrations for Rspack

This file covers the app-code changes the integration needs.

## Entry points

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

Required for Rspack; recommended even on Meteor-only. Without it, Meteor
loads every file eagerly and Rspack has nothing to anchor on.

Loading order belongs in the entry file. Imports cascade from there. See
[Modular application structure](https://docs.meteor.com/packages/modules).

### Server-only apps

If the app has no client UI (API servers, microservices, workers), set
only `mainModule.server`:

```json
{
  "meteor": {
    "mainModule": {
      "server": "server/main.js"
    }
  }
}
```

Rspack builds the server bundle; the client side is skipped.

## Nested imports

Detection: enable verbose mode and watch for `(app)` files failing with
`Error: 'import' and 'export' cannot be used outside of module code`.

```json
"meteor": {
  "modern": { "transpiler": { "verbose": true } }
}
```

`(package)` files are out of scope. Atmosphere packages stay on the Meteor
bundler under the integration.

### Rewrites

```javascript
// 1. Top-level
import { a as b } from "./c";
if (condition) console.log(b);

// 2. Dynamic import. Returns a Promise; the function becomes async.
if (condition) {
  const { a: b } = await import("./c");
  console.log(b);
}

// 3. require
if (condition) {
  const { a: b } = require("./c");
  console.log(b);
}
```

Use the dynamic-import form when the goal was code-splitting (the original
Meteor nested-import use case). Use `require` for purely synchronous
loading in a sync scope. Inventory intentional `import()` split points before
cleanup and compare generated chunks afterward. Do not silently convert a lazy
boundary into an eager import.

## Default-import interop for CommonJS

Old Meteor accepted `import x from "some-cjs"` for a package whose source
is `module.exports = ...`. Rspack + SWC do not by default.

```javascript
// before
import x from "some-cjs-lib";

// after, preferred
import * as x from "some-cjs-lib";
```

If the upstream package shape makes namespace import wrong (e.g. a single
default export reshaped to namespace), the SWC interop knob restores
Meteor's old behavior:

```json
{
  "module": {
    "type": "commonjs",
    "noInterop": false,
    "importInterop": "node"
  }
}
```

Cost: SWC emits CommonJS everywhere. Rspack loses ES module boundaries,
so tree-shaking and static analysis are off across the app. Migrate the
handful of imports instead unless there is no alternative.

## Aliases

Three places to keep in sync:

```javascript
// rspack.config.js
const { defineConfig } = require('@meteorjs/rspack');
module.exports = defineConfig(Meteor => ({
  resolve: {
    alias: {
      '@ui': '/imports/ui',
      '@api': '/imports/api',
    },
  },
}));
```

```json
// tsconfig.json (IDE + ESLint)
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@ui/*": ["imports/ui/*"],
      "@api/*": ["imports/api/*"]
    }
  }
}
```

```json
// .swcrc (only if SWC needs to resolve the alias during transpile)
{
  "jsc": {
    "baseUrl": "./",
    "paths": { "@ui/*": ["imports/ui/*"] }
  }
}
```

Limits:

- SWC `paths` resolve `import` only, not `require(...)`.
- Rspack `resolve.alias` resolves both `import` and `require`. Prefer
  Rspack when both forms are in use.

For dynamic aliases by env, use `swc.config.js` (a function that returns
the SWC config).

## Symlinks and monorepos

Choose resolution from how shared code is consumed:

| Shared-code model | Rspack behavior | Action |
|-------------------|-----------------|--------|
| npm, pnpm, or Yarn workspace package imported by package name | Default package resolution follows the real package. | Keep the default. |
| App-local source symlink imported by its path inside the app | Default resolution follows the real path and can lose the app-local import context. | Set `resolve.symlinks: false`. |

```javascript
module.exports = defineConfig(Meteor => ({
  resolve: { symlinks: false },
}));
```

Do not disable symlink resolution for every monorepo. Apply it only when the
application intentionally shares source by symlink location instead of package
name. Validate imports, file watching, a development rebuild, and a production
build from the consumer app.

## Reserved build folders

Do not commit, edit, or import from:

```text
_build/                          # Rspack entry + intermediate app code
public/build-assets/             # client static assets
public/build-chunks/             # dynamic-import code splits
private/build-assets/            # server assets
```

Auto-added to `.gitignore` the first time. If the project already uses
these names, rename:

```json
{
  "meteor": {
    "buildContext": "build",
    "assetsContext": "assets",
    "chunksContext": "chunks"
  }
}
```

`.gitignore` is not a tool ignore. Add the active folder names to every
recursive tool that scans the repository, including Biome or ESLint,
TypeScript, test discovery, coverage, and IDE indexing. Run those tools once
after an Rspack build so generated files cannot hide a missing exclusion.

Do not add the active build context to `.meteorignore` or `METEOR_IGNORE`.
Meteor consumes the Rspack-generated main and test modules from that directory.
See `client-graph-preflight.md` for renamed contexts and source-tree scanning.

## Verifying a migration

Verify from a clean clone, not only from a developer tree with cached files
or ignored settings:

1. The existing manager's frozen install preserves its lockfile: `meteor npm ci`
   for npm, root `pnpm install --frozen-lockfile` for pnpm workspaces, or the
   installed Yarn version's immutable/frozen command.
2. `"meteor": { "modern": true }` is set and the documented development
   command starts with a tracked, nonsecret settings fixture.
3. `meteor add rspack` has produced a committed `rspack.config.*` and the
   required npm dependency changes.
4. Verbose mode shows app code running through Rspack/SWC; only Atmosphere
   `(package)` files run through the Meteor bundler.
5. Server tests, browser-backed client tests, and the app's E2E command pass.
6. Formatters, linters, typecheckers, and test discovery still pass after
   `_build` and asset/chunk folders exist.
7. `meteor build --architecture os.linux.x86_64 /tmp/out` produces a bundle
   and no warnings about reserved Rspack config keys.
8. `git status --short` remains clean after the complete sequence.

Then boot the extracted production bundle and load it in a browser. Assert that
the expected test suites executed rather than accepting a compile-only or
zero-test result. Use `validation-matrix.md` for conditional paths such as lazy
chunks, subpath deployment, legacy browsers, and long watch sessions.

---
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/about/modern-build-stack/rspack-bundler-integration.md
