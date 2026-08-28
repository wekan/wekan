#!/usr/bin/env bash
# Start a local WeKan performance-diagnostics run against Meteor's development
# MongoDB or a FerretDB binary built from this checkout's companion repository.

set -euo pipefail

WEKAN_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FERRET_DIR="$WEKAN_DIR/.tools/FerretDB"
METEOR_BIN="${METEOR_BIN:-}"
if [ -z "$METEOR_BIN" ]; then
  if [ -x "$HOME/.meteor/meteor" ]; then
    METEOR_BIN="$HOME/.meteor/meteor"
  elif [ -x "$WEKAN_DIR/.tools/.meteor/meteor" ]; then
    # The repository sandbox instructions keep HOME-owned toolchains isolated
    # here. It is the same Meteor distribution, including its development MongoDB.
    METEOR_BIN="$WEKAN_DIR/.tools/.meteor/meteor"
  else
    METEOR_BIN="$HOME/.meteor/meteor"
  fi
fi

printf 'Database: [1] MongoDB bundled with Meteor  [2] FerretDB SQLite: '
read -r DB_CHOICE
case "$DB_CHOICE" in
  1|mongo|mongodb) DB_CHOICE=mongodb ;;
  2|ferret|ferretdb) DB_CHOICE=ferretdb ;;
  *) echo 'Choose 1 (MongoDB) or 2 (FerretDB).' >&2; exit 2 ;;
esac

printf 'WeKan localhost port [3000]: '
read -r WEKAN_PORT
WEKAN_PORT="${WEKAN_PORT:-3000}"
case "$WEKAN_PORT" in *[!0-9]*|'') echo 'Port must be a number.' >&2; exit 2 ;; esac
if (( WEKAN_PORT < 1024 || WEKAN_PORT > 65534 )); then
  echo 'Port must be between 1024 and 65534.' >&2; exit 2
fi

if [ ! -x "$METEOR_BIN" ]; then
  echo "Meteor executable not found at $METEOR_BIN" >&2
  echo 'Install Meteor under ~/.meteor or set METEOR_BIN.' >&2
  exit 1
fi

STAMP="$(date +%Y-%m-%d_%H-%M-%S)"
LOG_DIR="${DEBUGSPEED_LOG_DIR:-$WEKAN_DIR/.tools/log/$STAMP/debug-speed}"
mkdir -p "$LOG_DIR"
FERRET_PID=''
cleanup() {
  if [ -n "$FERRET_PID" ] && kill -0 "$FERRET_PID" 2>/dev/null; then
    kill "$FERRET_PID" 2>/dev/null || true
    wait "$FERRET_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

cd "$WEKAN_DIR"
export DEBUGSPEED=true
export DEBUG=true
export ROOT_URL="http://localhost:$WEKAN_PORT"
export PORT="$WEKAN_PORT"
export DDP_TRANSPORT=sockjs
export WRITABLE_PATH="${WRITABLE_PATH:-$WEKAN_DIR/.tools/debug-speed-files}"
export WITH_API=true
export RICHER_CARD_COMMENT_EDITOR=false
mkdir -p "$WRITABLE_PATH"

if [ "$DB_CHOICE" = ferretdb ]; then
  if [ ! -x "$FERRET_DIR/build.sh" ]; then
    echo "FerretDB checkout is missing at $FERRET_DIR" >&2
    exit 1
  fi
  FERRET_PORT="${DEBUGSPEED_FERRETDB_PORT:-37017}"
  FERRET_STATE="${DEBUGSPEED_FERRETDB_STATE:-$FERRET_DIR/state-debug-speed}"
  mkdir -p "$FERRET_STATE"
  echo 'Building FerretDB from .tools/FerretDB ...'
  "$FERRET_DIR/build.sh" build 2>&1 | tee "$LOG_DIR/ferretdb-build.log"
  echo "Starting FerretDB at 127.0.0.1:$FERRET_PORT (state: $FERRET_STATE)"
  DEBUGSPEED=true FERRETDB_HANDLER=sqlite \
    FERRETDB_SQLITE_URL="file:$FERRET_STATE/" \
    FERRETDB_LISTEN_ADDR="127.0.0.1:$FERRET_PORT" \
    FERRETDB_TELEMETRY=disable \
    "$FERRET_DIR/bin/ferretdb" > >(tee "$LOG_DIR/ferretdb.log") 2>&1 &
  FERRET_PID=$!
  export MONGO_URL="mongodb://127.0.0.1:$FERRET_PORT/wekan"
  unset MONGO_OPLOG_URL
  export DEFAULT_METEOR_REACTIVITY_ORDER=polling
  export METEOR_REACTIVITY_ORDER=polling
else
  # With no MONGO_URL, `meteor run` starts the MongoDB shipped in ~/.meteor.
  unset MONGO_URL MONGO_OPLOG_URL
  export DEFAULT_METEOR_REACTIVITY_ORDER=changeStreams,oplog,polling
  export METEOR_REACTIVITY_ORDER=changeStreams,oplog,polling
fi

echo "DEBUGSPEED=true; WeKan: $ROOT_URL; database: $DB_CHOICE"
echo "Logs: $LOG_DIR"
echo 'Open Admin Panel -> Problems -> Speed after signing in as an administrator.'

"$METEOR_BIN" run --port "$WEKAN_PORT" 2>&1 | tee "$LOG_DIR/wekan.log"
