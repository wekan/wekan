# WeKan on the BSDs

Which BSD can run WeKan now, what each one is missing, and in what order the gaps
are being closed. The BSDs run WeKan as a **server**, and people use it from a
browser. How each BSD installs and updates software is in
[OS-future-alternatives/BSD.md](OS-future-alternatives/BSD.md).

WeKan needs three things on a platform:

- a JavaScript runtime: **Node.js**, or **Bun** for the Bun bundles;
- a database: **FerretDB** (built by
  [wekan/FerretDB](https://github.com/wekan/FerretDB)), or MongoDB where it
  exists;
- the **native modules** rebuilt for that OS, such as Sharp for images and
  bcrypt.

## Where each BSD stands

| BSD | WeKan bundle now | FerretDB | Node.js | Bun |
| --- | --- | --- | --- | --- |
| **FreeBSD** | **Bun bundles `freebsd-x64` and `freebsd-arm64`**, built and smoke-tested in a FreeBSD 14.5 VM, with Sharp compiled natively there | amd64, arm64, i386, armv7, armv6, armel | [node-patches](https://github.com/wekan/node-patches) builds `node-freebsd-x64`; FreeBSD's own packages have Node.js too | x64, arm64 |
| **OpenBSD** | none yet | amd64, arm64 | not yet built by node-patches; OpenBSD ports have Node.js 24 (`lang/node`, 52 patches) | — |
| **NetBSD** | none yet | amd64 | not yet built by node-patches; pkgsrc has Node.js (`lang/nodejs*`) | — |
| **DragonFly BSD** | none yet | not built yet (Go can build it: `GOOS=dragonfly`) | not built anywhere by WeKan; DPorts has Node.js | — |

None of the BSDs have Snap, Flatpak or Docker, and no BSD has a WeKan Electron
desktop app. On FreeBSD, the Linux compatibility layer (Linuxulator) can run
the Linux bundle, but that is not tested yet.

The database: MongoDB has no official BSD builds, though FreeBSD ports carry
some versions. FerretDB stores its data in **SQLite** on every BSD, so a BSD
needs no separate database server.

## The plan, easiest first

1. **FreeBSD Node.js bundle (x64).** Both binaries already exist:
   `node-freebsd-x64` from node-patches and `ferretdb-freebsd-amd64` from
   wekan/FerretDB. The remaining work is a bundle job that rebuilds the native
   modules inside a FreeBSD VM, the way the Bun job already does. **In
   progress.**
2. **FreeBSD Node.js arm64, maybe i386 and armv7.** node-patches builds them in a
   FreeBSD VM; GitHub Actions has FreeBSD VMs for x64 and arm64.
3. **OpenBSD amd64/arm64 and NetBSD amd64.** FerretDB is there already. Node.js
   26 needs porting first: node-patches adapts the patch sets the OS packagers
   maintain (OpenBSD ports `lang/node`, pkgsrc `lang/nodejs`) to Node.js 26,
   as it adapted Termux's for Android, and builds in an OpenBSD or NetBSD VM.
   Then each gets a bundle job like FreeBSD's. **In progress.**
   - Node.js treats OpenBSD as an experimental platform, and does not list
     NetBSD (`configure.py` has no `netbsd`). Expect patches.
   - OpenBSD's W^X protection: V8 writes and runs machine code, so the
     `node` binary is marked `wxneeded`, as the OpenBSD port does
     (`USE_WXNEEDED`). It must run from a filesystem mounted `wxallowed`,
     such as `/usr/local`.
4. **DragonFly BSD amd64.** FerretDB needs only a new Go build target. Node.js
   would come from DPorts or a node-patches VM build. It is the least tested
   Node.js platform of the four.
5. **The Linux bundle under FreeBSD's Linux compatibility layer,** documented
   and tested in CI: little work, and it covers more CPUs right away.

Every one of these is built and verified on GitHub Actions, and the build logs
are where progress is checked.

## Status per item

| Item | Repository | State |
| --- | --- | --- |
| 1. FreeBSD Node.js bundle x64 | wekan/wekan | in progress |
| 3. OpenBSD and NetBSD Node.js | wekan/node-patches | in progress: porting patches |
| 3. OpenBSD and NetBSD bundles | wekan/wekan | after node-patches publishes the binaries |
| 2, 4, 5 | | planned |

## See also

- [Platforms](../../Platforms.md): every platform's bundle, FerretDB and Node.js
  assets.
- [FreeBSD](FreeBSD.md): older FreeBSD notes.
- [OS-future-alternatives/BSD.md](OS-future-alternatives/BSD.md): how the BSDs
  install and update software.
