# Dev: SerenityOS install & update platforms (manual vs automatic)

**SerenityOS has no networked package manager and no binary repository or auto-update.**
Third-party software is added only via the **Ports** system — per-app shell scripts that
fetch upstream source, patch it, cross-compile it, and install it into the disk image at
build time. A `pkg` tool has been discussed by the community but is not shipped.

| Mechanism | Manual | Automatic | Auto/Internet mechanism | Maintainer | URL | License |
|---|:---:|:---:|---|---|---|---|
| **Ports system** | ✓ (build from source) | — | None as a manager — each port script downloads that app's upstream source at build time; no binary repo, no updater | SerenityOS community | https://github.com/SerenityOS/serenity | BSD-2-Clause |
| **Networked package manager** | — | — | Does not exist (only discussed) | — | https://serenityos.org/ | — |

## WeKan / Electron applicability
**No** — no Node.js/Electron port; the WeKan desktop cannot run.

## See also
[Redox.md](Redox.md) · [Plan9.md](Plan9.md) · [Haiku.md](Haiku.md)
