# Atmosphere package adoption

Verify the package's owner, supported versions, source, license, behavior,
security impact, and integration tests before installing it. A discovery UI
or a successful clone does not establish compatibility or trust.

## Registry discovery and scripts

Meteor 3.6-beta.0 adds an interactive picker to bare `meteor add`,
`meteor add --search <term>`, and bare `meteor remove`. These require a TTY.
Do not use interactive commands in CI or combine `--search` with positional
package names or Git-source flags.

Scripts and earlier Meteor 3 releases use explicit inspection and names:

```bash
meteor search <term>
meteor show <package-name>
meteor add <package-name>
meteor remove <package-name>
```

Use a version constraint only after verifying the actual package release.
Review `.meteor/packages` and `.meteor/versions` after the solver runs.

## Git-hosted Atmosphere packages

Meteor 3.6-beta.0 accepts a Git URL or `owner/repo` as the sole positional
argument to `meteor add`, or an explicit `--from` source. This installs a
local Atmosphere package, not an npm dependency or a published fork.

```bash
meteor add --from <git-url> --from-branch <commit-sha> \
  --from-dir <package-subdirectory> --to packages/<local-directory>
```

Omit `--from-dir` for a package at the repository root. `--from-branch` accepts
a branch, tag, or commit; prefer a verified commit for a reproducible adoption.
`--to` is relative to the application directory. Before running the command:

1. Inspect the source and selected ref, including `Package.describe`, build
   plugins, npm dependencies, and install-time code.
2. Read the real registered package name from `Package.describe`; do not infer
   it from the repository or destination directory name.
3. Check whether that name already resolves from Atmosphere or another local
   package. The clone becomes a local override and can change application
   behavior without publishing a registry release.
4. Check the destination and preserve existing work. Do not add `--force` to
   overwrite a clone merely because a target exists.
5. Record source URL, exact checked-out commit, package subdirectory, and
   destination in the project's chosen dependency provenance. Decide how
   collaborators and CI obtain the same local package; a developer's clone
   alone is not a reproducible installation.

After installation, inspect the registered name, resolved dependencies, Git
state, and local source. Run focused integration and security checks. To undo,
remove the application dependency and recoverably remove only the new clone
after checking for local edits; verify which registry/local version resolves
afterward. Do not assume a solver failure rolled back every filesystem change.

On releases pinned below 3.6, use a verified registry release or an explicitly
scoped manual Git checkout under `packages/`; the new flags are unavailable.
Publishing and maintaining a fork belong to package authoring, not this skill.

---
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/cli/index.md
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/generators/changelog/versions/3.6.0.md
