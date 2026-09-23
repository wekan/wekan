# TypeScript checkpoint during a runtime upgrade

Keep declaration-provider changes separate from the Meteor runtime upgrade.
Inspect the target release, direct `.meteor/packages` constraints,
`.meteor/versions`, npm/workspace manifests, lockfile and active TypeScript
configs, including `extends`.

| Target and intent | Migration decision |
|---|---|
| Earlier Meteor 3 release, including 3.5.2 | Native `meteor types` is unavailable. Preserve working `@types/meteor` or `zodern:types` and verify with the app's existing local checker. |
| Meteor 3.6-beta.1 runtime upgrade only | Keep the provider, compiler and config. The upgrade does not select native declarations. |
| Explicit native adoption on beta.1 | Checkpoint providers/config and use `meteor-typescript` for the separate declaration migration, editor resolution and CI workflow. |

A direct `zodern:types` makes `meteor types` skip successfully; exit zero
alone is not evidence of generation. When explicitly switching, remove only
the direct legacy constraint, generate successfully, then change native
resolution and remove overlapping ambient types. Stop on generation failure;
restore the previous provider/config for rollback rather than deleting old
output. The native generator preserves legacy output on failure.

Use `meteor-typescript` for `meteor/*` imports resolving to `any`, duplicate
identifiers, inherited `types`, scoped/sub-path imports, TypeScript 7 options
and source-inclusion checks. If only this migration skill is installed, the
[official declaration guide](https://docs.meteor.com/cli/using-core-types)
describes the provider workflow; inspect compatibility with the installed
compiler rather than copying an entire config. Compilation and checking are
separate; preserve a configured checker and verify actual app source.

---
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/v3-migration-docs/typescript/meteor-types.md
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/cli/using-core-types.md
