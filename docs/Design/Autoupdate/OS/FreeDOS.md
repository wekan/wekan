# Dev: FreeDOS install & update platforms (manual vs automatic)

**FreeDOS** is an open-source MS-DOS-compatible OS (1.3 series). Its network package
tooling is **FDNPKG** (and the 16-bit **fdnpkg16**), which install/update FreeDOS ZIP
packages from online HTTP/gopher repositories; **fdinst** is a local-only installer and
**fdimples** a curses front-end. Everything is user-run; **no auto-update**.

> FDNPKG's original author ended development at 0.99.7 (2020, code moved to SvarDOS);
> FreeDOS now ships/maintains **fdnpkg16**.

| Mechanism | Manual | Automatic | Auto/Internet mechanism | Maintainer | URL | License |
|---|:---:|:---:|---|---|---|---|
| **FDNPKG / fdnpkg16** | ✓ | — | User-run; fetches ZIP packages from remote http/gopher repos (e.g. ibiblio.org FreeDOS repo) | Mateusz Viste (orig.); FreeDOS (fdnpkg16) | https://fdnpkg.sourceforge.net/ | MIT |
| **fdinst** | ✓ | — | None — local install/remove only, no networking | FreeDOS | http://help.fdos.org/en/hhstndrd/base/fdinst.htm | OSS |

## WeKan / Electron applicability
**No** — FreeDOS is 16-bit real-mode DOS; Node.js/Electron (and thus the WeKan desktop)
cannot run.

## See also
[ArcaOS.md](ArcaOS.md) · [Plan9.md](Plan9.md) · [Redox.md](Redox.md)
