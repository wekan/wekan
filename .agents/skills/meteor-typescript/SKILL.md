---
name: meteor-typescript
description: >
  Use when setting up or repairing Meteor application declarations, TypeScript
  configuration, JavaScript IntelliSense, or local and CI type-checking.
  Triggers on meteor types, meteor/* imports resolving to any, missing
  declarations, duplicate Meteor identifiers, zodern:types, @types/meteor,
  .meteor/types, tsconfig.json, jsconfig.json, and tsc --noEmit in a Meteor app.
  Use this skill when choosing or migrating declaration providers without
  changing the app's runtime or bundler. For a Meteor 2-to-3 runtime migration
  use migrate-to-meteor-3 first; for SWC/Rspack compilation use
  meteor-modern-build-stack or migrate-to-rspack. General TypeScript language
  questions and Atmosphere declaration publishing are outside this app scope.
metadata:
  author: meteor
  kind: knowledge
  meteor: ">=3.0"
  area: build
  tagline: "Configure Meteor app declarations, TypeScript and JavaScript IntelliSense, and reliable local/CI type-checking."
  docs_synced_at: "2026-09-23"
license: MIT
---

# TypeScript in Meteor applications

Make the editor and checker resolve the intended Meteor declarations and
actually inspect application source. Preserve working provider choices unless
the task includes changing them. A runtime or bundler upgrade does not imply
a declaration migration.

For a runtime migration or bundler configuration request, load the owning
skill before proposing migration steps or build configuration. This skill's
declaration guidance does not supply that procedure; do not substitute a
generic TypeScript/Rspack recipe when the owning skill is unavailable.

## Identify the layer

| Layer | Evidence and action |
|---|---|
| Compilation | The Atmosphere `typescript` package or Rspack/SWC strips types. Use the build owner for syntax transforms, loaders and bundling. |
| Declaration provider | Inspect `.meteor/packages`, `.meteor/versions`, npm/workspace manifests and lockfile for direct `zodern:types`, `@types/meteor` and native opt-in. |
| Resolution | Inspect active `tsconfig.json`/`jsconfig.json`, `extends`, `files`, `include`, `exclude`, `paths` and `types`. Check the editor uses the intended project/compiler. |
| Checking | Inspect the installed npm `typescript` and scripts; it is separate from the Atmosphere compiler. Preserve a configured checker such as `TsCheckerRspackPlugin`. |

Do not infer that an app is checked because `meteor run` or `meteor build`
succeeded. Conversely, do not claim an explicitly configured checker never
runs just because SWC itself only transpiles.

## Choose the provider

| Target and intent | Decision |
|---|---|
| Meteor 3 before 3.6-beta.1 | Native `meteor types` is unavailable. Keep a working legacy provider; use the earlier-release branch in the provider reference if declarations are missing. |
| New or existing 3.6-beta.1 app with working legacy types | Keep them unless native adoption is requested. Beta.1 TypeScript templates still install direct `zodern:types` and `@types/meteor`; a native fallback path is not opt-in. |
| Explicit native adoption on 3.6-beta.1 | Root config required. Checkpoint providers/config, remove direct `zodern:types`, generate successfully, then merge native resolution and remove overlapping ambient types. |
| JavaScript-only beta.1 app wanting IntelliSense | Use `jsconfig.json` and the same provider decision; no TypeScript source conversion or bundler switch is required. |

Read [declaration providers](references/declaration-providers.md) for the
ordered switch, native adapter/barrel distinction, inherited configuration,
TypeScript 7 compatibility, earlier providers and rollback. Read
[JavaScript IntelliSense](references/javascript-intellisense.md) for JS apps.

## Verify the effective project

1. Confirm generation actually ran. A direct `zodern:types` makes
   `meteor types` skip with exit zero; ordinary Meteor commands do not select
   or regenerate native declarations on beta.1.
2. Use the app's local compiler. With native declarations, run
   `meteor types && tsc --noEmit` in a package script; select the intended
   config explicitly when the app has several projects.
3. Check `tsc --listFiles --noEmit` includes application source. Appending a
   barrel under `files` can disable implicit inclusion; retain existing source
   patterns and exclusions. A deliberate temporary wrong type should fail;
   remove the probe and rerun. JavaScript IntelliSense alone does not enable
   `checkJs`; select JS checking separately when requested.
4. Restart the editor's TypeScript server after configuration changes. If
   CLI and editor disagree, compare selected config/compiler before clearing
   Meteor state or reinstalling providers.
5. Keep generated `.meteor/types/` untracked and unedited. Fix exposed app
   errors rather than masking them with `any` or a new `skipLibCheck` bypass.

## Diagnose the boundary

| Symptom | First check |
|---|---|
| Native command reports nothing to do | Root `tsconfig.json` or `jsconfig.json`. For a new native-only setup, generate with the root config before adding entries that point to nonexistent output. |
| Generation fails | Read the error; local packages may need fixing. Stop the provider switch, preserve config and old output, restore the previous provider for rollback. |
| Ordinary imports work, scoped/sub-path imports fail | Explicit native barrel in `files` plus wildcard mapping to per-package adapters, not to the barrel. |
| Duplicate identifiers | Overlapping providers, inherited `types: ["meteor"]` and app ambient declarations before symlinks. |
| Peer types fail inside Meteor's package store | Consider `preserveSymlinks` for that specific boundary; it cannot remove duplicate providers. |
| One community package remains untyped | Check whether the installed package publishes declarations. No generator can promise coverage for every Atmosphere package. |

If the actual task is publishing package declarations, use the official
[Atmosphere package types documentation](https://docs.meteor.com/packages/7.writing-atmosphere-packages#typescript-types).
Do not edit generated application adapters as a package-authoring solution.
