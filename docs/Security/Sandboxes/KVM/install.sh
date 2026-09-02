#!/usr/bin/env bash

set -euo pipefail
export LC_ALL=C

VM_NAME="${VM_NAME:-wekan-asahi-test}"
VM_CPUS="${VM_CPUS:-6}"
VM_MEMORY_MIB="${VM_MEMORY_MIB:-12288}"
VM_DISK_GIB="${VM_DISK_GIB:-100}"
LIBVIRT_URI="${LIBVIRT_URI:-qemu:///system}"
DISK_PATH="${VM_DISK_PATH:-/var/lib/libvirt/images/${VM_NAME}.qcow2}"
INSTALL_ISO_PATH="/var/lib/libvirt/images/${VM_NAME}-install.iso"
ISO_PATH="${1:-}"

fail() {
  printf 'ERROR: %s\n' "$*" >&2
  exit 1
}

[[ "$(uname -m)" == "aarch64" ]] || fail "this installer requires an ARM64 host"
[[ -r /dev/kvm ]] || fail "/dev/kvm is unavailable; enable KVM before creating the VM"
[[ -n "$ISO_PATH" ]] || fail "usage: $0 /path/to/Fedora-aarch64.iso"
[[ -f "$ISO_PATH" ]] || fail "ISO not found: $ISO_PATH"
ISO_PATH="$(readlink -f "$ISO_PATH")"

[[ "$VM_CPUS" =~ ^[1-9][0-9]*$ ]] || fail "VM_CPUS must be a positive integer"
[[ "$VM_MEMORY_MIB" =~ ^[1-9][0-9]*$ ]] || fail "VM_MEMORY_MIB must be a positive integer"
[[ "$VM_DISK_GIB" =~ ^[1-9][0-9]*$ ]] || fail "VM_DISK_GIB must be a positive integer"

echo "Installing Fedora virtualization packages on the host."
sudo dnf install -y \
  @virtualization \
  edk2-aarch64 \
  libvirt-client \
  libvirt-daemon-kvm \
  virt-install \
  virt-manager

if ! sudo systemctl enable --now libvirtd.service 2>/dev/null; then
  sudo systemctl enable --now virtqemud.socket virtnetworkd.socket
fi

sudo virsh --connect "$LIBVIRT_URI" dominfo "$VM_NAME" >/dev/null 2>&1 && \
  fail "VM already exists: $VM_NAME"
[[ ! -e "$DISK_PATH" ]] || fail "disk already exists: $DISK_PATH"
[[ ! -e "$INSTALL_ISO_PATH" ]] || fail "staged installation ISO already exists: $INSTALL_ISO_PATH"

if ! sudo virsh --connect "$LIBVIRT_URI" net-info default >/dev/null 2>&1; then
  NETWORK_XML="$(mktemp)"
  trap 'rm -f "$NETWORK_XML"' EXIT
  cat >"$NETWORK_XML" <<'EOF'
<network>
  <name>default</name>
  <forward mode='nat'/>
  <bridge name='virbr0' stp='on' delay='0'/>
  <ip address='192.168.122.1' netmask='255.255.255.0'>
    <dhcp>
      <range start='192.168.122.2' end='192.168.122.254'/>
    </dhcp>
  </ip>
</network>
EOF
  sudo virsh --connect "$LIBVIRT_URI" net-define "$NETWORK_XML"
fi
sudo virsh --connect "$LIBVIRT_URI" net-autostart default
sudo virsh --connect "$LIBVIRT_URI" net-start default 2>/dev/null || true

# A system-libvirt QEMU process cannot normally traverse a user's home directory,
# and SELinux also expects VM images below libvirt's image directory. Stage the ISO
# there rather than weakening either boundary.
sudo install -o qemu -g qemu -m 0644 "$ISO_PATH" "$INSTALL_ISO_PATH"
sudo restorecon "$INSTALL_ISO_PATH" 2>/dev/null || true

cat <<EOF
Creating $VM_NAME:
  $VM_CPUS vCPUs
  $VM_MEMORY_MIB MiB RAM
  $VM_DISK_GIB GiB disk at $DISK_PATH
  installation media $ISO_PATH (staged for libvirt)

The graphical installer will open in virt-manager. Complete Fedora installation
there. The VM will power off instead of rebooting when installation finishes.
EOF

sudo virt-install \
  --connect "$LIBVIRT_URI" \
  --name "$VM_NAME" \
  --virt-type kvm \
  --arch aarch64 \
  --machine virt \
  --cpu host-passthrough \
  --vcpus "$VM_CPUS" \
  --memory "$VM_MEMORY_MIB" \
  --boot uefi \
  --disk "path=$DISK_PATH,size=$VM_DISK_GIB,format=qcow2,bus=virtio,cache=none,discard=unmap" \
  --network network=default,model=virtio \
  --graphics spice,listen=none \
  --video virtio \
  --rng /dev/urandom \
  --cdrom "$INSTALL_ISO_PATH" \
  --noautoconsole \
  --wait=-1 \
  --noreboot

# The guest is off because of --noreboot. Detach and remove the staged ISO so
# future starts boot only from its own disk and do not retain an unnecessary copy.
cdrom_target="$(sudo virsh --connect "$LIBVIRT_URI" domblklist "$VM_NAME" --details | awk '$2 == "cdrom" { print $3; exit }')"
if [[ -n "$cdrom_target" ]]; then
  sudo virsh --connect "$LIBVIRT_URI" detach-disk "$VM_NAME" "$cdrom_target" --config
fi
sudo rm -f "$INSTALL_ISO_PATH"

echo "Installation finished. Start the VM with: $(dirname "$0")/start.sh"
