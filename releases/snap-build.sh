#!/bin/bash

echo "First run: snapcraft login"
echo "Then run this script"

if [[ "$OSTYPE" == "linux-gnu" ]]; then
	echo "Linux"
  sudo apt-get -y install snapd
  sudo systemctl enable snapd
  sudo systemctl start snapd
  sudo snap install snapcraft --classic
  #  sudo snap install multipass
  sudo snap install lxd
  lxd init --auto
  #  multipass delete ubu
  #  multipass purge
  #  multipass launch --name ubu
  #  snapcraft pack
  # Install and initialize LXD (if not already)
  sudo snap install lxd --channel=5.21/stable
  sudo usermod -aG lxd "$USER"
  newgrp lxd
  lxd init --minimal

  # Build with LXD backend and verbose logs
  snapcraft --use-lxd --verbose
  # If you hit a stale state, clean and retry:
  #snapcraft clean
  #snapcraft --use-lxd --verbose
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
