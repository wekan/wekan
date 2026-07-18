# Dev: Windows install & update platforms (manual vs automatic, like Snap)

A developer reference of **every platform that can install and update a Windows
application**, split by whether updates are **manual** (the user re-downloads and
re-runs an installer) or **automatic** (background / self-updating, the way a Linux
**Snap** auto-refreshes). WeKan's desktop app is **Electron**, and WeKan server can
also run on Windows, so both desktop-app and enterprise-deployment mechanisms are
covered.

> Windows has no single first-party equivalent of Snap's transactional,
> store-driven, delta auto-refresh. The closest built-in options are the
> **Microsoft Store (MSIX)** and **App Installer (`.appinstaller`)**; everything
> else is either manual, an app-embedded updater (Electron/Squirrel/Omaha/Sparkle),
> or an enterprise fleet manager (Intune/SCCM/WSUS/PDQ).

---

## a) Manual update platforms

The user (or an admin) explicitly fetches and applies each new version. No
background refresh.

### Installer formats (the update is "download the new one and run it")

| Platform | What it is | Maintainer | Format | URL | License |
|---|---|---|---|---|---|
| **MSI / Windows Installer** | The classic transactional installer/patching engine. Updates via a new MSI, an `.msp` patch, or major-upgrade. No self-update; an admin or GPO redeploys. | Microsoft | `.msi`, `.msp` | https://learn.microsoft.com/en-us/windows/win32/msi/windows-installer-portal | Proprietary (OS component) |
| **EXE / NSIS** | Scriptable installer that produces a self-contained `.exe`. No built-in updater — needs an external one (see electron-updater / WinSparkle). | Open source (NSIS project) | `.exe` | https://nsis.sourceforge.io/ | zlib/LGPL (OSS) |
| **EXE / Inno Setup** | Popular scriptable `.exe` installer. Same as NSIS: no self-update on its own. | Jordan Russell (OSS) | `.exe` | https://jrsoftware.org/isinfo.php | Free (OSS) |
| **Portable / ZIP** | Unzip-and-run, no installer. "Update" = replace the folder. | app author | `.zip`, portable `.exe` | — | varies |

### Package managers whose *default* mode is manual

| Platform | Update command (manual) | Maintainer | Format handled | URL | License |
|---|---|---|---|---|---|
| **winget** (Windows Package Manager) | `winget upgrade` / `winget upgrade --all` — **no built-in scheduler**; nothing runs on its own. | Microsoft | `.msi`, `.exe`, `.msix`, portable, Store | https://github.com/microsoft/winget-cli | MIT (OSS) |
| **Chocolatey** (CLI) | `choco upgrade all` — manual unless scheduled (see auto section). | Chocolatey Software / community | `.msi`, `.exe`, `.zip` (nupkg wrappers) | https://chocolatey.org/ | Apache-2.0 core (OSS); paid tiers |
| **Scoop** | `scoop update *` — manual only, no background service by design. | ScoopInstaller (OSS) | portable `.zip`, `.exe` | https://scoop.sh/ · repo https://github.com/ScoopInstaller/Scoop | MIT (OSS) |
| **npm global** (`npm i -g`) | `npm update -g` — **CLI tools only**, not GUI apps. No auto-update. | npm / GitHub | npm tarball | https://docs.npmjs.com/ | MIT (OSS) |
| **Ninite** (free web installer) | Re-run the generated `.exe` to update the whole curated selection. Fixed catalog — **not a self-distribution channel**. | Secure by Design | wraps vendor `.exe`/`.msi` | https://ninite.com/ | Free (personal) |

> **Note (winget):** winget itself is delivered as part of **App Installer** via the
> Microsoft Store, so the *tool* updates automatically — but the **apps it manages
> do not** unless you add a scheduled task or a helper (see WAU below).

---

## b) Automatic update platforms (like Snap)

These refresh in the background, on launch, on a schedule, or store-managed —
without the user re-running an installer.

### Store / OS-managed (closest to Snap)

