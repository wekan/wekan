#!/bin/sh
# ─────────────────────────────────────────────────────────────────────────────
# Self-contained WeKan launcher (Linux / macOS).
#
# Everything needed to run WeKan offline is inside this bundle: the WeKan server
# (main.js), a bundled Node.js (./node) and a bundled FerretDB v1 with its
# embedded SQLite backend (./ferretdb). Just run:
#
#     ./start-wekan.sh
#
# By default it starts FerretDB v1 (SQLite) as the database, storing all data —
# and attachments/avatars on the filesystem — under WRITABLE_PATH (./data next to
# this script unless you set WRITABLE_PATH). No separate MongoDB or Node install
# is required. See docs/Platforms/Propietary/Windows/Offline.md for the Windows
# equivalent (start-wekan.bat).
#
# Override anything via environment variables: WRITABLE_PATH, PORT, ROOT_URL,
# MONGO_URL, FERRETDB_LISTEN_ADDR, WEKAN_DB (mongodb|ferretdb). Point MONGO_URL at
# an external MongoDB/FerretDB (or set WEKAN_DB=mongodb) to skip the bundled one.
# ─────────────────────────────────────────────────────────────────────────────
set -eu

DIR="$(cd "$(dirname "$0")" && pwd)"

# Bundled Node.js, falling back to a node on PATH if the bundled one is absent.
NODE="$DIR/node"
[ -x "$NODE" ] || NODE="$(command -v node || true)"
[ -n "$NODE" ] || { echo "ERROR: no bundled ./node and no node found on PATH" >&2; exit 1; }

FERRETDB_BIN="$DIR/ferretdb"
export WRITABLE_PATH="${WRITABLE_PATH:-$DIR/data}"
# Files layout: <files>/attachments, <files>/avatars, <files>/db (FerretDB SQLite).
# WeKan appends "files" to WRITABLE_PATH unless it already ends with it (matching
# server/initializeDirs.js).
case "$WRITABLE_PATH" in */files) FILES="$WRITABLE_PATH" ;; *) FILES="$WRITABLE_PATH/files" ;; esac
FERRETDB_SQLITE_DIR="${FERRETDB_SQLITE_DIR:-$FILES/db}"
FERRETDB_LISTEN_ADDR="${FERRETDB_LISTEN_ADDR:-127.0.0.1:27017}"
export PORT="${PORT:-8080}"
export ROOT_URL="${ROOT_URL:-http://localhost:$PORT}"
export MONGO_URL="${MONGO_URL:-mongodb://$FERRETDB_LISTEN_ADDR/wekan}"
# Card loading: 'all' (default, every card into the browser) or 'lazy' (each list
# loads only the visible cards on demand — for boards with thousands of cards).
# Also changeable at runtime in Admin Panel / Features.
export CARDS_LOADING="${CARDS_LOADING:-all}"

# Store attachments and avatars on the filesystem (default), next to the DB.
mkdir -p "$FILES/attachments" "$FILES/avatars" "$FERRETDB_SQLITE_DIR"

# Backend selection: FerretDB by default. WEKAN_DB=mongodb (or a MONGO_URL pointed
# at some other host) runs WeKan against that external database instead.
want_ferret=true
case "${WEKAN_DB:-}" in
  mongodb) want_ferret=false ;;
  ferretdb|"") want_ferret=true ;;
  *) echo "ERROR: WEKAN_DB must be 'mongodb' or 'ferretdb' (got '${WEKAN_DB}')" >&2; exit 1 ;;
esac
case "$MONGO_URL" in *"$FERRETDB_LISTEN_ADDR"*) : ;; *) want_ferret=false ;; esac

[ "$want_ferret" != true ] || [ -x "$FERRETDB_BIN" ] || {
  echo "ERROR: bundled FerretDB not found at $FERRETDB_BIN" >&2; exit 1; }

ulimit -s 65500 2>/dev/null || true

# Run the bundled FerretDB (this platform's ./ferretdb) and WeKan (./main.js on
# the bundled ./node) together in a restart loop: start FerretDB in the
# background, run WeKan in the foreground, and if WeKan exits, stop FerretDB and
# restart the whole stack. Ctrl-C stops both and exits.
FERRET_PID=""
stop_ferret() { [ -n "$FERRET_PID" ] && kill "$FERRET_PID" 2>/dev/null || true; }
trap 'stop_ferret; exit 0' INT TERM

while true; do
  if [ "$want_ferret" = true ]; then
    export DO_NOT_TRACK=1 FERRETDB_TELEMETRY=disable
    echo "Starting bundled FerretDB v1 (SQLite) on $FERRETDB_LISTEN_ADDR (data: $FERRETDB_SQLITE_DIR) ..."
    "$FERRETDB_BIN" \
      --handler=sqlite \
      --sqlite-url="file:$FERRETDB_SQLITE_DIR/" \
      --listen-addr="$FERRETDB_LISTEN_ADDR" \
      --telemetry=disable \
      --log-level=error &
    FERRET_PID=$!
  else
    echo "Using external database at $MONGO_URL (not starting bundled FerretDB)."
  fi

  echo "Starting WeKan on $ROOT_URL (port $PORT), files under $WRITABLE_PATH ..."
  "$NODE" "$DIR/main.js" || true

  stop_ferret
  FERRET_PID=""
  echo "WeKan exited; restarting in 3 seconds... (Ctrl-C to stop)"
  sleep 3
done
