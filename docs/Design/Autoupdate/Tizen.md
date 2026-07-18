# Dev: Tizen install & update platforms (manual vs automatic, like Snap)

**Tizen** (Samsung) apps package as **TPK**. **Important 2026 change:** Samsung ended
Tizen mobile/wearable app service (Sep 30 2025) and shut the **Galaxy Store for Tizen
watch/mobile devices in January 2026**, so official download/auto-update of TPK apps on
Tizen watches is no longer available. Tizen persists mainly in Samsung **smart TVs**,
where the TV app store still auto-updates.

| Store/Mechanism | Manual | Automatic | Auto/Internet mechanism | Maintainer | URL | License |
|---|:---:|:---:|---|---|---|---|
| **Galaxy Store / Tizen Store (TV)** | ✓ | ✓ | TV store background app auto-update | Samsung | https://www.tizen.org/ | Proprietary |
| **Galaxy Store (Tizen watch/mobile)** | — | — | **Discontinued Jan 2026** — no download/auto-update | Samsung | https://developer.tizen.org/ | Proprietary |
| **Sideloaded TPK** | ✓ | — | Manual install via Tizen Studio/SDB; no consumer auto-update | Samsung tooling | https://developer.tizen.org/ | varies |

## WeKan applicability
Only the smart-TV **browser web app**; the Tizen app-store path is effectively dead
(2026 shutdown) and the TV interaction model suits WeKan poorly.

## See also
[webOS.md](webOS.md) · [TV-OSes.md](TV-OSes.md) · [KaiOS.md](KaiOS.md)
