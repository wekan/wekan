# Meteor declaration providers

Inspect the release, direct Atmosphere constraints, resolved package versions,
npm/workspace manifests, lockfile and all active TypeScript configs before
changing providers. Keep compiler upgrades separate from declaration changes.

## Choose by release and provider

| Project state | Action |
|---|---|
| Meteor 3 before 3.6-beta.1 | Native `meteor types` is unavailable. Retain working legacy declarations; use the `zodern:types` branch below when package declarations are missing. |
| Upgrading to 3.6-beta.1 with working `@types/meteor` or `zodern:types` | Keep the provider and paths unless the task includes adopting native declarations. Runtime upgrade alone does not switch providers. |
| Explicit native adoption on 3.6-beta.1 | Follow the ordered migration below. The command needs a root `tsconfig.json` or `jsconfig.json`. |
| Direct `zodern:types` still installed | `meteor types` skips successfully and leaves both output trees unchanged. A zero exit is not proof of native generation. A transitive dependency alone does not select the legacy provider. |

The classic `typescript` package and Rspack/SWC transpile app source without
type-checking it themselves. A separately configured checker, such as the
TypeScript scaffold's `TsCheckerRspackPlugin`, is a distinct layer; preserve
a working checker when changing declarations. On beta.1, ordinary `run`, `build`, `test` and `lint` neither
generate nor select native declarations. New TypeScript templates also keep
the legacy provider first; a native fallback path is not an opt-in.

## Native adoption on Meteor 3.6-beta.1

1. Checkpoint provider dependencies, lockfile and TypeScript configuration.
   Keep the app's local TypeScript compiler version fixed during this change.
2. Remove `zodern:types` only if it is a direct app dependency, then generate:

   ```bash
   meteor remove zodern:types
   meteor types
   ```

   Generation can build local packages but does not bundle or type-check the
   application. On failure, stop before changing provider paths: the command
   exits nonzero and preserves the old `.meteor/local/types` output. Restore
   the removed provider if rolling back. Successful generation removes that
   stale legacy output.
3. After success, merge these entries into the active TypeScript config:

   ```json
   {
     "files": ["./.meteor/types/packages.d.ts"],
     "include": ["**/*.ts", "**/*.tsx"],
     "compilerOptions": {
       "paths": {
         "meteor/*": ["./.meteor/types/packages/*"]
       }
     }
   }
   ```

   Append the barrel to existing `files`; retain existing `include`, aliases,
   compiler options and `extends`. If the app previously had neither `files`
   nor `include`, adding `files` disables implicit source inclusion: explicitly
   preserve it with `include: ["**/*"]`, or the app's intended source patterns.
   Do not broaden an intentionally files-only project. Resolve paths against the config
   that declares them. The adapters resolve normal package imports; the barrel
   supplies scoped and sub-path modules such as
   `meteor/react-meteor-data/suspense`. Explicit `files` works even when
   `.meteor/**` is excluded. Do not map `meteor/*` directly to the native barrel.
4. Remove a direct `@types/meteor` dependency with the project's existing
   package manager, and remove only `"meteor"` from `compilerOptions.types`
   wherever it is inherited or declared. Preserve other type libraries and
   the workspace lockfile. Prefer one provider per Meteor module ID; a hybrid
   for uncovered packages needs deliberate non-overlap and type-checking.
5. Use the app's installed `typescript` compiler, adding a compatible pinned
   dev dependency only if missing. For an npm app:

   ```json
   {
     "scripts": {
       "check-types": "meteor types && tsc --noEmit"
     }
   }
   ```

   ```bash
   meteor npm run check-types
   ```

   Use the equivalent script runner for pnpm/Yarn. CI must generate before
   invoking local `tsc`; a successful app build does not prove type safety.
   Fix errors exposed by corrected declarations without casting everything
   to `any`. Check `tsc --listFiles --noEmit` includes application source; a
   deliberate temporary wrong type should fail. Remove that probe and rerun.
   Restart the editor's TypeScript server after config changes.

Do not edit or commit `.meteor/types/`; generation replaces its contents and
writes its own `.gitignore`. Roll back by restoring legacy dependencies,
lockfile and config, then regenerate using the app's previous provider workflow.
Ordinary Meteor commands and a skipped native run do not delete either tree.

## Compiler configuration compatibility

Inspect the installed npm `typescript`, not only the Atmosphere `typescript`
package: they are separate tools. Beta.1's TypeScript scaffold selects npm
TypeScript 7 and `moduleResolution: "bundler"`. Do not copy older docs'
`baseUrl` or `moduleResolution: "node"` into it.
[TypeScript 7 removes both options](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/).
`paths` works without `baseUrl` on TypeScript 4.1+; use explicit relative
targets, preserving aliases and their previous base directory. Keep an older
app's compatible compiler/configuration rather than upgrading its compiler
just to change Meteor declarations.

## Earlier-release legacy declarations

If required package declarations are missing on an older Meteor 3 app:

```bash
meteor add zodern:types
```

Merge the legacy settings, preserving any intentional working provider order:

```json
{
  "compilerOptions": {
    "preserveSymlinks": true,
    "paths": {
      "meteor/*": ["./.meteor/local/types/packages.d.ts"]
    }
  }
}
```

Regenerate through the existing provider workflow, restart the editor's
TypeScript server, and run the local compiler. Keep generated output untracked.
The legacy barrel mapping is not the native adapter mapping.

## Diagnose the first missing boundary

| Symptom | Check |
|---|---|
| `meteor types` reports nothing to do | Root `tsconfig.json` or `jsconfig.json`; do not delete caches. |
| Generation says it skipped | Direct `zodern:types` constraint, not only `.meteor/versions`. |
| Ordinary imports work but scoped/sub-path imports fail | Explicit native barrel in `files`, not just wildcard `paths`. |
| Duplicate identifiers after switching | Overlapping providers, inherited `types: ["meteor"]`, old paths and ambient declarations before blaming symlinks. |
| Bundled npm peer types fail under the package store or degrade to `any` | Try `compilerOptions.preserveSymlinks: true` for that resolution boundary. This does not fix overlapping declaration providers. |
| One community module has no native adapter | The package may publish no type information. Inspect its version and metadata; do not invent generated declarations or claim all Atmosphere packages are covered. |

---
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/v3-migration-docs/typescript/meteor-types.md
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/cli/using-core-types.md
