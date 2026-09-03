#!/bin/bash
if [ -n "${ZSH_VERSION:-}" ]; then exec /bin/bash "$0" "$@"; fi

echo "Recommended for development: Newest Debian or Ubuntu amd64 based distro, directly to SSD disk or dual boot, not VM. Works fast."
echo "Note1: If you use other locale than en_US.UTF-8 , you need to additionally install en_US.UTF-8"
echo "       with 'sudo dpkg-reconfigure locales' , so that MongoDB works correctly."
echo "       You can still use any other locale as your main locale."
echo "Note2: Console output is also logged to <logs>/wekan-log.log"
echo "Note3: All logs this script produces go into a log/<datetime>/ directory -"
echo "       .tools/log/ inside this repository. The path is printed when a run"
echo "       starts."

# Give the Meteor build tool and Node processes a larger heap so long
# development sessions and test runs don't crash with
# "FATAL ERROR: Ineffective mark-compacts near heap limit - JavaScript heap out
# of memory". TOOL_NODE_FLAGS controls the Meteor command-line/build process
# (the one that hits the limit during `meteor run`/`meteor test`/`meteor build`);
# NODE_OPTIONS covers child Node/rspack processes. Defaults use available
# memory and honor any value already exported.
# The size is worked out from the machine rather than fixed at 8192, because
# 8192 is where a build died:
#
#   FATAL ERROR: Ineffective mark-compacts near heap limit
#   Allocation failed - JavaScript heap out of memory
#
# at 8146 MB of an 8192 MB limit, on a machine with 30 GiB of RAM. The build had
# not run out of memory, it had run out of the ceiling this line gave it - and
# because that ceiling was a constant, the same number was too small on a large
# machine and too large on a small one.
#
# Half of available host or cgroup RAM, capped at 16384. Half leaves the
# rest usable while a build runs; a small machine
# gets a proportionally smaller heap, and the ceiling is there because a heap
# larger than that means something is wrong rather than something is big. At
# 16 GiB this works out to 8192, which is exactly what was hard-coded here
# before, so nothing changes on the machine that value was chosen for.
#
# Anything already exported still wins, which is how to override it.
# Always computed, never conditionally: if only ONE of the two variables were
# already set, skipping this would leave the other with an empty size and Node
# would be handed "--max-old-space-size=".
_mem_total_mb=$(awk '/^MemTotal:/ { print int($2 / 1024) }' /proc/meminfo 2>/dev/null)
# Containers and Flatpak may expose host MemTotal while enforcing a smaller cgroup.
# Use the smaller finite cgroup limit so the heap cannot exceed its real sandbox.
for _cg_file in /sys/fs/cgroup/memory.max /sys/fs/cgroup/memory/memory.limit_in_bytes; do
  [ -r "$_cg_file" ] || continue
  _cg_bytes=$(cat "$_cg_file" 2>/dev/null || true)
  case "$_cg_bytes" in ''|max|*[!0-9]*) continue ;; esac
  _cg_mb=$(( _cg_bytes / 1048576 ))
  [ "$_cg_mb" -gt 0 ] && { [ -z "${_mem_total_mb:-}" ] || [ "$_cg_mb" -lt "$_mem_total_mb" ]; } && _mem_total_mb=$_cg_mb
  break
done
# macOS has no /proc; hw.memsize is bytes.
[ -n "${_mem_total_mb:-}" ] || _mem_total_mb=$(( $(sysctl -n hw.memsize 2>/dev/null || echo 0) / 1048576 ))
[ "${_mem_total_mb:-0}" -gt 0 ] 2>/dev/null || _mem_total_mb=16384
_heap_mb=$(( _mem_total_mb / 2 ))
[ "$_heap_mb" -gt 16384 ] && _heap_mb=16384
if [ -z "${TOOL_NODE_FLAGS:-}${NODE_OPTIONS:-}" ]; then
	echo "Node heap limit for builds: ${_heap_mb} MB (half of ${_mem_total_mb} MB of RAM)."
	echo "  Override by exporting TOOL_NODE_FLAGS and NODE_OPTIONS yourself."
fi
export TOOL_NODE_FLAGS="${TOOL_NODE_FLAGS:---max-old-space-size=$_heap_mb}"
export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=$_heap_mb}"

# Every log this script writes goes into a `log/<datetime>/` directory, and
# WEKAN_LOG_ROOT is where those directories live.
#
# `.tools/log` is inside the repository's ignored tool area, so test output is
# kept out of the source tree without depending on a writable parent directory.
#
# WEKAN_LOG_ROOT can be set to put them somewhere else entirely.
if [ -z "${WEKAN_LOG_ROOT:-}" ]; then
	WEKAN_LOG_ROOT=".tools/log"
fi
export WEKAN_LOG_ROOT
mkdir -p "$WEKAN_LOG_ROOT"

# ── Companion repositories: wekan/.tools/<name> ──────────────────────────────
#
# The repos WeKan needs to run everything - wekan/FerretDB for the database
# conformance run and FerretDB's own suites, and the patch repos - are separate
# git repositories, not part of this one. They live in .tools/ inside this
# checkout, which .gitignore and .meteorignore already exclude, so a clone of
# them can never end up in a commit or in a Meteor rebuild.
#
# They used to be cloned as subdirectories of the repo root (wekan/FerretDB),
# each needing its own ignore entry; one ignored directory holds all of them.
# The repo directory, from the script's own path rather than the caller's cwd:
# ./build.sh is normally run from the checkout, but a clone must not land in
# whatever directory somebody happened to be in.
WEKAN_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEKAN_TOOLS_DIR="$WEKAN_DIR/.tools"
export WEKAN_DIR WEKAN_TOOLS_DIR
. "$WEKAN_DIR/releases/ensure-tools.sh"

# Prefer the repository-local toolchain installed under .tools. A fresh shell
# does not normally have .tools/.meteor on PATH, which made unattended test and
# build entries fail with "meteor: command not found" even after setup had
# installed the requested Meteor release.
if [ -x "$WEKAN_TOOLS_DIR/.meteor/meteor" ]; then
	PATH="$WEKAN_TOOLS_DIR/.meteor:$PATH"
fi
_wekan_node_version="$(sed -n 's/.*NODE_VERSION=v\([^ \\]*\).*/\1/p' "$WEKAN_DIR/Dockerfile" | head -1)"
case "$(uname -m 2>/dev/null)" in
	x86_64|amd64) _wekan_node_arch=x64 ;;
	aarch64|arm64) _wekan_node_arch=arm64 ;;
	*) _wekan_node_arch="" ;;
esac
_wekan_local_node="$WEKAN_TOOLS_DIR/node-v${_wekan_node_version}-linux-${_wekan_node_arch}/bin"
if { [ -z "$_wekan_node_version" ] || [ -z "$_wekan_node_arch" ] ||
	[ ! -x "$_wekan_local_node/node" ]; } && [ -n "$_wekan_node_arch" ]; then
	# A freshly bumped Dockerfile can be one patch ahead of the toolchain already
	# installed for tests. Keep plain Node stages and Playwright version discovery
	# working with the newest repository-local Node until setup fetches the exact
	# release; Meteor builds still use Meteor's own pinned dev-bundle Node.
	_wekan_local_node="$(find "$WEKAN_TOOLS_DIR" -maxdepth 1 -type d \
		-name "node-v*-linux-${_wekan_node_arch}" -print 2>/dev/null |
		sort -V | tail -n 1)/bin"
fi
if [ -n "$_wekan_node_version" ] && [ -n "$_wekan_node_arch" ] && [ -x "$_wekan_local_node/node" ]; then
	PATH="$_wekan_local_node:$PATH"
fi
export PATH

# ensure_tool_repo <name> [git-url] - the path to .tools/<name>, cloning it if it
# is not there yet. Prints the path on stdout; everything else goes to stderr, so
# a caller can do `dir="$(ensure_tool_repo FerretDB)"`.
#
# SSH first, HTTPS second: a maintainer has a key and wants to push, and anyone
# else still gets a working clone. Returns non-zero when neither works, so the
# caller can say what it cannot do rather than cd into nothing.
function ensure_tool_repo(){
	local name="$1"
	local url="${2:-git@github.com:wekan/$name}"
	local https_url="${url/git@github.com:/https://github.com/}"
	local dir="$WEKAN_TOOLS_DIR/$name"

	if [ -d "$dir/.git" ]; then
		printf '%s\n' "$dir"
		return 0
	fi
	mkdir -p "$WEKAN_TOOLS_DIR" || { echo "ERROR: cannot create $WEKAN_TOOLS_DIR" >&2; return 1; }
	echo "==> $name is not in .tools/ yet; cloning $url" >&2
	if ! git clone "$url" "$dir" >&2; then
		echo "==> SSH clone failed (no key for github.com?); trying HTTPS." >&2
		if ! git clone "$https_url" "$dir" >&2; then
			echo "ERROR: could not clone $name from $url or $https_url" >&2
			return 1
		fi
	fi
	printf '%s\n' "$dir"
}

function pause(){
	read -p "$*"
}

function is_dev_server_running(){
	if command -v pgrep >/dev/null 2>&1; then
		pgrep -af 'meteor run --port 3000' | grep -v 'meteor test' | grep -q '.'
		return $?
	fi
	return 1
}

function ensure_rspack_public_dirs(){
	mkdir -p public/build-chunks public/build-assets
}

# The rspack dev-server port that `meteor run` starts alongside the app (see
# rspack.config.js / @meteorjs/rspack: Meteor.devServerPort || 8080). It is the
# same regardless of the app --port, and the rspack watcher is a separate process
# that can outlive the meteor parent, so restarting a dev server must free this
# port too or the new server dies with "Error: listen EADDRINUSE ... :8080".
# Override RSPACK_DEV_PORT in the environment if you changed devServerPort.
RSPACK_DEV_PORT="${RSPACK_DEV_PORT:-8080}"

# All ports the dev/test servers in this script use: the dev app (3000) and its
# bundled Mongo (3001), the Mocha test server (3100) and its Mongo (3101), a
# Sandstorm standalone dev server (4000) and its Mongo (4001), and the rspack
# dev server (8080). Used by the "Kill all dev servers" menu option.
DEV_SERVER_PORTS="3000 3001 3100 3101 4000 4001 8080"

# True (return 0) if something is LISTENING on TCP port $1. Checks the socket
# directly (ss/lsof/fuser) rather than making an HTTP request, so it also detects
# a server that is still building and not yet answering HTTP. Uses ss with an
# exact source-port filter first (fast, Linux); lsof is given -nP so it never
# blocks on host/port name resolution.
function port_in_use(){
	local p="$1"
	if command -v ss >/dev/null 2>&1; then
		[ -n "$(ss -ltnH "sport = :$p" 2>/dev/null)" ] && return 0
		return 1
	fi
	if command -v lsof >/dev/null 2>&1; then
		lsof -nP -iTCP:"$p" -sTCP:LISTEN -t >/dev/null 2>&1 && return 0
		return 1
	fi
	if command -v fuser >/dev/null 2>&1; then
		fuser "$p/tcp" >/dev/null 2>&1 && return 0
		return 1
	fi
	# Universal fallback (no external tools): try to open a TCP connection to the
	# port with bash's /dev/tcp. Succeeds if something is listening there.
	(exec 3<>"/dev/tcp/127.0.0.1/$p") 2>/dev/null && return 0
	return 1
}

# Kill whatever is LISTENING on TCP port $1. Optional $2 = signal name (default
# TERM; pass KILL to force). fuser is preferred on Linux (kills by port with no
# PID parsing); lsof -nP is the macOS fallback; ss is the last resort so this still
# works on a minimal Linux that has neither fuser (psmisc) nor lsof installed — which
# is exactly when the old code silently did nothing and the port never freed, even
# though port_in_use (which DOES use ss) kept reporting it in use. ss -p shows the pid
# of the owning process for the current user without root.
function free_tcp_port(){
	local p="$1" sig="${2:-TERM}" pids
	if command -v fuser >/dev/null 2>&1; then
		fuser -k -"$sig" "$p/tcp" >/dev/null 2>&1
	elif command -v lsof >/dev/null 2>&1; then
		pids="$(lsof -nP -iTCP:"$p" -sTCP:LISTEN -t 2>/dev/null)"
		[ -n "$pids" ] && kill -"$sig" $pids 2>/dev/null
	elif command -v ss >/dev/null 2>&1; then
		pids="$(ss -ltnpH "sport = :$p" 2>/dev/null | grep -oE 'pid=[0-9]+' | cut -d= -f2 | sort -u)"
		[ -n "$pids" ] && kill -"$sig" $pids 2>/dev/null
	fi
	return 0
}

# Stop any Meteor dev server already running before we start a new one on the
# same app port, so picking a "Run Meteor for dev" option always gives you a
# fresh server instead of failing because a port is taken. Frees BOTH the app
# port ($1) and the rspack dev-server port ($RSPACK_DEV_PORT): the rspack watcher
# can outlive the meteor parent and keep holding 8080 even after the app port is
# free, which is what makes a restart crash with EADDRINUSE :8080. Escalates to
# SIGKILL if a port does not free up. Returns 0 when both ports are free (or were
# never in use), 1 if one is still stuck.
function kill_meteor_on_port(){
	local app_port="$1" rspack_port="$RSPACK_DEV_PORT" mongo_port=$(($1 + 1)) i pids
	# Nothing on any of the three ports? Nothing to do. (Meteor runs its bundled
	# MongoDB on app_port+1, so a leftover mongo there must be freed too.)
	port_in_use "$app_port" || port_in_use "$rspack_port" || port_in_use "$mongo_port" || return 0
	echo "==> A Meteor dev server is already running (app port $app_port, rspack dev-server port $rspack_port, MongoDB port $mongo_port); stopping it before starting a new one."
	# Kill the meteor parent for this app port and the rspack watcher (matched by
	# its devServerPort env). Killing these tears down most of the process tree.
	pids="$(pgrep -f "meteor run --port $app_port" 2>/dev/null; pgrep -f "devServerPort=$rspack_port" 2>/dev/null)"
	if [ -n "$pids" ]; then
		echo "    Killing Meteor/rspack PIDs:$(echo " $pids" | tr '\n' ' ')"
		kill $pids 2>/dev/null
	fi
	# Free anything still holding any of the three ports. The bundled MongoDB on
	# app_port+1 is commonly ORPHANED when the meteor parent is SIGKILLed (the mongo
	# child survives and keeps the port), which then makes the next `meteor run` fail
	# with "Unexpected mongo exit code 48 ... port was closed, or was already taken".
	# Freeing app_port+1 here also clears a leftover standalone test mongod on :3001.
	free_tcp_port "$app_port"
	free_tcp_port "$rspack_port"
	free_tcp_port "$mongo_port"
	# Wait for all three ports to actually free up, escalating to SIGKILL at 15s.
	for i in $(seq 1 30); do
		port_in_use "$app_port" || port_in_use "$rspack_port" || port_in_use "$mongo_port" || break
		if [ "$i" -eq 15 ]; then
			echo "    Still in use after 15s; sending SIGKILL."
			pkill -9 -f "meteor run --port $app_port" 2>/dev/null
			pkill -9 -f "devServerPort=$rspack_port" 2>/dev/null
			free_tcp_port "$app_port" KILL
			free_tcp_port "$rspack_port" KILL
			free_tcp_port "$mongo_port" KILL
		fi
		printf '.'; sleep 1
	done
	echo
	if port_in_use "$app_port" || port_in_use "$rspack_port" || port_in_use "$mongo_port"; then
		echo "ERROR: Port $app_port, $rspack_port or $mongo_port is still in use after attempting to stop the existing server. Stop it manually and retry."
		return 1
	fi
	echo "    Ports $app_port, $rspack_port and $mongo_port are now free."
	return 0
}

# Kill every dev/test server this script can start, freeing all $DEV_SERVER_PORTS
# at once. For the "Kill all dev servers" menu option: a blunt "make my dev ports
# free" that stops the dev app, the Mocha test server, the rspack watcher, and
# their bundled Mongos regardless of which port each is on.
function kill_all_dev_servers(){
	echo "==> Killing any dev/test servers on ports: $DEV_SERVER_PORTS"
	# Graceful first: kill the known dev processes by command line (works without
	# lsof/fuser) so meteor can shut down cleanly. mongod is matched by Meteor's
	# bundled '--replSet meteor' so we never touch a production/system Mongo. Then
	# free any remaining port listeners as a bonus (no-op if lsof/fuser absent).
	pkill -f 'meteor run --port'        2>/dev/null
	pkill -f 'meteor test'              2>/dev/null
	pkill -f 'rspack build --watch'     2>/dev/null
	pkill -f 'mongod.*--replSet meteor' 2>/dev/null
	local p i any
	for p in $DEV_SERVER_PORTS; do free_tcp_port "$p"; done
	# Wait for the ports to free, escalating to SIGKILL at 10s.
	for i in $(seq 1 20); do
		any=0
		for p in $DEV_SERVER_PORTS; do port_in_use "$p" && any=1; done
		[ "$any" -eq 0 ] && break
		if [ "$i" -eq 10 ]; then
			echo "    Still busy after 10s; sending SIGKILL."
			pkill -9 -f 'meteor run --port'        2>/dev/null
			pkill -9 -f 'meteor test'              2>/dev/null
			pkill -9 -f 'rspack build --watch'     2>/dev/null
			pkill -9 -f 'mongod.*--replSet meteor' 2>/dev/null
			for p in $DEV_SERVER_PORTS; do free_tcp_port "$p" KILL; done
		fi
		printf '.'; sleep 1
	done
	echo
	local stuck=""
	for p in $DEV_SERVER_PORTS; do port_in_use "$p" && stuck="$stuck $p"; done
	if [ -n "$stuck" ]; then
		echo "    WARNING: still in use after trying to stop them:$stuck"
	else
		echo "    All dev server ports are now free: $DEV_SERVER_PORTS"
	fi
}

# Build WeKan from scratch: reinstall npm deps and produce the .build directory.
# Used by menu option 2 and auto-invoked by option 9 when .build is missing.
# Also clears the rspack dev-build caches (_build and node_modules/.cache) so the
# next `meteor run` recompiles from scratch instead of serving stale modules.
function build_wekan(){
	echo "Building WeKan."
	# The build's output goes to the run's log directory, not only to the
	# terminal. A test run that fails IN THE BUILD used to leave nothing behind
	# to read: log/<datetime>/ held the FerretDB and conformance logs and not
	# one line about why WeKan itself never got as far as a test, so "check the
	# newest test logs" could not answer the question the run had just raised.
	# It is teed, so an interactive build still scrolls past as it always did.
	local buildlog
	# What the build is actually given - the computed limit, unless the
	# snapshot mode below caps it. The failure message quoted the computed one
	# either way, which read as "allowed 15542 MB and reached 4280 MB".
	_effective_heap_mb="$_heap_mb"
	buildlog="$(one_log build)"
	echo "Build log: $buildlog"

	# WEKAN_BUILD_HEAP_SNAPSHOT=1 makes the build write a heap snapshot just
	# before it would run out of memory, instead of only dying.
	#
	# This exists because guessing at the cause did not work. The build has
	# exhausted its heap three runs running - 8146 MB of 8192, then 15526 of
	# 15542, then 15520 with the second JS minifier removed on the theory that
	# it was the consumer. The last of those settled the theory: taking the
	# minifier out changed the peak by 6 MB, which is noise. Something else is
	# holding 15 GB, and the only way to find out what is to look.
	#
	# Node writes Heap.<pid>.<seq>.heapsnapshot into the working directory when
	# it gets near the limit. Open it in Chrome DevTools (Memory -> Load) and
	# sort by retained size. It is roughly as large as the heap, so this is
	# off by default rather than something every build pays for.
	if [ "${WEKAN_BUILD_HEAP_SNAPSHOT:-0}" = "1" ]; then
		# A SMALLER heap on purpose, not the computed one.
		#
		# The first attempt at this kept the full limit and the run was killed
		# outright - "Päätetty" from the kernel, and a 0-byte
		# Heap.*.heapsnapshot left behind. Writing a snapshot costs memory on
		# top of the heap being dumped, so asking a 15.5 GB heap to write a
		# 15.5 GB snapshot on a 30 GB machine that already had 12 GB in use
		# does not fit, and the OOM killer arrives before the file does.
		#
		# A snapshot is not more useful for being bigger. What is wanted is
		# WHAT is retaining memory, and whatever grows to 15 GB is already the
		# largest thing on the heap at 4 GB - it just gets there sooner and
		# writes a file that fits. The build still fails; that is expected.
		local snap_mb="${WEKAN_BUILD_HEAP_SNAPSHOT_MB:-4096}"
		_effective_heap_mb="$snap_mb"
		export TOOL_NODE_FLAGS="--max-old-space-size=$snap_mb --heapsnapshot-near-heap-limit=1"
		export NODE_OPTIONS="--max-old-space-size=$snap_mb --heapsnapshot-near-heap-limit=1"
		echo "Heap snapshot: ON, with the heap capped at ${snap_mb} MB."
		echo "  The build WILL fail sooner than usual - that is the point: it"
		echo "  writes $(pwd)/Heap.<date>.<pid>.<n>.heapsnapshot, about ${snap_mb} MB,"
		echo "  just before it dies. A snapshot at the full ${_heap_mb} MB limit"
		echo "  cannot be written on this machine - the last attempt was killed"
		echo "  by the kernel and left a 0-byte file."
		echo "  Open it in Chrome DevTools: Memory -> Load, sort by retained size."
		echo "  Raise it with WEKAN_BUILD_HEAP_SNAPSHOT_MB if 4096 is too early."
	fi
	{
		echo "===== wekan build started $(date '+%F %T') ====="
		rm -rf node_modules node_modules/.cache .meteor/local .build _build
		(meteor update --npm || true) && meteor npm install
		meteor build .build --directory
		local rc=$?
		echo "===== wekan build finished $(date '+%F %T') (exit $rc) ====="
		return $rc
	} 2>&1 | tee "$buildlog"
	# The exit status of the pipeline is tee's; take the build's.
	local rc="${PIPESTATUS[0]}"
	if [ "$rc" -ne 0 ] || [ ! -d .build/bundle ]; then
		echo "ERROR: the WeKan build failed. Its output is in $buildlog"
		# Name the failure when it is one we can recognise, rather than leaving
		# a V8 stack trace as the last word. Running out of heap and failing to
		# compile look identical at this level and have nothing in common.
		if grep -q "JavaScript heap out of memory" "$buildlog" 2>/dev/null; then
			local peak
			peak="$(grep -ao 'Mark-Compact ([a-z ]*) [0-9.]*' "$buildlog" \
				| tail -1 | awk '{print $NF}')"
			# Appended to the log as well as printed. The whole point of the
			# build log is that "check the newest test logs" answers the
			# question, and a diagnosis that exists only in terminal scrollback
			# is one the next person does not have.
			{
				echo
				echo "  The build ran out of JavaScript heap. It was allowed ${_effective_heap_mb} MB${peak:+ and reached ${peak} MB}."
				echo
				echo "  Raising that number is NOT the next step. It has been raised once"
				echo "  already - 8192 to ${_heap_mb} - and the build simply used the extra;"
				echo "  removing the second JS minifier on the theory that it was the"
				echo "  consumer moved the peak by 6 MB. The build really is holding that"
				echo "  much, in the phase after both rspack compiles report done."
				echo
				if [ "${WEKAN_BUILD_HEAP_SNAPSHOT:-0}" = "1" ]; then
					echo "  A heap snapshot was requested, so look for"
					echo "  $(pwd)/Heap.*.heapsnapshot and read it with:"
					echo
					echo "      python3 releases/analyse-heapsnapshot.py Heap.*.heapsnapshot"
				else
					echo "  To find out WHAT is holding it, run once with a heap snapshot:"
					echo
					echo "      WEKAN_BUILD_HEAP_SNAPSHOT=1 ./build.sh"
					echo
					echo "  That caps the heap so the snapshot can be written at all, and"
					echo "  leaves Heap.*.heapsnapshot here. Read it with:"
					echo
					echo "      python3 releases/analyse-heapsnapshot.py Heap.*.heapsnapshot"
				fi
			} | tee -a "$buildlog"
		fi
		return 1
	fi

	# THE REST OF WHAT A RELEASE BUNDLE IS.
	#
	# `meteor build` produces a bundle nobody downloads. What a release ships is
	# that bundle plus the server's npm modules, three prunes, the sockjs/legacy
	# client/source-map trim, a verified Node.js, FerretDB, the MongoDB tools and
	# a launcher - and everything WeKan has shipped broken lately broke in that
	# difference, where nothing local could reach it.
	#
	# Menu option 2 sets this, so "Build WeKan" answers "does the bundle a
	# release would publish start on this machine". The test path does not: it
	# runs the bundle under its own node and its own mongod, and downloading a
	# hundred megabytes of binaries it will not use to test WeKan's source is
	# the wrong trade.
	if [ "${WEKAN_BUILD_RELEASE_BUNDLE:-0}" = "1" ]; then
		bash releases/build-release-bundle.sh .build/bundle 2>&1 | tee -a "$buildlog"
		local rrc="${PIPESTATUS[0]}"
		if [ "$rrc" -ne 0 ]; then
			echo "ERROR: the bundle built, but the release post-processing failed. Its output is in $buildlog"
			return 1
		fi
	fi
	echo Done.
}

