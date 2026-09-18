# Dev: Snap `core` base vs multi-platform builds

Developer notes on why the `ppc64el` and `s390x` snap legs of `release-all.yml`
used to fail, what the constraint actually is (verified from the action's source,
not the error string), and the only supported way to build these architectures for
a `core24` snap.

**Status: done.** `ppc64el` and `s390x` were moved to the `snap-launchpad` matrix
and the `snap-qemu` job was deleted. What follows is why, kept because the same
question comes back every time someone sees how slow Launchpad is.

## TL;DR

- WeKan's `snapcraft.yaml` uses **`base: core24`**.
- The `snap-qemu` job built `ppc64el` / `s390x` with
  **`diddlesnaps/snapcraft-multiarch-action@v1`**, whose newest supported base is
  **`core22`**. It rejected `core24` before any build started.
- That action is unmaintained, and there is **no maintained QEMU multi-arch snap
  action that supports `core24`**.
- The only `core24`-capable path for architectures that have **no native GitHub
  runner** (`ppc64el`, `s390x`, `riscv64`) is **Launchpad `snapcraft remote-build`**
  — the `snap-launchpad` job, which now builds all three.

## The failure

Logs of the last run with the QEMU job (`release-all.yml` → `snap-qemu` matrix
legs `ppc64el` and `s390x`):

```
snapcraft.yaml is at version '10.01'.        # version gate passed
Building Snapcraft project in "."...
##[error]Your build requires a base that this tool does not support (core24).
'base' or 'build-base' in your 'snapcraft.yaml' must be one of 'core', 'core18' or 'core20'.
```

The version check passes and QEMU sets up fine; the build dies the instant
snapcraft reads `base: core24`. The other two log lines are harmless noise:

- `Failed to save: Unable to reserve cache with key docker.io--tonistiigi--binfmt-...`
  — a post-step cache warning from the QEMU binfmt image, not the cause.
- `Node.js 20 is deprecated ...` — the old action running on a newer Node runtime.

## Why it fails — verified from the action's source

This is **not** just the error message; it is a hardcoded allow-list. The action
is pinned at SHA `cfd7a246fad6bea65bb92f69a1c8d07898c231e5`. Its compiled
`dist/index.js` (from `src/lib/build.js` + `src/lib/channel-matrix.js`) hardcodes a
maximum base of `core22` in **three** independent places:

1. **Allow-list that throws** (`build.js`):

   ```js
   const base = await detectBase(this.projectRoot);
   if (!['core', 'core18', 'core20', 'core22'].includes(base)) {
       throw new Error(`Your build requires a base that this tool does not support (${base}). ...`);
   }
   ```

   `core24` is not in the list → immediate throw. (The error *message* is itself
   stale — it says "must be one of core/core18/core20" while the code actually also
   allows `core22`.)

2. **Container image tag** (`build.js`):

   ```js
   let containerImage = `diddledani/snapcraft:${base}`;   // needs docker.io/diddledani/snapcraft:core24
   ```

   It runs snapcraft inside `docker.io/diddledani/snapcraft:<base>` under QEMU. The
   maintainer never published a `:core24` tag (tags stop at `core22`).

3. **Channel matrix** (`channel-matrix.js`):

   ```js
   switch (base) {
     case 'core22':
     case 'core20': return channel;
     case 'core18': ...
     case 'core':   ...
   }
   throw new Error(`Snapcraft Channel '${channel}' is unsupported ... '${base}' Base Snap.`);
   ```

   `getChannel('core24', 'stable')` falls through every case and throws too.

**Maximum base supported by `diddlesnaps/snapcraft-multiarch-action@v1`: `core22`.**
The action was last updated for `core22` and abandoned; `core24` (and `core26`)
are not supported and will not be by `@v1`.

## Source repositories

The failing action and its build image:

| What | Repo |
|---|---|
| `snapcraft-multiarch-action` (the failing job) | https://github.com/diddlesnaps/snapcraft-multiarch-action — pinned [`cfd7a246`](https://github.com/diddlesnaps/snapcraft-multiarch-action/tree/cfd7a246fad6bea65bb92f69a1c8d07898c231e5); evidence in [`dist/index.js`](https://github.com/diddlesnaps/snapcraft-multiarch-action/blob/cfd7a246fad6bea65bb92f69a1c8d07898c231e5/dist/index.js) |
| `diddledani/snapcraft` Docker image (what it runs snapcraft inside) | https://github.com/diddledani/snapcraft — image: https://hub.docker.com/r/diddledani/snapcraft (no `core24` tag) |

snapcraft and the other actions used by the snap jobs:

| What | Repo |
|---|---|
| snapcraft (the tool) | https://github.com/canonical/snapcraft |
| `snapcore/action-build` (used by `snap-native`) | https://github.com/snapcore/action-build |
| `snapcore/action-publish` (used by `snap-native`) | https://github.com/snapcore/action-publish |
| `docker/setup-qemu-action` (QEMU setup step) | https://github.com/docker/setup-qemu-action |
| `tonistiigi/binfmt` (the QEMU binfmt image in the cache warning) | https://github.com/tonistiigi/binfmt |

The base snaps (`core*`):

