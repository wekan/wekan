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

if [ "$want_ferret" = true ]; then
  if [ ! -x "$FERRETDB_BIN" ]; then
    echo "ERROR: FerretDB requested but $FERRETDB_BIN is missing/not executable." >&2
    exit 1
  fi
  export MONGO_URL="${MONGO_URL:-mongodb://$FERRETDB_LISTEN_ADDR/wekan}"
  mkdir -p "$FERRETDB_SQLITE_DIR"
  # #6480/#6481: FerretDB v1 now ships an OpLog (auto-created capped
  # local.oplog.rs + replica-set hello handshake), launched below with
  # --repl-set-name. By default WeKan's Meteor TAILS the OpLog instead of
  # poll-and-diff — the main fix for FerretDB's high CPU on busy boards. Set
  # WEKAN_FERRETDB_OPLOG=false to force the old polling-only behaviour.
  WEKAN_FERRETDB_OPLOG="${WEKAN_FERRETDB_OPLOG:-true}"
  REPL_SET_NAME="${WEKAN_FERRETDB_REPL_SET:-rs0}"
  if [ "$WEKAN_FERRETDB_OPLOG" = "true" ]; then
    export MONGO_OPLOG_URL="${MONGO_OPLOG_URL:-mongodb://$FERRETDB_LISTEN_ADDR/local?replicaSet=$REPL_SET_NAME}"
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
  else
    # FerretDB has no change streams; polling-only here, but still strip any
    # changeStreams that was passed in so it can never enter the order.
    _reactivity="${METEOR_REACTIVITY_ORDER:-polling}"
    _reactivity="$(printf '%s' "${_reactivity}" | tr ',' '\n' | grep -vixE 'changeStreams?' | tr '\n' ',' | sed 's/,,*/,/g; s/^,//; s/,$//')"
    [ -z "${_reactivity}" ] && _reactivity="polling"
    export METEOR_REACTIVITY_ORDER="${_reactivity}"
    export DEFAULT_METEOR_REACTIVITY_ORDER="polling"
  fi
  # Telemetry off: --telemetry=disable both disables AND locks it (FerretDB won't
  # let it be re-enabled). DO_NOT_TRACK/FERRETDB_TELEMETRY are belt-and-suspenders.
  export DO_NOT_TRACK=1 FERRETDB_TELEMETRY=disable
  echo "Starting bundled FerretDB v1 (SQLite) on $FERRETDB_LISTEN_ADDR (replSet $REPL_SET_NAME, OpLog enabled) ..."
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
      --repl-set-name="$REPL_SET_NAME" \
      --telemetry=disable \
      --log-level=error &
  else
    "$FERRETDB_BIN" \
      --handler=sqlite \
      --sqlite-url="file:$FERRETDB_SQLITE_DIR/" \
      --listen-addr="$FERRETDB_LISTEN_ADDR" \
      --repl-set-name="$REPL_SET_NAME" \
      --telemetry=disable \
      --log-level=error &
  fi
  FERRET_PID=$!
  trap 'kill "$FERRET_PID" 2>/dev/null || true' EXIT INT TERM
fi

ulimit -s 65500
if [ -x /build/cpu-exec ]; then
  exec /build/cpu-exec node /build/main.js
fi
exec node /build/main.js