# Detect OS (linux/macos) and CPU arch (amd64/arm64) so tests run on
# Linux amd64, Linux arm64 and macOS arm64.
function detect_platform(){
	case "$OSTYPE" in
		linux*)  PLATFORM_OS="linux" ;;
		darwin*) PLATFORM_OS="macos" ;;
		*)       PLATFORM_OS="$OSTYPE" ;;
	esac
	case "$(uname -m)" in
		x86_64|amd64)  PLATFORM_ARCH="amd64" ;;
		arm64|aarch64) PLATFORM_ARCH="arm64" ;;
		*)             PLATFORM_ARCH="$(uname -m)" ;;
	esac
}
detect_platform
echo "Platform: $PLATFORM_OS $PLATFORM_ARCH"

# Whether a Playwright browser project (chromium / firefox / webkit) should run
# inside the official Playwright Docker image instead of natively. This lets the
# full Chromium + Firefox + WebKit matrix run anywhere, including hosts where the
# bundled browsers can't launch natively (e.g. Linux arm64, where WebKit links
# against old system libs, or where Chromium/Firefox need libraries the host lacks).
#
# Resolution order:
#   1. WEKAN_PLAYWRIGHT_DOCKER=1 -> ALL browsers via Docker;  =0 -> ALL native.
#   2. Per browser: WEKAN_CHROMIUM_DOCKER / WEKAN_FIREFOX_DOCKER / WEKAN_WEBKIT_DOCKER (1/0).
#   3. Auto (default): on Linux arm64 ALL browsers (Chromium, Firefox, WebKit)
#      go through Docker; on every other platform they run natively.
function browser_needs_docker(){
	local browser="$1"
	case "${WEKAN_PLAYWRIGHT_DOCKER:-}" in
		1) return 0 ;;
		0) return 1 ;;
	esac
	local var="WEKAN_$(printf '%s' "$browser" | tr '[:lower:]' '[:upper:]')_DOCKER"
	case "${!var:-auto}" in
		1) return 0 ;;
		0) return 1 ;;
	esac
	# auto: the native Playwright browser binaries have no working runtime on
	# Linux arm64 (missing system deps on distros like Asahi) - they SKIP every
	# project with "browser cannot launch on this host", so Chromium and Firefox
	# would exit immediately with no tests run. Route ALL three through the
	# official Playwright Docker image there, which ships working browsers. On
	# x86_64 Linux, macOS and Windows the native browsers work, so run natively.
	if [ "$PLATFORM_OS" = "linux" ] && [ "$PLATFORM_ARCH" = "arm64" ]; then
		return 0
	fi
	return 1
}

# Back-compat: existing callers/env (WEKAN_WEBKIT_DOCKER) keep working.
function webkit_needs_docker(){ browser_needs_docker webkit; }

# VS Code's Flatpak sandbox does not put the host Docker CLI in PATH, even
# though `flatpak-spawn --host docker ...` is available. Keep Docker calls in
# one wrapper so the ARM64 Playwright route works both in an ordinary terminal
# and in the documented sandbox.
function docker_available(){
	command -v docker >/dev/null 2>&1 && return 0
	command -v flatpak-spawn >/dev/null 2>&1 || return 1
	flatpak-spawn --host sh -lc 'command -v docker >/dev/null 2>&1' >/dev/null 2>&1
}

function docker_exec(){
	if command -v docker >/dev/null 2>&1; then
		docker "$@"
	else
		flatpak-spawn --host docker "$@"
	fi
}

# Run a Playwright browser project (chromium / firefox / webkit) inside the
# official Playwright container. First arg is the browser; any extra args are
# passed through to `playwright test`. WeKan must already be running on the host
# (default http://127.0.0.1:3000, Meteor's bundled Mongo on 3001); the container
# shares the host network so it can reach both.
function run_playwright_docker(){
	local browser="$1"; shift
	local reporoot="$WEKAN_DIR"
	local pwdir="$reporoot/tests/playwright"
	local filesroot="${WEKAN_FILES_PATH_HOST:-$reporoot/.build/bundle/files}"
	if ! docker_available; then
		echo "ERROR: Docker is required to run $browser in the Playwright container, but 'docker' was not found."
		echo "       Install Docker, or run this browser natively (set WEKAN_PLAYWRIGHT_DOCKER=0)."
		return 127
	fi
	if [ ! -d "$pwdir/node_modules/@playwright/test" ]; then
		echo "Installing Playwright test dependencies (the container reuses the mounted node_modules)."
		( cd "$pwdir" && meteor npm install )
	fi
	local pwver
	pwver="$(node -e "console.log(require('$pwdir/node_modules/@playwright/test/package.json').version)" 2>/dev/null)"
	[ -z "$pwver" ] && pwver="1.60.0"
	local image="mcr.microsoft.com/playwright:v${pwver}-noble"
	mkdir -p "$filesroot"
	echo "Running Playwright $browser in Docker ($image)."
	echo "Expecting WeKan at ${WEKAN_BASE_URL:-http://127.0.0.1:3000} (container uses --network host)."
	# Mount the whole repo so specs that reach the repo-root node_modules
	# (e.g. @wekanteam/exceljs) and .tools resolve; run from tests/playwright.
	# Run as the host user (--user) with a writable HOME so the container does
	# not leave root-owned files under test-results/ (which would later make
	# native Chromium/Firefox runs fail with "EACCES: permission denied, mkdir
	# .../test-results/.playwright-artifacts-N").
	docker_exec run --rm --init --ipc=host --network host \
		--label org.wekan.test-run=everything \
		--user "$(id -u):$(id -g)" \
		-e HOME=/tmp \
		-e WEKAN_BASE_URL="${WEKAN_BASE_URL:-http://127.0.0.1:3000}" \
		-e WEKAN_MONGO_URL="${WEKAN_MONGO_URL:-mongodb://127.0.0.1:3001/meteor}" \
		-e WEKAN_PLAYWRIGHT_ALL=1 \
		-e WEKAN_PLAYWRIGHT_PROJECT="$browser" \
		-e WEKAN_PLAYWRIGHT_WORKERS="${WEKAN_PLAYWRIGHT_WORKERS:-1}" \
		-e WEKAN_PLAYWRIGHT_PROBE=0 \
		-e PLAYWRIGHT_HTML_OPEN=never \
		-e WEKAN_FILES_PATH=/wekan-files \
		-e PLAYWRIGHT_JSON_OUTPUT_NAME="${PLAYWRIGHT_JSON_OUTPUT_NAME:-}" \
		-v "$filesroot":/wekan-files \
		-v "$reporoot":/repo -w /repo/tests/playwright \
		"$image" \
		sh -c 'export PATH=/repo/tests/playwright/node_modules/.bin:$PATH; exec npx playwright test --project="$0" "$@"' "$browser" "$@"
}

# Run the older Puppeteer-based Node E2E regression suite in the same browser
# image used by Playwright. On Linux arm64 there is no compatible host Chromium,
# but the official image already provides one and can reach the shared test
# server and MongoDB through the host network.
function run_node_e2e_docker(){
	local reporoot="$WEKAN_DIR"
	local pwdir="$reporoot/tests/playwright"
	if ! docker_available; then
		echo "ERROR: Docker is required for Node E2E on this platform, but 'docker' was not found."
		return 127
	fi
	if [ ! -d "$pwdir/node_modules/@playwright/test" ]; then
		echo "Installing Playwright test dependencies for the browser container."
		( cd "$pwdir" && meteor npm install ) || return 1
	fi
	local pwver
	pwver="$(node -e "console.log(require('$pwdir/node_modules/@playwright/test/package.json').version)" 2>/dev/null)"
	[ -z "$pwver" ] && pwver="1.60.0"
	local image="mcr.microsoft.com/playwright:v${pwver}-noble"
	echo "Running Node E2E in Docker ($image)."
	docker_exec run --rm --init --ipc=host --network host \
		--label org.wekan.test-run=everything \
		--user "$(id -u):$(id -g)" \
		-e HOME=/tmp \
		-e NODE_OPTIONS="${NODE_OPTIONS:-}" \
		-e WEKAN_BASE_URL="${WEKAN_BASE_URL:-http://127.0.0.1:3000}" \
		-e WEKAN_MONGO_URL="${WEKAN_MONGO_URL:-mongodb://127.0.0.1:3001/meteor}" \
		-v "$reporoot":/repo -w /repo \
		"$image" \
		sh -c 'browser_path="$(find /ms-playwright -type f \( -path "*/chrome-linux/chrome" -o -path "*/chrome-linux64/chrome" \) -perm -111 | sort -r | head -n 1)"; test -n "$browser_path" || { echo "No Chromium executable found in Playwright image" >&2; exit 127; }; CHROMIUM_PATH="$browser_path" exec node tests/e2e/list-regressions.js'
}

# Back-compat wrapper: run the WebKit project in Docker.
function run_playwright_webkit_docker(){ run_playwright_docker webkit "$@"; }

# Install the Chromium + Firefox + WebKit browsers Playwright uses, both for
# native runs (`playwright install --with-deps`) and for Docker runs (pull the
# official Playwright image that already bundles all three). Honors the
# WEKAN_PLAYWRIGHT_DOCKER / WEKAN_<BROWSER>_DOCKER settings: a browser configured
# to run in Docker is covered by the image pull rather than a native install.
function install_playwright_browsers(){
	ORIG_HOME="$HOME"
	local reporoot="$WEKAN_DIR"
	local pwdir="$reporoot/tests/playwright"
	if [ ! -d "$pwdir/node_modules/@playwright/test" ]; then
		echo "Installing Playwright test dependencies (npm)..."
		( cd "$pwdir" && meteor npm install )
	fi

	# Native install for whichever browsers are NOT configured for Docker.
	local nativeList=""
	for b in chromium firefox webkit; do
		browser_needs_docker "$b" || nativeList="$nativeList $b"
	done
	if [ -n "$nativeList" ]; then
		echo "Installing native Playwright browsers:$nativeList (with system deps; may use sudo)."
		( cd "$pwdir" && export HOME="$reporoot/.tools" && npx playwright install --with-deps $nativeList )
	else
		echo "All browsers are configured to run via Docker; skipping native browser install."
	fi

	# Pull the Playwright Docker image if any browser is configured for Docker
	# (e.g. WebKit on Linux arm64, or WEKAN_PLAYWRIGHT_DOCKER=1 for the whole matrix).
	if browser_needs_docker chromium || browser_needs_docker firefox || browser_needs_docker webkit; then
		if docker_available; then
			local pwver
			pwver="$(node -e "console.log(require('$pwdir/node_modules/@playwright/test/package.json').version)" 2>/dev/null)"
			[ -z "$pwver" ] && pwver="1.60.0"
			echo "Pulling Playwright Docker image mcr.microsoft.com/playwright:v${pwver}-noble ..."
			docker_exec pull "mcr.microsoft.com/playwright:v${pwver}-noble"
		else
			echo "NOTE: some browsers are configured for Docker, but 'docker' is not installed."
			echo "      Install Docker, or set WEKAN_PLAYWRIGHT_DOCKER=0 to run all browsers natively."
		fi
	fi
	echo "Done. Run a browser suite from the menu, or: WEKAN_PLAYWRIGHT_DOCKER=1 ./build.sh"
}

# Reset test-results/ ownership when an older WebKit-in-Docker run left it owned
# by root. Removal needs write permission on test-results/ itself (which the
# host user lacks when it is root-owned), so this needs sudo; it is a no-op when
# the directory is already writable or absent.
function ensure_test_results_writable(){
	local pwdir="$WEKAN_DIR/tests/playwright"
	[ -e "$pwdir/test-results" ] || return 0
	[ -w "$pwdir/test-results" ] && return 0
	echo "Fixing test-results/ ownership (left as root by an earlier Docker WebKit run)."
	sudo chown -R "$(id -u):$(id -g)" "$pwdir/test-results" 2>/dev/null || \
		sudo rm -rf "$pwdir/test-results" 2>/dev/null || true
}

# Print "<n> passed, <n> failed, ..." for a Playwright JSON report file.
function pw_stats_of(){
	[ -f "$1" ] || return 0
	node -e 'const fs=require("fs");let r;try{r=JSON.parse(fs.readFileSync(process.argv[1],"utf8"))}catch(e){process.exit(0)}const s=r.stats||{};console.log(`${s.expected||0} passed, ${s.unexpected||0} failed, ${s.flaky||0} flaky, ${s.skipped||0} skipped`);' "$1"
}

# Print "[label] file:line › title" for each failing spec in a Playwright JSON report.
function pw_failures_of(){
	[ -f "$1" ] || return 0
	node -e 'const fs=require("fs");let r;try{r=JSON.parse(fs.readFileSync(process.argv[1],"utf8"))}catch(e){process.exit(0)}const label=process.argv[2]||"";const out=[];function walk(su,ti){const t=[...ti,su.title].filter(Boolean);for(const s of su.suites||[])walk(s,t);for(const sp of su.specs||[]){if(sp.ok)continue;const loc=sp.file?`${sp.file}:${sp.line}`:"";out.push(`[${label}] ${loc} › ${[...t,sp.title].join(" › ")}`);}}for(const s of r.suites||[])walk(s,[]);out.forEach(l=>console.log(l));' "$1" "$2"
}

# Select the repository-local browser cache used by the Flatpak bootstrap.
# Explicit caller configuration wins; every automatic install uses the ignored
# .tools cache on both ordinary Fedora and Flatpak.
function set_playwright_browser_path(){
	[ -n "${PLAYWRIGHT_BROWSERS_PATH:-}" ] || \
		export PLAYWRIGHT_BROWSERS_PATH="$WEKAN_DIR/.tools/ms-playwright"
}

function ensure_playwright_test_dependencies(){
	local pwdir="$WEKAN_DIR/tests/playwright"
	if [ ! -x "$pwdir/node_modules/.bin/playwright" ]; then
		echo "Installing Playwright test dependencies under tests/playwright/node_modules."
		( cd "$pwdir" && meteor npm install ) || return 1
	fi
}

function native_browser_is_installed(){
	local browser="$1" pwdir="$WEKAN_DIR/tests/playwright"
	set_playwright_browser_path
	( cd "$pwdir" && node -e "const fs=require('fs');const p=require('@playwright/test').${browser}.executablePath();fs.accessSync(p,fs.constants.X_OK)" ) >/dev/null 2>&1
}

function ensure_native_playwright_browser(){
	local browser="$1" pwdir="$WEKAN_DIR/tests/playwright"
	set_playwright_browser_path
	if native_browser_is_installed "$browser"; then
		echo "Using cached Playwright $browser browser from $PLAYWRIGHT_BROWSERS_PATH."
		return 0
	fi
	mkdir -p "$PLAYWRIGHT_BROWSERS_PATH"
	echo "Ensuring the matching Playwright $browser browser is installed in $PLAYWRIGHT_BROWSERS_PATH."
	( cd "$pwdir" && "$pwdir/node_modules/.bin/playwright" install "$browser" )
}

function native_browser_can_launch(){
	local browser="$1" pwdir="$WEKAN_DIR/tests/playwright"
	(
		cd "$pwdir" || exit 1
		export HOME="$WEKAN_DIR/.tools"
		unset CHROME_DEVEL_SANDBOX
		set_playwright_browser_path
		node -e "require('@playwright/test').${browser}.launch().then(b=>b.close()).then(()=>process.exit(0)).catch(()=>process.exit(1))"
	) >/dev/null 2>&1
}

# Run one Playwright browser project for the whole-suite flows.
# Writes test-results/all-tests-<browser>.json and returns playwright's exit code.
# On Linux arm64 every browser goes through Docker (see browser_needs_docker).
function run_pw_all_browser(){
	local browser="$1"
	local pwdir="$WEKAN_DIR/tests/playwright"
	local json="test-results/all-tests-${browser}.json"
	# Per-browser output dir so suites can run in parallel without their
	# artifacts (.playwright-artifacts-N, screenshots, traces) colliding or
	# wiping each other when Playwright clears its output dir at startup.
	local outdir="test-results/${browser}"
	ensure_playwright_test_dependencies || return 1
	if ! browser_needs_docker "$browser"; then
		if ! ensure_native_playwright_browser "$browser"; then
			docker_available || { echo "ERROR: could not install Playwright $browser and Docker is unavailable."; return 1; }
		fi
	fi
	# Prefer a working native browser, but do not turn missing immutable Flatpak
	# runtime libraries into one failure per test. The host-Docker wrapper is
	# available through flatpak-spawn and carries the matching browser runtime.
	if ! browser_needs_docker "$browser" && ! native_browser_can_launch "$browser" && docker_available; then
		echo "Native Playwright $browser cannot launch; using the official container instead."
		( cd "$pwdir" && export PLAYWRIGHT_JSON_OUTPUT_NAME="$json" && run_playwright_docker "$browser" --output="$outdir" --reporter=list,json )
		return $?
	fi
	ensure_test_results_writable
	rm -f "$pwdir/$json"
	if browser_needs_docker "$browser"; then
		( cd "$pwdir" && export PLAYWRIGHT_JSON_OUTPUT_NAME="$json" && run_playwright_docker "$browser" --output="$outdir" --reporter=list,json )
		return $?
	fi
	(
		cd "$pwdir"
		export HOME="$WEKAN_DIR/.tools"
		set_playwright_browser_path
		unset CHROME_DEVEL_SANDBOX
		export WEKAN_PLAYWRIGHT_ALL=1
		export WEKAN_PLAYWRIGHT_PROJECT="$browser"
		export PLAYWRIGHT_JSON_OUTPUT_NAME="$json"
		PLAYWRIGHT_HTML_OPEN=never meteor npm exec playwright test -- --project="$browser" --output="$outdir" --reporter=list,json
	)
	return $?
}

