#!/usr/bin/env bash
# Start a finished bundle the way a user does (./start-wekan.sh, which starts
# the bundled FerretDB on SQLite and WeKan on the bundled Node.js) and require
# WeKan to answer HTTP on its port. Used by releases/bsd/build-bundle.sh.
#
#   bash releases/bsd/smoke.sh <bundle dir> [port]
set -euo pipefail
bundle="$(cd "${1:?usage: smoke.sh <bundle dir> [port]}" && pwd)"
port="${2:-3123}"
work="$(mktemp -d "${TMPDIR:-/tmp}/wekan-smoke.XXXXXX")"
log="$work/start-wekan.log"
(
  cd "$bundle"
  PORT="$port" ROOT_URL="http://127.0.0.1:$port" WRITABLE_PATH="$work" \
    FERRETDB_LISTEN_ADDR="127.0.0.1:$((port + 1))" \
    exec ./start-wekan.sh
) > "$log" 2>&1 &
pid=$!
stop() { kill "$pid" 2>/dev/null || true; pkill -f "$bundle/ferretdb" 2>/dev/null || true; }
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
