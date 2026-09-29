# Architecture-specific Rspack entries

Meteor 3.6, verified on beta.3 with `rspack@1.4.0-beta360.3` and
`@meteorjs/rspack@3.0.0-beta.3`, compiles explicit client architectures through
Rspack separately. Beta.0/beta.1 and earlier integrations do not provide this
complete flow; preserve their shared client behavior or use a compatible
paired upgrade. Keep deliberate version constraints.

## Select entries

Merge into the app's existing configuration:

```json
{
  "meteor": {
    "mainModule": {
      "client": "client/main.js",
      "legacy": "client/legacy.js",
      "server": "server/main.js"
    },
    "modern": { "webArchOnly": false }
  }
}
```

| Entry decision | Effect |
|---|---|
| Only `client` | Existing shared client graph; no separate legacy compilation. |
| Explicit `legacy` | Separate `web.browser.legacy` graph even if its filename equals `client`. Can render an unsupported-browser message or a compatible app. |
| Explicit `web.browser`, `web.browser.legacy`, `web.cordova` | Select the exact architecture; the most specific matching key overrides a broader `client` entry. |
| `modern` / `legacy` shorthands | Follow Meteor architecture mapping. With `meteor.modern.cordova: false`, `legacy` also covers Cordova. Use exact keys when that distinction matters. |
| Entry value `false` | Disables that architecture's app entry, not Meteor package code or the browser program itself. |

Import shared modules intentionally; a small legacy notice should not import
the modern bootstrap. Keep native binary/HCP decisions with `meteor-native`.

## Configure the compilation

All entries use the existing `rspack.config.*`, aliases, loaders and plugins.
`defineConfig` supplies `Meteor.arch` for an explicit architecture and
`Meteor.isLegacy` for its legacy mapping. Default client/server compilations
have no explicit `arch`. These are callback flags, not runtime Meteor APIs.

```javascript
const { defineConfig } = require('@meteorjs/rspack');

module.exports = defineConfig(Meteor => Meteor.isLegacy
  ? Meteor.compileWithRspack([/node_modules/])
  : {});
```

Use this broad dependency rule only when the legacy graph needs it; narrower
dependency rules can reduce work. The helper inherits that compilation's SWC
options. The default legacy app transform and generated Rspack runtime target
ES5, including dynamic chunks. npm dependencies are excluded from the default
app rule. `meteor.nodeModules.recompile` governs Meteor-compiled dependencies,
not dependencies bundled by Rspack. Custom SWC/compiler settings can override
the legacy defaults.

ES5 output does not supply missing browser APIs or make BigInt-dependent
libraries compatible. Add required polyfills and verify actual target browsers.
Use `Meteor.arch` for architecture-specific rules and `Meteor.isLegacy` for
legacy rules. Do not create an auto-discovered `rspack.legacy.config.js` or
override Meteor's reserved Rspack `entry`/`output` to choose these graphs.

## Verify development, tests and production

- Set `modern.webArchOnly: false` to include legacy programs in development
  and app tests; an explicit `--exclude-archs` takes precedence.
- The separate legacy graph uses a watched build and Meteor reloads. The
  default client keeps the Rspack dev server/HMR.
- Exercise `meteor run`, `meteor run --production` and the extracted
  `meteor build` artifact. Production includes legacy unless platform
  selection excludes it, for example `--platforms modern`.
- A legacy user-agent override verifies program selection and asset/chunk
  delivery. Check `Meteor.isModern` in app code. It does not emulate an old
  JavaScript engine.
- For app tests, add matching `meteor.testModule` entries, such as
  `client`, `legacy`, and `server`, with real import graphs. Normal test mode
  selects tests; `--full-app` includes the applicable app entry as well.
  A modern headless `--once` run does not test the legacy program. Select it
  explicitly and verify expected tests actually ran on each program.

---
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/about/modern-build-stack/rspack-bundler-integration.md
