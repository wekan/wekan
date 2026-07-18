# Dev: IBM AIX install & update platforms (manual vs automatic)

AIX OS updates ship as **filesets** installed with `installp` (usually via the
`smit`/`smitty` menus). **NIM (Network Installation Management)** pushes installs/
updates from a master to clients. Open-source software comes as RPMs from the **AIX
Toolbox**, managed with **`dnf`** (modern replacement for `yum`). The Internet-update
tool is **SUMA**, which downloads fixes on a schedule from IBM.

> **SUMA (Service Update Management Assistant)** is AIX's automatic Internet
> *downloader* — cron-driven — but *applying* the fixes stays a separate admin/NIM step.

| Mechanism | Manual | Automatic | Auto/Internet mechanism | Maintainer | URL | License |
|---|:---:|:---:|---|---|---|---|
| **`installp` + `smit`/`smitty`** (filesets) | ✓ | — | None | IBM | https://www.ibm.com/docs/en/aix | Proprietary |
| **NIM** (Network Installation Management) | ✓ | partial | Push installs/updates from NIM master (LAN, not Internet auto-refresh) | IBM | https://www.ibm.com/docs/en/aix/7.2.0?topic=management-managing-nim | Proprietary |
| **`dnf`/`yum`** (AIX Toolbox RPMs) | ✓ | — | Pulls from Toolbox repos on demand; no auto-refresh daemon | IBM (pkgs) / OSS (dnf) | https://www.ibm.com/support/pages/aix-toolbox-open-source-software-overview | GPL/OSS |
| **SUMA** (Service Update Management Assistant) | ✓ | **✓ (download)** | Scheduled task downloads TL/SP/security fixes over the Internet from `esupport.ibm.com`; cron-driven, e-mail notify | IBM | https://www.ibm.com/docs/en/aix/7.3.0?topic=suma-service-update-management-assistant | Proprietary |

## WeKan / Electron applicability
**No** for the desktop — no Electron/Chromium on AIX. Node.js has an official **AIX**
port, so the WeKan **server** side is feasible; the Electron client is not.

## See also
[Solaris.md](Solaris.md) · [HP-UX.md](HP-UX.md) · [OpenVMS.md](OpenVMS.md) · [zOS.md](zOS.md) · [Linux.md](Linux.md)