# Run Chromium, Firefox and WebKit suites concurrently against a WeKan server
# that is already running on http://localhost:3000 (menu option 3). Each suite
# streams to $RUN_LOGDIR/wekan-playwright-<browser>.log; once all finish we print each
# log followed by a per-browser PASS/FAIL summary. Tests seed their own random
# users/boards and clean up by id, so running the three browsers at once is safe.
function run_playwright_parallel(){
	ORIG_HOME="$HOME"
	local pwdir="$WEKAN_DIR/tests/playwright"
	ensure_test_results_writable

	if ! curl -fsS --connect-timeout 2 --max-time 4 http://127.0.0.1:3000/sign-in >/dev/null 2>&1; then
		echo "ERROR: WeKan does not appear to be running on http://localhost:3000."
		echo "       Start it first with menu option 3, then re-run this option."
		return 1
	fi

	read -p "Install Playwright test dependencies first? [y/N] " INSTALL_DEPS
	case "$INSTALL_DEPS" in [Yy]*) ( cd "$pwdir" && meteor npm install ) ;; esac

	# This run's own .tools/log/<timestamp>/ dir, so logs are never overwritten.
	local RUN_LOGDIR
	RUN_LOGDIR="$WEKAN_LOG_ROOT/$(date '+%Y-%m-%d_%H-%M-%S')"
	mkdir -p "$RUN_LOGDIR"

	echo "Running Chromium, Firefox and WebKit Playwright suites sequentially (one browser at a time)."
	echo "Each browser's output (Playwright 'list' reporter, one line per test) streams live below and is also saved to $RUN_LOGDIR/wekan-playwright-<browser>.log."

	# Run the three browser suites one after another rather than in parallel:
	# running all three at once against a single dev server uses too much RAM and
	# swap on lower-memory machines and may crash. Each browser streams live via
	# tee (so progress is visible while it runs) AND writes its own log; the
	# combined summary is printed once all have finished.
	local rc_chromium rc_firefox rc_webkit
	local ts
	# Stream live to the console with tee while also saving to this run's
	# .tools/log/<timestamp>/ dir. PIPESTATUS[0] is run_pw_all_browser's exit code (the
	# left side of the pipe), not tee's, so the pass/fail result stays accurate.
	for entry in "chromium:Chromium" "firefox:Firefox" "webkit:WebKit"; do
		browser="${entry%%:*}"; label="${entry#*:}"
		ts="$(date '+%Y-%m-%d %H:%M:%S %Z')"
		echo
		echo "==================== Playwright $label (live) ===================="
		{ echo "===== Playwright $label - test run started $ts ====="; echo; run_pw_all_browser "$browser"; } 2>&1 | tee "$RUN_LOGDIR/wekan-playwright-${browser}.log"
		local rc=${PIPESTATUS[0]}
		case "$browser" in
			chromium) rc_chromium=$rc ;;
			firefox)  rc_firefox=$rc ;;
			webkit)   rc_webkit=$rc ;;
		esac
	done

	local PW_FAILURES=""
	SUMMARY=()
	record() { SUMMARY+=("$1|$2|${3:-}"); }
	for entry in "chromium:Chromium:$rc_chromium" "firefox:Firefox:$rc_firefox" "webkit:WebKit:$rc_webkit"; do
		browser="${entry%%:*}"; rest="${entry#*:}"; label="${rest%%:*}"; rc="${rest#*:}"
		# Output already streamed live above; here we only compute the summary.
		local json="$pwdir/test-results/all-tests-${browser}.json"
		local stats; stats="$(pw_stats_of "$json")"
		if [ "$rc" -eq 0 ]; then record PASS "Playwright $label" "$stats"; else record FAIL "Playwright $label" "$stats"; fi
		local fails; fails="$(pw_failures_of "$json" "$label")"
		[ -n "$fails" ] && PW_FAILURES="${PW_FAILURES}${fails}"$'\n'
	done

	echo
	echo "==================== PLAYWRIGHT SUMMARY ===================="
	local FAILED=0
	for line in "${SUMMARY[@]}"; do
		status="${line%%|*}"; rest="${line#*|}"; name="${rest%%|*}"; stats="${rest#*|}"
		suffix=""; [ -n "$stats" ] && suffix="  ($stats)"
		printf '  %-6s %s%s\n' "$status" "$name" "$suffix"
		[ "$status" = "FAIL" ] && FAILED=1
	done
	echo "==========================================================="
	if [ -n "$PW_FAILURES" ]; then
		echo
		echo "Failing Playwright tests:"
		while IFS= read -r f; do
			[ -n "$f" ] && printf '  FAIL  %s\n' "$f"
		done <<< "$PW_FAILURES"
		echo "(full per-browser output above; HTML report in tests/playwright/playwright-report)"
		echo "==========================================================="
	fi
	if [ "$FAILED" -eq 0 ]; then echo "RESULT: All Playwright browsers passed."; else echo "RESULT: Some Playwright browsers FAILED (see details above)."; fi
	return $FAILED
}

# Run one Playwright browser project interactively (single-browser menu items).
# one_log <name> — a fresh log/<datetime>/ for a single test option, and the
# path of the file to tee into. Every option in the Tests menu writes there, so
# "the newest test logs" is one directory whichever option produced them. When a
# larger run is driving this (EVERYTHING), WEKAN_LOGDIR is already set and is used
# instead, so one run stays in one directory.
one_log() {
	local name="$1" dir
	dir="${WEKAN_LOGDIR:-$WEKAN_LOG_ROOT/$(date '+%Y-%m-%d_%H-%M-%S')}"
	mkdir -p "$dir" 2>/dev/null || dir="."
	printf '%s/wekan-%s.log' "$(cd "$dir" && pwd)" "$name"
}

function run_playwright_single(){
	local browser="$1"
	ORIG_HOME="$HOME"
	if browser_needs_docker "$browser"; then
		echo "Running $browser via the official Playwright Docker image."
		echo "Make sure WeKan is running on http://localhost:3000 (a whole-suite option starts it for you)."
		( cd "$WEKAN_DIR/tests/playwright" && run_playwright_docker "$browser" )
		return $?
	fi
	cd "$WEKAN_DIR/tests/playwright"
	export HOME="$WEKAN_DIR/.tools"
		set_playwright_browser_path
	unset CHROME_DEVEL_SANDBOX
	export WEKAN_PLAYWRIGHT_ALL=1
		export WEKAN_PLAYWRIGHT_PROJECT="$browser"
	read -p "Install Playwright test dependencies first? [y/N] " INSTALL_DEPS
	case "$INSTALL_DEPS" in [Yy]*) meteor npm install ;; esac
	local log
	log="$(cd "$WEKAN_DIR" && one_log "playwright-$browser")"
	echo "Log: $log"
	meteor npm exec playwright test -- --project="$browser" 2>&1 | tee "$log"
	return "${PIPESTATUS[0]}"
}

# Run the full test matrix (Mocha, import regression, Node E2E and the three
# Playwright browser suites) against ONE WeKan server on http://localhost:3000,
# then print a combined PASS/FAIL summary.
#   $1 = "parallel"    -> start every job at once and show a live progress table.
#                         Fast, but memory-hungry (fine on a 32 GB machine).
#   $1 = "sequential"  -> run one job at a time to keep RAM/swap usage low on
#                         smaller machines.
# Does a real MongoDB answer on this port? A TCP connect proves only that
# something accepted the socket; this asks the database itself. Uses the driver
# already in the built bundle, so it needs nothing installed.
mongo_answers() {
	local port="$1"
	local modules="$BUNDLE_DIR/programs/server/node_modules"
	[ -d "$modules" ] || return 1
	[ -x "$NODE_BIN" ] || return 1
	NODE_PATH="$modules" "$NODE_BIN" -e '
		const { MongoClient } = require("mongodb");
		const url = "mongodb://127.0.0.1:" + process.argv[1] + "/meteor";
		const client = new MongoClient(url, { serverSelectionTimeoutMS: 3000, connectTimeoutMS: 3000 });
		client.connect()
			.then(() => client.db("admin").command({ ping: 1 }))
			.then(() => client.close(true))
			.then(() => process.exit(0))
			.catch(() => process.exit(1));
	' "$port" >/dev/null 2>&1
}

