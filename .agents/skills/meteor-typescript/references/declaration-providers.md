# Meteor declaration providers

Inspect the release, direct Atmosphere constraints, resolved package versions,
npm/workspace manifests, lockfile and all active TypeScript configs before
changing providers. Keep compiler upgrades separate from declaration changes.

## Choose by release and provider

| Project state | Action |
|---|---|
| Meteor 3 before 3.6 | Native `meteor types` is unavailable. Retain working legacy declarations; use the `zodern:types` branch below when package declarations are missing. |
| Upgrading to 3.6 with working `@types/meteor` or `zodern:types` | Keep the provider and paths unless the task includes adopting native declarations. Runtime upgrade alone does not switch providers. |
| Explicit native adoption on 3.6 | Follow the ordered migration below. The command needs a root `tsconfig.json` or `jsconfig.json`. |
| Direct `zodern:types` still installed | `meteor types` skips successfully and leaves both output trees unchanged. A zero exit is not proof of native generation. A transitive dependency alone does not select the legacy provider. |

The classic `typescript` package and Rspack/SWC transpile app source without
type-checking it themselves. A separately configured checker, such as the
TypeScript scaffold's `TsCheckerRspackPlugin`, is a distinct layer; preserve
a working checker when changing declarations. On Meteor 3.6, ordinary `run`,
`build`, `test` and `lint` neither generate nor select native declarations.
New TypeScript, TypeScript + Tailwind, Svelte and Angular scaffolds select
native declarations and generate them during `meteor create`. Existing app
upgrades preserve their configured provider. After cloning or changing
packages, regenerate with `meteor types` before checking.

## Native adoption on Meteor 3.6

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

On Meteor 3.6+, keep generation explicit after cloning or changing packages;
working legacy providers remain valid. If adopting native declarations also
requires a framework upgrade, use `meteor-cli-installation` for retained
local-data preparation before starting the new release.

| Native declaration symptom | Meteor 3.6 behavior and checks |
|---|---|
| Relative imports/re-exports or ambient declarations break inside a generated package | Meteor 3.6's generator preserves the declaration tree and ambient entry location and parses module structure. Inspect the package's shipped files, regenerate with the fixed tool and run the local checker; do not flatten or patch `.meteor/types`. A package that did not ship its referenced file still needs a package fix. |
| DDP imports or subscription handles disagree with runtime | Meteor 3.6's `ddp-client`, `ddp-common`, `meteor` and `minimongo` declarations are corrected. Match resolved package versions and regenerate. Real `Meteor.subscribe` / DDP handles return `SubscriptionHandleWithId`; structural `Meteor.SubscriptionHandle` still requires only `ready()` and `stop()`. Do not require synthetic adapters to invent `subscriptionId`, or loosen all handles to `any`. |

These are declaration corrections, not new runtime methods. Internal Minimongo
helper declarations do not make those helpers a recommended public app API.
Keep a working legacy setup when the app cannot change its release;
Meteor before 3.6 does not provide native generation. Do not force a provider switch.

Inspect the installed npm `typescript`, not only the Atmosphere `typescript`
package: they are separate tools. Meteor 3.6's TypeScript scaffold selects npm
TypeScript 7 and `moduleResolution: "bundler"`. Do not copy older docs'
`baseUrl` or `moduleResolution: "node"` into it.
[TypeScript 7 removes both options](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/).
`paths` works without `baseUrl` on TypeScript 4.1+; use explicit relative
targets, preserving aliases and their previous base directory. Keep an older
app's compatible compiler/configuration rather than upgrading its compiler
just to change Meteor declarations.

For `TS2882` on stylesheet side-effect imports with TypeScript 6+, inspect
`noUncheckedSideEffectImports`. Meteor 3.6 TypeScript templates set it to
`false`. Existing apps can select that setting or include explicit stylesheet
module declarations such as `declare module '*.css';` in a `.d.ts` file.
Do not disable unrelated checks or edit generated Meteor declarations.

## Application user services and OAuth signatures

Meteor 3.6 native declarations expose the mergeable `Meteor.UserServices`
interface. Extend it in an application-owned `.d.ts` file included by the
active config, preserving `Meteor.User.services` and its optionality:

```typescript
// imports/types/user-services.d.ts
import "meteor/meteor";

declare module "meteor/meteor" {
  namespace Meteor {
    interface UserServices {
      internalSso?: { subject: string; tenantId: string };
    }
  }
}
```

Then `user.services?.internalSso?.tenantId` is typed without replacing all
services with `any`. Declare the actual stored shape and retain optional
fields; types do not publish private service data or authorize client access.
Do not add access tokens to client publications to satisfy a type error.
Regenerate after package changes, include the application declaration in
`tsc --listFiles --noEmit`, and check with the project's compiler. Do not edit
the generated adapter or native barrel.

For OAuth method/return-type errors, inspect the installed provider's native
declarations and API locus, regenerate and check the real call signature.
Corrected declarations do not convert a callback API into a Promise. On an
earlier Meteor release or a working legacy provider, inspect that provider's
augmentation contract instead of assuming native `UserServices` exists or
forcing a provider switch.

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
