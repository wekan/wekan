## Virtual Appliance by xet7

Requirements: [VirtualBox version 5.2.22 or newer](https://www.virtualbox.org/). Old versions of VirtualBox are not compatible. Both of these have username: wekan , password: wekan , Network Bridged mode so VM has separate IP address so you can also ssh to it.

[Wekan for VirtualBox bug reports and feature requests](https://github.com/wekan/wekan/issues)

a) For general Wekan usage: Only Wekan and building it from source in Ubuntu 14.04 64bit VM. 

Download wekan-VERSION.ova at https://releases.wekan.team

b) For Developers, only this one Wekan-Sandstorm.ova needed for all development: for compiling Wekan, Sandstorm, Wekan for Sandstorm, etc, all. Also has Snap, Docker, Firefox, Chrome, Visual Studio Code with Meteor.js additions, GHex hex editor, etc. Based on Debian 9 64bit. Also see https://github.com/sandstorm-io/sandstorm/issues/3047#issuecomment-369002784 about what dependencies were installed for compiling Sandstorm, although after that dependencies have been changed to [automatically download up-to-date Clang from Chromium project](https://github.com/sandstorm-io/sandstorm/commit/4463c3f52093de8f0c546c93cd55a7bb556aa9d7), so it's easier to compile Sandstorm also on Ubuntu, without using Clang ppa.

Wekan-Sandstorm-VERSION.ova at https://releases.wekan.team

### Build scripts

[Scripts from virtual appliance](https://github.com/wekan/wekan-maintainer/tree/master/virtualbox), can be used on any Ubuntu 14.04 64bit or Debian 9 or newer install like native or VM. Includes script how to run Node.js on port 80.

### Wekan Meteor 1.4 and Node.js v4.x version on Ubuntu 14.04 64bit desktop, Gnome fallback, in VirtualBox

- Ubuntu 14.04 64bit desktop with latest updates.
- Wekan installed from source.
- Includes VirtualBox Guest Additions.

### Download

.ova files can be downloaded at https://releases.wekan.team

VirtualBox .ova file contains harddisk image that has current size of 16 GB and maximum growable size of 500GB.

You can enlarge it with VBoxManage command and then starting with LiveCD iso deleting logical swap and
extended and resizing and creating extended and inside it logical swap.

Size of this VirtualBox image has been reduced: [http://acidx.net/wordpress/2014/03/how-to-reduce-the-size-of-virtualbox-vms/](http://acidx.net/wordpress/2014/03/how-to-reduce-the-size-of-virtualbox-vms/).

Use 7zip (Windows) or p7zip (Linux etc) to unarchive.

### Updating VirtualBox image to have newest Wekan

Download newest VirtualBox scripts:

[https://github.com/wekan/wekan-maintainer/tree/master/virtualbox](https://github.com/wekan/wekan-maintainer/tree/master/virtualbox)

There is script rebuild-wekan-meteor-1.6.sh

First do some sudo command so you get to insert sudo password, for example:
```
sudo ls
```

Then run script as as normal user:
```
./rebuild-wekan-meteor-1.6.sh
```

Run it with option 1 at first to install dependencies, and then option 3 to rebuild source code.

### Updating to newest Ubuntu updates

```
sudo apt-get update
```
( password: wekan )

```
sudo apt-get -y dist-upgrade
```

### Instructions

When using VirtualBox bridged mode, you can browse from other computer to http://ipadress
to use Wekan. Node runs on port 80 and is started from /etc/rc.local on boot.
See also README.txt at Ubuntu desktop, scripts at ~/repos directory, and
/home/wekan/.bash_history how it was installed, including typos :)

To login to the virtual machine with ssh port 22:

username: wekan

password: wekan

### Install VirtualBox

VirtualBox is available for example Windows, Mac, Linux and Solaris from:

* VirtualBox website: [https://virtualbox.org](https://virtualbox.org)

### How to use

a) Import Virtual Appliance .ova

b) Extract .ova to use as .vmdk for virtualization raw .img for Qubes OS:
[https://www.qubes-os.org/doc/hvm/#converting-virtualbox-vm-to-hvm](https://www.qubes-os.org/doc/hvm/#converting-virtualbox-vm-to-hvm)

These settings are for example with VirtualBox:

* new Ubuntu 64bit VM
* 2GB RAM
* Add Wekan.vmdk as harddisk. 
* Not needed usually: Audio, Serial Ports, USB
* Network: If you select Bridged Adapter, name is your network you use, like eth0 / exp9s0 for Ethernet, and there's also wlan etc if available:

![BridgedAdapter.png](https://wekan.github.io/BridgedAdapter.png)

If you select NAT to keep virtual machine using same address as your server:

![NAT.png](https://wekan.github.io/NAT.png)

Then you can also setup port forwarding to Wekan VM port 8080:

![PortForwarding.png](https://wekan.github.io/PortForwarding.png)

2) Start VM

3) To access Wekan on local network, setup ROOT_URL to your IP address at /home/wekan/repos/start-wekan.sh inside VM.

```
cd repos

./stop-wekan.sh

nano start-wekan.sh
```

4) Add have there your IP address, for example:
```
export ROOT_URL=http://192.168.1.200

export MAIL_URL=smtp://user:pass@mailserver.example.com:25/

export MAIL_FROM='Example Wekan Support <support@example.com>'
```

5) Save with Ctrl-o Enter and after that exit with Ctrl-x

6) Allow port 80 and start Wekan:
```
./node-allow-port-80.sh

./start-wekan.sh
```

7) Access Wekan at your network with IP address of VM, for example

More details of settings at:

[https://github.com/wekan/wekan-mongodb/blob/master/docker-compose.yml](https://github.com/wekan/wekan-mongodb/blob/master/docker-compose.yml)

## Virtual Appliance by anselal

You can download a virtual appliance from https://github.com/anselal/wekan/releases

To login to the virtual machine use:

* username: wekan
* password: wekan

You can find more information at https://github.com/anselal/wekan including the script which was used to create the Virtual Appliance.