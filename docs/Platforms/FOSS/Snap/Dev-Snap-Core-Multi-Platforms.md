# Dev: Snap `core` base vs multi-platform builds

Developer notes on why the `ppc64el` and `s390x` snap legs of `release-all.yml`
fail, what the constraint actually is (verified from the action's source, not the
error string), and the only supported way to build these architectures for a
`core24` snap.

## TL;DR

- WeKan's `snapcraft.yaml` uses **`base: core24`**.
- The `snap-qemu` job builds `ppc64el` / `s390x` with
  **`diddlesnaps/snapcraft-multiarch-action@v1`**, whose newest supported base is
  **`core22`**. It rejects `core24` before any build starts.
- That action is unmaintained, and there is **no maintained QEMU multi-arch snap
  action that supports `core24`**.
- The only `core24`-capable path for architectures that have **no native GitHub
  runner** (`ppc64el`, `s390x`, `riscv64`) is **Launchpad `snapcraft remote-build`**
  — already used for `riscv64` in the `snap-launchpad` job.

## The failure

Logs (`release-all.yml` → `snap-qemu` matrix legs `ppc64el` and `s390x`):

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
| `snapcore/action-publish` (used by `snap-native` / `snap-qemu`) | https://github.com/snapcore/action-publish |
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
| `snap-qemu` | `ppc64el`, `s390x` | `diddlesnaps/snapcraft-multiarch-action` under QEMU | **No — caps at core22** |
| `snap-launchpad` | `riscv64` | `snapcraft remote-build` on Launchpad | Yes |

`amd64` / `arm64` have native runners, so `action-build` works and is fastest.
`ppc64el` / `s390x` / `riscv64` have **no native GitHub runner**, and snapcraft
cannot cross-build a snap — so they need either QEMU emulation (which can't do
`core24`) or Launchpad.

## The fix

Because no QEMU multi-arch action supports `core24`, `ppc64el` and `s390x` cannot
stay in `snap-qemu`. Move them to Launchpad `remote-build` alongside `riscv64`:

- Add `ppc64el` and `s390x` to the `snap-launchpad` matrix.
- Delete the dead `snap-qemu` job.

The current `snap-launchpad` job is more robust than the older Launchpad legs that
were originally replaced by `snap-qemu`: it **requires the `.snap` file to exist,
retries the remote build 3×, and only uploads when the file is present**, which
guards the old "is not a valid file" (`snapcraft upload`, exit 64) failure.

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
