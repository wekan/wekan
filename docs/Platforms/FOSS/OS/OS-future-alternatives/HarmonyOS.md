# Dev: HarmonyOS install & update platforms (manual vs automatic, like Snap)

**AppGallery** is Huawei's sole first-party store. **HarmonyOS NEXT** ("HarmonyOS 5")
dropped AOSP compatibility, so all apps are native **HAP** packages. Users with
auto-update enabled get phased/staged background rollouts (revised Aug 2025 to a fixed-
percentage 7-day auto-rollout).

| Store/Mechanism | Manual | Automatic | Auto/Internet mechanism | Maintainer | URL | License |
|---|:---:|:---:|---|---|---|---|
| **AppGallery** | ✓ | ✓ | Background auto-update; phased release auto-covers auto-update-enabled users over 7 days | Huawei | https://appgallery.huawei.com/ | Proprietary |
| **Sideloaded HAP/APP** (dev) | ✓ | — | Manual install via DevEco/enterprise MDM; no consumer auto-update | Huawei tooling | https://developer.huawei.com/consumer/en/ | Proprietary |

## WeKan applicability
No practical native path — HarmonyOS NEXT PWA support is limited; use the **in-browser
web app** against a WeKan server.

## See also
[Android.md](Android.md) · [iOS.md](iOS.md)
