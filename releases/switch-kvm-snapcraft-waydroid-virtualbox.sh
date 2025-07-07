#!/bin/bash

echo "At newest Ubuntu for x86_64, blacklist kvm (intel, amd etc) to get VirtualBox working."
echo "Do not blacklist kvm to get working kvm, snapcraft.io/multipass and waydroid."
echo "Example:"
echo "  sudo nano /etc/modprobe.d/blacklist.conf"
echo "  blacklist kvm_intel"
echo "  blacklist kvm"

read -p "Press enter to edit /etc/modprobe.d/blacklist.conf with nano"

sudo nano /etc/modprobe.d/blacklist.conf
