# Meteor Bundler Optimizations

`"meteor": { "modern": true }` in `package.json` enables: SWC transpiler,
SWC-based minifier, modern watcher, web-arch skipping in development. All
fall back to legacy behavior on incompatibility.

## Transpiler (SWC)

SWC replaces Babel for `.js`, `.jsx`, `.ts`, `.tsx` across app, npm, and
Atmosphere packages. Faster, no Fibers tax.

### Verbose output

```json
"meteor": {
  "modern": {
    "transpiler": { "verbose": true }
  }
}
```

Each file logs which transpiler ran. Babel fallbacks log
`[Transpiler] Used Babel for <file>     (<context>)     Fallback`.

### Excluding files from SWC

When a file is known-incompatible, skip SWC entirely to avoid the fallback
overhead.

```json
"meteor": {
  "modern": {
    "transpiler": {
      "excludeApp": ["\\.jsx"]
    }
  }
}
```

`excludeApp`, `excludeNodeModules`, `excludePackages`, `excludeLegacy`:
each accepts `true` (always Babel) or an array of paths/regex-like
patterns.

### Externalize SWC helpers

```bash
meteor npm install --save @swc/helpers
```

Meteor's pipeline detects it and emits imports for shared helpers instead
of inlining `_extends`, `_objectSpread`, etc. into every file. Preinstalled
on new apps. No `.swcrc` change is normally required. If only a production or
legacy build fails on a helper import, compare the source, Rspack output,
generated Meteor-facing module, and final bundle before changing helper config.
The later Meteor assembly can transform generated Rspack output too.

### Custom `.swcrc`

Lookup order: `.swcrc` > `swc.config.js` > `swc.config.ts`. Only the
first match is used. File name must be exactly `.swcrc`.

Add SWC plugins, JSX-in-JS support, or React runtime config here.

```json
{
  "jsc": {
    "parser": { "syntax": "ecmascript", "jsx": true },
    "transform": {
      "react": { "runtime": "automatic" }
    }
  }
}
```

For TypeScript: `"syntax": "typescript"` and `"tsx": true`.

### Import aliases via SWC

```json
{
  "jsc": {
    "baseUrl": "./",
    "paths": { "@ui/*": ["ui/*"] }
  }
}
```

SWC resolves aliases for `import`. It does NOT resolve aliases for
`require(...)` calls. Use an `import` or a relative path for those.

For dynamic aliases by env, use `swc.config.js`:

```javascript
var mode = process.env.MODE_ENV;
module.exports = {
  jsc: {
    baseUrl: "./",
    paths: mode === "USER" ? { "@ui/*": ["user/*"] }
                           : { "@ui/*": ["admin/*"] },
  },
};
```

### Transform-imports plugin

To shrink full-package imports (e.g. lodash):

```bash
meteor npm install -D @swc/plugin-transform-imports
```

```json
{
  "jsc": {
    "experimental": {
      "plugins": [[
        "@swc/plugin-transform-imports",
        {
          "lodash": {
            "transform": "lodash/{{member}}",
            "preventFullImport": true
          }
        }
      ]]
    }
  }
}
```

Rewrites `import { map } from "lodash"` into `import map from "lodash/map"`.

### Private class fields

SWC parses `#privateField`, `#privateMethod()`, static private members
natively. No `.swcrc` change required. Babel does not parse them in Meteor;
SWC does.

### Common Babel fallback causes

| Cause                              | Fix                                                          |
|------------------------------------|--------------------------------------------------------------|
| Nested imports                     | Move to top-level, or use dynamic `import()` / `require`.    |
| JSX in `.js` files                 | Add `jsc.parser.jsx: true` in `.swcrc`.                      |
| Babel-only plugin (e.g. React Compiler) | Either keep Babel via `excludeApp: true`, or wait.      |
| Custom babel-plugin-module-resolver | Move aliases to `.swcrc`'s `jsc.paths`.                     |

## Minifier (SWC-based)

Replaces Terser in production builds. Same flag (`"modern": true`). Opt out:

```json
"meteor": {
  "modern": { "minifier": false }
}
```

This flag controls Meteor's standard minifier path. If `.meteor/packages`
contains a third-party package that provides the JavaScript minifier, do not
assume the flag replaces it. Rspack compiles app modules, then Meteor still
assembles and minifies the final bundle. Compare production output with and
without the custom package before choosing one implementation.

## Watcher (`@parcel/watcher`)

Native cross-OS file watcher. Opt out:

```json
"meteor": {
  "modern": { "watcher": false }
}
```

For WSL, remote volumes, or unstable inotify, force polling:

```bash
METEOR_WATCH_FORCE_POLLING=true meteor run
METEOR_WATCH_POLLING_INTERVAL_MS=1000 METEOR_WATCH_FORCE_POLLING=true meteor run
```

Polling burns CPU but is the reliable option in those environments.

## Web Arch (dev only)

`"modern": true` makes development skip `web.browser.legacy` and
`web.cordova`. Equivalent to `--exclude-archs web.browser.legacy,web.cordova`.
Opt out:

```json
"meteor": {
  "modern": { "webArchOnly": false }
}
```

This only affects development. To drop legacy from production, add
`modern` to `.meteor/platforms`:

```text
server
browser
modern
```

## .meteorignore

`.gitignore` syntax. Place at any directory level; applies to the subtree.
Lets Meteor skip docs, design assets, infra, test runners, scripts.

```gitignore
docs/
design/
mockups/
cypress/
playwright/
scripts/
tools/
*.md
!README.md
```

Subdirectory `.meteorignore` files are honored; for example one inside
`packages/<pkg>/` scopes only to that package's tree.

For per-command rules without committing the file, use the
`METEOR_IGNORE` environment variable.

Do not synchronize `.gitignore` and `.meteorignore` mechanically. Gitignored
Rspack build contexts contain generated main and test modules that Meteor reads
during final assembly, so they must remain visible to Meteor. For performance,
report large unrelated trees that Git ignores but Meteor still scans, then add
anchored `.meteorignore` rules only after proving they are not application or
test inputs.

## Profiling

Run `meteor profile` before and after enabling `"modern": true` to
quantify the improvement.

## Troubleshooting

- `meteor reset` clears the build cache.
- Delete `.meteor/local/` to force a clean rebuild.

---
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/about/modern-build-stack/meteor-bundler-optimizations.md
