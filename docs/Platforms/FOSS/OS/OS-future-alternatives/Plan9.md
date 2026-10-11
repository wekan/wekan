# Dev: Plan 9 / 9front install & update platforms (manual vs automatic)

**Plan 9** and its active fork **9front** have no binary package manager — the system
is a source tree you pull and rebuild. Original Plan 9 used **`replica/pull`** with
**fossil/venti** for the archival filesystem; 9front replaced replica with **git9**, so
the `sysupdate` script runs `git/pull` from the 9front repo and you `mk install` from
`/sys/src`. Manual and source-based; **no auto-update**.

| Mechanism | Manual | Automatic | Auto/Internet mechanism | Maintainer | URL | License |
|---|:---:|:---:|---|---|---|---|
| **9front git9 / `sysupdate`** | ✓ | — | `git/pull` from `gits://git.9front.org` over the network, then recompile from source | 9front community | http://9front.org | MIT / LPL |
| **Plan 9 `replica/pull`** | ✓ | — | Network replica of the source tree | Plan 9 Foundation | http://p9f.org | MIT |
| **fossil / venti** | n/a | n/a | Archival filesystem + snapshots (storage, not an update tool) | 9front / Plan 9 | http://9front.org | MIT / LPL |

## WeKan / Electron applicability
**No** — Node.js/Electron are not ported; the WeKan desktop cannot run.

## See also
[Redox.md](Redox.md) · [SerenityOS.md](SerenityOS.md) · [BSD.md](BSD.md)
