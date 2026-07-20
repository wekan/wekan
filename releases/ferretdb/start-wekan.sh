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

# #6480/#6481: FerretDB v1 now ships an OpLog (auto-created capped local.oplog.rs
# + replica-set hello handshake — the ferretdb below is launched with
# --repl-set-name). By default WeKan's Meteor TAILS the OpLog instead of
# poll-and-diff, the main fix for FerretDB's high CPU on busy boards. Set
# WEKAN_FERRETDB_OPLOG=false to force the old polling-only behaviour.
# The polling settings remain the FALLBACK for queries Meteor cannot observe via
# the OpLog. #6467/#6468: Meteor's defaults (re-poll 50 ms after any write, at
# least every 10 s) hammer the database; calmer defaults re-poll at most every
# 2 s / 30 s. Overridable by exporting different values before running this script.
WEKAN_FERRETDB_OPLOG="${WEKAN_FERRETDB_OPLOG:-true}"
WEKAN_FERRETDB_REPL_SET="${WEKAN_FERRETDB_REPL_SET:-rs0}"
FERRET_REPL_ARG=""
if [ "$want_ferret" = true ]; then
  export METEOR_POLLING_THROTTLE_MS="${METEOR_POLLING_THROTTLE_MS:-2000}"
  export METEOR_POLLING_INTERVAL_MS="${METEOR_POLLING_INTERVAL_MS:-30000}"
  if [ "$WEKAN_FERRETDB_OPLOG" = true ]; then
    FERRET_REPL_ARG="--repl-set-name=$WEKAN_FERRETDB_REPL_SET"
    export MONGO_OPLOG_URL="${MONGO_OPLOG_URL:-mongodb://$FERRETDB_LISTEN_ADDR/local?replicaSet=$WEKAN_FERRETDB_REPL_SET}"
    # Prefer OpLog but ALWAYS keep polling as the final fallback: Meteor uses
    # OpLog only when tailing actually works, otherwise polling — a broken/absent
    # OpLog never stops WeKan starting. Admin Panel / Version ("Reactivity mode")
    # shows which one is live.
    # FerretDB (v1 SQLite fork) does NOT implement MongoDB change streams: a
    # $changeStream aggregate returns "not implemented" and Meteor busy-loops
    # retrying it (high FerretDB CPU, cards never open). Force changeStreams out
    # of the reactivity order no matter how it was passed in, keeping oplog,polling.
    _reactivity="${METEOR_REACTIVITY_ORDER:-oplog,polling}"
    _reactivity="$(printf '%s' "${_reactivity}" | tr ',' '\n' | grep -vixE 'changeStreams?' | tr '\n' ',' | sed 's/,,*/,/g; s/^,//; s/,$//')"
    [ -z "${_reactivity}" ] && _reactivity="oplog,polling"
    export METEOR_REACTIVITY_ORDER="${_reactivity}"
    export DEFAULT_METEOR_REACTIVITY_ORDER="oplog,polling"
    echo "FerretDB OpLog enabled (polling fallback): MONGO_OPLOG_URL=$MONGO_OPLOG_URL METEOR_REACTIVITY_ORDER=$METEOR_REACTIVITY_ORDER"
  else
    # FerretDB has no change streams; polling-only here, but still strip any
    # changeStreams that was passed in so it can never enter the order.
    _reactivity="${METEOR_REACTIVITY_ORDER:-polling}"
    _reactivity="$(printf '%s' "${_reactivity}" | tr ',' '\n' | grep -vixE 'changeStreams?' | tr '\n' ',' | sed 's/,,*/,/g; s/^,//; s/,$//')"
    [ -z "${_reactivity}" ] && _reactivity="polling"
    export METEOR_REACTIVITY_ORDER="${_reactivity}"
    export DEFAULT_METEOR_REACTIVITY_ORDER="polling"
  fi
fi

# #6458: $DIR/cpu-exec runs a binary through the bundled same-arch qemu-user
# when the CPU lacks features the binary declares (WEKAN_REQUIRED_CPU_FEATURES,
# e.g. "x86_64=avx" for an external MongoDB 5+). node and ferretdb are baseline
# builds needing no special features, so with none declared this is a plain
# exec — but every binary launch here is feature-safe on every platform.
CPU_EXEC="$DIR/cpu-exec"
[ -x "$CPU_EXEC" ] || CPU_EXEC=""

while true; do
  if [ "$want_ferret" = true ]; then
    export DO_NOT_TRACK=1 FERRETDB_TELEMETRY=disable
    echo "Starting bundled FerretDB v1 (SQLite) on $FERRETDB_LISTEN_ADDR (data: $FERRETDB_SQLITE_DIR) ..."
    ${CPU_EXEC:+"$CPU_EXEC"} "$FERRETDB_BIN" \
      --handler=sqlite \
      --sqlite-url="file:$FERRETDB_SQLITE_DIR/" \
      --listen-addr="$FERRETDB_LISTEN_ADDR" \
      ${FERRET_REPL_ARG:+"$FERRET_REPL_ARG"} \
      --telemetry=disable \
      --log-level=error &
    FERRET_PID=$!
  else
    echo "Using external database at $MONGO_URL (not starting bundled FerretDB)."
  fi

  echo "Starting WeKan on $ROOT_URL (port $PORT), files under $WRITABLE_PATH ..."
  ${CPU_EXEC:+"$CPU_EXEC"} "$NODE" "$DIR/main.js" || true

  stop_ferret
  FERRET_PID=""
  echo "WeKan exited; restarting in 3 seconds... (Ctrl-C to stop)"
  sleep 3
done
