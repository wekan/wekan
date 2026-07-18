# Dev: macOS install & update platforms (manual vs automatic, like Snap)

A developer reference of **every practical way a macOS application can be installed
and updated**, split by whether updates are **manual** (the user re-downloads and
re-runs an installer / re-drags the `.app`) or **automatic** (background /
self-updating, the way a Linux **Snap** auto-refreshes). The purpose is choosing a
path for **automatic WeKan updates on Mac**. WeKan desktop is **Electron**, so both
app-embedded updaters and store/MDM mechanisms are covered.

> macOS, like Windows, has no single first-party equivalent of Snap's transactional,
> store-driven, delta auto-refresh for arbitrary apps. The closest options are the
> **Mac App Store (MAS)** (store-managed background auto-update, but sandboxed +
> reviewed) and, for self-distribution, the **Sparkle** framework or Electron's
> **Squirrel.Mac**-based `autoUpdater`. Everything else is a package manager, an
> MDM/managed-software stack, or manual drag-install.

---

## a) Manual update platforms

The user (or an admin) explicitly fetches and applies each new version.

| Platform | What it is / update step | Maintainer | Format | URL | License |
|---|---|---|---|---|---|
| **`.dmg` / `.app` drag-install** | Mount the disk image, drag the `.app` to `/Applications`. "Update" = re-download and replace. No update mechanism of its own. | app author | `.dmg`, `.app` | — (Apple docs) | n/a |
| **`.pkg` installer** | Apple's `Installer.app` / `installer(8)` flat package. Update = run a new `.pkg`. Supports pre/post scripts; no self-update. | app author (Apple format) | `.pkg` | https://support.apple.com/guide/deployment/ | n/a |
| **Homebrew + Homebrew Cask** | The de-facto macOS package manager. `brew upgrade` (formulae) / `brew upgrade --cask` (GUI apps). **Manual by default**; automatable (see Homebrew Autoupdate below). | Homebrew (OSS) | formulae, `.app`/`.pkg`/`.dmg` casks | https://brew.sh/ | BSD-2 (OSS) |
| **MacPorts** | Ports-tree package manager. `sudo port selfupdate && sudo port upgrade outdated`. Manual only, no background service. | MacPorts (OSS) | source/binary ports | https://www.macports.org/ | BSD-3 (OSS) |
| **Nix / nix-darwin** | Declarative package/system manager. Update = bump inputs and `darwin-rebuild switch`. Reproducible; manual apply. | NixOS community (OSS) | Nix store | https://github.com/LnL7/nix-darwin | MIT (OSS) |
| **mas-cli** | CLI for the Mac App Store. `mas outdated` / `mas upgrade` — manual trigger of MAS updates from the terminal. | mas-cli (OSS) | MAS apps | https://github.com/mas-cli/mas | MIT (OSS) |
| **npm global** (`npm i -g`) | `npm update -g` — **CLI tools only**, not GUI apps. No auto-update. | npm / GitHub | npm tarball | https://docs.npmjs.com/ | MIT (OSS) |

---

## b) Automatic update platforms (like Snap)

These refresh in the background, on launch, on a schedule, or store-managed —
without the user re-downloading anything.

### Store / OS-managed (closest to Snap)

| Platform | Auto-update mechanism | Maintainer | Format | URL | License |
|---|---|---|---|---|---|
| **Mac App Store (MAS)** | App Store client silently downloads & installs new versions in the background (System Settings → General → Software Update / App Store → *Automatic Updates*). The nearest macOS analogue to Snap's store-driven auto-refresh. Requires **sandboxing**, **notarization**, and **App Review**. | Apple | `.pkg`/`.app` (MAS receipt) | https://www.apple.com/app-store/ | Proprietary |
| **Setapp** | Subscription "app store" with an always-running client that **auto-updates** its catalog apps in the background. macOS (and iOS) — a real Snap-like managed-update experience, but a curated commercial catalog you must be accepted into. | MacPaw | client-managed | https://setapp.com/ | Proprietary (subscription) |

### App-embedded self-updaters (best fit for an Electron app like WeKan desktop)