| Platform | Auto-update mechanism | Maintainer | Format | URL | License |
|---|---|---|---|---|---|
| **Microsoft Store** | Store client silently downloads & installs new versions in the background (delta updates). The nearest Windows analogue to Snap's store-driven auto-refresh. | Microsoft | **MSIX / AppX** | https://apps.microsoft.com/ | Proprietary |
| **MSIX + App Installer (`.appinstaller`)** | An `.appinstaller` XML manifest with an `<UpdateSettings>` block: `OnLaunch` + `HoursBetweenUpdateChecks`, or automatic background checks. Lets you self-host MSIX auto-update **without** the Store. | Microsoft | **MSIX / `.appinstaller`** | https://learn.microsoft.com/en-us/windows/msix/app-installer/app-installer-file-overview | Proprietary (OS component) |
| **ClickOnce** | `.application` manifest; the app checks its deployment URL and updates **on launch** (before or after start, configurable). Old but still supported; primarily .NET — **not usable for Electron**. | Microsoft | `.application` | https://learn.microsoft.com/en-us/visualstudio/deployment/clickonce-security-and-deployment | Proprietary |
| **Steam** | Always-running background client auto-updates installed titles (has a "Software" category). Offloads the whole update stack to Valve, but a closed store with revenue share. | Valve | any desktop app | https://store.steampowered.com/ | Proprietary |
| **Setapp / Stardock ODM** | Subscription "app store" clients with an auto-updating agent. **Setapp is macOS/iOS only** — there is **no general Windows equivalent**; Stardock ODM only auto-updates Stardock's own utilities. | MacPaw / Stardock | client-managed | https://setapp.com/ · https://www.stardock.com/ | Proprietary |

> ⚠️ **MSIX web-install caveat:** the **`ms-appinstaller:` protocol handler**
> (one-click "Install" from a web page) was **disabled by default** by Microsoft in
> Dec 2023 (App Installer `1.21.3421.0`) after malware abuse — `.msix`/`.appinstaller`
> files now must be **downloaded to disk first** so endpoint AV can scan them. The
> `.appinstaller` **auto-update-after-install** mechanism still works; only the
> browser one-click protocol was turned off. See
> https://learn.microsoft.com/en-us/windows/msix/app-installer/ and
> https://www.microsoft.com/en-us/msrc/blog/2023/12/microsoft-addresses-app-installer-abuse

### App-embedded self-updaters (best fit for an Electron app like WeKan desktop)

| Platform | Auto-update mechanism | Maintainer | Format | URL | License |
|---|---|---|---|---|---|
| **Squirrel.Windows** | The updater behind Electron's built-in `autoUpdater` on Windows. App pings a feed on launch, downloads deltas, swaps on restart. | OSS (Squirrel project) | `.nupkg` + `Setup.exe` | https://github.com/Squirrel/Squirrel.Windows | MIT (OSS) |
| **Electron `autoUpdater` (built-in)** | Built on Squirrel (Win) / Squirrel.Mac (Mac). Needs an update **server/feed**. | OpenJS / Electron | Squirrel feed | https://www.electronjs.org/docs/latest/api/auto-updater | MIT (OSS) |
| **electron-updater (electron-builder)** | The most common Electron auto-updater. NSIS-based; pulls from a feed (**GitHub Releases**, generic HTTP, S3, etc.), downloads in background, installs on quit. Independent of Squirrel. | electron-userland (OSS) | NSIS `.exe`, `.msi` | https://www.electron.build/ · repo https://github.com/electron-userland/electron-builder | MIT (OSS) |
| **update.electronjs.org** | Free hosted update server for **open-source** Electron apps published to public **GitHub Releases**; works with the built-in Squirrel `autoUpdater`. | Electron project | Squirrel feed | https://github.com/electron/update.electronjs.org | MIT (OSS) |
| **Hazel** | Self-hosted lightweight update server for Electron (GitHub Releases proxy). | Vercel (OSS) | Squirrel feed | https://github.com/vercel/hazel | MIT (OSS) |
| **Nuts** | Self-hosted update server backed by GitHub Releases, with download + changelog. | GitBook (OSS) | Squirrel feed | https://github.com/GitbookIO/nuts | Apache-2.0 (OSS) |
| **Nucleus** | Self-hosted update server for Electron (multi-app, S3/static). | Atlassian (OSS) | Squirrel / electron-updater feed | https://github.com/atlassian/nucleus | MIT (OSS) |
| **WinSparkle** | Windows port of macOS **Sparkle**; appcast (RSS) based auto-update for native/non-Electron Windows apps. Checks on schedule/launch, prompts, installs. | OSS | `.exe`/`.msi` via appcast | https://winsparkle.org/ | MIT (OSS) |
| **Google Omaha** | The open-source engine behind Google Chrome's silent auto-update: a background service that polls and installs. Heavy to operate but the gold standard for silent background refresh. | Google (OSS) | `.exe`/`.msi` via Omaha protocol | https://github.com/google/omaha | Apache-2.0 (OSS) |

