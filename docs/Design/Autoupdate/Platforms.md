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
| [ZimaOS / CasaOS](../../Platforms/FOSS/Container/Docker/CasaOS/README.md) | Apache-2.0 | `Apps/WeKan/docker-compose.yml` in IceWhaleTech/CasaOS-AppStore | small |
| [TrueNAS](../../Platforms/FOSS/Container/Docker/TrueNAS/README.md) (community apps) | LGPL-3.0 | `ix-dev/community/wekan/` in truenas/apps; Planka and Vikunja are there | small–medium |
| [Coolify](../../Platforms/FOSS/Container/Docker/Coolify/README.md) | Apache-2.0 | `templates/compose/wekan.yaml`, plus a coolify-docs page | small |
| [Dokploy](../../Platforms/FOSS/Container/Docker/Dokploy/README.md) | Apache-2.0 | `blueprints/wekan/` in Dokploy/templates | small |
| [Arch Linux AUR](../../Platforms/FOSS/Package/AUR/README.md) | (AUR packaging: 0BSD) | `wekan-bin` PKGBUILD over the release zip, with a systemd unit | small |
| Proxmox VE Helper-Scripts | MIT | `ct/wekan.sh` in community-scripts/ProxmoxVE: an LXC that runs the zip bundle, no Docker | medium |
| StartOS (Start9) | MIT | its own `wekan-startos` wrapper repository (s9pk) | medium |
| NixOS / nixpkgs | MIT | a package of the release bundle (marked as prebuilt binaries) and a NixOS service module; FerretDB is already in nixpkgs | medium |
| openSUSE Build Service | GPL | one project that builds .deb and .rpm and their repositories for Debian, Ubuntu, Fedora and openSUSE | medium |
| Fedora COPR | GPL | an rpm of the zip bundle | medium |
| FreeBSD ports | BSD | needs FreeBSD's own Node.js and rebuilt native modules: the bundle's are Linux binaries | large |
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

**FerretDB v1** — [wekan/FerretDB](https://github.com/wekan/FerretDB/releases)
builds `ferretdb-<arch>` for sixteen targets, and that is the widest of the two
lists. Every non-amd64, non-arm64 platform uses it: MongoDB ships no server for
any of them.

**Node.js 26** — three sources, tried **in this order** by the bundle job, which
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
