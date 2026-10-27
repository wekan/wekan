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
# MongoDB 6, 7, 8 and 9 run too - the real servers, from the official
# mongo:6.0, mongo:7 (the image docker-compose-mongodb-v7.yml runs WeKan with),
# mongo:8.0 and mongo:9.0 images, queried DIRECTLY with no FerretDB in between.
# All FerretDB backends can agree with each other and still all be wrong, and
# only a MongoDB beside them shows it: the first run with MongoDB found that
# FerretDB's $group handed every accumulator after the first an empty group.
# On a Linux kernel from 6.19 to 7.0.13 MongoDB refuses to start ("Linux kernel
# versions 6.19 and newer has a known incompatibility"); that is recorded as a
# SKIP with the reason, because it is the machine, not WeKan.
#
# SAP HANA is only included when WEKAN_CONFORMANCE_HANA=1 is set: its image is
# amd64-only, wants ~16 GB of RAM and tens of GB of disk, and needs SAP's licence
# accepted - not something to start because somebody picked a menu entry.
#
# Everything is written to log/<datetime>/, where every other WeKan test run
# writes.
#
# WEKAN_DB_SUITE=speedtest runs the SPEED TEST instead of the query catalogue -
# docs/Databases/FerretDB/1/SpeedTest/README.md - through these same databases,
# started the same way, and writes its Results.md. ./build.sh -> Tests -> Database
# speed test, and docs/Databases/FerretDB/1/SpeedTest/speedtest.sh, set it.

set -uo pipefail
. "$(dirname "${BASH_SOURCE[0]}")/tools-env.sh"   # temporary files and downloads go to .tools/tmp

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
SUITE="${WEKAN_DB_SUITE:-conformance}"
case "$SUITE" in
  conformance|speedtest) ;;
  *) echo "ERROR: WEKAN_DB_SUITE must be conformance or speedtest, not '$SUITE'." >&2; exit 1 ;;
esac
# db-conformance-<backend>.log / db-speedtest-<backend>.log
PREFIX="db-$SUITE"
if [ "$SUITE" = speedtest ]; then
  LOGDIR="${WEKAN_LOGDIR:-$WEKAN_LOG_ROOT/test-db-speedtest/$RUN_TS}"
else
  LOGDIR="${WEKAN_LOGDIR:-$WEKAN_LOG_ROOT/test-db-conformance/$RUN_TS}"
fi
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

# backend | compose file it mirrors (or image:<image>) | service | container port | handler
# The `mongodb` handler is MongoDB itself: no FerretDB is started for it.
BACKENDS=(
  "sqlite|docker-compose.yml||0|sqlite"
  "mongodb6|image:mongo:6.0|mongodb|27017|mongodb"
  "mongodb7|docker-compose-mongodb-v7.yml|wekandb|27017|mongodb"
  "mongodb8|image:mongo:8.0|mongodb|27017|mongodb"
  "mongodb9|image:mongo:9.0|mongodb|27017|mongodb"
  "postgresql|docker-compose-ferretdb-v1-postgresql.yml|postgres|5432|postgresql"
  "mysql|docker-compose-ferretdb-v1-mysql.yml|mysql|3306|mysql"
  "mariadb|docker-compose-ferretdb-v1-mariadb.yml|mariadb|3306|mysql"
  "sap-hana|docker-compose-ferretdb-v1-sap-hana.yml|hana|39017|hana"
  "ferretdb2|docker-compose-ferretdb-v2-postgresql.yml|postgres-documentdb|5432|ferretdb2"
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
  out="$(docker_exec manifest inspect "$1" 2>&1)" || return 2
  printf '%s' "$out" | grep -q "\"architecture\": \"$2\"" && return 0
  return 1
}

PLATFORM="$(host_platform)"
echo "=========================================================================="
if [ "$SUITE" = speedtest ]; then
  echo "WeKan database speed test: the common WeKan queries, on every database this CPU runs."
else
  echo "FerretDB v1 conformance: the same queries, on every database this CPU runs."
fi
echo "CPU:        $(uname -s) $(uname -m)  ->  linux/$PLATFORM"
echo "Logs:       $LOGDIR/"
echo "Sequential: one database at a time."
echo "=========================================================================="
echo

docker_available() {
  command -v docker >/dev/null 2>&1 && return 0
  command -v flatpak-spawn >/dev/null 2>&1 || return 1
  flatpak-spawn --host sh -lc 'command -v docker >/dev/null 2>&1' >/dev/null 2>&1
}

docker_exec() {
  if command -v docker >/dev/null 2>&1; then
    docker "$@"
  else
    flatpak-spawn --host docker "$@"
  fi
}

docker_available || {
  echo "ERROR: Docker is unavailable both locally and through flatpak-spawn --host." >&2
  exit 1
}
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
  if ! git clone "$FERRET_REPO_SSH" "$FERRET_DIR" 2>&1 | tee -a "$LOGDIR/$PREFIX-build.log"; then
    echo "SSH clone failed (no key for github.com?); trying HTTPS."
    git clone "$FERRET_REPO_HTTPS" "$FERRET_DIR" 2>&1 | tee -a "$LOGDIR/$PREFIX-build.log" || {
      echo "ERROR: could not clone FerretDB from $FERRET_REPO_SSH or $FERRET_REPO_HTTPS." >&2
      exit 1
    }
  fi
else
  echo "---- FerretDB source: updating ----"
  if [ -n "$(git -C "$FERRET_DIR" status --porcelain)" ]; then
    echo "NOTE: $FERRET_DIR has local changes - building them as they are, not pulling."
  else
    git -C "$FERRET_DIR" pull --ff-only 2>&1 | tee -a "$LOGDIR/$PREFIX-build.log" \
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
  | tee -a "$LOGDIR/$PREFIX-build.log"
if [ "${PIPESTATUS[0]}" -ne 0 ]; then
  echo "ERROR: FerretDB build failed - see $LOGDIR/$PREFIX-build.log" >&2
  exit 1
fi
if [ ! -x "$FERRET_BIN" ]; then
  echo "ERROR: the build produced no $FERRET_BIN - see $LOGDIR/$PREFIX-build.log" >&2
  exit 1
fi
echo "Built: $FERRET_BIN"
"$FERRET_BIN" --version 2>&1 | tee -a "$LOGDIR/$PREFIX-build.log" || true
echo

SUMMARY="$LOGDIR/$PREFIX-summary.txt"
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
#
# But only one whose run has ENDED. Each container and network carries the
# process id of the run that made it (OWNER_LABEL), and one whose run is still
# going - a speed test beside a conformance run, two terminals - is left alone:
# removing it as "left behind" killed the other run's database in the middle of
# its queries ("connection refused"), and both of its results were lost.
OWNER_LABEL_KEY="wekan.conformance.pid"
OWNER_LABEL="$OWNER_LABEL_KEY=$$"
# The command line comes from /proc on Linux; macOS and the BSDs have no /proc,
# where every live run looked dead and a second run removed its containers.
# ps -o command= gives the same line there.
command_line_of() {
  if [ -r "/proc/$1/cmdline" ]; then
    tr '\0' ' ' < "/proc/$1/cmdline" 2>/dev/null
  else
    ps -o command= -p "$1" 2>/dev/null
  fi
}
run_still_going() {
  local pid="$1"
  [ -n "$pid" ] && [ "$pid" != "$$" ] && kill -0 "$pid" 2>/dev/null &&
    command_line_of "$pid" | grep -q 'db-conformance\.sh'
}
left_behind() {
  local kind="$1" id owner
  shift
  for id in "$@"; do
    if [ "$kind" = network ]; then
      owner="$(docker_exec network inspect -f "{{index .Labels \"$OWNER_LABEL_KEY\"}}" "$id" 2>/dev/null || true)"
    else
      owner="$(docker_exec container inspect -f "{{index .Config.Labels \"$OWNER_LABEL_KEY\"}}" "$id" 2>/dev/null || true)"
    fi
    if run_still_going "$owner"; then
      echo "Keeping $id: its run (process $owner) is still going." >&2
    else
      echo "$id"
    fi
  done
}
# shellcheck disable=SC2046
stale="$(left_behind container $(docker_exec ps -aq --filter 'name=^wekan-conformance-db-' 2>/dev/null || true))"
if [ -n "$stale" ]; then
  echo "Removing containers left behind by an earlier run: $(echo "$stale" | tr '\n' ' ')"
  # shellcheck disable=SC2086
  docker_exec rm -fv $stale >/dev/null 2>&1 || true
fi
# shellcheck disable=SC2046
stale_nets="$(left_behind network $(docker_exec network ls -q --filter 'name=^wekan-conformance-db-' 2>/dev/null || true))"
if [ -n "$stale_nets" ]; then
  # shellcheck disable=SC2086
  docker_exec network rm $stale_nets >/dev/null 2>&1 || true
fi
# One container name per run, so a stack somebody started with `docker compose up`
# - which names its containers wekan-postgres, wekan-ferretdb ... - is never
# stopped or reused by this.
CONTAINER="wekan-conformance-db-$RUN_TS"

# A container's own /tmp is a few hundred megabytes of its writable layer, and
# a database writes its temporary files there (MySQL's and MariaDB's on-disk
# temporary tables, sort files). Each container's /tmp is this run's own
# directory under .tools/tmp instead, mode 1777 like /tmp, so the database's
# own user can write it. The container empties it before it is removed: on
# Linux the files belong to that user, whom the host cannot remove them as.
container_tmp() {
  local dir="$WEKAN_DIR/.tools/tmp/$PREFIX-$1-tmp"
  mkdir -p "$dir" && chmod 1777 "$dir"
  printf '%s\n' "$dir"
}
CONTAINER_TMP="$(container_tmp db)"
remove_container() {
  docker_exec exec "$1" sh -c 'rm -rf /tmp/* /tmp/.[!.]* 2>/dev/null' >/dev/null 2>&1
  docker_exec rm -fv "$1" >/dev/null 2>&1
}

echo "Ports:      FerretDB on 127.0.0.1:$FERRET_PORT (nothing else is using it)"
echo

cleanup() {
  [ -n "${FERRET_PID:-}" ] && kill "$FERRET_PID" 2>/dev/null
  remove_container "$CONTAINER"
  remove_ferretdb2
  remove_sqlite_data
  rmdir "$CONTAINER_TMP" "$FERRET2_TMP" 2>/dev/null
}

# FerretDB 2 runs as a container of its own beside its database, on a network
# of this run's own: wekan-conformance-db-<run>-ferretdb, -net.
FERRET2_CONTAINER="$CONTAINER-ferretdb"
FERRET2_NETWORK="$CONTAINER-net"
FERRET2_TMP="$(container_tmp ferretdb2)"
remove_ferretdb2() {
  remove_container "$FERRET2_CONTAINER"
  docker_exec network rm "$FERRET2_NETWORK" >/dev/null 2>&1
}

# The SQLite backend's data lives under .tools/tmp, not /tmp: the speed test's is
# gigabytes, and /tmp may be a small tmpfs - which would also make SQLite look
# faster than databases whose files are on disk. It is this run's own directory,
# removed when the backend is done.
SQLITE_DATA=""
remove_sqlite_data() {
  [ -n "$SQLITE_DATA" ] && [ -d "$SQLITE_DATA" ] && rm -rf -- "$SQLITE_DATA"
  SQLITE_DATA=""
}

# What each suite runs against one database, and how it compares them all.
run_suite() {
  local uri="$1" label="$2" engine="$3"
  if [ "$SUITE" = speedtest ]; then
    node docs/Databases/FerretDB/1/SpeedTest/run.cjs --uri "$uri" --label "$label" \
      --engine "$engine" --out "$LOGDIR"
  else
    node tests/dbConformance/run.cjs --uri "$uri" --label "$label" --out "$LOGDIR"
  fi
}
compare_suite() {
  if [ "$SUITE" = speedtest ]; then
    node docs/Databases/FerretDB/1/SpeedTest/report.cjs --dir "$LOGDIR" \
      --results "${WEKAN_SPEEDTEST_RESULTS:-docs/Databases/FerretDB/1/SpeedTest/Results.md}"
  else
    node tests/dbConformance/compare.cjs --dir "$LOGDIR" --reference sqlite
  fi
}

# The FerretDB that was built: its release (the newest in its CHANGELOG) and commit.
FERRET_VERSION="$(grep -m1 -oE '^## \[v[0-9][^]]*\]' "$FERRET_DIR/CHANGELOG.md" 2>/dev/null | tr -d '#[] ')"
FERRET_VERSION="FerretDB ${FERRET_VERSION:-v1} ($(git -C "$FERRET_DIR" rev-parse --short HEAD 2>/dev/null || echo '?'))"

# The database's own name and version, asked from the running server or binary.
engine_name() {
  local v=""
  case "$name" in
    mongodb*)   v="$(docker_exec exec "$CONTAINER" mongod --version 2>/dev/null | sed -n 's/^db version v//p' | head -1)"
                echo "MongoDB ${v:-?}"; return ;;
    postgresql) v="$(docker_exec exec "$CONTAINER" postgres --version 2>/dev/null | grep -oE '[0-9]+(\.[0-9]+)+' | head -1)"
                v="PostgreSQL ${v:-?}" ;;
    mysql)      v="$(docker_exec exec "$CONTAINER" mysqld --version 2>/dev/null | grep -oE 'Ver [0-9.]+' | head -1)"
                v="MySQL ${v#Ver }" ;;
    mariadb)    v="$(docker_exec exec "$CONTAINER" mariadbd --version 2>/dev/null | grep -oE 'Ver [0-9.]+' | head -1)"
                v="MariaDB ${v#Ver }" ;;
    sqlite)     v="$(grep -m1 -oE 'modernc.org/sqlite v[0-9.]+' "$FERRET_DIR/go.mod" 2>/dev/null)"
                v="SQLite (${v:-modernc.org/sqlite})" ;;
    sap-hana)   v="SAP HANA" ;;
    ferretdb2)  local f p
                f="$(docker_exec image inspect --format '{{index .Config.Labels "org.opencontainers.image.version"}}' "$FERRET2_IMAGE" 2>/dev/null)"
                p="$(docker_exec exec "$CONTAINER" postgres --version 2>/dev/null | grep -oE '[0-9]+(\.[0-9]+)+' | head -1)"
                echo "FerretDB ${f:-2} + PostgreSQL ${p:-?} with DocumentDB"; return ;;
  esac
  echo "$FERRET_VERSION + $v"
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

# Leave cleanup to the EXIT trap, including a database that failed to start.
stop_on_failure() {
  if [ "${WEKAN_TEST_BAIL:-0}" = 1 ]; then
    echo "Stopping after the first failed backend check; see $SUMMARY." >&2
    exit 1
  fi
}

for entry in "${BACKENDS[@]}"; do
  IFS='|' read -r name file service port handler <<< "$entry"
  log="$LOGDIR/$PREFIX-$name.log"

  # WEKAN_DB_BACKENDS=postgresql,mysql runs only those - to repeat one database
  # into an earlier run's WEKAN_LOGDIR after a change, say. Unset: all of them.
  if [ -n "${WEKAN_DB_BACKENDS:-}" ] && [[ ",${WEKAN_DB_BACKENDS}," != *",$name,"* ]]; then
    echo "SKIP  $name  not in WEKAN_DB_BACKENDS" >> "$SUMMARY"
    skipped=$((skipped + 1))
    continue
  fi

  # FerretDB 2 (upstream, PostgreSQL with the DocumentDB extension) is a database
  # WeKan's compose file offers but does not ship by default. The speed test
  # includes it; the conformance run only with WEKAN_CONFORMANCE_FERRETDB2=1, so
  # a case it answers differently is a finding, not a failed EVERYTHING run.
  if [ "$name" = "ferretdb2" ] && [ "$SUITE" != speedtest ] && [ "${WEKAN_CONFORMANCE_FERRETDB2:-0}" != "1" ]; then
    echo "SKIP  ferretdb2    (FerretDB 2 + DocumentDB; set WEKAN_CONFORMANCE_FERRETDB2=1 to include)"
    echo "SKIP  ferretdb2  not requested" >> "$SUMMARY"
    skipped=$((skipped + 1))
    continue
  fi

  # SAP HANA only on purpose (see the note at the top).
  if [ "$name" = "sap-hana" ] && [ "${WEKAN_CONFORMANCE_HANA:-0}" != "1" ]; then
    echo "SKIP  sap-hana     (needs ~16 GB RAM and SAP's licence; set WEKAN_CONFORMANCE_HANA=1 to include)"
    echo "SKIP  sap-hana  not requested" >> "$SUMMARY"
    skipped=$((skipped + 1))
    continue
  fi

  image=""
  if [ -n "$service" ]; then
    case "$file" in
      image:*) image="${file#image:}" ;;
      *)       image="$(image_of "$file" "$service")" ;;
    esac
    if [ -z "$image" ]; then
      echo "ERROR $name  no image found for service '$service' in $file"
      echo "ERROR $name  no image in $file" >> "$SUMMARY"
      stop_on_failure
      continue
    fi
    if [ "$name" = "ferretdb2" ]; then
      FERRET2_IMAGE="$(image_of "$file" ferretdb)"
      printf 'Checking %-12s %-45s ' "$name" "$FERRET2_IMAGE"
      image_has_platform "$FERRET2_IMAGE" "$PLATFORM"
      case $? in
        0) echo "has linux/$PLATFORM" ;;
        1) echo "NO linux/$PLATFORM - skipping"
           echo "SKIP  $name  $FERRET2_IMAGE has no linux/$PLATFORM" >> "$SUMMARY"
           skipped=$((skipped + 1)); continue ;;
        *) echo "could not ask the registry - failing this backend"
           echo "ERROR $name  could not inspect $FERRET2_IMAGE (network? docker login?)" >> "$SUMMARY"
           stop_on_failure
           continue ;;
      esac
    fi
    printf 'Checking %-12s %-45s ' "$name" "$image"
    image_has_platform "$image" "$PLATFORM"
    case $? in
      0) echo "has linux/$PLATFORM" ;;
      1) echo "NO linux/$PLATFORM - skipping"
         echo "SKIP  $name  $image has no linux/$PLATFORM" >> "$SUMMARY"
         skipped=$((skipped + 1)); continue ;;
      *) echo "could not ask the registry - failing this backend"
         echo "ERROR $name  could not inspect $image (network? docker login?)" >> "$SUMMARY"
         stop_on_failure
         continue ;;
    esac
  else
    echo "Checking sqlite       embedded in FerretDB                       always available"
  fi

  echo
  echo "---- $name: starting the database ----"
  remove_container "$CONTAINER"

  # Start the container, and when the published port turns out to be taken after
  # all, move to the next free one and try again. `free_port` looks a moment
  # BEFORE `docker run`, and in that moment the previous database's container may
  # still be releasing the port it had - which is exactly what made a run report
  # "container did not start" for two databases whose images were fine.
  start_db_container() {
    local attempt
    for attempt in 1 2 3 4 5; do
      if docker_exec run -d --label "$OWNER_LABEL" --name "$CONTAINER" -v "$CONTAINER_TMP:/tmp" -p "127.0.0.1:$hostport:$port" "$@" >>"$log" 2>&1; then
        return 0
      fi

      if ! grep -q 'address already in use' "$log"; then
        return 1                      # a real failure: report it as one
      fi

      remove_container "$CONTAINER"
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
      mkdir -p "$WEKAN_DIR/.tools/tmp"
      SQLITE_DATA="$(mktemp -d "$WEKAN_DIR/.tools/tmp/$PREFIX-sqlite.XXXXXX")"
      url="file:$SQLITE_DATA/"
      ;;
    postgresql)
      start_db_container \
        -e POSTGRES_USER=ferretdb -e POSTGRES_PASSWORD=ferretdb_secret \
        -e POSTGRES_DB=ferretdb "$image" \
        || { echo "ERROR $name  container did not start" >> "$SUMMARY"; stop_on_failure; continue; }
      url="postgres://ferretdb:ferretdb_secret@127.0.0.1:$hostport/ferretdb"
      ;;
    mysql)
      start_db_container \
        -e MYSQL_DATABASE=ferretdb -e MYSQL_USER=ferretdb -e MYSQL_PASSWORD=ferretdb_secret \
        -e MYSQL_ROOT_PASSWORD=ferretdb_root_secret "$image" \
        || { echo "ERROR $name  container did not start" >> "$SUMMARY"; stop_on_failure; continue; }
      # root, for the same reason as the compose file: FerretDB CREATES a SQL
      # database per MongoDB database, which a per-database grant cannot allow.
      url="mysql://root:ferretdb_root_secret@127.0.0.1:$hostport/ferretdb"
      ;;
    mariadb)
      start_db_container \
        -e MARIADB_DATABASE=ferretdb -e MARIADB_USER=ferretdb -e MARIADB_PASSWORD=ferretdb_secret \
        -e MARIADB_ROOT_PASSWORD=ferretdb_root_secret "$image" \
        || { echo "ERROR $name  container did not start" >> "$SUMMARY"; stop_on_failure; continue; }
      # root, for the same reason as the compose file: FerretDB CREATES a SQL
      # database per MongoDB database, which a per-database grant cannot allow.
      url="mysql://root:ferretdb_root_secret@127.0.0.1:$hostport/ferretdb"
      ;;
    mongodb*)
      start_db_container "$image" \
        || { echo "ERROR $name  container did not start" >> "$SUMMARY"; stop_on_failure; continue; }
      url="mongodb://127.0.0.1:$hostport"
      ;;
    ferretdb2)
      docker_exec network create --label "$OWNER_LABEL" "$FERRET2_NETWORK" >/dev/null 2>&1
      # POSTGRES_DB=postgres: the image installs pg_cron, which may only be
      # created in the database cron.database_name names - postgres.
      start_db_container --network "$FERRET2_NETWORK" \
        -e POSTGRES_USER=ferretdb -e POSTGRES_PASSWORD=ferretdb_secret \
        -e POSTGRES_DB=postgres "$image" \
        || { echo "ERROR $name  container did not start" >> "$SUMMARY"; stop_on_failure; continue; }
      url="mongodb://ferretdb:ferretdb_secret@127.0.0.1:$FERRET_PORT/"
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
        || { echo "ERROR $name  container did not start" >> "$SUMMARY"; stop_on_failure; continue; }
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
        postgresql) docker_exec exec "$CONTAINER" pg_isready -U ferretdb -d ferretdb >/dev/null 2>&1 && up=1 ;;
        # Ready once the DocumentDB extension is installed, not merely accepting
        # connections - the entrypoint restarts the server after its init scripts.
        ferretdb2)  docker_exec exec "$CONTAINER" psql -U ferretdb -d postgres -tAc \
                      "SELECT 1 FROM pg_extension WHERE extname = 'documentdb'" 2>/dev/null | grep -q 1 && up=1 ;;
        mysql)      docker_exec exec "$CONTAINER" mysqladmin ping -h 127.0.0.1 -u root -pferretdb_root_secret --silent >/dev/null 2>&1 && up=1 ;;
        mariadb)    docker_exec exec "$CONTAINER" healthcheck.sh --connect --innodb_initialized >/dev/null 2>&1 && up=1 ;;
        sap-hana)   docker_exec logs "$CONTAINER" 2>&1 | grep -q "Startup finished" && up=1 ;;
        mongodb*)
                    docker_exec exec "$CONTAINER" mongosh --quiet --eval 'db.runCommand({ping:1}).ok' 2>/dev/null | grep -q 1 && up=1 ;;
      esac
      # MongoDB stops at once on a kernel it knows it is incompatible with.
      # Waiting the full two minutes for it would only end in "never ready".
      if [ "$handler" = mongodb ] && docker_exec logs "$CONTAINER" 2>&1 \
           | grep -q 'Linux kernel versions 6.19 and newer has a known incompatibility'; then
        up=2; break
      fi
      [ "$up" -eq 1 ] && break
      printf '.'
      sleep 5
    done
    echo
    if [ "$up" -eq 2 ]; then
      kernel="$(docker_exec info --format '{{.KernelVersion}}' 2>/dev/null || uname -r)"
      echo "SKIP  $name: MongoDB refuses to start on this Linux kernel ($kernel), 6.19-7.0.13"
      echo "SKIP  $name  MongoDB refuses Linux kernel $kernel (6.19-7.0.13; upgrade the kernel)" >> "$SUMMARY"
      docker_exec logs "$CONTAINER" >>"$log" 2>&1
      remove_container "$CONTAINER"
      skipped=$((skipped + 1))
      continue
    fi
    if [ "$up" -ne 1 ]; then
      echo "ERROR $name: the database never became ready (see $log)"
      docker_exec logs "$CONTAINER" >>"$log" 2>&1
      echo "ERROR $name  database never ready" >> "$SUMMARY"
      stop_on_failure
      remove_container "$CONTAINER"
      continue
    fi
  fi

  # FerretDB 2: its own container, on the database's network, published on the
  # port this run's FerretDB would use. Then it is asked like MongoDB is.
  if [ "$handler" = ferretdb2 ]; then
    if ! docker_exec run -d --label "$OWNER_LABEL" --name "$FERRET2_CONTAINER" --network "$FERRET2_NETWORK" \
         -v "$FERRET2_TMP:/tmp" -p "127.0.0.1:$FERRET_PORT:27017" \
         -e "FERRETDB_POSTGRESQL_URL=postgres://ferretdb:ferretdb_secret@$CONTAINER:5432/postgres" \
         -e FERRETDB_TELEMETRY=disable "$FERRET2_IMAGE" >>"$log" 2>&1; then
      echo "ERROR $name  FerretDB 2 container did not start" >> "$SUMMARY"
      stop_on_failure
      remove_container "$CONTAINER"; remove_ferretdb2
      continue
    fi
    echo -n "waiting for FerretDB 2 "
    up=0
    for _ in $(seq 1 60); do
      if URL="$url" node -e '
        const {MongoClient}=require("mongodb");
        new MongoClient(process.env.URL,{serverSelectionTimeoutMS:1500})
          .connect().then(c=>c.db().command({ping:1}).then(()=>c.close())).then(()=>process.exit(0)).catch(()=>process.exit(1));
      ' >/dev/null 2>&1; then up=1; break; fi
      printf '.'
      sleep 2
    done
    echo
    if [ "$up" -ne 1 ]; then
      echo "ERROR $name: FerretDB 2 did not accept a connection (see $log)"
      docker_exec logs "$FERRET2_CONTAINER" >>"$log" 2>&1
      echo "ERROR $name  FerretDB 2 did not start" >> "$SUMMARY"
      stop_on_failure
      remove_container "$CONTAINER"; remove_ferretdb2
      continue
    fi
    engine="$(engine_name)"
    echo "---- $name: running the $SUITE suite against $engine ----"
    run_suite "$url" "$name" "$engine" 2>&1 | tee -a "$log"
    rc=${PIPESTATUS[0]}
    if [ "$rc" -eq 0 ]; then
      ran=$((ran + 1)); echo "RAN   $name" >> "$SUMMARY"
    else
      echo "ERROR $name  the $SUITE suite could not be run" >> "$SUMMARY"
      stop_on_failure
    fi
    echo "---- $name: stopping ----"
    docker_exec logs "$FERRET2_CONTAINER" >>"$log" 2>&1
    docker_exec logs "$CONTAINER" >>"$log" 2>&1
    remove_container "$CONTAINER"
    remove_ferretdb2
    echo
    continue
  fi

  # MongoDB itself answers the catalogue: no FerretDB in between.
  if [ "$handler" = mongodb ]; then
    engine="$(engine_name)"
    echo "---- $name: running the $SUITE suite against $engine ----"
    run_suite "$url" "$name" "$engine" 2>&1 | tee -a "$log"
    rc=${PIPESTATUS[0]}
    if [ "$rc" -eq 0 ]; then
      ran=$((ran + 1)); echo "RAN   $name" >> "$SUMMARY"
    else
      echo "ERROR $name  the catalogue could not be run" >> "$SUMMARY"
      stop_on_failure
    fi
    echo "---- $name: stopping ----"
    docker_exec logs "$CONTAINER" >>"$log" 2>&1
    remove_container "$CONTAINER"
    echo
    if [ "${WEKAN_TEST_BAIL:-0}" = 1 ]; then
      compare_suite 2>&1 | tee -a "$SUMMARY"
      [ "${PIPESTATUS[0]}" -eq 0 ] || stop_on_failure
    fi
    continue
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
    stop_on_failure
    kill "$FERRET_PID" 2>/dev/null; FERRET_PID=""
    remove_container "$CONTAINER"
    continue
  fi

  engine="$(engine_name)"
  echo "---- $name: running the $SUITE suite against $engine ----"
  run_suite "mongodb://127.0.0.1:$FERRET_PORT" "$name" "$engine" 2>&1 | tee -a "$log"
  rc=${PIPESTATUS[0]}
  if [ "$rc" -eq 0 ]; then
    ran=$((ran + 1)); echo "RAN   $name" >> "$SUMMARY"
  else
    echo "ERROR $name  the catalogue could not be run" >> "$SUMMARY"
    stop_on_failure
  fi

  echo "---- $name: stopping ----"
  kill "$FERRET_PID" 2>/dev/null; wait "$FERRET_PID" 2>/dev/null; FERRET_PID=""
  remove_sqlite_data
  if [ -n "$service" ]; then
    docker_exec logs "$CONTAINER" >>"$log" 2>&1
    remove_container "$CONTAINER"
  fi
  echo
  # Compare each completed backend before starting the next one in bail mode.
  # Query errors are recorded results and may be a shared backend limitation.
  if [ "${WEKAN_TEST_BAIL:-0}" = 1 ]; then
    compare_suite 2>&1 | tee -a "$SUMMARY"
    [ "${PIPESTATUS[0]}" -eq 0 ] || stop_on_failure
  fi
done

echo "=========================================================================="
echo "Ran $ran backend(s); skipped $skipped (no image for linux/$PLATFORM, not requested, or a kernel MongoDB refuses - see $SUMMARY)."
echo

if [ "$ran" -eq 0 ]; then
  echo "Nothing ran, so there is nothing to compare. See $LOGDIR/."
  exit 1
fi

# Comparing the available results cannot detect a backend that never ran.
conformance_result() {
  local comparison_rc="$1"
  [ -r "$SUMMARY" ] || { echo "ERROR: missing backend summary." >&2; return 1; }
  if grep -q '^ERROR ' "$SUMMARY"; then
    echo "ERROR: one or more backends could not be tested; see $SUMMARY." >&2
    return 1
  fi
  return "$comparison_rc"
}

compare_suite 2>&1 | tee -a "$SUMMARY"
rc=${PIPESTATUS[0]}

echo
echo "All results: $LOGDIR/"
echo "  $PREFIX-build.log        cloning and building FerretDB"
if [ "$SUITE" = speedtest ]; then
  echo "  speedtest-<backend>.json      each backend's timings and answer fingerprints"
  echo "  $PREFIX-<backend>.log    that backend's database + FerretDB output"
  echo "  ${WEKAN_SPEEDTEST_RESULTS:-docs/Databases/FerretDB/1/SpeedTest/Results.md}"
else
  echo "  db-conformance-<backend>.json   what each backend answered"
  echo "  db-conformance-<backend>.log    that backend's database + FerretDB output"
  echo "  db-conformance-report.md        where they agree and where they do not"
fi
conformance_result "$rc"
exit $?
