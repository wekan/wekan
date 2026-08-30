#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Docker entrypoint for the WeKan image — selects the database backend.
#
# Every arch's bundle now ships a `ferretdb` binary (the wekan/FerretDB v1 fork
# with the pure-Go SQLite backend), so FerretDB is available everywhere. Which
# backend actually starts is decided here:
#
#   WEKAN_DB=mongodb   -> never start FerretDB; use external MONGO_URL (a mongod
#                         or FerretDB container). Default on amd64/arm64.
#   WEKAN_DB=ferretdb  -> start the bundled FerretDB (SQLite) on 127.0.0.1:27017
#                         and point WeKan at it. Works on ANY arch.
#   (unset)            -> FerretDB if this image was built for a MongoDB-less arch
#                         (ppc64le/s390x/riscv64, marked by /build/.ferretdb-default)
#                         and MONGO_URL is unset; otherwise MongoDB (external).
#
# Whichever backend is chosen binds the same MongoDB wire-protocol address, so
# WeKan connects via the unchanged MONGO_URL either way.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

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

# Give V8 a deliberate share of the CONTAINER limit. Node 24's automatic
# cgroup heuristic capped a 1 GiB Helm pod at about 640 MiB; the server bundle
# can cross that while linking and creating its startup indexes, so v10.96+
# died before the first application log (#6606). Keep forty percent for native
# allocations (and the bundled FerretDB when this image runs it), cap the heap
# at the long-standing 4 GiB recommendation, and respect an administrator's
# NODE_OPTIONS unchanged.
if [ -z "${NODE_OPTIONS:-}" ] || [ -z "${GOMEMLIMIT:-}" ]; then
  _memory_bytes=""
  if [ -r /sys/fs/cgroup/memory.max ]; then _memory_bytes=$(cat /sys/fs/cgroup/memory.max 2>/dev/null || true)
  elif [ -r /sys/fs/cgroup/memory/memory.limit_in_bytes ]; then _memory_bytes=$(cat /sys/fs/cgroup/memory/memory.limit_in_bytes 2>/dev/null || true); fi
  case "$_memory_bytes" in ''|max|*[!0-9]*) _mem_kb=$(awk '/^MemTotal:/{print $2}' /proc/meminfo 2>/dev/null || true); case "$_mem_kb" in ''|*[!0-9]*) _mem_kb=2097152;; esac; _memory_bytes=$((_mem_kb*1024));; esac
  if [ -z "${NODE_OPTIONS:-}" ]; then
    _heap_mb=$((_memory_bytes/1024/1024*3/5)); [ "$_heap_mb" -gt 4096 ] && _heap_mb=4096
    export NODE_OPTIONS="--max-old-space-size=$_heap_mb"
    echo "WeKan: Node heap limit ${_heap_mb} MiB (60% of available memory, capped at 4096 MiB)."
  fi
  if [ -z "${GOMEMLIMIT:-}" ]; then
    _go_mb=$((_memory_bytes/1024/1024/5)); [ "$_go_mb" -gt 1024 ] && _go_mb=1024
    export GOMEMLIMIT="${_go_mb}MiB"
  fi
fi

FERRETDB_BIN="/build/ferretdb"
FERRETDB_MARKER="/build/.ferretdb-default"
FERRETDB_LISTEN_ADDR="${FERRETDB_LISTEN_ADDR:-127.0.0.1:27017}"
# FerretDB SQLite lives at <files>/db, next to attachments/avatars. WeKan appends
# "files" to WRITABLE_PATH unless it already ends with it (server/initializeDirs.js).
_wp="${WRITABLE_PATH:-/data}"
case "$_wp" in */files) _files="$_wp" ;; *) _files="$_wp/files" ;; esac
FERRETDB_SQLITE_DIR="${FERRETDB_SQLITE_DIR:-$_files/db}"

want_ferret=false
case "${WEKAN_DB:-}" in
  ferretdb) want_ferret=true ;;
  mongodb)  want_ferret=false ;;
  "")
    if [ -f "$FERRETDB_MARKER" ] && [ -z "${MONGO_URL:-}" ]; then
      want_ferret=true
    fi
    ;;
  *) echo "ERROR: WEKAN_DB must be 'mongodb' or 'ferretdb' (got '${WEKAN_DB}')" >&2; exit 1 ;;
esac

