# Isolated WeKan testing in KVM on Fedora Asahi Remix

Fedora Asahi Remix on Apple Silicon can use ARM64 KVM guests when `/dev/kvm` is
available. A dedicated virtual machine is the preferred boundary for running the
complete WeKan and FerretDB test stacks because Docker, the browsers, databases,
source trees and development credentials can all remain inside the guest.

This is a stronger boundary than Toolbox, Distrobox, a development container, or
VSCodium Flatpak with `flatpak-spawn --host`. Those approaches deliberately share
parts of the host. The VM created here shares no host directory, SSH agent, Docker
socket, clipboard channel, USB device, or bridged network.

## Host requirements

- Fedora Asahi Remix on an ARM64 Apple Silicon machine.
- Hardware virtualization exposed as `/dev/kvm`.
- At least 16 GiB host RAM and 120 GiB free storage are recommended.
- A Fedora ARM64 (`aarch64`) Server or Workstation installation ISO.

Check KVM before installing anything:

```sh
uname -m
test -r /dev/kvm && echo "KVM is available"
```

The architecture must be `aarch64`. Do not use an x86-64 ISO: QEMU would have
to emulate that CPU instead of using KVM acceleration.

## Create and install the VM

Download a current Fedora ARM64 ISO from Fedora, verify its published checksum,
and pass its local path to `install.sh`:

```sh
cd /home/user/repos/wekan/docs/Security/Sandboxes/KVM/AsahiFedora
./install.sh /path/to/Fedora-Server-dvd-aarch64.iso
```

The script installs the Fedora virtualization packages on the host, enables
libvirt, creates the default isolated NAT network when necessary, and defines
`wekan-asahi-test` with these defaults:

| Resource | Default |
| --- | --- |
| CPUs | 6 KVM-backed ARM64 vCPUs, host CPU model |
| Memory | 12 GiB |
| Disk | 100 GiB sparse qcow2 under `/var/lib/libvirt/images/` |
| Firmware | ARM64 UEFI |
| Network | libvirt's NAT-only `default` network |
| Display | local-only SPICE console |
| Host integration | no shared directory, agent, Docker socket, USB or clipboard channel |

Override sizing before installation when the host is smaller or larger:

```sh
VM_CPUS=4 VM_MEMORY_MIB=8192 VM_DISK_GIB=80 \
  ./install.sh /path/to/Fedora-Server-dvd-aarch64.iso
```

The Fedora installer opens in `virt-manager`. During installation, create a
normal non-root user and enable disk encryption if unattended VM restarts are
not required. The VM powers off when installation finishes. Remove the virtual
installation media if the Fedora installer does not do so automatically.

The installer refuses to overwrite an existing VM or disk. Remove or rename an
old VM deliberately before trying to create another one.

## Start and stop

Start the installed VM and open its local console:

```sh
./start.sh
```

Ask the guest operating system to shut down cleanly:

```sh
./stop.sh
```

`stop.sh` waits up to 120 seconds. It does not use `virsh destroy`, because that
is equivalent to pulling the power and can corrupt a database or filesystem. If
the guest does not stop, inspect it with `virt-manager` and decide manually
whether a forced power-off is justified.

Set `VM_NAME` for all three scripts to manage a differently named VM:

```sh
VM_NAME=wekan-test-2 ./start.sh
```

## Configure the guest

Keep all test dependencies inside the VM:

1. Update Fedora and install Git, compilers, rootless Docker or Podman, and the
   browser runtime dependencies.
2. Clone WeKan into the guest's own virtual disk.
3. Install the repository-local Node.js, Meteor and Go toolchains described in
   the VSCodium sandbox documentation.
4. Run WeKan, database conformance and FerretDB tests from the guest.
5. Create a clean libvirt snapshot before dependency upgrades or hostile-input
   security testing.

Do not forward the host's `SSH_AUTH_SOCK`, GPG agent, Docker socket, home
directory or source checkout. If the guest needs GitHub access, use a separate,
limited credential in the guest. Prefer committing in the guest and pushing
manually from a trusted host checkout.

## Isolation notes

- NAT lets the guest download dependencies without exposing guest services
  directly on the host network. Do not change it to a bridged interface unless
  inbound LAN access is required.
- The local SPICE display is available through libvirt, but no SPICE agent
  channel is attached. Clipboard and file sharing are therefore not configured.
- libvirt runs QEMU under its service account and Fedora SELinux applies an
  sVirt label to the VM resources.
- Rootless containers inside the guest reduce container-daemon privilege, but
  the KVM boundary remains the primary isolation layer.
- Assigning substantially more than 60–70 percent of host RAM can make both the
  host and guest unreliable during browser and Go test peaks.

See Fedora's
[virtualization getting-started guide](https://docs.fedoraproject.org/en-US/quick-docs/virtualization-getting-started/)
and Docker's
[rootless-mode documentation](https://docs.docker.com/engine/security/rootless/)
for the underlying host and container facilities.