function run_all_tests(){
	local REQUESTED_MODE="${1:-two-worker}"
	local RUN_MODE="$REQUESTED_MODE" PLAYWRIGHT_WORKERS=1
	case "$REQUESTED_MODE" in
		two-worker) RUN_MODE=sequential; PLAYWRIGHT_WORKERS=2 ;;
		sequential) RUN_MODE=sequential ;;
		parallel) RUN_MODE=parallel ;;
		*) echo "ERROR: unknown EVERYTHING mode: $REQUESTED_MODE" >&2; return 2 ;;
	esac
	export WEKAN_PLAYWRIGHT_WORKERS="$PLAYWRIGHT_WORKERS"
	local modeword
	[ "$REQUESTED_MODE" = parallel ] && modeword="at once (concurrently)" || modeword="one stage at a time (${PLAYWRIGHT_WORKERS} Playwright worker(s))"
	# The large heap at the top of this file is for compiling WeKan. Do not hand
	# that same half-of-all-RAM allowance to every runtime process in the test
	# matrix: the bundle server stays alive while E2E/Playwright run, and allowing
	# each Node child 8-16 GiB lets one leaking suite drive the workstation into
	# swap or the OOM killer. Test processes get a quarter of RAM, clamped to a
	# useful maximum of 4 GiB; callers with an exceptional fixture can override this one
	# scope without lowering the heap needed by Meteor's build tool.
	local TEST_HEAP_MB=$(( _mem_total_mb / 4 ))
	[ "$TEST_HEAP_MB" -gt 4096 ] && TEST_HEAP_MB=4096
	local TEST_NODE_OPTIONS="${WEKAN_TEST_NODE_OPTIONS:---max-old-space-size=$TEST_HEAP_MB}"
	echo "Node heap limit for test runtime processes: ${TEST_HEAP_MB} MB."
	echo "  Override by exporting WEKAN_TEST_NODE_OPTIONS yourself."
	# Each whole-suite run gets its own .tools/log/<timestamp>/ directory
	# (stamped once, when the run starts), so logs are never overwritten and
	# previous runs are kept.
	local RUN_TS RUN_LOGDIR
	# WEKAN_LOGDIR is set when a larger run is driving this (EVERYTHING), and
	# then it is THE directory for the whole run - minting a second one here
	# would split one run's logs across two directories, which is the thing the
	# per-run directory exists to prevent. Standalone, this stamps its own and
	# exports it, so every job of this run agrees on it rather than each calling
	# date() again and landing in a different second.
	if [ -n "${WEKAN_LOGDIR:-}" ]; then
		RUN_LOGDIR="$WEKAN_LOGDIR"
	else
		RUN_TS="$(date '+%Y-%m-%d_%H-%M-%S')"
		RUN_LOGDIR="$WEKAN_LOG_ROOT/$RUN_TS"
	fi
	mkdir -p "$RUN_LOGDIR"
	RUN_LOGDIR="$(cd "$RUN_LOGDIR" && pwd)"
	export WEKAN_LOGDIR="$RUN_LOGDIR"
	echo "Logs for this run: $RUN_LOGDIR/  (previous runs are kept)"
	# Tests ALWAYS run against a freshly built bundle. The :3000 test server runs
	# the precompiled .build/bundle, so a stale bundle means the suite passes or
	# fails on code that is no longer in the working tree - the one thing a test
	# run must never do. This used to build only when .build/bundle was missing,
	# which is exactly the case where the bundle is present but old.
	echo "==> Deleting .build and building WeKan before running the tests (always, so the tests run against the current source)."
	build_wekan
	if [ ! -d .build/bundle ]; then
		echo "ERROR: .build/bundle is missing after building. Aborting the test run."
		return 1
	fi
	if [ "$RUN_MODE" = parallel ]; then
		echo "Running ALL tests against ONE WeKan server on http://localhost:3000 - all jobs run IN PARALLEL (concurrently). Needs plenty of RAM (fine on 32 GB)."
	else
		echo "Running ALL tests against ONE WeKan server on http://localhost:3000 - all jobs run SEQUENTIALLY (one at a time)."
	fi
	echo "Two WeKan servers are involved (they do NOT run tests in parallel unless you chose parallel):"
	echo "  :3000  - the PRECOMPILED .build/bundle run as a plain Node server (Meteor's mongod on :3001)"
	echo "           - serves Node E2E + Playwright browser tests. Built fresh above, so the tests run against the current source."
	echo "  :3100  - Mocha via 'meteor test' (its own .meteor/local-test build; the in-process server-side tests"
	echo "           CANNOT run from a production bundle, so this one build is unavoidable)."
	echo "  Import regression is a plain Node script (no server, no MongoDB)."
	SUMMARY=()
	record() { SUMMARY+=("$1|$2|${3:-}"); }
	label_of() { case "$1" in
		mocha) echo "Mocha (server-side)" ;;
		unit) echo "Unit tests (node)" ;;
		import) echo "Import regression" ;;
		e2e) echo "Node E2E regressions" ;;
		chromium) echo "Playwright Chromium" ;;
		firefox) echo "Playwright Firefox" ;;
		webkit) echo "Playwright WebKit" ;;
	esac; }
	# Which Meteor instance each job talks to, with the Node.js (app) port and the
	# bundled MongoDB port (Meteor runs Mongo on app-port+1). The E2E and browser
	# jobs use Meteor #1 (the :3000 dev server); Mocha runs its own Meteor #2 on
	# :3100 (test build .meteor/local-test, Mongo :3101); the import test is a
	# plain Node script and touches no server/DB.
	port_of() { case "$1" in
		mocha) echo "M2 node:3100 db:3101" ;;
		unit) echo "no server (node)" ;;
		import) echo "no server (node)" ;;
		e2e|chromium|firefox|webkit) echo "M1 node:3000 db:3001" ;;
	esac; }
	# A live "tests passed" counter per job. Playwright (list reporter), Mocha
	# (spec reporter) and the import test all print a U+2713 check mark per passing
	# test/assertion; the Node E2E harness prints one "[wekan-e2e] ..." line per
	# step. Both advance while the job runs.
	count_pass() {
		local n
		case "$1" in
			e2e) n=$(grep -c '\[wekan-e2e\]' "$2" 2>/dev/null) ;;
			# The node suites print "  ok - <name>" per assertion group.
			unit) n=$(grep -cE '^\s*ok - ' "$2" 2>/dev/null) ;;
			*)   n=$(grep -c $'\xe2\x9c\x93' "$2" 2>/dev/null) ;;
		esac
		echo "${n:-0}"
	}
	count_fail() {
		local n
		case "$1" in
			e2e) n=$(grep -c 'wekan-e2e\] FAIL' "$2" 2>/dev/null) ;;
			# Two shapes: a suite that keeps going prints "  FAIL - <name>" per failure,
			# and one that throws ends the whole chain with an AssertionError dump.
			# Anchored at the start of the line so the dump's own "throw err" and the
			# stack frames below it are not counted as further failures.
			# The runner ends with "===== node suites: N run, M failed, Ss =====", so
			# the count is its own, not a guess from error text. While it is still
			# running there is no summary line yet: fall back to the failing suites it
			# has already listed ("  x tests/foo.test.cjs (exit 1)"), so the live
			# counter moves during the run too.
			unit) local summary running
			      summary=$(grep -oE 'node suites: [0-9]+( of [0-9]+)? run, [0-9]+ failed' "$2" 2>/dev/null | tail -1)
			      if [ -n "$summary" ]; then
			        n=$(printf '%s' "$summary" | grep -oE '[0-9]+ failed' | grep -oE '[0-9]+')
			      else
			        running=$(grep -cE '^  x tests/' "$2" 2>/dev/null)
			        n=${running:-0}
			      fi ;;
			*)   n=$(grep -cE $'\xe2\x9c\x98|\xe2\x9c\x97' "$2" 2>/dev/null) ;;
		esac
		echo "${n:-0}"
	}
	ORIG_HOME="$HOME"
	PW_FAILURES=""
	TEST_SERVER_PID=""
	MONGOD_PID=""
	STATDIR="$(mktemp -d)"
	BPIDS=""

	# STOP WHAT THIS RUN STARTED, on EVERY way out - not only the happy path.
	#
	# The cleanup at the end of this function is reached when the run finishes.
	# It is not reached when the run is interrupted (Ctrl-C is the usual one) or
	# when one of the early `return 1`s above fires, and then the test mongod on
	# :3001 and the bundle server on :3000 outlive the run. That is not tidy but
	# harmless in itself; what it costs is the NEXT run, which finds the port
	# taken. The harness reuses a database only when it ANSWERS - a port held by
	# something else moves it aside - so a leftover mongod is silently reused
	# instead, holding a database this run did not seed, and the failures land
	# somewhere else entirely.
	#
	# So the stopping is a trap, and the function's own cleanup calls the same
	# code. It is idempotent: each half clears its PID, so running twice stops
	# nothing twice, and a database this run did NOT start (a reused one, whose
	# PID was never recorded) is still left alone.
	stop_test_databases() {
		if [ -n "$TEST_SERVER_PID" ]; then
			echo
			echo "Stopping WeKan test server (bundle node :3000)."
			kill "$TEST_SERVER_PID" >/dev/null 2>&1 || true
			wait "$TEST_SERVER_PID" >/dev/null 2>&1 || true
			TEST_SERVER_PID=""
		fi
		if [ -n "$MONGOD_PID" ]; then
			echo "Stopping test MongoDB (mongod :${TEST_DB_PORT:-3001})."
			kill "$MONGOD_PID" >/dev/null 2>&1 || true
			wait "$MONGOD_PID" >/dev/null 2>&1 || true
			MONGOD_PID=""
		fi
		# The database-conformance stage runs each engine in a container named
		# wekan-conformance-<engine> and removes it when that engine is done. An
		# interrupted run leaves the one it was on, and a container holding port
		# 5432 or 3306 fails the NEXT run's engine before it starts.
		if docker_available; then
			local leftovers
			leftovers=$(docker_exec ps -aq --filter "name=^wekan-conformance-" 2>/dev/null)
			if [ -n "$leftovers" ]; then
				echo "Stopping database-conformance container(s)."
				docker_exec rm -f $leftovers >/dev/null 2>&1 || true
			fi
		fi
	}
	trap 'stop_test_databases; cleanup_everything_processes own; release_everything_lock' EXIT
	trap 'stop_test_databases; cleanup_everything_processes own; release_everything_lock; exit 130' INT TERM
	# Start one test job in the background: record its exit code in STATDIR/<key>
	# and send all of its output to $RUN_LOGDIR/wekan-alltests-<key>.log. In "parallel"
	# mode every job runs at once; in "sequential" mode we wait for each job to
	# finish before starting the next, which keeps total RAM/swap usage low so the
	# machine does not crash (the browser suites in particular are memory-hungry).
	# The actual command for one job. Runs the suite and records its exit code in
	# STATDIR/<key>. Header/footer record the datetime. Used by both modes below.
	run_job_body() {
		local k="$1"
		echo "===== $(label_of "$k") [$(port_of "$k")] - test run started $(date '+%Y-%m-%d %H:%M:%S %Z') ====="
		echo
		local rc=0
		case "$k" in
			mocha)  METEOR_LOCAL_DIR=.meteor/local-test meteor test --once --driver-package meteortesting:mocha --port 3100 || rc=$? ;;
			# Every plain-node suite: the .cjs guards plus the stickers / Trello /
			# OAuth2 .js tests. They need no server and no browser, and the whole-suite
			# run did not run them at all once - a guard that was supposed to fail the
			# suite ran nowhere.
			# tests/run-node-suites.cjs: every plain-node suite, each in its own node
			# process, ALL of them run even when one fails, and the failures listed
			# together at the end. It used to be an && chain, where node stopped at the
			# first failing suite and the ~200 after it never ran while the summary
			# still read "tests:508 fail:1".
			unit)   NODE_OPTIONS="$TEST_NODE_OPTIONS" meteor npm run test:unit:all || rc=$? ;;
			import) NODE_OPTIONS="$TEST_NODE_OPTIONS" node tests/wekanCreator.import.test.js || rc=$? ;;
			e2e)    if browser_needs_docker chromium; then NODE_OPTIONS="$TEST_NODE_OPTIONS" run_node_e2e_docker || rc=$?; else NODE_OPTIONS="$TEST_NODE_OPTIONS" meteor npm run test:e2e || rc=$?; fi ;;
			*)      NODE_OPTIONS="$TEST_NODE_OPTIONS" run_pw_all_browser "$k" || rc=$? ;;
		esac
		echo "$rc" > "$STATDIR/$k"
		echo
		echo "===== $(label_of "$k") - test run finished $(date '+%Y-%m-%d %H:%M:%S %Z') ====="
	}
	launch_job() {
		local k="$1"
		local jlog="$RUN_LOGDIR/wekan-alltests-$k.log"
		if [ "$RUN_MODE" = parallel ]; then
			# Parallel: run in the background to a log; the combined table below reads
			# each log for the live pass/fail counts (many suites at once, so we cannot
			# stream them all interleaved to one console).
			echo "==> Starting $(label_of "$k") (parallel) ... live output: $jlog"
			run_job_body "$k" > "$jlog" 2>&1 &
			BPIDS="$BPIDS $!"
		else
			# Sequential: only one suite runs at a time, so stream its output STRAIGHT
			# to the console (via tee, also saving the log) — you see every test tick by
			# one-by-one as the reporter prints it, instead of just a counter. tee is on
			# the right of the pipe, so run_job_body's exit code is captured in STATDIR.
			echo "==> Running $(label_of "$k") (sequential) — streaming live below (also saved to $jlog):"
			run_job_body "$k" 2>&1 | tee "$jlog"
			local jrc jst jok jbad
			jrc=$(cat "$STATDIR/$k" 2>/dev/null); jrc=${jrc:-1}
			[ "$jrc" = "0" ] && jst="PASS" || jst="FAIL"
			jok=$(count_pass "$k" "$jlog"); jbad=$(count_fail "$k" "$jlog")
			printf '    [%-4s] %-22s tests:%-4s fail:%s\n' "$jst" "$(label_of "$k")" "$jok" "$jbad"
		fi
	}

	if curl -fsS http://127.0.0.1:3000 >/dev/null 2>&1; then
		echo "==> Port 3000 is already in use; stopping the existing Meteor dev server before starting our own."
		# Kill the Meteor dev server(s) on :3000. pgrep matches the parent
		# 'meteor run --port 3000' process; killing it also tears down the
		# node child it spawned. Fall back to whatever is listening on the
		# port (lsof/fuser) in case the process command line does not match.
		OLD_PIDS="$(pgrep -f 'meteor run --port 3000' 2>/dev/null)"
		if [ -n "$OLD_PIDS" ]; then
			echo "    Killing existing Meteor PIDs:$(echo " $OLD_PIDS" | tr '\n' ' ')"
			kill $OLD_PIDS 2>/dev/null
		fi
		# Wait for the port to actually free up, escalating to SIGKILL.
		for i in $(seq 1 30); do
			curl -fsS http://127.0.0.1:3000 >/dev/null 2>&1 || break
			if [ "$i" -eq 15 ]; then
				echo "    Still in use after 15s; sending SIGKILL."
				STUCK_PIDS="$(pgrep -f 'meteor run --port 3000' 2>/dev/null)"
				[ -n "$STUCK_PIDS" ] && kill -9 $STUCK_PIDS 2>/dev/null
				if command -v lsof >/dev/null 2>&1; then
					LSOF_PIDS="$(lsof -ti tcp:3000 2>/dev/null)"
					[ -n "$LSOF_PIDS" ] && kill -9 $LSOF_PIDS 2>/dev/null
				elif command -v fuser >/dev/null 2>&1; then
					fuser -k 3000/tcp >/dev/null 2>&1
				fi
			fi
			printf '.'; sleep 1
		done
		echo
		if curl -fsS http://127.0.0.1:3000 >/dev/null 2>&1; then
			echo "ERROR: Port 3000 is still in use after attempting to stop the existing server. Stop it manually and retry."
			rm -rf "$STATDIR"
			return 1
		fi
		echo "    Port 3000 is now free."
	fi

	# Start the :3000 test server from the PRECOMPILED .build/bundle (NOT `meteor run`)
	# so Node E2E + Playwright reuse the WeKan you already built with
	# `meteor build .build --directory` — no recompile. The bundle is a plain Node
	# server, so it needs (1) its own MongoDB (we start Meteor's bundled mongod on
	# :3001) and (2) its server npm deps installed once. Mocha (:3100) still uses
	# `meteor test` below — its in-process tests cannot run from a production bundle.
	echo
	local BUNDLE_DIR=".build/bundle"
	if [ ! -f "$BUNDLE_DIR/main.js" ]; then
		echo "==> $BUNDLE_DIR/main.js not found — building WeKan first (meteor build .build --directory)."
		build_wekan
	fi
	echo "NOTE: tests run the PRECOMPILED $BUNDLE_DIR as-is. After changing source code,"
	echo "      rebuild it (Tools/menu 'build', i.e. meteor build .build --directory) or the"
	echo "      tests will run the old code."

	# Resolve Meteor's bundled node + mongod: run the bundle with the SAME node its
	# native modules were built against, and reuse the mongod Meteor already ships.
	local NODE_BIN DEV_BUNDLE MONGOD_BIN
	NODE_BIN="$(meteor node -e 'process.stdout.write(process.execPath)' 2>/dev/null)"
	if [ -n "$NODE_BIN" ] && [ -x "$NODE_BIN" ]; then
		DEV_BUNDLE="$(dirname "$(dirname "$NODE_BIN")")"
		MONGOD_BIN="$DEV_BUNDLE/mongodb/bin/mongod"
	fi
	[ -n "$NODE_BIN" ] && [ -x "$NODE_BIN" ] || NODE_BIN="$(command -v node)"
	[ -n "$MONGOD_BIN" ] && [ -x "$MONGOD_BIN" ] || MONGOD_BIN="$(command -v mongod)"
	if [ -z "$NODE_BIN" ]; then
		echo "ERROR: could not find node (neither Meteor's dev_bundle nor system node)."; rm -rf "$STATDIR"; return 1
	fi

	# Install the bundle server's npm deps once (native modules compiled for NODE_BIN).
	if [ ! -d "$BUNDLE_DIR/programs/server/node_modules" ]; then
		echo "==> Installing $BUNDLE_DIR/programs/server npm deps (one-time, for the bundle server). Live output:"
		( cd "$BUNDLE_DIR/programs/server" && meteor npm install ) 2>&1 | tee -a "$RUN_LOGDIR/wekan-test-server.log"
		if [ "${PIPESTATUS[0]}" -ne 0 ]; then
			echo "ERROR: npm install in $BUNDLE_DIR/programs/server failed (see $RUN_LOGDIR/wekan-test-server.log)."; rm -rf "$STATDIR"; return 1
		fi
	fi

	# WHICH PORT the test database is on. 3001 by default - that is what Meteor's
	# own dev mongo used and what the E2E helpers default to - but it is not ours
	# to insist on: on this machine 3001 turned out to belong to an "Omi Server"
	# speaking HTTP, and every run either died on "Topology is closed" or stopped
	# at the check below. So the port is a variable, the run moves to a free one
	# when the default is taken by something that is not a database, and it tells
	# the tests where it went (they already read WEKAN_MONGO_URL:
	# tests/playwright/helpers/db.js).
	local TEST_DB_PORT="${WEKAN_TEST_DB_PORT:-3001}"
	if (exec 3<>/dev/tcp/127.0.0.1/"$TEST_DB_PORT") 2>/dev/null && ! mongo_answers "$TEST_DB_PORT"; then
		local taken="$TEST_DB_PORT"
		local candidate
		for candidate in 3011 3021 3031 3041 3051; do
			if ! (exec 3<>/dev/tcp/127.0.0.1/"$candidate") 2>/dev/null; then
				TEST_DB_PORT="$candidate"; break
			fi
		done
		if [ "$TEST_DB_PORT" = "$taken" ]; then
			echo "ERROR: :$taken is held by something that is not MongoDB, and none of the"
			echo "       fallback ports (3011 3021 3031 3041 3051) is free either."
			echo "       Free one of them, or set WEKAN_TEST_DB_PORT to a port that is."
			rm -rf "$STATDIR"; return 1
		fi
		echo "==> :$taken is held by something that is not MongoDB (it did not answer a ping)."
		echo "    Using :$TEST_DB_PORT for the test database instead; the tests are told where it is."
	fi
	local TEST_MONGO_URL="mongodb://127.0.0.1:$TEST_DB_PORT/meteor"
	export WEKAN_MONGO_URL="$TEST_MONGO_URL"

	# MongoDB on $TEST_DB_PORT. Reuse one that is already listening (e.g. a dev
	# server's mongo); otherwise start Meteor's bundled mongod with a persistent
	# test dbpath.
	#
	# "Listening" is not the same as "working". A TCP connect only proves that
	# SOMETHING accepted, and a mongod that is shutting down - the one this script
	# kills a few lines earlier, on its way out - accepts for a moment longer.
	# The 2026-08-14 run took this branch, started no mongod of its own, and the
	# test server died on its first query:
	#
	#   MongoTopologyClosedError: Topology is closed
	#   [An error occurred when creating an index for collection "users: Topology is closed]
	#
	# ...with no wekan-test-mongod.log to say otherwise, because none was started.
	# So ASK it: a `ping` through the bundle's own driver. Only an answer counts as
	# a database to reuse.
	if (exec 3<>/dev/tcp/127.0.0.1/"$TEST_DB_PORT") 2>/dev/null && mongo_answers "$TEST_DB_PORT"; then
		echo "==> Reusing the MongoDB already listening on :$TEST_DB_PORT (not started or stopped by this run)."
	elif (exec 3<>/dev/tcp/127.0.0.1/"$TEST_DB_PORT") 2>/dev/null; then
		# Only reachable when the port was taken between the check above and here.
		echo "ERROR: something is listening on :$TEST_DB_PORT but does not answer a MongoDB ping."
		echo "       That is usually a mongod still shutting down, or another program that"
		echo "       took the port just now. Nothing was started, because the port is taken."
		echo "       Wait a few seconds and run this again, or free it:"
		echo "         fuser -k $TEST_DB_PORT/tcp    # or: lsof -ti :$TEST_DB_PORT | xargs kill"
		rm -rf "$STATDIR"; return 1
	else
		if [ -z "$MONGOD_BIN" ] || [ ! -x "$MONGOD_BIN" ]; then
			echo "ERROR: nothing is listening on :$TEST_DB_PORT and no mongod was found (Meteor dev_bundle or PATH)."
			echo "       Meteor's bundled mongod is normally at <dev_bundle>/mongodb/bin/mongod."; rm -rf "$STATDIR"; return 1
		fi
		local DBPATH="../mongodb-test-$TEST_DB_PORT"
		mkdir -p "$DBPATH"
		echo "==> Starting MongoDB (Meteor's mongod) on :$TEST_DB_PORT, dbpath $DBPATH."
		{ echo "===== mongod :$TEST_DB_PORT - started $(date '+%Y-%m-%d %H:%M:%S %Z') ====="; "$MONGOD_BIN" --port "$TEST_DB_PORT" --dbpath "$DBPATH" --bind_ip 127.0.0.1 --nounixsocket; } > "$RUN_LOGDIR/wekan-test-mongod.log" 2>&1 &
		MONGOD_PID=$!
		local db_ready=0
		for i in $(seq 1 60); do
			if (exec 3<>/dev/tcp/127.0.0.1/"$TEST_DB_PORT") 2>/dev/null && mongo_answers "$TEST_DB_PORT"; then db_ready=1; break; fi
			sleep 1
		done
		if [ "$db_ready" -ne 1 ]; then
			echo "ERROR: MongoDB did not become ready on :$TEST_DB_PORT (see $RUN_LOGDIR/wekan-test-mongod.log)."
			kill "$MONGOD_PID" >/dev/null 2>&1 || true; MONGOD_PID=""; rm -rf "$STATDIR"; return 1
		fi
	fi

	# Start the precompiled bundle as the :3000 server. Use an ABSOLUTE WRITABLE_PATH
	# (the bundle's main.js may chdir into programs/server, which would break a
	# relative "..").
	# Keep browser-test files below the repository: a Docker daemon reached via
	# Flatpak sees this shared checkout, but its view of the repository's parent
	# directory is not necessarily the sandbox's view. Both the bundle server and
	# browser containers therefore use this ignored, run-local storage root.
	local WRITABLE_ABS="$WEKAN_DIR/.tools/test-writable"
	mkdir -p "$WRITABLE_ABS/files"
	export WEKAN_FILES_PATH_HOST="$WRITABLE_ABS/files"
	echo "==> Starting the WeKan test server on http://localhost:3000 from $BUNDLE_DIR (precompiled — no rebuild)."
	echo "    Live server log follows (scrolling) until :3000 answers:"
	echo "    -------------------------------------------------------------------"
	: >> "$RUN_LOGDIR/wekan-test-server.log"
	# Follow only NEW lines so you SEE the server boot output scroll by (Mongo connect,
	# WeKan startup, "App running at ...", etc.) — real, visible progress instead of a
	# single frozen summary line. The tail is stopped once :3000 answers, before the
	# tests (which print their own output) start.
	tail -n 0 -f "$RUN_LOGDIR/wekan-test-server.log" &
	local TAIL_PID=$!
	# DB name MUST be "meteor": that is what Meteor's built-in mongo used under the old
	# `meteor run`, and the Playwright/E2E tests seed straight into
	# mongodb://127.0.0.1:3001/meteor (tests/playwright/helpers/db.js). Using any other
	# db name (e.g. /wekan) makes the app read an empty database while the tests seed a
	# different one, so every test that needs seeded data fails.
	{ echo "===== WeKan test server [bundle node :3000 db :$TEST_DB_PORT/meteor] - started $(date '+%Y-%m-%d %H:%M:%S %Z') ====="; echo; \
	  MONGO_URL="$TEST_MONGO_URL" ROOT_URL="http://localhost:3000" PORT=3000 \
	  WRITABLE_PATH="$WRITABLE_ABS" WITH_API=true RICHER_CARD_COMMENT_EDITOR=false \
	  DEFAULT_METEOR_REACTIVITY_ORDER="changeStreams,oplog,polling" \
	  NODE_OPTIONS="$TEST_NODE_OPTIONS" "$NODE_BIN" "$BUNDLE_DIR/main.js"; } >> "$RUN_LOGDIR/wekan-test-server.log" 2>&1 &
	TEST_SERVER_PID=$!

	SERVER_READY=0
	server_wait_start=$(date +%s)
	server_wait_max=300
	while :; do
		if curl -fsS --connect-timeout 2 --max-time 4 http://127.0.0.1:3000/sign-in >/dev/null 2>&1; then SERVER_READY=1; fi
		[ "$SERVER_READY" -eq 1 ] && break
		[ "$(( $(date +%s) - server_wait_start ))" -ge "$server_wait_max" ] && break
		sleep 1
	done
	# Stop the live tail before running the tests (they print their own output).
	kill "$TAIL_PID" >/dev/null 2>&1 || true
	wait "$TAIL_PID" 2>/dev/null || true
	echo "    -------------------------------------------------------------------"
	if [ "$SERVER_READY" -eq 1 ]; then
		echo "==> WeKan test server ready on http://localhost:3000 (precompiled bundle, no rebuild)."
	fi

	# Mocha and the import regression do not need the :3000 server; launch them
	# now (after the server build is past, so they no longer compete with it),
	# then the E2E and browser jobs below.
	echo "==> Launching Mocha (separate .meteor/local-test build, port 3100), the node unit suites and the import regression, $modeword."
	launch_job mocha
	launch_job unit
	launch_job import

	if [ "$SERVER_READY" -ne 1 ]; then
		echo "FAIL: server did not become ready on http://localhost:3000 (see $RUN_LOGDIR/wekan-test-server.log)"
		record FAIL "Server startup"
		record SKIP "Node E2E regressions"
		record SKIP "Playwright Chromium"
		record SKIP "Playwright Firefox"
		record SKIP "Playwright WebKit"
		ALLKEYS="mocha unit import"
	else
		record PASS "Server startup"
		# Server is up: add the server-facing jobs to the running set.
		launch_job e2e
		launch_job chromium
		launch_job firefox
		launch_job webkit
		ALLKEYS="mocha unit import e2e chromium firefox webkit"
	fi

	# PARALLEL only: a live combined table, one refreshing line per concurrently
	# running job, until all end. In SEQUENTIAL mode there is nothing to show here —
	# each job already ran one-at-a-time and streamed its own output live, so we skip
	# straight to the summary (keeping sequential simple: one thing at a time).
	if [ "$RUN_MODE" = parallel ]; then
		BN="$(set -- $ALLKEYS; echo $#)"
		echo "Results per job — [status] name (server node/db ports) tests:passed fail:failed; jobs run $modeword:"
		for k in $ALLKEYS; do echo; done
		while :; do
			printf '\033[%dA' "$BN"
			alldone=1
			for k in $ALLKEYS; do
				log="$RUN_LOGDIR/wekan-alltests-$k.log"
				ok=$(count_pass "$k" "$log")
				bad=$(count_fail "$k" "$log")
				if [ -f "$STATDIR/$k" ]; then
					rc=$(cat "$STATDIR/$k" 2>/dev/null)
					if [ "${rc:-1}" = "0" ]; then st="PASS"; else st="FAIL"; fi
				else
					st="RUN "; alldone=0
				fi
				printf '\033[K  [%-4s] %-22s %-22s tests:%-4s fail:%s\n' "$st" "$(label_of "$k")" "$(port_of "$k")" "$ok" "$bad"
			done
			[ "$alldone" -eq 1 ] && break
			sleep 1
		done
	fi
	for p in $BPIDS; do wait "$p" 2>/dev/null || true; done

	# Roll the results into the summary (browsers carry pass/fail stats).
	for k in $ALLKEYS; do
		rc=$(cat "$STATDIR/$k" 2>/dev/null); rc=${rc:-1}
		label="$(label_of "$k")"
		case "$k" in
			chromium|firefox|webkit)
				json="$WEKAN_DIR/tests/playwright/test-results/all-tests-${k}.json"
				stats="$(pw_stats_of "$json")"
				if [ "$rc" = "0" ]; then record PASS "$label" "$stats"; else record FAIL "$label" "$stats"; fi
				fails="$(pw_failures_of "$json" "$label")"
				[ -n "$fails" ] && PW_FAILURES="${PW_FAILURES}${fails}"$'\n'
				;;
			*)
				if [ "$rc" = "0" ]; then record PASS "$label"; else record FAIL "$label"; fi
				;;
		esac
	done
	rm -rf "$STATDIR"

	# The same stopping the trap does, here on the normal path so the summary
	# below is printed with the databases already down. Idempotent, so the trap
	# firing afterwards on EXIT does nothing. A pre-existing/reused database is
	# left alone either way: its PID was never recorded.
	stop_test_databases

	echo
	echo "==================== TEST SUMMARY ===================="
	FAILED=0
	for line in "${SUMMARY[@]}"; do
		status="${line%%|*}"; rest="${line#*|}"; name="${rest%%|*}"; stats="${rest#*|}"
		suffix=""
		[ -n "$stats" ] && suffix="  ($stats)"
		printf '  %-6s %s%s\n' "$status" "$name" "$suffix"
		[ "$status" = "FAIL" ] && FAILED=1
	done
	echo "====================================================="
	echo "(per-job logs: $RUN_LOGDIR/wekan-alltests-<mocha|import|e2e|chromium|firefox|webkit>.log ; server: $RUN_LOGDIR/wekan-test-server.log)"
	if [ -n "$PW_FAILURES" ]; then
		echo
		echo "Failing Playwright tests:"
		while IFS= read -r f; do
			[ -n "$f" ] && printf '  FAIL  %s\n' "$f"
		done <<< "$PW_FAILURES"
		echo "(full output and traces in the per-browser logs; HTML report in tests/playwright/playwright-report)"
		echo "====================================================="
	fi
	if [ "$FAILED" -eq 0 ]; then echo "RESULT: All tests passed."; else echo "RESULT: Some tests FAILED (see details above)."; fi
	# The run directory and the verdict, for a caller that runs this as one stage of
	# something larger (see run_everything below).
	WEKAN_LAST_LOGDIR="$RUN_LOGDIR"
	return "$FAILED"
}

# floating_promises_checks — the guard's CHECKS, with nothing that installs or
# edits anything.
#
# The menu option of the same name may install ripgrep and the @typescript-eslint
# packages and write the rule into .eslintrc.json: that is a person choosing to
# set the guard up, interactively. EVERYTHING runs unattended, must not call
# sudo, and must not modify the tree it is testing - a run that edits
# .eslintrc.json is no longer testing the commit it started from. So the checks
# themselves live here, are pure reads, and are what both callers run:
#
#   * the no-floating-promises rule is configured in .eslintrc.json;
#   * every Authentication.checkBoardAccess / checkBoardWriteAccess in
#     server/models is awaited. An unawaited permission check returns a pending
#     promise, and a promise is truthy, so the call site passes a check that
#     never ran - which is a permission bug that looks like working code.
#
# grep, not ripgrep: this must work on a machine where rg is not installed and
# where nothing may be installed to make it work.
function floating_promises_checks(){
	local rc=0 calls
	echo "Checking that @typescript-eslint/no-floating-promises is configured in .eslintrc.json"
	if grep -q '"@typescript-eslint/no-floating-promises"' .eslintrc.json 2>/dev/null; then
		echo "OK: the rule is configured."
	else
		echo "FAIL: @typescript-eslint/no-floating-promises is NOT configured in .eslintrc.json."
		echo "      Tests -> 'Floating-promises guard' installs the packages and writes it."
		rc=1
	fi
	echo
	echo "Scanning server/models for unawaited Authentication.checkBoardAccess / checkBoardWriteAccess"
	calls="$(grep -RInE 'Authentication\.(checkBoardAccess|checkBoardWriteAccess)\(' server/models 2>/dev/null \
		| grep -vE 'await Authentication\.(checkBoardAccess|checkBoardWriteAccess)\(' || true)"
	if [ -n "$calls" ]; then
		echo "FAIL: these board auth checks are not awaited:"
		printf '%s\n' "$calls"
		rc=1
	else
		echo "OK: every board auth check in server/models is awaited."
	fi
	return $rc
}

