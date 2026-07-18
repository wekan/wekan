# Dev: Sailfish OS install & update platforms (manual vs automatic, like Snap)

**Sailfish OS** (Jolla) has the first-party **Jolla Store** (harbour) plus community
**OpenRepos** via the **Storeman** client; the underlying package system is RPM with
PackageKit/zypper (zypper is a "last resort" for apps). OS upgrades are versioned OTAs
from Settings. Sailfish OS 5.0 "Tampella" is current (2025).

| Store/Mechanism | Manual | Automatic | Auto/Internet mechanism | Maintainer | URL | License |
|---|:---:|:---:|---|---|---|---|
| **Jolla Store** | ✓ | — (notifies) | Store app checks & installs updates on user action | Jolla | https://jolla.com/ | Proprietary |
| **Storeman** (OpenRepos client) | ✓ | — | Adds OpenRepos RPM repos; installs/updates community apps | community (openrepos.net) | https://openrepos.net/ | OSS |
| **zypper / RPM** | ✓ | — | CLI `zypper`/`pkcon` install/upgrade | openSUSE/Jolla | https://docs.sailfishos.org/ | varies |
| **System OTA upgrade** | ✓ | — | Versioned OS image upgrade from Settings over the Internet | Jolla | https://docs.sailfishos.org/ | Proprietary/varies |

## WeKan applicability
Use the **browser/web app**; no first-party WeKan package (a community Storeman webapp
wrapper is the only native-ish option).

## See also
[Ubuntu-Touch.md](Ubuntu-Touch.md) · [postmarketOS.md](postmarketOS.md) · [Linux.md](Linux.md)
