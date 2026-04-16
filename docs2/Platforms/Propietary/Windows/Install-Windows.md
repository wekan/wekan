## 1. Get Windows 8/10/11 key, if there is no key sticker

1.1. Get USB stick (USB2 works better than USB3) that is 8 GB or a little bigger (not too big like 128 GB)

1.2. Download Rufus https://rufus.ie (or BalenaEtcher https://etcher.balena.io)

1.3. Download some live distro, for example:

- newest Linux Mint Mate https://linuxmint.com , .iso size about 4 GB
- UPupBB https://sourceforge.net/projects/zestypup/files/ , .iso size about 340 MB
- Puppy Linux https://puppylinux-woof-ce.github.io/ , .iso small download about 400 MB

1.4. With Rufus of BalenaEtcher, write .iso to USB stick

1.5. Boot from USB Linux Mint, usually after power on F8 key is boot menu, or F12

Windows 8 and Windows 10/11 OEM product key from BIOS when using Linux

```
sudo cat /sys/firmware/acpi/tables/MSDM | tail -1
```

##  2. Create bootable Windows Install USB stick

2.1. Download Rufus https://rufus.ie

2.2. Download Windows, big download

https://www.microsoft.com/software-download/windows11

https://www.microsoft.com/fi-fi/software-download/windows10ISO

2.3. If you are installing Windows to VirtualBox, newest VirtualBox has TPM 2.0 and Secure Boot emulation.

Win11 on VirtualBox may have some visual transparency bugs, that updates to VirtualBox
display drivers may fix later. Earlier OS shows correctly.

2.4. If you are installing Windows 11 to computer that does not support Windows 11

Try adding some Windows Registry keys:
https://blogs.oracle.com/virtualization/post/install-microsoft-windows-11-on-virtualbox

2.5. Boot from USB Instal Windows stick, usually after power on F8 key is boot menu, or F12

2.6. If using same license key at dual boot:

- Win11
- Ubuntu host, VirtualBox Win11 Guest

If some activation phone call asks in how many computers you use license at, answer 1.