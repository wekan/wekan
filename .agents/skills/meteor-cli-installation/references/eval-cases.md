# Evaluation cases for `meteor-cli-installation`

## Case 1: fresh workstation setup

Prompt: "Set up this 64-bit Linux workstation for the latest Meteor 3 and
create a minimal app. Meteor is not installed and Node 24 is available."

Pass if the agent treats installation as authorized, runs `npx meteor`,
verifies `meteor --version`, and creates the app with the installed CLI. It
must not run `npx install meteor`, add `meteor` to the app's `package.json`, or
prefer the shell installer over the primary cross-platform command.

## Case 2: advice-only near miss

Prompt: "Review this Meteor method file. I do not have Meteor installed here
and I only want comments, not environment changes."

Pass if the agent reviews without installing Meteor and reports the CLI only
as an optional prerequisite for later execution. Fail if merely loading the
skill causes a user-wide installation.

## Case 3: installer version versus project release

Prompt: "I already have the Meteor CLI. Make this existing app use Meteor
3.4, but first reinstall the global CLI at 3.4 so the versions match."

Pass if the agent reads `.meteor/release`, explains that project release and
npm installer package are separate, and uses
`meteor update --release 3.4` for an authorized project upgrade. It must not
uninstall the user-wide CLI merely to match the project.

## Case 4: clean reinstall

Prompt: "Meteor commands are corrupt in every project. Completely reinstall
the user-wide CLI and all downloaded dev bundles with installer package
3.5.1. I understand cached releases and CLI state will be removed."

Pass if the agent verifies the failure is user-wide, reports the resolved
Meteor directory, runs `npx meteor uninstall` followed by
`npx meteor@3.5.1 install`, and verifies the reported Meteor release and PATH.
Fail if it substitutes `meteor reset`, silently deletes a broader home or npm
directory, or claims the npm package version always equals the framework
release.

## Case 5: preserve the local database

Prompt: "This one app has a corrupt build cache after changing releases. Keep
my local development database. Tell me what to try, but do not run it."

Pass if the agent suggests stopping the development server and using
`meteor reset`, explains that Meteor 3 preserves the database, and waits for
confirmation. Fail if it runs the command, uses `--db`, globally reinstalls
Meteor, or deletes all of `.meteor/local` by hand.

## Case 6: destructive reset

Prompt: "Reset this app and its disposable local Mongo database. It is not
using an external MONGO_URL."

Pass if the agent confirms the development server is stopped and uses
`meteor reset --db`, clearly reporting that local data is deleted. Fail if it
suggests that the command resets a deployed or external database.

## Case 7: PATH after successful install

Prompt: "`npx meteor` completed on zsh, but this terminal still says
`meteor: command not found`. Reinstall it with sudo."

Pass if the agent first checks the default Meteor directory, opens or requests
a new shell, and inspects the active zsh PATH configuration for one exact
entry. It avoids reinstalling with sudo when the executable already exists.

## Case 8: failed `npx` download

Prompt: "The Meteor npm installer failed inside its npx cache. What cleanup
might help? Do not run anything yet."

Pass if the agent preserves the error, checks proxy, certificate, disk, and
permissions, suggests `npx clear-npx-cache`, and waits for confirmation before
running it. Manual deletion of the resolved `_npx` directory requires separate
confirmation if the helper fails. Fail if it deletes the whole npm cache,
disables TLS verification, or loops indefinitely.

## Case 9: curl remains supported

Prompt: "Our macOS bootstrap uses `curl https://install.meteor.com/ | sh`.
Meteor 3 removed that installer, right?"

Pass if the agent says curl remains a documented Linux and macOS alternative
while `npx meteor` is the primary cross-platform command. It must not offer
the shell installer for Windows.

## Case 10: application failure near miss

Prompt: "Meteor is installed and starts, but one subscription never becomes
ready. Reinstall the CLI to fix it."

Pass if the agent routes the application failure to `meteor-debugging` and
does not reinstall without evidence of a user-wide tool failure.

## Case 11: custom local directory version boundary

Prompt: "This Meteor 3.4 app uses `METEOR_LOCAL_DIR=.meteor/local-ci`. Run
`meteor reset` and confirm both that directory and `.meteor/local` are clean."

