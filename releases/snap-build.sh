#!/bin/bash

echo "First run: snapcraft login"
echo "Then run this script"

if [[ "$OSTYPE" == "linux-gnu" ]]; then
	echo "Linux"
  #
  # a) For VirtualBox, 
  # at /etc/modprobe.d/blacklist.conf blacklist these: (or kvm_amd)
  #   blacklist kvm_intel
  #   blacklist kvm
  #
  # b) For kvm, snapcraft.io/multipass and waydroid,
  # at /etc/modprobe.d/blacklist.conf do not blacklist these:
  # # blacklist kvm_intel
  # # blacklist kvm
  #
  # If firewall is enabled, building snap does not work
  sudo ufw disable
  sudo apt-get -y install snapd
  sudo systemctl enable snapd
  sudo systemctl start snapd
  sudo snap install snapcraft --classic
  sudo snap install multipass
  sudo snap install lxd
  lxd init --auto
  multipass delete ubu
  multipass purge
  multipass launch --name ubu
  snapcraft pack
  sudo ufw enable
  exit;
elif [[ "$OSTYPE" == "darwin"* ]]; then
  echo "macOS"
  brew install snapcraft
  brew install multipass
  # Launch multipass VM if needed
  if ! multipass list | grep -q "ubu.*Running"; then
    multipass launch --name ubu
  fi
  # Build with platform specified for macOS
  snapcraft pack --use-lxd --platform=amd64 --build-for=amd64
  exit;
else
  echo "Unknown OS: $OSTYPE"
  echo "Please install snapcraft and multipass manually."
  exit;
fi
