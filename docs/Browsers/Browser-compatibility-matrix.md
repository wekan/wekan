If you know updates to this, please add new issue about it. Make changes to this page by cloning wiki:

```
git clone https://github.com/wekan/wekan.wiki
```
There edit Browser-compatibility-matrix.md and attach it with .txt extension or in .zip file to https://github.com/wekan/wekan/wiki/issues

## Webkit based

Browser | [PWA](PWA) | Mobile | Desktop | OS
------- | ----| ------ | ------- | -------
Safari | iOS Yes | iOS Newest | Newest | iOS, macOS
Iris | No | No | Newest | [Iris browser news](https://www.riscosopen.org/forum/forums/1/topics/19545), Download [RISC OS Direct](https://www.riscosdev.com/direct/) for Raspberry Pi etc. [Other versions of RISC OS for many ARM CPU devices](https://www.riscosopen.org/content/downloads) do not have Iris browser yet, but there could be some way to transfer Iris browser files from RISC OS Direct.

## Firefox based

Any telemetry at any Firefox based browser can be additionally most locked down with arkenfox user JS.

Browser | [PWA](PWA) | Mobile | Desktop | OS
------- | ----| ------ | ------- | -------
[Mypal](https://github.com/reactosapps/apps/releases/download/0.01/mypal-27.9.4.win32.installer.exe) | No | No | Newest | For 32bit ReactOS/WinXP/Win7/etc [issue](https://github.com/wekan/wekan/issues/3132)
Firefox | No | Newest | Newest | iOS/Android/Win/Mac/Linux/BSD/RasPi. At iOS uses Safari engine, elsewhere Firefox engine. [Haiku](https://discuss.haiku-os.org/t/progress-on-porting-firefox/13493/143) not tested yet - [HN](https://news.ycombinator.com/item?id=41214762).
[Waterfox](https://www.waterfox.net) | No | No | Yes | Win/Mac/Linux, more private than Firefox, no tracking. [Repo](https://github.com/BrowserWorks/Waterfox)
[Floorp](https://floorp.app) | No | No | Yes | [Win/Mac/Linux](https://github.com/Floorp-Projects/Floorp/releases), more private than Firefox, [Repo](https://github.com/Floorp-Projects/Floorp)
[Mercury](https://thorium.rocks/mercury) | No | No | Yes | [Win/Linux](https://github.com/Alex313031/Mercury/releases), more private than Firefox, [Repo](https://github.com/Alex313031/Mercury)
[SeaLion](https://github.com/wicknix/SeaLion) | No | No | Yes | [MacOS 10.7-14.1 x32,x64,ppc,ppc64/Linux x64](https://github.com/wicknix/SeaLion/releases), [Repo](https://github.com/wicknix/SeaLion)
[LibreWolf](https://librewolf.net) | No | No | Yes | [Win/Mac/Linux](https://librewolf.net/installation/), [Repos](https://codeberg.org/librewolf)
[Zen Browser](https://www.zen-browser.app/) | No | No | Yes | [Win/Mac/Linux](https://www.zen-browser.app/download), [Repos](https://github.com/zen-browser), [Review at YouTube](https://www.youtube.com/watch?v=tKM2N4TQHQY)

## Chromium based

Browser | [PWA](PWA) | Mobile | Desktop | OS
------- | ----| ------ | ------- | -------
Chrome | Android Yes | Android Newest | Newest | Win/Mac/Linux
Chromium | Android Yes | Android Newest | Newest | Win/Mac/Linux/RasPi
Brave | Android Yes | Android Newest | Newest | Win/Mac/Linux/RasPi
Vivaldi | Android Yes | Android Newest | Newest | Win/Mac/Linux
Opera | Android Yes | Android Newest | Newest | Win/Mac/Linux
Credge, Chromium Edge | Android Yes | Android | Newest | Win/Mac/Linux/Mobile
Morph Browser | No | Yes | Yes | [Ubuntu Touch](https://ubports.com) based on Ubuntu 16.04 and 20.04 at all Ubuntu Touch devices, [RasPi3](https://ci.ubports.com/job/rootfs/job/rootfs-rpi/) (not RasPi4 yet). [Repo](https://gitlab.com/ubports/development/core/morph-browser)
[OpenStore App](https://open-store.io/app/wekan.wekanteam) | Yes | Yes | Yes |  [Ubuntu Touch](https://ubports.com) app at [OpenStore](https://open-store.io/app/wekan.wekanteam) using Morph browser with Wekan demo & development server https://boards.wekan.team . App source code for Ubuntu 16.04 at https://github.com/wekan/wekan-openstore and Ubuntu 20.04 at https://github.com/wekan/wekan-openstore2
[Microsoft Store App](https://www.microsoft.com/fi-fi/p/wekan/9p2mrxvd087r#activetab=pivot:overviewtab) | Yes | Yes | Yes | At Microsoft Store of Windows 10/11 desktop, made with [PWABuilder](https://www.pwabuilder.com/). Based on [Wekan PWA](https://boards.wekan.team/b/D2SzJKZDS4Z48yeQH/wekan-open-source-kanban-board-with-mit-license/s7SkzYviC2e963FkT), changed app from EdgeHTML to Credge based with Wekan demo & development server https://boards.wekan.team
[Android Play Store App](https://play.google.com/store/apps/details?id=team.wekan.boards.twa) | Yes | Yes | Yes | Based on [Wekan PWA](https://boards.wekan.team/b/D2SzJKZDS4Z48yeQH/wekan-open-source-kanban-board-with-mit-license/s7SkzYviC2e963FkT), made with [PWABuilder](https://www.pwabuilder.com/), uses Android Chrome browser with Wekan demo & development server https://boards.wekan.team
[Thorium](https://thorium.rocks) | No | Yes | Yes | [Win/Win7/Mac/Linux/Android/RasPi](https://thorium.rocks), speed optimized
[Supermium](https://github.com/win32ss/supermium) | No | No | Yes | 32bit: Windows XP, Windows 2003

## EdgeHTML based

Browser | [PWA](PWA) | Mobile | Desktop | OS
------- | ----| ------ | ------- | -------
Legacy Edge | No | No | Not | Not compatible with newest WeKan. Worked with Wekan v4.19 and before.

## MSHTML based

Browser | [PWA](PWA) | Mobile | Desktop | OS
------- | ----| ------ | ------- | -------
Internet Explorer | No | No | No | No | No

## Servo based, not tested yet

- Verso
  - Apache 2.0 or MIT license
  - Repo: https://github.com/versotile-org/verso
- Servo
  - MPL-2.0 license
  - https://servo.org
  - Repo: https://github.com/servo/servo
  - At https://www.youtube.com/watch?v=g9hzWXxUgiU was said, that Gmail works, so maybe WeKan could also work

## Ladybird based, not yet compatible with WeKan

- BSD-2-Clause license
- Website: https://ladybird.org
- Repo: https://github.com/LadybirdBrowser/ladybird

## Other ways to create Mobile App with Meteor

https://guide.meteor.com/cordova

Benefits:
- Can be faster, more stored at mobile
- Native features integration possibilities

## Desktop app with Meteor

- https://forums.meteor.com/t/desktop-electron-meteor-app-with-todesktop/60904

## Optional Payments

- If there is sometime a need to develop payment feature, that does not exist yet
- https://forums.meteor.com/t/need-help-adding-in-app-purchases-to-a-meteor-app-specifically-adding-subscription-support-for-android-play-store/40510
- https://www.npmjs.com/package/cordova-plugin-purchase
