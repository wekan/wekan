# Releases, reset, and reinstall

## Select a project release

Every Meteor application is pinned to a release. Read `.meteor/release` before
changing the user installation.

Create a project on a selected release:

```bash
meteor create --release <release> <path>
```

Update an existing project and its pin:

```bash
meteor update --release <release>
```

Run a command with an explicit release only when a temporary override is the
intended result:

```bash
meteor --release <release> run
```

Do not edit `.meteor/release` alone as an upgrade workflow. `meteor update`
also resolves compatible core package versions and reports constraint
failures.

## Reset project state

For a build, bundler, generated-type, or resolver-cache failure confined to one
application, suggest a project reset before any global cleanup. Explain the
scope and wait for confirmation. Stop the development server before an
authorized reset.

```bash
meteor reset
```

This clears the current project's cache and generated local state while
preserving its local development database. It does not repair or reinstall the
user-wide Meteor tool. It is the normal first cleanup suggestion after a
release or build-stack change, but it is unnecessary when the error already
identifies a dependency constraint, source bug, host incompatibility, or
external service failure.

Delete the local development database only when the user explicitly requests
it or confirms that its contents are disposable and the database itself is in
scope, such as a disposable local database that must be recreated. Do not
suggest `--db` merely to strengthen a cache reset:

```bash
meteor reset --db
```

Meteor 3.4.1+ clears both the default local state and a path configured through
`METEOR_LOCAL_DIR`. Meteor 3.0 through 3.4 clears only the default
`.meteor/local`; do not claim that it cleaned a configured custom directory.
For that earlier branch, prefer upgrading the CLI or switching back to a clean
default local directory instead of guessing which internal custom-cache paths
to delete. A configured external `MONGO_URL` is not deleted by
`meteor reset --db`.

## Choose the cleanup scope

| Failing layer | Least destructive suggestion |
|---|---|
| One project's generated build state | `meteor reset`, after confirmation. It preserves the local database. |
| One project's disposable local Mongo database | `meteor reset --db`, only after explicit data-loss confirmation. |
| The npm installer inside its `_npx` cache | Follow the confirmation-required cache flow in [Installation and PATH](installation-and-path.md). |
| Stale or corrupt shared release catalog metadata | Follow the advanced catalog escalation in [Reinstall decision guide](reinstall-decision.md). |
| Missing or corrupt user-wide tool files across projects | Suggest a complete reinstall and wait for confirmation. |
| Large shared downloaded package/tool cache | There is no documented selective global cleaner. Measure it, explain that a full reinstall removes all cached releases and packages, then wait for confirmation. |

## Classify a dev-bundle problem

| Evidence | Recovery |
|---|---|
| One project fails after a build or release change; other projects work | Suggest stopping the app and running `meteor reset`, then wait for confirmation. This rebuilds project-local state and re-resolves its dev-bundle link. |
| `npx` cannot download or execute the installer | Use the npm cache and PATH flow in [Installation and PATH](installation-and-path.md). |
| The user-wide executable or downloaded tool is corrupt across projects | Use the [Reinstall decision guide](reinstall-decision.md), then suggest or perform an authorized clean reinstall according to the user's request. |

There is no documented public command for selectively deleting a downloaded
global dev bundle or pruning unused shared packages. Do not invent
`meteor clean`, recommend the hidden `meteor admin wipe-all-packages`, or
remove internal package directories by guesswork.

## Uninstall or cleanly reinstall

`npx meteor uninstall` removes the complete user Meteor directory, including
downloaded tools, releases, dev bundles, and CLI state stored there. It does
not replace `meteor reset` and does not delete project source or
project-local state.

Before running it:

1. Confirm the user explicitly requested uninstall or full reinstall. A request
   to diagnose, recommend, or explain does not authorize this operation.
2. Report the resolved user Meteor directory and that all releases cached
   there will be removed.
3. Record the desired installer package or project release.

Then run:

```bash
npx meteor uninstall
npx meteor@<version> install
```

Use `npx meteor` for the current installer when no package version was
requested. Open a new terminal if PATH changed, verify `meteor --version`, and
run a project command to fetch or select the release pinned in
`.meteor/release`.

Do not delete shell profile files during uninstall. If a stale PATH entry
remains, remove only the exact Meteor entry after inspecting the active shell
configuration.

---
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/cli/index.md
