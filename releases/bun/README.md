# WeKan with Bun

`bun.yml` builds the exact published WeKan tag, once as an ESM application,
then rebuilds native dependencies for every OS/CPU in `targets.json`. Empty
`tag` means the latest published release, resolved once. `release-all.yml`
calls it for the release being built; `release-all-missing.yml` asks for only
missing archives/checksums. It does not create releases or move tags.

Assets are `wekan-<version>-bun-<os>-<cpu>[-musl].zip`, with a matching
`.sha256sum`. Each contains the ESM server and browser assets, its own Bun
executable, native npm dependencies, launchers, and build provenance. These
are server bundles, not Android APKs or desktop applications. Supply an
external MongoDB-compatible database; these optional bundles do not include
FerretDB, MongoDB Database Tools, Node.js, or a compiler.

After extracting, set `MONGO_URL` and `ROOT_URL`, optionally `PORT` (3000 by
default), and run `bundle/start-wekan.sh` or `bundle/start-wekan.cmd` on
Windows. Android bundles run inside Termux, with its standard libraries and
prefix; install `libc++` and `libvips` in Termux before starting the bundle.
Sharp is compiled against Termux libvips because it has no Android prebuilt addon. Keep the whole
bundle together. `index.mjs` is used on every platform; the optional Unix
socket based `bun-host.mjs` is not the portable Windows entry point.

## Build environments and speed

- Linux glibc: native Ubuntu x64 and ARM64 runners.
- Linux musl: Alpine containers on matching native runners.
- macOS and Windows: native x64 and ARM64 hosted runners.
- Android: the official Termux containers on matching Linux runner CPUs.
  These execute Bionic/Android binaries and build with Android clang; they
  are not glibc bundles renamed as Android. Build metadata is passed after the
  entrypoint clears the Docker environment, and Sharp is built from source. They do not emulate the Android
  UI/framework, so this is not a device or APK test.
- FreeBSD: real FreeBSD VMs through `vmactions/freebsd-vm`; its documented
  Ubuntu x64 host supports both x86_64 and emulated aarch64 guests. Prepared
  images are cached. This is the one target that needs cross-CPU emulation.

Addon load probes have a 30-second deadline and fall back to source builds.
The final native operation checks run under a Node supervisor with a three-minute
deadline; a hung or failed check prevents packaging.

The ESM compile is shared by all twelve targets. Only native npm dependencies
are rebuilt per target. Matrix jobs run independently, and each attaches its
own finished archive immediately. `only` accepts a JSON list such as
`["android-arm64"]`; `missing_only` skips only archive/checksum pairs.
`publish: false` retains workflow artifacts without writing release assets.

Bun is resolved from its latest stable release once per run. Downloads are
checked against that release's SHA256 manifest. The target catalog is checked
against its assets: new or removed OS/CPU targets fail planning visibly.
`-baseline` aliases and profiling executables are not separate OS/CPU targets.

## Temporary Meteor dependency

Meteor's Bun/ESM support is still proposed in
[meteor/meteor#14751](https://github.com/meteor/meteor/pull/14751).
The workflow clones the app's exact Meteor release into `.tools/meteor-bun`.
For Meteor 3.6-rc.0 it applies `meteor-3.6-rc.0.patch`, ported from
`dupontbertrand/meteor` commit `c0ab9318822f36f902da6124c1356ede58b71a4e` onto
Meteor commit `cc8cf7d21d24da5f4a4fd456527225bc5ce0e721`.

The port preserves the 3.6 transport documentation and Rspack's await of the
server bundle's exported promise. It does not downgrade package pins, change
`.meteor/release`, or affect ordinary Node builds. Upstream test fixtures are
included in the patch. A future Meteor release with the ESM loader uses its
own implementation; a release without it requires a reviewed patch update
and fails explicitly until one exists.

These builds are experimental. Publication requires native bcrypt/argon2
positive and negative password checks, a sharp image operation, and a Bun
startup check on every target. Native Linux also starts MongoDB and checks
HTTP, DDP, Chromium signup, board creation and anonymous mutation rejection.
Other targets deliberately use an unreachable database to check module/ABI
loading; that does not establish full database or browser compatibility. Failed
targets do not upload archives. A successful Linux build is not evidence that
the Windows, FreeBSD or Android build succeeded.

Sources: [Meteor discussion](https://forums.meteor.com/t/64775),
[Bun runtime assets](https://github.com/oven-sh/bun/releases/latest),
[FreeBSD VMs](https://github.com/vmactions/freebsd-vm),
[Termux containers](https://github.com/termux/termux-docker).
