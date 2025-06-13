## [FOR SANDSTORM WEKAN DEVELOPERS, CLICK HERE FOR OTHER DOCS](https://github.com/wekan/wekan-maintainer/wiki/Developing-Wekan-for-Sandstorm).

## NOTE: This remaining page below is only for maintainers, and is partially outdated.

***

## 1) Download Wekan Sandstorm VirtualBox image

[https://releases.wekan.team](https://releases.wekan.team)

## 2) Update all packages

```
sudo apt-get update && sudo apt-get -y dist-upgrade
```

## 3) Install kernel that works with building for Sandtorm

[Sandstorm issue about kernel bug](https://github.com/sandstorm-io/sandstorm/issues/2526)

[Kernel packaces list](http://kernel.ubuntu.com/~kernel-ppa/mainline/v4.4.14-xenial/)

```
wget http://kernel.ubuntu.com/~kernel-ppa/mainline/v4.4.14-xenial/linux-headers-4.4.14-040414_4.4.14-040414.201606241434_all.deb 

wget http://kernel.ubuntu.com/~kernel-ppa/mainline/v4.4.14-xenial/linux-headers-4.4.14-040414-generic_4.4.14-040414.201606241434_amd64.deb

wget http://kernel.ubuntu.com/~kernel-ppa/mainline/v4.4.14-xenial/linux-image-4.4.14-040414-generic_4.4.14-040414.201606241434_amd64.deb

sudo dpkg -i linux-headers-4.4.14-040414_4.4.14-040414.201606241434_all.deb \
linux-headers-4.4.14-040414-generic_4.4.14-040414.201606241434_amd64.deb \
linux-image-4.4.14-040414-generic_4.4.14-040414.201606241434_amd64.deb
```

## 4) Install gcc version that works for compiling VirtualBox extensions on kernel 4.4.14

[Info source at VirtualBox forums](https://forums.virtualbox.org/viewtopic.php?f=7&t=76032)

[Info source at AskUbuntu](https://askubuntu.com/questions/428198/getting-installing-gcc-g-4-9-on-ubuntu)

```
sudo add-apt-repository ppa:ubuntu-toolchain-r/test

sudo apt-get update

sudo apt-get install gcc-4.9

sudo update-alternatives --install /usr/bin/gcc gcc /usr/bin/gcc-4.9 20
```

## 5) Install VirtualBox kernel extensions

From Devices / Install Guest Additions CD image...

## 6) Install Sandstorm dev version

[Info source](https://sandstorm.io/install)

Start install:

```
curl https://install.sandstorm.io | bash
```

Use options for development / dev install.

Edit Sandstorm config:
```
sudo nano /opt/sandstorm/sandstorm.conf
```
Uncomment this line this way, so Sandstorm packages are not updated automatically:
```
#UPDATE_CHANNEL=dev
```

## 7) Add Wekan to sandstorm user group textfile /etc/group

```
sudo useradd -G sandstorm wekan
```

## 8) Download meteor-spk packaging tool

[Info source](https://github.com/sandstorm-io/meteor-spk)

```
cd ~/repos
curl https://dl.sandstorm.io/meteor-spk-0.4.0.tar.xz | tar Jxf -
echo "export PATH=$PATH:~/repos/meteor-spk-0.4.0" >> ~/.bashrc
```

## 9) Reboot

```
sudo reboot
```

## 10) Stop Wekan

```
cd ~/repos
./stop.wekan.sh
```

Check did Wekan stop really:

```
ps aux | grep 'node main.js'
```

You may need to kill it:

```
sudo kill -9 PID-NUMBER-HERE
```

(This process should be improved).

## 11) Rebuild Wekan

```
cd ~/repos
./rebuild-wekan.sh
```


## 12) Build development package and install to local Sandstorm

```
cd ~/repos/wekan
meteor-spk dev
```

## 13) After building Wekan, last line of text should be:

```
App in now available from Sandstorm server. Ctrl-C to disconnect.
```

## 14) In terminal, click File / Open Tab to open new shell, and get login URL

```
sudo sandstorm admin-token
```

## 15) Go to login URL with Firefox

## 16) You may need to setup your username etc

## 17) Go to Apps / Wekan. Wekan has grey "dev mode" background. Click Wekan.

## 18) Click + (Dev) Create new board

## 19) Check is everything working in Wekan.

***

# After testing, when really xet7 is making release

## 20) Update Sandstorm release number

```
cd ~/repos/wekan
nano sandstorm-pkgdef.capnp
```

You may need to change these when everything works. AFAIK appVersion 20 is not released yet, as xet7 did increment it to 20. Sandstorm will reject wrong metadata, so it can be checked later.

```
    appVersion = 20,
    # Increment this for every release.

    appMarketingVersion = (defaultText = "0.32.0~2017-07-30"),
    # Human-readable presentation of the app version.
```

## 21) Build .spk package

```
meteor-spk pack wekan-0.32.spk
```

## 22) Publish to experimental Sandstorm App Market

```
spk publish wekan-0.32.spk
```
## 23) And then ocdtrekkie checks it, if it's Ok then he releases for official Sandstorm App Market