# run_everything — every test WeKan and FerretDB have, one after another.
#
# Four stages, sequential on purpose: the static guard (seconds, so a broken
# permission check is reported before an hour of browsers), then the WeKan suite
# (which builds a fresh bundle and starts a server, and runs mocha, the node
# suites, the import regression, the node E2E and all three browsers), then the
# database conformance run (which builds FerretDB from source and runs one query
# catalogue against every database with an image for this CPU), then FerretDB's
# own tests (unit, vet - which includes its no-LFS guard - and integration).
# They share one log/<datetime>/ directory, so "the newest test logs" is one
# place.
#
# Everything in the Tests menu that is a TEST is in here. What is deliberately
# not: "Install Playwright browsers" (setup, and the browser stages install what
# they need), and "Count tests by category" (a report, not a check).
#
# FerretDB lives in .tools/FerretDB, cloned on demand by ensure_tool_repo (and by
# releases/db-conformance.sh, which needs it a stage earlier). .tools/ is ignored
# by git and by Meteor, so a companion repo cannot reach a commit or a rebuild.
function run_everything(){
	local EVERYTHING_MODE="${1:-two-worker}"
	acquire_everything_lock || return 1
	trap 'cleanup_everything_processes own; release_everything_lock' EXIT
	trap 'cleanup_everything_processes own; release_everything_lock; exit 130' INT TERM
	local RUN_TS RUN_LOGDIR FAILED=0
	# Bound Go package parallelism separately from Node so many compiler processes
	# cannot drive the workstation into swap. Keep 1-4 workers and a proportional,
	# at-most-4 GiB
	# managed-heap limit per Go process; explicit overrides still win.
	local FERRET_GO_JOBS=$(( _mem_total_mb / 4096 ))
	[ "$FERRET_GO_JOBS" -lt 1 ] && FERRET_GO_JOBS=1
	[ "$FERRET_GO_JOBS" -gt 4 ] && FERRET_GO_JOBS=4
	local FERRET_GO_MEMORY_MB=$(( _mem_total_mb / 8 ))
	[ "$FERRET_GO_MEMORY_MB" -gt 4096 ] && FERRET_GO_MEMORY_MB=4096
	local FERRET_GOFLAGS="${WEKAN_FERRETDB_GOFLAGS:--p=$FERRET_GO_JOBS}"
	local FERRET_GOMEMLIMIT="${WEKAN_FERRETDB_GOMEMLIMIT:-${FERRET_GO_MEMORY_MB}MiB}"
	RUN_TS="$(date '+%Y-%m-%d_%H-%M-%S')"
	RUN_LOGDIR="$WEKAN_LOG_ROOT/$RUN_TS"
	mkdir -p "$RUN_LOGDIR"
	RUN_LOGDIR="$(cd "$RUN_LOGDIR" && pwd)"
	export WEKAN_LOGDIR="$RUN_LOGDIR"

	echo "=============================================================================="
	echo "EVERYTHING mode: $EVERYTHING_MODE. Logs: $RUN_LOGDIR/"
	echo "  1/4  Floating-promises guard (seconds: the rule, and unawaited auth checks)"
	echo "  2/4  WeKan's own tests       (builds the bundle, starts a server; mocha, the"
	echo "                                node suites, import, node E2E, three browsers)"
	echo "  3/4  Database conformance    (builds FerretDB, every database this CPU runs)"
	echo "  4/4  FerretDB's own tests    (unit, vet, integration)"
	echo "Database and FerretDB stages remain sequential; the WeKan phase follows the selected mode."
	echo "FerretDB Go limit: $FERRET_GO_JOBS parallel package builds, $FERRET_GOMEMLIMIT managed heap per Go process."
	echo "  Override with WEKAN_FERRETDB_GOFLAGS / WEKAN_FERRETDB_GOMEMLIMIT."
	echo "=============================================================================="
	echo

	local guard_rc=0 wekan_rc=0 conf_rc=0 ferret_rc=0

	echo "### 1/4 Floating-promises guard ###############################################"
	# Checks only - no installing, no editing of .eslintrc.json. It takes seconds,
	# so it runs first: an unawaited permission check should not be reported after
	# an hour of browser tests.
	floating_promises_checks 2>&1 | tee "$RUN_LOGDIR/wekan-floating-promises.log"
	guard_rc=${PIPESTATUS[0]}

	echo
	echo "### 2/4 WeKan tests ###########################################################"
	run_all_tests "$EVERYTHING_MODE" || wekan_rc=$?

	echo
	echo "### 3/4 Database conformance ##################################################"
	if [ -x ./releases/db-conformance.sh ]; then
		GOFLAGS="$FERRET_GOFLAGS" GOMEMLIMIT="$FERRET_GOMEMLIMIT" \
			./releases/db-conformance.sh || conf_rc=$?
	else
		echo "ERROR: releases/db-conformance.sh is missing."; conf_rc=1
	fi

	echo
	echo "### 4/4 FerretDB tests ########################################################"
	# .tools/FerretDB, cloned here if this is the first run on this machine -
	# stage 3 usually got there first, but EVERYTHING must not depend on the
	# order of its own stages.
	ferret_dir="$(ensure_tool_repo FerretDB)" || ferret_dir=""
	if [ -n "$ferret_dir" ] && [ -x "$ferret_dir/build.sh" ]; then
		( cd "$ferret_dir" && WEKAN_LOGDIR="$RUN_LOGDIR" \
			GOFLAGS="$FERRET_GOFLAGS" GOMEMLIMIT="$FERRET_GOMEMLIMIT" \
			./build.sh test-all ) || ferret_rc=$?
	else
		echo "ERROR: .tools/FerretDB/build.sh is missing and could not be cloned."
		echo "       Clone it by hand: git clone git@github.com:wekan/FerretDB .tools/FerretDB"
		ferret_rc=1
	fi

	echo
	echo "=============================== EVERYTHING ==================================="
	printf '  %-6s %s\n' "$([ $guard_rc  -eq 0 ] && echo PASS || echo FAIL)" "Floating-promises guard (rule + unawaited board auth checks)"
	printf '  %-6s %s\n' "$([ $wekan_rc  -eq 0 ] && echo PASS || echo FAIL)" "WeKan tests (mocha, node suites, import, E2E, three browsers)"
	printf '  %-6s %s\n' "$([ $conf_rc   -eq 0 ] && echo PASS || echo FAIL)" "Database conformance (all databases for this CPU)"
	printf '  %-6s %s\n' "$([ $ferret_rc -eq 0 ] && echo PASS || echo FAIL)" "FerretDB tests (unit, vet, integration)"
	echo "=============================================================================="
	echo "All logs: $RUN_LOGDIR/"
	unset WEKAN_LOGDIR
	[ $guard_rc -eq 0 ] && [ $wekan_rc -eq 0 ] && [ $conf_rc -eq 0 ] && [ $ferret_rc -eq 0 ] || FAILED=1
	if [ "$FAILED" -eq 0 ]; then echo "RESULT: EVERYTHING passed."; else echo "RESULT: something FAILED - see the stage summaries above."; fi
	release_everything_lock
	return "$FAILED"
}

# Only one complete matrix may own the shared test ports and databases. The lock
# stores both PID and a platform process-start token, so a stale PID cannot terminate an
# unrelated process after PID reuse. A new run asks the old shell to clean up,
# waits for it, and force-stops it only if graceful shutdown does not finish.
EVERYTHING_LOCK_DIR="$WEKAN_DIR/.tools/run-everything.lock"
EVERYTHING_LOCK_OWNED=0

everything_process_start() {
	if [ -r "/proc/$1/stat" ]; then
		awk "{ print \$22 }" "/proc/$1/stat" 2>/dev/null
	else
		ps -p "$1" -o lstart= 2>/dev/null | cksum | awk "{ print \$1 }"
	fi
}

everything_process_is_owner() {
	local pid="$1" start="$2" actual
	case "$pid:$start" in *[!0-9:]*|:*) return 1 ;; esac
	actual="$(everything_process_start "$pid")"
	[ -n "$actual" ] && [ "$actual" = "$start" ] && kill -0 "$pid" 2>/dev/null
}

everything_expand_descendants() {
	local pids="$1" changed=1 pid ppid tree
	tree="$(ps -eo pid=,ppid= 2>/dev/null)"
	while [ "$changed" = 1 ]; do
		changed=0
		while read -r pid ppid; do
			case " $pids " in
				*" $pid "*) ;;
				*" $ppid "*) pids="$pids $pid"; changed=1 ;;
			esac
		done <<< "$tree"
	done
	printf "%s\n" "$pids"
}

everything_pid_running() {
	local state
	state="$(ps -o stat= -p "$1" 2>/dev/null)"
	[ -n "$state" ] && [ "${state#Z}" = "$state" ]
}

cleanup_everything_processes() {
	local scope="${1:-all}" pid pids="" survivors="" containers=""
	if [ "$scope" != own ] && command -v pgrep >/dev/null 2>&1; then
		for pid in $(pgrep -f "[b]uild\.sh --run-everything" 2>/dev/null); do
			[ "$pid" = "$$" ] || pids="$pids $pid"
		done
		for pid in $(pgrep -f "$WEKAN_DIR/(tests|\.build/bundle|releases/db-conformance)" 2>/dev/null); do
			[ "$pid" = "$$" ] || pids="$pids $pid"
		done
	fi
	pids="$(everything_expand_descendants "$pids $$")"
	local filtered_pids=""
	for pid in $pids; do
		[ "$pid" = "$$" ] || ! everything_pid_running "$pid" || filtered_pids="$filtered_pids $pid"
	done
	pids="$filtered_pids"
	if [ -n "${pids//[[:space:]]/}" ]; then
		echo "==> Stopping previous WeKan test process(es):$pids"
		kill -TERM $pids 2>/dev/null || true
		sleep 5
		for pid in $pids; do
			everything_pid_running "$pid" && kill -KILL "$pid" 2>/dev/null || true
		done
		sleep 2
		for pid in $pids; do
			everything_pid_running "$pid" && survivors="$survivors $pid"
		done
	fi
	if ! kill_meteor_on_port 3000; then survivors="$survivors ports:3000/3001"; fi
	if docker_available; then
		containers=$(docker_exec ps -aq --filter "label=org.wekan.test-run" 2>/dev/null)
		containers="$containers $(docker_exec ps -aq --filter "name=^wekan-conformance-" 2>/dev/null)"
		[ -n "$(printf "%s" "$containers" | tr -d "[:space:]")" ] && docker_exec rm -f $containers >/dev/null 2>&1 || true
		containers=$(docker_exec ps -q --filter "label=org.wekan.test-run" 2>/dev/null)
		containers="$containers $(docker_exec ps -q --filter "name=^wekan-conformance-" 2>/dev/null)"
	fi
	if [ -n "$survivors" ] || [ -n "$(printf "%s" "$containers" | tr -d "[:space:]")" ]; then
		echo "ERROR: Could not stop previous WeKan tests and databases."
		[ -n "$survivors" ] && echo "       Test process or port survivor(s):$survivors"
		[ -n "$(printf "%s" "$containers" | tr -d "[:space:]")" ] && echo "       Test container(s) still running:$containers"
		echo "       No new EVERYTHING test run was started. Stop them manually and retry."
		return 1
	fi
	return 0
}

release_everything_lock() {
	[ "${EVERYTHING_LOCK_OWNED:-0}" = 1 ] || return 0
	local pid start
	if read -r pid start < "$EVERYTHING_LOCK_DIR/owner" 2>/dev/null && [ "$pid" = "$$" ]; then
		rm -f "$EVERYTHING_LOCK_DIR/owner"
		rmdir "$EVERYTHING_LOCK_DIR" 2>/dev/null || true
	fi
	EVERYTHING_LOCK_OWNED=0
}

acquire_everything_lock() {
	mkdir -p "$WEKAN_DIR/.tools"
	local old_pid old_start waited
	while ! mkdir "$EVERYTHING_LOCK_DIR" 2>/dev/null; do
		old_pid=""; old_start=""
		read -r old_pid old_start < "$EVERYTHING_LOCK_DIR/owner" 2>/dev/null || true
		if everything_process_is_owner "$old_pid" "$old_start"; then
			echo "==> Stopping older EVERYTHING run (PID $old_pid) before starting over."
			kill -TERM "$old_pid" 2>/dev/null || true
			waited=0
			while everything_process_is_owner "$old_pid" "$old_start" && [ "$waited" -lt 30 ]; do
				sleep 1
				waited=$((waited + 1))
			done
			if everything_process_is_owner "$old_pid" "$old_start"; then
				echo "==> Older EVERYTHING run did not stop in 30 seconds; force-stopping it."
				kill -KILL "$old_pid" 2>/dev/null || true
				sleep 2
			fi
			if everything_process_is_owner "$old_pid" "$old_start"; then
				echo "ERROR: Could not stop previous WeKan tests and databases (PID $old_pid)."
				echo "       No new EVERYTHING test run was started. Stop that process manually and retry."
				return 1
			fi
		else
			echo "==> Removing stale EVERYTHING run lock."
		fi
		rm -f "$EVERYTHING_LOCK_DIR/owner"
		rmdir "$EVERYTHING_LOCK_DIR" 2>/dev/null || true
	done
	if ! cleanup_everything_processes; then
		rmdir "$EVERYTHING_LOCK_DIR" 2>/dev/null || true
		return 1
	fi
	printf "%s %s\n" "$$" "$(everything_process_start "$$")" > "$EVERYTHING_LOCK_DIR/owner"
	EVERYTHING_LOCK_OWNED=1
}
# ============================================================================
# Multi-forge tooling (menu options below).
#   * install_forge_tools: install gh-like CLIs (gh, glab, tea, git-bug, forge).
#   * mirror_forge: mirror a repo from GitHub to GitLab/Codeberg/Forgejo/Gitea.
# Code history is pushed with `git push --mirror`; issues, PRs and CI workflow
# syntax (which git cannot carry) are handled by tools/forge-mirror.js (Node).
# Forge registry: index = menu number - 1.
# ============================================================================
FORGE_NAMES=("GitHub" "GitLab" "Codeberg" "Forgejo (self-hosted)" "Gitea (self-hosted)")
FORGE_HOST=("github.com" "gitlab.com" "codeberg.org" "" "")
FORGE_TOOL=("gh" "glab" "tea" "tea" "tea")
FORGE_KIND=("github" "gitlab" "codeberg" "forgejo" "gitea")

function forge_list(){
	local i
	for i in "${!FORGE_NAMES[@]}"; do printf "  %d) %s\n" "$((i+1))" "${FORGE_NAMES[$i]}"; done
}

function install_forge_tools(){
	echo
	echo "Installing gh-like forge CLIs: gh, glab, tea, git-bug, forge (git-pkgs/forge)."
	echo "Already-installed tools are skipped. Package manager is auto-detected."
	local PM=""
	if command -v brew >/dev/null 2>&1; then PM=brew
	elif command -v apt  >/dev/null 2>&1; then PM=apt
	elif command -v dnf  >/dev/null 2>&1; then PM=dnf
	elif command -v yum  >/dev/null 2>&1; then PM=yum
	elif command -v apk  >/dev/null 2>&1; then PM=apk
	elif command -v pacman >/dev/null 2>&1; then PM=pacman
	fi
	echo "Detected package manager: ${PM:-none}"

	# gh - GitHub CLI (source forge)
	if command -v gh >/dev/null 2>&1; then echo "OK: gh present"
	else ensure_tools gh || echo "Install gh manually: https://github.com/cli/cli#installation"; fi

	# glab - GitLab CLI
	if command -v glab >/dev/null 2>&1; then echo "OK: glab present"
	else ensure_tools glab || echo "Install glab manually: https://gitlab.com/gitlab-org/cli/-/releases"; fi
	# tea - Gitea/Forgejo CLI (covers Codeberg, Forgejo, Gitea)
	if command -v tea >/dev/null 2>&1; then echo "OK: tea present"
	elif [ "$PM" = brew ]; then brew install tea
	elif command -v go >/dev/null 2>&1; then go install code.gitea.io/tea@latest
	else echo "Install tea manually: https://gitea.com/gitea/tea/releases (or 'brew install tea')"; fi

	# git-bug - distributed issue tracker / bridges
	if command -v git-bug >/dev/null 2>&1; then echo "OK: git-bug present"
	elif [ "$PM" = brew ]; then brew install git-bug
	elif command -v go >/dev/null 2>&1; then go install github.com/git-bug/git-bug@latest
	else echo "Install git-bug manually: https://github.com/git-bug/git-bug/releases"; fi

	# forge - git-pkgs/forge unified multi-forge CLI
	if command -v forge >/dev/null 2>&1; then echo "OK: forge present"
	elif command -v go >/dev/null 2>&1; then
		go install github.com/git-pkgs/forge@latest \
			|| echo "go install failed; see https://github.com/git-pkgs/forge for the current install path"
	else echo "Install forge manually (needs Go): https://github.com/git-pkgs/forge"; fi

	echo
	echo "Authenticate before mirroring:  gh auth login | glab auth login | tea login add"
	command -v go >/dev/null 2>&1 && echo "Note: Go tools install to \$(go env GOPATH)/bin — ensure it is on your PATH."
}

function mirror_forge(){
	local scriptdir; scriptdir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
	echo
	echo "Mirror a repository between forges (code + issues + PRs + Actions)."
	echo "Forges:"
	forge_list
	echo
	read -p "Enter SOURCE and TARGET numbers, e.g. '1 3' (GitHub -> Codeberg): " SRC TGT
	case "${SRC}${TGT}" in *[!12345]*|"") echo "Invalid selection."; return ;; esac
	if [ "$SRC" = "$TGT" ]; then echo "Source and target must differ."; return; fi
	local si=$((SRC-1)) ti=$((TGT-1))
	echo "Source: ${FORGE_NAMES[$si]}   ->   Target: ${FORGE_NAMES[$ti]}"
	if [ "${FORGE_TOOL[$si]}" != gh ]; then
		echo "NOTE: automated issue/PR sync supports GitHub as SOURCE only;"
		echo "      code mirroring + CI conversion still work for any source."
	fi
	read -p "Source repo (owner/name): " SREPO
	read -p "Target repo (owner/name): " TREPO
	if [ -z "$SREPO" ] || [ -z "$TREPO" ]; then echo "Both repos are required."; return; fi
	local shost="${FORGE_HOST[$si]}" thost="${FORGE_HOST[$ti]}"
	[ -z "$shost" ] && read -p "Source host (e.g. git.example.com): " shost
	[ -z "$thost" ] && read -p "Target host (e.g. git.example.com): " thost

	# 1. Code: mirror all branches + tags.
	echo
	read -p "Mirror code (all branches/tags) with 'git push --mirror'? [y/N] " DOCODE
	case "$DOCODE" in [Yy]*)
		local work; work="$(mktemp -d)"
		echo "Cloning https://$shost/$SREPO.git (mirror) ..."
		if git clone --mirror "https://$shost/$SREPO.git" "$work/repo.git"; then
			echo "Pushing to https://$thost/$TREPO.git (target must exist; push credentials required) ..."
			( cd "$work/repo.git" && git push --mirror "https://$thost/$TREPO.git" ) \
				|| echo "Push failed — check the target repo exists and credentials are set."
		else
			echo "Clone failed — check the source URL/host."
		fi
		rm -rf "$work"
		;;
	esac

	# 2 + 3. Issues / PRs / Actions via the Node engine (dry run first).
	echo
	echo "Now syncing issues + PRs (missing only) and converting CI workflows (DRY RUN)..."
	node "$scriptdir/tools/forge-mirror.js" \
		--source-tool "${FORGE_TOOL[$si]}" --source-repo "$SREPO" --source-host "$shost" \
		--target-tool "${FORGE_TOOL[$ti]}" --target-repo "$TREPO" --target-host "$thost" \
		--target-kind "${FORGE_KIND[$ti]}" --include-closed
	echo
	read -p "Apply the issue/PR creation at the target now (not a dry run)? [y/N] " APPLYNOW
	case "$APPLYNOW" in [Yy]*)
		node "$scriptdir/tools/forge-mirror.js" \
			--source-tool "${FORGE_TOOL[$si]}" --source-repo "$SREPO" --source-host "$shost" \
			--target-tool "${FORGE_TOOL[$ti]}" --target-repo "$TREPO" --target-host "$thost" \
			--target-kind "${FORGE_KIND[$ti]}" --include-closed --issues --prs --apply ;;
	esac
	echo "Mirror flow complete."
}

# Run a docker compose subcommand against one of the docker-compose*.yml files
# (prebuilt ghcr.io/wekan/wekan image). $1 = compose file, rest = subcommand,
# e.g. `wekan_docker docker-compose.yml up -d` / `... logs -f` / `... down`.
wekan_docker() {
	local f="$1"; shift
	if [ ! -f "$f" ]; then echo "Compose file not found: $f"; return 1; fi
	local dc; if docker compose version >/dev/null 2>&1; then dc="docker compose"; else dc="docker-compose"; fi
	echo "Running: $dc -f $f $*"
	$dc -f "$f" "$@"
}

# Build the wekan-app Docker image from the LOCAL source (the repo Dockerfile) and
# tag it as the image the given compose file references, so a following `up -d`
# runs your freshly built container instead of a possibly-stale prebuilt image
# pulled from the registry. Use this when you changed WeKan source and want Docker
# to run that change. $1 = compose file.
wekan_docker_build_image() {
	local f="$1"
	if [ ! -f "$f" ]; then echo "Compose file not found: $f"; return 1; fi
	if [ ! -f Dockerfile ]; then echo "Dockerfile not found in $(pwd) - run this from the repo root."; return 1; fi
	# The wekan-app image tag this compose file uses (e.g. ghcr.io/wekan/wekan:latest).
	local img
	img="$(grep -E '^[[:space:]]*image:[[:space:]]*[^#].*wekan/wekan' "$f" | head -1 | sed -E 's/.*image:[[:space:]]*//; s/[[:space:]]*$//')"
	[ -z "$img" ] && img="ghcr.io/wekan/wekan:latest"
	echo "==> Building wekan-app image from local source, tagging it as: $img"
	echo "    (equivalent to 'docker compose up -d --build'; the built image replaces the prebuilt one)"
	docker build -t "$img" -f Dockerfile . || { echo "ERROR: Docker build failed."; return 1; }
	echo "==> Build done: $img"
	return 0
}

