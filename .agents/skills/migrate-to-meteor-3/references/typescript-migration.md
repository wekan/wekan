# TypeScript migration

Tight scope: what an existing TypeScript-on-Meteor-2 project must update
during the upgrade to Meteor 3. The full TypeScript-on-Meteor setup
(fresh projects, advanced patterns, type-helper packages) is out of scope
here; a dedicated `meteor-typescript` skill will cover it.

## What breaks

After the upgrade, imports from `meteor/*` resolve to `any` or fail
outright. The Meteor 2 type-shipping mechanism is no longer compatible
with the 3.x build, so any `import { Meteor } from 'meteor/meteor';`
loses its types.

## What to install

```bash
meteor add zodern:types
```

`zodern:types` ships generated `.d.ts` files keyed off your local Meteor
install. It replaces the older approaches used in Meteor 2.

## `tsconfig.json` updates

Two changes are required:

```jsonc
{
  "compilerOptions": {
    // 1. Resolve symlinks the way Meteor's package layout expects.
    "preserveSymlinks": true,

    // 2. Map meteor/* imports to the generated types directory.
    "baseUrl": "./",
    "paths": {
      "meteor/*": [".meteor/local/types/packages.d.ts"]
    }
  }
}
```

Without `preserveSymlinks: true`, TypeScript follows symlinks in
`.meteor/local/build/` and reports duplicate identifier errors. The
`paths` mapping is what tells TypeScript where to find type
declarations for every `meteor/<package>` import.

## After the changes

Restart your TS server (or your editor) so the new `tsconfig.json` is
picked up. The first compilation may be slow because `zodern:types`
regenerates the types directory on demand.

## Symptoms

- `import { Meteor } from 'meteor/meteor';` resolves to `any`, no
  autocomplete. The `paths` mapping in `tsconfig.json` is missing.
- "Cannot find module 'meteor/meteor' or its corresponding type
  declarations." `zodern:types` is not installed.
- "Duplicate identifier 'Meteor'." `preserveSymlinks` is not set.

---
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/v3-migration-docs/typescript/meteor-types.md
