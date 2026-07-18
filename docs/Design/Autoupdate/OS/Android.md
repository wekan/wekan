# Dev: Android install & update platforms (manual vs automatic, like Snap)

Android is the most pluralistic mobile OS: the default path is **Google Play**
background auto-update, but privileged alternative stores (**F-Droid**, **Aurora**) can
now auto-update too, and enterprise fleets use **Managed Google Play** push-installs.
**Google Play System Updates** (Project Mainline) patch OS modules without a full OTA.

| Store/Mechanism | Manual | Automatic | Auto/Internet mechanism | Maintainer | URL | License |
|---|:---:|:---:|---|---|---|---|
| **Google Play Store** | ✓ | ✓ (default) | Background updates over Wi-Fi/any-network when idle+charging; global + per-app toggles | Google | https://support.google.com/googleplay/answer/113412 | Proprietary |
| **F-Droid + Privileged Extension** | ✓ | ✓ | Client polls repo index; Privileged Extension (or GrapheneOS/Calyx integration) installs updates silently (since 2025) | F-Droid | https://f-droid.org/packages/org.fdroid.fdroid.privileged/ | GPL/AGPL |
| **Aurora Store** | ✓ | ✓ | Anonymous/Google-account Play proxy; unattended updates via Android 12+ update-owner API | Aurora OSS | https://gitlab.com/AuroraOSS/AuroraStore | GPL-3.0 |
| **Sideloaded APK** | ✓ | — | User downloads `.apk`; no update channel | any source | https://developer.android.com/ | varies |
| **Play System Updates** (Mainline) | — | ✓ | APK/APEX modules delivered over Play infrastructure, no full OTA | Google/AOSP | https://source.android.com/docs/core/ota/modular-system | Apache-2.0 |
| **Managed Google Play / MDM** | — | ✓ | `autoInstallPolicy` / forced-install pushes and silently updates apps via EMM (Intune, Jamf…) | Google + EMM | https://support.google.com/work/android/answer/6137769 | Proprietary |

## WeKan applicability
WeKan is a **web/Meteor app** — native Electron desktop auto-update does not apply.
Ship WeKan as a **PWA** (installable via Chrome) or wrap it (**Bubblewrap/TWA**) for
Play/F-Droid/Aurora; the wrapper then rides normal store auto-update.

## See also
[iOS.md](iOS.md) · [ChromeOS.md](ChromeOS.md) · [Linux.md](Linux.md)
