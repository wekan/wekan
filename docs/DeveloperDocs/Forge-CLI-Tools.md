# Forge CLI tools

Select **Tools → Install forge CLI tools** in `build.sh` or `build.bat`.
The active mirrors in `releases/mirror.sh` are GitLab, Codeberg and SourceForge;
Bitbucket is disabled. The Windows mirror script uses the same three targets.

| Work | Installed tools |
| --- | --- |
| Git history and tags on every mirror | Git and SSH |
| GitHub issues, pull requests and releases | `gh` |
| GitLab issues, merge requests and releases | `glab` |
| Codeberg/Forgejo issues, pull requests and releases | `tea` |
| SourceForge tracker API | `curl`, `jq` |
| SourceForge release files | `scp`, `sftp`; Unix also installs `rsync` |
| Existing issue/PR/CI mirror helper | Node.js |
| Additional forge workflows and distributed issue bridges | `forge`, `git-bug` |
| Build missing CLI executables for the host CPU | Go |

Installation retains existing commands. It installs missing prerequisites first,
then prefers native `gh`/`glab` packages and macOS Brew packages for Tea/git-bug.
If a forge CLI package is unavailable, it builds the maintained Go command:

```sh
go install github.com/cli/cli/v2/cmd/gh@latest
go install gitlab.com/gitlab-org/cli/cmd/glab@latest
go install gitea.dev/tea@latest
go install github.com/git-bug/git-bug@latest
go install github.com/git-pkgs/forge/cmd/forge@latest
```

`code.gitea.io/tea` fetches an obsolete version. Forge's module root is a library;
its command is under `cmd/forge`. To update an already-installed old Tea, run its
command above explicitly, because the installer skips present commands.

| Operating system | Installation |
| --- | --- |
| macOS, Intel or Apple Silicon | Homebrew, then native Go builds as needed |
| Debian or Ubuntu, any available native package architecture | APT, then native Go builds |
| Fedora Workstation, any available native package architecture | DNF, then native Go builds |
| Windows | PowerShell, winget or existing Chocolatey, then native Go builds |

Package managers select the host CPU; the installer never downloads an amd64 CLI
for every machine. Unix Go older than 1.21 is bootstrapped from the current stable
[official Go catalogue](https://go.dev/dl/), selecting the OS/CPU archive and checking
its SHA-256 before extraction. The separate cache is `.tools/forge-go/`; other Go
installations remain intact. Newer Go can obtain module-required toolchains under
its normal toolchain policy. Host architectures without an upstream archive or
working native toolchain remain failures, rather than being reported as supported.
All OS/CPU combinations require support from the upstream tools and package managers;
this is not a claim that every historical CPU is supported or tested.

Windows uses `tools/install-forge-tools.ps1`. It refreshes package PATH changes and
checks Git for Windows' SSH commands or installs the OpenSSH **client** capability
when needed. Installing that Windows capability requires Administrator privileges.
SCP/SFTP provide release transfer on Windows without requiring a Unix rsync package.

Go-built commands default to `.tools/bin`, which both build scripts put on PATH.
A configured `GOBIN` takes precedence during installation. For a standalone terminal,
add that directory to PATH. Temp files are under `.tools/tmp`. Each installer prints
an OK/MISSING list and returns failure if any required command remains missing;
individual installation failures do not stop attempts for later tools.

Authentication is separate: `gh auth login`, `glab auth login`, `tea login add`.
SourceForge uses the maintainer's account for SSH/SFTP and its API authentication.
No credentials are collected or remote data changed by the installer.

Installing tools does not synchronize forge data. The build Tools menu runs
`releases/mirror.sh` or `releases/mirror.bat`, dispatching to a script for each
active mirror. They copy missing issues/PR conversations and supported release
metadata/assets as well as Git history. See [Forge mirroring](Forge-Mirroring.md)
for credentials, preview commands, restart behavior and unsupported data. Install
status alone does not prove a remote migration is complete.

References: [Tea](https://pkg.go.dev/gitea.dev/tea#section-readme),
[Forge](https://github.com/git-pkgs/forge#cli),
[SourceForge tracker API](https://sourceforge.net/p/forge/documentation/Allura%20API/),
[SourceForge release transfers](https://sourceforge.net/p/forge/documentation/Release%20Files%20for%20Download/).

Verification runs the actual Unix function with offline substitutes, checks the
real Debian/Ubuntu/Fedora/Brew package mappings, and exercises architecture selection,
old-Go bootstrap and checksum rejection using local fixtures. Windows PowerShell
execution uses offline package/SSH/Go substitutes when `WEKAN_PWSH_BIN` is configured.
These tests do not certify live installations on every OS/CPU or authenticate,
mirror, upload or publish anything.
