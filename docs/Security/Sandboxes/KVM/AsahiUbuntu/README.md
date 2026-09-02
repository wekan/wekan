# Isolated WeKan testing in KVM on Ubuntu Asahi

An ARM64 Ubuntu installation running on Apple Silicon through the Asahi Linux
kernel can use KVM guests when `/dev/kvm` is available. A dedicated virtual
machine is the preferred boundary for the complete WeKan and FerretDB test
stacks: Docker, browsers, databases, source trees and test credentials all stay
on the guest's own disk.

This boundary is stronger than a development container or an editor sandbox
that can execute host commands. The VM created here shares no host directory,
SSH agent, Docker socket, clipboard channel, USB device, or bridged network.

## Host requirements

- An ARM64 Ubuntu Asahi installation on Apple Silicon.
- Hardware virtualization exposed as `/dev/kvm`.
- At least 16 GiB host RAM and 120 GiB free storage are recommended.
- An Ubuntu or Fedora ARM64 (`aarch64`) installation ISO for the guest.

Check the architecture and KVM device first:

```sh
uname -m
test -r /dev/kvm && echo "KVM is available"
```

The architecture must be `aarch64`. Use an ARM64 guest ISO so QEMU can use KVM
acceleration instead of emulating an x86-64 CPU.

## Create and install the VM

Download a current ARM64 ISO from the distribution's official site, verify its
published checksum, and pass its local path to `install.sh`:

```sh
cd /home/user/repos/wekan/docs/Security/Sandboxes/KVM/AsahiUbuntu
./install.sh /path/to/ubuntu-arm64.iso
```

The script installs Ubuntu's QEMU, libvirt, AArch64 UEFI and virt-manager
packages, enables libvirt, creates the default NAT network when necessary, and
defines `wekan-asahi-test` with these defaults:

| Resource | Default |
| --- | --- |
| CPUs | 6 KVM-backed ARM64 vCPUs, host CPU model |
| Memory | 12 GiB |
| Disk | 100 GiB sparse qcow2 under `/var/lib/libvirt/images/` |
| Firmware | ARM64 UEFI from `qemu-efi-aarch64` |
| Network | libvirt's NAT-only `default` network |
| Display | local-only SPICE console |
| Host integration | no shared directory, agent, Docker socket, USB or clipboard channel |

Override sizing before installation when needed:

```sh
VM_CPUS=4 VM_MEMORY_MIB=8192 VM_DISK_GIB=80 \
  ./install.sh /path/to/ubuntu-arm64.iso
```

Complete the graphical guest installer in `virt-manager`. Create a normal
non-root user and enable guest disk encryption when unattended restarts are not
required. The VM powers off at the end, and the script detaches and removes its
staged copy of the installation ISO.

The installer refuses to overwrite an existing VM, virtual disk, or staged ISO.

## Start and stop

Start the installed VM and open its local console:

```sh
./start.sh
```

Request a clean guest shutdown:

```sh
./stop.sh
```

`stop.sh` waits up to 120 seconds and deliberately never calls `virsh destroy`.
If the guest does not stop, inspect it in `virt-manager` before deciding whether
a forced power-off is justified.

All scripts accept a different domain name through `VM_NAME`:

```sh
VM_NAME=wekan-test-2 ./start.sh
```

## Configure the guest

Keep the entire test environment inside the virtual machine:

1. Update the guest and install Git, compilers, rootless Docker or Podman, and
   browser dependencies.
2. Clone WeKan onto the guest-owned virtual disk.
3. Install the repository-local Node.js, Meteor and Go toolchains.
4. Run the WeKan, browser, database-conformance and FerretDB suites there.
5. Take a clean libvirt snapshot before dependency upgrades or hostile-input
   security testing.

Do not forward the host's `SSH_AUTH_SOCK`, GPG agent, Docker socket, home
directory, source checkout, clipboard, or USB devices. Use a separate limited
guest credential only if the VM itself needs remote Git access. Prefer local
guest commits followed by a deliberate human-controlled push.

## Isolation notes

- The default NAT network permits dependency downloads without exposing guest
  services directly to the LAN.
- SPICE listens only through libvirt and no SPICE agent channel is attached, so
  clipboard and file sharing are not configured.
- Ubuntu's libvirt packages run QEMU under an unprivileged service identity and
  apply AppArmor confinement to supported guest resources.
- Rootless containers reduce privilege inside the guest, while KVM remains the
  primary host boundary.
- Do not assign substantially more than 60–70 percent of host RAM; browser and
  Go compilation peaks otherwise make both systems unreliable.

See Ubuntu's [libvirt documentation](https://ubuntu.com/server/docs/libvirt)
and Docker's
[rootless-mode documentation](https://docs.docker.com/engine/security/rootless/)
for the underlying virtualization and container facilities.
