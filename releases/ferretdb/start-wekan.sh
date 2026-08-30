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
# is required. See docs/Platforms/Propietary/OS/Windows/Offline.md for the Windows
# equivalent (start-wekan.bat).
#
# Override anything via environment variables: WRITABLE_PATH, PORT, ROOT_URL,
# MONGO_URL, FERRETDB_LISTEN_ADDR, WEKAN_DB (mongodb|ferretdb). Point MONGO_URL at
# an external MongoDB/FerretDB (or set WEKAN_DB=mongodb) to skip the bundled one.
# ─────────────────────────────────────────────────────────────────────────────
set -eu

# ── DDP transport ────────────────────────────────────────────────────────────
# WeKan ships NO uWebSockets.js on any platform: ddp-server requires that module
# only inside the uws transport's setup(), which a sockjs server never calls,
# and it is 121M of prebuilt binaries for OS/CPU/ABI combinations one machine
# cannot use. uws is also not reliable enough yet to be what a default points
# at. A deployment whose compose file or config still says uws would otherwise
# die on a missing module, so it is coerced here - loudly, so the log says why
# the setting did not take - rather than left to crash-loop.
if [ "${DDP_TRANSPORT:-}" = "uws" ]; then
  echo "WeKan: DDP_TRANSPORT=uws is not available in this build - it ships no uWebSockets.js. Using sockjs."
  DDP_TRANSPORT=sockjs
fi
export DDP_TRANSPORT="${DDP_TRANSPORT:-sockjs}"

DIR="$(cd "$(dirname "$0")" && pwd)"

# Bundled Node.js, falling back to a node on PATH if the bundled one is absent.
NODE="$DIR/node"
[ -x "$NODE" ] || NODE="$(command -v node || true)"
[ -n "$NODE" ] || { echo "ERROR: no bundled ./node and no node found on PATH" >&2; exit 1; }

# Bound the two bundled runtimes relative to available RAM; explicit overrides win.
_memory_mb=$(awk '/^MemTotal:/{print int($2/1024)}' /proc/meminfo 2>/dev/null || echo 2048)
for _f in /sys/fs/cgroup/memory.max /sys/fs/cgroup/memory/memory.limit_in_bytes; do [ -r "$_f" ] || continue; _b=$(cat "$_f" 2>/dev/null || true); case "$_b" in ''|max|*[!0-9]*) continue;; esac; _m=$((_b/1048576)); [ "$_m" -gt 0 ] && [ "$_m" -lt "$_memory_mb" ] && _memory_mb=$_m; break; done
_heap_mb=$((_memory_mb*3/5)); [ "$_heap_mb" -gt 4096 ] && _heap_mb=4096
# A 32-bit Node has only a 4 GiB virtual address space for the executable,
# shared libraries, stacks and V8. Asking it for the 4 GiB 64-bit ceiling can
# make V8 die while deserializing its startup snapshot, before main.js runs.
# `file` describes the binary itself (unlike getconf/uname, which describe the
# host and are 64-bit when an i386 bundle runs on x86_64).
if command -v file >/dev/null 2>&1 && file "$NODE" | grep -q 'ELF 32-bit'; then
  [ "$_heap_mb" -gt 1024 ] && _heap_mb=1024
fi
_go_mb=$((_memory_mb/5)); [ "$_go_mb" -gt 1024 ] && _go_mb=1024
export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=$_heap_mb}"
export GOMEMLIMIT="${GOMEMLIMIT:-${_go_mb}MiB}"
echo "WeKan memory budget: Node ${_heap_mb} MiB; FerretDB Go ${_go_mb} MiB; available ${_memory_mb} MiB."
FERRETDB_BIN="$DIR/ferretdb"
export WRITABLE_PATH="${WRITABLE_PATH:-$DIR/data}"
# Files layout: <files>/attachments, <files>/avatars, <files>/db (FerretDB SQLite).
# WeKan appends "files" to WRITABLE_PATH unless it already ends with it (matching
# server/initializeDirs.js).
case "$WRITABLE_PATH" in */files) FILES="$WRITABLE_PATH" ;; *) FILES="$WRITABLE_PATH/files" ;; esac
FERRETDB_SQLITE_DIR="${FERRETDB_SQLITE_DIR:-$FILES/db}"
eval "$("$NODE" "$DIR/startup-network.cjs" posix --ferretdb)"
# EXPORTING NEEDS THE API, and that is not obvious from the name.
#
# Every export in the interface - a board or a card to PDF, Excel, JSON, .zip,
# CSV, or any of the "export for another tool" formats - is a download from an
# `/api/...` address, and server/apiMiddleware.js refuses every one of those
# unless WITH_API is exactly "true". So on a bundle started without it, clicking
# "PDF" saved WeKan's own HTML page under the name `<card>.pdf`: the request was
# redirected to `/`, and the browser wrote whatever came back to the file the
# download link had named.
#
# The snap has defaulted this to true for years (snap-src/bin/config), and every
# docker-compose*.yml in this repository sets it. This launcher was the one
# platform that did not, which is why the bundle was the one platform where
# exporting produced an HTML file. Set WITH_API=false to turn the REST API - and
# with it the exports - off.
export WITH_API="${WITH_API:-true}"

