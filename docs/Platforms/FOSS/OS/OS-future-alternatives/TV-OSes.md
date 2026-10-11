# Dev: TV / streaming OS install & update platforms (Android TV, Fire OS, Roku)

The mainstream TV/streaming OSes are all **store-managed with background auto-update
enabled by default** when idle + on Wi-Fi; users rarely install packages manually. (LG
**webOS** and Samsung **Tizen** TVs have their own pages: [webOS.md](webOS.md),
[Tizen.md](Tizen.md).)

| Store/Mechanism | Manual | Automatic | Auto/Internet mechanism | Maintainer | URL | License |
|---|:---:|:---:|---|---|---|---|
| **Google Play (Android TV / Google TV)** | ✓ | ✓ | Play background auto-update (same engine as phone Play) | Google | https://play.google.com/ | Proprietary |
| **Amazon Appstore (Fire OS)** | ✓ | ✓ | Appstore periodically checks & installs when idle/Wi-Fi/charged | Amazon | https://developer.amazon.com/docs/fire-tv/fire-os-overview.html | Proprietary |
| **Roku OS channel store** | rare | ✓ | Channels + OS update automatically in the background | Roku | https://www.roku.com/ | Proprietary |

## WeKan applicability
**Not a realistic WeKan target** (input-model mismatch); if ever needed, only the
browser/web-app path.

## See also
[webOS.md](webOS.md) · [Tizen.md](Tizen.md) · [Android.md](Android.md)
