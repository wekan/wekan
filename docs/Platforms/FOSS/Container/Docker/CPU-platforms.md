# WeKan Docker image — CPU platforms

This page documents, **for the WeKan Docker image**, which CPU platforms the
multi-arch manifest carries, how that set is decided on every release, which
database each platform starts by default, and which bundle platforms are
deliberately not images.

The snap has the same page of its own:
[Snap CPU platforms](../Snap/CPU-platforms.md).

## Summary

- **The image is assembled from the release bundles, not compiled per platform.**
  `Dockerfile` downloads `wekan-<version>-<arch>.zip` from the GitHub Release for
  the platform it is building, installs a Node.js resolved by
  [`releases/resolve-node-source.sh`](../../../../../releases/resolve-node-source.sh)
  — the same script the bundles and the snap use, so one architecture's image and
  bundle always carry the same Node.js from the same source — and runs the
  bundle. There is no per-platform compile in the image at all.
- **At most eight Linux platforms.** `linux/amd64` and `linux/arm64` are
  **required**; `linux/ppc64le`, `linux/s390x`, `linux/riscv64`, `linux/386`,
  `linux/arm/v6` and `linux/arm/v7` are **optional** and included only when their
  bundle landed on the release **and** the base image publishes the platform.
- **A missing optional bundle drops only itself.** One failed extra-arch build
  removes that platform from the manifest with a warning; it does not fail or
  skip the Docker job, and the platform comes back on the next release that
  builds it.
