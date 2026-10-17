#!/usr/bin/env bash
# Rebuild a published Linux bundle for musl (Alpine and the other musl
# systems), inside Alpine, on a runner of the same CPU
# (.github/workflows/musl.yml). Like the BSD bundles (releases/bsd/), the
# bundle's JavaScript is the release's own; what changes is everything that
# was built for glibc:
#
#   - bundle/node becomes the musl Node.js of the same version, already
#     downloaded and checked against its SHASUMS256 into musl-tools/;
#   - bundle/node-runtime, the glibc libraries Node.js needed, goes, and
#     holds Alpine's libstdc++ and libgcc_s instead, which the musl Node.js
#     needs and a bare Alpine lacks;
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
# The musl Node.js is a C++ program linked against GCC's libstdc++ and
# libgcc_s, which a bare Alpine does not have (Error relocating ... node:
# _ZTVN10__cxxabiv117__class_type_infoE: symbol not found - every musl
# AppImage of v12.51). They come from this Alpine and go into node-runtime,
# which start-wekan.sh puts on LD_LIBRARY_PATH, as the glibc bundle does with
# libatomic.
runtime="$root/bundle/node-runtime"
mkdir -p "$runtime"
for lib in libstdc++.so.6 libgcc_s.so.1; do
  src="$(readlink -f "/usr/lib/$lib" 2>/dev/null || true)"
  [ -f "$src" ] || { echo "::error::this Alpine has no /usr/lib/$lib (apk add libstdc++ libgcc)."; exit 1; }
  cp "$src" "$runtime/$lib"
done
{
  echo "libstdc++.so.6 and libgcc_s.so.1 are GCC's runtime libraries, copied from"
  echo "Alpine Linux $(cat /etc/alpine-release 2>/dev/null || echo '(unknown)') packages:"
  apk info -v libstdc++ libgcc 2>/dev/null | sed 's/^/  /' || true
  echo
  echo "License: GPL-3.0-or-later WITH GCC-exception-3.1"
  echo "  https://www.gnu.org/licenses/gpl-3.0.txt"
  echo "  https://www.gnu.org/licenses/gcc-exception-3.1.txt"
  echo "Source: https://gitlab.alpinelinux.org/alpine/aports/-/tree/master/main/gcc"
  echo "  and https://gcc.gnu.org/"
} > "$runtime/NOTICE-libstdc++-libgcc.txt"
chmod +x "$root/bundle/node" "$root/bundle/ferretdb"
touch "$root/bundle/.ferretdb-default"

node "$root/releases/platform-native-packages.mjs" "$root/bundle" linux "$arch" --libc musl
node "$root/releases/check-addon-arch.mjs" "$root/bundle" "$arch" --platform linux --libc musl
# sharp must load here, with its musl package: thumbnails depend on it. It is
# an application package, so it resolves from programs/server/npm.
(cd "$server/npm" && "$root/bundle/node" -e 'require("sharp"); console.log("sharp loads on musl")')
bash "$root/releases/bsd/smoke.sh" "$root/bundle"
