# Dev: IBM z/OS install & update platforms (manual vs automatic)

z/OS mainframe maintenance is managed by **SMP/E (System Modification Program/
Extended)** using the classic `RECEIVE` / `APPLY` / `ACCEPT` cycle for PTFs. The
Internet-based automatic-download mechanism is **SMP/E `RECEIVE ORDER`**, which places
a service order with IBM's Automated Delivery server and downloads the package
automatically. Full-system/product delivery comes via **ServerPac**, increasingly as a
**z/OSMF portable software instance** deployed through **z/OSMF Software Management**.

> **`RECEIVE ORDER`** is z/OS's automatic Internet *retrieval* — the order and
> download happen over the Internet without manual media handling; the `APPLY` step
> stays an admin action.

| Mechanism | Manual | Automatic | Auto/Internet mechanism | Maintainer | URL | License |
|---|:---:|:---:|---|---|---|---|
| **SMP/E** `RECEIVE`/`APPLY`/`ACCEPT` (PTFs) | ✓ | partial | Ordering/download via RECEIVE ORDER (below); apply is admin-run | IBM | https://www.ibm.com/docs/en/zos/3.1.0?topic=service-smp-e | Proprietary |
| **SMP/E `RECEIVE ORDER`** (Internet Service Retrieval) | ✓ | **✓ (download)** | SMP/E job orders + downloads PTF/HOLDDATA directly from IBM's Automated Delivery server over the Internet | IBM | https://www.ibm.com/docs/en/zos/3.1.0?topic=sets-what-happens-during-internet-service-retrieval | Proprietary |
| **ServerPac / z/OSMF Software Management** (portable software instance) | ✓ | partial | z/OSMF downloads the order from IBM's server (GIMGTPKG); admin deploys/configures | IBM | https://www.ibm.com/support/z-content-solutions/serverpac-install-zosmf/ | Proprietary |

## WeKan / Electron applicability
**No** for the desktop — no Electron/Chromium on z/OS. IBM ships a **Node.js** port for
z/OS, so a WeKan **server** is conceivable; the Electron client is not.

## See also
[AIX.md](AIX.md) · [Solaris.md](Solaris.md) · [OpenVMS.md](OpenVMS.md) · [Linux.md](Linux.md)
