# Recovery and reinstall decision guide

A clean reinstall removes user-wide Meteor tools, releases, dev bundles, and
CLI state. Treat it as the last step in a recovery ladder, not a generic
debugging step. Project reset, installer-cache clearing, global metadata
rebuilding, and reinstall all remove state. When the user asked only for
diagnosis or recommendations, explain the likely option and wait for explicit
confirmation before running it.

## Establish the failing scope

1. Preserve the first complete error and note whether its paths point into the
   project or the user Meteor directory.
2. Read `.meteor/release` in the affected project. Record the resolved
   `meteor` executable, `meteor --version`, and `meteor node --version` when
   those commands still work.
3. Check an existing second project or a project-independent command. The
   operating system changes paths and prerequisites, not this scope test. Do not
   create or modify a project merely to prove scope when the user requested
   advice only.
4. If the pinned release has not been fetched, run the narrowest authorized
   project command, such as `meteor run`, and recheck. Meteor may select and
   download the correct tool and dev bundle without a reinstall.
5. Fix external causes first: full disk, blocked downloads, proxy or
   certificate errors, antivirus interference, ownership and permissions,
   unsupported host libraries, or Windows symlink support.

## Choose the recovery suggestion

| Evidence | First response | Escalation guidance |
|---|---|---|
| `meteor: command not found`, but the executable exists | Open a new shell and repair the exact PATH entry. If a Node version manager was just switched, rerun the npm installer under that host Node version. | Do not suggest deleting the user Meteor directory unless it is also corrupt. |
| Installer download, update, or extraction fails | Check network, firewall, proxy, certificate, disk, and permissions. On Windows, check Developer Mode or elevated symlink support. | Retrying a clean install before fixing the cause usually repeats the failure. Suggest reinstall only if broken partial user-wide state remains after the cause is fixed. |
| One application has stale generated build, resolver, bundler, or type state, while the CLI and other projects work | Suggest `meteor reset`, explain that Meteor 3 preserves the local database, and wait for confirmation. | Do not suggest a user-wide reinstall. |
| A disposable local Mongo database itself must be recreated | Inspect database, port, disk, and permission evidence first. Suggest `meteor reset --db` with an explicit data-loss warning. | This is not a global reinstall case and does not affect an external `MONGO_URL`. |
| `meteor node` reports a Node version incompatible with the pinned Meteor release | Run from the project, fetch or select its pinned release, recheck, then inspect the resolved launcher, PATH, and symlink. Outside a project or inside a built bundle, verify release selection before treating the Node version as corruption. | Suggest reinstall only if the mismatch remains user-wide after release selection and launcher checks. |
| An expected release is unknown or catalog JSON/SQLite metadata is stale, while tool files still work | Verify network access, proxy settings, and that offline catalog mode is disabled. Try a normal online project command or update first. | Consider targeted catalog-metadata rebuilding before a full reinstall. Require confirmation for either cleanup. |
| Missing modules or files are reported inside the user Meteor directory's `meteor-tool` or `dev_bundle`, then every Meteor command fails | Check whether a fixed Meteor release exists and identify the affected user directory. | Suggest a clean reinstall as a reasonable recovery. Do not run it without an explicit request. |
| Catalog, archive, or tool metadata under the user Meteor directory is corrupt across projects or breaks project-independent commands | Rule out download, disk, and filesystem causes. Preserve the error for reporting. | Suggest a clean reinstall when no documented narrower repair applies. Do not guess internal directories to delete. |
| Shared downloads consume excessive disk space but still work | Measure the resolved user Meteor directory and identify other disk consumers. | There is no public selective package-pruning command. A confirmed full reinstall can reclaim the cache at the cost of downloading needed releases again. |
| A tool binary reports an incompatible host library, architecture, or operating-system error | Select a compatible Meteor release or update the host. | Reinstalling the same incompatible release will not help. |
| The user already explicitly requests a complete reinstall and acknowledges user-wide cache removal | Verify global scope and report the resolved directory. | Follow [Releases, reset, and reinstall](releases-reset-reinstall.md). |

## Escalate a shared catalog failure

The shared package catalog lives under the user Meteor directory on every
supported operating system. Its platform-specific path differs, but the
decision does not.

1. Verify downloads work and the process is not forced into offline catalog
   mode.
2. Run an ordinary online project command or `meteor update --release
   <release>` only when that project operation is authorized.
3. If the expected release remains unknown or the catalog database itself is
   malformed, suggest rebuilding only the resolved `package-metadata`
   directory. Label this as an advanced community-supported recovery, not a
   documented public Meteor command. Explain that metadata must be downloaded
   again and offline work may fail until the refresh completes.
4. Wait for explicit confirmation before removing that directory.
5. If tool packages or dev bundles are also corrupt, suggest a complete clean
   reinstall instead of expanding manual deletion to other internal paths.

Never recommend `meteor admin wipe-all-packages`. It is a hidden framework
testing command, not a supported end-user cache cleaner.

## Evidence patterns from reported failures

- A Meteor 3 project could report Node 14 because the selected tool or launcher
  was stale on macOS as well as other systems. The issue discussion found that
  running the project could fetch the right release before reinstalling. See
  [meteor/meteor#13146](https://github.com/meteor/meteor/issues/13146) and
  [the macOS forum report](https://forums.meteor.com/t/does-your-meteor-3-still-run-node14-here-s-how-to-check-and-fix/63075).
- On Linux arm64, `meteor npm` inside a built bundle could select a newer tool
  because it was outside a project, not because the installation was corrupt.
  Verify working directory and release selection before suggesting cleanup.
  See
  [meteor/meteor#14592](https://github.com/meteor/meteor/discussions/14592).
- Meteor 3.0.1 on Windows had a known `add-platform android` failure that
  removed modules from the global dev bundle and broke every later Meteor
  command. The fix was assigned to Meteor 3.0.4, and maintainers recommended a
  clean reinstall for already-corrupt installations. See
  [meteor/meteor#13250](https://github.com/meteor/meteor/issues/13250).
- Repeated Windows installation extraction failures have been resolved by
  enabling Developer Mode or supplying the required permissions. Reinstalling
  before correcting symlink support repeats the same failure. See
  [the forum resolution](https://forums.meteor.com/t/solved-consistant-failure-to-install/63785).
- A stale catalog report used an ordinary refresh, online-mode checks, and a
  targeted `package-metadata` rebuild before full reinstall. The metadata
  cleanup did not solve a blocked catalog download, reinforcing that network
  access must be fixed first. See
  [the Meteor 3.4.1 forum thread](https://forums.meteor.com/t/meteor-3-4-1-is-out-rspack-consolidation-revitalized-examples-and-important-fixes/64542/17).
- Reinstall attempts did not fix an application dependency's malformed JSON or
  a Watchman root-resolution failure. These belong to project debugging. See
  [meteor/meteor#11830](https://github.com/meteor/meteor/issues/11830) and
  [meteor/meteor#13883](https://github.com/meteor/meteor/issues/13883).

Historical issue-specific versions explain the pattern; they are not general
minimum-version requirements for this skill. Check current documentation and
release notes before naming a fixed release for a new report.

## Suggestion template

Use this structure when the evidence supports any cleanup but the user did not
authorize it:

```text
The failure appears to be in <project cache, installer cache, shared catalog, or user-wide installation> because <evidence>, while <nearby causes checked>.

The least destructive likely next option is <operation>. It removes <exact state> from <resolved path or scope> and preserves <important state>. <State the redownload, rebuild, or data-loss cost.>

I have not run the cleanup or removed any files. If you want me to perform it, explicitly confirm that this scope and state loss are acceptable.
```
