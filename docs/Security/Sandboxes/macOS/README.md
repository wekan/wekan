# macOS Sandbox

macOS lacks Flatpak but has an equivalent, `sandbox-exec`, where the same
`.tools`-only layout helps just as much.

The sandbox limits VSCodium's read and write access to the
`~/Documents/repos/wekan` directory. In that WeKan repository the `.tools`
subdirectory, listed in `.gitignore`, holds all related work: the companion
repositories, the `.tools/tmp` temporary directory, the `.tools/log` log files,
Meteor, Node.js and the caches.

It is the macOS counterpart of the Linux Flatpak sandbox in
[../vscodium](../vscodium/README.md); the Windows one is in
[../Windows](../Windows/README.md).

## Quick start

```bash
cd ~/Documents/repos/wekan
docs/Security/Sandboxes/macOS/sandbox.sh --check   # set up, then show what is allowed and refused
docs/Security/Sandboxes/macOS/sandbox.sh           # start VSCodium in the sandbox
```

`sandbox.sh` installs VSCodium with Homebrew if it is missing, writes the
sandbox profile, and writes a Finder launcher, `.tools/sandbox/WeKan
VSCodium.command`. Double-click it or drag it to the Dock to start the
sandboxed VSCodium. The first start asks whether VSCodium may access the
Documents folder: allow it, because the checkout is there.

Install WeKan's tools into `.tools` once, from a normal terminal **outside**
the sandbox (`./build.sh`, option 1). Inside the sandbox they are already on
`PATH`.

## What the sandbox allows and refuses

`sandbox.sh --check` runs these checks inside the sandbox and prints the
result. They were verified on macOS 27:

| | |
| --- | --- |
| **Refused** | the home directory: Desktop, Documents outside the checkout, Downloads, `~/Library`, browser profiles |
| **Refused** | `~/.ssh`, `~/.gitconfig`, the login session's ssh-agent socket |
| **Refused** | other users' homes, `/Users/Shared`, other disks under `/Volumes` |
| **Allowed** | read and write `~/Documents/repos/wekan`, including `.tools/` |
| **Allowed** | the system (`/System`, `/usr`, `/Applications`, `/opt/homebrew`), read only where macOS makes it so |
| **Allowed** | the network, as in the Flatpak (`--share=network`): git, npm, Meteor and tests need it |

## How it works

`sandbox-exec` runs a program under a **Seatbelt** profile: the same
kernel-enforced mechanism macOS uses for App Store apps and its own daemons.
The profile is written by `sandbox.sh` to `.tools/sandbox/vscodium-macos.sb`
with the checkout's real path:

```scheme
(version 1)
(allow default)
(deny file-read* file-write* (subpath "/Users") (subpath "/Volumes"))
(allow file-read-metadata (literal "/") (literal "/Users") (literal "/Users/<you>") ...)
(allow file-read* file-write* (subpath "/Users/<you>/Documents/repos/wekan"))
(deny file-read* file-write* network-outbound
      (regex #"^/private/tmp/com\.apple\.launchd\.[^/]+/Listeners$"))
```

- **Every process VSCodium starts inherits it:** the editor, its helper
  processes, extensions, the integrated terminal and everything run in it
  (`build.sh`, `meteor`, `node`, `git`, Claude Code). A command typed in the
  sandboxed terminal cannot leave the sandbox.
- **A home of its own:** `HOME` is `.tools/home`, as Flatpak gives an app its
  own home. Shell history, npm and git configuration and Claude Code's settings
  land there, not in the real home.
- **VSCodium's own data:** settings and extensions are kept in
  `.tools/vscodium/user-data` and `.tools/vscodium/extensions`, given with
  `--user-data-dir` and `--extensions-dir`. They are not in `~/Library` or
  `~/.vscode-oss`, which the sandbox cannot reach.
- **Temporary files:** `TMPDIR`, `TMP` and `TEMP` are `.tools/tmp`, as for every
  WeKan script (`releases/tools-env.sh`).
- **A clean environment:** VSCodium starts with `env -i`. That drops
  `SSH_AUTH_SOCK`, and `ELECTRON_RUN_AS_NODE`, which an editor's terminal sets
  and which makes VSCodium start as plain Node.js ("bad option:
  --user-data-dir").
- **The commit author:** inside the sandbox `~/.gitconfig` cannot be read, so
  `sandbox.sh` copies `user.name` and `user.email` into the checkout's own
  `.git/config` once, from outside the sandbox. CLAUDE.md asks for exactly
  that identity in the checkout anyway.

## Trade-offs, and why

- **`--no-sandbox` for VSCodium.** Chromium, which VSCodium is built on,
  sandboxes its own helper processes with the same Seatbelt mechanism.
  macOS does not let a process that is already sandboxed start a sandbox of
  its own: every helper then failed with "sandbox initialization failed:
  Operation not permitted", and VSCodium exited. So VSCodium runs with
  Chromium's inner sandbox off, and the outer one confines all of it. The
  helpers are no longer isolated *from each other*, but none of them can
  reach anything outside the checkout. That is the property this sandbox
  exists for. The Flatpak build of VSCodium makes the same trade with
  zypak.
- **`sandbox-exec` is marked deprecated** in its man page, but it has been
  present and working in every macOS release since 10.5, including macOS 27,
  where this was tested. Apple uses the same profiles for its own services.
  If it is ever removed, the alternative is a second macOS user account that
  owns only the checkout. That is stronger but less convenient.
- **The system temporary directory.** macOS frameworks keep a few files in
  the per-user `/var/folders` directory whatever `TMPDIR` says (`mktemp`
  without a template does too), so it is not refused. WeKan's own scripts
  never write there: each names `.tools/tmp`.
- **No ssh keys inside.** The sandbox cannot read `~/.ssh` or use the agent,
  as `--nosocket=ssh-auth` refuses it in the Flatpak. Pushing is done from a
  terminal outside the sandbox. That is also the rule for AI assistants in
  CLAUDE.md: they commit, and a human pushes.
- **The network is open,** as in the Flatpak. Restricting it would need a
  proxy and would break git, npm, Meteor and the tests that download
  browsers and databases.

## Updating and removing

- **Update VSCodium:** run `brew upgrade --cask vscodium` outside the sandbox.
- **Change the profile:** edit `sandbox.sh` and run it again. The `.sb` file
  is regenerated and says so in its first line.
- **Remove everything:** delete `.tools/sandbox`, `.tools/home` and
  `.tools/vscodium`. Nothing outside the checkout was changed, except
  VSCodium in `/Applications` if Homebrew installed it.
