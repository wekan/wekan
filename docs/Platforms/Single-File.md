# Single-file WeKan

One file is all of WeKan: the server, Node.js and the FerretDB database. Download
the one for your computer, put it in a directory of its own, and run it.

| Platform | File |
| --- | --- |
| Linux x86-64 | `wekan-<version>-amd64-single-file` |
| Linux arm64 | `wekan-<version>-arm64-single-file` |
| Linux armv7, armhf, armv6, i386, ppc64le, riscv64, s390x, loong64 | `wekan-<version>-<cpu>-single-file` |
| Windows x64, x86, arm64 | `wekan-<version>-win64-single-file.exe`, `-win32-`, `-win-arm64-` |
| macOS Apple Silicon, Intel | `wekan-<version>-mac-arm64-single-file`, `-mac-x64-` |
| FreeBSD, OpenBSD, NetBSD | `wekan-<version>-freebsd-x64-single-file` and so on, once that BSD has a WeKan bundle ([BSD](FOSS/OS/BSD.md)) |
| Android (Termux) | `wekan-<version>-android-arm64-single-file`, once Android has a WeKan bundle |

Each release has a single file for every platform it has a WeKan bundle for.
Every file has a `.sha256sum` beside it.

A platform whose Node.js the archive cannot be injected into correctly has no
single file in that release, and the release log says why. Up to v12.51 these
were i386, whose Node.js was an i386 PIE, and freebsd-x64, whose Node.js was a
non-PIE with two bss-like segments
(`releases/single-file/sea-inject.mjs`). wekan/node-patches builds both the
way the injection needs, and they are built again from the first release with
those Node.js binaries.

## Starting it

```
./wekan-12.40-amd64-single-file
```

On Windows, double-click it. In a terminal it opens the menu below. Started
without a terminal (by a service manager, for example), it starts WeKan.

WeKan is then at <http://localhost:8080>.

## Where its files are: wekan-files

Everything WeKan writes goes in **one directory beside the executable**,
`wekan-files`. To move or copy WeKan, move or copy the executable and
`wekan-files` together.

| Directory | What is in it |
| --- | --- |
| `wekan-files/attachments` | card attachments |
| `wekan-files/avatars` | profile pictures |
| `wekan-files/db` | the database (FerretDB with SQLite) |
| `wekan-files/bin` | FerretDB, the one program copied out of the executable |
| `wekan-files/backup` | backups, one directory each: `YYYY-MM-DD_HH-MM-SS` |
| `wekan-files/logs` | `wekan.log`, when WeKan runs in the background |
| `wekan-files/versions` | earlier versions, kept when you change version |
| `wekan-files/run` | `wekan.pid` while WeKan runs |
| `wekan-files/wekan.env` | settings |

`WRITABLE_PATH` points at `wekan-files`. Set `WRITABLE_PATH` yourself to keep
the data somewhere else, as on every other platform.

## What is extracted: only FerretDB

The executable is Node.js with a ZIP inside it. Node.js reads WeKan from that ZIP
as a virtual file system, without unpacking it. About 30,000 files stay inside
the executable, and nothing is written to `/tmp`.

- **FerretDB** is a separate program, and an operating system can start a program
  only from a real file. It is copied once to `wekan-files/bin`, checked against
  the SHA-256 recorded when the executable was built, and reused after that.
- **Native modules** (image handling, password hashing) are loaded by Node.js
  itself from a private in-memory copy (a memfd on Linux), and never written next
  to your data.

## The menu

```
WeKan 12.40 (amd64) - running at http://localhost:8080
Files: /home/me/wekan/wekan-files

  1) Start WeKan (in the background)
  2) Stop WeKan
  3) Status
  4) Version info
  5) Update to the newest version
  6) Change to another version (newer or older)
  7) Backup now
  8) Run automatically at boot: install
  9) Run automatically at boot: remove
 10) Show the log
 11) Settings: port and address
 12) Start WeKan here, in this window (Ctrl-C stops)
  0) Quit
```

| Entry | What it does |
| --- | --- |
| Start WeKan (in the background) | starts FerretDB and WeKan, logging to `wekan-files/logs/wekan.log`. If WeKan exits, both are restarted 3 seconds later, as `start-wekan.sh` does |
| Stop WeKan | stops both |
| Status | running or stopped, since when, at which address and whether it answers, whether it starts at boot, how many backups there are |
| Version info | what Admin Panel → Settings → Version shows, as text lines: WeKan, OS, CPUs, memory, Node.js, Meteor, FerretDB, database size, attachments. It works even when WeKan is stopped |
| Update to the newest version | downloads the newest release's single file for this platform, checks its SHA-256, backs up, and replaces the executable. A WeKan that was running is started again with the new version |
| Change to another version (newer or older) | lists the versions that have a single file for this platform, and the ones kept in `wekan-files/versions`, then does the same as Update with the version you choose. Going back to an older version is possible, but a database the newer version has already upgraded may not work in the older one. That is why a backup is always made first |
| Backup now | copies `db`, `attachments`, `avatars` and `wekan.env` to `wekan-files/backup/YYYY-MM-DD_HH-MM-SS`. A running WeKan is stopped for the copy and started again, because a database copied while it is being written is not a backup |
| Run automatically at boot: install | see below |
| Run automatically at boot: remove | undoes it |
| Show the log | the last lines of `wekan.log` |
| Settings: port and address | writes `PORT` and `ROOT_URL` to `wekan.env` |
| Start WeKan here, in this window (Ctrl-C stops) | runs WeKan in the foreground, with its output on screen |
| Quit | leaves the menu. A WeKan running in the background keeps running |

