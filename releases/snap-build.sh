#!/bin/bash

set -euo pipefail

USE_LOCAL_SNAPCRAFT="true"

echo "First run: snapcraft login"
echo "Then run this script"

echo "Using releases/snapcraft-local.yaml (local mirror mode)"

if ! grep -qE '^[[:space:]]*npm install[[:space:]]*$' releases/snapcraft-local.yaml; then
  echo "ERROR: releases/snapcraft-local.yaml is missing standalone 'npm install' step."
  echo "Refusing to continue because Snap may miss server npm modules."
  exit 1
fi

if [[ "$OSTYPE" == "linux-gnu" ]]; then
  echo "Linux - building with LXD"

  # Ensure necessary tools are installed and running
  sudo apt-get -y install snapd
  sudo systemctl enable snapd
  sudo systemctl start snapd
  sudo snap install snapcraft --classic
  sudo snap install lxd
  SNAPCRAFT_FILE_BACKUP=""
  cleanup_snapcraft_file() {
    if [[ -n "$SNAPCRAFT_FILE_BACKUP" && -f "$SNAPCRAFT_FILE_BACKUP" ]]; then
      mv -f "$SNAPCRAFT_FILE_BACKUP" snapcraft.yaml
    fi
  }
  trap cleanup_snapcraft_file EXIT

  # Only override snapcraft.yaml when explicitly requested.
  if [[ "$USE_LOCAL_SNAPCRAFT" == "true" ]]; then
    SNAPCRAFT_FILE_BACKUP="$(mktemp snapcraft.yaml.backup.XXXXXX)"
    cp snapcraft.yaml "$SNAPCRAFT_FILE_BACKUP"
    cp releases/snapcraft-local.yaml snapcraft.yaml
  fi
  
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