> **Maturity caveat (avoid for new work):** **Squirrel.Windows** is stagnant (last
> release 2020), **Nucleus/Hazel/Nuts** are 2018–2021 vintage, and **Google Omaha**
> was archived (read-only) in 2025. For a new Electron app prefer **electron-updater**
> (self-hosted feed) or **update.electronjs.org** (GitHub Releases).

### Third-party package managers in *automatic* mode

| Platform | Auto-update mechanism | Maintainer | URL | License |
|---|---|---|---|---|
| **Chocolatey (scheduled / Central Management)** | A **scheduled task** running `choco upgrade all`, or **Chocolatey Central Management** (self-service + reporting) in the commercial tiers. | Chocolatey Software | https://chocolatey.org/ | OSS core + paid |
| **Winget-AutoUpdate (WAU)** | Popular helper: installs a scheduled task running `winget upgrade` as SYSTEM on a Daily/Weekly/… cadence, with allow/block lists and user notifications. Turns winget into Snap-like background refresh. | Romanitho (OSS) | https://github.com/Romanitho/Winget-AutoUpdate | GPL-3.0 (OSS) |
| **Ninite Pro / Ninite Updater** | Background agent that keeps a curated app catalog patched automatically across machines. | Ninite (commercial) | https://ninite.com/ | Proprietary (paid) |

### Enterprise fleet / MDM (admin-driven automatic deployment & patching)

| Platform | Auto-update mechanism | Maintainer | URL | License |
|---|---|---|---|---|
| **Microsoft Intune (+ Enterprise App Management)** | Cloud MDM: assign apps (Win32 `.intunewin`/MSIX/Store) via the Intune Management Extension. **Enterprise App Management** auto-update reached **GA in 2026** — a catalog app with a *Required* assignment auto-updates when a newer catalog version appears (no supersedence; no phased rollout / rollback yet). | Microsoft | https://learn.microsoft.com/en-us/intune/app-management/deployment/enterprise-app-management | Proprietary (subscription) |
| **Microsoft Configuration Manager (SCCM/MECM)** | On-prem/co-managed fleet deployment. **Automatic Deployment Rules (ADR)** sync → build update group → deploy to collections on a schedule; third-party apps via native catalogs or Patch My PC. Can target **server** collections. | Microsoft | https://learn.microsoft.com/en-us/mem/configmgr/ | Proprietary |
| **WSUS** | On-prem Windows Update server; auto-approval rules + GPO-scheduled client pull. Primarily OS/MS patches; third-party apps only via a publishing layer. **Deprecated (announced Sept 2024)** but still shipping in Windows Server 2025. | Microsoft | https://learn.microsoft.com/en-us/windows-server/administration/windows-server-update-services/get-started/windows-server-update-services-wsus | Proprietary (OS role) |
| **Windows Update for Business** (now "Update Client Policies") | Ring/deferral/deadline policy pushed via Intune/GPO; the OS update client pulls on schedule. **Governs OS patching, not your app** — context only. | Microsoft | https://learn.microsoft.com/en-us/intune/intune-service/protect/windows-update-for-business-configure | Incl. with Windows |
| **PDQ Deploy / PDQ Connect** | Auto-deploy and patch third-party apps on a schedule across a fleet (Deploy = on-prem/heartbeat; Connect = cloud agent). | PDQ.com (commercial) | https://www.pdq.com/ | Proprietary (paid) |
| **Patch My PC** | Watches vendor releases and automatically repackages/signs/publishes updated app definitions into **Intune / ConfigMgr / WSUS**, which then deploy them. | Patch My PC (commercial) | https://patchmypc.com/ | Proprietary (paid) |

### GUI update front-ends (not distribution channels)

