---
name: meteor-cli-installation
description: >
  Use when installing, locating, repairing, resetting, or uninstalling the
  Meteor CLI for Meteor 3 development. Triggers on "meteor: command not
  found", npx meteor, installer failures, PATH problems, specific Meteor
  versions, clean reinstall requests, meteor reset, or corrupted dev bundles.
  Use this skill when the user asks about fresh workstation setup or making a
  local Meteor command available. For application failures after the CLI
  starts, use meteor-debugging; for application code upgrades, use
  migrate-to-meteor-3.
metadata:
  author: meteor
  kind: workflow
  meteor: ">=3.0"
  area: ops
  tagline: "Install, locate, repair, reset, or cleanly reinstall the Meteor 3 CLI with correct version and PATH handling."
  bundle: ["essentials", "migration", "fullstack", "ops", "blaze", "react"]
  docs_synced_at: "2026-09-02"
license: MIT
---

# Install and repair the Meteor CLI

Make the Meteor CLI available without changing an application or deleting
state that the user did not place in scope. `npx meteor` runs the official npm
installer and creates a user-wide Meteor installation; it does not add the
installer permanently to global npm packages.

## Decision flow

1. Classify the request before changing the machine.
   - Install a missing CLI when the user asks to set up Meteor or requests a
     local create, run, test, build, or deploy operation that requires it.
   - For explanation, review, or planning only, report the missing prerequisite
     and the install command without running it.
   - Require explicit confirmation before any recovery operation that removes
     state: `meteor reset`, `meteor reset --db`, npm cache clearing, targeted
     global metadata cleanup, uninstall, or full reinstall.
   - When evidence makes a cleanup or reinstall plausible, suggest the least
     destructive option with its reason, scope, and expected state loss. Do
     not execute it until the user explicitly confirms that operation.
2. Inspect the host and intended project. Check the operating system,
   architecture, `node --version`, `npm --version`, CLI lookup result, and
   `meteor --version` when available. In an application, read
   `.meteor/release` before selecting a release.
3. Distinguish the requested version:
   - The npm selector in `npx meteor@<version>` chooses an installer package.
   - A Meteor application is pinned to a framework release in
     `.meteor/release`.
   Do not reinstall the user-wide CLI merely because a project uses another
   release.
4. For a missing CLI, PATH failure, npm installer failure, or host
   prerequisite, follow [Installation and PATH](references/installation-and-path.md).
5. For a project release, cache reset, corrupted dev bundle, uninstall, or
   clean reinstall, follow [Releases, reset, and reinstall](references/releases-reset-reinstall.md).
   Use [Reinstall decision guide](references/reinstall-decision.md) before
   recommending a user-wide reinstall for an observed failure.
6. Verify the result with `meteor --version`. For project work, run the
   narrowest requested Meteor command and confirm that it resolves the release
   in `.meteor/release`. Report commands run, selected versions, state removed,
   and anything the user must do in a new shell.

## Installation rules

| Situation | Action |
|---|---|
| Latest supported CLI | Run `npx meteor`. |
| Pinned installer package | Run `npx meteor@<version> install`, then verify the reported Meteor release. |
| Linux or macOS alternative | `curl https://install.meteor.com/ \| sh` remains documented. Keep `npx meteor` as the primary cross-platform command. |
| npm fallback | Run `npm install -g meteor --foreground-script` only after the documented `npx` recovery steps fail. |
| Existing project needs another release | Use the project's pin or a Meteor `--release` command. Do not replace the user-wide installation first. |

Never run `npx install meteor`. Never add the npm `meteor` installer to an
application's `package.json`; it is an installer, not the framework runtime.

## State boundaries

| State | Scope | Safe operation |
|---|---|---|
| User Meteor directory | Downloaded tools, releases, dev bundles, and CLI state for the user | `npx meteor uninstall` removes the whole installation. Use only for an authorized uninstall or clean reinstall. |
| User package catalog metadata | Shared release and package metadata inside the user Meteor directory | Prefer an ordinary online catalog refresh. Treat targeted metadata rebuilding as an advanced, confirmation-required recovery. |
| `.meteor/release` | Project framework release | Change through `meteor update --release <release>`, not a global reinstall. |
| `.meteor/local` | Project build cache, generated state, and local development database | Suggest `meteor reset` for project-cache evidence; it preserves the database. `meteor reset --db` deletes it. Run either only after confirmation. |
| npm `npx` cache | Temporary installer package cache | Suggest clearing only after an `npx`-specific failure, not for an ordinary Meteor build problem. Run only after confirmation. |

Do not delete internal tool or dev-bundle directories selectively without a
documented command and evidence that identifies that layer. Use `meteor reset`
for project cache corruption. Use a complete, authorized reinstall only when
the user-wide installation itself is corrupt. Never recommend hidden Meteor
administration commands as user-facing cache cleaners.

## Handoffs

- The CLI starts but the application fails: `meteor-debugging`.
- The application must move from Meteor 2 to Meteor 3: `migrate-to-meteor-3`.
- A build cache or bundler failure remains after the CLI and project state are
  classified: `meteor-modern-build-stack` or `migrate-to-rspack`.
- Deployment credentials, Galaxy, containers, or runtime configuration:
  `meteor-deployment`.

## References

- [Installation and PATH](references/installation-and-path.md)
- [Releases, reset, and reinstall](references/releases-reset-reinstall.md)
- [Reinstall decision guide](references/reinstall-decision.md)
- [Evaluation cases](references/eval-cases.md)
