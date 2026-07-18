# Dev: postmarketOS install & update platforms (manual vs automatic, like Snap)

**postmarketOS** is a true rolling **Alpine Linux** system: apps and OS are the same
**apk** package stream (no separate app store). Updates are user-run CLI (`apk upgrade`)
or via a desktop software center. As of v25.12 it uses **apk v3** (downloads all
packages before installing, so a flaky connection can't break the system).

| Store/Mechanism | Manual | Automatic | Auto/Internet mechanism | Maintainer | URL | License |
|---|:---:|:---:|---|---|---|---|
| **Alpine `apk`** (apk-tools v3) | ✓ | — (user/cron) | `apk upgrade` fetches from Alpine/pmOS repos; download-then-install | postmarketOS / Alpine | https://postmarketos.org/ | GPL-2.0 |
| **Software center** (GNOME Software / Discover) | ✓ | notifies | GUI front-end over apk repos | desktop projects | https://wiki.alpinelinux.org/wiki/Alpine_Package_Keeper | GPL/varies |

## WeKan applicability
It's mainline Linux — run WeKan in the browser as a **PWA**, or self-host the server;
apps update via `apk` (not the WeKan client). See [Linux.md](Linux.md).

## See also
[Ubuntu-Touch.md](Ubuntu-Touch.md) · [Sailfish.md](Sailfish.md) · [Linux.md](Linux.md)
