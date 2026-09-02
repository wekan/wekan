#!/usr/bin/env bash

set -euo pipefail
export LC_ALL=C

VM_NAME="${VM_NAME:-wekan-asahi-test}"
LIBVIRT_URI="${LIBVIRT_URI:-qemu:///system}"
STOP_TIMEOUT_SECONDS="${STOP_TIMEOUT_SECONDS:-120}"

sudo virsh --connect "$LIBVIRT_URI" dominfo "$VM_NAME" >/dev/null 2>&1 || {
  echo "ERROR: VM does not exist: $VM_NAME" >&2
  exit 1
}

state="$(sudo virsh --connect "$LIBVIRT_URI" domstate "$VM_NAME")"
if [[ "$state" == "shut off" ]]; then
  echo "$VM_NAME is already stopped."
  exit 0
fi

sudo virsh --connect "$LIBVIRT_URI" shutdown "$VM_NAME"

for ((elapsed = 0; elapsed < STOP_TIMEOUT_SECONDS; elapsed++)); do
  state="$(sudo virsh --connect "$LIBVIRT_URI" domstate "$VM_NAME")"
  if [[ "$state" == "shut off" ]]; then
    echo "$VM_NAME stopped cleanly."
    exit 0
  fi
  sleep 1
done

cat >&2 <<EOF
ERROR: $VM_NAME did not stop within $STOP_TIMEOUT_SECONDS seconds.
Inspect the guest with virt-manager. This script will not force power it off.
EOF
exit 1
