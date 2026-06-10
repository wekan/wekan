#!/bin/bash

set -euo pipefail

SNAP_BUILD_LOG="snap-build.log"
exec > >(tee "$SNAP_BUILD_LOG") 2>&1

echo "First run: snapcraft login"
echo "Then run this script"

echo "Using snapcraft.yaml (all artifacts fetched from upstream)"

if ! grep -qE '^[[:space:]]*npm install[[:space:]]*$' snapcraft.yaml; then
  echo "ERROR: snapcraft.yaml is missing standalone 'npm install' step."
  echo "Refusing to continue because Snap may miss server npm modules."
  exit 1
fi

if [[ "$OSTYPE" == "linux-gnu" ]]; then
  echo "Linux - building with LXD"

  check_host_tcp_443() {
    if timeout 8 bash -c 'exec 3<>/dev/tcp/snapcraft.io/443' 2>/dev/null; then
      echo "HOST_TCP_443=OK"
    else
      echo "HOST_TCP_443=FAIL"
    fi
  }

  check_instance_tcp_443() {
    local instance="$1"
    if lxc --project snapcraft exec "local:$instance" -- timeout 8 bash -lc 'exec 3<>/dev/tcp/snapcraft.io/443' >/dev/null 2>&1; then
      echo "INSTANCE_TCP_443=OK"
    else
      echo "INSTANCE_TCP_443=FAIL"
    fi
  }

  show_failure_diagnostics() {
    local instances=""

    echo "=== Build failed: collecting diagnostics ==="

    echo "--- Host network checks ---"
    if getent hosts snapcraft.io; then
      echo "HOST_DNS_SNAPCRAFT_IO=OK"
    else
      echo "HOST_DNS_SNAPCRAFT_IO=FAIL"
    fi
    if getent hosts archive.ubuntu.com; then
      echo "HOST_DNS_ARCHIVE_UBUNTU_COM=OK"
    else
      echo "HOST_DNS_ARCHIVE_UBUNTU_COM=FAIL"
    fi
    check_host_tcp_443

    echo "--- LXD status ---"
    lxc --version || true
    lxc project list || true
    lxc --project snapcraft list || true

    instances="$(lxc --project snapcraft list -c n --format csv 2>/dev/null | grep -E '^(snapcraft-|base-instance-snapcraft-)' || true)"
    if [[ -n "$instances" ]]; then
      echo "--- Per-instance network checks ---"
      while IFS= read -r instance; do
        [[ -z "$instance" ]] && continue
        echo "Instance: $instance"
        if lxc --project snapcraft exec "local:$instance" -- getent hosts snapcraft.io; then
          echo "INSTANCE_DNS_SNAPCRAFT_IO=OK"
        else
          echo "INSTANCE_DNS_SNAPCRAFT_IO=FAIL"
        fi
        if lxc --project snapcraft exec "local:$instance" -- getent hosts archive.ubuntu.com; then
          echo "INSTANCE_DNS_ARCHIVE_UBUNTU_COM=OK"
        else
          echo "INSTANCE_DNS_ARCHIVE_UBUNTU_COM=FAIL"
        fi
        check_instance_tcp_443 "$instance"
        lxc --project snapcraft exec "local:$instance" -- cat /etc/resolv.conf || true
        if lxc --project snapcraft exec "local:$instance" -- apt-get update; then
          echo "INSTANCE_APT_UPDATE=OK"
        else
          echo "INSTANCE_APT_UPDATE=FAIL"
        fi
      done <<< "$instances"
    fi

  }

  # Ensure necessary tools are installed and running
  sudo apt-get -y install snapd
  sudo systemctl enable snapd
  sudo systemctl start snapd
  sudo snap install snapcraft --classic
  sudo snap install lxd

  ensure_lxd_network() {
    local bridge_name="lxdbr0"

    if lxc network show "$bridge_name" >/dev/null 2>&1; then
      lxc network set "$bridge_name" ipv4.address auto
      lxc network set "$bridge_name" ipv4.nat true
      lxc network set "$bridge_name" ipv6.address none
      lxc network set "$bridge_name" ipv6.nat false
      lxc network set "$bridge_name" dns.mode managed
    else
      lxc network create "$bridge_name" \
        ipv4.address=auto \
        ipv4.nat=true \
        ipv6.address=none \
        ipv6.nat=false \
        dns.mode=managed >/dev/null || true
    fi
  }

  # Initialize LXD if it hasn't been done yet
  sudo lxd init --auto
  ensure_lxd_network

  echo "=== Configuring LXD apt mirror (FUNET) for snapcraft project ==="
  lxc project switch snapcraft 2>/dev/null || true
  lxc profile set default user.user-data "#cloud-config
apt:
  primary:
    - arches: [default]
      uri: http://mirrors.nic.funet.fi/ubuntu
  security:
    - arches: [default]
      uri: http://security.ubuntu.com/ubuntu
  conf: |
    Acquire::ForceIPv4 \"true\";
    Acquire::Retries \"5\";
"
  lxc profile get default user.user-data | grep -E "mirrors.nic.funet.fi/ubuntu|security.ubuntu.com/ubuntu" || true
  lxc project switch default 2>/dev/null || true

  echo "=== Cleaning up old remnants and containers ==="
  
  # Run snapcraft clean in the project directory
  snapcraft clean

  # Switch LXC to the snapcraft project to see its containers
  lxc project switch snapcraft 2>/dev/null

  # Find all snapcraft-prefixed containers and force delete them
  echo "Removing old Snapcraft LXD containers..."
  while IFS= read -r container; do
    [[ -z "$container" ]] && continue
    echo "Deleting container: $container"
    lxc delete --force "$container"
  done < <(lxc list -c n --format csv | grep "snapcraft-" || true)

  # Return back to the default project
  lxc project switch default 2>/dev/null

  echo "=== Starting a fresh build ==="
  echo "Log for this run: $SNAP_BUILD_LOG"
  
  # Force snapcraft to use a clean LXD environment
  if ! snapcraft --verbosity debug pack --use-lxd; then
    show_failure_diagnostics
    exit 1
  fi
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
