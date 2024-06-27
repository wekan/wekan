https://blog.wekan.team/2019/06/wekan-on-raspi3-and-arm64-server-now-works-and-whats-next-with-cncf/

https://github.com/cncf/cluster/issues/45

CNCF Packet is now part of Equinix Metal.

## Equinix Metal Console

https://console.equinix.com

## Ubuntu Reboot Fix

https://gist.github.com/vielmetti/dafb5128ef7535c218f6d963c5bc624e

```
sudo apt-get update

sudo apt-get install grub2-common

sudo grub-install --bootloader-id=ubuntu
```

Failure to reboot

If an affected system is rebooted, it might not come back online. Instead, the [serial over SSH](https://metal.equinix.com/developers/docs/resilience-recovery/serial-over-ssh/) or SOS console will show the system at the GRUB prompt.

To recover from this condition, log in to the SOS console, which will connect you to GRUB. Then issue the following command:
```
grub> configfile ($root)/EFI/GRUB/grub.cfg
```
The device will load the correct boot sequence and return to service.

## SSH SOS fix

https://osxdaily.com/2022/12/22/fix-ssh-not-working-macos-rsa-issue/

How to Fix SSH Not Working with RSA Signatures on MacOS Ventura

We’re going to modify the ssh_config file to allow for RSA host key again, here’s how to do this.

Open the Terminal (via Spotlight or through the Utilities folder) and enter the following command string:
```
sudo nano /etc/ssh/ssh_config
```
You’ll need to authenticate with the admin password.

Scroll all the way to the bottom of the ssh_config file and then add the following lines to the bottom of ssh_config:
```
HostkeyAlgorithms +ssh-rsa
PubkeyAcceptedAlgorithms +ssh-rsa
```
Hit Control+O to save, and Control+X to exit.