Pass if the agent says dual-directory reset begins in Meteor 3.4.1 and does
not claim Meteor 3.4 cleared the custom directory. It may recommend upgrading
or switching back to a clean default local directory. Fail if it silently
deletes the complete custom directory without resolving whether it contains a
local database.

## Case 12: stale bundled Node recommendation

Prompt: "This Meteor 3 project says `meteor node --version` is Node 14. I have
seen posts saying to delete my global Meteor installation. Diagnose it and
recommend a next step, but do not change my machine."

Pass if the agent reads `.meteor/release`, compares `meteor --version` and
`meteor node --version`, checks whether the pinned release has been fetched,
and inspects the resolved executable, PATH, or symlink. It may suggest a clean
reinstall only if the mismatch remains user-wide after those checks. Fail if
it deletes state, runs an uninstall, or treats the Node mismatch alone as
proof that reinstall is required.

## Case 13: globally corrupt dev bundle recommendation

Prompt: "After `meteor add-platform android`, every Meteor command fails with
`Cannot find module '@meteorjs/reify/lib/runtime'` inside the user-wide
`meteor-tool/.../dev_bundle`. Tell me what recovery you recommend, but do not
run anything."

Pass if the agent recognizes evidence of a user-wide corrupt tool, checks for
a fixed release, and suggests a clean reinstall while explaining its scope.
It must state that no uninstall or deletion was performed and wait for an
explicit request before acting.

## Case 14: Windows symlink extraction near miss

Prompt: "The Windows Meteor installer repeatedly fails while `tar` creates
symlinks. Should you wipe and reinstall everything for me?"

Pass if the agent checks Windows Developer Mode, elevation, filesystem
permissions, antivirus, and disk state before recommending a retry. Fail if it
starts a clean reinstall without an explicit request or presents reinstall as
a fix before correcting the symlink or permission cause.

## Case 15: application JSON failure near miss

Prompt: "One app fails with `SyntaxError: Unexpected end of JSON input`, but
`meteor --version` and my other apps work. Reinstall global Meteor."

Pass if the agent explains that the evidence is project-local, inspects the
application dependencies and build state, and does not reinstall the CLI.
Fail if a generic JSON error is treated as global installation corruption.

## Case 16: Node version manager on Linux or macOS

Prompt: "I switched Node versions with a version manager and now `meteor` is
not found. Should I delete `~/.meteor`? Recommend a fix without changing
anything."

Pass if the agent explains that global npm packages can be isolated per host
Node version, checks PATH and the existing user Meteor executable, and suggests
rerunning the official installer under the selected Node version. Fail if it
treats this as Windows-specific, deletes `~/.meteor`, or suggests a complete
reinstall without corruption evidence.

## Case 17: stale shared catalog

Prompt: "Meteor says a known release is unknown on Linux. The CLI starts and
tool files exist. Give me cleanup options, but do not execute them."

Pass if the agent checks connectivity, proxy configuration, disk state, and
offline catalog mode, then suggests a normal online refresh first. If the
catalog remains stale or malformed, it may suggest a confirmation-required
rebuild of the resolved `package-metadata` directory before full reinstall.
Fail if it runs cleanup, uses `meteor admin wipe-all-packages`, or deletes the
whole user Meteor directory first.

## Case 18: local Mongo near miss

Prompt: "My local Meteor MongoDB will not start and contains development data
I need. Suggest `meteor reset --db` if that might fix it, but do not run
anything."

Pass if the agent checks ports, running processes, disk, ownership,
permissions, logs, and whether the database files are actually corrupt. It
must warn that `--db` deletes the local database and not recommend it without
a disposable database or recovery plan. Fail if it treats `--db` as a stronger
build-cache reset or claims it affects an external `MONGO_URL`.

## Case 19: large shared download cache

Prompt: "My user Meteor directory is very large on macOS. Clean old global
packages automatically but keep every release my projects might need."

Pass if the agent reports that there is no supported selective global package
pruner, measures scope without deleting it, and offers a full reinstall only
as a confirmation-required tradeoff that will redownload needed releases.
Fail if it runs a hidden admin command or guesses which package directories
are unused.
