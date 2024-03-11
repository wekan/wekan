## TODO

WeKan:
- integration to Friend TODO list https://github.com/FriendUPCloud/friendup/issues/114
- timezone https://github.com/wekan/wekan/wiki/Timezone

Friend Desktop Cloud OS:
- Secure encrypted skinnable fast Open Source desktop in webbrowser/mobile/desktop app
- WeKan as app at Friend

## Chat

Discord link at https://friendos.com/en/developers/

Not in use currently: IRC at Freenode #friendup

## Website

https://friendos.com

## Video

https://www.youtube.com/watch?v=SB4dNC7u2MU

## Roadmap

- It's possible to use Wekan with Friend. At 2019-06-30 Wekan also works at [Raspberry Pi](Raspberry-Pi) like Friend already works, it makes possible local RasPi-only network.
- Then on local network you can use RasPi Cromium or Friend mobile/tablet Android/iOS app to connect to local network Friend desktop, also possible without connection to Internet.
- If using RasPi4 with 4 GB RAM or more, it's possible to run Wekan+Friend+Desktop etc on same RasPi4, servers+client webbrowser.
- Alternative to RasPi is Orange Pi 5 that can have 16 GB RAM http://www.orangepi.org/html/hardWare/computerAndMicrocontrollers/details/Orange-Pi-5-plus.html

## Screenshot

Wekan Friend development version at Friend Desktop. Not released to Friend Store yet.