The executable you started is replaced in place when you change version. The
previous one is kept as `wekan-files/versions/wekan-<version>`.

To restore a backup: stop WeKan, then copy the backup's `db`, `attachments` and
`avatars` back into `wekan-files`.

### The same without the menu

Every menu entry is also a command, for SSH, scripts and service managers:

```
wekan start                 # foreground; --background for the background
wekan stop | status | version | log
wekan versions              # what can be installed
wekan update                # the newest version
wekan use 12.38             # another version
wekan backup
wekan autostart install | remove | status
wekan set PORT 3000         # any setting, in wekan-files/wekan.env
```

## Settings: wekan.env

`wekan-files/wekan.env` holds one `KEY=VALUE` per line. It is read every time
WeKan starts, from the menu, from a terminal or at boot. Anything WeKan
understands can go there, such as `MAIL_URL`, `MAIL_FROM` or `ROOT_URL`.
A variable set in the real environment takes precedence over the file.

The defaults are the bundle's (`start-wekan.sh`):

- `PORT=8080`;
- `ROOT_URL` from the port;
- `WITH_API=true`, which exports need;
- FerretDB on `127.0.0.1:27017`;
- Node.js gets 3/5 of the memory, up to 4 GiB, and FerretDB 1/5, up to 1 GiB.

To use another database, set `MONGO_URL` to it, and the bundled FerretDB is not
started.

## Run automatically at boot

| System | How |
| --- | --- |
| Linux with systemd | as root, a system service `/etc/systemd/system/wekan.service`. Otherwise a user service in `~/.config/systemd/user` with lingering turned on (`loginctl enable-linger`), so it starts at boot rather than at login |
| Linux without systemd, FreeBSD, OpenBSD, NetBSD | an `@reboot` line in your crontab |
| macOS | as root, a LaunchDaemon. Otherwise a LaunchAgent, which starts at login |
| Windows | Task Scheduler: at startup as SYSTEM when run as administrator, otherwise at logon |
| Android (Termux) | `~/.termux/boot/wekan`, for the Termux:Boot app |

The entry names the executable's path. After moving the executable, install it
again.

## Platform notes

- **Linux:** Node.js needs `libatomic.so.1` from the system before anything
  inside the executable can run. Most distributions have it. On a minimal one,
  install it first: `apt install libatomic1`, `dnf install libatomic`,
  `apk add libatomic`.
- **macOS:** the executable is ad-hoc signed (`codesign --sign -`) when it is
  built. A browser marks a download as quarantined. If macOS refuses to open it,
  run `xattr -d com.apple.quarantine wekan-…-single-file` once.
- **OpenBSD:** V8 needs memory that is both writable and executable. Run the
  executable from a filesystem mounted `wxallowed`, such as `/usr/local`.
- **Windows:** the single file is unsigned, like the other Windows downloads, so
  SmartScreen may ask for confirmation the first time.

## How it is built

`.github/workflows/single-file.yml` runs for every release, after the bundles
(`release-all.yml`). For each platform in `releases/single-file/targets.json`:

1. It downloads that platform's published bundle ZIP and checks its SHA-256. A
   platform whose bundle the release does not have is skipped, not failed.
2. `releases/single-file/build.mjs` writes one ZIP containing:
   - the bundle, without its Node.js, FerretDB, the MongoDB tools and the shell
     launchers;
   - the launcher (`releases/single-file/`);
   - FerretDB under `bin/`;
   - `single-file.json`, recording the version, the platform and FerretDB's
     checksum.

   It then builds a Node.js single executable application from the bundle's own
   Node.js with that ZIP (`"useVfs": true`, `"vfsArchive"`). Node.js must be the
   same version as the bundle's, which the script checks. macOS files are built
   on a Mac so they can be signed again.
3. It starts the file on a runner of that platform where GitHub has one: Linux
   x86-64 and arm64, Windows x64, x86 and arm64, and macOS arm64. On Linux x86-64
   it also runs the browser tests against it
   (`tests/playwright/specs/single-file.e2e.js`).
