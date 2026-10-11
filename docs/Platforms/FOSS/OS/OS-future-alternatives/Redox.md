# Dev: Redox OS install & update platforms (manual vs automatic)

**Redox OS** is a Unix-like microkernel OS written in Rust. Its running-system package
tool is **`pkg`** (from **pkgutils**), which installs cryptographically verified
**pkgar** binary packages from a Redox package server. **cookbook** holds build recipes
and **redox_installer** builds/writes the system image. `pkg` is user-invoked; there is
**no background auto-updater**.

| Mechanism | Manual | Automatic | Auto/Internet mechanism | Maintainer | URL | License |
|---|:---:|:---:|---|---|---|---|
| **pkg / pkgutils** (`pkg install`/`upgrade`) | ✓ | — | User-run; downloads pkgar binary packages from Redox's remote package server | Redox OS project | https://doc.redox-os.org/book/pkg.html | MIT |
| **cookbook** | ✓ | — | Package build recipes (source) | Redox OS project | https://gitlab.redox-os.org/redox-os/cookbook | MIT |
| **redox_installer** | ✓ | — | Builds/installs a system image from packages | Redox OS project | https://gitlab.redox-os.org/redox-os/installer | MIT |

## WeKan / Electron applicability
**No** — Node.js/Electron are not available on Redox; the WeKan desktop cannot run.

## See also
[Plan9.md](Plan9.md) · [SerenityOS.md](SerenityOS.md) · [Haiku.md](Haiku.md)
