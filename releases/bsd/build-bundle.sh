#!/usr/bin/env bash
# Build a WeKan bundle for a BSD, INSIDE that BSD (a VM on GitHub Actions,
# .github/workflows/bsd.yml), from the workspace root:
#
#   bash releases/bsd/build-bundle.sh <os> <arch>      e.g. freebsd x64
#
# The runner has already put, verified against their published SHA256:
#   bundle/            the amd64 Linux bundle of this release, unpacked
#   bundle/ferretdb    this BSD's FerretDB (wekan/FerretDB)
#   bsd-tools/bin/node this BSD's Node.js (wekan/node-patches)
#   bsd-tools/npm/     npm, which is plain JavaScript
#
# Here the bundle's npm dependencies are installed again, so every native
# module (bcrypt, argon2, ...) is compiled for this OS and CPU; then the same
# steps as every other bundle (releases/install-node-for-arch.sh); then WeKan
# is started with its own start-wekan.sh against the bundled FerretDB, the
# way a user starts it, and must answer HTTP. Design:
# docs/Platforms/FOSS/OS/BSD.md.
set -euo pipefail

os="${1:?usage: build-bundle.sh <freebsd|openbsd|netbsd> <x64|arm64>}"
arch="${2:?usage: build-bundle.sh <os> <arch>}"
root="$PWD"
mkdir -p "$root/.tools/tmp"
export TMPDIR="$root/.tools/tmp"
export PATH="$root/bsd-tools/bin:$PATH"
export DO_NOT_TRACK=1 npm_config_update_notifier=false

# npm runs on this Node: its CLI is JavaScript, only the launcher was Linux's.
cat > "$root/bsd-tools/bin/npm" <<NPM
#!/bin/sh
exec "$root/bsd-tools/bin/node" "$root/bsd-tools/npm/bin/npm-cli.js" "\$@"
NPM
chmod +x "$root/bsd-tools/bin/npm" "$root/bsd-tools/bin/node"

echo "Node.js on $(uname -sr) $(uname -m): $(node --version), npm $(npm --version)"
node -e 'if (process.platform !== process.argv[1]) { console.error(`node says ${process.platform}, expected ${process.argv[1]}`); process.exit(1); }' "$os"

# bcrypt 5.0.1 (Meteor accounts-password) ships node-addon-api@3, which does
# not compile on Node 26 - the same bump every Linux bundle gets.
bcrypt="$root/bundle/programs/server/npm/node_modules/meteor/accounts-password/node_modules/bcrypt"
if [ -d "$bcrypt" ]; then
  (cd "$bcrypt" && npm install --no-save node-addon-api@^8 >/dev/null 2>&1 || true)
fi

# Native modules are compiled here, by the BSD's own C++ compiler (cc/c++).
export CC="${CC:-cc}" CXX="${CXX:-c++}"
(cd "$root/bundle/programs/server" && bash "$root/releases/npm-retry.sh" npm install)
node "$root/releases/prune-build-only-modules.mjs" "$root/bundle"
node "$root/releases/bump-bundle-npm-deps.mjs" "$root/bundle"
node "$root/releases/bundle-trim.mjs" "$root/bundle" --transport sockjs --drop-legacy-client
node "$root/releases/prune-unreachable-npm.mjs" "$root/bundle"
node "$root/releases/platform-native-packages.mjs" "$root/bundle" "$os" "$arch"
# Linux-only cpu-exec + qemu-user (#6458) mean nothing on a BSD, as on Windows
# and macOS (release-all.yml drops them there too).
rm -f "$root/bundle/cpu-exec" "$root/bundle/qemu-"*
cp "$root/bsd-tools/bin/node" "$root/bundle/node"
chmod +x "$root/bundle/node" "$root/bundle/ferretdb"
touch "$root/bundle/.ferretdb-default"
# #2662: FreeBSD's service script, so `service wekan start` runs this bundle
# (releases/bsd/rc.d/wekan; install steps in its header).
if [ "$os" = freebsd ]; then
  mkdir -p "$root/bundle/rc.d"
  install -m 555 "$root/releases/bsd/rc.d/wekan" "$root/bundle/rc.d/wekan"
fi

# The smoke test: the bundle as a user starts it.
bash "$root/releases/bsd/smoke.sh" "$root/bundle"
