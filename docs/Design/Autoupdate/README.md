# Autoupdate: install & update platforms per operating system

Developer reference comparing **how software is installed and updated** on each
operating system — split into **manual** (user re-downloads/re-runs) and **automatic**
(background/self-updating, like Linux **Snap** auto-refresh) — for the purpose of
**automatic WeKan updates**. WeKan's desktop app is **Electron**; the server is
Node/Meteor (Docker or from source). Each page ends with a note on WeKan/Electron
applicability.

## Desktop / server operating systems

| OS | Doc | Snap-like auto-update? |
|---|---|---|
| Windows | [Windows.md](OS/Windows.md) | Microsoft Store / MSIX; electron-updater |
| macOS | [Mac.md](OS/Mac.md) | Mac App Store; Sparkle; electron-updater |
| Linux | [Linux.md](OS/Linux.md) | **Snap** (native), Flatpak, AppImage |
| BSD (FreeBSD/OpenBSD/NetBSD/DragonFly) | [BSD.md](OS/BSD.md) | No — cron + native tools |
| Haiku | [Haiku.md](OS/Haiku.md) | No — pkgman is on-demand |
| Amiga family (AmigaOS 3/4, MorphOS, AROS) | [Amiga.md](OS/Amiga.md) | Only Grunch; mostly manual |
| RISC OS | [RISC-OS.md](OS/RISC-OS.md) | No — PackMan is user-initiated |

## Enterprise / legacy Unix & VMS

| OS | Doc | Auto Internet update? |
|---|---|---|
| Oracle Solaris / illumos | [Solaris.md](OS/Solaris.md) | Solaris 11.4 `auto-update` SMF; illumos no |
| IBM AIX | [AIX.md](OS/AIX.md) | SUMA (scheduled download) |
| HP-UX | [HP-UX.md](OS/HP-UX.md) | No |
| OpenVMS | [OpenVMS.md](OS/OpenVMS.md) | No |
| IBM z/OS | [zOS.md](OS/zOS.md) | SMP/E `RECEIVE ORDER` (download) |

## Alternative / retro / hobbyist desktop

| OS | Doc | Package manager |
|---|---|---|
| OS/2 → ArcaOS | [ArcaOS.md](OS/ArcaOS.md) | RPM/YUM, WarpIN, ANPM |
| ReactOS | [ReactOS.md](OS/ReactOS.md) | RAPPS |
| FreeDOS | [FreeDOS.md](OS/FreeDOS.md) | FDNPKG |
| Plan 9 / 9front | [Plan9.md](OS/Plan9.md) | source pull (git9/replica) |
| Redox OS | [Redox.md](OS/Redox.md) | pkg / pkgutils |
| SerenityOS | [SerenityOS.md](OS/SerenityOS.md) | none (Ports, build-from-source) |

## Mobile / embedded / TV

| OS | Doc | Store auto-update |
|---|---|---|
| Android | [Android.md](OS/Android.md) | Play / F-Droid / Aurora (background) |
| iOS / iPadOS | [iOS.md](OS/iOS.md) | App Store (background) |
| ChromeOS | [ChromeOS.md](OS/ChromeOS.md) | OS + Play + PWA (best PWA fit) |
| HarmonyOS | [HarmonyOS.md](OS/HarmonyOS.md) | AppGallery (background) |
| Ubuntu Touch | [Ubuntu-Touch.md](OS/Ubuntu-Touch.md) | OpenStore (notifies) + image OTA |
| Sailfish OS | [Sailfish.md](OS/Sailfish.md) | Jolla Store (notifies) |
| postmarketOS | [postmarketOS.md](OS/postmarketOS.md) | apk (Alpine) |
| KaiOS | [KaiOS.md](OS/KaiOS.md) | KaiStore (background) |
| Tizen | [Tizen.md](OS/Tizen.md) | TV only (store shut for watch/mobile 2026) |
| webOS (LG TV) | [webOS.md](OS/webOS.md) | LG Content Store (background) |
| Android TV / Fire OS / Roku | [TV-OSes.md](OS/TV-OSes.md) | store-managed (background) |

## WeKan-specific

| Topic | Doc |
|---|---|
| Snap multi-arch build constraints (core24 vs QEMU action) | [Snap-Core.md](Forks/Snap-Core.md) |
| Releasing the `wekan-ondra` / `wekan-gantt-gpl` snaps from release-all.yml | [Snap-Ondra-Gantt.md](Snap-Ondra-Gantt.md) |
| Releasing the Docker-based UCS App Center app (MongoDB 3.x → FerretDB migration) | [UCS.md](UCS.md) |
| WeKan for Nextcloud — ExApp build, App Store publishing, AI/Deck/SSO integrations | [Nextcloud.md](Nextcloud.md) |

---

### Bottom line for WeKan

- **Linux:** WeKan already ships a **Snap** (`snapd` auto-refresh) — the reference
  Snap-like experience — plus Docker.
- **Windows / macOS desktop:** **electron-updater** (electron-builder) with a
  signed(+notarized on macOS) feed is the closest single-app analogue to Snap.
- **Mobile / TV:** WeKan is a web app — the realistic path is a **PWA** (ChromeOS/
  Android/iOS) or a browser, not native store auto-update.
- **Everything else (BSD, enterprise Unix, retro):** no Electron desktop path; run the
  **server** where Node ports exist, or use a browser against a hosted WeKan.
