#!/usr/bin/env bash
# Start a finished bundle the way a user does (./start-wekan.sh, which starts
# the bundled FerretDB on SQLite and WeKan on the bundled Node.js) and require
# WeKan to answer HTTP on its port. Used by releases/bsd/build-bundle.sh.
#
#   bash releases/bsd/smoke.sh <bundle dir> [port]
set -euo pipefail
. "$(dirname "${BASH_SOURCE[0]}")/../tools-env.sh"   # temporary files and downloads go to .tools/tmp
bundle="$(cd "${1:?usage: smoke.sh <bundle dir> [port]}" && pwd)"
port="${2:-3123}"
work="$(mktemp -d "$TMPDIR/wekan-smoke.XXXXXX")"
log="$work/start-wekan.log"
(
  cd "$bundle"
  PORT="$port" ROOT_URL="http://127.0.0.1:$port" WRITABLE_PATH="$work" \
    FERRETDB_LISTEN_ADDR="127.0.0.1:$((port + 1))" \
    exec ./start-wekan.sh
) > "$log" 2>&1 &
pid=$!
# Stop the whole stack, WAIT for it to be gone, and then remove its files.
# start-wekan.sh runs WeKan in the foreground, and bash runs a TERM trap only
# after the foreground command returns - so killing the script alone left
# node and FerretDB running after this test said OK. v12.96 openbsd-arm64:
# FerretDB closed its database while the VM's copyback rsync was walking the
# workspace, wekan.sqlite-wal and -shm vanished under it, and rsync's exit 24
# failed a bundle that had built and started fine. Nothing may still be
# running, or still be on disk under .tools/tmp, when this script returns.
running() { kill -0 "$pid" 2>/dev/null || pgrep -f "$bundle/(ferretdb|main\.js)" >/dev/null 2>&1; }
stop() {
  kill "$pid" 2>/dev/null || true
  pkill -f "$bundle/main\.js" 2>/dev/null || true
  pkill -f "$bundle/ferretdb" 2>/dev/null || true
  local n=0
  while running && [ "$n" -lt 30 ]; do sleep 1; n=$((n + 1)); done
  if running; then
    kill -9 "$pid" 2>/dev/null || true
    pkill -9 -f "$bundle/(ferretdb|main\.js)" 2>/dev/null || true
    sleep 1
  fi
  wait "$pid" 2>/dev/null || true
  rm -rf "$work"
}
trap stop EXIT
for i in $(seq 1 120); do
  if ! kill -0 "$pid" 2>/dev/null; then
    echo "::error::start-wekan.sh exited before WeKan answered. Its log:"
    cat "$log"
    exit 1
  fi
  if code="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$port/" 2>/dev/null)" && [ "$code" = 200 ]; then
    echo "OK: WeKan answered HTTP 200 on port $port after ${i}x2 s."
    tail -n 20 "$log"
    exit 0
  fi
  sleep 2
done
echo "::error::WeKan did not answer HTTP 200 on port $port within 240 s. The log:"
cat "$log"
exit 1
