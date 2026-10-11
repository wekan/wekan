# Dev: ReactOS install & update platforms (manual vs automatic)

**ReactOS** is an open-source, binary-compatible re-implementation of Windows NT
(0.4.15 + nightlies). Its Internet software channel is **RAPPS**, the "Application
Manager," which syncs a curated app catalog from a ReactOS server and downloads/
installs vetted third-party apps. There is **no automatic OS self-updater** — upgrading
ReactOS means installing a newer build.

| Mechanism | Manual | Automatic | Auto/Internet mechanism | Maintainer | URL | License |
|---|:---:|:---:|---|---|---|---|
| **RAPPS** (Application Manager, `rapps`) | ✓ | partial | Auto-syncs the app-list DB from the ReactOS server on first launch; downloads/installs are user-chosen (HTTP/HTTPS/FTP) | ReactOS Project | https://github.com/reactos/rapps-db | GPL-2.0 |
| **ReactOS OS upgrade** | ✓ | — | None — install a new release/nightly build; no background updater | ReactOS Project | https://reactos.org/ | GPL-2.0 |

## WeKan / Electron applicability
Theoretically possible — being Win32-compatible, ReactOS could in principle run an
**older** Windows Electron build of WeKan, but with real stability caveats; a current
build is unlikely to run cleanly.

## See also
[ArcaOS.md](ArcaOS.md) · [Windows.md](Windows.md) · [Linux.md](Linux.md)
