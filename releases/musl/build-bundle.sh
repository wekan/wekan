#!/usr/bin/env bash
# Rebuild a published Linux bundle for musl (Alpine and the other musl
# systems), inside Alpine, on a runner of the same CPU
# (.github/workflows/musl.yml). Like the BSD bundles (releases/bsd/), the
# bundle's JavaScript is the release's own; what changes is everything that
# was built for glibc:
#
#   - bundle/node becomes the musl Node.js of the same version, already
#     downloaded and checked against its SHASUMS256 into musl-tools/;
#   - bundle/node-runtime, the glibc libraries Node.js needed, goes;
#   - npm reinstalls programs/server here, so every native addon Meteor's own
#     server packages build is compiled against musl;
#   - the application's packages (programs/server/npm/node_modules) are not
#     what that install touches: their platform packages are swapped by
#     releases/platform-native-packages.mjs --libc musl, which removes the
#     glibc ones (sharp's @img/sharp-linux-*, @napi-rs/canvas-linux-*-gnu)
#     and adds sharp's @img/sharp-linuxmusl-* and canvas's -musl package,
#     sha512-checked. (v12.41-v12.44 removed the glibc ones from the wrong
#     directory and never added the musl ones, so sharp did not load.)
#   - check-addon-arch.mjs then reads every .node header, and the bundle is
#     started as a user starts it and must answer HTTP 200.
#
# FerretDB and the MongoDB Database Tools are static Go programs and stay.
#
#   bash releases/musl/build-bundle.sh <x64|arm64>
set -euo pipefail
arch="${1:?usage: build-bundle.sh <x64|arm64>}"
root="$PWD"
mkdir -p "$root/.tools/tmp"
export TMPDIR="$root/.tools/tmp"
export PATH="$root/musl-tools/bin:$PATH"
export DO_NOT_TRACK=1 npm_config_update_notifier=false

echo "Node.js on $(cat /etc/alpine-release 2>/dev/null || uname -sr) $(uname -m): $(node --version), npm $(npm --version)"
# This Node.js must be a musl one: glibcVersionRuntime is set only on glibc.
node -e 'const h = process.report.getReport().header; if (h.glibcVersionRuntime) { console.error(`glibc ${h.glibcVersionRuntime}: not a musl Node.js`); process.exit(1); }'
node -e 'if (process.arch !== process.argv[1]) { console.error(`node says ${process.arch}, expected ${process.argv[1]}`); process.exit(1); }' "$arch"

server="$root/bundle/programs/server"
bcrypt="$server/npm/node_modules/meteor/accounts-password/node_modules/bcrypt"
if [ -d "$bcrypt" ]; then
  (cd "$bcrypt" && npm install --no-save node-addon-api@^8 >/dev/null 2>&1 || true)
fi
(cd "$server" && bash "$root/releases/npm-retry.sh" npm install)
node "$root/releases/prune-build-only-modules.mjs" "$root/bundle"
node "$root/releases/bump-bundle-npm-deps.mjs" "$root/bundle"
node "$root/releases/bundle-trim.mjs" "$root/bundle" --transport sockjs --drop-legacy-client
node "$root/releases/prune-unreachable-npm.mjs" "$root/bundle"

rm -rf "$root/bundle/node-runtime"
cp "$root/musl-tools/bin/node" "$root/bundle/node"
chmod +x "$root/bundle/node" "$root/bundle/ferretdb"
touch "$root/bundle/.ferretdb-default"

node "$root/releases/platform-native-packages.mjs" "$root/bundle" linux "$arch" --libc musl
node "$root/releases/check-addon-arch.mjs" "$root/bundle" "$arch" --platform linux --libc musl
# sharp must load here, with its musl package: thumbnails depend on it. It is
# an application package, so it resolves from programs/server/npm.
(cd "$server/npm" && "$root/bundle/node" -e 'require("sharp"); console.log("sharp loads on musl")')
bash "$root/releases/bsd/smoke.sh" "$root/bundle"
