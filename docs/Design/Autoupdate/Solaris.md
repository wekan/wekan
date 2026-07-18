# Dev: Solaris & illumos install & update platforms (manual vs automatic)

**Oracle Solaris 11** and the **illumos** distributions (OpenIndiana, OmniOS,
SmartOS) share the **Image Packaging System (IPS)**, driven by `pkg`. IPS is
network-native (installs from HTTP(S) publisher repos), folds patching into the same
tool, and uses ZFS **boot environments** so an update clones the running system and
applies changes to the clone — safe rollback by rebooting the old BE.

> **Solaris 11.4 is one of the few enterprise Unixes with a genuine automatic
> Internet updater** (`svc:/system/auto-update` SMF service). illumos distros are
> manual (`pkg update`).

| Mechanism | Manual | Automatic | Auto/Internet mechanism | Maintainer | URL | License |
|---|:---:|:---:|---|---|---|---|
| **Oracle IPS `pkg`** (release/support repos, SRUs, boot environments) | ✓ | **✓** | `svc:/system/auto-update:default` SMF service (11.4 SRU 35+): scheduled, pulls SRUs from `pkg.oracle.com/solaris/support` | Oracle | https://docs.oracle.com/en/operating-systems/solaris/oracle-solaris/11.4/update-sys-add-sw/accessing-support-updates.html | Proprietary OS; IPS engine CDDL |
| **illumos IPS `pkg`** (OpenIndiana Hipster rolling; OmniOS weekly stable) | ✓ | — | None — admin-initiated `pkg update` | OpenIndiana / OmniOS | https://omnios.org/info/ipsrepos · https://www.openindiana.org/packages/ | CDDL / MIT |
| **pkgsrc + `pkgin`** (binary packages) | ✓ | — | None (`pkgin update && pkgin upgrade`) | NetBSD Foundation / pkgsrc | https://pkgin.net/ | BSD |

OmniOS ships non-disruptive weekly `pkg update`s (stable release every 6 months, LTS
every 4th). Legacy `pkgadd`/`pkgrm` still exist but are not the update path.

## WeKan / Electron applicability
**No** — Electron/Chromium has no Solaris/illumos build. Node.js *does* run on
illumos/Solaris (SmartOS is Node-centric), so WeKan's **server** is feasible; the
desktop app is not. Use a browser against a hosted server.

## See also
[Linux.md](Linux.md) · [BSD.md](BSD.md) · [AIX.md](AIX.md) · [Mac.md](Mac.md) · [Windows.md](Windows.md)
