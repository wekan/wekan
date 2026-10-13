# Possible additional platforms

Open source platforms that WeKan is NOT on yet, and could be added to. WeKan's absence
was checked on 2026-10-11 in each catalog's own repository (its full file tree, or its
search API where it has one), not from memory - except for Alpine, the openSUSE Build
Service and Fedora COPR, which were not checked.

**Already there**, besides WeKan's own Docker image, snap, Sandstorm, UCS, Flatpak,
AppImage, Helm chart and zip bundles: YunoHost (state "working", level 8), CapRover
(one-click app), Runtipi, Kubero, Artifact Hub (the Helm chart).

**Not there, and possible:**

| Platform | Licence | How WeKan gets in | Effort |
| --- | --- | --- | --- |
| [ZimaOS / CasaOS](FOSS/Container/Docker/CasaOS/README.md) | Apache-2.0 | `Apps/WeKan/docker-compose.yml` in IceWhaleTech/CasaOS-AppStore | small |
| [TrueNAS](FOSS/Container/Docker/TrueNAS/README.md) (community apps) | LGPL-3.0 | `ix-dev/community/wekan/` in truenas/apps; Planka and Vikunja are there | small–medium |
| [Coolify](FOSS/Container/Docker/Coolify/README.md) | Apache-2.0 | `templates/compose/wekan.yaml`, plus a coolify-docs page | small |
| [Dokploy](FOSS/Container/Docker/Dokploy/README.md) | Apache-2.0 | `blueprints/wekan/` in Dokploy/templates | small |
| [Arch Linux AUR](FOSS/Package/AUR/README.md) | (AUR packaging: 0BSD) | `wekan-bin` PKGBUILD over the release zip, with a systemd unit | small |
| Proxmox VE Helper-Scripts | MIT | `ct/wekan.sh` in community-scripts/ProxmoxVE: an LXC that runs the zip bundle, no Docker | medium |
| StartOS (Start9) | MIT | its own `wekan-startos` wrapper repository (s9pk) | medium |
| NixOS / nixpkgs | MIT | a package of the release bundle (marked as prebuilt binaries) and a NixOS service module; FerretDB is already in nixpkgs | medium |
| openSUSE Build Service | GPL | one project that builds .deb and .rpm and their repositories for Debian, Ubuntu, Fedora and openSUSE | medium |
| Fedora COPR | GPL | an rpm of the zip bundle | medium |
| FreeBSD ports | BSD | wekan/node-patches has `node-freebsd-x64` and wekan/FerretDB has `ferretdb-freebsd-amd64`; the native modules still need rebuilding on FreeBSD, because the bundle's are Linux binaries | large |
| Alpine | open source (not checked) | musl: the bundle's glibc Node.js does not run, so native modules need rebuilding | medium–large |

**Hard, but possible:** Debian's own archive, and with it FreedomBox (every npm
dependency must be its own Debian package - OBS or an own APT repository is the
practical route); GNU Guix (everything built from source, no prebuilt binaries);
Flathub (WeKan has its own Flatpak repository; Flathub is for desktop apps and prefers
building from source).

**Not open source**, although often listed with the above: Umbrel (PolyForm
Noncommercial), Cosmos Cloud (Apache-2.0 with Commons Clause), Unraid and Synology
(proprietary). Check Olares's licence before adding WeKan there.

## Status of each platform

The five with the best cost-benefit have their files and a README with the exact pull
request under `docs/Platforms/`, tested as far as is possible without the platform
itself; their tests use `.tools/`, which is not in git. What is left, per platform:

| Platform | Done | Still missing |
| --- | --- | --- |
| ZimaOS / CasaOS | `docker-compose.yml` with the `x-casaos` metadata. The store's validator (0 issues) and full store builder (1/1 built, amd64 + arm64 pinned against the live registry) pass | `docker compose config -q` (needs Docker); `thumbnail.png` and screenshots; installing it on a real ZimaOS/CasaOS; the PR. Later: run as the image's own user instead of root, once the image supports any user ID |
| TrueNAS | The app folder: `app.yaml`, `ix_values.yaml` (digest-pinned), `questions.yaml`, the template, test values. Renders with the catalog's library 2.3.15 | The app-request issue; the catalog's Docker-based tools (`copy-lib`, `app-test`, `metadata`, `ports`, `validate`) and committing what they generate; checking the port is still free; a Renovate `customVersioning` entry for WeKan's `vMAJOR.MINOR` tags; icon and screenshot for the maintainers to upload; an install on TrueNAS; the PR, whose template asks whether AI generated any of it |
| Coolify | `templates/compose/wekan.yaml`. Meets the rules Coolify's docs and PR checks state | A Discussion in service-template-requests; a test in a local Coolify (*Docker Compose Empty*); the required coolify-docs PR (`content/docs/services/wekan.mdx`, logo); the PR, whose template asks whether AI tools were used |
| Dokploy | `blueprints/wekan/` (compose, template.toml, meta.json). Dokploy's three validators pass | The logo file in the folder; a deploy in a Dokploy instance (untested PRs are closed); a screenshot; the PR |
| Arch Linux AUR | `wekan-bin`: PKGBUILD, unit, sysusers, tmpfiles, settings file. Built with Arch's `makepkg` (every checksum passed), and the packaged WeKan answered HTTP 200 | `namcap`, `pacman -U` and the unit under systemd on a real Arch (an `archlinux:base-devel` container); an AUR account; publishing; deciding how releases bump it (by hand, nvchecker, or CI) |
| All Docker-based ones | | Each pins `ghcr.io/wekan/wekan:v12.29`, the newest image on the registry when written (GitHub release v12.30 existed before its image). Bump all of them together; `tests/platformTemplates.test.cjs` fails when they disagree |

