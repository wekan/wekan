# WeKan in the Arch User Repository (AUR)

The [AUR](https://aur.archlinux.org) has no WeKan server package (checked 2026-10-11:
only `python-wekan`, a REST API client; `wekan`, `wekan-bin` and `wekan-git` do not
exist, and nothing in the official repositories). [`wekan-bin/`](wekan-bin/) here is a
complete package of WeKan's release bundle.

## The package

| File | Installed as | What it is |
| --- | --- | --- |
| [`PKGBUILD`](wekan-bin/PKGBUILD) | | Downloads `wekan-<version>-amd64.zip` or `-arm64.zip` and WeKan's `LICENSE`, checks their SHA256, installs |
| [`wekan.service`](wekan-bin/wekan.service) | `/usr/lib/systemd/system/wekan.service` | Runs `start-wekan.sh` as `wekan`, with `/var/lib/wekan` as its working and only writable directory |
| [`wekan.sysusers`](wekan-bin/wekan.sysusers) | `/usr/lib/sysusers.d/wekan.conf` | The `wekan` system user |
| [`wekan.tmpfiles`](wekan-bin/wekan.tmpfiles) | `/usr/lib/tmpfiles.d/wekan.conf` | `/var/lib/wekan` owned by `wekan`, and `wekan.env` readable by its group |
| [`wekan.env`](wekan-bin/wekan.env) | `/etc/wekan/wekan.env` (in `backup`) | `ROOT_URL`, `PORT`, `WRITABLE_PATH` and the mail settings |
| [`LICENSE`](wekan-bin/LICENSE) | | 0BSD, for the packaging files themselves, as the AUR asks |

Why it is built this way:

- `-bin`: it packages the prebuilt release bundle. The AUR requires that suffix when the
  sources exist.
- The bundle installs read-only to `/usr/share/wekan`, as Arch's web application
  guidelines ask. It carries its own Node.js (glibc-linked, needs GLIBC 2.28) and
  FerretDB (static), so it depends only on `glibc`, `gcc-libs` and `bash`.
- `start-wekan.sh` starts FerretDB v1 on SQLite and then WeKan. Data goes to
  `WRITABLE_PATH=/var/lib/wekan`: `files/db`, `files/attachments`, `files/avatars`.
  FerretDB writes `state.json` to the working directory, hence
  `WorkingDirectory=/var/lib/wekan`.
- `Restart=always`: the launcher restarts WeKan itself and exits 0 when stopped, so
  `on-failure` would never fire. `systemctl stop` signals the whole control group, which
  is what stops it: SIGTERM to the launcher alone waits for Node.js.
- `LimitSTACK` matches the launcher's `ulimit -s 65500`.
- `options=('!strip' '!debug')` keeps Node.js and FerretDB byte for byte what the
  release checksums.

## How it was tested

With Arch's own `makepkg` (from Arch's `pacman` package, unpacked under `.tools/tmp`,
with stub `pacman` and `fakeroot` commands) on this non-Arch machine:

- `makepkg --printsrcinfo` produces the `.SRCINFO`.
- `makepkg -d -f` downloaded nothing it already had, validated every source with its
  `sha256sums` - including the 320 MB `wekan-12.30-amd64.zip` - ran `package()`, and
  built `wekan-bin-12.30-1-x86_64.pkg.tar` (920 MB installed) with no packaging warnings.
- The packaged `/usr/share/wekan/start-wekan.sh`, run with the packaged `wekan.env` and
  only `WRITABLE_PATH` and the port moved to a scratch directory, answered HTTP 200 after
  14 s, with its SQLite database in `files/db` and `state.json` in the working directory.

Not run here: `namcap` (needs Arch's libalpm), a real `pacman -U`, `systemd-sysusers`,
`systemd-tmpfiles` and starting the unit under systemd. An `archlinux:base-devel`
container can run all of them.

## Publishing it

1. Register at aur.archlinux.org and add an SSH key ("My Account").
2. `git -c init.defaultBranch=master clone ssh://aur@aur.archlinux.org/wekan-bin.git`
3. Copy the files from `wekan-bin/` here, run `makepkg --printsrcinfo > .SRCINFO`, commit
   the PKGBUILD, `.SRCINFO` and the other files, and push to `master`.

Every WeKan release then needs: `pkgver` bumped, `pkgrel=1`, both `sha256sums_*` replaced
(the release publishes them as `wekan-<version>-<arch>.zip.sha256sum`, so nothing has to
be downloaded), `.SRCINFO` regenerated, commit, push. Tools that automate it: nvchecker
for noticing a release, aurpublish, or a CI action that pushes with an SSH key - the AUR
warns that automated updates are at the maintainer's own risk.

## What is missing

See the table in [docs/Design/Autoupdate/Platforms.md](../../../../Design/Autoupdate/Platforms.md#possible-additional-platforms).