| Platform | Auto-update mechanism | Maintainer | Format | URL | License |
|---|---|---|---|---|---|
| **Sparkle** | The de-facto standard self-updater for non-MAS macOS apps. App embeds the framework and points at an **appcast** (RSS/XML); Sparkle checks on a schedule/launch, shows release notes, downloads (supports **delta** updates), verifies **EdDSA (Ed25519)** signatures, and installs on quit. | Sparkle project (OSS) | `.dmg`/`.zip`/`.pkg` via appcast | https://sparkle-project.org/ · repo https://github.com/sparkle-project/Sparkle | MIT (OSS) |
| **Squirrel.Mac** | The updater behind Electron's built-in `autoUpdater` on macOS. Reads a JSON feed, downloads a `.zip` in the background, installs on restart. **Requires the app be code-signed** (and notarized). | Squirrel project (OSS) | `.zip` + JSON feed | https://github.com/Squirrel/Squirrel.Mac | MIT (OSS) |
| **Electron `autoUpdater` (built-in)** | Wraps Squirrel.Mac on macOS. Needs an update **server/feed**; background download, install on restart. | OpenJS / Electron | Squirrel feed | https://www.electronjs.org/docs/latest/api/auto-updater | MIT (OSS) |
| **electron-updater (electron-builder)** | The most common Electron auto-updater. On macOS pulls a signed+notarized `.zip` + `latest-mac.yml` from a feed (**GitHub Releases**, generic HTTPS, S3, …), downloads in background, installs on quit. Uses Squirrel.Mac under the hood. | electron-userland (OSS) | `.zip`/`.dmg` + `latest-mac.yml` | https://www.electron.build/ | MIT (OSS) |
| **update.electronjs.org** | Free hosted update server for **open-source** Electron apps published to public **GitHub Releases**; serves the Squirrel.Mac feed. Requires code-signing (mandatory on macOS). | Electron project | Squirrel feed | https://github.com/electron/update.electronjs.org | MIT (OSS) |
| **Hazel / Nuts / Nucleus** | Self-hosted update servers that serve the Squirrel/electron-updater feed (GitHub Releases proxy or static). Cross-platform (Mac + Win). Dated (2018–2021). | Vercel / GitBook / Atlassian (OSS) | Squirrel feed | https://github.com/vercel/hazel | MIT/Apache (OSS) |
| **Google Keystone** | The launchd-based background updater behind Google Chrome on macOS (the Mac analogue of Google Omaha). Silent, always-on. Not distributable/reusable as a library — noted for completeness, **not recommended**. | Google | `.pkg` via Keystone | https://support.google.com/chrome/a/answer/7591084 | Proprietary |

> **macOS gotcha for Electron:** on macOS, `autoUpdater` / Squirrel.Mac **only works
> if the app is Developer-ID code-signed *and* notarized** — an unsigned build cannot
> self-update. Budget for an Apple Developer account ($99/yr), signing, and
> notarization in any auto-update plan.

### Package managers in *automatic* mode

| Platform | Auto-update mechanism | Maintainer | URL | License |
|---|---|---|---|---|
| **Homebrew Autoupdate** | A tap that installs a **launchd** job running `brew update` + `brew upgrade` (incl. `--cask`) on an interval — turns Homebrew into a Snap-like background refresh. | DomT4 (OSS) | https://github.com/DomT4/homebrew-autoupdate | BSD-2 (OSS) |
| **mas + launchd / cron** | Schedule `mas upgrade` to auto-apply Mac App Store updates from a script. | community | https://github.com/mas-cli/mas | MIT (OSS) |

### Managed / MDM (admin-driven automatic deployment & patching)

The macOS analogue of Windows Intune/SCCM/PDQ — the most Snap-like *fleet* auto-update.

| Platform | Auto-update mechanism | Maintainer | URL | License |
|---|---|---|---|---|
| **Munki** | Open-source managed-software system: clients poll a repo (catalogs/manifests) and **auto-install/upgrade** packages in the background. The closest open-source, self-hosted "Snap-like" experience on macOS. | Greg Neagle / community | https://www.munki.org/ · https://github.com/munki/munki | Apache-2.0 (OSS) |
| **AutoPkg** | Automates downloading + packaging the latest version of apps into recipes; feeds Munki/Jamf so downstream auto-update stays current. | AutoPkg community (OSS) | https://github.com/autopkg/autopkg | Apache-2.0 (OSS) |
| **Installomator** | Shell script that finds, downloads and installs the **latest** version of 700+ apps; commonly triggered by an MDM to keep apps patched. | Installomator community (OSS) | https://github.com/Installomator/Installomator | MIT (OSS) |
| **Jamf Pro / Jamf Now** | The market-leading Apple MDM: policies auto-deploy and patch apps across a fleet on a schedule. | Jamf (commercial) | https://www.jamf.com/ | Proprietary (paid) |
| **Kandji** | Apple MDM with "Auto Apps" — a curated catalog that **auto-updates** managed apps in the background. | Kandji (commercial) | https://www.kandji.io/ | Proprietary (paid) |
| **Mosyle** | Apple MDM with automated app deployment/patching (incl. self-service). | Mosyle (commercial) | https://mosyle.com/ | Proprietary (paid) |
| **Addigy** | Cloud Apple MDM with scheduled software/patch policies. | Addigy (commercial) | https://addigy.com/ | Proprietary (paid) |
| **Fleet** | Open-source osquery-based device management; software deployment + updates across macOS fleets. | Fleet (OSS + paid) | https://fleetdm.com/ | MIT core (OSS) + paid |
| **Microsoft Intune (macOS)** | Cloud MDM: assign macOS apps (`.pkg`/`.dmg`/VPP/Store) and push updates to enrolled Macs. | Microsoft | https://learn.microsoft.com/en-us/mem/intune/ | Proprietary (subscription) |
| **`softwareupdate` / DDM** | Apple's built-in CLI (`softwareupdate`) and **Declarative Device Management** for enforcing **OS** updates on a schedule — governs macOS itself, not your app (context). | Apple | https://support.apple.com/guide/deployment/ | Incl. with macOS |

