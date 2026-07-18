# Dev: RISC OS install & update platforms (manual vs automatic, like Snap)

How software is installed and updated on **RISC OS** (the Acorn-heritage 32-bit ARM
OS, maintained as open source by **RISC OS Open Ltd** for RISC OS 5), split into
**manual** and **automatic** (background/self-updating, like Linux Snap auto-refresh).

> RISC OS has **no traditional installer** for most software. A RISC OS application
> is an **application directory** whose name starts with `!` ("pling") — e.g.
> `!Draw`, `!PackMan`. The Filer shows it as one icon; everything the app needs lives
> inside that one directory, so **"installing" is literally dragging the `!App`
> directory out of the downloaded `.zip` to where you want it** (and deleting it to
> uninstall). Archives must be extracted **on RISC OS** (SparkFS/SparkPlug) to keep
> the RISC OS filetype metadata. Layered on top are the **PackMan** package manager
> and the **!Store / PlingStore** app store — but **none is a background auto-updater**;
> even PackMan requires the user to open it and click "Upgrade all".

---

## Comparison table

| Platform | Manual | Automatic | Auto mechanism | Maintainer | URL | License |
|---|:---:|:---:|---|---|---|---|
| **`!App` drag-install** (classic Filer method) | ✓ | — | None — download `.zip`, extract on RISC OS, drag the `!App` to `$.Apps`; re-download to update | OS convention | https://www.riscosopen.org/wiki/documentation/show/Getting%20RISC%20OS%20Software | n/a |
| **PackMan** (GUI package manager over RiscPkg/LibPkg) | ✓ | Semi (user-initiated) | User opens PackMan → *Update lists* → *Upgrade all* downloads & installs newer versions. No scheduled/background refresh | Alan Buckley | https://github.com/alanbu/packman | GPL (OSS) |
| **RiscPkg / RISC OS Packaging Project** (package format + repos) | ✓ | Semi (via PackMan) | Repositories provide an index; the front-end pulls updates on demand | RISC OS Packaging Project / ROOL | https://packages.riscosopen.org/ | GPL (OSS) |
| **!Store / PlingStore** (app store) | ✓ | Semi (notify + one-click) | From v1.10 (2014) compares version numbers and **prompts** the user, who triggers the update. No silent background updating | R-Comp / "!Store" | http://www.plingstore.org.uk/ (HTTP-only) | Proprietary/freeware client |
| **OS / ROM + `!Boot` (HardDisc4) updates** | ✓ | — | None — download a ROM image / disc build and re-flash/re-copy; nightly + stable builds published, fetched manually | RISC OS Open Ltd | https://www.riscosopen.org/content/downloads | Apache-2.0 (RISC OS 5) |

**RISC OS 5 vs 6:** RISC OS 5 (RISC OS Open, open source, Apache-2.0) publishes ROM +
`HardDisc4` builds (nightly + stable) fetched and flashed manually; some OS components
are also PackMan packages, but still only when the user runs PackMan — **no automatic
OS update service**. RISC OS 6 / 4.x (RISCOS Ltd → 3QD) is a separate, proprietary,
largely dormant branch using the same manual `!Boot`/disc model.

> **URL note:** the legacy `riscpkg.org` is HTTP-only and refuses HTTPS — treat it as
> semi-defunct; the live canonical package infrastructure is
> **`packages.riscosopen.org`**.

---

## WeKan / Electron applicability

**A WeKan Electron/Node desktop client cannot run on RISC OS.** Electron bundles
Chromium + V8/Node, which target modern 64-bit Windows/macOS/Linux (Electron has even
dropped 32-bit ARM Linux). RISC OS is a cooperatively-multitasked, single-address-space,
32-bit ARM OS with no POSIX/glibc layer and no V8/Node port, so neither Node nor a
current Chromium can build there. The only way to reach a WeKan board from RISC OS is a
native browser (NetSurf, Iris) — and WeKan's Meteor/JS-heavy UI is beyond what those
render — so RISC OS is not a supported WeKan client platform.

## See also

- Linux: [Linux.md](Linux.md) · Amiga: [Amiga.md](Amiga.md) · Haiku: [Haiku.md](Haiku.md) · macOS: [Mac.md](Mac.md)
