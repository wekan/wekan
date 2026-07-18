# Dev: Amiga-family install & update platforms (manual vs automatic, like Snap)

How software is installed and updated across the **Amiga** family — **AmigaOS 3.x**
(classic 68k), **AmigaOS 4.x** (PowerPC, Hyperion), **MorphOS** (PowerPC), and
**AROS** (open-source AmigaOS-compatible reimplementation) — split into **manual**
and **automatic** (background/self-updating, like Linux Snap auto-refresh).

> The Amiga family inherits a distribution culture from the classic 68k days:
> software ships as compressed archives (`.lha`, historically `.lzx`, sometimes
> `.zip`) downloaded from a central web archive, then unpacked and either dragged
> into place or installed via a bundled **Installer** script. This is fundamentally
> **manual** — the user is the update mechanism. Genuine auto-update tooling is rare
> and recent: **AmiUpdate** and **AMIStore's Updater** (AmigaOS 4) can check online
> and pull newer versions, and **Grunch** (MorphOS/AmigaOS) is the only tool in the
> family that behaves like a true auto-refreshing package manager. **AROS** and
> **classic AmigaOS 3.x** have no mainstream package manager and no auto-update.

---

## Comparison table

| Platform / OS | Manual | Automatic | Auto mechanism | Maintainer | URL | License |
|---|:---:|:---:|---|---|---|---|
| **Aminet** (cross-platform archive) | ✓ | — | None — browse/search, download `.lha`/`.zip`, unpack + Installer by hand | Aminet community | https://aminet.net/ | Per-package (mixed) |
| **OS4Depot** (AmigaOS 4) | ✓ | — | None — manual `.lha` download + install | OS4Depot volunteers | https://www.os4depot.net/ | Per-package (mixed) |
| **MorphOS-Storage** (MorphOS) | ✓ | — | None — manual `.lha` download + install | MorphOS community | https://www.morphos-storage.net/ | Per-package (mixed) |
| **AROS Archives** (AROS) | ✓ | — | None — manual download + install; AROS has **no mainstream package manager** | AROS community | https://archives.arosworld.org/ | Per-package (mixed) |
| **AMIStore** (AmigaOS 4 app store) | ✓ | Partial | Store client + separate **Updater**: compares local vs remote versions, can auto-check on start and on a schedule (~every 4h), then user confirms download/install | A-EON Technology | http://www.amistore.net/ | Proprietary client |
| **AmiUpdate** (AmigaOS 4 online updater) | ✓ | Partial | Checks amiupdate.net for newer versions of OS components + registered apps, lists them, user selects; can auto-check but is user-triggered, not a silent daemon | Simon Archer (bundled with AmigaOS 4.1 from Update 6) | https://wiki.amigaos.net/wiki/AmigaOS_Updates | Bundled (proprietary) |
| **Grunch** (MorphOS + AmigaOS) | ✓ | **✓** | True package manager: search/download/install/**auto-update**/uninstall with dependency handling; update prompts can be disabled so installed software updates automatically (closest analogue to Snap auto-refresh) | "geit" (Guido Mersmann) | https://www.geit.de/eng_grunch.html | Freeware |
| **MorphOS system updates** | ✓ | — | None automatic — full/point OS releases distributed as downloadable images/installers; user installs manually | MorphOS Development Team | https://www.morphos-storage.net/ | Proprietary OS |
| **Classic AmigaOS 3.x drag-install** (68k) | ✓ | — | None — drag drawer, or run the Amiga **Installer** script; `.lha`/`.lzx` archives. No package manager, no auto-update | software by individual authors | https://aminet.net/ | Per-package (mixed) |

*AmiUpdate* and *AMIStore's Updater* are "Partial" because they can *check*
automatically/on schedule but still require the user to confirm the install — not
silent auto-appliers like Snap's `snapd`. **Grunch** is the single family tool that
can genuinely auto-update installed apps unattended. There is **no** legitimate
mainstream package manager for AROS or classic AmigaOS 3.x.

---

## WeKan / Electron applicability

**A WeKan Electron desktop app cannot run on any Amiga-family OS.** Electron bundles
Node.js + Chromium, and there is no port of Node or Chromium to 68k (AmigaOS 3.x), to
PowerPC AmigaOS 4 / MorphOS, or to AROS — these platforms lack the modern V8/Blink
toolchain, threading, and graphics stack Chromium requires. The only realistic way an
Amiga user reaches WeKan is via a **web browser pointed at a hosted WeKan server**
(and even then, heavy modern JavaScript strains these browsers) — never as a native
install, so none of the update mechanisms above apply to WeKan itself.

## See also

- Linux: [Linux.md](Linux.md) · Haiku: [Haiku.md](Haiku.md) · RISC OS: [RISC-OS.md](RISC-OS.md) · macOS: [Mac.md](Mac.md)