# ── inotify watch limit ──────────────────────────────────────────────────────
# Meteor's file watcher takes ONE inotify watch per DIRECTORY it watches, and the
# limit (fs.inotify.max_user_watches) is per USER, shared with every other
# watcher that user runs - VS Code and other editors are usually the biggest
# other consumer. On a stock kernel it is 8192 or 65536, and a WeKan checkout
# (node_modules, .meteor/local, plus whatever else lives under the repo) can sit
# close to that on its own. When it runs out, Meteor fails with a message that
# blames the DISK and sends people looking in the wrong place:
#
#   Failed to start watcher for <repo>: [Error: inotify_add_watch on '<path>'
#   failed: No space left on device]
#
# ENOSPC from inotify_add_watch means "watch limit reached", NOT a full disk.
#
# So: check the limit on every run and raise it when it is too low. Each watch
# costs ~1 KB of kernel memory ONLY while in use, so a high ceiling is not a
# reservation - 524288 is the value VS Code documents for the same problem.
# Override with WEKAN_INOTIFY_WATCHES=<n> (or 0 to skip this entirely).
#
# This never aborts the script: if it cannot raise the limit (no sudo, no TTY to
# prompt on, a read-only /etc) it prints the one command to run by hand and
# carries on. Nothing here applies on macOS/BSD, which have no inotify.
function ensure_inotify_watches(){
	[ "$(uname -s)" = "Linux" ] || return 0

	local want="${WEKAN_INOTIFY_WATCHES:-524288}"
	[ "$want" = "0" ] && return 0

	local proc=/proc/sys/fs/inotify/max_user_watches
	[ -r "$proc" ] || return 0
	local have; have="$(cat "$proc" 2>/dev/null)"
	case "$have" in ''|*[!0-9]*) return 0 ;; esac   # unreadable/odd: leave it alone
	[ "$have" -ge "$want" ] && return 0

	echo
	echo "==> inotify watch limit is $have, which is too low for Meteor's file watcher."
	echo "    Raising fs.inotify.max_user_watches to $want (this is what makes"
	echo "    'inotify_add_watch ... No space left on device' go away - that error"
	echo "    means the WATCH LIMIT is exhausted, not the disk)."

	# How to run a privileged command: already root, sudo without a password, or
	# sudo with a prompt when there is a terminal to prompt on.
	local -a SUDO=()
	if [ "$(id -u)" = "0" ]; then
		SUDO=()
	elif command -v sudo >/dev/null 2>&1 && sudo -n true 2>/dev/null; then
		SUDO=(sudo)
	elif command -v sudo >/dev/null 2>&1 && [ -t 0 ]; then
		echo "    (sudo will ask for your password)"
		SUDO=(sudo)
	else
		echo "    Cannot raise it automatically (no root and no usable sudo). Run:"
		echo "      echo 'fs.inotify.max_user_watches=$want' | sudo tee /etc/sysctl.d/60-wekan-inotify.conf"
		echo "      sudo sysctl --system"
		return 0
	fi

	# Apply now, for this boot.
	if ! "${SUDO[@]}" sysctl -q -w "fs.inotify.max_user_watches=$want" 2>/dev/null; then
		echo "    Could not apply it (sysctl refused). Run this by hand:"
		echo "      sudo sysctl -w fs.inotify.max_user_watches=$want"
		return 0
	fi

	# Persist it, so the next boot does not go back to failing builds.
	local conf=/etc/sysctl.d/60-wekan-inotify.conf
	if ! "${SUDO[@]}" sh -c "printf '%s\n' '# Raised by WeKan build.sh: Meteor watches one inotify watch per directory.' 'fs.inotify.max_user_watches=$want' > '$conf'" 2>/dev/null; then
		echo "    Applied for this boot only - could not write $conf."
	fi

	# max_user_instances is the other half of the same limit family: each watcher
	# process needs an instance, and editors + Meteor + chokidar add up. Only
	# raised when it is at the low stock default, and never fatal.
	local iproc=/proc/sys/fs/inotify/max_user_instances
	if [ -r "$iproc" ]; then
		local ihave; ihave="$(cat "$iproc" 2>/dev/null)"
		case "$ihave" in ''|*[!0-9]*) ihave="" ;; esac
		if [ -n "$ihave" ] && [ "$ihave" -lt 1024 ]; then
			"${SUDO[@]}" sysctl -q -w fs.inotify.max_user_instances=1024 2>/dev/null \
				&& "${SUDO[@]}" sh -c "printf '%s\n' 'fs.inotify.max_user_instances=1024' >> '$conf'" 2>/dev/null \
				&& echo "    Also raised fs.inotify.max_user_instances from $ihave to 1024."
		fi
	fi

	echo "    inotify watch limit is now $(cat "$proc" 2>/dev/null)."
	echo
	return 0
}

# ── Dev server URL ───────────────────────────────────────────────────────────
# Ask for the port Meteor LISTENS on and for ROOT_URL, so a dev server can run
# somewhere other than http://localhost:3000 without editing this script. Sets
# DEV_PORT and DEV_ROOT_URL for the caller.
#
# The two are NOT the same thing, and that is the point:
#   * DEV_PORT is local - what `meteor run --port` binds on this machine.
#   * DEV_ROOT_URL is the address a BROWSER uses. Meteor builds absolute URLs
#     from it (e-mail links, OAuth redirects, attachment URLs), so it has to be
#     the public address, not the local socket.
#
# Behind a reverse proxy those differ completely: Caddy terminates
# https://wekan.example.com on 443 and forwards to localhost:PORT, so ROOT_URL
# must be exactly https://wekan.example.com — appending the local port would
# produce https://wekan.example.com:4000, which nothing serves.
#
# So the port is appended ONLY when you browse the dev server directly:
#   <empty>                    -> http://localhost:PORT          (port appended)
#   wekan                      -> http://wekan.localhost:PORT    (port appended)
#                                 (browsers and systemd-resolved resolve
#                                 *.localhost to 127.0.0.1, no /etc/hosts entry)
#   https://wekan.example.com  -> used EXACTLY as given          (no port)
#   wekan.example.com          -> https://wekan.example.com      (no port; a
#                                 dotted name is assumed to be proxied)
#
# Non-interactive: WEKAN_DEV_PORT / WEKAN_DEV_ROOT_URL (or WEKAN_DEV_HOST, the
# same answer as the prompt) skip the matching prompt.
function ask_dev_url(){
	local port answer url

	port="${WEKAN_DEV_PORT:-}"
	if [ -z "$port" ]; then
		read -r -p "Port for the dev server to listen on [3000]: " port
	fi
	port="${port:-3000}"
	case "$port" in
		''|*[!0-9]*) echo "Not a number: '$port' - using 3000."; port=3000 ;;
		*) if [ "$port" -lt 1 ] || [ "$port" -gt 65535 ]; then
			echo "Port out of range: $port - using 3000."; port=3000
		   fi ;;
	esac

	answer="${WEKAN_DEV_ROOT_URL:-${WEKAN_DEV_HOST:-}}"
	if [ -z "$answer" ]; then
		echo "ROOT_URL: empty or a bare name = local (the port is added);"
		echo "          a full URL or a dotted name = public/proxied (the port is NOT added)."
		read -r -p "ROOT_URL [http://localhost:$port]: " answer
	fi
	answer="${answer%/}"          # a trailing slash would double up in built URLs

	case "$answer" in
		'')
			url="http://localhost:$port" ;;
		*://*)
			# A complete URL: the user has said exactly what the browser uses.
			# Never touch it - not the scheme, not the port, not a port they left
			# off on purpose because a proxy serves 80/443.
			url="$answer" ;;
		*.*)
			# A dotted host with no scheme: a public name, so assume it is proxied
			# (that is what a public name is for) and do NOT append the local port.
			url="https://$answer" ;;
		*)
			# A bare label: a subdomain of localhost, browsed directly.
			url="http://$answer.localhost:$port" ;;
	esac

	DEV_PORT="$port"
	DEV_ROOT_URL="$url"
	echo "==> Meteor listens on port $port"
	echo "==> ROOT_URL=$DEV_ROOT_URL"
	case "$url" in
		*localhost*) : ;;
		*)
			echo "    (no port appended: a public ROOT_URL is expected to be served by a"
			echo "     reverse proxy - e.g. Caddy forwarding it to localhost:$port)" ;;
	esac
}

# ── Keeping the checkout in step with origin ─────────────────────────────────
# Fetch + rebase the current branch onto its upstream, then repoint any CHANGELOG
# commit links the rebase made stale (same shared script release-all.sh uses), and
# show the resulting status. One menu action instead of the fetch/pull/rebase/
# hash-fix/status dance by hand.
# ── git pull / git push, doing the whole job ─────────────────────────────────
#
# These replace the old "Update git", which did a fetch+rebase, ran the CHANGELOG
# hash repair, printed `git status` and left the rest to the reader. The rest is
# where the mistakes were: a rebase rewrites local commits, so the CHANGELOG links
# written before it point at commits that no longer exist; the repair fixes the
# file but commits nothing, so the next push carries a dirty tree; and a push
# rejected as non-fast-forward leaves a repo that needs a pull the caller has to
# know to run.
#
# So: one action per direction, each ending in a state that is either correct or
# unchanged. Conflicts are the one thing a script must not paper over - a rebase
# that stops half-applied IS the wrong state - so on conflict the rebase is
# aborted, the working tree is exactly what it was, and the message says what to
# do by hand.
#
# Nothing here force-pushes, ever.

# The CHANGELOG links after history moved. The repair only repoints a link whose
# commit is reachable from NO ref in this clone (a link into an old release tag
# is fine and is left alone), so running it when nothing moved is a no-op.
# Returns 0 when the file was changed and committed, 1 when there was nothing to do.
function git_fix_changelog_links(){
	local script="$WEKAN_DIR/releases/fix-changelog-hashes.sh"
	[ -f "$script" ] || return 1
	bash "$script" || true
	if [ -n "$(git status --porcelain -- CHANGELOG.md 2>/dev/null)" ]; then
		git add CHANGELOG.md
		git commit -q -m "CHANGELOG: repoint commit links after history moved.

A rebase rewrote the commits these entries link to, so the links named commits
that no longer exist and would have 404ed on GitHub. Repointed by
releases/fix-changelog-hashes.sh, which only touches a link no ref in this clone
can reach.

Thanks to xet7 !"
		echo "==> CHANGELOG commit links repointed and committed."
		return 0
	fi
	return 1
}

# git pull: fast-forward when that is all it takes, rebase when the branch has
# diverged, and never end half-way through either.
function git_pull(){
	git rev-parse --git-dir >/dev/null 2>&1 || { echo "Not a git repository."; return 1; }
	local branch upstream before ahead behind
	branch="$(git rev-parse --abbrev-ref HEAD)"
	upstream="origin/$branch"
	echo "== git pull - branch $branch =="

	# The exact commit to return to if anything goes wrong.
	before="$(git rev-parse HEAD)"

	if [ -n "$(git status --porcelain)" ]; then
		echo "==> Working tree is not clean; the changes are stashed for the pull and"
		echo "    re-applied afterwards (git's own --autostash)."
	fi

	echo "--- git fetch origin $branch ---"
	git fetch origin "$branch" || { echo "ERROR: fetch failed - network or remote. Nothing changed."; return 1; }
	git rev-parse --verify --quiet "$upstream" >/dev/null || {
		echo "No $upstream yet - nothing to pull. Push first to create it."; return 0; }

	behind="$(git rev-list --count HEAD.."$upstream")"
	ahead="$(git rev-list --count "$upstream"..HEAD)"
	echo "    $ahead commit(s) here that origin does not have, $behind the other way."

	if [ "$behind" -eq 0 ]; then
		echo "==> Already up to date with $upstream."
	elif [ "$ahead" -eq 0 ]; then
		# Nothing of ours to replay: a fast-forward moves the branch pointer and
		# rewrites no commit, so no link can go stale.
		echo "--- fast-forward (no local commits to replay) ---"
		git merge --ff-only "$upstream" || { echo "ERROR: fast-forward failed. Nothing changed."; return 1; }
	else
		echo "--- rebase: replaying $ahead local commit(s) onto $upstream ---"
		echo "    This gives them NEW hashes, which is why the CHANGELOG links are"
		echo "    repaired straight after."
		if ! git -c rebase.autoStash=true rebase "$upstream"; then
			git rebase --abort 2>/dev/null
			git stash list >/dev/null 2>&1
			echo
			echo "ERROR: the rebase hit a conflict, so it was ABORTED - this repo is"
			echo "       exactly as it was before ($(git rev-parse --short "$before"))."
			echo "       Resolve it by hand:"
			echo "         git rebase $upstream        # then fix the conflicts"
			echo "         git rebase --continue       # or: git rebase --abort"
			echo "       and run this option again afterwards."
			return 1
		fi
	fi

	git_fix_changelog_links || echo "==> CHANGELOG commit links all resolve; nothing to repoint."
	echo "--- git status ---"
	git status --short --branch
	return 0
}

# git push: make sure what is about to be published is correct first, and turn
# the one rejection that has an obvious answer into that answer.
function git_push(){
	git rev-parse --git-dir >/dev/null 2>&1 || { echo "Not a git repository."; return 1; }
	local branch ahead
	branch="$(git rev-parse --abbrev-ref HEAD)"
	echo "== git push - branch $branch =="

	if [ -n "$(git status --porcelain)" ]; then
		echo "==> NOTE: there are uncommitted changes; a push publishes commits only."
		git status --short
	fi

	# Before publishing, not after: a stale link that reaches GitHub 404s for
	# everyone who reads the release notes.
	git_fix_changelog_links || echo "==> CHANGELOG commit links all resolve."

	git fetch origin "$branch" >/dev/null 2>&1 || true
	if git rev-parse --verify --quiet "origin/$branch" >/dev/null; then
		ahead="$(git rev-list --count "origin/$branch"..HEAD)"
		[ "$ahead" -eq 0 ] && { echo "==> Nothing to push; origin/$branch is already at this commit."; return 0; }
		echo "    $ahead commit(s) to push."
	fi

	echo "--- git push origin $branch ---"
	if git push origin "$branch"; then
		echo "==> Pushed."
		return 0
	fi

	# The common rejection: origin moved while this was being written. That has
	# one right answer - pull, then push again - so do it once, rather than
	# printing the advice and leaving the caller to it. Once only: a second
	# rejection is something else, and retrying a loop is not a fix.
	echo
	echo "==> Push was rejected. Pulling first, then trying once more."
	git_pull || { echo "ERROR: the pull did not finish, so nothing was pushed."; return 1; }
	echo "--- git push origin $branch (retry) ---"
	if git push origin "$branch"; then
		echo "==> Pushed."
		return 0
	fi
	echo
	echo "ERROR: still rejected. This is NOT a case to force - force-pushing a"
	echo "       branch somebody has pulled rewrites their history too. Read what"
	echo "       git said above; if origin has commits this clone should keep,"
	echo "       run this option's pull first and look at 'git log --oneline'."
	return 1
}


echo
PS3='Please enter your choice: '

# Checked on every run: a too-low inotify limit breaks `meteor run` with a
# misleading "No space left on device".
ensure_inotify_watches

# ── Menu: pick a category, then an action (the handlers below are unchanged) ──
# choose <title> <"short|full"...>: show the short labels, set $opt to the chosen
# leaf's full label (matching a case handler below), or "" when Back is chosen.
choose() {
	local shorts=() fulls=() it
	for it in "$@"; do shorts+=("${it%%|*}"); fulls+=("${it#*|}"); done
	echo; echo "== $1 =="; shorts=("${shorts[@]:1}"); fulls=("${fulls[@]:1}")
	local c i
	select c in "${shorts[@]}" "Back"; do
		[ "$c" = "Back" ] && { opt=""; return; }
		for i in "${!shorts[@]}"; do
			[ "${shorts[$i]}" = "$c" ] && { opt="${fulls[$i]}"; return; }
		done
	done
}

# ── Releases submenu: every maintainer script in releases/ ───────────────────
# releases/ holds ~90 scripts and, until now, four of them were reachable from a
# menu (the tests, the conformance run, the changelog-hash repair, run-everything)
# - the rest existed only for whoever remembered the file name. They are grouped
# here, one line each, and tests/buildScriptParity.test.cjs fails when a script is
# added to releases/ without being added to BOTH build.sh and build.bat.
#
# Format: "Group|Label|what|argument prompt|platform".
#   what     a path under releases/, or a command when it starts with "!" - a
#            dozen of these were one-line wrapper scripts (`sudo ufw enable`,
#            `git tag --force stable HEAD`), which are the command itself now
#            that the menu is where they are run from; nothing but these menus
#            ever called them.
#   prompt   empty when the entry takes no argument; otherwise it is asked for
#            and passed through, so a script that needs a version or a language
#            still works from the menu.
#   platform empty for everything both platforms can run, "linux" for the ones
#            that are systemd, ufw, snap or multipass - build.bat does not offer
#            those, because Windows cannot do them at all.
#   key      the name this entry answers to on the command line
#            (`./build.sh release-all`). Empty = the file name without its
#            extension, which is what a reader would guess; the inline commands
#            keep the name of the wrapper file they replaced, so
#            `./build.sh ufw-enable` still does what releases/ufw-enable.sh did.
#
# NOT here, on purpose: run-everything.sh, db-conformance.sh and
# fix-changelog-hashes.sh (already in the Tests and Setup menus), ensure-tools.sh
# (a helper other scripts source), ferretdb/* (they run INSIDE the built
# snap/bundle, not on a maintainer's machine) and the superseded old-*.sh and
# translations/fill_translations.py.
RELEASE_SCRIPTS=(	"Release|Release ALL platforms: push CHANGELOG, trigger release-all.yml|releases/release-all.sh|||"
	"Release|Release (older local flow), for one version|releases/release.sh|WeKan version, e.g. 10.50||"
	"Release|Show the version numbers this checkout would release|releases/version.sh|||"
	"Release|Show the CHANGELOG of the release being prepared|releases/changelog.sh|||"
	"Release|Rebuild the API docs (wekan.yml + wekan.html)|releases/rebuild-docs.sh|||"
	"Release|Rebuild a release that already exists|releases/rebuild-release.sh|||"
	"Release|Prepare the release directory for one version|releases/rel.sh|WeKan version, e.g. 10.50||"
	"Release|Collect the built bundles for one version|releases/release-bundle.sh|WeKan version, e.g. 10.50||"
	"Release|Link the newest bundle as wekan-latest|releases/release-ln.sh|WeKan version, e.g. 10.50||"
	"Release|Move an old release out of the download directory|releases/release-x2.sh|WeKan version, e.g. 10.50||"
	"Release|Clean up after a release|releases/release-cleanup.sh|WeKan version, e.g. 10.50||"
	"Release|Publish the Helm chart in wekan/charts|releases/release-charts.sh|||"
	"Release|Update wekan.fi with the new version and API docs|releases/release-website.sh|||"
	"Release|Publish the npm packages xet7 maintains|releases/npm-publish.sh|||"
	"Release|Check every download URL snapcraft.yaml uses|releases/test-download-urls.sh|||"
	"Release|Clone all release-related repositories|releases/clone-release-repos.sh|||"
	"Release|Create the GitHub Actions secrets a release needs|releases/create-github-secrets.sh|||"
	"Release|Add a git tag for a release|releases/add-tag.sh|Version tag, e.g. v10.50||"
	"Release|Delete a git tag, locally and on the remote|releases/delete-tag.sh|Version tag, e.g. v10.50||"
	"Release|Move the 'stable' tag to HEAD|!git tag --force stable HEAD && git push --tags --force && git push --follow-tags|||stable-tag"
	"Release|Release the wekan-ondra / wekan-gantt-gpl variants, part 1|releases/release-ondra-1.sh|||"
	"Release|Release the wekan-ondra / wekan-gantt-gpl variants, part 2|releases/release-ondra-2.sh|||"
	"Release|Report (or repair) the Helm chart index for past releases|releases/backfill-charts.sh|||"
	"Release|Rebuild the Helm index.yaml from the chart packages|releases/reindex-charts.py|||"
	"Snap|Build the snap from snapcraft.yaml|releases/snap-build.sh|||"
	"Snap|Install the locally built .snap|releases/snap-install.sh|||"
	"Snap|Push one .snap to the Snap Store|releases/snap-push-to-store.sh|Path to the .snap file||"
	"Snap|Release the snap for one version|releases/release-snap.sh|WeKan version, e.g. 10.50||"
	"Snap|List the newest Snap Store revisions|releases/snap-store-revisions.sh|||"
	"Snap|Release one store revision to edge, beta and candidate|releases/snap-store-release-revision-to-channels.sh|Snap Store revision number||"
	"Snap|Release every snap, every architecture, to all four channels|releases/snap-release-all-channels.sh|Version, or empty for the newest||snap-release-all-channels"
	"Snap|Switch the installed snap to the edge channel|releases/snap-edge.sh|||"
	"Snap|Switch the installed snap to the stable channel|releases/snap-stable.sh|||"
	"Snap|snapcraft help topics|releases/snapcraft-help.sh|||"
	"Snap|wekan.help of the installed snap|releases/wekan-snap-help.sh|||"
	"Snap|Enable and start snapd|!sudo systemctl enable snapd && sudo systemctl start snapd||linux|snapd-start"
	"Snap|Disable and stop snapd|!sudo systemctl disable snapd && sudo systemctl stop snapd||linux|snapd-stop"
	"Snap|Switch between KVM, snapcraft, Waydroid and VirtualBox|releases/switch-kvm-snapcraft-waydroid-virtualbox.sh|||"
	"Bundles|Build the arm64 bundle|releases/build-bundle-arm64.sh|WeKan version, e.g. 10.50||"
	"Bundles|Build the armhf (arm/v7) bundle|releases/build-bundle-armhf.sh|WeKan version, e.g. 10.50||"
	"Bundles|Build the ppc64el bundle|releases/build-bundle-ppc64el.sh|WeKan version, e.g. 10.50||"
	"Bundles|Build the ppc64le bundle|releases/build-bundle-ppc64le.sh|WeKan version, e.g. 10.50||"
	"Bundles|Build the s390x bundle|releases/build-bundle-s390x.sh|WeKan version, e.g. 10.50||"
	"Bundles|Fetch the built bundle from the amd64 build host|releases/up.sh|WeKan version, e.g. 10.50||"
	"Bundles|Fetch the built bundle from the arm64 build host|releases/up-a.sh|WeKan version, e.g. 10.50||"
	"Bundles|Fetch the built bundle from the ppc64le build host|releases/up-o.sh|WeKan version, e.g. 10.50||"
	"Bundles|Fetch the built bundle from the s390x build host|releases/up-s.sh|WeKan version, e.g. 10.50||"
	"Bundles|Upload the Windows bundle to the download server|releases/up-w.sh|WeKan version, e.g. 10.50||"
	"Docker images|Build the WeKan Docker image|releases/docker-build.sh|||"
	"Docker images|Create the multi-platform buildx builder|releases/docker-build-deps.sh|||"
	"Docker images|Publish a variant image (wekan-gantt-gpl / wekan-ondra)|releases/docker-publish-variant.sh|Image and version, e.g. wekan-gantt-gpl 10.50||"
	"Docker images|Push the locally built images to Docker Hub and Quay|releases/docker-push-gantt.sh|Docker build tag and WeKan version||"
	"Docker images|Mirror the images between registries with skopeo|releases/docker-registry-sync.sh|||"
	"Docker images|Start the Docker containers|!sudo systemctl enable docker containerd && sudo systemctl start docker containerd||linux|docker-start"
	"Docker images|Stop the Docker containers|!sudo systemctl stop docker containerd && sudo systemctl disable docker containerd||linux|docker-stop"
	"Sandstorm|Install the Sandstorm-related files|releases/install-sandstorm.sh|||"
	"Sandstorm|Disable the Sandstorm files again|releases/disable-sandstorm.sh|||"
	"Sandstorm|Make the .spk package|releases/sandstorm-make-spk.sh|||"
	"Sandstorm|Run the Sandstorm dev server|releases/sandstorm-test-dev.sh|||"
	"Sandstorm|Release the Sandstorm version|releases/release-sandstorm.sh|||"
	"Translations|Pull the newest translations from Transifex and merge them|releases/translations/pull-translations.sh|||"
	"Translations|How many strings each language still needs|releases/translations/fill-translations.mjs --missing|||"
	"Translations|Push one language to Transifex|releases/translations/push-translation.sh|Language code, e.g. ja||"
	"Translations|Push every language to Transifex|releases/translations/push-all-translations.sh|||"
	"Translations|Push the English source to Transifex|releases/translations/push-english-base-translation.sh|||"
	"Translations|Copy the English source into en-GB on Transifex|releases/translations/push-copy-en-gb-translation.sh|||"
	"Translations|Report English strings that regressed|releases/translations/report-english-regressions.mjs|||"
	"Translations|Prove a pull keeps human translations (no network)|releases/translations/verify-human-preference.mjs|||"
	"Translations|Merge a finished pull by hand|releases/translations/merge-translations.mjs|||"
	"Git and repo|git pull - fetch, fast-forward or rebase, repoint moved CHANGELOG links|!git_pull|||git-pull"
	"Git and repo|git push - verify the CHANGELOG links, push, pull-and-retry once if origin moved|!git_push|||git-push"
	"Git and repo|Commit with the editor open for a multi-line message|releases/commit.sh|||"
	"Git and repo|Add everything, then revert it again|!git restore --staged|Path to unstage||git-add-revert"
	"Git and repo|Delete a branch, locally and on the remote|releases/delete-branch-local-and-remote.sh|Branch name||"
	"Git and repo|Count lines of code per committer|releases/count-lines-of-code-per-committer.sh|||"
	"Git and repo|Keep syncing this checkout in a loop|!while true; do sync; sleep 1; done||linux|syncloop"
	"Git and repo|Convert the remaining Stylus to CSS|releases/stylus-to-css.sh|||"
	"Git and repo|Update Node.js everywhere in the sources|releases/node-update.sh|||"
	"Git and repo|Update the local Node.js version|releases/node-update-local.sh|||"
	"Git and repo|Migrate a MongoDB database to FerretDB (--help first)|releases/migrate-mongodb-to-ferretdb.mjs|Arguments, e.g. --help||"
	"Server and VM|Enable and start the SSH server|!sudo systemctl enable ssh && sudo systemctl start ssh||linux|ssh-start"
	"Server and VM|Disable and stop the SSH server|!sudo systemctl disable ssh && sudo systemctl stop ssh||linux|ssh-stop"
	"Server and VM|Enable the ufw firewall|!sudo ufw enable||linux|ufw-enable"
	"Server and VM|Disable the ufw firewall|!sudo ufw disable||linux|ufw-disable"
	"Server and VM|Remove the Multipass VM|!multipass stop --all && multipass delete --all && multipass purge && sudo snap remove multipass||linux|multipass-remove"
	"Server and VM|Show the VirtualBox VM's IP address|releases/virtualbox/ipaddress.sh|||"
	"Server and VM|Let Node.js bind port 80 in the VM|releases/virtualbox/node-allow-port-80.sh|||"
	"Server and VM|Start WeKan in the VirtualBox VM|releases/virtualbox/start-wekan.sh|||"
	"Server and VM|Stop WeKan in the VirtualBox VM|releases/virtualbox/stop-wekan.sh|||"
)

