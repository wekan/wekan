# Dev: ChromeOS install & update platforms (manual vs automatic, like Snap)

ChromeOS has two update planes: **the OS itself** auto-updates silently in the
background (staged, A/B image swap, until the device's AUE date), and **apps** update
through their channels — Play Store Android apps, PWAs, and Crostini Linux `apt`. Legacy
Chrome Apps are being phased out (2025–2028) in favor of PWAs.

| Store/Mechanism | Manual | Automatic | Auto/Internet mechanism | Maintainer | URL | License |
|---|:---:|:---:|---|---|---|---|
| **ChromeOS OS auto-update** | (can defer) | ✓ | Silent staged A/B image download+swap over the Internet until Auto Update Expiration (AUE) | Google | https://support.google.com/chromebook/answer/177889 | Proprietary (Chromium OSS core) |
| **Play Store** (Android apps) | ✓ | ✓ | Same as Android Play background updates | Google | https://play.google.com/ | Proprietary |
| **PWAs / web apps** | ✓ (reinstall) | ✓ (content) | Service-worker/live web content refresh; not centrally version-managed | website owner | https://web.dev/progressive-web-apps/ | varies |
| **Linux (Crostini) apt** | ✓ | — | `apt update && apt upgrade` inside the Debian VM | Debian + Google | https://chromeos.dev/en/linux | GPL/varies |

## WeKan applicability
**The cleanest fit of any platform here** — install WeKan directly as a **PWA**; it then
tracks the live server. Electron desktop auto-update does not apply.

## See also
[Android.md](Android.md) · [iOS.md](iOS.md) · [Linux.md](Linux.md)
