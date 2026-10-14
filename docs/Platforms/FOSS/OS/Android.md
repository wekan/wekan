### Running Wekan server at Android

Requirements:
- arm64 or x64 Android with at least 3 GB RAM. Tested with with arm64 OnePlus 3 that has 6 GB RAM.
- It is not necessary to root Android.

## 1) Install AnLinux and Termux from Play Store

At AnLinux choose:
- Ubuntu
- XFCE4
- Copy those commands to Termux to install Linux.

## 2) At Termux

When you get from Termux to Ubuntu bash, you can install Wekan similarly like arm64 or x64:
[Raspberry Pi](../HW/RaspberryPi/Raspberry-Pi.md)

Edit start-wekan.sh so you can start Wekan for example:
```
ROOT_URL=http://localhost:2000
PORT=2000
```
At Android webbrowser like Chrome and Firefox browse to http://localhost:2000

## 3) WLAN

If you connect to WLAN, you can get your IP address with command:
```
ip address
```
Edit start-wekan.sh so you can start Wekan for example:
```
ROOT_URL=http://IP-ADDRESS:2000
PORT=2000
```
Then you can use any computer or mobile phone Javascript capable webbrowser at WLAN to use Wekan at http://IP-ADDRESS:2000 like http://192.168.0.100:2000 . [More info about ROOT_URL](../../Webserver/Settings.md).

## 4) Optional: Mobile Linux Desktop

Requirements:
- 1 WLAN, for example: mobile hotspot, Android device sharing WLAN, hotel WLAN, office WLAN
- ChromeCast that is connected to HDMI Input of hotel/office/home TV and WLAN
- Bluetooth keyboard
- Bluetooth mouse
- 1 Android device that has:
  - Wekan installed according to steps 1-3 above
  - Android VNC client to local AnLinux Ubuntu desktop
  - Firefox installed with apt-get to that Ubuntu desktop, browsing Wekan at http://IP-ADDRESS:2000
  - Using ChromeCast to show Android full screen at TV

This way, you have:
- Big TV display
- Full size keyboard and mouse
- Full featured Firefox at Ubuntu Desktop using Wekan
## WeKan bundles for Termux

Every release that has wekan/node-patches' Android Node.js also has, for each
Android CPU, `wekan-<version>-android-arm64.zip`, `-android-x64.zip`,
`-android-armv7.zip` and `-android-x86.zip`: the ordinary bundle, with
FerretDB, rebuilt for Termux. In Termux:

```
pkg install libvips unzip
unzip wekan-<version>-android-arm64.zip
cd bundle
./start-wekan.sh
```

`libvips` is what sharp uses for thumbnails; Node.js itself carries its C++
library and needs only Android's own libc.

How it is made (`.github/workflows/android.yml`,
`releases/android/build-bundle.sh`): the release's Linux bundle of that CPU is
rebuilt inside Termux's own image - Android's libc and Android clang, the ARM
ones on ARM runners - with `node-android-<cpu>` from wekan/node-patches,
checked against its SHA256. npm reinstalls the server's packages run by that
Node.js, so every native addon is built for it, and sharp from source against
Termux's libvips. Each addon's architecture is checked, sharp must load, and
the bundle must start and answer HTTP 200 before it is published. FerretDB
and the MongoDB Database Tools are static Go programs and run as they are. A
CPU whose Android Node.js is not published yet is skipped, and builds by
itself the release it appears. `tests/androidBundles.test.cjs` covers the
build and the workflow.
