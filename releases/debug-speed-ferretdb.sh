#!/usr/bin/env bash
# Start only FerretDB and its performance instrumentation. This is suitable for
# mongorestore: WeKan stays stopped and cannot contend for SQLite's write lock.

set -euo pipefail

WEKAN_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FERRET_DIR="$WEKAN_DIR/.tools/FerretDB"
STAMP="$(date +%Y-%m-%d_%H-%M-%S)"
LOG_DIR="${DEBUGSPEED_LOG_DIR:-$WEKAN_DIR/.tools/log/$STAMP/debug-speed}"
FERRET_PORT="${DEBUGSPEED_FERRETDB_PORT:-37017}"
FERRET_STATE="${DEBUGSPEED_FERRETDB_STATE:-$FERRET_DIR/state-debug-speed}"

FERRET_PID=''
WATCH_PID=''
TAIL_PID=''
FERRET_GROUP=false
WATCH_GROUP=false
TAIL_GROUP=false
CLEANED_UP=false

stop_process() {
  local pid="$1"
  local owns_group="$2"
  [ -n "$pid" ] || return 0
  if kill -0 "$pid" 2>/dev/null; then
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
  echo 'Stopping instrumentation and FerretDB ...'
  stop_process "$WATCH_PID" "$WATCH_GROUP"
  stop_process "$TAIL_PID" "$TAIL_GROUP"
  stop_process "$FERRET_PID" "$FERRET_GROUP"
  for pid in "$WATCH_PID" "$TAIL_PID" "$FERRET_PID"; do
    [ -n "$pid" ] && wait "$pid" 2>/dev/null || true
  done
  echo "Diagnostics saved in $LOG_DIR"
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

if [ ! -x "$FERRET_DIR/build.sh" ]; then
  echo "FerretDB checkout is missing at $FERRET_DIR" >&2
  exit 1
fi

mkdir -p "$LOG_DIR" "$FERRET_STATE"
cd "$WEKAN_DIR"

export DEBUGSPEED=true
export DEBUG=true
export FERRETDB_HANDLER=sqlite
export FERRETDB_LOG_LEVEL="${DEBUGSPEED_FERRETDB_LOG_LEVEL:-info}"
export FERRETDB_SQLITE_URL="file:$FERRET_STATE/"
export FERRETDB_LISTEN_ADDR="127.0.0.1:$FERRET_PORT"
export FERRETDB_TELEMETRY=disable

echo 'Building FerretDB from .tools/FerretDB ...'
"$FERRET_DIR/build.sh" build 2>&1 | tee "$LOG_DIR/ferretdb-build.log"

echo "Starting FerretDB at 127.0.0.1:$FERRET_PORT (state: $FERRET_STATE)"
echo "FerretDB diagnostics: $LOG_DIR/ferretdb.log"
start_isolated "$FERRET_DIR/bin/ferretdb" \
  >"$LOG_DIR/ferretdb.log" 2>&1
FERRET_PID=$STARTED_PID
FERRET_GROUP=$STARTED_GROUP

export DEBUGSPEED_WATCH_PATH="$FERRET_STATE"
start_isolated "$WEKAN_DIR/releases/debug-speed-watch.sh" \
  >"$LOG_DIR/resources.tsv" 2>&1
WATCH_PID=$STARTED_PID
WATCH_GROUP=$STARTED_GROUP

start_isolated tail -n 0 -F "$LOG_DIR/ferretdb.log"
TAIL_PID=$STARTED_PID
TAIL_GROUP=$STARTED_GROUP

echo "MongoDB URL: mongodb://127.0.0.1:$FERRET_PORT/wekan"
echo "Instrumentation: $LOG_DIR/resources.tsv"
echo 'WeKan is not running. Press Ctrl-C once to stop instrumentation and FerretDB.'

while kill -0 "$FERRET_PID" 2>/dev/null; do
  sleep 1
done

echo 'FerretDB stopped unexpectedly; ending the diagnostic session.' >&2
exit 1