# Card loading: 'all' (default, every card into the browser) or 'lazy' (each list
# loads only the visible cards on demand — for boards with thousands of cards).
# Also changeable at runtime in Admin Panel / Features.
export CARDS_LOADING="${CARDS_LOADING:-auto}"

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

# FerretDB v1 SQLite is standalone and polling-only. Replica sets and OpLog
# tailing belong to real MongoDB deployments. #6467/#6468: Meteor's defaults (re-poll
# 50 ms after any write, at least every 10 s) hammer the database; calmer defaults
# re-poll at most every 2 s / 30 s. Overridable by exporting values before running.
if [ "$want_ferret" = true ]; then
  export METEOR_POLLING_THROTTLE_MS="${METEOR_POLLING_THROTTLE_MS:-2000}"
  export METEOR_POLLING_INTERVAL_MS="${METEOR_POLLING_INTERVAL_MS:-30000}"
  unset MONGO_OPLOG_URL
  export METEOR_REACTIVITY_ORDER="polling"
  export DEFAULT_METEOR_REACTIVITY_ORDER="polling"
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
    # #6492 recovery: perform a REQUESTED restore before FerretDB opens the files, when
    # the live database has been detected corrupt (WEKAN_FORCE_RESTORE env or a
    # RESTORE_REQUESTED marker containing backup/prev/remigrate). Copies a known-good
    # backup INTO the live database (dropping stale WAL side-files); backups are never
    # deleted and the main wekan.sqlite is only overwritten, never removed. Recorded for
    # Admin Panel / Problems / Recovery.
    _restore_mode="${WEKAN_FORCE_RESTORE:-}"
    if [ -z "$_restore_mode" ] && [ -f "$FERRETDB_SQLITE_DIR/RESTORE_REQUESTED" ]; then
      _restore_mode="$(head -n1 "$FERRETDB_SQLITE_DIR/RESTORE_REQUESTED" 2>/dev/null | tr -cd 'a-z')"
    fi
    if [ -n "$_restore_mode" ] && [ -n "$FERRETDB_SQLITE_DIR" ]; then
      _rbk="$FERRETDB_SQLITE_DIR/backup"; _rsrc=""
      case "$_restore_mode" in
        backup) [ -f "$_rbk/wekan.sqlite" ] && _rsrc="$_rbk" ;;
        prev)   [ -f "$_rbk/prev/wekan.sqlite" ] && _rsrc="$_rbk/prev" ;;
      esac
      _ts="$(date -u +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || echo '')"
      printf 'recovery %s\n' "$_restore_mode" > "$FERRETDB_SQLITE_DIR/RECOVERY_IN_PROGRESS" 2>/dev/null || true
      if [ -n "$_rsrc" ]; then
        rm -f "$FERRETDB_SQLITE_DIR/wekan.sqlite-wal" "$FERRETDB_SQLITE_DIR/wekan.sqlite-shm"
        cp -f "$_rsrc"/wekan.sqlite* "$FERRETDB_SQLITE_DIR/" 2>/dev/null || true
        printf '{"type":"restore-%s","db":"wekan","severity":"warning","source":"startup","detail":"Restored wekan.sqlite from a backup copy","ts":"%s"}\n' \
          "$_restore_mode" "$_ts" >> "$FERRETDB_SQLITE_DIR/recovery-events.jsonl" 2>/dev/null || true
        echo "Recovery: restored text-data database from $_rsrc."
      elif [ "$_restore_mode" = "remigrate" ]; then
        printf '{"type":"remigrate","db":"wekan","severity":"warning","source":"startup","detail":"Re-migration of text data from MongoDB requested","ts":"%s"}\n' \
          "$_ts" >> "$FERRETDB_SQLITE_DIR/recovery-events.jsonl" 2>/dev/null || true
        echo "Recovery: re-migration from MongoDB requested."
      fi
      rm -f "$FERRETDB_SQLITE_DIR/RESTORE_REQUESTED"
    fi
    # #6492 safety: rotating backup of the TEXT-DATA database (wekan.sqlite*) into a
    # "backup" subfolder of the same data dir, so a known copy is ready to restore if
    # the live database is ever detected corrupt. Made at rest, before FerretDB opens
    # the files. Only ever COPIES from the live database (never moved/deleted) and only
    # wekan.sqlite* (attachments/avatars live on the filesystem). The previous backup
    # is kept under backup/prev. Set WEKAN_SQLITE_BACKUP=false to disable.
    if [ "${WEKAN_SQLITE_BACKUP:-true}" = "true" ] && [ -n "$FERRETDB_SQLITE_DIR" ] && [ -f "$FERRETDB_SQLITE_DIR/wekan.sqlite" ]; then
      _bk="$FERRETDB_SQLITE_DIR/backup"
      mkdir -p "$_bk"
      if [ -f "$_bk/wekan.sqlite" ]; then
        rm -rf "$_bk/prev"; mkdir -p "$_bk/prev"
        cp -f "$_bk"/wekan.sqlite* "$_bk/prev/" 2>/dev/null || true
      fi
      cp -f "$FERRETDB_SQLITE_DIR"/wekan.sqlite* "$_bk/" 2>/dev/null || true
      echo "Backed up text-data database (wekan.sqlite*) to $_bk (previous kept in $_bk/prev)."
      printf '{"type":"backup-created","db":"wekan","severity":"info","source":"startup","detail":"Backed up wekan.sqlite to backup/","ts":"%s"}\n' \
        "$(date -u +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || echo '')" >> "$FERRETDB_SQLITE_DIR/recovery-events.jsonl" 2>/dev/null || true
    fi
    echo "WeKan startup: ROOT_URL=$ROOT_URL; PORT=$PORT; FerretDB=localhost:${FERRETDB_LISTEN_ADDR##*:}; MONGO_URL=$MONGO_URL"
    echo "Starting bundled FerretDB v1 (SQLite) on $FERRETDB_LISTEN_ADDR (data: $FERRETDB_SQLITE_DIR) ..."
    ${CPU_EXEC:+"$CPU_EXEC"} "$FERRETDB_BIN" \
      --handler=sqlite \
      --sqlite-url="file:$FERRETDB_SQLITE_DIR/" \
      --listen-addr="$FERRETDB_LISTEN_ADDR" \
      --telemetry=disable \
      --log-level=error &
    FERRET_PID=$!
  else
    echo "Using external database at $MONGO_URL (not starting bundled FerretDB)."
  fi

  # #6492: if a recovery is in progress, briefly serve the static "recovering data" page
  # on $PORT while the just-restored FerretDB comes back up, then start WeKan (whose
  # in-app recovery spinner, driven by the same RECOVERY_IN_PROGRESS marker, then takes
  # over until the server has verified the database healthy and cleared the marker). The
  # bridge is time-bounded so it can never block WeKan, and is skipped if its page or the
  # marker is absent.
  if [ -f "$FERRETDB_SQLITE_DIR/RECOVERY_IN_PROGRESS" ] && [ -f "$DIR/recovery-bridge.mjs" ]; then
    _rgrace="${WEKAN_RECOVERY_BRIDGE_SECONDS:-20}"
    echo "Recovery in progress: bridging with the recovery page for up to ${_rgrace}s before starting WeKan."
    PORT="$PORT" PRODUCT_NAME="${PRODUCT_NAME:-WeKan}" "$NODE" "$DIR/recovery-bridge.mjs" &
    _rpid=$!
    _rw=0
    while [ -f "$FERRETDB_SQLITE_DIR/RECOVERY_IN_PROGRESS" ] && [ "$_rw" -lt "$_rgrace" ]; do
      sleep 2; _rw=$((_rw + 2))
    done
    kill "$_rpid" 2>/dev/null || true
    wait "$_rpid" 2>/dev/null || true
  fi
  echo "Starting WeKan on $ROOT_URL (port $PORT), files under $WRITABLE_PATH ..."
  ${CPU_EXEC:+"$CPU_EXEC"} "$NODE" "$DIR/main.js" || true

  stop_ferret
  FERRET_PID=""
  echo "WeKan exited; restarting in 3 seconds... (Ctrl-C to stop)"
  sleep 3
done
