# WeKan Snap — CPU platforms and databases

This page documents, **for the WeKan snap**, which CPU architectures are built,
which database binaries each one ships, how new installs choose their database,
and how the one-time MongoDB 3 → FerretDB v1 migration works.

## Summary

- **New installs use FerretDB v1 (SQLite) by default on every CPU architecture.**
  FerretDB v1 is the wekan/FerretDB fork with an embedded pure-Go SQLite backend
  that speaks the MongoDB wire protocol, so WeKan talks to it exactly like MongoDB.
- **Six architectures are built as snaps**: amd64, arm64, armhf, ppc64el, riscv64
  and s390x — exactly `snapcraft.yaml`'s `build-for:` list. i386, armv6 and armv7
  are release bundles but **not** snaps, for reasons that are not oversights; see
  [CPU architecture names](#cpu-architecture-names-and-what-they-mean).
- **MongoDB 7 *server* binaries (mongod) are included for amd64 and arm64 only.**
  The other architectures (armhf, ppc64el, riscv64, s390x) have no MongoDB server
  — they run FerretDB v1 only.
- **Every Snap platform includes the FerretDB v1 server and the MongoDB Database
  Tools** (`mongodump`, `mongorestore`, `mongofiles`, `mongoexport`, …), on every
  architecture.
- **`mongosh` is NOT bundled at all.** WeKan already ships Node.js 24 and the
  `mongodb` driver, and all scripted database access (readiness checks,
  replica-set init, schema migration) uses that via `$SNAP/bin/db-eval` instead of
  the MongoDB Shell. This removes a large, CVE-prone binary and works identically
  on every architecture. See [MongoDB client binaries](#mongodb-client-binaries-source-and-availability).
- **The MongoDB Database Tools are downloaded from WeKan's own fork, not from the
  MongoDB website** — `mongodump-<arch>` etc. from
  [wekan/mongo-tools-patches](https://github.com/wekan/mongo-tools-patches/releases).
- **Existing MongoDB 7 data (amd64/arm64) is NOT migrated to FerretDB v1** — that
  snap keeps using its existing MongoDB 7.
- **Only the amd64 snap migrates existing MongoDB 3 data to FerretDB v1** (see
  [Migration](#mongodb-3--ferretdb-v1-migration-amd64-only) below).

## Per-architecture matrix

| Snap arch | Bundle | MongoDB 7 server (mongod) | MongoDB Database Tools | FerretDB v1 server | MongoDB 3 → FerretDB migration | Default DB (new install) |
|-----------|--------|:------------------------:|:----------------------:|:------------------:|:------------------------------:|:------------------------:|
| amd64     | `amd64`   | ✅ | ✅ | ✅ | ✅ (if MongoDB 3 data present) | FerretDB v1 |
| arm64     | `arm64`   | ✅ | ✅ | ✅ | ❌ | FerretDB v1 |
| armhf     | `armhf`   | ❌ | ✅ | ✅ | ❌ | FerretDB v1 |
| ppc64el   | `ppc64le` | ❌ | ✅ | ✅ | ❌ | FerretDB v1 |
| riscv64   | `riscv64` | ❌ | ✅ | ✅ | ❌ | FerretDB v1 |
| s390x     | `s390x`   | ❌ | ✅ | ✅ | ❌ | FerretDB v1 |

These six are exactly the `build-for:` entries in `snapcraft.yaml`. The **Bundle**
column is the release-asset name at
[github.com/wekan/wekan/releases](https://github.com/wekan/wekan/releases), which
is not always the Snap Store's name for the same hardware — see
[CPU architecture names](#cpu-architecture-names-and-what-they-mean).

- **MongoDB 7 server (mongod)**: amd64/arm64 only (MongoDB ships no server for the others).
- **MongoDB Database Tools**: every arch — WeKan builds them for all platforms from
  [wekan/mongo-tools-patches](https://github.com/wekan/mongo-tools-patches) (they are pure Go).
- **mongosh**: not bundled on any arch — replaced by the bundled Node.js 24 +
  `mongodb` driver (`$SNAP/bin/db-eval`).

All architectures default new installs to FerretDB v1 with `DDP_TRANSPORT=sockjs`
and polling reactivity.

## CPU architecture names and what they mean

An architecture can go by one name in the release bundles and another in the Snap
Store, and two names that look like variants of each other can be different
builds. Nothing warns about either: an unrecognised `--arch` is simply an
architecture the store has never heard of, so a wrong name looks like it worked.
The mapping is kept in one place, `models/lib/snapArchitectures.js`, and is unit
tested (`tests/snapArchitectures.test.cjs`).

### ppc64le and ppc64el are the same hardware

64-bit little-endian POWER. The bundles name it the way Node.js and the kernel do
(`ppc64le`); the Snap Store names it the way Debian does (`ppc64el`). It is the
**only** architecture whose two names differ, and a test asserts that stays true.

### armhf and armv7 are the same CPU family, built to different baselines

This one is not a naming difference, and getting it wrong ships a snap that
crashes. [wekan/node-patches](https://github.com/wekan/node-patches) builds two
32-bit ARM Node.js binaries:

| Bundle | Built for | Runs on |
|--------|-----------|---------|
| `armhf` | hard-float, **VFPv3-D16**, no NEON assumed — the Debian armhf baseline | **any** ARMv7-A board |
| `armv7` | hard-float, **NEON**, ARMv7-A tuned | only boards that have NEON (an ODroid-U3, say) |

The Snap Store has **one** 32-bit ARM architecture, `armhf`, and it serves every
such device. It must therefore carry the **baseline** build: the NEON one would
be an illegal instruction on any armhf board without NEON. So the armhf snap uses
the `armhf` bundle, and **`armv7` has no snap** — it ships as a bundle only. A
separate snap name or track would be the only way to offer the NEON build, which
is not worth a second listing for one board family.

### armv6 has no snap, because the store has no such architecture

ARMv6 is the Raspberry Pi 1 and the Pi Zero: 32-bit ARM with **VFPv2** hardware
floating point and **no NEON**. The Snap Store's only 32-bit ARM architecture is
`armhf`, which is the **ARMv7-A** hard-float baseline — an ARMv6 board cannot run
an armhf snap, and there is no armv6 architecture to publish one as. So there is
nothing to fix here and nothing to add: **armv6 ships as a release bundle zip**,
and nothing else in the Snap Store. (It is a candidate platform of the Docker
image too, gated on a base image that publishes `linux/arm/v6` — see
[Docker CPU platforms](../Docker/CPU-platforms.md#armv6-wired-end-to-end-waiting-on-a-base-image).)

It is a separate build from armhf all the way down, not a re-tag of it:
[wekan/node-patches](https://github.com/wekan/node-patches) builds `node-armv6`
(`--with-arm-fpu=vfp`, `-march=armv6+fp`) because nobody publishes an ARMv6
Node.js any more — nodejs.org dropped it after Node 11 —
and [wekan/FerretDB](https://github.com/wekan/FerretDB) and
[wekan/mongo-tools-patches](https://github.com/wekan/mongo-tools-patches) build
`GOARM=6` binaries beside their armhf ones. Their `armel` (`GOARM=5`) would run
on an ARMv6 board, which is what makes it look like a substitute: it does
floating point in **software**, so it is not one.

`models/lib/snapArchitectures.js` records this reason in
`NOT_SNAP_ARCHITECTURES`, beside i386's and armv7's, and
`tests/releaseSnapArches.test.cjs` asserts armv6 is neither a snap platform nor a
Launchpad build.

### i386 has no snap, and cannot have a new one

core24 is Ubuntu 24.04, which has **no i386 port**, so there is no i386 core24
base snap. `build-on: i386` is not merely unsupported — it is a **parse error**,
and because snapcraft parses the whole file first it failed *every* architecture's
build, not only i386's. This is not something a patch set can fix the way
[node-patches](https://github.com/wekan/node-patches) fixes a missing Node.js
build: node-patches patches source so a binary *can* be built, whereas here the
**base snap itself does not exist** for the architecture. The last base with a
real i386 port was `core18`, which is end-of-life.

The Snap Store still shows an i386 column for **wekan-ondra** (revision 70,
version `0.X-ci`) because the store keeps whatever was ever uploaded. It is years
stale, nothing new can be built for it, and re-releasing it would only re-publish
`0.X-ci`. **i386 users are served by the .deb and the AppImage.**

### loong64, win64, win32, win-arm64, mac-x64, mac-arm64

Bundle platforms with no Snap Store architecture at all. They are not snaps and
are not expected to be.

### The whole bundle list, and which of it is a snap

The release builds fifteen bundles; six of them become snaps. The rest are
bundles (and, for some, Docker images) only:

| Bundle | Snap? | Why not |
|--------|-------|---------|
| `amd64`, `arm64`, `armhf`, `ppc64le` (→ `ppc64el`), `riscv64`, `s390x` | ✅ | — |
| `armv6` | ❌ | the store has no armv6 architecture |
| `armv7` | ❌ | the store's one 32-bit ARM slot must carry the armhf baseline |
| `i386` | ❌ | core24 has no i386 port |
| `loong64`, `win64`, `win32`, `win-arm64`, `mac-x64`, `mac-arm64` | ❌ | no Snap Store architecture at all |

## New installs

On a fresh install, every architecture starts on **FerretDB v1 (SQLite)** with
these snap defaults (in [`snap-src/bin/config`](../../../../../snap-src/bin/config)):

- `database` = `ferretdb` — FerretDB v1 is the default backend.
- `ddp-transport` (`DDP_TRANSPORT`) = `sockjs` — maximum proxy compatibility.
- Reactivity = **polling**. FerretDB v1 has no replica-set oplog or change
  streams, so WeKan uses polling for live updates (it does this automatically
  when the backend is FerretDB).

On amd64/arm64 you can still switch an install to the bundled MongoDB 7 server:

```
# Nothing to set: WeKan runs on FerretDB on every platform, and an amd64/arm64
# snap that still has MongoDB data migrates it by itself. See
# Migration-to-FerretDB.md
```

## MongoDB client binaries: source and availability

WeKan does not download MongoDB clients from the MongoDB website:

- **MongoDB Database Tools** come from [wekan/mongo-tools-patches](https://github.com/wekan/mongo-tools-patches/releases).
  These are pure Go, so its `build-binaries.yml` workflow cross-compiles **every
  architecture** (`bsondump`, `mongodump`, `mongoexport`, `mongofiles`,
  `mongoimport`, `mongorestore`, `mongostat`, `mongotop`), including arches MongoDB
  never shipped tools for (riscv64, loong64). Every WeKan build (snap, bundle,
  Docker, Sandstorm) downloads the one `<tool>-<arch>` it needs from the newest
  release.
- **`mongosh` is not used at all.** It is a large Node.js-packaged binary (it
  embeds its own Node and drags in a heavy, CVE-prone dependency tree) that cannot
  be cross-compiled for s390x/ppc64le/riscv64. Since WeKan already bundles Node.js
  24 and the `mongodb` driver, every scripted MongoDB/FerretDB operation the snap
  used mongosh for — readiness `ping`, replica-set `initiate`/`status`, the v8.43
  schema migration — now runs through `$SNAP/bin/db-eval` (a tiny wrapper around
  the bundled Node + driver). This works identically on every architecture and
  removed the mongosh binary from the snap entirely.

The `mongo` shell that IS still present is only the legacy MongoDB 3.2 `mongo`
(from `migratemongo`, amd64 only), used at migration time to read old MongoDB 3
data — the modern driver cannot speak to a 3.2 server. It is not used at runtime.

## MongoDB 3 → FerretDB v1 migration (amd64 only)

Only the **amd64** snap ships the MongoDB 3-specific binaries (the legacy MongoDB
3.2 `mongo` shell + `mongofiles`, bundled via `migratemongo`). They are used **at
migration time only** — a one-time conversion of old data — and are **never a
runtime component**: after the migration WeKan runs on FerretDB v1 and the
MongoDB 3 binaries are not used again. No other architecture ships them at all
(s390x/ppc64le/riscv64 never had a MongoDB 3, so there is nothing to migrate).

The migration runs only on amd64, and only when existing **MongoDB 3** data (from
an old WeKan 6.09-era snap) is present. During the migration **both databases run
at the same time on different ports** — MongoDB 3 on its port and FerretDB v1 on
its port — and data moves directly from one to the other:

- **Attachments and avatars** (binary files): read from the MongoDB CollectionFS
  GridFS and MongoDB Meteor-Files GridFS collections with the MongoDB 3-specific
  `mongofiles` command, and written to:
  - `$SNAP_COMMON/files/attachments/`
  - `$SNAP_COMMON/files/avatars/`
- **Text data** (all boards and other non-file data — everything that is *not*
  attachments or avatars): copied directly from the MongoDB 3 port to the
  FerretDB v1 port using the legacy MongoDB 3 `mongo` CLI (mongo shell); the
  modern `mongosh` cannot talk to a MongoDB 3 server.

After a successful migration the snap switches to `database=ferretdb`.

Architectures other than amd64 ship no MongoDB server and no MongoDB 3 client, so
there is nothing to migrate from — they are FerretDB v1 from the first boot.

### Which MongoDB databases the snap can migrate from

**Three readers, on amd64 and arm64.** A MongoDB server only starts on data whose
`featureCompatibilityVersion` is at most one major behind it, so which versions
can be read is a property of which servers the snap carries:

| Reader | Opens data from | Used for |
|--------|-----------------|----------|
| mongod 7 (the server it runs) | MongoDB 6.0, 7.0 | the running database, and reading a 6/7 one to migrate |
| **mongod 4.2** (migration only) | MongoDB 4.0, 4.2 | reading a 4.x database to migrate |
| the MongoDB 3.2 tools (`migratemongo`) | MongoDB 3.2 | reading a 6.09-era database to migrate |

mongod 4.2 is bundled for **amd64 and arm64 only** — MongoDB publishes no 4.2 for
the others, and they have been FerretDB from their first boot, so there is nothing
there to migrate from. It carries its own OpenSSL 1.1, because core24 ships
OpenSSL 3 and the 4.2 build will not load without 1.1. It is used **only to read**
during a migration; the running database is never mongod 4.2.

What is still unreadable, therefore: **3.4, 3.6, 4.4 and 5.0**. A database from
one of those gets the page below rather than a migration.

### A database from a MongoDB none of the three can read

A database left by a **MongoDB 4.4 or 5.0** snap (or a 3.4/3.6 one) opens in none
of them — mongod 7 refuses it with

```
This version of MongoDB is too recent to start up on the existing data files.
Try MongoDB 4.2 or earlier.
```

and neither mongod 4.2 nor the 3.2 tools can open them either. Reading those
files needs a server the snap does not carry, so **no retry can succeed**, and
there is nothing the snap can migrate from.

What it does instead of trying: it **stops**, writes
`$SNAP_COMMON/.mongodb-data-too-old` with the version mongod itself named as
still able to read the data, and serves an explanatory page on the web port
instead of 502. MongoDB is not started (a start that cannot work would be
restarted by snapd forever, and used to bounce between mongod and the migration
three times before giving up), auto-migration is paused, and **nothing is
changed**: the database files, the attachments and the avatars are exactly as
they were.

Two ways forward, both keeping the data:

1. **Go back to the revision that worked** and stay there for now:

   ```
   sudo snap revert wekan
   sudo snap refresh --hold=forever wekan
   ```

2. **Move the data across** with a MongoDB that can read it (the version the page
   names): start that MongoDB on the data directory, `mongodump` from it, restore
   the dump into this version, and let the MongoDB → FerretDB migration above run.

Attachments and avatars are **files on disk**, not database rows, so they are
unaffected either way — see `$SNAP_COMMON/files`.

To let the snap try again — after moving the data, say — remove the marker:

```
sudo rm /var/snap/wekan/common/.mongodb-data-too-old
sudo snap restart wekan
```

## Where the FerretDB v1 binary comes from

FerretDB v1 is built and released separately in
[wekan/FerretDB](https://github.com/wekan/FerretDB/releases) as one binary per
architecture (`ferretdb-<arch>`; there is no `ferretdb.zip`). Each WeKan build
downloads only the single binary for the platform it targets, e.g.:

```
https://github.com/wekan/FerretDB/releases/latest/download/ferretdb-amd64
https://github.com/wekan/FerretDB/releases/latest/download/ferretdb-arm64
https://github.com/wekan/FerretDB/releases/latest/download/ferretdb-s390x
https://github.com/wekan/FerretDB/releases/latest/download/ferretdb-riscv64
https://github.com/wekan/FerretDB/releases/latest/download/ferretdb-ppc64le
```

For the snap, that binary is embedded inside the `wekan-<version>-<arch>.zip`
bundle the snap's `wekan` part downloads, and staged to `$SNAP/ferretdb`
(started by `ferretdb-control`).

## How the bundled binary versions are kept current

- The **MongoDB 7 server (mongod)** is the one component still fetched from
  MongoDB (amd64/arm64 only). The `bump` job in
  [`.github/workflows/release-all.yml`](../../../../../.github/workflows/release-all.yml)
  runs [`releases/version.sh`](../../../../../releases/version.sh), which probes
  upstream and rewrites the pinned MongoDB 7 server version (and the WeKan bundle
  version/URLs) in `snapcraft.yaml`.
- The **FerretDB v1** server and the **MongoDB client binaries** are not pinned:
  every build fetches the newest per-arch asset from the WeKan forks —
  `ferretdb-<arch>` from [wekan/FerretDB](https://github.com/wekan/FerretDB/releases),
  `<tool>-<arch>` from [wekan/mongo-tools-patches](https://github.com/wekan/mongo-tools-patches/releases),
  and `mongosh-<arch>` from [wekan/mongosh](https://github.com/wekan/mongosh/releases).

## Snaps and channels

There are **three snaps** of the same application, and each should reach **all
four channels on every architecture it is built for**:

| Snap | What it is |
|------|------------|
| [`wekan`](https://snapcraft.io/wekan) | the default |
| [`wekan-ondra`](https://snapcraft.io/wekan-ondra) | same WeKan, separate listing |
| [`wekan-gantt-gpl`](https://snapcraft.io/wekan-gantt-gpl) | same WeKan, separate listing |

**All four channels — Stable, Candidate, Beta and Edge.** The default
`snapcraft.yaml` is built on `base: core24`, a *released* base, so the snap carries
`grade: stable` and may be published to **stable** as well as the other three.
That is what makes the full set possible: a `grade: devel` snap is refused by
stable and candidate outright.

`snapcraft-core26.yaml` is the same WeKan on `base: core26`, kept for testing the
next base and **not** built by the release: core26 still requires
`build-base: devel` and therefore `grade: devel`, so it can only reach beta and
edge. That is the whole reason the release builds core24.

### Publishing to every channel

A revision is **per architecture** — the store's own listing shows `wekan` at
revision 3601 on amd64 and 3600 on arm64 for the same version 10.76 — so one
revision number can never be released to every architecture. Use:

```bash
releases/snap-release-all-channels.sh --dry-run      # see the plan first
releases/snap-release-all-channels.sh 10.76          # pin the version
releases/snap-release-all-channels.sh                # or the newest of each
```

It resolves the revision per (snap, architecture) from the store and releases it
to `stable,candidate,beta,edge` in **one** call, so a revision reaches all four
or none. A (snap, architecture) with no revision is reported and skipped — the
three snaps genuinely have different architecture sets today. It reads the
architecture table from `models/lib/snapArchitectures.js`, so there is no second
copy of it in shell.

**Pinning the version matters.** Without one, the newest revision of each
architecture is promoted — and edge is often ahead of stable, so a bare run
publishes edge builds to stable users. Pass the version, or `--dry-run` first.

### What each snap currently has, and what is still to add

As of WeKan **10.78** the store holds:

| Snap | amd64 | arm64 | armhf | ppc64el | riscv64 | s390x |
|------|:-----:|:-----:|:-----:|:-------:|:-------:|:-----:|
| `wekan` | ✅ 10.78 | ✅ 10.78 | ❌ | ✅ 10.78 | ✅ 10.78 | ✅ 10.78 |
| `wekan-ondra` | ✅ 10.78 | ✅ 10.78 | ⚠️ 0.22 | 🚫 | 🚫 | 🚫 |
| `wekan-gantt-gpl` | ✅ 10.78 | ✅ 10.78 | 🚫 | 🚫 | 🚫 | 🚫 |

`wekan-ondra` also shows an **i386** column at `0.X-ci`; nothing builds it and
nothing can (see [i386](#i386-has-no-snap-and-cannot-have-a-new-one)).

The three marks mean three different things, and the difference is the whole
point of the table:

- **❌ built by the release, not in the store.** `wekan`'s armhf is the only one:
  `snapcraft.yaml` declares it, the `snap-launchpad` job builds it, and it has
  been failing — most recently on Caddy, which publishes no `linux_armhf` archive
  because its asset names are Go's. That is fixed for the next release. Nothing
  to do here but release.
- **🚫 the release does not build it for that snap at all.** The `snap-variants`
  job that publishes `wekan-ondra` and `wekan-gantt-gpl` has FOUR matrix entries —
  each variant on amd64 and on arm64, on GitHub runners. The exotic architectures
  come from `snap-launchpad`, which builds only the `wekan` name. So no upload is
  pending for these squares: they need the variant job extended to Launchpad
  remote builds under the variant snap names first.
- **⚠️ a fossil.** `wekan-ondra`'s armhf is stuck at version **0.22** on all four
  channels — a revision the store kept from years ago. Promoting channels cannot
  fix it: there is no newer revision to promote, and per the row above nothing
  currently builds one.

Publishing the **stable** channel is safe for these because the snap performs its
**automatic migrations** on start — the schema upgrades and the one-time
MongoDB 3 → FerretDB v1 migration on amd64 — so an existing installation moving
from an older revision to this one is upgraded in place rather than needing a
manual step.

## Related

- [Docker CPU platforms](../Docker/CPU-platforms.md) — the same page for the
  Docker image, which has a different platform list and different reasons
- FerretDB v1 fork: https://github.com/wekan/FerretDB
- Snap install: [Install.md](Install.md)
- Snap settings keys: [Supported-settings-keys.md](Supported-settings-keys.md)
- The architecture table in code: `models/lib/snapArchitectures.js`
  (tested by `tests/snapArchitectures.test.cjs`)
- Publish every snap to every channel: `releases/snap-release-all-channels.sh`
- Node.js builds per platform: [wekan/node-patches](https://github.com/wekan/node-patches)
