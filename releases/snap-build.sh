#!/bin/bash

echo "First run: snapcraft login"
echo "Then run this script"

if [[ "$OSTYPE" == "linux-gnu" ]]; then
  echo "Linux - building with LXD"

  # Ensure necessary tools are installed and running
  sudo apt-get -y install snapd
  sudo systemctl enable snapd
  sudo systemctl start snapd
  sudo snap install snapcraft --classic
  sudo snap install lxd
  # Use local cached versions of packages
  cp releases/snapcraft-local.yaml snapcraft.yaml
  
  # Initialize LXD if it hasn't been done yet
  sudo lxd init --auto

  echo "=== Cleaning up old remnants and containers ==="
  
  # Run snapcraft clean in the project directory
  snapcraft clean

  # Switch LXC to the snapcraft project to see its containers
  lxc project switch snapcraft 2>/dev/null

  # Find all snapcraft-prefixed containers and force delete them
  echo "Removing old Snapcraft LXD containers..."
  for container in $(lxc list -c n --format csv | grep "snapcraft-"); do
    echo "Deleting container: $container"
    lxc delete --force "$container"
  done

  # Return back to the default project
  lxc project switch default 2>/dev/null

  echo "=== Starting a fresh build ==="
  
  # Force snapcraft to use a clean LXD environment
  snapcraft pack --use-lxd
  git checkout -- snapcraft.yaml
  exit;

elif [[ "$OSTYPE" == "darwin"* ]]; then
  echo "macOS - building with LXD via Multipass"
  # macOS requires a virtualization provider (like Multipass) to run LXD in the background
  brew install snapcraft
  brew install multipass
  
  if ! multipass list | grep -q "ubu.*Running"; then
    multipass launch --name ubu
  fi
  
  snapcraft pack --use-lxd --platform=amd64 --build-for=amd64
  exit;
else
  echo "Unknown OS: $OSTYPE"
  echo "Please install snapcraft and lxd manually."
  exit;
fi