---

## Comparison at a glance

| Platform | Manual | Automatic | Auto mechanism | For Electron app? |
|---|:---:|:---:|---|---|
| `.dmg` / `.app` drag-install | ✓ | — | none | packaging only |
| `.pkg` installer | ✓ | — | none | wrapper only |
| Homebrew + Cask | ✓ | via Autoupdate | launchd `brew upgrade` | distribution (cask) |
| MacPorts | ✓ | — | (manual by design) | distribution |
| Nix / nix-darwin | ✓ | — | declarative apply | distribution |
| mas-cli | ✓ | via launchd | scheduled `mas upgrade` | MAS apps |
| npm global | ✓ | — | none | CLI tools only |
| **Mac App Store** | ✓ | ✓ | Store client, background | ✓ (sandboxed, review) |
| **Setapp** | — | ✓ | client agent, background | ✓ (curated catalog) |
| **Sparkle** | — | ✓ | appcast poll + delta, install on quit | native / non-Electron |
| **Squirrel.Mac** | — | ✓ | JSON feed, bg zip, install on restart | **✓ built-in** |
| **electron-updater** | — | ✓ | `latest-mac.yml` feed, install on quit | **✓ recommended** |
| update.electronjs.org / Hazel / Nuts / Nucleus | — | ✓ | update feed server | ✓ (feed backends) |
| Google Keystone | — | ✓ | launchd background agent | ✗ (not reusable) |
| Homebrew Autoupdate | — | ✓ | launchd schedule | ✓ (if shipped as cask) |
| **Munki** | — | ✓ | client polls repo, bg install | ✓ (as pkg) — Snap-like fleet |
| AutoPkg / Installomator | — | ✓ | recipe/script feeds MDM | ✓ (as pkg) |
| Jamf / Kandji / Mosyle / Addigy / Fleet / Intune | — | ✓ | MDM push / schedule | ✓ (as pkg/VPP) |
| `softwareupdate` / DDM | — | ✓ | OS-update schedule (OS only) | n/a |

---

## What this means for WeKan (Electron on Mac)

- **Recommended self-update path:** **electron-builder + electron-updater** with a
  **code-signed + notarized** `.zip` + `latest-mac.yml` served from a static HTTPS
  feed or **GitHub Releases**. Same tooling as the Windows path, background download,
  install on quit — the closest single-app analogue to Snap auto-refresh. (Signing +
  notarization are mandatory on macOS.)
- **Zero-infrastructure alternative:** **update.electronjs.org + `update-electron-app`**,
  since WeKan is open-source on public GitHub — rides Squirrel.Mac, still needs signing.
- **Store option:** the **Mac App Store** gives store-managed auto-update for free, but
  Electron + MAS is painful (sandbox entitlements, review) and generally not worth it
  for a server-companion desktop app.
- **Broadest passive reach:** ship a **Homebrew Cask**; users `brew upgrade --cask`,
  or opt into **Homebrew Autoupdate** for background refresh.
- **Managed fleets:** **Munki** (open-source, self-hosted, the most Snap-like) or a
  commercial Apple MDM (**Jamf / Kandji / Mosyle / Addigy / Intune**), typically fed by
  **AutoPkg** / **Installomator** to stay current.
- **WeKan server on Mac** is normally run via Docker or from source, so its "updates"
  are pulling a new image / rebuilding — outside these desktop update frameworks.

## See also

- Windows equivalent: [Windows.md](Windows.md)
- Linux Snap auto-refresh & multi-arch snap builds: [Snap-Core.md](../Forks/Snap-Core.md)
- macOS install docs: [Mac.md](../../../Platforms/Propietary/Mac/Mac.md)
