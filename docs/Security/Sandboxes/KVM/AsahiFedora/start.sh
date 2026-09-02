#!/usr/bin/env bash

set -euo pipefail
export LC_ALL=C

VM_NAME="${VM_NAME:-wekan-asahi-test}"
LIBVIRT_URI="${LIBVIRT_URI:-qemu:///system}"

sudo virsh --connect "$LIBVIRT_URI" dominfo "$VM_NAME" >/dev/null 2>&1 || {
  echo "ERROR: VM does not exist: $VM_NAME" >&2
  exit 1
}

state="$(sudo virsh --connect "$LIBVIRT_URI" domstate "$VM_NAME")"
if [[ "$state" != "running" ]]; then
  sudo virsh --connect "$LIBVIRT_URI" start "$VM_NAME"
fi

if command -v virt-manager >/dev/null 2>&1; then
  virt-manager --connect "$LIBVIRT_URI" --show-domain-console "$VM_NAME" >/dev/null 2>&1 &
fi

echo "$VM_NAME is running."