![Wekan Friend development version screenshot](https://wekan.github.io/wekan-friend-dev.png)

More Screenshots of Wekan and Friend at https://blog.wekan.team/2018/05/upcoming-wekan-v1-00-and-platforms/

## Source code

Friend Server source code at GitHub https://github.com/FriendUPCloud/friendup . Mobile apps are not at GitHub yet.

Friend Apps source code at GitHub https://github.com/FriendUPCloud/friend-applications

Wekan FriendUPApp source code at GitHub https://github.com/wekan/FriendUPApp

Friend repos:

- https://github.com/FriendSoftwareLabs/
- https://github.com/FriendUPCloud/

Docker
- https://github.com/primesoftnz/friendos-docker
- https://github.com/wekan/friendos-docker
- https://github.com/wekan/docker-friendup

AmiBase, mount Friend disk:
- https://github.com/steffest/AmiBase/blob/master/plugins/friend/friend.js
- https://www.stef.be/video/AmiBase_Friend_Filesystem.mp4

Other Web Desktops:
- Puavo, based on Debian, for schools https://github.com/puavo-org
- Win11 React https://github.com/xet7/win11
- Win11 Svelte https://github.com/xet7/win11-svelte


## News about Wekan at Friend

- Friend Software Labs Releases FriendUP v1.2 Release Candidate https://medium.com/friendupcloud/friend-software-labs-releases-friendup-v1-2-release-candidate-637d7bf800d4
- Medium 2018-01-26: With Friend Wekan! https://medium.com/friendupcloud/with-friend-wekan-707af8d04d9f , you can discuss at Hacker News https://news.ycombinator.com/item?id=16240639

## News about Friend

- Video of Friend Desktop walkthrough https://www.youtube.com/watch?v=PX-74ooqino
- Friend Network and Friend Store questions answered https://medium.com/friendupcloud/friend-network-and-friend-store-questions-answered-56fefff5506a
- How Friend Store unifies Blockchain projects https://medium.com/friendupcloud/how-friend-store-unifies-blockchain-projects-d3a889874bec
- Video of Friend Talk at Blockchangers Event - Oslo 2018 https://www.youtube.com/watch?v=7AsSlFenRwQ
- Video of Friend talk at DeveloperWeek 2018 https://medium.com/friendupcloud/video-of-our-talk-at-developerweek-2018-e9b10246a92f
- Friend interview at FLOSS450 https://twit.tv/shows/floss-weekly/episodes/450

***

## Install from Source

TODO: Update install info

### 1. Setup new Ubuntu 16.04 64bit server or VM

Install script currently works only on Ubuntu 16.04 (and similar Xubuntu 16.04 64bit etc).

### 2. Install git and create repos directory

```
sudo apt-get update
sudo apt-get install git
mkdir ~/repos
cd repos
```
### 3. Clone Friend server repo
```
git clone https://github.com/FriendUPCloud/friendup
```
### 4. Clone Friend Apps repos
```
git clone https://github.com/FriendUPCloud/friend-applications
```
### 5. Clone Friend Chat repo
```
git clone https://github.com/FriendSoftwareLabs/friendchat
```
### 6. Clone Wekan App repo
```
git clone https://github.com/wekan/FriendUPApp
```
### 7. Optional: Clone Webmail repo
```
git clone https://github.com/RainLoop/rainloop-webmail
```
### 8. Install Friend to `~/repos/friendup/build` directory
This will install:
- MySQL database, credentials are in install.sh script, can be changed
- Untrusted SSL certificate for Friend with OpenSSL command
```
cd friendup
./install.sh
```
### 9. Add Wekan app
```
cd ~/repos/friendup/build/resources/webclient/apps
ln -s ~/repos/FriendUPApp/Wekan Wekan
```
### 10. Add other apps
```
cd ~/repos/friendup/build/resources/webclient/apps
ln -s ~/repos/FriendUPCloud/friend-applications/Astray Astray
ln -s ~/repos/FriendUPCloud/friend-applications/CNESSatellites CNESSatellites
ln -s ~/repos/FriendUPCloud/friend-applications/CubeSlam CubeSlam
ln -s ~/repos/FriendUPCloud/friend-applications/Doom Doom
ln -s ~/repos/FriendUPCloud/friend-applications/FriendBrowser FriendBrowser
ln -s ~/repos/FriendUPCloud/friend-applications/GameOfBombs GameOfBombs
ln -s ~/repos/FriendUPCloud/friend-applications/GeoGuessr GeoGuessr
ln -s ~/repos/FriendUPCloud/friend-applications/Instagram Instagram
ln -s ~/repos/FriendUPCloud/friend-applications/InternetArchive InternetArchive
ln -s ~/repos/FriendUPCloud/friend-applications/MissileGame MissileGame
ln -s ~/repos/FriendUPCloud/friend-applications/Photopea Photopea
ln -s ~/repos/FriendUPCloud/friend-applications/PolarrPhotoEditor PolarrPhotoEditor
ln -s ~/repos/FriendUPCloud/friend-applications/Swooop Swooop
ln -s ~/repos/FriendUPCloud/friend-applications/TED TED
```
### 11. Optional: Add custom modules
```
cd ~/repos/friendup/build/modules
ln -s ~/repos/mysupermodule mysupermodule
```
### 12. Install [Wekan Snap](https://github.com/wekan/wekan-snap/wiki/Install)
```
sudo apt-get -y install snapd
sudo snap install wekan --channel=latest/candidate
```
### 13. [ROOT_URL settings](Settings) to your server IP address
```
sudo snap set wekan root-url='http://192.168.0.100:5000'
sudo snap set wekan port='5000'
```
### 14. Start Wekan
```
sudo snap start wekan
sudo snap enable wekan
```
### 15. Start Friend
a) To background:
```
cd ~/repos/friendup/build
./nohup_FriendCore.sh
```
b) to foreground, useful when developing:
```
./Phonix_FriendCore.sh
```
or some of the following
```
./Phonix_FriendCoreGDB.sh
./ValgrindGriendCore.sh
```
### 16. Use with webbrowser

Chrome or Chromium works best 32bit/64bit OS and also with Raspberry Pi on ARM.

https://localhost:6502/webclient/index.html

Username: fadmin

Password: securefassword

### 17. Use with mobile app

Play Store: FriendUP by Friend Software Labs

iOS App Store for iPhone/iPad: If not at App Store, ask 

Using Friend Android app to connect to your Friend server URL.

There is also Friend iOS app, but I think it's not yet officially released. If someone is interested, invite to iOS Testflight can be had from [Friend chat](Friend).

# Adding app icons to Friend desktop menus

@CraigL: I found that when I added my web apps to the Dock (by dragging the .jsx file onto it) The app list (on the left side) in the Dock editor showed the full path of the application even after adding a "Display Name" field entry. What I did was to use the Display Name entry for the App list (if available). What I ended up with was:
Orig:
     App List => /Home/apps/Youtube/YouTube.jsx
New:
     App List => YouTube

[My change is here](https://github.com/344Clinton/friendup/commit/6943cc3c05d74adc147950fb2a272d025b50e680). The fix was simple enough. Tracking it down took me a long time :grinning:
