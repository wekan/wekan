#!/usr/bin/env bash
# Run the FerretDB v1 query catalogue against every database this CPU can run,
# ONE AT A TIME, and compare the answers.
#
#   ./releases/db-conformance.sh
#
# FerretDB v1 stores MongoDB documents in SQLite, PostgreSQL, MySQL, MariaDB or
# SAP HANA. Each is a different translation of the same query into a different SQL
# dialect, so the question this answers is not "does it start" but "does
# {a: {$gt: 5}} return the same documents, in the same order, on all of them".
#
# What it does, in order:
#
#   1. makes sure the FerretDB source is here - cloning wekan/FerretDB if the
#      FerretDB subdirectory does not exist - and updates it;
#   2. BUILDS FerretDB v1 from that source (its own build.sh installs the Go
#      toolchain and downloads the module dependencies if they are missing), so
#      the tests run against the newest code, not a downloaded release;
#   3. for each backend whose database image exists for THIS CPU, starts that
#      database in a container, runs the freshly built FerretDB against it, runs
#      the whole query catalogue, and stops everything;
#   4. compares what every backend answered.
#
# Sequential on purpose: every backend uses the same FerretDB port, and a database
# under test should not be competing for CPU and disk with three others. On a slow
# machine this takes a while.
#
# Only the databases that HAVE an image for this CPU are run. The image is asked,
# not a table - `docker manifest inspect` decides - so the answer stays true as
# images change. On arm64 that is SQLite, PostgreSQL, MySQL and MariaDB; on
# ppc64le and s390x, SQLite, PostgreSQL and MariaDB; on riscv64, SQLite and
# PostgreSQL.
#
# SAP HANA is only included when WEKAN_CONFORMANCE_HANA=1 is set: its image is
# amd64-only, wants ~16 GB of RAM and tens of GB of disk, and needs SAP's licence
# accepted - not something to start because somebody picked a menu entry.
#
# Everything is written to log/<datetime>/, where every other WeKan test run
# writes.

set -uo pipefail

cd "$(dirname "$0")/.." || exit 1
WEKAN_DIR="$(pwd)"

RUN_TS="$(date '+%Y-%m-%d_%H-%M-%S')"
# One run, one directory: when build.sh's "EVERYTHING" is driving this, it passes
# the directory the whole run is writing to, so the WeKan suite, this and
# FerretDB's own tests end up together under log/<datetime>/.
# WEKAN_LOG_ROOT is resolved by build.sh to the ignored `.tools/log` directory.
# Standalone runs use that same repository-local path.
if [ -z "${WEKAN_LOG_ROOT:-}" ]; then
  WEKAN_LOG_ROOT=".tools/log"
fi
LOGDIR="${WEKAN_LOGDIR:-$WEKAN_LOG_ROOT/$RUN_TS}"
mkdir -p "$LOGDIR"
LOGDIR="$(cd "$LOGDIR" && pwd)"

# .tools/FerretDB: companion repos live in one ignored directory inside the
# checkout, instead of one ignored subdirectory each at the repo root.
FERRET_DIR="$WEKAN_DIR/.tools/FerretDB"
# The binary this script BUILDS and tests with: FerretDB/bin/ferretdb, never a
# downloaded release.
FERRET_BIN="$WEKAN_DIR/.tools/FerretDB/bin/ferretdb"
FERRET_REPO_SSH="git@github.com:wekan/FerretDB"
FERRET_REPO_HTTPS="https://github.com/wekan/FerretDB"

# backend | compose file it mirrors | service in that file | container port | handler
BACKENDS=(
  "sqlite|docker-compose.yml||0|sqlite"
  "postgresql|docker-compose-ferretdb-v1-postgresql.yml|postgres|5432|postgresql"
  "mysql|docker-compose-ferretdb-v1-mysql.yml|mysql|3306|mysql"
  "mariadb|docker-compose-ferretdb-v1-mariadb.yml|mariadb|3306|mysql"
  "sap-hana|docker-compose-ferretdb-v1-sap-hana.yml|hana|39017|hana"
)

# The image a compose file uses for its database service. Read from the file, so
# the two can never name different versions of the same database.
image_of() {
  local file="$1" service="$2"
  awk -v svc="  $service:" '
    $0 == svc { inside = 1; next }
    inside && /^  [a-z]/ { inside = 0 }
    inside && $1 == "image:" { print $2; exit }
  ' "$file"
}

host_platform() {
  case "$(uname -m)" in
    x86_64|amd64)  echo "amd64" ;;
    aarch64|arm64) echo "arm64" ;;
    ppc64le)       echo "ppc64le" ;;
    s390x)         echo "s390x" ;;
    riscv64)       echo "riscv64" ;;
    loongarch64)   echo "loong64" ;;
    *)             uname -m ;;
  esac
}

# Does this image have a build for this CPU? An image we cannot ask about counts
# as NOT available: better to skip a backend than to hang on a container that can
# never start.
# 0 = has this CPU, 1 = does not, 2 = could not ask (no network, not logged in,
# interrupted). The caller says which of those happened, because "we could not
# ask" and "the image does not exist for this CPU" are different facts and only
# one of them is about the image.
image_has_platform() {
  local out
  out="$(docker manifest inspect "$1" 2>&1)" || return 2
  printf '%s' "$out" | grep -q "\"architecture\": \"$2\"" && return 0
  return 1
}

PLATFORM="$(host_platform)"
echo "=========================================================================="
echo "FerretDB v1 conformance: the same queries, on every database this CPU runs."
echo "CPU:        $(uname -s) $(uname -m)  ->  linux/$PLATFORM"
echo "Logs:       $LOGDIR/"
echo "Sequential: one database at a time."
echo "=========================================================================="
echo

command -v docker >/dev/null 2>&1 || { echo "ERROR: docker not found - it starts the databases." >&2; exit 1; }
command -v git    >/dev/null 2>&1 || { echo "ERROR: git not found - it fetches the FerretDB source." >&2; exit 1; }
command -v node   >/dev/null 2>&1 || { echo "ERROR: node not found - it runs the query catalogue." >&2; exit 1; }
if [ ! -d node_modules/mongodb ]; then
  echo "ERROR: the mongodb driver is missing (node_modules/mongodb)." >&2
  echo "       ./build.sh -> Setup -> Install dependencies installs it." >&2
  exit 1
fi

# ── 1. the FerretDB source ──────────────────────────────────────────────────
if [ ! -d "$FERRET_DIR/.git" ]; then
  echo "---- FerretDB source is not in .tools/; cloning wekan/FerretDB ----"
  mkdir -p "$(dirname "$FERRET_DIR")"
  if ! git clone "$FERRET_REPO_SSH" "$FERRET_DIR" 2>&1 | tee -a "$LOGDIR/db-conformance-build.log"; then
    echo "SSH clone failed (no key for github.com?); trying HTTPS."
    git clone "$FERRET_REPO_HTTPS" "$FERRET_DIR" 2>&1 | tee -a "$LOGDIR/db-conformance-build.log" || {
      echo "ERROR: could not clone FerretDB from $FERRET_REPO_SSH or $FERRET_REPO_HTTPS." >&2
      exit 1
    }
  fi
else
  echo "---- FerretDB source: updating ----"
  if [ -n "$(git -C "$FERRET_DIR" status --porcelain)" ]; then
    echo "NOTE: $FERRET_DIR has local changes - building them as they are, not pulling."
  else
    git -C "$FERRET_DIR" pull --ff-only 2>&1 | tee -a "$LOGDIR/db-conformance-build.log" \
      || echo "NOTE: could not pull; building the checkout as it is."
  fi
fi
echo "FerretDB at $(git -C "$FERRET_DIR" rev-parse --short HEAD 2>/dev/null || echo '?')"

# ── 2. build it ─────────────────────────────────────────────────────────────
# FerretDB's build action installs the Go toolchain when it is missing and `go
# build` downloads only the modules needed by the binary. Do not precede it with
# `deps`: that action downloads every dependency of the root, integration and
# tools modules, although conformance has not started those test suites yet.
# EVERYTHING runs those suites in the following stage, where Go can fetch their
# dependencies on demand. Keeping the Go cache makes either fetch a one-time cost.
echo
echo "---- Building FerretDB v1 from source ----"
( cd "$FERRET_DIR" && ./build.sh build ) 2>&1 \
  | tee -a "$LOGDIR/db-conformance-build.log"
if [ ! -x "$FERRET_BIN" ]; then
  echo "ERROR: the build produced no $FERRET_BIN - see $LOGDIR/db-conformance-build.log" >&2
  exit 1
fi
echo "Built: $FERRET_BIN"
"$FERRET_BIN" --version 2>&1 | tee -a "$LOGDIR/db-conformance-build.log" || true
echo

SUMMARY="$LOGDIR/db-conformance-summary.txt"
: > "$SUMMARY"
ran=0
skipped=0

# Ports, chosen so this can run WHILE something else is running. 27017 is where a
# dev server's database lives and where the compose files publish FerretDB, so
# using it would either fail to bind or - worse - point these tests at somebody
# else's database and rewrite it. Defaults are well away from that, each is
# overridable, and each is moved on if it is busy anyway.
#
#   WEKAN_CONFORMANCE_PORT     FerretDB itself     (default 37017)
#   WEKAN_CONFORMANCE_DB_PORT  the database server (default 35432)
#
# There is a THIRD port, and it is the one that bit: FerretDB also opens a debug
# handler for metrics and profiling, at 127.0.0.1:8088 by default, and it EXITS
# when that address is taken. Nothing here uses it, but every backend died with
#
#   Failed to create debug handler ... listen tcp 127.0.0.1:8088: bind: address
#   already in use
#   ERROR sqlite  FerretDB did not start on this backend
#
# because an unrelated FerretDB was running on the machine. Choosing a free port
# for it would work; not opening it at all is better, since the run never asks it
# anything - so every launch below passes `--debug-addr=-`, which is how
# FerretDB's main.go spells "no debug handler".
#
# is_free: a port nothing is listening on. bash's /dev/tcp needs no extra tools;
# a refused connection means free.
is_free() {
  ! (exec 3<>"/dev/tcp/127.0.0.1/$1") 2>/dev/null
}
free_port() {
  local port="$1" tries=0
  while ! is_free "$port"; do
    port=$((port + 1)); tries=$((tries + 1))
    [ "$tries" -gt 200 ] && { echo "$1"; return 1; }
  done
  echo "$port"
}

FERRET_PORT="$(free_port "${WEKAN_CONFORMANCE_PORT:-37017}")"
DB_HOST_PORT_BASE="${WEKAN_CONFORMANCE_DB_PORT:-35432}"

# A run that was interrupted (Ctrl-C, a killed terminal, a machine that went to
# sleep) leaves its database container behind, still holding the published port -
# and the next run then reported "container did not start" for every database that
# needed one, which reads as a broken image and is not. These containers are this
# script's own, named wekan-conformance-db-<run timestamp>, so removing them is
# safe: a `docker compose up` stack is named wekan-postgres / wekan-ferretdb and is
# never touched.
stale="$(docker ps -aq --filter 'name=^wekan-conformance-db-' 2>/dev/null || true)"
if [ -n "$stale" ]; then
  echo "Removing containers left behind by an earlier run: $(echo "$stale" | tr '\n' ' ')"
  # shellcheck disable=SC2086
  docker rm -f $stale >/dev/null 2>&1 || true
fi
# One container name per run, so a stack somebody started with `docker compose up`
# - which names its containers wekan-postgres, wekan-ferretdb ... - is never
# stopped or reused by this.
CONTAINER="wekan-conformance-db-$RUN_TS"

echo "Ports:      FerretDB on 127.0.0.1:$FERRET_PORT (nothing else is using it)"
echo

cleanup() {
  [ -n "${FERRET_PID:-}" ] && kill "$FERRET_PID" 2>/dev/null
  docker rm -f "$CONTAINER" >/dev/null 2>&1
}
# Ctrl-C must END the run. Without the explicit exit, the interrupt only killed
# whatever was in the foreground - a `docker manifest inspect`, a sleep - and the
# loop carried on to the next backend, reporting the interrupted check as "no
# image for this CPU", which is a lie about the image.
on_interrupt() {
  echo
  echo "Interrupted - stopping."
  cleanup
  exit 130
}
trap cleanup EXIT
trap on_interrupt INT TERM

for entry in "${BACKENDS[@]}"; do
  IFS='|' read -r name file service port handler <<< "$entry"
  log="$LOGDIR/db-conformance-$name.log"

  # SAP HANA only on purpose (see the note at the top).
  if [ "$name" = "sap-hana" ] && [ "${WEKAN_CONFORMANCE_HANA:-0}" != "1" ]; then
    echo "SKIP  sap-hana     (needs ~16 GB RAM and SAP's licence; set WEKAN_CONFORMANCE_HANA=1 to include)"
    echo "SKIP  sap-hana  not requested" >> "$SUMMARY"
    skipped=$((skipped + 1))
    continue
  fi

  image=""
  if [ -n "$service" ]; then
    image="$(image_of "$file" "$service")"
    if [ -z "$image" ]; then
      echo "SKIP  $name  (no image found for service '$service' in $file)"
      echo "SKIP  $name  no image in $file" >> "$SUMMARY"
      skipped=$((skipped + 1))
      continue
    fi
    printf 'Checking %-12s %-45s ' "$name" "$image"
    image_has_platform "$image" "$PLATFORM"
    case $? in
      0) echo "has linux/$PLATFORM" ;;
      1) echo "NO linux/$PLATFORM - skipping"
         echo "SKIP  $name  $image has no linux/$PLATFORM" >> "$SUMMARY"
         skipped=$((skipped + 1)); continue ;;
      *) echo "could not ask the registry - skipping"
         echo "SKIP  $name  could not inspect $image (network? docker login?)" >> "$SUMMARY"
         skipped=$((skipped + 1)); continue ;;
    esac
  else
    echo "Checking sqlite       embedded in FerretDB                       always available"
  fi

  echo
  echo "---- $name: starting the database ----"
  docker rm -f "$CONTAINER" >/dev/null 2>&1

  # Start the container, and when the published port turns out to be taken after
  # all, move to the next free one and try again. `free_port` looks a moment
  # BEFORE `docker run`, and in that moment the previous database's container may
  # still be releasing the port it had - which is exactly what made a run report
  # "container did not start" for two databases whose images were fine.
  start_db_container() {
    local attempt
    for attempt in 1 2 3 4 5; do
      if docker run -d --name "$CONTAINER" -p "127.0.0.1:$hostport:$port" "$@" >>"$log" 2>&1; then
        return 0
      fi

      if ! grep -q 'address already in use' "$log"; then
        return 1                      # a real failure: report it as one
      fi

      docker rm -f "$CONTAINER" >/dev/null 2>&1
      hostport=$((hostport + 1))
      hostport="$(free_port "$hostport")"
      echo "  port was taken; retrying on 127.0.0.1:$hostport" | tee -a "$log"
      sleep 1
    done

    return 1
  }
  # The container's own port is fixed (5432, 3306, 39017); what it is published as
  # on THIS machine is not, so a PostgreSQL you already run keeps its 5432.
  hostport="$(free_port "$DB_HOST_PORT_BASE")"
  url=""
  case "$name" in
    sqlite)
      data="$(mktemp -d)"
      url="file:$data/"
      ;;
    postgresql)
      start_db_container \
        -e POSTGRES_USER=ferretdb -e POSTGRES_PASSWORD=ferretdb_secret \
        -e POSTGRES_DB=ferretdb "$image" \
        || { echo "ERROR $name  container did not start" >> "$SUMMARY"; continue; }
      url="postgres://ferretdb:ferretdb_secret@127.0.0.1:$hostport/ferretdb"
      ;;
    mysql)
      start_db_container \
        -e MYSQL_DATABASE=ferretdb -e MYSQL_USER=ferretdb -e MYSQL_PASSWORD=ferretdb_secret \
        -e MYSQL_ROOT_PASSWORD=ferretdb_root_secret "$image" \
        || { echo "ERROR $name  container did not start" >> "$SUMMARY"; continue; }
      # root, for the same reason as the compose file: FerretDB CREATES a SQL
      # database per MongoDB database, which a per-database grant cannot allow.
      url="mysql://root:ferretdb_root_secret@127.0.0.1:$hostport/ferretdb"
      ;;
    mariadb)
      start_db_container \
        -e MARIADB_DATABASE=ferretdb -e MARIADB_USER=ferretdb -e MARIADB_PASSWORD=ferretdb_secret \
        -e MARIADB_ROOT_PASSWORD=ferretdb_root_secret "$image" \
        || { echo "ERROR $name  container did not start" >> "$SUMMARY"; continue; }
      # root, for the same reason as the compose file: FerretDB CREATES a SQL
      # database per MongoDB database, which a per-database grant cannot allow.
      url="mysql://root:ferretdb_root_secret@127.0.0.1:$hostport/ferretdb"
      ;;
    sap-hana)
      mkdir -p "$WEKAN_DIR/hana-config"
      [ -f "$WEKAN_DIR/hana-config/password.json" ] || \
        printf '{"master_password":"HXEHana1"}' > "$WEKAN_DIR/hana-config/password.json"
      chmod 600 "$WEKAN_DIR/hana-config/password.json"
      start_db_container \
        --ulimit nofile=1048576:1048576 \
        -v "$WEKAN_DIR/hana-config:/hana/password:ro" "$image" \
        --passwords-url file:///hana/password/password.json --agree-to-sap-license \
        || { echo "ERROR $name  container did not start" >> "$SUMMARY"; continue; }
      url="hdb://SYSTEM:HXEHana1@127.0.0.1:$hostport?databaseName=HXE"
      ;;
  esac

  if [ -n "$service" ]; then
    echo -n "waiting for the database to accept connections "
    up=0
    for _ in $(seq 1 120); do
      # Ask the SERVER, not the container: a container can be running long before
      # its database is initialised, and starting FerretDB early only produces a
      # confusing connection error.
      case "$name" in
        postgresql) docker exec "$CONTAINER" pg_isready -U ferretdb -d ferretdb >/dev/null 2>&1 && up=1 ;;
        mysql)      docker exec "$CONTAINER" mysqladmin ping -h 127.0.0.1 -u root -pferretdb_root_secret --silent >/dev/null 2>&1 && up=1 ;;
        mariadb)    docker exec "$CONTAINER" healthcheck.sh --connect --innodb_initialized >/dev/null 2>&1 && up=1 ;;
        sap-hana)   docker logs "$CONTAINER" 2>&1 | grep -q "Startup finished" && up=1 ;;
      esac
      [ "$up" -eq 1 ] && break
      printf '.'
      sleep 5
    done
    echo
    if [ "$up" -ne 1 ]; then
      echo "ERROR $name: the database never became ready (see $log)"
      docker logs "$CONTAINER" >>"$log" 2>&1
      echo "ERROR $name  database never ready" >> "$SUMMARY"
      docker rm -f "$CONTAINER" >/dev/null 2>&1
      continue
    fi
  fi

  echo "---- $name: starting the FerretDB we just built ----"
  case "$handler" in
    sqlite)     "$FERRET_BIN" --handler=sqlite --sqlite-url="$url" \
                  --listen-addr=127.0.0.1:$FERRET_PORT --repl-set-name=rs0 \
                  --telemetry=disable --debug-addr=- --log-level=error >>"$log" 2>&1 & ;;
    postgresql) "$FERRET_BIN" --handler=postgresql --postgresql-url="$url" \
                  --listen-addr=127.0.0.1:$FERRET_PORT --repl-set-name=rs0 \
                  --telemetry=disable --debug-addr=- --log-level=error >>"$log" 2>&1 & ;;
    mysql)      "$FERRET_BIN" --handler=mysql --mysql-url="$url" \
                  --listen-addr=127.0.0.1:$FERRET_PORT --repl-set-name=rs0 \
                  --telemetry=disable --debug-addr=- --log-level=error >>"$log" 2>&1 & ;;
    hana)       "$FERRET_BIN" --handler=hana --hana-url="$url" \
                  --listen-addr=127.0.0.1:$FERRET_PORT --repl-set-name=rs0 \
                  --telemetry=disable --debug-addr=- --log-level=error >>"$log" 2>&1 & ;;
  esac
  FERRET_PID=$!

  echo -n "waiting for FerretDB "
  up=0
  for _ in $(seq 1 60); do
    if PORT="$FERRET_PORT" node -e '
      const {MongoClient}=require("mongodb");
      new MongoClient("mongodb://127.0.0.1:"+process.env.PORT,{serverSelectionTimeoutMS:1500})
        .connect().then(c=>c.close()).then(()=>process.exit(0)).catch(()=>process.exit(1));
    ' >/dev/null 2>&1; then up=1; break; fi
    kill -0 "$FERRET_PID" 2>/dev/null || break   # it died; the log says why
    printf '.'
    sleep 2
  done
  echo
  if [ "$up" -ne 1 ]; then
    echo "ERROR $name: FerretDB did not accept a connection on this backend."
    # Say WHY here, not just where to look: the reason is usually one line, and a
    # startup panic (a stale build/version, a URL it cannot parse) is answered
    # from that line alone.
    echo "----- last 15 lines of $log -----"
    tail -n 15 "$log" 2>/dev/null | sed 's/^/  /'
    echo "---------------------------------"
    echo "ERROR $name  FerretDB did not start on this backend" >> "$SUMMARY"
    kill "$FERRET_PID" 2>/dev/null; FERRET_PID=""
    docker rm -f "$CONTAINER" >/dev/null 2>&1
    continue
  fi

  echo "---- $name: running the query catalogue ----"
  node tests/dbConformance/run.cjs --uri "mongodb://127.0.0.1:$FERRET_PORT" \
      --label "$name" --out "$LOGDIR" 2>&1 | tee -a "$log"
  rc=${PIPESTATUS[0]}
  if [ "$rc" -eq 0 ]; then
    ran=$((ran + 1)); echo "RAN   $name" >> "$SUMMARY"
  else
    echo "ERROR $name  the catalogue could not be run" >> "$SUMMARY"
  fi

  echo "---- $name: stopping ----"
  kill "$FERRET_PID" 2>/dev/null; wait "$FERRET_PID" 2>/dev/null; FERRET_PID=""
  if [ -n "$service" ]; then
    docker logs "$CONTAINER" >>"$log" 2>&1
    docker rm -f "$CONTAINER" >/dev/null 2>&1
  fi
  echo
done

echo "=========================================================================="
echo "Ran $ran backend(s); skipped $skipped for lack of an image on linux/$PLATFORM."
echo

if [ "$ran" -eq 0 ]; then
  echo "Nothing ran, so there is nothing to compare. See $LOGDIR/."
  exit 1
fi

node tests/dbConformance/compare.cjs --dir "$LOGDIR" --reference sqlite 2>&1 | tee -a "$SUMMARY"
rc=${PIPESTATUS[0]}

echo
echo "All results: $LOGDIR/"
echo "  db-conformance-build.log        cloning and building FerretDB"
echo "  db-conformance-<backend>.json   what each backend answered"
echo "  db-conformance-<backend>.log    that backend's database + FerretDB output"
echo "  db-conformance-report.md        where they agree and where they do not"
exit "$rc"
