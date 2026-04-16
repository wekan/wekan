## Install WeKan for OpenSuse amd64

1) Install Snap:

https://snapcraft.io/docs/installing-snap-on-opensuse

2) Install WeKan:

```
sudo snap install wekan --channel=latest/candidate
sudo snap set wekan root-url='http://localhost'
sudo snap set wekan port='80'
```

3) Register at at http://localhost/sign-up

Login at http://localhost/sign-in

More info at https://github.com/wekan/wekan/wiki/Adding-users

4) If you instead would like to access WeKan from other
laptops on your local network, check what is your computer
IP address, and change your IP address here:

```
sudo snap set wekan root-url='http://192.168.0.200'
```

More info at https://github.com/wekan/wekan/wiki/Settings

5) Create app icon for your mobile devices on local WLAN:

https://github.com/wekan/wekan/wiki/PWA

6) Some more info:

- https://github.com/wekan/wekan-snap/wiki/Install
- https://github.com/wekan/wekan/wiki