4. It attaches the files that started, and the ones there is no runner for, to
   the release.

`release-all-missing.yml` builds only the single files a release does not have
yet.

To build one yourself from a downloaded bundle, use the same Node.js version as
the bundle:

```
unzip wekan-12.40-amd64.zip
node releases/single-file/build.mjs --bundle bundle --target amd64 \
     --version 12.40 --out wekan-12.40-amd64-single-file
```

## How it works inside

| File | |
| --- | --- |
| `releases/single-file/launcher.cjs` | the entry point. The same executable is the launcher, WeKan's server (`WEKAN_SINGLE_FILE_ROLE=server`) and the recovery scripts |
| `lib/server.cjs` | starts Meteor from the archive. Meteor's `main.js` changes directory into the bundle, which the operating system cannot do inside a virtual file system, so the working directory is virtual: `process.cwd()` reports the bundle's directory |
| `lib/stack.cjs` | the restart loop of `start-wekan.sh`: SQLite recovery, a requested restore, FerretDB, the recovery page, WeKan |
| `lib/config.cjs` | the environment, `wekan.env` and the memory budget |
| `lib/ferretdb.cjs` | copies FerretDB out once and verifies it |
| `lib/releases.cjs` | versions, downloads and checksums, replacing the executable |
| `lib/backup.cjs`, `lib/autostart.cjs`, `lib/info.cjs`, `lib/status.cjs`, `lib/cli.cjs` | the menu entries |
| `lib/vfsWorkarounds.cjs` | Node.js 26.11.1 breaks `fs.writev` and `fs.readv` for every file while a virtual file system is mounted, and with them every multi-chunk file write. They are rebuilt here on `fs.write` and `fs.read`. `tests/singleFile.test.cjs` reports when Node.js has fixed this |
| `models/lib/filesRoot.js` | lets WeKan treat a `WRITABLE_PATH` named `wekan-files` as the files directory itself |

Tests:

- `tests/singleFile.test.cjs` builds a real single executable from a stand-in
  bundle, then starts it, stops it, and drives its menu.
- `tests/playwright/specs/single-file.e2e.js` runs in a browser against a real
  single file.

The older [Windows single EXE](Propietary/OS/Windows/Offline.md) is still
published beside the single files. It unpacks about thirty files, Node.js among
them, into `wekan-app`.

## Bun single files

Every release also has a single file made from each [Bun bundle](../../releases/bun/README.md):
`wekan-<version>-bun-<target>-single-file` (`.exe` on Windows) for
`linux-x64`, `linux-arm64`, `linux-x64-musl`, `linux-arm64-musl` (Alpine and
other musl systems), `macos-x64`, `macos-arm64`, `windows-x64` and
`windows-arm64`. FreeBSD and Android have Bun bundles but no single file,
because GitHub has no runner of theirs to build and check one on.

They are smaller and simpler than the Node.js single files above, because a
Bun bundle is: **there is no database inside and no menu**. Start it like
`bundle/start-wekan.sh`:

```
MONGO_URL=mongodb://127.0.0.1:27017/wekan ROOT_URL=http://localhost:3000 ./wekan-12.41-bun-linux-x64-single-file
```

`PORT` is 3000 unless set. `--version` prints what it is, and
`--extract-only` only unpacks and prints where.

The first start unpacks the bundle into a cache directory, and every later
start uses it, so only the first one waits:

| OS | Cache |
| --- | --- |
| Linux and other Unix | `$XDG_CACHE_HOME/wekan/single-file`, else `~/.cache/wekan/single-file` |
| macOS | `~/Library/Caches/wekan/single-file` |
| Windows | `%LOCALAPPDATA%\wekan\single-file` |
| any | `WEKAN_SINGLE_FILE_CACHE`, when set |

Each version gets its own directory there, named after the bundle's SHA-256,
so an old one can be deleted at any time. The single file never writes
anywhere else.

How it is built (`.github/workflows/bun-single-file.yml`): on a runner of each
platform, Alpine for musl, the published Bun bundle ZIP is checked against its
`.sha256sum`, and the bundle's OWN `bun` compiles
`releases/single-file/bun/launcher.mjs` with that ZIP inside, unchanged
(`releases/single-file/bun/build.mjs`). So the runtime is exactly the one the
bundle was built and tested with. The launcher extracts the ZIP itself
(`releases/single-file/bun/unzip.mjs`, which refuses any entry or link that
would land outside the cache directory) - without the bundle's `bun`, because
the single file IS that Bun - and then runs the bundle's `index.mjs` with
itself as Bun (`BUN_BE_BUN=1`). Before it is published,
`releases/single-file/bun/build-and-check.sh` checks that it names itself,
refuses to start without a database, extracts once and reuses that, and loads
every native addon of the bundle. `tests/bunSingleFile.test.cjs` covers the
extraction and its refusals.
