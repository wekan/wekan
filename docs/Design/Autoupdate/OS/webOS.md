# Dev: webOS (LG TV) install & update platforms (manual vs automatic, like Snap)

**LG Content Store** is the app store on LG TVs; auto-update is a per-store or system
toggle (Settings → Support/General → Software Update → Auto Update). On webOS 22+
(2022–2026 models) app updates are increasingly bundled with system updates.

| Store/Mechanism | Manual | Automatic | Auto/Internet mechanism | Maintainer | URL | License |
|---|:---:|:---:|---|---|---|---|
| **LG Content Store** | ✓ | ✓ | Background app auto-update via store/system toggle; bundled with OS updates on webOS 22+ | LG | https://www.lg.com/us/lg-content-store | Proprietary |
| **System software update** | ✓ | ✓ | OTA firmware + bundled apps over the Internet | LG | https://webostv.developer.lge.com/ | Proprietary |

## WeKan applicability
Access via the TV **browser web app**; a Content Store web-app listing would be the only
auto-updating route, but WeKan's interaction model suits TV poorly.

## See also
[Tizen.md](Tizen.md) · [TV-OSes.md](TV-OSes.md) · [KaiOS.md](KaiOS.md)