# Pick a group, then a script. Returns 0 when something ran, 1 on Back.
releases_menu() {
	local groups=() it g seen="|"
	for it in "${RELEASE_SCRIPTS[@]}"; do
		g="${it%%|*}"
		# `seen` is |-delimited on purpose: a group name contains spaces
		# ("Docker images"), so a space-joined list cannot be searched for one.
		case "$seen" in *"|$g|"*) ;; *) groups+=("$g"); seen="$seen$g|" ;; esac
	done
	echo; echo "== Releases: pick a group =="
	local group="" c
	select c in "${groups[@]}" "Back"; do
		[ "$c" = "Back" ] && return 1
		for g in "${groups[@]}"; do [ "$g" = "$c" ] && group="$g"; done
		[ -n "$group" ] && break
	done

	local labels=() paths=() prompts=() rest
	for it in "${RELEASE_SCRIPTS[@]}"; do
		[ "${it%%|*}" = "$group" ] || continue
		rest="${it#*|}"
		labels+=("${rest%%|*}")
		rest="${rest#*|}"
		paths+=("${rest%%|*}")
		rest="${rest#*|}"
		prompts+=("${rest%%|*}")
	done
	echo; echo "== $group =="
	local i idx=-1
	select c in "${labels[@]}" "Back"; do
		[ "$c" = "Back" ] && return 1
		for i in "${!labels[@]}"; do [ "${labels[$i]}" = "$c" ] && idx=$i; done
		[ "$idx" -ge 0 ] && break
	done

	local script="${paths[$idx]}" prompt="${prompts[$idx]}" args=""
	if [ -n "$prompt" ]; then
		echo; read -r -p "$prompt: " args
	fi
	echo; echo "--- ${script#!} $args ---"
	case "$script" in
		# A command, not a script: what used to be a one-line wrapper file.
		!*)             eval "${script#!} $args" ;;
		# .mjs is run by node, everything else by bash - and the entry keeps its
		# own arguments (it may already carry a flag, e.g. --missing).
		*.mjs|*.mjs\ *) node $script $args ;;
		*)              bash $script $args ;;
	esac
	pause
	return 0
}

# Docker submenu: pick a backend, then Start / Follow logs / Stop.
# Returns 0 when an action ran, 1 on Back (so the caller re-shows the menu).
# One entry per docker-compose*.yml in the repo, so every compose file can be
# started from here. Keep this list and build.bat's in step with the files
# themselves - tests/dockerComposeBackends.test.cjs fails when one drifts.
DOCKER_DBS=("FerretDB v1 SQLite (default)|docker-compose.yml"
            "FerretDB v1 PostgreSQL|docker-compose-ferretdb-v1-postgresql.yml"
            "FerretDB v1 MySQL (experimental)|docker-compose-ferretdb-v1-mysql.yml"
            "FerretDB v1 MariaDB (experimental)|docker-compose-ferretdb-v1-mariadb.yml"
            "FerretDB v1 SAP HANA (experimental)|docker-compose-ferretdb-v1-sap-hana.yml"
            "FerretDB v2 PostgreSQL|docker-compose-ferretdb-v2-postgresql.yml"
            "MongoDB 7|docker-compose-mongodb-v7.yml"
            "MongoDB Multitenancy|docker-compose-multitenancy.yml")
docker_menu() {
	local shorts=() files=() it
	for it in "${DOCKER_DBS[@]}"; do shorts+=("${it%%|*}"); files+=("${it#*|}"); done
	echo; echo "== Docker: pick a backend =="
	local c i file=""
	select c in "${shorts[@]}" "Back"; do
		[ "$c" = "Back" ] && return 1
		for i in "${!shorts[@]}"; do [ "${shorts[$i]}" = "$c" ] && file="${files[$i]}"; done
		[ -n "$file" ] && break
	done
	echo; echo "== $c: action =="
	local act
	select act in "Start (up -d)" "Build from source & start (up -d --build)" "Follow logs (logs -f)" "Stop (down)" "Back"; do
		case $act in
			"Start (up -d)")                          wekan_docker "$file" up -d;   return 0 ;;
			"Build from source & start (up -d --build)") wekan_docker_build_image "$file" && wekan_docker "$file" up -d; return 0 ;;
			"Follow logs (logs -f)")                  wekan_docker "$file" logs -f; return 0 ;;
			"Stop (down)")                            wekan_docker "$file" down;    return 0 ;;
			"Back")                                   return 1 ;;
		esac
	done
}


# ── CLI: run any of the above without the menu ───────────────────────────────
# `./build.sh <name> [arguments]` runs the same thing menu option would, so a
# release, a translation pull or a bundle build can go in a script or a cron
# entry. The name is the file name without its extension (release-all,
# pull-translations, build-bundle-s390x) or, for the entries that are a command
# rather than a script, the name of the wrapper file it replaced (ufw-enable).
release_entry_fields() {
	# $1 = entry; sets ENT_GROUP ENT_LABEL ENT_WHAT ENT_PROMPT ENT_PLATFORM ENT_KEY
	local rest="$1"
	ENT_GROUP="${rest%%|*}"; rest="${rest#*|}"
	ENT_LABEL="${rest%%|*}"; rest="${rest#*|}"
	ENT_WHAT="${rest%%|*}";  rest="${rest#*|}"
	ENT_PROMPT="${rest%%|*}"; rest="${rest#*|}"
	ENT_PLATFORM="${rest%%|*}"; rest="${rest#*|}"
	ENT_KEY="${rest%%|*}"
	if [ -z "$ENT_KEY" ]; then
		ENT_KEY="${ENT_WHAT%% *}"          # drop any flags the entry carries
		ENT_KEY="${ENT_KEY##*/}"           # the file name
		ENT_KEY="${ENT_KEY%.*}"            # without its extension
	fi
}

cli_list() {
	local it
	for it in "${RELEASE_SCRIPTS[@]}"; do
		release_entry_fields "$it"
		printf '  %-38s %s%s\n' "$ENT_KEY" "$ENT_LABEL" \
			"$([ -n "$ENT_PROMPT" ] && echo "   <$ENT_PROMPT>")"
	done
}

cli_help() {
	cat <<'USAGE'
WeKan build.sh - menu, or a command line.

  ./build.sh                          the menu
  ./build.sh --help                   this text
  ./build.sh --list                   every command name, with what it does
  ./build.sh <name> [arguments]       run one, without the menu
  ./build.sh --run-everything         every test WeKan and FerretDB have

Examples:

  ./build.sh release-all              push the CHANGELOG, trigger the release
  ./build.sh version                  show the version numbers this would release
  ./build.sh rebuild-docs             rebuild wekan.yml + wekan.html
  ./build.sh build-bundle-s390x 10.50 build the s390x bundle of that version
  ./build.sh release-snap 10.50       release the snap of that version
  ./build.sh pull-translations        pull and merge the newest translations
  ./build.sh push-translation ja      push one language to Transifex
  ./build.sh fill-translations        how many strings each language still needs
  ./build.sh add-tag v10.50           tag the release
  ./build.sh docker-publish-variant wekan-gantt-gpl 10.50
  ./build.sh ufw-enable               what releases/ufw-enable.sh used to do

Arguments after the name are passed to the script unchanged, so anything the
script accepts works here too. Names come from --list.
USAGE
}

cli_run() {
	local want="$1"; shift
	local it
	for it in "${RELEASE_SCRIPTS[@]}"; do
		release_entry_fields "$it"
		[ "$ENT_KEY" = "$want" ] || continue
		case "$ENT_WHAT" in
			!*)             eval "${ENT_WHAT#!}" "$@" ;;
			*.mjs|*.mjs\ *) node $ENT_WHAT "$@" ;;
			*)              bash $ENT_WHAT "$@" ;;
		esac
		return $?
	done
	echo "build.sh: no command called '$want'." >&2
	echo "Try: ./build.sh --list" >&2
	return 2
}

# Non-interactive entry point for releases/run-everything.sh (which build.bat runs
# on Windows): the same "EVERYTHING (sequential)" the Tests menu offers, without
# the menu.
case "${1:-}" in
	--run-everything) run_everything "${2:-two-worker}"; exit $? ;;
	-h|--help|help)   cli_help; exit 0 ;;
	-l|--list|list)   cli_help | head -8; echo; echo "Commands:"; cli_list; exit 0 ;;
	"")               ;;                       # no arguments: the menu below
	-*)               echo "build.sh: unknown option '$1'" >&2; cli_help; exit 2 ;;
	*)                cli_run "$@"; exit $? ;;
esac

opt=""
while [ -z "$opt" ]; do
	echo; echo "==================== WeKan ===================="
	select cat in "Setup" "Dev server" "Tests" "Docker" "Releases" "CLI commands" "Tools" "Quit"; do
		case $cat in
			"Setup")
				choose "Setup" \
					"Install dependencies|Install WeKan dependencies" \
					"Build WeKan release bundle|Build WeKan release bundle" \
					"Build WeKan development bundle|Build WeKan development bundle" \
					"git pull|git pull: fetch, fast-forward or rebase onto origin, repoint the CHANGELOG commit links the rebase moved, and leave the repo unchanged if anything conflicts" \
					"git push|git push: check the CHANGELOG commit links resolve before publishing them, push this branch to origin, and pull-then-retry once if origin moved meanwhile" ;;
			"Dev server")
				choose "Dev server" \
					"localhost:3000|Run Meteor for dev on http://localhost:3000" \
					"localhost:3000 + trace warnings|Run Meteor for dev on http://localhost:3000 with trace warnings, and warnings using old Meteor API that will not exist in Meteor 3.0" \
					"localhost:3000 + bundle visualizer|Run Meteor for dev on http://localhost:3000 with bundle visualizer" \
					"CURRENT-IP:3000|Run Meteor for dev on http://CURRENT-IP-ADDRESS:3000" \
					"CURRENT-IP:3000 + MONGO_URL 27019|Run Meteor for dev on http://CURRENT-IP-ADDRESS:3000 with MONGO_URL=mongodb://127.0.0.1:27019/wekan" \
					"CUSTOM-IP:PORT|Run Meteor for dev on http://CUSTOM-IP-ADDRESS:PORT" \
					"CUSTOM PORT + SUBDOMAIN|Run Meteor for dev on a custom port and ROOT_URL host (asks)" \
					"Kill all dev servers|Kill all dev servers (free ports 3000/3001/3100/3101/4000/4001/8080)" ;;
			"Tests")
				choose "Tests" \
					"EVERYTHING two-worker|Run EVERYTHING with stages one by one and two Playwright workers per browser; database and FerretDB stages stay sequential; logs in log/<datetime>/" \
					"EVERYTHING one by one|Run EVERYTHING one stage and one Playwright worker at a time for minimum RAM usage; database and FerretDB stages stay sequential; logs in log/<datetime>/" \
					"EVERYTHING at once|Run EVERYTHING with the WeKan test jobs concurrently; database backends and FerretDB stages stay sequential; logs in log/<datetime>/" \
					"Mocha (server-side)|Test Mocha unit + security + API-logic tests (server-side only, no browser)" \
					"Import regression|Test import regression (tests/wekanCreator.import.test.js, fast, no server)" \
					"Node E2E regressions|Test Node E2E regressions (tests/e2e/list-regressions.js, needs running server)" \
					"Install Playwright browsers|Install Playwright browsers (Chromium, Firefox, WebKit; native and/or Docker)" \
					"Playwright Chromium|Test Playwright Chromium" \
					"Playwright Firefox|Test Playwright Firefox" \
					"Playwright WebKit|Test Playwright Webkit" \
					"Playwright ALL browsers|Test Playwright ALL browsers sequentially (Chromium + Firefox + WebKit, one at a time), server already running on :3000" \
					"Floating-promises guard|Check floating promises guard (@typescript-eslint/no-floating-promises + auth await scan)" \
					"Count tests by category|Count amount of tests by category" \
					"Run all FerretDB tests - SEQUENTIAL|Run all FerretDB tests - SEQUENTIAL: unit, vet and the integration suite of the FerretDB subdirectory of this repo, one at a time, logs in log/<datetime>/" \
					"All databases (sequential)|Test all databases that have a Docker image for this CPU, SEQUENTIALLY: build newest FerretDB v1 from source, then run every FerretDB v1 query type against each database and compare that they all answer the same (results in log/<datetime>/)" ;;
			"Tools")
				choose "Tools" \
					"Save Meteor deps list|Save Meteor dependency chain to ../meteor-deps.txt" \
					"Install forge CLI tools|Install forge CLI tools (gh, glab, tea, git-bug, forge) for GitHub/GitLab/Codeberg/Forgejo/Gitea" \
					"Mirror repo to forges|Mirror repo GitHub -> GitLab/Codeberg/Forgejo/Gitea: code + issues + PRs + Actions (sync missing, convert CI syntax)" ;;
			"Docker") if docker_menu; then exit 0; fi ;;
			"Releases") if releases_menu; then exit 0; fi ;;
			"CLI commands")
				cli_help; echo; echo "Commands:"; cli_list; pause ;;
			"Quit")   exit 0 ;;
			*)        echo "invalid option" ;;
		esac
		break
	done
done

