# Framework and CSS migration

Rspack replaces most Meteor build plugins that act on app files. Atmosphere
package internals can keep their old plugin. Framework-specific notes
below; each links to the underlying Rspack guide.

## React

Works out of the box. `meteor add rspack` detects React in
`package.json` and registers `react-refresh` automatically.

Skeleton: `meteor create --react`.

## Preact

Detected the same way as React. When Preact is in `package.json`, Meteor
skips adding React-only dependencies (no `react-refresh`). No extra config.

## React Compiler

On Meteor 3.6-beta.0's Rspack 2.2.0 / `@meteorjs/rspack@3.0.0-beta.1`
pairing, prefer the built-in SWC compiler through `Meteor.extendSwcConfig`.
Use `meteor-react` for React 19 and React 17/18 target/runtime setup.
Earlier integrations retain a Babel loader scoped to `.jsx`/`.tsx`; Babel
also remains valid for options unsupported by SWC. Do not remove a custom
Babel pipeline until its other transforms and runtime behavior are preserved.
See the [Rspack React Compiler guide](https://rspack.rs/guide/tech/react#react-compiler).

## Vue

Native Rspack Vue loader, no `jorgenvatle:vite` needed. Remove
`jorgenvatle:vite` from `package.json` after adding `rspack`.

Skeleton: `meteor create --vue`.

## Solid

Native Rspack Solid loader, no `jorgenvatle:vite` needed.

Skeleton: `meteor create --solid`.

## Svelte

Use the official Rspack Svelte integration. `zodern:melte` does not work
with the integration. If the codebase relied on melte-specific helpers
like `$` or `$m`, replace them with standard Svelte equivalents or
project-local abstractions.

Skeleton: `meteor create --svelte`.

## CoffeeScript

Combine `coffee-loader` with `swc-loader` to keep app code on SWC.

```bash
npm install --save-dev coffeescript swc-loader coffee-loader
```

```javascript
const { defineConfig } = require('@meteorjs/rspack');

module.exports = defineConfig(Meteor => ({
  module: {
    rules: [
      {
        test: /\.coffee$/i,
        use: [
          { loader: 'swc-loader', options: Meteor.swcConfigOptions },
          { loader: 'coffee-loader' },
        ],
      },
    ],
  },
  resolve: { extensions: ['.coffee'] },
}));
```

Skeleton: `meteor create --coffeescript`.

## Angular

Experimental. Builds and runs in dev, prod, and test mode.

Skeleton: `meteor create --angular`.

## Babel as the app transpiler

Rspack supports Babel as an alternative to SWC. Slower. Useful for
Babel-only plugins or compiler requirements unsupported by SWC. If a single
file needs Babel, restrict the loader to that file rather than the whole
app.

Skeleton: `meteor create --babel`.

## CSS and HTML outside the entry folder

Rspack requires JavaScript entry points, but Meteor can keep processing selected
CSS or HTML outside the entry folder. List those paths under `meteor.modules`:

```json
{
  "meteor": {
    "modules": ["styles/main.css", "imports/shell.html"]
  }
}
```

Use this when a Meteor HTML or stylesheet compiler must retain ownership. Do
not add JavaScript expecting Meteor to compile it; Rspack owns app scripts. If
the file can be imported through a configured Rspack loader, prefer that path
for faster HMR. Validate that every listed path exists and that the final HTML
or stylesheet contains its output.

## Replace build plugins by capability

Before removing a Meteor build plugin, identify what it actually provides:

```text
handled extensions and source roots
loader or transform order
development and production branches
generated files and copied assets
injected globals, aliases, or virtual modules
source maps and minification behavior
```

Configure the matching Rspack loaders and plugins before removing the old
owner. Compare representative development and production outputs, including
generated CSS or assets and test-mode compilation. Remove the old plugin only
after output and runtime parity hold. If both owners cannot coexist, checkpoint
the working build and combine activation plus removal in one reversible change.
Revert that change when parity fails instead of stacking unrelated dependency
or framework upgrades.

Do not remove a plugin that acts only on Atmosphere package internals. Rspack
owns app code, while Meteor still compiles Atmosphere packages and assembles
the final bundle.

## CSS (default)

Built in. Any imported CSS file is processed and added to the HTML
skeleton. Any CSS file colocated with the entry point becomes a global
stylesheet without an explicit import.

On Meteor 3.4.1 and later, when `rspack.config.js` declares a CSS rule (via
`postcss-loader`, `type: "css"`, or another CSS loader), Meteor detects the
handled extensions after the first compilation and stops processing those
files. No `.meteorignore` change is required. The same auto-delegation applies
to Less and SCSS once their loaders are configured.

Meteor 3.4.0 predates automatic stylesheet delegation. Prefer upgrading to
3.4.1 or later before migrating the style pipeline. If the app must remain on
3.4.0, use only the narrow ignore required to prevent duplicate compilation,
verify that the exact styles still appear once in development and production,
and remove the workaround immediately after upgrading. Never ignore the active
Rspack build context.

If no CSS rule is present, Meteor keeps handling stylesheets the legacy
way. Meteor 3.6-beta.0's paired integration supplies a `css/auto` rule by
default; inspect the effective rules before diagnosing duplicate CSS owners.

## CSS Modules

Files named `*.module.css` are auto-scoped. Default export style is
named:

```javascript
import { app } from './App.module.css';
```

For default-import style:

```javascript
module.exports = defineConfig(Meteor => ({
  module: {
    parser: {
      'css/auto':   { namedExports: false },
      'css/module': { namedExports: false },
    },
  },
}));
```

```javascript
import styles from './App.module.css';
```

TypeScript declaration (e.g. `imports/css-modules.d.ts`):

```typescript
declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}
```

## Less

Replaces the `meteor/less` Meteor plugin for app files.

```bash
npm i -D less less-loader
```

```javascript
module.exports = defineConfig(Meteor => ({
  module: {
    rules: [
      {
        test: /\.less$/,
        use: [{ loader: 'less-loader' }],
        type: 'css/auto',
      },
    ],
  },
}));
```

## SCSS

Replaces the `fourseven:scss` Meteor plugin for app files.

```bash
npm i -D sass-embedded sass-loader
```

```javascript
module.exports = defineConfig(Meteor => ({
  module: {
    rules: [
      {
        test: /\.scss$/i,
        use: [{
          loader: 'sass-loader',
          options: {
            api: 'modern-compiler',
            implementation: require.resolve('sass-embedded'),
          },
        }],
        type: 'css/auto',
      },
    ],
  },
}));
```

Meteor 3.4.1's `meteor create --full` skeleton ships this exact setup.

## Tailwind and PostCSS

Supported out of the box. Follow the [Rspack Tailwind guide](https://tailwindcss.com/docs/installation/framework-guides/rspack/react).

Skeleton: `meteor create --tailwind`.

## Service Worker

For an existing Workbox integration or a generated worker, use
`workbox-webpack-plugin`'s `GenerateSW`. Meteor 3.6-beta.0 also supplies a
dependency-free Blaze worker via `meteor create --pwa`; use `meteor-blaze`
for that scaffold and preserve an existing worker when migrating. Neither
approach supplies offline data synchronization. For Workbox:

1. `exclude: [/./]` to skip precaching the build output. Use
   `runtimeCaching` rules for dynamic bundles.
2. Match HMR with `/\.hot-update\./` and set it to `NetworkOnly`.
3. Cache `Meteor.assetsContext` and `Meteor.chunksContext` paths with
   `StaleWhileRevalidate`. They contain build output Meteor serves.

For a custom `sw.js` filename, persist it once to disk in dev:

```javascript
...Meteor.persistDevFiles({ once: ['service-worker.js'] }),
```

HTML files persist automatically.

Service Worker support added in Meteor 3.4.1.

## HTML

A `client/main.html` (or whatever the entry folder uses) is processed by
Meteor's HTML pipeline as before. For deeper customization use the
integration's `HtmlRspackPlugin`:

```javascript
module.exports = defineConfig(Meteor => ({
  plugins: [
    Meteor.HtmlRspackPlugin({
      meta: {
        viewport: 'width=device-width, initial-scale=1, shrink-to-fit=no',
      },
    }),
  ],
}));
```

---
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/about/modern-build-stack/rspack-bundler-integration.md
