# Dev: iOS / iPadOS install & update platforms (manual vs automatic, like Snap)

The **App Store** is the universal path with system-wide background auto-update;
**TestFlight** covers betas; **MDM** silently pushes managed apps; and since the EU DMA,
notarized **alternative marketplaces / web distribution** exist (EU only). "Add to Home
Screen" web apps never auto-update as installables — they reload the live site.

| Store/Mechanism | Manual | Automatic | Auto/Internet mechanism | Maintainer | URL | License |
|---|:---:|:---:|---|---|---|---|
| **App Store** | ✓ | ✓ (default) | Settings → App Store → App Updates; background download+install | Apple | https://www.apple.com/app-store/ | Proprietary |
| **TestFlight** (beta) | ✓ | ✓ | Automatic beta-build updates over the Internet | Apple | https://testflight.apple.com/ | Proprietary |
| **MDM-managed apps** (ABM/VPP) | — | ✓ | MDM silently installs/updates managed apps | Apple + MDM vendors | https://developer.apple.com/business/ | Proprietary |
| **EU alternative marketplaces / web distribution** | ✓ | ✓ | DMA-mandated third-party stores manage updates; apps still Apple-notarized (EU only) | Apple-authorized third parties | https://developer.apple.com/support/dma-and-apps-in-the-eu/ | Proprietary/varies |
| **Web app "Add to Home Screen"** (PWA) | ✓ (re-add) | — | Loads live web content each launch; no packaged update | website owner | https://developer.apple.com/ | varies |

## WeKan applicability
**Add to Home Screen PWA** against a WeKan server is the realistic path (no store
auto-update). A wrapped native app could use App Store background updates, but the web
app is the pragmatic route. Electron desktop auto-update does not apply.

## See also
[Android.md](Android.md) · [ChromeOS.md](ChromeOS.md) · [Mac.md](Mac.md)
