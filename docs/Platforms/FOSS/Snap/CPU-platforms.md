# WeKan Snap — CPU platforms and databases

This page documents, **for the WeKan snap**, which CPU architectures are built,
which database binaries each one ships, how new installs choose their database,
and how the one-time MongoDB 3 → FerretDB v1 migration works.

## Summary

- **New installs use FerretDB v1 (SQLite) by default on every CPU architecture.**
  FerretDB v1 is the wekan/FerretDB fork with an embedded pure-Go SQLite backend
  that speaks the MongoDB wire protocol, so WeKan talks to it exactly like MongoDB.
- **MongoDB 7 *server* binaries (mongod) are included for amd64 and arm64 only.**
  The other architectures (s390x, riscv64, ppc64le) have no MongoDB server — they
  run FerretDB v1 only.
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
  [wekan/mongo-tools](https://github.com/wekan/mongo-tools/releases).
- **Existing MongoDB 7 data (amd64/arm64) is NOT migrated to FerretDB v1** — that
  snap keeps using its existing MongoDB 7.
- **Only the amd64 snap migrates existing MongoDB 3 data to FerretDB v1** (see
  [Migration](#mongodb-3--ferretdb-v1-migration-amd64-only) below).

## Per-architecture matrix

| CPU arch | MongoDB 7 server (mongod) | MongoDB Database Tools | FerretDB v1 server | MongoDB 3 → FerretDB migration | Default DB (new install) |
|----------|:------------------------:|:----------------------:|:------------------:|:------------------------------:|:------------------------:|
| amd64    | ✅ | ✅ | ✅ | ✅ (if MongoDB 3 data present) | FerretDB v1 |
| arm64    | ✅ | ✅ | ✅ | ❌ | FerretDB v1 |
| s390x    | ❌ | ✅ | ✅ | ❌ | FerretDB v1 |
| ppc64le  | ❌ | ✅ | ✅ | ❌ | FerretDB v1 |
| riscv64  | ❌ | ✅ | ✅ | ❌ | FerretDB v1 |

- **MongoDB 7 server (mongod)**: amd64/arm64 only (MongoDB ships no server for the others).
- **MongoDB Database Tools**: every arch — WeKan builds them for all platforms from
  [wekan/mongo-tools](https://github.com/wekan/mongo-tools) (they are pure Go).
- **mongosh**: not bundled on any arch — replaced by the bundled Node.js 24 +
  `mongodb` driver (`$SNAP/bin/db-eval`).

All architectures default new installs to FerretDB v1 with `DDP_TRANSPORT=sockjs`
and polling reactivity.

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
sudo snap set wekan database=mongodb   # amd64/arm64 only (mongod is bundled there)
sudo snap set wekan database=ferretdb  # the default
```

## MongoDB client binaries: source and availability

WeKan does not download MongoDB clients from the MongoDB website:

- **MongoDB Database Tools** come from [wekan/mongo-tools](https://github.com/wekan/mongo-tools/releases).
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
  `<tool>-<arch>` from [wekan/mongo-tools](https://github.com/wekan/mongo-tools/releases),
  and `mongosh-<arch>` from [wekan/mongosh](https://github.com/wekan/mongosh/releases).

## Snap channels

The default `snapcraft.yaml` is built on `base: core24`, which allows the
**candidate** channel (core26 does not). The automated release workflow publishes
it to the **candidate**, **beta**, and **edge** channels; the **stable** channel is
published manually later, once it is proven.
`snapcraft-core26.yaml` is the same WeKan on the newer `base: core26`
(`build-base: devel`, `grade: devel`), kept for testing the next base; it can only
go to Beta/Edge until core26 is a released stable base.

## Related

- FerretDB v1 fork: https://github.com/wekan/FerretDB
- Snap install: [Install.md](Install.md)
- Snap settings keys: [Supported-settings-keys.md](Supported-settings-keys.md)
