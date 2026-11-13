# Rspack entries by architecture

Meteor 3.6 pairs `rspack@1.4.0` with `@meteorjs/rspack@3.0.0` to compile
modern, legacy and Cordova entry graphs separately. Earlier Meteor
integrations retain their shared-client behavior. Inspect the release,
resolved packages and app entry map before selecting this workflow.

Keep selection in `package.json`, not Rspack's reserved `entry` or `output`:

```json
{
  "meteor": {
    "mainModule": {
      "client": "client/main.js",
      "legacy": "client/legacy.js",
      "server": "server/main.js"
    },
    "testModule": {
      "client": "tests/client.js",
      "legacy": "tests/legacy.js",
      "server": "tests/server.js"
    },
    "modern": { "webArchOnly": false }
  }
}
```

| Selection | Behavior |
|---|---|
| Only `mainModule.client` | Retains the existing shared-client compilation. |
| Explicit `legacy` or `web.browser.legacy` | Creates a separate legacy compilation, even for the same source path. |
| `web.browser`, `web.browser.legacy` or `web.cordova` | Selects the exact architecture; the most specific matching key overrides a broader `client` entry. |
| `modern` shorthand | Follows Meteor's architecture mapping. |
| `legacy` with `modern.cordova: false` | Also covers Cordova. |
| Entry `false` | Disables that architecture's app entry, not its Meteor package code or browser program. |

Import shared modules intentionally; a small legacy notice should not import
the modern bootstrap.

## Conditional configuration

```javascript
const { defineConfig } = require("@meteorjs/rspack");

module.exports = defineConfig(Meteor => Meteor.isLegacy
  ? Meteor.compileWithRspack([/node_modules/])
  : {});
```

`Meteor.isLegacy` and `Meteor.arch` describe the current configuration callback
compilation. They are not new properties on the app's runtime `Meteor` object.
Default client/server compilations have no explicit `arch`. All entries use
the existing config, aliases, loaders and plugins. Meteor does not
auto-discover `rspack.legacy.config.js`.

Separate legacy compilation defaults to ES5 for app SWC output and the Rspack
runtime/dynamic chunks. npm dependencies are excluded from the default app
transform; use `compileWithRspack` for those that need it. The helper inherits
the legacy target; narrower dependency rules can reduce work. Custom SWC or
compiler settings can override the defaults. `meteor.nodeModules.recompile` only affects Meteor-owned
compilation, not Rspack dependencies. ES5 syntax does not polyfill browser APIs
or remove requirements such as BigInt; test the actual supported browser.

## Verify the selected program

Enable `modern.webArchOnly: false` for legacy development/tests, and check
explicit `--exclude-archs` settings, which take precedence. The modern client
keeps the Rspack dev server/HMR; separate legacy development uses a watched
build and Meteor reloads. Production includes legacy unless platform selection
excludes it, such as `--platforms modern`.

Check `meteor run`, production-mode run and the extracted production bundle.
Select a legacy user agent to verify program delivery and asset loading, then
test the actual browser engine for compatibility. Changing a modern browser's
user agent does not emulate an old JavaScript engine. App runtime
`Meteor.isModern` identifies the selected browser program.

Run the app's test driver against both selected browser programs and confirm
the expected suites and real test import graphs. Normal test mode selects
`testModule`; `--full-app` includes the applicable app entry as well.
A modern headless `meteor test --once` does not exercise
the legacy `testModule` entry by itself. Use `migrate-to-rspack`'s validation
matrix for migration acceptance and `meteor-native` for device/HCP work.

---
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/about/modern-build-stack/rspack-bundler-integration.md
