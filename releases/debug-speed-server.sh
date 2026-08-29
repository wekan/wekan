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
BRIDGE_PID=''
WEKAN_PID=''
WATCH_PID=''
TAIL_PID=''
FERRET_GROUP=false
BRIDGE_GROUP=false
WEKAN_GROUP=false
WATCH_GROUP=false
TAIL_GROUP=false
CLEANED_UP=false

stop_process() {
  local pid="$1"
  local owns_group="$2"
  [ -n "$pid" ] || return 0
  if kill -0 "$pid" 2>/dev/null; then
    # Services are started in their own sessions when setsid is available. Stop
    # the whole group so Meteor's node/mongod children cannot survive Ctrl-C.
    if [ "$owns_group" = true ]; then
      kill -- "-$pid" 2>/dev/null || true
    else
      kill "$pid" 2>/dev/null || true
    fi
  fi
}

cleanup() {
  [ "$CLEANED_UP" = false ] || return 0
  CLEANED_UP=true
  trap - EXIT INT TERM
  echo 'Stopping instrumentation, WeKan and database ...'
  stop_process "$WATCH_PID" "$WATCH_GROUP"
  stop_process "$TAIL_PID" "$TAIL_GROUP"
  stop_process "$WEKAN_PID" "$WEKAN_GROUP"
  stop_process "$BRIDGE_PID" "$BRIDGE_GROUP"
  stop_process "$FERRET_PID" "$FERRET_GROUP"
  for pid in "$WATCH_PID" "$TAIL_PID" "$WEKAN_PID" "$BRIDGE_PID" "$FERRET_PID"; do
    [ -n "$pid" ] && wait "$pid" 2>/dev/null || true
  done
  echo "Diagnostics saved in $LOG_DIR"
}

start_migration_dashboard() {
  local product=WeKan
  local cache="$WRITABLE_PATH/.productname.txt"
  if [ -s "$cache" ]; then
    IFS= read -r product <"$cache" || product=WeKan
    [ -n "$product" ] || product=WeKan
  fi
  echo "Serving $product Migration Progress at $ROOT_URL while FerretDB prepares indexes."
  start_isolated env PORT="$WEKAN_PORT" PRODUCT_NAME="$product" \
    WEKAN_BRIDGE_REASON=migration \
    "$METEOR_BIN" node "$WEKAN_DIR/releases/ferretdb/recovery-bridge.mjs" \
    >"$LOG_DIR/migration-dashboard.log" 2>&1
  BRIDGE_PID=$STARTED_PID
  BRIDGE_GROUP=$STARTED_GROUP
}

stop_migration_dashboard() {
  [ -n "$BRIDGE_PID" ] || return 0
  stop_process "$BRIDGE_PID" "$BRIDGE_GROUP"
  wait "$BRIDGE_PID" 2>/dev/null || true
  BRIDGE_PID=''
  BRIDGE_GROUP=false
}
interrupted() { cleanup; exit 130; }
trap cleanup EXIT
trap interrupted INT TERM

start_isolated() {
  if command -v setsid >/dev/null 2>&1; then
    setsid "$@" &
    STARTED_GROUP=true
  else
    "$@" &
    STARTED_GROUP=false
  fi
  STARTED_PID=$!
}

wait_for_ferretdb() {
  local timeout="${DEBUGSPEED_FERRETDB_READY_TIMEOUT:-1800}"
  local started=$SECONDS
  local last_report=$SECONDS
  case "$timeout" in *[!0-9]*|'') echo 'FerretDB readiness timeout must be seconds.' >&2; return 2 ;; esac

  echo "Waiting for FerretDB readiness (timeout: ${timeout}s) ..."
  while true; do
    if ! kill -0 "$FERRET_PID" 2>/dev/null; then
      echo "FerretDB exited before becoming ready. See $LOG_DIR/ferretdb.log" >&2
      return 1
    fi
    if (exec 3<>"/dev/tcp/127.0.0.1/$FERRET_PORT") 2>/dev/null; then
      echo 'FerretDB is ready; starting WeKan.'
      return 0
    fi
    if (( SECONDS - started >= timeout )); then
      echo "FerretDB was not ready after ${timeout}s. See $LOG_DIR/ferretdb.log" >&2
      return 1
    fi
    if (( SECONDS - last_report >= 10 )); then
      echo 'FerretDB is still preparing its database; waiting before starting WeKan ...'
      last_report=$SECONDS
    fi
    sleep 1
  done
}

