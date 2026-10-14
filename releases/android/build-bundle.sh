#!/usr/bin/env bash
# Rebuild a published Linux bundle for Android, inside Termux's own image on a
# runner of the same CPU (.github/workflows/android.yml). Like the musl and
# BSD bundles, the JavaScript is the release's own; what changes:
#
#   - bundle/node becomes wekan/node-patches' node-android-<cpu> (Node.js of
#     the same version, built with the NDK and its C++ library linked in),
#     already downloaded and checked against its SHA256 as android-tools/node;
#   - bundle/node-runtime, glibc libraries, goes;
#   - npm reinstalls programs/server here, run BY that Node.js, so every native
#     addon Meteor's own server packages build is compiled for Node 26 on
#     Android (Bionic);
#   - sharp, an application package (programs/server/npm/node_modules), loses
#     the glibc platform packages it came with and is built from source
#     against Termux's libvips - which a user therefore installs too (pkg
#     install libvips), as for the Bun Android bundle. Should that build fail,
#     sharp runs as WebAssembly (@img/sharp-wasm32, in every bundle) and the
#     log says so. (Until v12.44 the glibc packages were removed from
#     programs/server/node_modules, where they are not, and sharp was never
#     built.)
#   - every addon's architecture is checked, sharp must load, and the bundle
#     must start and answer HTTP 200.
#
# FerretDB and the MongoDB Database Tools are static Go programs and run on
# Android's Linux kernel as they are.
#
#   bash releases/android/build-bundle.sh <arm64|x64|arm|ia32>
set -euo pipefail
arch="${1:?usage: build-bundle.sh <arm64|x64|arm|ia32>}"
root="$PWD"
mkdir -p "$root/.tools/tmp"
export TMPDIR="$root/.tools/tmp"
export DO_NOT_TRACK=1 npm_config_update_notifier=false

node="$root/android-tools/node"
# The workflow made it executable before Docker; Termux's user does not own
# the bind mount and may not chmod it (v12.43-v12.44 stopped here).
[ -x "$node" ] || chmod +x "$node"
echo "Node.js on Android $(getprop ro.build.version.release 2>/dev/null || uname -sr) $(uname -m): $("$node" --version)"
"$node" -e 'if (process.platform !== "android") { console.error(`node says ${process.platform}, expected android`); process.exit(1); }'
"$node" -e 'if (process.arch !== process.argv[1]) { console.error(`node says ${process.arch}, expected ${process.argv[1]}`); process.exit(1); }' "$arch"

# npm is JavaScript: run Termux's npm with THIS Node.js, so node-gyp builds the
# addons for its version, not for Termux's own nodejs-lts.
npm_cli="$(dirname "$(readlink -f "$(command -v npm)")")/npm-cli.js"
[ -f "$npm_cli" ] || npm_cli="$PREFIX/lib/node_modules/npm/bin/npm-cli.js"
npm() { "$node" "$npm_cli" "$@"; }
export -f npm 2>/dev/null || true

server="$root/bundle/programs/server"
appmods="$server/npm/node_modules"
rm -rf "$appmods/@img/sharp-linux-"* "$appmods/@img/sharp-libvips-linux-"* \
  "$appmods/@napi-rs/canvas-linux-"*
bcrypt="$server/npm/node_modules/meteor/accounts-password/node_modules/bcrypt"
if [ -d "$bcrypt" ]; then
  (cd "$bcrypt" && npm install --no-save node-addon-api@^8 >/dev/null 2>&1 || true)
fi
(cd "$server" && npm install)
# sharp has no Android prebuilt: built from source against Termux's libvips.
if ! (cd "$appmods/sharp" && npm install --no-save --omit=dev node-addon-api node-gyp && "$node" install/build.js); then
  echo "::warning::sharp could not be built against Termux's libvips here; it runs as WebAssembly (@img/sharp-wasm32)."
fi
"$node" "$root/releases/prune-build-only-modules.mjs" "$root/bundle"
"$node" "$root/releases/bump-bundle-npm-deps.mjs" "$root/bundle"
"$node" "$root/releases/bundle-trim.mjs" "$root/bundle" --transport sockjs --drop-legacy-client
"$node" "$root/releases/prune-unreachable-npm.mjs" "$root/bundle"

rm -rf "$root/bundle/node-runtime"
cp "$node" "$root/bundle/node"
for f in "$root/bundle/node" "$root/bundle/ferretdb"; do [ -x "$f" ] || chmod +x "$f"; done
touch "$root/bundle/.ferretdb-default"

"$root/bundle/node" "$root/releases/check-addon-arch.mjs" "$root/bundle" "$arch" --platform linux
# An application package: it resolves from programs/server/npm.
(cd "$server/npm" && "$root/bundle/node" -e 'const s = require("sharp"); console.log(`sharp loads on Android (${s.versions.sharp}, libvips ${s.versions.vips || "WebAssembly"})`)')
bash "$root/releases/bsd/smoke.sh" "$root/bundle"
