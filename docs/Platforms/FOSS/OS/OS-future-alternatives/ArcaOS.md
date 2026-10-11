# Dev: OS/2 → ArcaOS install & update platforms (manual vs automatic)

**ArcaOS** (Arca Noae) is a proprietary OS built on IBM OS/2 Warp 4.52. Software
arrives over the Internet three ways: the netlabs **RPM/YUM** port, classic
**WarpIN** `.wpi` self-installers, and **ANPM** (a native GUI over yum/rpm). A paid
**Support & Maintenance** subscription adds a private YUM repo, but downloading/
applying is always user-initiated.

> **No Snap-style background auto-updater.** The closest is the user-run `yum`.

| Mechanism | Manual | Automatic | Auto/Internet mechanism | Maintainer | URL | License |
|---|:---:|:---:|---|---|---|---|
| **RPM/YUM** (`yum update`) | ✓ | — | User-run yum pulls RPMs from remote repos | netlabs / bitwiseworks | https://trac.netlabs.org/rpm | GPL |
| **WarpIN** (`.wpi`) | ✓ | — | None — download `.wpi` and run | netlabs WarpIN | https://trac.netlabs.org/warpin | GPL (OSS) |
| **ANPM** (Arca Noae Package Manager) | ✓ | — | GUI over yum/rpm; queries remote repos on demand; also handles WarpIN | Arca Noae | https://www.arcanoae.com/wiki/anpm/ | GPLv3 |
| **Support & Maintenance subscription** | ✓ | — | Portal download (not background): reserved YUM repo + Download Center between ISO releases | Arca Noae, LLC | https://www.arcanoae.com/ | Proprietary service |

## WeKan / Electron applicability
Only theoretical — OS/2 has just old/limited Node ports and effectively no Electron, so
a modern WeKan desktop build would not run; at best a very old build might. Browser →
hosted server is the realistic path.

## See also
[ReactOS.md](ReactOS.md) · [FreeDOS.md](FreeDOS.md) · [Windows.md](Windows.md)
