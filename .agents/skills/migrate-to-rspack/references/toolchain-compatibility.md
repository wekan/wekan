# Rspack 2 application toolchain compatibility

Use for an existing Rspack app upgrading to the Meteor 3.6 pairing, verified
on `3.6-beta.0`. Earlier releases retain their paired Rspack/integration
versions. Third-party packages have independent compatibility ranges; these
examples are not universal minimums or instructions to install `latest`.

## Identify the failing layer

1. Record `.meteor/release`, `.meteor/versions`, app/workspace manifests and
   the authoritative lockfile. Inspect resolved versions, not just ranges.
2. Inventory custom Rspack plugins, loader chains, framework compilers,
   preprocessors, TypeScript, SWC plugins and UI libraries. Include `.swcrc`,
   `swc.config.*`, `tsconfig.json` and inherited configuration when present.
3. Capture the first error and input file. Determine whether it comes from
   dependency installation, Meteor configuration, Rspack, a loader/preprocessor,
   or the compiler/plugin it invokes. A plugin failure is not automatically
   either a Meteor regression or proof that Meteor cannot improve compatibility.
4. Consult that tool's compatibility guidance for the actual resolved host.
   Change the smallest verified dependency/configuration set; keep the
   integration pairing, package manager, required transforms and app behavior.
5. Reproduce from a clean install, compile representative inputs through the
   real loader chain, and exercise the affected feature in the browser and
   production bundle. Preserve the first failure and the successful comparison.

## Svelte, TypeScript and UI components

In [Complex Todos at the examples migration commit](https://github.com/meteor/examples/tree/a7f001d3479a6f9088c80fe1016829385e74bfda/complex-todos-svelte),
the changes were Svelte `^5.53.10` to `^5.57.0`, a TypeScript `^5.9.3` dev
dependency and a new `tsconfig.json`. The existing `svelte-loader`,
`svelte-preprocess`, Skeleton dependencies and Rspack configuration were kept.

For a comparable preprocessing failure, check that TypeScript is installed
where the preprocessor resolves it and inspect the effective compiler options.
The example used:

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "verbatimModuleSyntax": true
  }
}
```

Merge relevant options into the app's configuration; preserve `extends`,
aliases, other compiler settings and its browser-target pipeline. Do not copy
this as a replacement file or require these dependency versions for every
Svelte app. Review the installed preprocessor's
[TypeScript guidance](https://github.com/sveltejs/svelte-preprocess/blob/main/docs/preprocessing.md#typescript).
Compile an affected UI component and verify interactions and emitted CSS.
Retain required PostCSS/SCSS preprocessing. This is not a reason to migrate to
Vite/SvelteKit, upgrade every UI library or remove a working loader chain.

## Lingui and SWC plugin runtimes

SWC Wasm plugins must match the compiler runtime that loads them. Consult
[SWC's compatibility guidance](https://swc.rs/docs/plugin/selecting-swc-core)
and select the actual framework/version in its linked compatibility checker.
With `builtin:swc-loader`, the host is the SWC runtime embedded in the resolved
Rspack build; changing a separate npm `@swc/core` does not establish compatibility.
For another loader, identify its actual host instead.

[Notes Offline at the same commit](https://github.com/meteor/examples/tree/a7f001d3479a6f9088c80fe1016829385e74bfda/notes-offline)
changed `@lingui/swc-plugin` from `^5.11.0` to `^6.7.0`. Its Lingui CLI,
loader and JSON formatter remained on `^5.9.5`, and the `.swcrc` plugin entry
was preserved. Do not infer that every Lingui package must share the plugin's
major, or transplant this newer plugin into an app pinned to Rspack 1.
Version numbers alone do not establish a failure. Preserve a working plugin
when the actual pipeline is compatible. A simple macro passing also does not
disprove a failure in a larger JSX, catalog or loader path; reproduce that
specific input before choosing the fix.

Check the [Lingui SWC plugin reference](https://lingui.dev/ref/swc-plugin),
resolved host compatibility and the app's macro/runtime API before selecting
a plugin version. Keep its required transformation enabled. Disabling the
plugin, removing macros or downgrading Meteor's paired compiler merely to
silence a Wasm error is not a completed migration. Compile a representative
macro and render a known translated message in development and production;
check extraction/catalog generation when that pipeline is used.

## Scope of the examples evidence

[Examples PR #50](https://github.com/meteor/examples/pull/50) reports migration
and startup for five apps: Complex Todos, Notes Offline, Parties, Task Manager
and Tic-Tac-Toe. It demonstrates the base automatic dependency update plus
two application-specific compatibility fixes. It does not establish exhaustive
testing of every loader, offline scenario, browser or production mode.
Use the [validation matrix](validation-matrix.md) and
[reporting checklist](troubleshooting.md#reporting-issues) for your app.

---
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/about/modern-build-stack/rspack-bundler-integration.md
