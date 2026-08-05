# Design: which CPU platforms a release is built for

A WeKan release ships three kinds of artifact, and they are built in this order
because each one is made out of the one before it:

```
wekan-<version>-<arch>.zip   the bundle: the app, its Node.js, its database
        │
        ├──────────────► the snap        (takes its Node.js from the bundle)
        └──────────────► the Docker image (unpacks the bundle for that arch)
```

So a platform can only have a snap or an image if it has a **bundle**, and it can
only have a bundle if it has the two binaries a bundle carries: a **database**
and a **Node.js runtime**.

## The two binaries a platform needs

**FerretDB v1** — [wekan/FerretDB](https://github.com/wekan/FerretDB/releases)
builds `ferretdb-<arch>` for sixteen targets, and that is the widest of the two
lists. Every non-amd64, non-arm64 platform uses it: MongoDB ships no server for
any of them.

**Node.js 24** — three sources, tried **in this order** by the bundle job, which
prints which one served:

1. **Official** — <https://nodejs.org/dist/>
2. **Unofficial** — <https://unofficial-builds.nodejs.org/download/release/>
3. **This project's patches** — <https://github.com/wekan/node-patches/releases>,
   upstream Node.js plus WeKan's patches, built for the platforms the first two
   do not publish at all.

And when **none** of the three has a platform, that platform is **not built**
that release — no bundle, no snap, no image architecture, and no red job either.
Nothing has to be edited for it to come back: the next run resolves again and
builds it the moment a Node.js for it is published anywhere.

The first two ship a **tarball** (node, npm, the whole runtime); node-patches
ships the **bare binary**, because that is the only part missing — so when it
serves, npm is taken from the official amd64 tarball of the same version. npm is
JavaScript and runs on whatever node executes it, so an npm built for one CPU
drives a node built for another.

[`releases/resolve-node-source.sh`](../../../releases/resolve-node-source.sh) is
the one place that order and the platform-name mapping live: the bundle jobs, the
extra-arch preflight and the `Dockerfile` all ask it, so they cannot disagree
about where a platform's Node.js comes from.

## What is built, and where each part comes from

| Platform | Bundle | Snap | Docker | FerretDB asset | Node.js from |
| --- | --- | --- | --- | --- | --- |
| amd64 | ✅ | ✅ | ✅ | `ferretdb-amd64` | official |
| arm64 | ✅ | ✅ | ✅ | `ferretdb-arm64` | official |
| ppc64le | ✅ | ✅ `ppc64el` | ✅ | `ferretdb-ppc64le` | official |
| s390x | ✅ | ✅ | ✅ | `ferretdb-s390x` | official |
| riscv64 | ✅ | ✅ | ✅ | `ferretdb-riscv64` | unofficial |
| i386 | ✅ | ✅ | ✅ `linux/386` | `ferretdb-i386` | node-patches (`node-i386`) |
| armhf | ✅ | ✅ | ✅ `linux/arm/v7` | `ferretdb-armhf` | node-patches (`node-armhf`) |
| loong64 | ✅ | — | — | `ferretdb-loong64` | unofficial |

A "Node.js from" of node-patches is the one column that can be EMPTY for a
release: those are the platforms only node-patches builds, so until it has
published one, that row is not built at all.

Three vocabularies meet in that table and they disagree, which is why the build
matrix names all three separately (`arch`, `node_arch`, `ferretdb_arch`):

* Node says **x86** where Debian, snap and FerretDB say **i386**;
* Node says **armv7l** where they say **armhf**;
* snap says **ppc64el** where everyone else says **ppc64le**.

A row that named only one of them would download another CPU's binary and the
mistake would not show until somebody ran it.

## What is deliberately not built

**armel** (ARMv5, soft-float) — FerretDB builds it; Node.js cannot. V8 has not
supported ARMv5 for many years, nobody publishes a runtime for it, and
node-patches cannot make one either. A bundle with no runtime in it is not a
bundle. It is the permanent case of the general rule above: no Node.js, no
platform.

**loong64 snap and image** — the bundle exists, but loong64 is not a snap
architecture, and buildx and the three registries do not agree on it yet. It
ships as a `.zip`.

**Windows, macOS x64, FreeBSD** — out of scope for these three artifacts rather
than impossible: the snap and the image are Linux, and a Windows or FreeBSD
Node.js needs its own host to build on rather than a cross compiler on a Linux
runner. macOS arm64 has a bundle of its own already (`build-mac-arm64`).

## Where this is enforced

`tests/releaseSnapArches.test.cjs` reads the four lists — the bundle matrix, the
snap `platforms:` block and its arch mapping, the snap-launchpad matrix and the
Docker `--platform` list — and checks they agree: that every snap arch has a
bundle behind it, that every bundle row names all three vocabularies, and that
buildx builds exactly the platforms whose push is then verified. They were
edited one at a time before, which is how an arch ends up with a `.zip` and no
snap, or a snap that downloads a bundle nobody built.

## Related

- [Snap-Core.md](Forks/Snap-Core.md) — why the exotic arches build on Launchpad
- `.github/workflows/release-all.yml` — the bundle, snap and image jobs
- `releases/resolve-node-source.sh` — which of the three sources serves a platform
- `release-all.yml` in [wekan/node-patches](https://github.com/wekan/node-patches)
  — how the third source is built (upstream Node.js plus WeKan's patches)
