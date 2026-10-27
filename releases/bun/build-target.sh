#!/usr/bin/env bash
set -euo pipefail
. "$(dirname "${BASH_SOURCE[0]}")/../tools-env.sh"   # temporary files and downloads go to .tools/tmp
root=$(pwd)
export TMPDIR="$root/.tools/tmp"
mkdir -p "$TMPDIR"
: "${TARGET:?}" "${TARGET_PLATFORM:?}" "${TARGET_ARCH:?}" "${RELEASE_TAG:?}"
node releases/bun/rebuild.mjs bundle
node releases/bun/run-native-check.mjs "$root/bundle" "$TARGET_PLATFORM" "$TARGET_ARCH"
if [ -n "${BUN_SMOKE_MONGO_URL:-}" ]; then
  # The database was up when the workflow started it, a minute of building
  # ago. Make sure it still is, so a database that died is reported as that
  # and not as WeKan failing to start ("Topology is closed", v12.56).
  # It holds nothing but this smoke test's data, so a database that is gone is
  # replaced once - after its log is shown - rather than failing the bundle.
  if ! node releases/bun/wait-mongo.mjs "$BUN_SMOKE_MONGO_URL" 30; then
    command -v docker >/dev/null 2>&1 || exit 1
    docker ps -a --filter name=bun-smoke-mongo || true
    docker logs bun-smoke-mongo 2>&1 | tail -n 80 || true
    echo "::warning::the smoke-test MongoDB was gone; starting a new one once."
    docker rm -f bun-smoke-mongo >/dev/null 2>&1 || true
    docker run -d --name bun-smoke-mongo -p 127.0.0.1:27019:27017 mongo:8
    node releases/bun/wait-mongo.mjs "$BUN_SMOKE_MONGO_URL" 60 || exit 1
  fi
  node releases/bun/live-smoke.mjs bundle
else
  node releases/bun/smoke.mjs bundle
fi
cp releases/bun/start-wekan.sh releases/bun/start-wekan.cmd bundle/
chmod +x bundle/start-wekan.sh
cp releases/bun/README.md bundle/README-bun.md
python3 releases/bun/assets.py package "$RELEASE_TAG" "$TARGET"
