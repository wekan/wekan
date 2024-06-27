## WARNING: PLEASE do not try on your Chromebook below info.

First, [download all your Google Account data as 4 GB .zip files](https://takeout.google.com/) and burn them to DVD or Blueray disks, where they can not be easily accidentally deleted.

Because this happened:
- Someone else had their Google Drive full.
- That someone else did not backup local data from Chromebook.
- Installing Linux etc did fill up Chromebook harddisk.
- Chromebook got stuck and messed up, and needed to be reinstalled.
- That someone else lost some data.

Below intructions only worked for xet7, because xet7 did have free disk space on Chromebook. There is **NO WARRANTY OF ANY KIND** for any of below info. If your Chomebook breaks, well, thank your backups, and have a nice day!

## Installing Wekan Snap to Chromebook

Installing to Asus Chromebook C223NA-GJ0007 11.6" laptop, that was cheapest available at local shop, did cost 199 euro.

It has:
- 4 GB RAM
- 32 GB eMMC disk
- Intel® Celeron® N3350 CPU
- Bluetooth
- webcam
- WLAN
- USB3
- 2 x USB-C, both work for charging (I have not tried data transfer yet)
- microSD slot
- package includes USB-C charger and USB mouse
- keys for fullscreen, switch apps, brighness, volume, those do not need any modifier keys like other laptops
- playing youtube videos fullscreen works very well
- speakers sound can be set to very loud if needed
- big enough keys, good keyboard layout
- small and lightweight laptop
- has Play Store Android apps and Linux apps that can work fullscreen
- I did not try yet replacing Chrome OS with full Linux https://galliumos.org that has some drivers Chromebook needs, but according to their [hardware compatibility](https://wiki.galliumos.org/Hardware_Compatibility) this model has Known issues: internal audio, suspend/resume, when using galliumos.

## 1) Install Linux Beta

At Chromebook settings, install Linux Beta. It will have Debian 10, that will be changed to Ubuntu 20.10 64bit.

## 2) Install Ubuntu Container

[Source](http://intertwingly.net/blog/2020/07/21/Ubuntu-20-04-on-Chromebook)

Start by entering the Chrome shell (crosh) by pressing CTRL+ALT+T, then enter the default termina VM:
```
vmc start termina
```
Delete the default penguin container that had Debian 10:
```
lxc stop penguin --force
lxc rm penguin
```
Create a new Ubuntu container named penguin:
```
lxc launch ubuntu:20.10 penguin
```
Enter the new container (as root):
```
lxc exec penguin -- bash
```
## 3) Import public keys

While Ubuntu 20.10 will install, various apt commands will fail due to an inability to verify GPG keys. This problem is not unique to Crostini, it is seen in other environments, like Raspberry Pis.

The fix is to import two public keys:
```
apt-key adv --keyserver keyserver.ubuntu.com --recv-keys 7638D0442B90D010
apt-key adv --keyserver keyserver.ubuntu.com --recv-keys 04EE7237B7D453EC
```
## 4) Update groups
```
groups ubuntu >update-groups
sed -i 'y/ /,/; s/ubuntu,:,ubuntu,/sudo usermod -aG /; s/$/ \$USER/' update-groups
killall -u ubuntu
userdel -r ubuntu # ignore warning about mail spool
sed -i '/^ubuntu/d' /etc/sudoers.d/90-cloud-init-users
```
## 5) Install Crostini packages

Prepare for installing Google's Crostini specific packages. First bring Ubuntu up to date:
```
apt update
apt upgrade -y
```
Now add the Crostini package repository to apt. This repository provides the Linux integration with Chrome OS (ignore RLIMIT_CORE warning):
```
echo "deb https://storage.googleapis.com/cros-packages stretch main" > /etc/apt/sources.list.d/cros.list
if [ -f /dev/.cros_milestone ]; then sudo sed -i "s?packages?packages/$(cat /dev/.cros_milestone)?" /etc/apt/sources.list.d/cros.list; fi
apt-key adv --keyserver keyserver.ubuntu.com --recv-keys 1397BC53640DB551
apt update
```
A work-around is needed for a cros-ui-config package installation conflict. First, install binutils to get the ar command:
```
apt install -y binutils
```
Then create the cros-ui-config work-around package:
```
apt download cros-ui-config # ignore any warning messages
ar x cros-ui-config_0.12_all.deb data.tar.gz
gunzip data.tar.gz
tar f data.tar --delete ./etc/gtk-3.0/settings.ini
gzip data.tar
ar r cros-ui-config_0.12_all.deb data.tar.gz
rm -rf data.tar.gz
```
Now install the Crostini packages and the "work-around" package, ignoring any warning messages. This will take awhile:
```
apt install -y cros-guest-tools ./cros-ui-config_0.12_all.deb
```
Delete the "work-around" package:
```
rm cros-ui-config_0.12_all.deb
```
Install the adwaita-icon-theme-full package. Without this package, GUI Linux apps may have a very small cursor:
```
apt install -y adwaita-icon-theme-full
```
Now, shut down the container:
```
shutdown -h now
```
Reboot Chrome OS and start the Terminal application from the launcher. If it fails to start the first time, try again and it should work.

Rebooting is by clicking desktop right bottom clock / Power icon. After Chromebook has shutdown, short press laptop power button to start Chromebook.

### 8) Optional, if you install some Snap GUI apps

These are from same [Source](http://intertwingly.net/blog/2020/07/21/Ubuntu-20-04-on-Chromebook)
but xet7 did not test them.

The fix is to copy the desktop and pixmap files to your .local environment:
```
mkdir -p ~/.local/share/pixmaps
cp /snap/code/current/snap/gui/com.visualstudio.code.png ~/.local/share/pixmaps
cp /snap/code/current/snap/gui/code.desktop ~/.local/share/applications
```
Finally, you will need to change three lines in the code.desktop file in your ~/.local directory.

First, you will need to change Exec=code to specify the full path, namely Exec=/snap/bin/code.

Next, in the two places where Icon= is defined, you will need to replace this with the path to the icon that you copied into your .local directory. In my case, the resulting lines look as follows:

Icon=/home/rubys/.local/share/pixmaps/com.visualstudio.code.png

Once these changes are made, you should be able to launch the application using the Launcher in the lower left hand corder of the screen, by clicking on the circle, entering code into the search box and then clicking on the Visual Studio Code icon. Once launched, the application will appear in the shelf at the bottom of the screen. Right clicking on this icon will give you the option to pin the application to the shelf.

It is still a beta, and the installation instructions (above) are still a bit daunting. More importantly, things that used to work can stop working at any time, like, for example, Ubuntu 18.04.

That being said, it is a full, no-compromise Ubuntu. I've developed and tested code using this setup. I even have installed my full development environment using Puppet.

The only glitch I do see is occasionally GUI applications don't receive keystrokes. This is generally fixed by switching focus to Chromebook application and then back again. Once the application is able to process keystrokes, it remains able to do so.

## 6) Install Wekan

At Ubuntu terminal:
```
sudo snap install wekan
```

#### a) Use Wekan locally

At Ubuntu terminal, type:
```
ip address
```
It shows container internal IP address. You can set it to use Wekan locally, for example:
```
sudo snap set wekan root-url='http://100.115.92.200'
sudo snap set wekan port='80'
```
Then Wekan works locally using Ubuntu webbrowser at http://100.115.92.200 , and you can open cards.

#### b) Use Wekan from other computers at LAN

Look at your Chromebook wifi settings `(i)`, what is your laptop IP address, and use it with below http address:
```
sudo snap set wekan root-url='http://192.168.0.2:2000'
sudo snap set wekan port='2000'
```
At Chromebook settings / Linux Beta / > / Port forwarding, forwart port `2000` with nickname like for example `wekan`. This does forward Chromebook port to inside Ubuntu 20.10 64bit LXC container where Wekan is running.

NOTE: Sometimes reboot stops port forwarding, then it needs to be enabled again at Chromebook settings.

But problem is, using that LAN IP address does not work from Chromebook's own browser like Chrome or Linux Firefox. So looking at that at the next option:

#### c) Use hosts file

At your Chromebook Ubuntu, edit hosts:
```
sudo nano /etc/hosts
```
There add:
```
127.0.0.1 localhost wekan
```
Then with Ubuntu webbrowser you can browse http://wekan:2000 .

At other LAN computer, edit hosts:
```
sudo nano /etc/hosts
```
There add:
```
192.168.0.2 wekan
```
Then you can browse http://wekan:2000 from LAN computers. But mobile phones like Android and iOS can not usually change those settings, and if you don't have a way to setup local network computer names, let's look at next option:

#### d) Use some subdomain

If you have some domain, you can set new record `wekan.example.com A 192.168.0.2` . That is internet wide, but resolves to your local IP address on your local network. Then on your LAN mobile phones you can browse to http://wekan.example.com:2000 .

At Chromebook Ubuntu:
```
sudo nano /etc/hosts
```
There add:
```
127.0.0.1 localhost wekan.example.com
```
So then you can browse to http://wekan.example.com:2000 from Chromebook Ubuntu Firefox, Chromebook Chrome, other LAN computers and mobile phones.

#### Mobile app icon

For iOS and Android, you can [create app PWA icon this way](PWA).

## 7) Optional: Change Linux desktop apps language and install Firefox

Here changing to Finnish:
```
sudo dpkg-reconfigure-locales
```
There add this language, and set is as default:
```
fi_FI.UTF8
```
And install Ubuntu 20.10 version Firefox and translation:
```
sudo apt install firefox firefox-locale-fi
```
Shutdown Ubuntu container:
```
sudo shutdown -h now
```
Reboot Chromebook by clicking desktop right bottom clock / Power icon. After Chromebook has shutdown, short press laptop power button to start Chromebook.

## 8) Optional: Install HP DeskJet 2600 multifunction printer/scanner

This inkjet printer was cheapest available, and does print excellent quality similar to laser color printer.

You should set your wireless network printer to have Static IP address.

[Source](https://chromeunboxed.com/how-to-use-your-hp-printer-with-linux-on-chrome-os/)
```
sudo apt install hplip hplip-gui cups system-config-printer
sudo xhost +
sudo hp-setup
```
Check:
```
[X] Network/Ethernet/Wireless newtork (direct connection or JetDirect)
```
Click:
```
> Show Advanced Options:
```
Check:
```
[X] Manual Discovery
IP Address or network name: [ YOUR-PRINTER-STATIC-IP-HERE, for example 192.168.0.200 ]
JetDirect port: [1]
```
Next, Next, Add Printer.
```
sudo system-config-printer
```
Set printer as Default.

You are also able to Scan images from your multifunction printer with XSane, that was installed with HP printer drivers.

You can print from Ubuntu Linux apps, like for example Firefox, LibreOffice, Inkscape, etc what you can install with apt.

## 9) Optional: Gimp

[Gimp PPA for Ubuntu 20.10 Groovy](https://launchpad.net/~ubuntuhandbook1/+archive/ubuntu/gimp). Note: Other versions of Gimp do not have all  translations or do not create icons, like default Gimp from Ubuntu 20.10 repos and Snap.