# Preserve explicit values. Otherwise choose the active IPv4 address and a free
# web port; when the bundled database is selected, choose a separate free
# loopback-only port and derive MONGO_URL from it.
if [ "$want_ferret" = true ]; then
  eval "$(node /build/startup-network.cjs posix --ferretdb)"
else
  eval "$(node /build/startup-network.cjs posix)"
fi

if [ "$want_ferret" = true ]; then
  if [ ! -x "$FERRETDB_BIN" ]; then
    echo "ERROR: FerretDB requested but $FERRETDB_BIN is missing/not executable." >&2
    exit 1
  fi
  export MONGO_URL="${MONGO_URL:-mongodb://$FERRETDB_LISTEN_ADDR/wekan}"
  mkdir -p "$FERRETDB_SQLITE_DIR"
  # Bundled FerretDB v1 SQLite is standalone and polling-only. Replica sets,
  # change streams and OpLog tailing are reserved for external MongoDB.
  unset MONGO_OPLOG_URL
  export METEOR_REACTIVITY_ORDER="polling"
  export DEFAULT_METEOR_REACTIVITY_ORDER="polling"
  # Telemetry off: --telemetry=disable both disables AND locks it (FerretDB won't
  # let it be re-enabled). DO_NOT_TRACK/FERRETDB_TELEMETRY are belt-and-suspenders.
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
  # "backup" subfolder of the same data dir, so a known copy is ready to restore if the
  # live database is ever detected corrupt. Made at rest, before FerretDB opens the
  # files. Only ever COPIES from the live database (never moved/deleted) and only
  # wekan.sqlite* (attachments/avatars live on the filesystem). The previous backup is
  # kept under backup/prev. Set WEKAN_SQLITE_BACKUP=false to disable.
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
  echo "Starting bundled FerretDB v1 (SQLite) on $FERRETDB_LISTEN_ADDR (standalone polling) ..."
  # #6458: /build/cpu-exec runs a binary through the bundled same-arch
  # qemu-user when the CPU lacks features the binary declares (via
  # WEKAN_REQUIRED_CPU_FEATURES, e.g. "x86_64=avx"). node and ferretdb are
  # baseline builds needing no special features, so with none declared this is
  # a plain exec — but every binary launch here is feature-safe.
  if [ -x /build/cpu-exec ]; then
    /build/cpu-exec "$FERRETDB_BIN" \
      --handler=sqlite \
      --sqlite-url="file:$FERRETDB_SQLITE_DIR/" \
      --listen-addr="$FERRETDB_LISTEN_ADDR" \
      --telemetry=disable \
      --log-level=error &
  else
    "$FERRETDB_BIN" \
      --handler=sqlite \
      --sqlite-url="file:$FERRETDB_SQLITE_DIR/" \
      --listen-addr="$FERRETDB_LISTEN_ADDR" \
      --telemetry=disable \
      --log-level=error &
  fi
  FERRET_PID=$!
  trap 'kill "$FERRET_PID" 2>/dev/null || true' EXIT INT TERM
fi

if [ "$want_ferret" = true ]; then
  echo "WeKan startup: ROOT_URL=$ROOT_URL; PORT=$PORT; FerretDB=localhost:${FERRETDB_LISTEN_ADDR##*:}; MONGO_URL=$MONGO_URL"
else
  echo "WeKan startup: ROOT_URL=$ROOT_URL; PORT=$PORT; external MONGO_URL=${MONGO_URL:-unset}"
fi

# #6492: if a recovery is in progress, briefly serve the static "recovering data" page
# on the web port while the just-restored FerretDB comes back up, then start WeKan (whose
# in-app recovery spinner, driven by the same RECOVERY_IN_PROGRESS marker, then takes over
# until the server has verified the database healthy and cleared the marker). Bounded so
# it can never block WeKan, and skipped if its page or the marker is absent.
if [ -f "$FERRETDB_SQLITE_DIR/RECOVERY_IN_PROGRESS" ] && [ -f /build/recovery-bridge.mjs ]; then
  _rgrace="${WEKAN_RECOVERY_BRIDGE_SECONDS:-20}"
  echo "Recovery in progress: bridging with the recovery page for up to ${_rgrace}s before starting WeKan."
  PORT="${PORT:-8080}" PRODUCT_NAME="${PRODUCT_NAME:-WeKan}" node /build/recovery-bridge.mjs &
  _rpid=$!
  _rw=0
  while [ -f "$FERRETDB_SQLITE_DIR/RECOVERY_IN_PROGRESS" ] && [ "$_rw" -lt "$_rgrace" ]; do
    sleep 2; _rw=$((_rw + 2))
  done
  kill "$_rpid" 2>/dev/null || true
  wait "$_rpid" 2>/dev/null || true
