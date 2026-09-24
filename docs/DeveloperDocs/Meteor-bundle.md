- Read [Wekan new release ChangeLog](../../CHANGELOG.md)
- [Install Meteor.js](https://www.meteor.com/install). Note: Windows install is very slow, please use other option at [Windows wiki page](../Platforms/Propietary/OS/Windows)
- Download newest bundle from https://releases.wekan.team
- Unarchive bundle .tar.gz file: `tar -zxvf wekan-VERSION.tar.gz`
- `cd bundle`
- `meteor`
- Browse with webbrowser like Firefox to http://localhost:3000

[Wekan for Meteor.js bundle bug reports and feature requests](https://github.com/wekan/wekan/issues)

[Build Meteor bundle from source](../Platforms/FOSS/Source)

Note: building from source writes two directories that are easy to confuse.
`.build/` is the release bundle (`meteor build .build --directory`, and
`.build/bundle` is what is deployed); `_build/` is rspack's compiled output,
written by any Meteor compile, which Meteor reads the app's main modules from.
Both are generated and gitignored. See
[Directory-Structure.md](Directory-Structure.md).

[Install from source without root](../Platforms/FOSS/Source/Install-from-source-without-root.md)

## Node.js runtime libraries

Linux release builders install `libatomic1` explicitly. The shared
`releases/bundle-node-runtime.py` helper copies the matching `libatomic.so.1`
into `bundle/node-runtime`, together with its copyright and license text.
It checks ELF class, byte order and machine before copying, so an amd64 library
cannot silently enter an ARM64 or other architecture's bundle. Emulated builds
run this helper inside the target container. Missing libraries or copyright
files stop packaging.

Launch Linux ZIP bundles through `./start-wekan.sh`; the launcher adds that
private directory to `LD_LIBRARY_PATH`. AppImage and Flatpak packages inherit
the directory and launcher, and reject older input ZIPs that lack the library.
Docker installs libatomic1 separately from removable build tools. Sandstorm
copies it into its private loader directory. Snap stages it through its own
runtime package list. Windows and macOS use their native Node runtimes and
remove the inherited Linux library directory when repacking.

Fast checks: `node tests/nodeRuntimeDependency.test.cjs`. A Linux runtime check
can additionally copy a real Node binary with the helper, run it with the private
library path, and load `libatomic.so.1` from that directory. The packaged library
does not replace the platform's libc or relax Node's minimum OS requirements.