for _once in 1; do
    case "$opt" in
        "Install WeKan dependencies")

		if [[ "$OSTYPE" == "linux-gnu" ]]; then
			echo "Linux";
			case "$(_et_linux_family)" in
				alpine)
					sudo apk add --no-cache bash build-base git curl wget p7zip zip unzip npm
					;;
				arch)
					sudo pacman -Sy --needed --noconfirm base-devel git curl wget p7zip zip unzip npm
					;;
				fedora)
					sudo dnf group install -y development-tools
					sudo dnf install -y gcc gcc-c++ make git curl wget 7zip zip unzip npm
					;;
				rhel)
					pm=dnf; command -v dnf >/dev/null 2>&1 || pm=yum
					sudo "$pm" groupinstall -y "Development Tools"
					sudo "$pm" install -y gcc gcc-c++ make git curl wget p7zip zip unzip npm
					;;
				debian)
					sudo apt-get update
					sudo apt-get install -y build-essential gcc g++ make git curl wget p7zip-full zip unzip unp npm
					;;
				*) echo "Unsupported Linux distribution; install a C/C++ toolchain, git, curl, wget, 7zip, zip, unzip and npm." >&2; exit 1 ;;
			esac
			#sudo chown -R $(id -u):$(id -g) $HOME/.npm
			sudo npm -g install n
			sudo n "$_wekan_node_version"
			sudo npm -g install meteor --unsafe-perm
			#sudo chown -R $(id -u):$(id -g) $HOME/.npm $HOME/.meteor
		elif [[ "$OSTYPE" == "darwin"* ]]; then
			echo "macOS"
			# Node comes from nvm, not from Homebrew's node@24 keg.
			#
			# `brew install node@24` gives whatever 24.x Homebrew currently has
			# bottled - which trails nodejs.org - and, being keg-only, needs
			# PATH, LDFLAGS and CPPFLAGS exported by hand. `nvm install 24`
			# resolves to the NEWEST 24.x on nodejs.org every time it runs and
			# puts that on PATH itself, so this does not go stale the way a
			# pinned version does. npm comes with the Node it installs, so
			# there is no `brew install npm` either.
			export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
			mkdir -p "$NVM_DIR"
			if [ ! -s "$NVM_DIR/nvm.sh" ]; then
				echo "Installing nvm into $NVM_DIR ..."
				# A PINNED tag, not master: this pipes a downloaded script into
				# a shell, so it must be a revision somebody has looked at.
				curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.6/install.sh | bash
			fi
			# nvm is a shell FUNCTION, not a binary, so it has to be sourced -
			# `command -v nvm` finds nothing until this line has run.
			# shellcheck source=/dev/null
			[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
			if ! command -v nvm >/dev/null 2>&1; then
				echo "nvm did not install. Install it by hand from https://github.com/nvm-sh/nvm and run this again."
				exit 1
			fi
			# `npm config set prefix` and nvm cannot both be right: the prefix
			# overrides the per-version one nvm points at, global installs land
			# outside the version they were installed for, and nvm refuses to
			# switch versions while it is set. The old Homebrew path set it, so
			# clear it before installing anything.
			npm config delete prefix >/dev/null 2>&1 || true
			# The newest 24.x, and the default for every new shell.
			nvm install 24
			nvm alias default 24
			nvm use 24
			echo "Node $(node --version), npm $(npm --version)"
			# Let new shells find nvm too. Its installer appends these itself,
			# but only to the rc file it detects and only when IT did the
			# install - so a machine that already had nvm keeps working.
			touch "$HOME/.zshrc"
			for rc in "$HOME/.zshrc" "$HOME/.bashrc"; do
				[ -e "$rc" ] || continue
				grep -qxF 'export NVM_DIR="$HOME/.nvm"' "$rc" || echo 'export NVM_DIR="$HOME/.nvm"' >> "$rc"
				grep -qxF '[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"' "$rc" || echo '[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"' >> "$rc"
			done
			npx -y meteor
			export PATH=~/.meteor:$PATH
			exit;
		elif [[ "$OSTYPE" == "cygwin" ]]; then
		        # POSIX compatibility layer and Linux environment emulation for Windows
		        echo "TODO: Add Cygwin";
			exit;
		elif [[ "$OSTYPE" == "msys" ]]; then
		        # Lightweight shell and GNU utilities compiled for Windows (part of MinGW)
		        echo "TODO: Add msys on Windows";
			exit;
		elif [[ "$OSTYPE" == "win32" ]]; then
		        # I'm not sure this can happen.
		        echo "TODO: Add Windows";
			exit;
		elif [[ "$OSTYPE" == "freebsd"* ]]; then
		        echo "TODO: Add FreeBSD";
			exit;
		else
		        echo "Unknown"
			echo ${OSTYPE}
			exit;
		fi

		break
		;;

    "Build WeKan release bundle")
		# WHAT A RELEASE PUBLISHES: `meteor build` plus the server's npm modules,
		# the three prunes, the sockjs / legacy-client / source-map trim, a
		# verified Node.js, FerretDB, the MongoDB Database Tools and a launcher -
		# the same steps as the Release All workflow for this platform, minus the
		# .zip. So `cd .build/bundle && ./start-wekan.sh` starts WeKan on its own
		# bundled Node.js and FerretDB, and "does the thing a release would
		# publish run at all" is answerable here rather than after a release.
		#
		# || exit 1, because build_wekan returns 1 on failure and a bare call
		# throws that away: the menu breaks, the script falls off the end and
		# exits 0. A build that printed "ERROR: the WeKan build failed" while
		# reporting success to its caller is worse than one that just fails -
		# anything driving this non-interactively (`printf '1\n2\n' | ./build.sh`,
		# or CI) sees a green run and a missing bundle.
		WEKAN_BUILD_RELEASE_BUNDLE=1 build_wekan || exit 1
		break
		;;

    "Build WeKan development bundle")
		# PLAIN `meteor build .build --directory`, which is what "Build WeKan"
		# did before the release bundle existed. Kept as its own entry because
		# the two answer different questions and cost different amounts: this one
		# downloads nothing, embeds nothing and trims nothing, so it is the fast
		# way to get a bundle to poke at - and it is what the test path builds,
		# so it is also the bundle the test server runs.
		#
		# It is NOT what a release ships. A bundle from here still has the legacy
		# client, the source maps, uWebSockets.js and no Node.js, FerretDB or
		# launcher of its own, so it cannot answer whether a release would start.
		build_wekan || exit 1
		break
		;;

    "git pull: fetch, fast-forward or rebase onto origin, repoint the CHANGELOG commit links the rebase moved, and leave the repo unchanged if anything conflicts")
		git_pull
		break
		;;

    "git push: check the CHANGELOG commit links resolve before publishing them, push this branch to origin, and pull-then-retry once if origin moved meanwhile")
		git_push
		break
		;;

    "Run Meteor for dev on http://localhost:3000")
		ensure_rspack_public_dirs
		kill_meteor_on_port 3000 || break
		#Not in use, could increase RAM usage: NODE_OPTIONS="--max_old_space_size=4096"
		#---------------------------------------------------------------------
		# Logging of terminal output to console and to .tools/log/wekan-log.log at end of this line: 2>&1 | tee "$WEKAN_LOG_ROOT/wekan-log.log"
		#WARN_WHEN_USING_OLD_API=true NODE_OPTIONS="--trace-warnings"
		DEFAULT_METEOR_REACTIVITY_ORDER="changeStreams,oplog,polling" DDP_TRANSPORT=sockjs DEBUG=true WRITABLE_PATH=.. WITH_API=true RICHER_CARD_COMMENT_EDITOR=false ROOT_URL=http://localhost:3000 meteor run --port 3000 2>&1 | tee "$WEKAN_LOG_ROOT/wekan-log.log"
		#---------------------------------------------------------------------
		break
		;;


    "Run Meteor for dev on http://localhost:3000 with trace warnings, and warnings using old Meteor API that will not exist in Meteor 3.0")
		ensure_rspack_public_dirs
		kill_meteor_on_port 3000 || break
                #Not in use, could increase RAM usage: NODE_OPTIONS="--max_old_space_size=4096"
                #---------------------------------------------------------------------
                # Logging of terminal output to console and to .tools/log/wekan-log.log at end of this line: 2>&1 | tee "$WEKAN_LOG_ROOT/wekan-log.log"
                DEFAULT_METEOR_REACTIVITY_ORDER="changeStreams,oplog,polling" DDP_TRANSPORT=sockjs DEBUG=true WARN_WHEN_USING_OLD_API=true NODE_OPTIONS="--trace-warnings --max-old-space-size=$_heap_mb" WRITABLE_PATH=.. WITH_API=true RICHER_CARD_COMMENT_EDITOR=false ROOT_URL=http://localhost:3000 meteor run --port 3000 2>&1 | tee "$WEKAN_LOG_ROOT/wekan-log.log"
                #---------------------------------------------------------------------
                break
                ;;

    "Run Meteor for dev on http://localhost:3000 with bundle visualizer")
		ensure_rspack_public_dirs
		kill_meteor_on_port 3000 || break
		#Not in use, could increase RAM usage: NODE_OPTIONS="--max_old_space_size=4096"
		#---------------------------------------------------------------------
		#Logging of terminal output to console and to .tools/log/wekan-log.log at end of this line: 2>&1 | tee "$WEKAN_LOG_ROOT/wekan-log.log"
		#WARN_WHEN_USING_OLD_API=true NODE_OPTIONS="--trace-warnings"
		DEFAULT_METEOR_REACTIVITY_ORDER="changeStreams,oplog,polling" DDP_TRANSPORT=sockjs DEBUG=true WRITABLE_PATH=.. WITH_API=true RICHER_CARD_COMMENT_EDITOR=false ROOT_URL=http://localhost:3000 meteor run --port 3000 --extra-packages bundle-visualizer --production  2>&1 | tee "$WEKAN_LOG_ROOT/wekan-log.log"
		#---------------------------------------------------------------------
		break
		;;

    "Run Meteor for dev on http://CURRENT-IP-ADDRESS:3000")
		ensure_rspack_public_dirs
		kill_meteor_on_port 3000 || break
		if [[ "$OSTYPE" == "darwin"* ]]; then
		  IPADDRESS=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo localhost)
		else
		  IPADDRESS=$(ip route get 1.1.1.1 2>/dev/null | grep -oP 'src \K[0-9.]+' | head -1 | grep . || hostname -I 2>/dev/null | awk '{print $1}' | grep . || echo localhost)
		fi
		echo "Your IP address is $IPADDRESS"
		#---------------------------------------------------------------------
		#Not in use, could increase RAM usage: NODE_OPTIONS="--max_old_space_size=4096"
		#---------------------------------------------------------------------
		#Logging of terminal output to console and to .tools/log/wekan-log.log at end of this line: 2>&1 | tee "$WEKAN_LOG_ROOT/wekan-log.log"
		#WARN_WHEN_USING_OLD_API=true NODE_OPTIONS="--trace-warnings"
		DEFAULT_METEOR_REACTIVITY_ORDER="changeStreams,oplog,polling" DDP_TRANSPORT=sockjs DEBUG=true WRITABLE_PATH=.. WITH_API=true RICHER_CARD_COMMENT_EDITOR=false ROOT_URL=http://$IPADDRESS:3000 meteor run --port 3000 2>&1 | tee "$WEKAN_LOG_ROOT/wekan-log.log"
		#---------------------------------------------------------------------
		break
		;;

    "Run Meteor for dev on http://CURRENT-IP-ADDRESS:3000 with MONGO_URL=mongodb://127.0.0.1:27019/wekan")
		ensure_rspack_public_dirs
		kill_meteor_on_port 3000 || break
                if [[ "$OSTYPE" == "darwin"* ]]; then
                  IPADDRESS=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo localhost)
                else
                  IPADDRESS=$(ip route get 1.1.1.1 2>/dev/null | grep -oP 'src \K[0-9.]+' | head -1 | grep . || hostname -I 2>/dev/null | awk '{print $1}' | grep . || echo localhost)
                fi
                echo "Your IP address is $IPADDRESS"
                #---------------------------------------------------------------------
                #Not in use, could increase RAM usage: NODE_OPTIONS="--max_old_space_size=4096"
                #---------------------------------------------------------------------
                #Logging of terminal output to console and to .tools/log/wekan-log.log at end of this line: 2>&1 | tee "$WEKAN_LOG_ROOT/wekan-log.log"
                #WARN_WHEN_USING_OLD_API=true NODE_OPTIONS="--trace-warnings"
                DEFAULT_METEOR_REACTIVITY_ORDER="changeStreams,oplog,polling" DDP_TRANSPORT=sockjs DEBUG=true MONGO_URL=mongodb://127.0.0.1:27019/wekan WRITABLE_PATH=.. WITH_API=true RICHER_CARD_COMMENT_EDITOR=false ROOT_URL=http://$IPADDRESS:3000 meteor run --port 3000 2>&1 | tee "$WEKAN_LOG_ROOT/wekan-log.log"
                #---------------------------------------------------------------------
                break
                ;;

    "Run Meteor for dev on a custom port and ROOT_URL host (asks)")
		ensure_rspack_public_dirs
		ask_dev_url
		kill_meteor_on_port "$DEV_PORT" || break
		#---------------------------------------------------------------------
		# Same environment as the plain localhost:3000 option; only the port and
		# ROOT_URL differ. Logging of terminal output to console and to
		# .tools/log/wekan-log.log at the end of the line: 2>&1 | tee "$WEKAN_LOG_ROOT/wekan-log.log"
		#---------------------------------------------------------------------
		DEFAULT_METEOR_REACTIVITY_ORDER="changeStreams,oplog,polling" DDP_TRANSPORT=sockjs DEBUG=true WRITABLE_PATH=.. WITH_API=true RICHER_CARD_COMMENT_EDITOR=false ROOT_URL="$DEV_ROOT_URL" meteor run --port "$DEV_PORT" 2>&1 | tee "$WEKAN_LOG_ROOT/wekan-log.log"
		#---------------------------------------------------------------------
		break
		;;

    "Run Meteor for dev on http://CUSTOM-IP-ADDRESS:PORT")
		ensure_rspack_public_dirs
		ip address
		echo "From above list, what is your IP address?"
		read IPADDRESS
		echo "On what port you would like to run Wekan?"
		read PORT
		echo "ROOT_URL=http://$IPADDRESS:$PORT"
		kill_meteor_on_port "$PORT" || break
		#---------------------------------------------------------------------
		#Not in use, could increase RAM usage: NODE_OPTIONS="--max_old_space_size=4096"
		#---------------------------------------------------------------------
		#Logging of terminal output to console and to .tools/log/wekan-log.log at end of this line: 2>&1 | tee "$WEKAN_LOG_ROOT/wekan-log.log"
		#WARN_WHEN_USING_OLD_API=true NODE_OPTIONS="--trace-warnings"
		DEFAULT_METEOR_REACTIVITY_ORDER="changeStreams,oplog,polling" DDP_TRANSPORT=sockjs DEBUG=true WRITABLE_PATH=.. WITH_API=true RICHER_CARD_COMMENT_EDITOR=false ROOT_URL=http://$IPADDRESS:$PORT meteor run --port $PORT 2>&1 | tee "$WEKAN_LOG_ROOT/wekan-log.log"
		#---------------------------------------------------------------------
		break
		;;

    "Kill all dev servers (free ports 3000/3001/3100/3101/4000/4001/8080)")
		kill_all_dev_servers
		break
		;;

    "Save Meteor dependency chain to ../meteor-deps.txt")
                meteor list --tree > ../meteor-deps.txt
                echo "Saved Meteor dependency chain to ../meteor-deps.txt"
                #---------------------------------------------------------------------
                break
                ;;

    "Run EVERYTHING with stages one by one and two Playwright workers per browser; database and FerretDB stages stay sequential; logs in log/<datetime>/")
		run_everything two-worker
		break
		;;

    "Run EVERYTHING with the WeKan test jobs concurrently; database backends and FerretDB stages stay sequential; logs in log/<datetime>/")
		run_everything parallel
		break
		;;

    "Run EVERYTHING one stage and one Playwright worker at a time for minimum RAM usage; database and FerretDB stages stay sequential; logs in log/<datetime>/")
		run_everything sequential
		break
		;;

	"Test Mocha unit + security + API-logic tests (server-side only, no browser)")
		LOG="$(one_log mocha)"
		echo "Running Mocha tests: meteor test --once --driver-package meteortesting:mocha --port 3100"
		echo "(server-side unit/security/API-logic tests; browser/client tests are covered by Playwright options)"
		echo "Log: $LOG"
		meteor test --once --driver-package meteortesting:mocha --port 3100 2>&1 | tee "$LOG"
		break
		;;

    "Test import regression (tests/wekanCreator.import.test.js, fast, no server)")
		LOG="$(one_log import)"
		echo "Running import regression test (node, no server needed). Log: $LOG"
		node tests/wekanCreator.import.test.js 2>&1 | tee "$LOG"
		break
		;;

    "Test Node E2E regressions (tests/e2e/list-regressions.js, needs running server)")
		LOG="$(one_log e2e)"
		echo "Running Node E2E regressions (puppeteer). Log: $LOG"
		echo "NOTE: needs a WeKan server with WITH_API=true on http://localhost:3000."
		echo "      Start one yourself first, or use one of the whole-suite options,"
		echo "      which start the server for you."
		meteor npm run test:e2e 2>&1 | tee "$LOG"
		break
		;;

    "Install Playwright browsers (Chromium, Firefox, WebKit; native and/or Docker)")
			install_playwright_browsers
			;;
    "Test Playwright Chromium")
			run_playwright_single chromium
			break
			;;

    "Test Playwright Firefox")
			run_playwright_single firefox
			break
			;;

    "Test Playwright Webkit")
			run_playwright_single webkit
			break
			;;

    "Test Playwright ALL browsers sequentially (Chromium + Firefox + WebKit, one at a time), server already running on :3000")
			run_playwright_parallel
			break
			;;

    "Check floating promises guard (@typescript-eslint/no-floating-promises + auth await scan)")
		LOG="$(one_log floating-promises)"
		echo "Log: $LOG"
		{
			if ! command -v rg >/dev/null 2>&1; then
				echo "ripgrep (rg) not found. Installing dependency."
				ensure_tools ripgrep || echo "WARNING: Could not auto-install ripgrep. Falling back to grep."
			fi

			MISSING_TS_ESLINT=0
			meteor npm ls --depth=0 @typescript-eslint/eslint-plugin >/dev/null 2>&1 || MISSING_TS_ESLINT=1
			meteor npm ls --depth=0 @typescript-eslint/parser >/dev/null 2>&1 || MISSING_TS_ESLINT=1
			if [ "$MISSING_TS_ESLINT" -eq 1 ]; then
				echo "Installing missing ESLint dependencies for no-floating-promises rule."
				meteor npm install --save-dev @typescript-eslint/eslint-plugin @typescript-eslint/parser
			fi

			echo "Ensuring .eslintrc.json includes @typescript-eslint plugin and no-floating-promises rule"
			node -e "const fs=require('fs');const p='.eslintrc.json';const c=JSON.parse(fs.readFileSync(p,'utf8'));c.plugins=Array.isArray(c.plugins)?c.plugins:[];if(!c.plugins.includes('@typescript-eslint'))c.plugins.push('@typescript-eslint');c.rules=c.rules||{};c.rules['@typescript-eslint/no-floating-promises']='error';fs.writeFileSync(p,JSON.stringify(c,null,2)+'\\n');"

			echo "Quick note: @typescript-eslint/no-floating-promises is a type-aware rule and may require further parser/project setup for full enforcement in all files."
			echo

			# The checks themselves - the same function EVERYTHING runs, so the
			# menu option and the whole-run stage can never drift apart. Above
			# this line is the setting-up half, which only a person asking for
			# this option gets: it installs packages and writes the rule into
			# .eslintrc.json, and a test run must do neither.
			floating_promises_checks
		} 2>&1 | tee "$LOG"
		break
		;;

    "Install forge CLI tools (gh, glab, tea, git-bug, forge) for GitHub/GitLab/Codeberg/Forgejo/Gitea")
		install_forge_tools
		break
		;;

    "Run all FerretDB tests - SEQUENTIAL: unit, vet and the integration suite of the FerretDB subdirectory of this repo, one at a time, logs in log/<datetime>/")
	ferret_dir="$(ensure_tool_repo FerretDB)" || ferret_dir=""
	if [ -n "$ferret_dir" ] && [ -x "$ferret_dir/build.sh" ]; then
		( cd "$ferret_dir" && ./build.sh test-all )
	else
		echo "ERROR: .tools/FerretDB/build.sh is missing and could not be cloned."
	fi
	;;
    "Run EVERYTHING sequentially: the floating-promises guard (seconds), then WeKan's own tests (mocha, the node suites, import regression, node E2E and all three browsers), then the database conformance run for every database with a Docker image for this CPU, then all of FerretDB's own tests (unit, vet, integration) - one stage at a time, all logs in log/<datetime>/")
	run_everything
	;;

    "Test all databases that have a Docker image for this CPU, SEQUENTIALLY: build newest FerretDB v1 from source, then run every FerretDB v1 query type against each database and compare that they all answer the same (results in log/<datetime>/)")
	# Everything this needs - the FerretDB source, the Go toolchain, the module
	# dependencies - is fetched or built by the script itself; see the note at its
	# top for why it is sequential and why SAP HANA is opt-in.
	./releases/db-conformance.sh
	;;

    "Count amount of tests by category")
		LOG="$(one_log test-counts)"
		echo "Log: $LOG"
		{
			SPECDIR="tests/playwright/specs"

			# --- Category 1: Mocha (server + client, meteortesting:mocha) ---
			# Count it( calls across the testModule trees, never describe().
			mocha_count=0
			for mf in client/lib/tests/*.tests.js server/lib/tests/*.tests.js imports/i18n/i18n.test.js; do
				[ -e "$mf" ] || continue
				c=$(grep -cE '(^|[^A-Za-z.])it[[:space:]]*\(' "$mf")
				mocha_count=$((mocha_count + c))
			done

			# --- Category 2: Import regression (node tests/wekanCreator.import.test.js) ---
			import_count=0
			if [ -e tests/wekanCreator.import.test.js ]; then
				import_count=$(grep -cE '^function test' tests/wekanCreator.import.test.js)
			fi

			# --- Category 3: Node E2E regressions (tests/e2e/list-regressions.js) ---
			nodee2e_count=0
			if [ -e tests/e2e/list-regressions.js ]; then
				nodee2e_count=$(grep -cE "logStep\('Testing" tests/e2e/list-regressions.js)
			fi

			# --- Category 4: Playwright e2e specs (tests/playwright/specs/*.e2e.js) ---
			pw_count=0
			if [ -d "$SPECDIR" ]; then
				for f in "$SPECDIR"/*.e2e.js; do
					[ -e "$f" ] || continue
					c=$(grep -cE '(^|[^a-zA-Z.])test(\.(only|skip|fixme))?[[:space:]]*\(' "$f")
					pw_count=$((pw_count + c))
				done
			fi

			grand_total=$((mocha_count + import_count + nodee2e_count + pw_count))

			# --- Summary table by category ---
			echo "| Category | Tests |"
			echo "|----------|-------|"
			echo "| Mocha (server + client, meteortesting:mocha) | $mocha_count |"
			echo "| Import regression (tests/wekanCreator.import.test.js) | $import_count |"
			echo "| Node E2E regressions (tests/e2e/list-regressions.js) | $nodee2e_count |"
			echo "| Playwright e2e specs (tests/playwright/specs/*.e2e.js) | $pw_count |"
			echo "| **Total** | **$grand_total** |"
			echo

			# --- Detailed Playwright per-spec table ---
			if [ ! -d "$SPECDIR" ]; then
				echo "Spec directory not found: $SPECDIR"
				break
			fi
			echo "| Spec | Area | Tests |"
			echo "|------|------|-------|"
			total=0
			for f in "$SPECDIR"/*.e2e.js; do
				[ -e "$f" ] || continue
				base=$(basename "$f")
				# Spec number: leading digits of the filename
				spec=$(printf '%s' "$base" | sed -E 's/^([0-9]+).*/\1/')
				# Area: strip leading number and separator, strip .e2e.js,
				# turn - and _ into spaces, capitalize the first letter.
				area=$(printf '%s' "$base" \
					| sed -E 's/^[0-9]+[-_]?//; s/\.e2e\.js$//; s/[-_]+/ /g' \
					| awk '{ if (length($0) > 0) { $0 = toupper(substr($0,1,1)) substr($0,2) } print }')
				# Tests: count test( / test.only( / test.skip( / test.fixme(
				# calls, but never test.describe(
				count=$(grep -cE '(^|[^a-zA-Z.])test(\.(only|skip|fixme))?[[:space:]]*\(' "$f")
				echo "| $spec | $area | $count |"
				total=$((total + count))
			done
			echo
			echo "**Total: $total tests**"
		} 2>&1 | tee "$LOG"
		break
		;;

    # No arm matched. $opt is the menu entry's FULL DESCRIPTION, written twice -
    # once in the choose() list far above, once as the arm here - so an edit to
    # the menu text that misses the arm leaves an option that matches nothing.
    # Without this, the case simply falls through, the `for _once` loop ends and
    # the script EXITS: the option looks like it worked, printed nothing and ran
    # nothing. That is what renaming "EVERYTHING (sequential)" did to it.
    # tests/buildScriptParity.test.cjs fails on the mismatch itself; this is what
    # the person in front of the menu sees if one ever gets past it.
    *)
		echo "build.sh: no handler for this menu option - that is a bug in build.sh." >&2
		echo "          The menu entry's description and its case arm must be the SAME string:" >&2
		echo "            $opt" >&2
		echo "          Nothing was run. Please report it, or run the same thing from the command line:" >&2
		echo "            ./build.sh --list" >&2
		;;

    esac
done