| Platform | Auto-update mechanism | Maintainer | URL | License |
|---|---|---|---|---|
| **UniGetUI** (formerly WingetUI) | GUI over winget/Scoop/Chocolatey/npm/pip; polls and auto-applies or notifies, with a built-in self-updater. Your app appears automatically if it is in winget/Choco/Scoop. | Devolutions (OSS) | https://github.com/Devolutions/UniGetUI | MIT (OSS) |
| **PortableApps.com Platform** | Launcher for portable `.paf.exe` apps with a built-in (user-initiated) App Updater. Electron portable builds fit well. | Rare Ideas (OSS) | https://portableapps.com/ | OSS |

---

## Comparison at a glance

| Platform | Manual | Automatic | Auto mechanism | For Electron app? |
|---|:---:|:---:|---|---|
| Microsoft Store (MSIX) | ✓ | ✓ | Store client, background | ✓ (needs MSIX pkg) |
| App Installer `.appinstaller` | ✓ | ✓ | manifest `OnLaunch` / interval | ✓ (needs MSIX pkg) |
| ClickOnce | — | ✓ | on-launch check | ✗ (mainly .NET) |
| MSI / Windows Installer | ✓ | via GPO/Intune | admin redeploy | wrapper only |
| NSIS / Inno Setup (`.exe`) | ✓ | — | needs external updater | packaging only |
| winget | ✓ | via WAU/task | scheduled task | distribution |
| Chocolatey | ✓ | ✓ | scheduled task / CCM | distribution |
| Scoop | ✓ | — | (manual by design) | distribution |
| npm global | ✓ | — | none | CLI tools only |
| Ninite (web) | ✓ | — | re-run installer | ✗ (fixed catalog) |
| Microsoft Store (MSIX) — *see above* | ✓ | ✓ | Store client, background | ✓ (needs MSIX pkg) |
| Steam | — | ✓ | background client | ✓ (closed store) |
| Setapp / Stardock ODM | — | ✓ | client agent | ✗ (Setapp = Mac only) |
| **Squirrel.Windows** | — | ✓ | on-launch, deltas | **✓ built-in** |
| **electron-updater** | — | ✓ | background, install-on-quit | **✓ recommended** |
| update.electronjs.org / Hazel / Nuts / Nucleus | — | ✓ | update feed server | ✓ (feed backends) |
| WinSparkle | — | ✓ | appcast (RSS) | native apps |
| Google Omaha | — | ✓ | background service, silent | heavy, generic |
| Ninite Pro | — | ✓ | background agent | ✗ (catalog only) |
| Intune (+EAM) / SCCM / WSUS | — | ✓ | MDM push / ADR / schedule | ✓ (as Win32/MSIX) |
| PDQ / Patch My PC | — | ✓ | scheduled fleet patch | ✓ (as package) |
| UniGetUI / PortableApps | ✓ | ✓ | GUI polling front-end | ✓ (via backends) |

---

## What this means for WeKan

- **WeKan desktop is Electron.** The two realistic Snap-like auto-update paths are:
  1. **electron-updater (electron-builder)** pulling from **GitHub Releases** — the
     simplest, most common choice; background download, install on quit. Feed can be
     self-hosted (Hazel / Nuts / Nucleus) if not using GitHub directly.
  2. **MSIX + Microsoft Store** (or a self-hosted **`.appinstaller`**) — the most
     "Snap-like" store-managed refresh, at the cost of MSIX packaging and (for the
     Store) certification. Remember the `ms-appinstaller:` one-click protocol is
     disabled by default, so web install means "download the file, then run it."
- **For plain distribution** (no forced auto-update), **winget** and **Chocolatey**
  are the community-expected package managers; users update on their own, or admins
  schedule it (Winget-AutoUpdate / a `choco upgrade all` task).
- **For managed fleets**, **Intune / SCCM / PDQ / Patch My PC** push updates centrally.
- **WeKan server on Windows** is normally run via Docker or from source, not as a
  packaged desktop app, so its "updates" are pulling a new image / rebuilding —
  outside these desktop update frameworks.

## See also

- Linux Snap auto-refresh, and why the exotic-arch snap builds differ:
  [Snap-Core.md](../Forks/Snap-Core.md)
- [Install WeKan on Windows](../../../Platforms/Propietary/Windows/Install-Windows.md) · [Windows.md](../../../Platforms/Propietary/Windows/Windows.md)
