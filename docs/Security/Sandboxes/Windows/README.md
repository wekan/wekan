# Windows Sandbox

Windows lacks Flatpak, but an equivalent sandbox is set up here, where the same
`.tools`-only layout helps just as much.

The sandbox limits VSCodium's read and write access to the
`Downloads\repos\wekan` directory. In that WeKan repository the `.tools`
subdirectory, listed in `.gitignore`, holds all related work: the companion
repositories, the `.tools\tmp` temporary directory, the `.tools\log` log files,
Node.js, Meteor and the caches.

It is the Windows counterpart of the Linux Flatpak sandbox in
[../vscodium](../vscodium/README.md) and the macOS one in
[../macOS](../macOS/README.md).

## Quick start

1. Clone WeKan to `%USERPROFILE%\Downloads\repos\wekan`.
2. Double-click `docs\Security\Sandboxes\Windows\sandbox.bat`. Or, from a
   terminal:

   ```bat
   powershell -ExecutionPolicy Bypass -File docs\Security\Sandboxes\Windows\sandbox.ps1
   ```

   The first time, it offers to turn on the Windows Sandbox feature. That asks
   for administrator rights and a restart; run it again afterwards.
3. Windows Sandbox opens, downloads VSCodium and PortableGit into `.tools`
   once, verifying each, and opens VSCodium on the checkout.
4. In VSCodium's terminal, run `build.bat` once and choose option 1. It
   installs Node.js and Meteor into `.tools`, where they stay for the next
   start.

`sandbox.ps1 -SetupOnly` writes the configuration without starting it.

## Requirements

- Windows 10 or 11 **Pro, Enterprise or Education**. Windows Sandbox is not
  part of Home editions.
- Virtualization turned on in the firmware (Intel VT-x / AMD-V), as for any
  Hyper-V virtual machine.
- 4 GiB of memory for the sandbox at least. `sandbox.ps1` gives it half of the
  host's memory, from 4 up to 16 GiB.

## What the sandbox allows and refuses

| | |
| --- | --- |
| **Refused** | every file of the host except the checkout: the user profile, `Documents`, `Desktop`, the rest of `Downloads`, browser profiles, `%USERPROFILE%\.ssh`, `.gitconfig`, other drives |
| **Refused** | the host's credentials and SSH agent, its printers, microphone and camera |
| **Allowed** | read and write `Downloads\repos\wekan`, mapped at the same path inside |
| **Allowed** | the network, as in the Flatpak (`--share=network`): git, npm, Meteor and the tests need it |

## How it works

**Windows Sandbox** is a disposable Hyper-V virtual machine that comes with
Windows. It is a whole separate Windows: its own kernel, file system, users
and processes. It sees nothing of the host except the folders mapped into
it. That is stronger isolation than the Flatpak on Linux or `sandbox-exec` on
macOS, which share the host's kernel.

`sandbox.ps1`, run on the host, writes `.tools\sandbox\wekan-vscodium.wsb`:

```xml
<Configuration>
  <MappedFolders>
    <MappedFolder>
      <HostFolder>C:\Users\<you>\Downloads\repos\wekan</HostFolder>
      <SandboxFolder>C:\Users\WDAGUtilityAccount\Downloads\repos\wekan</SandboxFolder>
      <ReadOnly>false</ReadOnly>
    </MappedFolder>
  </MappedFolders>
  <Networking>Enable</Networking>
  <AudioInput>Disable</AudioInput> <VideoInput>Disable</VideoInput>
  <PrinterRedirection>Disable</PrinterRedirection>
  <ProtectedClient>Enable</ProtectedClient>
  <LogonCommand><Command>powershell.exe ... sandbox-logon.ps1</Command></LogonCommand>
</Configuration>
```

- **The checkout is the only mapped folder,** at the same path under the
  sandbox's own user (`WDAGUtilityAccount`), so `Downloads\repos\wekan` is
  the same path inside and out.
- **Everything else is forgotten when the sandbox closes.** What has to last
  is kept in the checkout's `.tools\`:
  - `.tools\vscodium\app` holds VSCodium, the zip build.
  - `.tools\vscodium\user-data` and `.tools\vscodium\extensions` hold its
    settings and extensions.
  - `.tools\PortableGit` holds git.
  - `.tools\node-v*-win-*` and `.tools\.meteor` hold Node.js and Meteor, from
    `build.bat`.
  - `.tools\home\.gitconfig` is git's configuration (`GIT_CONFIG_GLOBAL`).
  - `.tools\tmp` holds temporary files (`TEMP`, `TMP`, `TMPDIR`).
- **Downloads are verified.** VSCodium is checked against the `.sha256` file
  published beside each release asset, and PortableGit against the SHA-256 in
  Git for Windows' release notes. Node.js from `build.bat` is checked against
  nodejs.org's `SHASUMS256.txt`. A mismatch stops with an error, and nothing
  is unpacked.
- **The commit author:** the sandbox has none of the host's git
  configuration, so `sandbox.ps1` copies `user.name` and `user.email` into the
  checkout's own `.git\config` once, on the host. The mapped folder belongs to
  the host's user, so git inside is told it is a safe directory.
- **`ProtectedClient`** runs the sandbox's window with fewer rights, which
  makes copying *files* in and out by the clipboard harder. Text still copies.
  Files go through the checkout, which is the point.

## Trade-offs, and why

- **One sandbox at a time:** Windows allows only one running Windows Sandbox.
- **A fresh start each time:** the virtual machine is new on every start, and
  that is the protection. Only the checkout persists. `sandbox-logon.ps1`
  takes a few seconds on later starts, because the downloads are already in
  `.tools`.
- **No ssh keys inside:** the host's keys and agent are not visible, as
  `--nosocket=ssh-auth` refuses them in the Flatpak. Pushing is done from a
  terminal on the host. That is also the rule for AI assistants in
  CLAUDE.md: they commit, and a human pushes.
- **The network is open,** as in the Flatpak. Restricting it would need a
  proxy and would break git, npm, Meteor and the tests.
- **Not tested on Windows yet.** These scripts were written and reviewed on
  macOS. The first Windows run should be checked: the log of the sandbox's
  setup is `.tools\sandbox\logon.log`.

## Removing

Delete `.tools\sandbox`, `.tools\vscodium`, `.tools\PortableGit` and
`.tools\home`. To turn the Windows feature off again, run this as an
administrator:
`Disable-WindowsOptionalFeature -Online -FeatureName Containers-DisposableClientVM`.