cd "$WEKAN_DIR"
export DEBUGSPEED=true
export DEBUG=true
export ROOT_URL="http://localhost:$WEKAN_PORT"
export PORT="$WEKAN_PORT"
export DDP_TRANSPORT=sockjs
export WRITABLE_PATH="${WRITABLE_PATH:-$WEKAN_DIR/.tools/debug-speed-files}"
export WITH_API=true
export RICHER_CARD_COMMENT_EDITOR=false
export DEBUGSPEED_LOG_FILE="$LOG_DIR/wekan-debugspeed.jsonl"
: >"$DEBUGSPEED_LOG_FILE"
chmod 600 "$DEBUGSPEED_LOG_FILE"
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
  echo "FerretDB diagnostics: $LOG_DIR/ferretdb.log"
  export FERRETDB_HANDLER=sqlite
  export FERRETDB_LOG_LEVEL="${DEBUGSPEED_FERRETDB_LOG_LEVEL:-info}"
  export FERRETDB_SQLITE_URL="file:$FERRET_STATE/"
  export FERRETDB_LISTEN_ADDR="127.0.0.1:$FERRET_PORT"
  export FERRETDB_TELEMETRY=disable
  start_isolated "$FERRET_DIR/bin/ferretdb" --repl-set-name=rs0 \
    >"$LOG_DIR/ferretdb.log" 2>&1
  FERRET_PID=$STARTED_PID
  FERRET_GROUP=$STARTED_GROUP
  start_migration_dashboard
  wait_for_ferretdb
  stop_migration_dashboard
  export MONGO_URL="mongodb://127.0.0.1:$FERRET_PORT/wekan?replicaSet=rs0"
  export MONGO_OPLOG_URL="mongodb://127.0.0.1:$FERRET_PORT/local?replicaSet=rs0"
  export DEFAULT_METEOR_REACTIVITY_ORDER=oplog,polling
  export METEOR_REACTIVITY_ORDER=oplog,polling
else
  # With no MONGO_URL, `meteor run` starts the MongoDB shipped in ~/.meteor.
  unset MONGO_URL MONGO_OPLOG_URL
  export DEFAULT_METEOR_REACTIVITY_ORDER=changeStreams,oplog,polling
  export METEOR_REACTIVITY_ORDER=changeStreams,oplog,polling
fi

echo "DEBUGSPEED=true; WeKan: $ROOT_URL; database: $DB_CHOICE"
echo "Logs: $LOG_DIR"
echo 'WeKan console output and structured measurements stay in this directory.'

start_isolated "$METEOR_BIN" run --port "$WEKAN_PORT" \
  >"$LOG_DIR/wekan.log" 2>&1
WEKAN_PID=$STARTED_PID
WEKAN_GROUP=$STARTED_GROUP

# The watcher is part of the supervised session. It samples host pressure and
# relevant process resource use, while DEBUGSPEED inside WeKan and FerretDB
# records application/query timings in their own logs.
FERRET_STATE="${FERRET_STATE:-$WRITABLE_PATH}"
export DEBUGSPEED_WATCH_PATH="$FERRET_STATE"
start_isolated "$WEKAN_DIR/releases/debug-speed-watch.sh" \
  >"$LOG_DIR/resources.tsv" 2>&1
WATCH_PID=$STARTED_PID
WATCH_GROUP=$STARTED_GROUP

# Follow service output in the terminal without making tee the owner of either
# service process. This keeps the real PIDs available for reliable cleanup.
start_isolated tail -n 0 -F "$LOG_DIR/wekan.log" \
  "$DEBUGSPEED_LOG_FILE" \
  ${FERRET_PID:+"$LOG_DIR/ferretdb.log"}
TAIL_PID=$STARTED_PID
TAIL_GROUP=$STARTED_GROUP

echo "Instrumentation: $LOG_DIR/resources.tsv"
echo "WeKan measurements: $DEBUGSPEED_LOG_FILE"
echo 'Press Ctrl-C once to stop instrumentation, WeKan and the database.'

while kill -0 "$WEKAN_PID" 2>/dev/null; do
  if [ -n "$FERRET_PID" ] && ! kill -0 "$FERRET_PID" 2>/dev/null; then
    echo 'FerretDB stopped unexpectedly; ending the diagnostic session.' >&2
    break
  fi
  sleep 1
done
