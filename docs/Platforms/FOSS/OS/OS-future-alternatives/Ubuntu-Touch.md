# Dev: Ubuntu Touch install & update platforms (manual vs automatic, like Snap)

**Ubuntu Touch** (UBports) has two independent planes: **OpenStore** distributes
confined **click** app packages, while the OS is updated as a **whole system image** via
delta OTAs (image-based, not apt/dpkg for apps). App updates are user-triggered in
OpenStore; OS OTAs are prompted, not silent.

| Store/Mechanism | Manual | Automatic | Auto/Internet mechanism | Maintainer | URL | License |
|---|:---:|:---:|---|---|---|---|
| **OpenStore** | ✓ | — (notifies) | Client checks repo; user taps to update click packages | UBports | https://open-store.io/ | AGPL-3.0 (store) |
| **click packages** | ✓ | — | Confined app bundles installed via OpenStore | UBports | https://docs.ubports.com/ | varies |
| **System-image OTA** | ✓ (prompted) | semi (checks/notifies) | Delta between current and target image downloaded over the Internet; channel-based | UBports | https://ubports.com/ | GPL/varies |

## WeKan applicability
A **click-packaged web wrapper** (webapp-container) in OpenStore, updated manually via
OpenStore — or just the browser web app against a WeKan server.

## See also
[Sailfish.md](Sailfish.md) · [postmarketOS.md](postmarketOS.md) · [Linux.md](Linux.md)
