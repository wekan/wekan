#!/bin/sh
# ─────────────────────────────────────────────────────────────────────────────
# Self-contained WeKan launcher for architectures that have a Node.js 24 build
# but NO MongoDB Community server (ppc64le, s390x, riscv64).
#
# Instead of MongoDB it starts the bundled FerretDB v1 (the wekan/FerretDB fork,
# https://github.com/wekan/FerretDB) with its embedded pure-Go SQLite backend,
# which speaks the MongoDB wire protocol on 127.0.0.1:27017. WeKan then connects
# to it exactly as it would to mongod — no external database process required.
#
# This script is packaged INSIDE the bundle (next to main.js and the `ferretdb`
# binary) by the release workflow, so after unzipping wekan-<version>-<arch>.zip
# you can simply run:
#
#     ./bundle/start-wekan-ferretdb.sh
#
# Everything is overridable via environment variables (MONGO_URL, PORT, ROOT_URL,
# WRITABLE_PATH, FERRETDB_LISTEN_ADDR, FERRETDB_SQLITE_DIR). Point MONGO_URL at an
# external MongoDB/FerretDB to skip the bundled one.
# ─────────────────────────────────────────────────────────────────────────────
set -eu

DIR="$(cd "$(dirname "$0")" && pwd)"

FERRETDB_BIN="${FERRETDB_BIN:-$DIR/ferretdb}"
export WRITABLE_PATH="${WRITABLE_PATH:-$DIR/data}"
FERRETDB_SQLITE_DIR="${FERRETDB_SQLITE_DIR:-$WRITABLE_PATH/ferretdb-sqlite}"
FERRETDB_LISTEN_ADDR="${FERRETDB_LISTEN_ADDR:-127.0.0.1:27017}"

export PORT="${PORT:-8080}"
export ROOT_URL="${ROOT_URL:-http://localhost:$PORT}"
export MONGO_URL="${MONGO_URL:-mongodb://$FERRETDB_LISTEN_ADDR/wekan}"

mkdir -p "$WRITABLE_PATH" "$FERRETDB_SQLITE_DIR"

# Backend selection, consistent with the Docker entrypoint:
#   WEKAN_DB=mongodb  -> don't start FerretDB; run against external MONGO_URL.
#   WEKAN_DB=ferretdb -> start the bundled FerretDB (the default when unset, since
#                        running this script is itself the opt-in to FerretDB).
want_ferret=true
case "${WEKAN_DB:-}" in
  mongodb) want_ferret=false ;;
  ferretdb|"") want_ferret=true ;;
  *) echo "ERROR: WEKAN_DB must be 'mongodb' or 'ferretdb' (got '${WEKAN_DB}')" >&2; exit 1 ;;
esac
# A MONGO_URL pointed at some OTHER host is also treated as "use that database".
case "$MONGO_URL" in
  *"$FERRETDB_LISTEN_ADDR"*) : ;;
  *) want_ferret=false ;;
esac

if [ "$want_ferret" = true ]; then
  if [ ! -x "$FERRETDB_BIN" ]; then
    echo "ERROR: FerretDB binary not found or not executable at $FERRETDB_BIN" >&2
    exit 1
  fi
  # Telemetry off: --telemetry=disable both disables AND locks it (FerretDB won't
  # let it be re-enabled). DO_NOT_TRACK/FERRETDB_TELEMETRY are belt-and-suspenders.
  export DO_NOT_TRACK=1 FERRETDB_TELEMETRY=disable
  echo "Starting bundled FerretDB v1 (SQLite) on $FERRETDB_LISTEN_ADDR ..."
  "$FERRETDB_BIN" \
    --handler=sqlite \
    --sqlite-url="file:$FERRETDB_SQLITE_DIR/" \
    --listen-addr="$FERRETDB_LISTEN_ADDR" \
    --telemetry=disable &
  FERRET_PID=$!
  trap 'kill "$FERRET_PID" 2>/dev/null || true' EXIT INT TERM
else
  echo "Using external database at $MONGO_URL; not starting bundled FerretDB."
fi

# Match the Docker image's larger thread stack so deep recursions in the Meteor
# server don't overflow the default stack.
ulimit -s 65500 2>/dev/null || true

echo "Starting WeKan on port $PORT (MONGO_URL=$MONGO_URL) ..."
exec node "$DIR/main.js"
