# JavaScript IntelliSense

Native Meteor-import declarations require Meteor 3.6-beta.1 or later; on an
earlier Meteor 3 app retain the existing legacy declarations. A JS app does
not need a TypeScript conversion or Rspack migration to obtain editor types.

Inspect the existing provider and root config first. If `tsconfig.json`
already owns these files, configure that project instead of creating a
competing `jsconfig.json`. Otherwise create or merge a root `jsconfig.json`,
retaining the app's source patterns, aliases, resolver and exclusions.

For beta.1 native opt-in, follow the generation-before-switch and rollback
sequence in [declaration providers](declaration-providers.md). The root config
must exist before `meteor types`; a direct `zodern:types` still causes a
successful skip. Once generation succeeds, merge:

```json
{
  "files": ["./.meteor/types/packages.d.ts"],
  "include": ["**/*.js", "**/*.jsx"],
  "compilerOptions": {
    "paths": {
      "meteor/*": ["./.meteor/types/packages/*"]
    }
  }
}
```

Append the barrel to existing `files`; preserve intentional JS/JSX source
inclusion and generated-output exclusions. The barrel is explicit even when
`.meteor/**` is excluded. Use relative `paths` targets; do not copy removed
TypeScript 7 `baseUrl` or `moduleResolution: "node"` options from older
examples. Retain a compatible resolver already used by the editor/project.

Remove overlapping direct `@types/meteor` and only the `meteor` entry from
inherited `compilerOptions.types` after successful generation. Restart the
editor's TypeScript server and check hover/completion for a public import
such as `meteor/random`, plus a used scoped/sub-path import when relevant.
If a package supplies no declarations, do not claim generation typed it.

`jsconfig.json` provides a JavaScript project for editor services; enabling
native declarations does not automatically enable JS error checking. If the
user also wants CI checks, use the app's compatible local TypeScript compiler
and opt into `checkJs` deliberately:

```json
{
  "scripts": {
    "check-js": "meteor types && tsc --project jsconfig.json --allowJs --checkJs --noEmit"
  }
}
```

Verify the intended JS source appears in the compiler's file list and a
temporary invalid assignment is rejected. Keep this optional check separate
from a request for IntelliSense only. Do not edit or commit generated types.

---
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/cli/using-core-types.md
