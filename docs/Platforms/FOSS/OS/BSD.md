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

## Existing patches for Node.js and the rest

Each BSD's own packagers already maintain patches for Node.js. WeKan builds
on those instead of starting from nothing. Surveyed October 2026:

| BSD | Patch source | Node.js version there | Patches | What WeKan does with it |
| --- | --- | --- | --- | --- |
| FreeBSD | ports [`www/node26`](https://github.com/freebsd/freebsd-ports/tree/main/www/node26) (also `node24`, `node22`) | 26.10.0 | 10, almost all for armv7/ppc64 or shared system libraries | none needed for x64: node-patches builds `node-freebsd-x64` unpatched. Two (no-asm OpenSSL, a `platform-freebsd.cc` cast) will be needed for arm64 |
| OpenBSD | ports [`lang/node`](https://github.com/openbsd/ports/tree/master/lang/node), maintained by Volker Schlecht | 24.21.0 | 52 | **rebased onto Node 26** in node-patches `dist/openbsd`. 37 are carried for amd64/arm64 with bundled dependencies; the rest are i386/riscv64, npm or test-only, or already in Node 26 |
| NetBSD | pkgsrc [`lang/nodejs`](https://github.com/NetBSD/pkgsrc/tree/trunk/lang/nodejs) | **26.11.1**, the same version WeKan uses | 26 | **carried** in node-patches `dist/netbsd`; 18 apply to an x86-64 build with bundled dependencies |
| DragonFly BSD | [DeltaPorts](https://github.com/DragonFlyBSD/DeltaPorts) `www/node24`, overlaying FreeBSD's port | 24 (unproven; the last confirmed build was 22.16.0) | 13 on top of FreeBSD's | not yet: it needs GCC 13, is x86-64 only, and FerretDB's SQLite does not build for DragonFly |

Upstream Node.js (`configure.py` and BUILDING.md, v26.11.1):

- FreeBSD x64 is **Experimental**.
- `openbsd` is a valid OS, but OpenBSD is not listed in BUILDING.md.
- `netbsd` is not a valid `--dest-os`; gyp detects it instead.
- DragonFly BSD builds as `freebsd`.

**The other parts of a bundle:**

- **Bun:** official builds for FreeBSD x64 and arm64 only. There is no Bun for
  OpenBSD, NetBSD or DragonFly BSD.
- **Sharp (images):** sharp 0.35 needs libvips 8.18.7 or newer. NetBSD's pkgsrc
  has it; FreeBSD and OpenBSD ports have 8.18.6. The Node.js bundles therefore
  use sharp's WebAssembly build on the BSDs, and the FreeBSD Bun bundle compiles
  sharp against the system libvips.
- **bcrypt, argon2:** plain node-gyp, compiled on each BSD with no patches.
- **FerretDB (Go plus pure-Go SQLite):** builds for FreeBSD, OpenBSD and NetBSD
  x86-64; NetBSD arm64 and DragonFly BSD have no SQLite build.
- **OpenBSD 7.8 or newer:** Node.js 26 needs Clang 19, which OpenBSD has in
  base from 7.8, so node-patches builds on 7.8 and the bundle needs 7.8 or
  newer.
- **NetBSD's OpenSSL:** Node's bundled OpenSSL had no NetBSD configuration;
  node-patches gives it FreeBSD's (`dist/netbsd/netbsd-openssl-config.patch`).
- **OpenBSD W^X:** `node` is linked `wxneeded` and must run from a filesystem
  mounted `wxallowed`. **Install the OpenBSD bundle under `/usr/local`**, which
  is mounted that way by default, or add `wxallowed` to the mount it is on.
- **NetBSD PaX:** `node` carries `paxctl +m`, set when node-patches builds it,
  so PaX MPROTECT lets V8 run.

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
   Then each gets a bundle job like FreeBSD's. **Ported, waiting for the
   node-patches release.**
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
| FreeBSD rc.d service script | wekan/wekan | in the FreeBSD bundle as `bundle/rc.d/wekan` ([FreeBSD](FreeBSD.md)); a ports Makefile is outlined there, for proposing to FreeBSD |
| 3. OpenBSD and NetBSD Node.js | wekan/node-patches | patch sets carried (`dist/openbsd`, `dist/netbsd`) and VM builds added; waiting for its next Release All |
| 3. OpenBSD and NetBSD bundles | wekan/wekan | `bsd.yml` builds them automatically once node-patches has published those binaries |
| 2, 4, 5 | | planned |

## See also

- [Single-file WeKan](../../Single-File.md): each BSD bundle becomes one
  executable too, built automatically once that bundle is published.
- [Platforms](../../Platforms.md): every platform's bundle, FerretDB and Node.js
  assets.
- [FreeBSD](FreeBSD.md): older FreeBSD notes.
- [OS-future-alternatives/BSD.md](OS-future-alternatives/BSD.md): how the BSDs
  install and update software.