fi

# #6595: WAIT FOR THE DATABASE BEHIND A PAGE, not behind a closed port.
#
# WeKan does not open its web port until the database answers. In a container
# nothing else was listening while it waited, so a reverse proxy in front
# returned "Gateway timeout" - and that is the same symptom for two completely
# different faults: WeKan is broken, or the database has simply not come up yet.
# "We upgraded to 10.91 ... Gateway timeout appears" is that report. The snap
# has served a page for this since 10.91 (snap-src/bin/wekan-control); this is
# the container's half of it.
#
# The wait is NOT a timeout on the database: a database can take minutes to come
# up after an update, and giving up on it would be worse than waiting. What is
# bounded is the PAGE - once WeKan starts it needs the port - so after
# WEKAN_DB_WAIT_MAX_SECONDS the page stops and WeKan starts anyway and keeps
# waiting itself, exactly as before this. Set WEKAN_DB_WAIT_PAGE=false to keep
# the old behaviour.
if [ "${WEKAN_DB_WAIT_PAGE:-true}" = "true" ] && [ -f /build/db-ready.mjs ] \
   && [ -f /build/recovery-bridge.mjs ] && [ -n "${MONGO_URL:-}" ]; then
  _db_node_path="/build/programs/server/node_modules"
  # The FIRST probe's reason is printed, not discarded. It used to go to
  # /dev/null, so a MONGO_URL the driver refuses outright - a replica-set seed
  # list, say - looked exactly like a database that had not started yet, and the
  # log said "not answering" about a database that was answering everyone else.
  # The poll below stays quiet; one reason is a diagnosis, one every three
  # seconds is a wall of text.
  _db_why="$(NODE_PATH="$_db_node_path" node /build/db-ready.mjs "$MONGO_URL" 2>&1 >/dev/null)"
  NODE_PATH="$_db_node_path" node /build/db-ready.mjs "$MONGO_URL"
  _db_rc=$?
  # 0 = answering, 1 = not answering, 2 = the probe could not ask at all.
  #
  # 2 MUST NOT put a page in front of the database. "I could not ask" is not
  # evidence that anything is wrong, and a page shown on that basis hides a
  # perfectly healthy WeKan for ten minutes - which is exactly what a missing
  # driver did. Start WeKan; it waits for its own database as it always did.
  if [ "$_db_rc" = "2" ]; then
    echo "Cannot check whether the database is answering (${_db_why:-no reason given}); starting WeKan without the waiting page."
  elif [ "$_db_rc" != "0" ]; then
    _wait_max="${WEKAN_DB_WAIT_MAX_SECONDS:-600}"
    echo "The database is not answering yet; serving the 'waiting for database' page on port ${PORT:-8080} while it comes up."
    # The reason goes on the PAGE too. Whoever is waiting is looking at a
    # browser, not at `docker logs`, and the driver's own message names the host
    # it could not reach.
    WEKAN_BRIDGE_REASON=database WEKAN_BRIDGE_DETAIL="$_db_why" \
      PORT="${PORT:-8080}" PRODUCT_NAME="${PRODUCT_NAME:-WeKan}" \
      node /build/recovery-bridge.mjs &
    _dbpid=$!
    _dbw=0
    while [ "$_dbw" -lt "$_wait_max" ]; do
      sleep 3; _dbw=$((_dbw + 3))
      if NODE_PATH="$_db_node_path" node /build/db-ready.mjs "$MONGO_URL" 2>/dev/null; then
        echo "The database is answering; starting WeKan."
        break
      fi
    done
    if [ "$_dbw" -ge "$_wait_max" ]; then
      echo "The database has not answered in ${_wait_max}s; starting WeKan anyway, which will keep waiting for it."
      # The last reason, printed: after ten minutes of a page, "why" is the only
      # useful thing left to say.
      NODE_PATH="$_db_node_path" node /build/db-ready.mjs "$MONGO_URL" || true
    fi
    # The page holds the web port, so it has to be gone before WeKan binds it.
    kill "$_dbpid" 2>/dev/null || true
    wait "$_dbpid" 2>/dev/null || true
  fi
fi

ulimit -s 65500
if [ -x /build/cpu-exec ]; then
  exec /build/cpu-exec node /build/main.js
fi
exec node /build/main.js
