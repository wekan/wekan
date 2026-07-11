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
  # Telemetry off: --telemetry=disable both disables AND locks it (FerretDB won't
  # let it be re-enabled). DO_NOT_TRACK/FERRETDB_TELEMETRY are belt-and-suspenders.
  export DO_NOT_TRACK=1 FERRETDB_TELEMETRY=disable
  echo "Starting bundled FerretDB v1 (SQLite) on $FERRETDB_LISTEN_ADDR ..."
  "$FERRETDB_BIN" \
    --handler=sqlite \
    --sqlite-url="file:$FERRETDB_SQLITE_DIR/" \
    --listen-addr="$FERRETDB_LISTEN_ADDR" \
    --telemetry=disable \
    --log-level=error &
  FERRET_PID=$!
  trap 'kill "$FERRET_PID" 2>/dev/null || true' EXIT INT TERM
fi

ulimit -s 65500
exec node /build/main.js
