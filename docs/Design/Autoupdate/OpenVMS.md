# Dev: OpenVMS install & update platforms (manual vs automatic)

Modern **VSI OpenVMS** (x86-64 / Alpha / Itanium) uses **PCSI (POLYCENTER Software
Installation utility)**: `PRODUCT INSTALL` installs/manages `.PCSI` layered-product
kits, and updates ship as **ECO kits** (patch kits). Legacy products still use
**VMSINSTAL** (installs from savesets). Service updates are downloaded manually as
signed ZIPs from the VMS Software portal, unpacked, and installed with `PRODUCT INSTALL`.

> **OpenVMS has no automatic Internet update** — everything is administrator-initiated.

| Mechanism | Manual | Automatic | Auto/Internet mechanism | Maintainer | URL | License |
|---|:---:|:---:|---|---|---|---|
| **PCSI** (`PRODUCT INSTALL`), ECO/patch kits | ✓ | — | **None** — ECO kits downloaded from the VMS Software portal, installed by hand | VMS Software, Inc. (VSI) | https://docs.vmssoftware.com/vsi-openvms-polycenter-software-installation-utility-manual/ | Proprietary |
| **VMSINSTAL** (legacy savesets) | ✓ | — | None | VSI | https://wiki.vmssoftware.com/VMSINSTAL | Proprietary |

Download/service portal: https://vmssoftware.com (support: https://sp.vmssoftware.com).

## WeKan / Electron applicability
**No** for the desktop — no Electron/Chromium. VSI ships a **Node.js** port, so the
WeKan **server** side is conceivable; the Electron client is not.

## See also
[AIX.md](AIX.md) · [Solaris.md](Solaris.md) · [HP-UX.md](HP-UX.md) · [zOS.md](zOS.md)
