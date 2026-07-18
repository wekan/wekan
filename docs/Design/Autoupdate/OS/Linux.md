# Dev: Linux install & update platforms (manual vs automatic, like Snap)

How software is installed and updated on **Linux**, split into **manual** (the user
runs a command / re-downloads) and **automatic** (background / scheduled /
self-updating). Snap is the reference point — this is the platform where Snap's
`snapd` auto-refresh actually lives. WeKan ships an official **Snap** and a **Docker**
image; the desktop app is **Electron**.

> Linux is the one platform with several *first-party* Snap-like auto-refresh stacks:
> **Snap** (`snapd`, auto-refresh by default), **Flatpak** (auto-update via GNOME
> Software / KDE Discover), and **AppImage + AppImageUpdate** (binary-delta
> self-update). Distro package managers (apt/dnf/pacman/zypper) are manual by default
> but trivially automated (`unattended-upgrades`, `dnf-automatic`).

---

## a) Manual update platforms

| Platform | Update step | Maintainer | Format | URL | License |
|---|---|---|---|---|---|
| **apt / dpkg** (Debian, Ubuntu, Mint…) | `apt update && apt upgrade` | Debian | `.deb` | https://wiki.debian.org/Apt | GPL (OSS) |
| **dnf / rpm** (Fedora, RHEL, Rocky, Alma) | `dnf upgrade` | Red Hat / Fedora | `.rpm` | https://github.com/rpm-software-management/dnf | GPL (OSS) |
| **pacman** (Arch, Manjaro) | `pacman -Syu` | Arch Linux | pkg.tar.zst | https://wiki.archlinux.org/title/Pacman | GPL (OSS) |
| **zypper** (openSUSE, SLES) | `zypper update` / `zypper dup` | SUSE | `.rpm` | https://en.opensuse.org/SDB:Zypper_usage | GPL (OSS) |
| **apk** (Alpine) | `apk upgrade` | Alpine | `.apk` | https://wiki.alpinelinux.org/wiki/Alpine_Package_Keeper | GPL (OSS) |
| **portage / emerge** (Gentoo) | `emerge -uDN @world` | Gentoo | source ebuilds | https://wiki.gentoo.org/wiki/Portage | GPL (OSS) |
| **Nix** (NixOS, any distro) | bump inputs + `nixos-rebuild switch` | NixOS | Nix store | https://nixos.org/ | MIT (OSS) |
| **npm global** | `npm update -g` — CLI tools only | npm/GitHub | npm tarball | https://docs.npmjs.com/ | MIT (OSS) |
| **Raw tarball / `.run` / `make install`** | re-download, rebuild/replace | app author | source/binary | — | varies |

---

## b) Automatic update platforms (like Snap)

### Universal packaging with built-in auto-update (the true Snap-likes)

| Platform | Auto-update mechanism | Maintainer | Format | URL | License |
|---|---|---|---|---|---|
| **Snap** | `snapd` **auto-refreshes** installed snaps in the background by default (4×/day, configurable; delta downloads; transactional, auto-rollback on failed refresh; channels stable/candidate/beta/edge). The closest thing to itself. | Canonical | `.snap` | https://snapcraft.io/ | GPL (OSS); proprietary store backend |
| **Flatpak** | Sandboxed apps from **Flathub**; auto-update via **GNOME Software** / **KDE Discover** (background check + install), or `flatpak update`. OSTree-based delta updates. | Flatpak / freedesktop | `.flatpak` | https://flatpak.org/ | LGPL (OSS) |
| **AppImage + AppImageUpdate** | A single-file `.app` that carries update info; **AppImageUpdate** (and libappimageupdate embedded in the app) does **binary-delta** self-update from a zsync feed. No system integration needed. | AppImage community | `.AppImage` | https://appimage.org/ · updater https://github.com/AppImageCommunity/AppImageUpdate | MIT (OSS) |

### Distro package managers in *automatic* mode

| Platform | Auto-update mechanism | Maintainer | URL | License |
|---|---|---|---|---|
| **unattended-upgrades** (Debian/Ubuntu) | systemd timer auto-installs security (or all) `apt` updates in the background. | Debian | https://wiki.debian.org/UnattendedUpgrades | GPL (OSS) |
| **dnf-automatic** (Fedora/RHEL) | systemd timer that downloads/applies `dnf` updates automatically. | Red Hat | https://dnf.readthedocs.io/en/latest/automatic.html | GPL (OSS) |
| **PackageKit / GNOME Software / KDE Discover** | Desktop update stack: background checks and offline/auto updates for apt/dnf/flatpak. | freedesktop | https://www.freedesktop.org/software/PackageKit/ | GPL (OSS) |
| **transactional-update / rpm-ostree** (openSUSE MicroOS, Fedora Silverblue) | Atomic, auto-applied image updates with rollback (immutable distros). | SUSE / Fedora | https://coreos.github.io/rpm-ostree/ | GPL/Apache (OSS) |

### App-embedded self-updaters (Electron-relevant)

| Platform | Auto-update mechanism | Maintainer | Format | URL | License |
|---|---|---|---|---|---|
| **electron-updater (electron-builder)** | On Linux, auto-update works for **AppImage** (via the built-in updater), and can generate deb/rpm; pulls from a feed (GitHub Releases, generic HTTPS). **No Squirrel on Linux** — AppImage is the auto-update target. | electron-userland | `.AppImage`/`.deb`/`.rpm` | https://www.electron.build/ | MIT (OSS) |
| **update.electronjs.org / Hazel / Nuts / Nucleus** | Feed servers for the Electron updater (cross-platform). | Electron / community | feed | https://github.com/electron/update.electronjs.org | MIT (OSS) |

> On Linux there is **no OS-level self-update for `.deb`/`.rpm` apps** outside the
> distro's own package manager — an app installed from a repo updates when the repo
> updates. For a self-contained auto-updating Electron build, ship an **AppImage**
> (electron-updater) or a **Snap**/**Flatpak** and let that stack auto-refresh.

---

## Comparison at a glance

| Platform | Manual | Automatic | Auto mechanism | For Electron app? |
|---|:---:|:---:|---|---|
| apt / dnf / pacman / zypper / apk | ✓ | via timer | unattended-upgrades / dnf-automatic | as repo pkg |
| portage / Nix | ✓ | — | manual/declarative | source |
| **Snap** | ✓ | ✓ | `snapd` auto-refresh (default) | ✓ **WeKan ships this** |
| **Flatpak** | ✓ | ✓ | GNOME Software / Discover | ✓ |
| **AppImage + AppImageUpdate** | ✓ | ✓ | zsync binary-delta self-update | ✓ (electron-updater) |
| electron-updater | — | ✓ | AppImage self-update / feed | ✓ recommended |
| unattended-upgrades / dnf-automatic | — | ✓ | systemd timer | as repo pkg |
| rpm-ostree / transactional-update | — | ✓ | atomic image + rollback | as flatpak |

---

## What this means for WeKan

- **WeKan already ships a Snap** — `snapd` auto-refresh gives Linux users Snap-like
  background updates for free (this is the reference implementation). See the
  multi-arch snap-build notes: [Snap-Core.md](../Forks/Snap-Core.md).
- **Desktop Electron auto-update on Linux:** ship an **AppImage** built by
  electron-builder (electron-updater self-updates it), or a **Flatpak** on Flathub.
- **Server:** the normal path is **Docker** (pull a new image) or from source — outside
  these desktop update frameworks.

## See also

- Windows: [Windows.md](Windows.md)
- macOS: [Mac.md](Mac.md)
- BSD: [BSD.md](BSD.md)
