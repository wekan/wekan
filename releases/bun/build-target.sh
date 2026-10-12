#!/usr/bin/env bash
set -euo pipefail
root=$(pwd)
export TMPDIR="$root/.tools/tmp"
mkdir -p "$TMPDIR"
: "${TARGET:?}" "${TARGET_PLATFORM:?}" "${TARGET_ARCH:?}" "${RELEASE_TAG:?}"
node releases/bun/rebuild.mjs bundle
binary=./bundle/bun
[ "$TARGET_PLATFORM" != win32 ] || binary=./bundle/bun.exe
"$binary" releases/bun/check-native.mjs "$root/bundle" "$TARGET_PLATFORM" "$TARGET_ARCH"
if [ -n "${BUN_SMOKE_MONGO_URL:-}" ]; then
  node releases/bun/live-smoke.mjs bundle
else
  node releases/bun/smoke.mjs bundle
fi
cp releases/bun/start-wekan.sh releases/bun/start-wekan.cmd bundle/
chmod +x bundle/start-wekan.sh
cp releases/bun/README.md bundle/README-bun.md
python3 releases/bun/assets.py package "$RELEASE_TAG" "$TARGET"
