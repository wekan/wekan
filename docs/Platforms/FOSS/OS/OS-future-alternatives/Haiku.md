# Dev: Haiku install & update platforms (manual vs automatic, like Snap)

How software is installed and updated on **Haiku** (the open-source, BeOS-inspired
OS), split into **manual** and **automatic** (background/self-updating, like Linux
Snap auto-refresh).

> Haiku uses a **package system built around read-only, mounted packages** rather
> than a file-scattering installer. Software ships as **`.hpkg`** files; when one is
> placed in `/system/packages` or `~/config/packages`, a virtual filesystem
> (**packagefs**) mounts its contents into the hierarchy on the fly, and a background
> **package daemon** activates it atomically (saving a rollback-able system "state").
> **Key point: Haiku has no scheduled/background *fetch* auto-update** — every update
> is user-initiated. Only the *activation* of an already-downloaded `.hpkg` is
> automatic. This is unlike Snap's `snapd` auto-refresh.

---

## Comparison table

| Platform | Manual | Automatic | Auto mechanism | Maintainer | URL | License |
|---|:---:|:---:|---|---|---|---|
| **pkgman** (CLI: `refresh`/`update`/`full-sync`/`install`) | ✓ | — | None — user runs it. (`update` fetches newer packages; system updates need a reboot.) | Haiku Project | https://www.haiku-os.org/guides/daily-tasks/updating-system/ | MIT |
| **HaikuDepot** (GUI software center) | ✓ | — | None — browse/install on demand; "Check for updates…" just launches SoftwareUpdater | Haiku Project | https://www.haiku-os.org/docs/userguide/en/applications/haikudepot.html | MIT |
| **SoftwareUpdater** (updater app) | ✓ | — | None — checks only when launched; no scheduling, no background scan, no notifications | Haiku Project | https://www.haiku-os.org/docs/userguide/en/applications/softwareupdater.html | MIT |
| **Manual `.hpkg` install** (drop into a packages dir) | ✓ | activation only | packagefs + `package_daemon` detect the new file and activate it automatically — but obtaining a newer file is fully manual | Haiku Project | https://www.haiku-os.org/docs/develop/packages/Infrastructure.html | MIT |
| **HaikuPorts + haikuporter** (dev publishing) | ✓ | — | None — dev writes a recipe, builds `.hpkg`, opens a GitHub PR; users then get it via the repo | HaikuPorts community | https://github.com/haikuports/haikuports | MIT (tooling) |
| **Plain zip / binary (unpackaged)** | ✓ | — | None — outside package management entirely | app vendor | (varies) | (varies) |

`pkgman` subcommands: `refresh` (update repo metadata), `update [pkg…]` (upgrade
installed packages), `full-sync` (bring system fully in line with repos — may
downgrade/remove), `install`, `search`, `uninstall`, `add-repo`/`drop-repo`. All are
on-demand.

---

## WeKan / Electron applicability

**The WeKan Electron desktop client cannot realistically run on Haiku.** There is no
Haiku port of Electron (upstream request closed **wontfix**; Electron ships only
Windows/macOS/Linux binaries). **Node.js has been ported to Haiku** (x86_64, in
HaikuDepot), so WeKan's *server* could conceivably run with effort — but the desktop
app cannot, and no auto-update path for it exists. The practical answer for a Haiku
user is to run WeKan as a **web app in a browser** against a hosted/self-hosted server.

## See also

- Linux: [Linux.md](Linux.md) · BSD: [BSD.md](BSD.md) · macOS: [Mac.md](Mac.md) · Windows: [Windows.md](Windows.md)
