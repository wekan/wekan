# Dev: HP-UX install & update platforms (manual vs automatic)

HP-UX uses **Software Distributor (SD-UX)**: `swinstall` installs from a **depot** (a
directory/server/media of filesets/products/bundles), `swlist` lists software, and
`swremove` uninstalls. OS fixes ship as **patch bundles** and individual patches,
applied with the same tooling. HP-UX 11i v3 is in long-term legacy status.

> **HP-UX has no automatic Internet update mechanism** — depots and patches are
> fetched and applied by an administrator.

| Mechanism | Manual | Automatic | Auto/Internet mechanism | Maintainer | URL | License |
|---|:---:|:---:|---|---|---|---|
| **Software Distributor** (`swinstall`/`swlist`/`swremove`), depots, patch bundles | ✓ | — | **None** — admin downloads depots/patches and runs `swinstall` | HPE | https://en.wikipedia.org/wiki/Software_Distributor | Proprietary |

## WeKan / Electron applicability
**No** — no modern Node.js or Electron/Chromium for HP-UX; neither the desktop client
nor the server realistically runs. A browser against a hosted WeKan server is the only
option.

## See also
[AIX.md](AIX.md) · [Solaris.md](Solaris.md) · [OpenVMS.md](OpenVMS.md) · [Linux.md](Linux.md)