The rest of the table above has no files yet.

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

Both lists below were read from the newest release of each repository on
2026-10-11: [wekan/FerretDB v1.92.0](https://github.com/wekan/FerretDB/releases)
and [wekan/node-patches v26.11.1](https://github.com/wekan/node-patches/releases).
Every binary there has a `.sha256sum` beside it.

**FerretDB v1** builds `ferretdb-<target>` for **25 targets**, the wider of the
two lists. Every non-amd64, non-arm64 Linux platform uses it, because MongoDB
ships no server for any of them:

| OS | FerretDB assets |
| --- | --- |
| Linux | `amd64`, `arm64`, `i386`, `armhf`, `armv6`, `armel`, `ppc64le`, `s390x`, `riscv64`, `loong64` |
| Windows | `win64.exe`, `win32.exe`, `win-arm64.exe` |
| macOS | `mac-amd64`, `mac-arm64` |
| FreeBSD | `freebsd-amd64`, `freebsd-arm64`, `freebsd-i386`, `freebsd-armv7`, `freebsd-armv6`, `freebsd-armel` |
| OpenBSD | `openbsd-amd64`, `openbsd-arm64` |
| NetBSD | `netbsd-amd64` |
| Android | `android-arm64` |

There is no separate `armv7` FerretDB: the armv7 bundle uses `ferretdb-armhf`.

**Node.js 26** has three sources, tried **in this order** by the bundle job,
which prints which one served:

1. **Official**: <https://nodejs.org/dist/>
2. **Unofficial**: <https://unofficial-builds.nodejs.org/download/release/>
3. **This project's patches**: <https://github.com/wekan/node-patches/releases>,
   upstream Node.js plus WeKan's patches. It builds **16 targets**:

| OS | node-patches assets |
| --- | --- |
| Linux | `x64`, `arm64`, `i386`, `armhf`, `armv7`, `armv6`, `ppc64le`, `s390x`, `riscv64`, `loong64` |
| Windows | `win64.exe`, `win32.exe`, `win-arm64.exe` (each with its `.lib`) |
| macOS | `mac-x64`, `mac-arm64` |
| FreeBSD | `freebsd-x64` |

node-patches builds the official platforms as well, but because of the order
above the bundle only takes Node.js from it where nodejs.org and
unofficial-builds have nothing for the pinned version.

When **none** of the three has a platform, that platform is **not built** in
that release: no bundle, no snap, no image architecture, and no red job either.
Nothing has to be edited for it to come back. The next run resolves again and
builds it as soon as a Node.js for it is published anywhere.

nodejs.org and unofficial-builds ship a **tarball** (node, npm, the whole
runtime). node-patches ships only the **bare binary**, because that is the only
part missing. When node-patches serves, npm is taken from the official amd64
tarball of the same version. npm is JavaScript and runs on whatever node
executes it, so an npm built for one CPU drives a node built for another.

[`releases/resolve-node-source.sh`](../../releases/resolve-node-source.sh)
is the one place where that order and the platform-name mapping are defined.
The bundle jobs, the extra-arch preflight and the `Dockerfile` all call it, so
they cannot disagree about where a platform's Node.js comes from.

## What is built, and where each part comes from

The release files below were checked on v12.30 and v12.31. The Docker
architectures were checked on `ghcr.io/wekan/wekan:v12.30`. "Node.js from" is
what `resolve-node-source.sh` answered for v26.11.1.

| Platform | Bundle | Snap | Docker | FerretDB asset | Node.js from |
| --- | --- | --- | --- | --- | --- |
| amd64 | ✅ | ✅ | ✅ | `ferretdb-amd64` | official |
| arm64 | ✅ | ✅ | ✅ | `ferretdb-arm64` | official |
| ppc64le | ✅ | ✅ `ppc64el` | ✅ | `ferretdb-ppc64le` | official |
| s390x | ✅ | ✅ | ✅ | `ferretdb-s390x` | official |
| riscv64 | ✅ | in the Launchpad matrix, not on v12.30 | ✅ | `ferretdb-riscv64` | node-patches (`node-riscv64`) |
| i386 | ✅ | — (core24 has no i386) | ✅ `linux/386` | `ferretdb-i386` | node-patches (`node-i386`) |
| armhf | ✅ | ✅ | ✅ `linux/arm/v7` | `ferretdb-armhf` | node-patches (`node-armhf`) |
| armv7 | ✅ | — | — | `ferretdb-armhf` | node-patches (`node-armv7`) |
| armv6 | ✅ | — | — (debian:trixie has no `arm/v6`) | `ferretdb-armv6` | node-patches (`node-armv6`) |
| loong64 | — (no loong64 base image) | — | — | `ferretdb-loong64` | unofficial |
| win64 | ✅ (+ `WeKan-<v>-win64.exe`) | | | `ferretdb-win64.exe` | official |
| win-arm64 | ✅ | | | `ferretdb-win-arm64.exe` | official |
| win32 | from the next release (see below) | | | `ferretdb-win32.exe` | node-patches (`node-win32.exe`) |
| mac-x64 | ✅ (+ `.app.zip`) | | | `ferretdb-mac-amd64` | official |
| mac-arm64 | ✅ (+ `.app.zip`) | | | `ferretdb-mac-arm64` | official |

"node-patches" in the "Node.js from" column can change from release to release.
riscv64 normally comes from unofficial-builds and fell back to node-patches only
because unofficial-builds had no v26.11.1 riscv64 build yet. i386, armhf, armv7
and armv6 depend on node-patches alone, so if it has not published one of them,
that row is not built.

**win32 was not built up to v12.31, although both binaries existed.**
node-patches publishes the checksum of `node-win32.exe` as `node-win32.sha256sum`
(without `.exe`), with the line `<hash> *node-win32.exe` (sha256sum's binary-mode
marker). The resolver looked only for `node-win32.exe.sha256sum` and an unmarked
name, so it answered `node_found=false`. It now also tries the sidecar without
`.exe` and accepts the `*` marker, so the next release builds win32 again.
`tests/releaseNodeSources.test.cjs` runs the matcher against those lines. win64
and win-arm64 were never affected, because nodejs.org serves them first.

The names in this table come from different projects, and they disagree. That
is why the build matrix names each Linux platform three times (`arch`,
`node_arch`, `ferretdb_arch`):

* Node says **x86** where Debian, snap and FerretDB say **i386**;
* Node says **armv7l** where they say **armhf**;
* snap says **ppc64el** where everyone else says **ppc64le**;
* FerretDB says **mac-amd64** where node-patches and the bundle say **mac-x64**.

A row that used only one of these names would download a binary for the wrong
CPU, and nobody would notice until they ran it.

## What is not built

**armel** (ARMv5, soft-float): FerretDB builds it, on Linux and FreeBSD, but
Node.js cannot run there. V8 has not supported ARMv5 for many years, nobody
publishes a runtime for it, and node-patches cannot build one either. A bundle
without a runtime is not a bundle. This is the permanent case of the general
rule above: no Node.js, no platform. ARMv6 boards (Raspberry Pi 1 and Zero) use
the armv6 bundle, which is hard-float.

**loong64**: both binaries exist (`node-loong64` from unofficial-builds and
node-patches, `ferretdb-loong64`), but Docker Hub has no loong64 base image to
rebuild the native modules in. The matrix leg stays in place and is skipped, so
it shows on every run. Even when the bundle exists, loong64 is not a snap
architecture.

**The BSDs** have their own workflow, `.github/workflows/bsd.yml`. It takes
the release's amd64 bundle and adds this BSD's Node.js and FerretDB. It then
compiles the native modules inside a FreeBSD, OpenBSD or NetBSD VM, starts the
bundle there with its own `start-wekan.sh`, and attaches
`wekan-<version>-<os>-<arch>.zip`.

| Platform | FerretDB | Node.js |
| --- | --- | --- |
| FreeBSD amd64 | `ferretdb-freebsd-amd64` | `node-freebsd-x64` (node-patches only): built |
| FreeBSD arm64, OpenBSD amd64/arm64, NetBSD amd64 | published | skipped until node-patches publishes their Node.js |

The plan, and where each BSD stands: [BSD](FOSS/OS/BSD.md).

**FerretDB only, no Node.js anywhere:** FreeBSD arm64/i386/armv7/armv6/armel,
OpenBSD amd64/arm64, NetBSD amd64 and Android arm64. Each of these becomes
possible once node-patches builds a Node.js for it.

## Where this is enforced

`tests/releaseSnapArches.test.cjs` reads the four lists — the bundle matrix, the
snap `platforms:` block and its arch mapping, the snap-launchpad matrix and the
Docker `--platform` list — and checks they agree: that every snap arch has a
bundle behind it, that every bundle row names all three vocabularies, and that
buildx builds exactly the platforms whose push is then verified. They were
edited one at a time before, which is how an arch ends up with a `.zip` and no
snap, or a snap that downloads a bundle nobody built.

## Related

- [Single-File.md](Single-File.md) — one executable per platform, made from
  that platform's bundle
- [Snap-Core.md](FOSS/Container/Snap/Snap-Core.md) — why the exotic arches build on Launchpad
- `.github/workflows/release-all.yml` — the bundle, snap and image jobs
- `releases/resolve-node-source.sh` — which of the three sources serves a platform
- `release-all.yml` in [wekan/node-patches](https://github.com/wekan/node-patches)
  — how the third source is built (upstream Node.js plus WeKan's patches)
