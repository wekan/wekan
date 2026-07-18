# Dev: BSD install & update platforms (manual vs automatic, like Snap)

How software and the base system are installed and updated on the **BSD** family —
**FreeBSD**, **OpenBSD**, **NetBSD**, **DragonFly BSD** — split into **manual** and
**automatic** (background/scheduled, like Linux Snap auto-refresh). WeKan's desktop
app is **Electron**; on BSD the realistic path is the **server** (via packages or the
Linux compat layer) or a browser.

> The BSDs cleanly separate **base system** (kernel + core userland, updated as a
> unit) from **third-party packages/ports**. None ships a Snap-style always-on
> background auto-refresh daemon; automation is done with **cron** + the native
> update tools. OpenBSD deliberately keeps updates manual/administrator-driven.

---

## FreeBSD

| Mechanism | Manual | Automatic | Auto/Internet mechanism | Maintainer | URL | License |
|---|:---:|:---:|---|---|---|---|
| **pkg** (binary packages) | ✓ | via cron | `pkg upgrade` on a cron/periodic job | FreeBSD | https://www.freebsd.org/ | BSD (OSS) |
| **Ports** (source) | ✓ | — | `portsnap`/git + `make` (manual builds) | FreeBSD | https://www.freebsd.org/ports/ | BSD (OSS) |
| **freebsd-update** (base) | ✓ | via cron | binary base updates; `freebsd-update cron` fetches on a timer, admin applies | FreeBSD | https://man.freebsd.org/freebsd-update | BSD (OSS) |

## OpenBSD

| Mechanism | Manual | Automatic | Auto/Internet mechanism | Maintainer | URL | License |
|---|:---:|:---:|---|---|---|---|
| **pkg_add** (packages) | ✓ | — | `pkg_add -u` (manual by design) | OpenBSD | https://www.openbsd.org/faq/faq15.html | BSD (OSS) |
| **syspatch** (base binary patches) | ✓ | via cron | official binary security patches; can be run from cron | OpenBSD | https://man.openbsd.org/syspatch | BSD (OSS) |
| **sysupgrade** (release upgrade) | ✓ | — | one-shot upgrade to next/-current release | OpenBSD | https://man.openbsd.org/sysupgrade | BSD (OSS) |
| **fw_update / pkg_add cron** | ✓ | via cron | firmware + package refresh scripted with cron | OpenBSD | https://man.openbsd.org/fw_update | BSD (OSS) |

## NetBSD

| Mechanism | Manual | Automatic | Auto/Internet mechanism | Maintainer | URL | License |
|---|:---:|:---:|---|---|---|---|
| **pkgin** (binary, over pkgsrc) | ✓ | via cron | `pkgin upgrade` on a cron job | NetBSD / pkgsrc | https://www.netbsd.org/ | BSD (OSS) |
| **pkgsrc** (source, also portable) | ✓ | — | `make` from the pkgsrc tree | The NetBSD Foundation | https://pkgsrc.org/ | BSD (OSS) |
| **sysupgrade / etcupdate + base sets** | ✓ | — | fetch base sets, extract, `etcupdate` | NetBSD | https://www.netbsd.org/docs/guide/en/chap-upgrading.html | BSD (OSS) |

## DragonFly BSD

| Mechanism | Manual | Automatic | Auto/Internet mechanism | Maintainer | URL | License |
|---|:---:|:---:|---|---|---|---|
| **pkg** (binary, DPorts) | ✓ | via cron | `pkg upgrade` on cron | DragonFly | https://www.dragonflybsd.org/ | BSD (OSS) |
| **DPorts** (source) | ✓ | — | source builds | DragonFly | https://www.dragonflybsd.org/docs/howtos/HowToDPorts/ | BSD (OSS) |
| **base upgrade** (`make buildworld`/git) | ✓ | — | rebuild base from source | DragonFly | https://www.dragonflybsd.org/docs/ | BSD (OSS) |

---

## Comparison at a glance

| BSD | Package auto-update | Base auto-update | How automation is done |
|---|:---:|:---:|---|
| FreeBSD | via cron (`pkg upgrade`) | `freebsd-update cron` (fetch) | cron / periodic(8) |
| OpenBSD | via cron (`pkg_add -u`) | `syspatch` via cron | cron; auto-apply discouraged upstream |
| NetBSD | via cron (`pkgin upgrade`) | manual base sets | cron |
| DragonFly | via cron (`pkg upgrade`) | manual (buildworld) | cron |

**No BSD has a Snap-style background auto-refresh daemon.** "Automatic" on BSD means
*you script the native tool with cron/periodic* — the fetch can be automatic, but
applying base updates is typically an explicit admin action (OpenBSD in particular
favors manual control).

---

## What this means for WeKan

- **No Electron desktop auto-update stack exists on BSD** (no Squirrel/Snap/AppImage
  for BSD). A BSD user's realistic path is **WeKan server** — run it from a package /
  from source, or via the **Linux compatibility layer** / a Linux VM / jail — and
  update it with the OS's `pkg`/ports mechanism or by pulling a new build.
- For a desktop client, point a **browser** at a hosted WeKan server.

## See also

- Linux: [Linux.md](Linux.md) · macOS: [Mac.md](Mac.md) · Windows: [Windows.md](Windows.md)