| Base | Repo |
|---|---|
| `core` | https://github.com/canonical/core |
| `core18` | https://github.com/canonical/core18 |
| `core20` | https://github.com/canonical/core20 |
| `core22` | https://github.com/snapcore/core22 |
| `core24` (WeKan's base) | https://github.com/canonical/core-base (mirror: https://github.com/snapcore/core-base) — the modern base snaps were consolidated into one `core-base` repo, so there is no standalone `canonical/core24`. |

## How the snap jobs are split in `release-all.yml`

| Job | Arches | Mechanism | `core24`? |
|---|---|---|---|
| `snap-native` | `amd64`, `arm64` | `snapcore/action-build` on a **native** runner | Yes |
| `snap-launchpad` | `ppc64el`, `s390x`, `riscv64`, `armhf` | `snapcraft remote-build` on Launchpad | Yes |

(`snap-qemu`, which built `ppc64el` / `s390x` with
`diddlesnaps/snapcraft-multiarch-action` under QEMU, is deleted: it caps at
`core22`.)

`amd64` / `arm64` have native runners, so `action-build` works and is fastest.
`ppc64el` / `s390x` / `riscv64` have **no native GitHub runner**, and snapcraft
cannot cross-build a snap — so they need either QEMU emulation (which can't do
`core24`) or Launchpad.

## The fix — done

Because no QEMU multi-arch action supports `core24`, `ppc64el` and `s390x` could
not stay in `snap-qemu`. They build on Launchpad `remote-build` alongside
`riscv64`:

- `ppc64el` and `s390x` are in the `snap-launchpad` matrix
  (`arch: [ppc64el, s390x, riscv64, armhf]`).
- The `snap-qemu` job is deleted.

The `snap-launchpad` job is more robust than the older Launchpad legs that were
originally replaced by `snap-qemu`: it **requires the `.snap` file to exist,
retries the remote build 3×, and only uploads when the file is present**, which
guards the old "is not a valid file" (`snapcraft upload`, exit 64) failure. It is
`continue-on-error` with `timeout-minutes: 360` and `fail-fast: false`, so a
Launchpad queue of hours — the price of this path — can neither fail the release
nor cancel another arch, and each arch publishes the moment it finishes.

It needs **`LP_CREDENTIALS`** as well as `SNAP_AUTH`; its first step says by name
if either is missing, and decodes `LP_CREDENTIALS` so an unusable value is one
named line rather than an ordinary-looking build failure.

### Recovering interrupted jobs

The v11.85 logs in `wekan27` showed an ARMHF TLS EOF while polling Launchpad,
PPC64EL and S390X queued until GitHub's six-hour cancellation, and an AMD64
snap that published to the Snap Store but stalled while attaching to GitHub.

Every Launchpad architecture now shares a five-hour local wait budget across
all attempts. Exhausting it leaves the remote build running and reports an
unfinished build, without claiming that a snap was produced. Re-run that
matrix job after Launchpad finishes. Recovery uses `--recover`; a normal
`remote-build` invocation replaces the recipe and submits a new build. Only
an explicit missing recipe/repository response permits a new submission.
Authentication and connection failures never trigger that fallback.

The source snapshot lives in `.tools/tmp/snap-launchpad-source`, with Git
metadata in a sibling directory and retry logs outside the snapshot.
Snapcraft hashes **all project files**, so a deterministic commit alone is
insufficient. The Git pointer remains absolute because Snapcraft copies the
tree into its cache. Hosted reruns use the same checkout path. Each snapshot
includes its architecture so parallel matrix jobs have distinct recipes.
Downloaded snaps and logs move out before another recovery attempt.

Native and Launchpad snap attachments use the same bounded helper: at most
three ten-minute uploads, with a one-minute read-back that checks every
artifact's name and byte size. These retries do not rebuild the snap or
repeat the Snap Store publication.

The regression tests execute snapshot preparation on a fixture repository
and the workflow's actual retry shell with mocked network commands. They
cover TLS recovery, missing recipes, authentication refusal, every queued
architecture, decreasing time budgets, invalid downloads, cleanup failures,
upload timeouts, and missing or wrong-size release assets. Live remote
builds and publication must still be verified by a human-run release job.

Upstream references:

- [Snapcraft remote build and recovery](https://documentation.ubuntu.com/snapcraft/8.14/explanation/remote-build/)
- [Remote command recovery versus submission](https://github.com/canonical/craft-application/blob/6.4.0/craft_application/commands/remote.py)
- [Project-file hashing](https://github.com/canonical/craft-application/blob/6.4.0/craft_application/remote/utils.py)

### Historical note

`ppc64el` / `s390x` were once moved *off* Launchpad *onto* QEMU because the old
Launchpad legs ended in Launchpad state "Stopped" with no snap, then failed at
`snapcraft upload`. That escape route is now a dead end for `core24`, and the
hardened `snap-launchpad` job addresses the upload failure that prompted the move.

## If you ever go back to a QEMU-style multi-arch build

You would need a maintained action/image that ships a `core24`-capable snapcraft
(snapcraft 8.x) and a matching `core24` build container for the target arch. As of
this writing none exists as a drop-in; Canonical's supported answer for non-native
architectures on `core24` is Launchpad `remote-build`.
