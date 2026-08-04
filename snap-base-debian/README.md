# WeKan Debian base snap (i386, and other Ubuntu-dropped arches)

This directory is a **starting scaffold**, not a finished, tested artefact. It
exists so WeKan can ship a **snap for i386** (and later the other exotic arches)
even though Ubuntu's `core24` has no i386 port. The idea, why it can work, and
the exact steps to prove and publish it are below.

## Why Debian, and why this can work

- **core24 has no i386.** Ubuntu dropped i386 as a release architecture after
  18.04, so `base: core24` + `build-on: i386` is a snapcraft *parse* error that
  broke every snap build (fixed separately by removing i386 from the core24
  `snapcraft.yaml`).
- **Debian still ships i386** (and armel/armhf/ppc64el/s390x/riscv64) as full
  release architectures, and — unlike Alpine — **Debian is glibc**. So WeKan's
  existing glibc binaries (the wekan/node fork's Node.js, FerretDB, mongo-tools,
  caddy, native modules) run **unchanged** in a Debian base. An Alpine/musl base
  would require re-porting all of that to musl; Debian requires none of it.
- **The WeKan snap only assembles a prebuilt `wekan-<arch>.zip`** (see the
  `wekan` part in the root `snapcraft.yaml`), and `wekan-i386.zip` already exists
  (built by `build-extra-arches` + the wekan/node fork). So the *only* missing
  piece for an i386 snap is an i386-capable **base** — which is this.
- **i386 builds natively on amd64.** An amd64 CPU runs i386 directly, so this
  base and the i386 WeKan snap build on a plain `ubuntu-24.04` runner with **no
  qemu and no Launchpad** — the thing that makes i386 the tractable first arch.

## The three pieces

1. **This base snap** — `snap-base-debian/snapcraft.yaml` (`type: base`,
   `wekan-base-debian13`), a trimmed Debian trixie rootfs.
2. **An i386 WeKan snap** — a separate `snapcraft-i386.yaml` (see below), a copy
   of the root `snapcraft.yaml` with `base: wekan-base-debian13` and only the
   `i386` platform. Kept SEPARATE so it can never break the mainstream core24
   build.
3. **A CI job** — build+publish the base once, then build+publish the i386 WeKan
   snap, both on `ubuntu-24.04` (native i386, no Launchpad).

## Local test loop (do this before any CI or store work)

```sh
# 1. Register the base name once (globally unique; needs a store login).
snapcraft register wekan-base-debian13

# 2. Build the base for i386 on an amd64 machine (native, no emulation).
cd snap-base-debian
snapcraft pack --build-for i386      # -> wekan-base-debian13_13_i386.snap

# 3. Install it locally to test WITHOUT store review.
sudo snap install --dangerous ./wekan-base-debian13_13_i386.snap

# 4. Build an i386 WeKan snap on top of it (see snapcraft-i386.yaml below), then
#    install and smoke-test it:
sudo snap install --dangerous ./wekan_10.60_i386.snap
snap run wekan            # or the app command; check it starts and serves 8080
```

If the WeKan snap starts and serves on i386 locally, the base works. Only then is
it worth the store-review round trip.

## Publishing to the Snap Store

- **Custom base snaps require MANUAL review.** After `snapcraft upload`, request
  review (the store forum / a review-queue request). Approval is per-snap and can
  take time; this is the main non-technical cost.
- Reuse the existing credential (`SNAP_AUTH` = `snapcraft export-login`), but the
  ACL must include **`wekan-base-debian13`** as well as `wekan`:

  ```sh
  snapcraft export-login \
    --snaps wekan,wekan-base-debian13 \
    --acls package_access,package_push,package_release,package_update \
    snap-auth.txt
  gh secret set SNAP_AUTH --repo wekan/wekan < snap-auth.txt
  ```

- Release order matters: the **base must be published (and reviewed) first**, or
  the WeKan i386 snap cannot resolve `base: wekan-base-debian13` at install time.

## The i386 WeKan snap (`snapcraft-i386.yaml`) — not generated yet

Deliberately not auto-generated here, because it must be derived from the current
root `snapcraft.yaml` and then *tested*, not guessed. To create it:

1. Copy the root `snapcraft.yaml` to `snapcraft-i386.yaml`.
2. Change `base: core24` → `base: wekan-base-debian13`.
3. Replace the whole `platforms:` block with only:
   ```yaml
   platforms:
     i386:
       build-on: [amd64]
       build-for: [i386]
   ```
4. Leave the `wekan` part as-is — it already maps `i386 -> wekan-i386.zip`.
5. Check every `build-packages:` name resolves on **Debian** (not just Ubuntu);
   Debian package names are almost always identical, but verify at build time.

## Known pitfalls (why this is a project, not a config switch)

- **snapd base compatibility.** A base must present a working glibc rootfs with
  the mount points snapd expects; the scaffold trims and creates those, but the
  exact set can need tuning until a snap actually runs on the base.
- **Store review** of a custom base is a real gate.
- **Only i386 is native-on-amd64.** armhf/ppc64el/s390x/riscv64 bases need their
  own (emulated or native-arm) builders — add them to `platforms:` one at a time,
  each proven the same way.
- **Debian i386 is itself a shrinking target.** trixie has it; long-term it is
  uncertain. This buys i386 snaps for the trixie era, not forever.
- **The `.deb` and AppImage already serve i386** — so weigh this base's ongoing
  maintenance (rebuilds on Debian updates, review) against how many users need
  the *snap* specifically.

## Status

- [x] Base `snapcraft.yaml` scaffold (i386), documented and isolated.
- [ ] `snapcraft pack --build-for i386` proven locally.
- [ ] i386 WeKan snap (`snapcraft-i386.yaml`) built and smoke-tested on the base.
- [ ] Base + WeKan i386 snap registered, uploaded, review requested, published.
- [ ] CI job wired (build+publish base, then i386 WeKan snap, on `ubuntu-24.04`).