- **`linux/arm/v6` is a candidate that drops itself today**, because
  `debian:trixie` publishes `arm/v5` and `arm/v7` and nothing between them. See
  [armv6](#armv6-wired-end-to-end-waiting-on-a-base-image) — this is the one
  platform whose absence is not about WeKan at all.
- **Three registries, two tags each**: `wekanteam/wekan`, `quay.io/wekan/wekan`
  and `ghcr.io/wekan/wekan`, at `:v<version>` and `:latest`, built with
  `--provenance=mode=max` and verified after the push by asking each registry
  what it actually has.
- **Not image platforms:** loong64 (no base image exists), armv6, armv7, and
  every Windows and macOS bundle. Each has a reason below, and none of them is an
  oversight.

## Per-platform matrix

| Docker platform | `TARGETARCH` | `TARGETVARIANT` | Bundle | Required | Database when nothing is set |
|-----------------|--------------|-----------------|--------|:--------:|------------------------------|
| `linux/amd64`   | `amd64`      | — | `amd64`   | ✅ | external MongoDB (`MONGO_URL`) |
| `linux/arm64`   | `arm64`      | (`v8`, implied) | `arm64`   | ✅ | external MongoDB (`MONGO_URL`) |
| `linux/ppc64le` | `ppc64le`    | — | `ppc64le` | ❌ | bundled FerretDB v1 (SQLite) |
| `linux/s390x`   | `s390x`      | — | `s390x`   | ❌ | bundled FerretDB v1 (SQLite) |
| `linux/riscv64` | `riscv64`    | — | `riscv64` | ❌ | bundled FerretDB v1 (SQLite) |
| `linux/386`     | `386`        | — | `i386`    | ❌ | bundled FerretDB v1 (SQLite) |
| `linux/arm/v6`  | `arm`        | `v6` | `armv6`   | ❌ | bundled FerretDB v1 (SQLite) |
| `linux/arm/v7`  | `arm`        | `v7` or unset | `armhf`   | ❌ | bundled FerretDB v1 (SQLite) |

**`TARGETARCH` alone does not identify a platform.** ARMv6 and ARMv7 both arrive
as `arm`; only `TARGETVARIANT` tells them apart, which is why the `Dockerfile`'s
architecture `case` branches on the pair. Mapping `arm` straight to `armhf`, as
it did before, would hand a Raspberry Pi 1 the ARMv7-A bundle. `v5` (armel) is
refused outright rather than falling through: Go builds ARMv5, Node.js does not
exist for it, so there is no bundle to put in an image.

**Required** means the Docker job fails if that bundle is not on the release:
without amd64 and arm64 there is no image worth pushing, and a release that got
that far would already have failed.

**The database column is a default, not a limit.** Every bundle carries a
`ferretdb` binary, so FerretDB v1 runs on every platform; the default is decided
by [`releases/ferretdb/wekan-entrypoint.sh`](../../../../../releases/ferretdb/wekan-entrypoint.sh)
from a `/build/.ferretdb-default` marker that every extra-architecture bundle
carries and the amd64/arm64 bundles have removed. `WEKAN_DB=ferretdb` or
`WEKAN_DB=mongodb` overrides it on any platform, and setting `MONGO_URL` on a
FerretDB-default platform points WeKan at that database instead.

## How the platform set is decided, on every release

The `docker` job in
[`.github/workflows/release-all.yml`](../../../../../.github/workflows/release-all.yml)
does this before it builds anything:

1. It holds two lists — `req="linux/amd64:amd64 linux/arm64:arm64"` and
   `opt="linux/ppc64le:ppc64le linux/s390x:s390x linux/riscv64:riscv64
   linux/386:i386 linux/arm/v6:armv6 linux/arm/v7:armhf"` — where each entry is
   *docker platform : the bundle arch the Dockerfile downloads for it*.
2. It asks the **base image** which platforms it publishes
   (`docker buildx imagetools inspect`, with the base name read out of the
   `Dockerfile` so there is no second copy of it), and drops any candidate the
   base lacks.
3. It asks the **release**, with an HTTP `HEAD`, whether
   `wekan-<version>-<arch>.zip` is there.

A missing **required** base platform or bundle is an error; a missing
**optional** one is a warning and that platform is dropped. The chosen set then
drives all three of the buildx `--platform` list, the wait-for-the-assets loop,
and the post-push verification — so the three can never disagree about what the
image was supposed to contain.

**Why the base is asked at all**, when a missing base would surely just fail the
build: for 32-bit ARM it does not fail. containerd treats a **lower** ARM variant
as compatible, so a `linux/arm/v6` request against a base that has `arm/v5` and
`arm/v7` resolves to `arm/v5` — Debian **armel**, soft-float — and an image built
on that would carry a hard-float `node-armv6` its own loader cannot start. A
silent downgrade is worse than a dropped platform, so it is dropped, loudly,
with the reason in the warning.

`tests/releaseDockerPlatforms.test.cjs` pins that shape: which platforms are
required, which are optional, that `linux/loong64` is never among them, that
every platform resolves to the bundle the Decide step paired it with, that the
`arm` branch reads `TARGETVARIANT` and refuses `v5`, and that both loops check
the base.

## The names, and the ones that do not match

An architecture is spelled one way by Docker, another by Debian, and a third by
the WeKan bundles. Three of them differ here:

| Docker | `TARGETARCH` | WeKan bundle | Note |
|--------|--------------|--------------|------|
| `linux/386` | `386` | `i386` | everyone but Docker and Node.js says i386 |
| `linux/arm/v7` | `arm` | `armhf` | Debian's 32-bit ARM port: ARMv7-A, VFPv3-D16 |
| `linux/arm64` | `arm64` | `arm64` | buildx reports it as `linux/arm64/v8`; the verify step strips the implied `/v8` |

The `Dockerfile` maps `TARGETARCH` to the bundle name in one `case` and **exits
on anything it does not know**, rather than guessing — an unrecognised platform
would otherwise download another CPU's `.zip` and produce an image that starts
and then dies.

## What is not an image platform, and why

### loong64 — there is no base image to build on

`node-loong64` and `ferretdb-loong64` both exist and the bundle is built, but no
Docker base image publishes loong64 at any tag — not debian, not ubuntu — so
there is no loong64 userland to install into, and the registries do not agree on
what the platform is even called. `tests/releaseDockerPlatforms.test.cjs`
asserts `linux/loong64` is not in the platform list, so this stays a decision
rather than something that quietly reappears.

### armv6 — wired end to end, waiting on a base image

ARMv6 (Raspberry Pi 1 and Zero) is a **candidate platform**: `linux/arm/v6` is in
the optional list, the `Dockerfile` resolves it to the `armv6` bundle through
`TARGETVARIANT`, and the guard test pins both. Everything the image needs exists —
`node-armv6` from [wekan/node-patches](https://github.com/wekan/node-patches)
(nobody else publishes an ARMv6 Node.js) and `GOARM=6` binaries from
[wekan/FerretDB](https://github.com/wekan/FerretDB) and
[wekan/mongo-tools-patches](https://github.com/wekan/mongo-tools-patches).

**What is missing is a base image.** `debian:trixie`'s manifest list is `386`,
`amd64`, `arm64/v8`, `arm/v5`, `arm/v7`, `ppc64le`, `riscv64`, `s390x` — there is
no `arm/v6`. Debian has no ARMv6 port: its 32-bit ARM ports are armel (ARMv5,
soft-float) and armhf (ARMv7-A). ARMv6 hard-float is Raspberry Pi OS territory,
not Debian's. So the release drops the platform with a warning and the image
ships without it, while the **armv6 bundle zip is unaffected** — that is how an
ARMv6 board runs WeKan today.

The day the base publishes `arm/v6`, or the base for that one platform becomes an
ARMv6 userland, the platform is included automatically: nothing else has to
change. Until then, do **not** "fix" this by removing the base check — that is
what makes the drop a warning instead of an image whose Node.js cannot start.

`models/lib/snapArchitectures.js` describes armv6 as shipping "a bundle zip and a
`linux/arm/v6` Docker image"; the bundle is real today, the image is prepared and
gated.

### armv7 — one 32-bit ARM slot, and it carries the baseline

There is one `linux/arm/v7` platform, and it must run on any ARMv7-A board, so it
carries the **armhf** bundle: the `armv7` bundle assumes NEON, which is an
illegal instruction on an ARMv7-A board without it. This is the same reasoning
that gives armv7 no snap — see
[the snap page](../Snap/CPU-platforms.md#armhf-and-armv7-are-the-same-cpu-family-built-to-different-baselines).

### win64, win32, win-arm64, mac-x64, mac-arm64

Bundle platforms that are not Linux. They are not container images and are not
expected to be.

## There are no variant images

`wekan-ondra` and `wekan-gantt-gpl` are **snap** names — a snap name cannot be
changed once people have it installed, so the two variants keep theirs. As Docker
images they were never anything but a second name for `wekan`, and they are no
longer published: `wekanteam/wekan`, `quay.io/wekan/wekan` and
`ghcr.io/wekan/wekan` are the image.

The tags that exist keep working (`ghcr.io/wekan/wekan-ondra` to v6.99.2,
`quay.io/wekan/wekan-gantt-gpl` to v4.41, `wekanteam/wekan-gantt-gpl` to v5.62);
they just stop gaining versions. Publishing them cost a release the right to fail
in six new ways — three registries × two names, each with its own visibility and
push permission — and v10.88 did fail that way, an hour into an emulated build,
on a Quay repository the release had created itself and had no push rights on.

The `-t` lines are commented out rather than deleted, and
[`docker-variant.yml`](../../../../../.github/workflows/docker-variant.yml) still
retags a variant by hand when somebody deliberately wants one: it rebuilds
nothing (`docker buildx imagetools create` copies the manifest, so the digests
are the release's own) and it is `workflow_dispatch` only.

## The FerretDB image covers more platforms than the WeKan image

[wekan/FerretDB](https://github.com/wekan/FerretDB)'s own `docker.yml` builds
`FROM scratch` around the **prebuilt** per-architecture Go binaries, with no
QEMU and no base image, so a platform costs it nothing but a binary. Its manifest
is computed from whichever `ferretdb-<arch>` assets downloaded, mapping
`amd64`→`linux/amd64`, `arm64`→`linux/arm64`, `armhf`→`linux/arm/v7`,
`armv6`→`linux/arm/v6`, `armel`→`linux/arm/v5`, `i386`→`linux/386`,
`ppc64le`→`linux/ppc64le`, `s390x`→`linux/s390x`, `riscv64`→`linux/riscv64` and
`loong64`→`linux/loong64`. It is published as `wekanteam/ferretdb`,
`quay.io/wekan/ferretdb` and `ghcr.io/wekan/ferretdb`.

That is why the two lists differ: the WeKan image needs a Debian userland and a
Node.js for a platform, and the FerretDB image needs only one static binary.

## Related

- [Snap CPU platforms](../Snap/CPU-platforms.md) — the same page for the snap
- [Which compose file, which database](README.md)
- [FerretDB v1 and its backends](../../../../Databases/FerretDB/1/)
- The platform list in code: the `docker` job of
  [`release-all.yml`](../../../../../.github/workflows/release-all.yml), guarded by
  `tests/releaseDockerPlatforms.test.cjs`
- Node.js per platform: [wekan/node-patches](https://github.com/wekan/node-patches)
