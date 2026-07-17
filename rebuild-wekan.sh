#!/bin/bash

echo "Recommended for development: Newest Debian or Ubuntu amd64 based distro, directly to SSD disk or dual boot, not VM. Works fast."
echo "Note1: If you use other locale than en_US.UTF-8 , you need to additionally install en_US.UTF-8"
echo "       with 'sudo dpkg-reconfigure locales' , so that MongoDB works correctly."
echo "       You can still use any other locale as your main locale."
echo "Note2: Console output is also logged to ../log/wekan-log.log"
echo "Note3: All logs this script produces go into the ../log/ directory."

# Give the Meteor build tool and Node processes a larger heap so long
# development sessions and test runs don't crash with
# "FATAL ERROR: Ineffective mark-compacts near heap limit - JavaScript heap out
# of memory". TOOL_NODE_FLAGS controls the Meteor command-line/build process
# (the one that hits the limit during `meteor run`/`meteor test`/`meteor build`);
# NODE_OPTIONS covers the child Node/rspack processes. Both default to 8 GB here
# and honor any value you already exported. Lower it if your machine has less RAM.
export TOOL_NODE_FLAGS="${TOOL_NODE_FLAGS:---max-old-space-size=8192}"
export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=8192}"

# Every log this script writes goes into ../log/ (one directory up from the
# repo). Create it up front so redirections never fail on a missing directory.
mkdir -p ../log

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
# PID parsing); lsof -nP is the macOS fallback.
function free_tcp_port(){
	local p="$1" sig="${2:-TERM}" pids
	if command -v fuser >/dev/null 2>&1; then
		fuser -k -"$sig" "$p/tcp" >/dev/null 2>&1
	elif command -v lsof >/dev/null 2>&1; then
		pids="$(lsof -nP -iTCP:"$p" -sTCP:LISTEN -t 2>/dev/null)"
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
	rm -rf node_modules node_modules/.cache .meteor/local .build _build
	(meteor update --npm 2>/dev/null || true) && meteor npm install
	meteor build .build --directory
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

# Run a Playwright browser project (chromium / firefox / webkit) inside the
# official Playwright container. First arg is the browser; any extra args are
# passed through to `playwright test`. WeKan must already be running on the host
# (default http://127.0.0.1:3000, Meteor's bundled Mongo on 3001); the container
# shares the host network so it can reach both.
function run_playwright_docker(){
	local browser="$1"; shift
	local reporoot="$ORIG_HOME/repos/wekan"
	local pwdir="$reporoot/tests/playwright"
	if ! command -v docker >/dev/null 2>&1; then
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
	echo "Running Playwright $browser in Docker ($image)."
	echo "Expecting WeKan at ${WEKAN_BASE_URL:-http://127.0.0.1:3000} (container uses --network host)."
	# Mount the whole repo so specs that reach the repo-root node_modules
	# (e.g. @wekanteam/exceljs) and .tools resolve; run from tests/playwright.
	# Run as the host user (--user) with a writable HOME so the container does
	# not leave root-owned files under test-results/ (which would later make
	# native Chromium/Firefox runs fail with "EACCES: permission denied, mkdir
	# .../test-results/.playwright-artifacts-N").
	docker run --rm --init --ipc=host --network host \
		--user "$(id -u):$(id -g)" \
		-e HOME=/tmp \
		-e WEKAN_BASE_URL="${WEKAN_BASE_URL:-http://127.0.0.1:3000}" \
		-e WEKAN_MONGO_URL="${WEKAN_MONGO_URL:-mongodb://127.0.0.1:3001/meteor}" \
		-e WEKAN_PLAYWRIGHT_ALL=1 \
		-e WEKAN_PLAYWRIGHT_PROBE=0 \
		-e PLAYWRIGHT_HTML_OPEN=never \
		-e PLAYWRIGHT_JSON_OUTPUT_NAME="${PLAYWRIGHT_JSON_OUTPUT_NAME:-}" \
		-v "$reporoot":/repo -w /repo/tests/playwright \
		"$image" \
		sh -c 'export PATH=/repo/tests/playwright/node_modules/.bin:$PATH; exec npx playwright test --project="$0" "$@"' "$browser" "$@"
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
	local reporoot="$ORIG_HOME/repos/wekan"
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
		if command -v docker >/dev/null 2>&1; then
			local pwver
			pwver="$(node -e "console.log(require('$pwdir/node_modules/@playwright/test/package.json').version)" 2>/dev/null)"
			[ -z "$pwver" ] && pwver="1.60.0"
			echo "Pulling Playwright Docker image mcr.microsoft.com/playwright:v${pwver}-noble ..."
			docker pull "mcr.microsoft.com/playwright:v${pwver}-noble"
		else
			echo "NOTE: some browsers are configured for Docker, but 'docker' is not installed."
			echo "      Install Docker, or set WEKAN_PLAYWRIGHT_DOCKER=0 to run all browsers natively."
		fi
	fi
	echo "Done. Run a browser suite from the menu, or: WEKAN_PLAYWRIGHT_DOCKER=1 ./rebuild-wekan.sh"
}

# Reset test-results/ ownership when an older WebKit-in-Docker run left it owned
# by root. Removal needs write permission on test-results/ itself (which the
# host user lacks when it is root-owned), so this needs sudo; it is a no-op when
# the directory is already writable or absent.
function ensure_test_results_writable(){
	local pwdir="$ORIG_HOME/repos/wekan/tests/playwright"
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

# Run one Playwright browser project for the "Run ALL tests" flow.
# Writes test-results/all-tests-<browser>.json and returns playwright's exit code.
# On Linux arm64 every browser goes through Docker (see browser_needs_docker).
function run_pw_all_browser(){
	local browser="$1"
	local pwdir="$ORIG_HOME/repos/wekan/tests/playwright"
	local json="test-results/all-tests-${browser}.json"
	# Per-browser output dir so suites can run in parallel without their
	# artifacts (.playwright-artifacts-N, screenshots, traces) colliding or
	# wiping each other when Playwright clears its output dir at startup.
	local outdir="test-results/${browser}"
	ensure_test_results_writable
	rm -f "$pwdir/$json"
	if browser_needs_docker "$browser"; then
		( cd "$pwdir" && export PLAYWRIGHT_JSON_OUTPUT_NAME="$json" && run_playwright_docker "$browser" --output="$outdir" --reporter=list,json )
		return $?
	fi
	(
		cd "$pwdir"
		export HOME="$ORIG_HOME/repos/wekan/.tools"
		unset CHROME_DEVEL_SANDBOX
		[ -d "$ORIG_HOME/.var/app/com.visualstudio.code/cache/ms-playwright" ] && \
			export PLAYWRIGHT_BROWSERS_PATH="$ORIG_HOME/.var/app/com.visualstudio.code/cache/ms-playwright"
		export WEKAN_PLAYWRIGHT_ALL=1
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
	local pwdir="$ORIG_HOME/repos/wekan/tests/playwright"
	ensure_test_results_writable

	if ! curl -fsS --connect-timeout 2 --max-time 4 http://127.0.0.1:3000/sign-in >/dev/null 2>&1; then
		echo "ERROR: WeKan does not appear to be running on http://localhost:3000."
		echo "       Start it first with menu option 3, then re-run this option."
		return 1
	fi

	read -p "Install Playwright test dependencies first? [y/N] " INSTALL_DEPS
	case "$INSTALL_DEPS" in [Yy]*) ( cd "$pwdir" && meteor npm install ) ;; esac

	# This run's own ../log/<timestamp>/ dir, so logs are never overwritten.
	local RUN_LOGDIR
	RUN_LOGDIR="../log/$(date '+%Y-%m-%d_%H-%M-%S')"
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
	# ../log/<timestamp>/ dir. PIPESTATUS[0] is run_pw_all_browser's exit code (the
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
function run_playwright_single(){
	local browser="$1"
	ORIG_HOME="$HOME"
	if browser_needs_docker "$browser"; then
		echo "Running $browser via the official Playwright Docker image."
		echo "Make sure WeKan is running on http://localhost:3000 (menu option 3, or 'Run ALL tests')."
		( cd "$ORIG_HOME/repos/wekan/tests/playwright" && run_playwright_docker "$browser" )
		return $?
	fi
	cd "$ORIG_HOME/repos/wekan/tests/playwright"
	export HOME="$ORIG_HOME/repos/wekan/.tools"
	unset CHROME_DEVEL_SANDBOX
	[ -d "$ORIG_HOME/.var/app/com.visualstudio.code/cache/ms-playwright" ] && \
		export PLAYWRIGHT_BROWSERS_PATH="$ORIG_HOME/.var/app/com.visualstudio.code/cache/ms-playwright"
	export WEKAN_PLAYWRIGHT_ALL=1
	read -p "Install Playwright test dependencies first? [y/N] " INSTALL_DEPS
	case "$INSTALL_DEPS" in [Yy]*) meteor npm install ;; esac
	meteor npm exec playwright test -- --project="$browser"
}

# Run the full test matrix (Mocha, import regression, Node E2E and the three
# Playwright browser suites) against ONE WeKan server on http://localhost:3000,
# then print a combined PASS/FAIL summary.
#   $1 = "parallel"    -> start every job at once and show a live progress table.
#                         Fast, but memory-hungry (fine on a 32 GB machine).
#   $1 = "sequential"  -> run one job at a time to keep RAM/swap usage low on
#                         smaller machines.
function run_all_tests(){
	local RUN_MODE="${1:-parallel}"
	local modeword; [ "$RUN_MODE" = parallel ] && modeword="in parallel (concurrently)" || modeword="one at a time (sequential)"
	# Each run of "Run ALL tests" gets its own ../log/<timestamp>/ directory
	# (stamped once, when the run starts), so logs are never overwritten and
	# previous runs are kept.
	local RUN_TS RUN_LOGDIR
	RUN_TS="$(date '+%Y-%m-%d_%H-%M-%S')"
	RUN_LOGDIR="../log/$RUN_TS"
	mkdir -p "$RUN_LOGDIR"
	echo "Logs for this run: $RUN_LOGDIR/  (previous runs are kept)"
	# Tests need a precompiled WeKan bundle (the :3000 test server runs it) and
	# installed npm deps. Check for the .build/bundle directory specifically (not just
	# .build): if the bundle is missing (never built, or a previous build failed),
	# build it first with `meteor build .build --directory` before running any tests.
	if [ ! -d .build/bundle ] || [ ! -d node_modules ]; then
		echo "No .build/bundle or node_modules directory found - building the WeKan bundle first (meteor build .build --directory)."
		build_wekan
	fi
	if [ "$RUN_MODE" = parallel ]; then
		echo "Running ALL tests against ONE WeKan server on http://localhost:3000 - all jobs run IN PARALLEL (concurrently). Needs plenty of RAM (fine on 32 GB)."
	else
		echo "Running ALL tests against ONE WeKan server on http://localhost:3000 - all jobs run SEQUENTIALLY (one at a time)."
	fi
	echo "Two WeKan servers are involved (they do NOT run tests in parallel unless you chose parallel):"
	echo "  :3000  - the PRECOMPILED .build/bundle run as a plain Node server (Meteor's mongod on :3001)"
	echo "           - serves Node E2E + Playwright browser tests. No recompile: your existing build is reused."
	echo "  :3100  - Mocha via 'meteor test' (its own .meteor/local-test build; the in-process server-side tests"
	echo "           CANNOT run from a production bundle, so this one build is unavoidable)."
	echo "  Import regression is a plain Node script (no server, no MongoDB)."
	SUMMARY=()
	record() { SUMMARY+=("$1|$2|${3:-}"); }
	label_of() { case "$1" in
		mocha) echo "Mocha (server-side)" ;;
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
			*)   n=$(grep -c $'\xe2\x9c\x93' "$2" 2>/dev/null) ;;
		esac
		echo "${n:-0}"
	}
	count_fail() {
		local n
		case "$1" in
			e2e) n=$(grep -c 'wekan-e2e\] FAIL' "$2" 2>/dev/null) ;;
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
			import) node tests/wekanCreator.import.test.js || rc=$? ;;
			e2e)    meteor npm run test:e2e || rc=$? ;;
			*)      run_pw_all_browser "$k" || rc=$? ;;
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

	# MongoDB on :3001. Reuse one that is already listening (e.g. a dev server's mongo);
	# otherwise start Meteor's bundled mongod with a persistent test dbpath.
	if (exec 3<>/dev/tcp/127.0.0.1/3001) 2>/dev/null; then
		echo "==> Reusing the MongoDB already listening on :3001 (not started or stopped by this run)."
	else
		if [ -z "$MONGOD_BIN" ] || [ ! -x "$MONGOD_BIN" ]; then
			echo "ERROR: nothing is listening on :3001 and no mongod was found (Meteor dev_bundle or PATH)."
			echo "       Meteor's bundled mongod is normally at <dev_bundle>/mongodb/bin/mongod."; rm -rf "$STATDIR"; return 1
		fi
		local DBPATH="../mongodb-test-3001"
		mkdir -p "$DBPATH"
		echo "==> Starting MongoDB (Meteor's mongod) on :3001, dbpath $DBPATH."
		{ echo "===== mongod :3001 - started $(date '+%Y-%m-%d %H:%M:%S %Z') ====="; "$MONGOD_BIN" --port 3001 --dbpath "$DBPATH" --bind_ip 127.0.0.1 --nounixsocket; } > "$RUN_LOGDIR/wekan-test-mongod.log" 2>&1 &
		MONGOD_PID=$!
		local db_ready=0
		for i in $(seq 1 60); do
			if (exec 3<>/dev/tcp/127.0.0.1/3001) 2>/dev/null; then db_ready=1; break; fi
			sleep 1
		done
		if [ "$db_ready" -ne 1 ]; then
			echo "ERROR: MongoDB did not become ready on :3001 (see $RUN_LOGDIR/wekan-test-mongod.log)."
			kill "$MONGOD_PID" >/dev/null 2>&1 || true; MONGOD_PID=""; rm -rf "$STATDIR"; return 1
		fi
	fi

	# Start the precompiled bundle as the :3000 server. Use an ABSOLUTE WRITABLE_PATH
	# (the bundle's main.js may chdir into programs/server, which would break a
	# relative "..").
	local WRITABLE_ABS; WRITABLE_ABS="$(cd .. 2>/dev/null && pwd)"
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
	{ echo "===== WeKan test server [bundle node :3000 db :3001/meteor] - started $(date '+%Y-%m-%d %H:%M:%S %Z') ====="; echo; \
	  MONGO_URL="mongodb://127.0.0.1:3001/meteor" ROOT_URL="http://localhost:3000" PORT=3000 \
	  WRITABLE_PATH="$WRITABLE_ABS" WITH_API=true RICHER_CARD_COMMENT_EDITOR=false \
	  DEFAULT_METEOR_REACTIVITY_ORDER="changeStreams,oplog,polling" \
	  "$NODE_BIN" "$BUNDLE_DIR/main.js"; } >> "$RUN_LOGDIR/wekan-test-server.log" 2>&1 &
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
	echo "==> Launching Mocha (separate .meteor/local-test build, port 3100) and import regression, $modeword."
	launch_job mocha
	launch_job import

	if [ "$SERVER_READY" -ne 1 ]; then
		echo "FAIL: server did not become ready on http://localhost:3000 (see $RUN_LOGDIR/wekan-test-server.log)"
		record FAIL "Server startup"
		record SKIP "Node E2E regressions"
		record SKIP "Playwright Chromium"
		record SKIP "Playwright Firefox"
		record SKIP "Playwright WebKit"
		ALLKEYS="mocha import"
	else
		record PASS "Server startup"
		# Server is up: add the server-facing jobs to the running set.
		launch_job e2e
		launch_job chromium
		launch_job firefox
		launch_job webkit
		ALLKEYS="mocha import e2e chromium firefox webkit"
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
				json="$ORIG_HOME/repos/wekan/tests/playwright/test-results/all-tests-${k}.json"
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

	if [ -n "$TEST_SERVER_PID" ]; then
		echo
		echo "Stopping WeKan test server (bundle node :3000)."
		kill "$TEST_SERVER_PID" >/dev/null 2>&1 || true
		wait "$TEST_SERVER_PID" >/dev/null 2>&1 || true
	fi
	# Stop the mongod we started (leave a pre-existing/reused one alone: MONGOD_PID
	# is only set when this run launched it).
	if [ -n "$MONGOD_PID" ]; then
		echo "Stopping test MongoDB (mongod :3001)."
		kill "$MONGOD_PID" >/dev/null 2>&1 || true
		wait "$MONGOD_PID" >/dev/null 2>&1 || true
	fi

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
	elif command -v pacman >/dev/null 2>&1; then PM=pacman
	fi
	echo "Detected package manager: ${PM:-none}"

	# gh - GitHub CLI (source forge)
	if command -v gh >/dev/null 2>&1; then echo "OK: gh present"
	else case "$PM" in
		brew) brew install gh ;;
		dnf)  sudo dnf install -y gh ;;
		pacman) sudo pacman -S --noconfirm github-cli ;;
		apt)
			type -p curl >/dev/null || sudo apt install -y curl
			curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
			sudo chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg
			echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list >/dev/null
			sudo apt update && sudo apt install -y gh ;;
		*) echo "Install gh manually: https://github.com/cli/cli#installation" ;;
	esac; fi

	# glab - GitLab CLI
	if command -v glab >/dev/null 2>&1; then echo "OK: glab present"
	else case "$PM" in
		brew) brew install glab ;;
		pacman) sudo pacman -S --noconfirm glab ;;
		dnf) sudo dnf install -y glab || echo "If unavailable: https://gitlab.com/gitlab-org/cli/-/releases" ;;
		apt) sudo apt install -y glab 2>/dev/null || echo "glab not in apt; .deb at https://gitlab.com/gitlab-org/cli/-/releases" ;;
		*) echo "Install glab manually: https://gitlab.com/gitlab-org/cli#installation" ;;
	esac; fi

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

echo
PS3='Please enter your choice: '

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

# Docker submenu: pick a backend, then Start / Follow logs / Stop.
# Returns 0 when an action ran, 1 on Back (so the caller re-shows the menu).
DOCKER_DBS=("FerretDB v1 SQLite (default)|docker-compose.yml"
            "MongoDB 7|docker-compose-mongodb-v7.yml"
            "FerretDB v2 (PostgreSQL)|docker-compose-ferretdb-v2-postgresql.yml"
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

opt=""
while [ -z "$opt" ]; do
	echo; echo "==================== WeKan ===================="
	select cat in "Setup" "Dev server" "Tests" "Docker" "Tools" "Quit"; do
		case $cat in
			"Setup")
				choose "Setup" \
					"Install dependencies|Install WeKan dependencies" \
					"Build WeKan|Build WeKan" ;;
			"Dev server")
				choose "Dev server" \
					"localhost:3000|Run Meteor for dev on http://localhost:3000" \
					"localhost:3000 + trace warnings|Run Meteor for dev on http://localhost:3000 with trace warnings, and warnings using old Meteor API that will not exist in Meteor 3.0" \
					"localhost:3000 + bundle visualizer|Run Meteor for dev on http://localhost:3000 with bundle visualizer" \
					"CURRENT-IP:3000|Run Meteor for dev on http://CURRENT-IP-ADDRESS:3000" \
					"CURRENT-IP:3000 + MONGO_URL 27019|Run Meteor for dev on http://CURRENT-IP-ADDRESS:3000 with MONGO_URL=mongodb://127.0.0.1:27019/wekan" \
					"CUSTOM-IP:PORT|Run Meteor for dev on http://CUSTOM-IP-ADDRESS:PORT" \
					"Kill all dev servers|Kill all dev servers (free ports 3000/3001/3100/3101/4000/4001/8080)" ;;
			"Tests")
				choose "Tests" \
					"ALL tests, parallel|Run ALL tests in parallel on http://localhost:3000 (start server, jobs run concurrently, progress + summary)" \
					"ALL tests, sequential|Run ALL tests sequentially on http://localhost:3000 (start server, one job at a time, progress + summary)" \
					"Mocha (server-side)|Test Mocha unit + security + API-logic tests (server-side only, no browser)" \
					"Import regression|Test import regression (tests/wekanCreator.import.test.js, fast, no server)" \
					"Node E2E regressions|Test Node E2E regressions (tests/e2e/list-regressions.js, needs running server)" \
					"Install Playwright browsers|Install Playwright browsers (Chromium, Firefox, WebKit; native and/or Docker)" \
					"Playwright Chromium|Test Playwright Chromium" \
					"Playwright Firefox|Test Playwright Firefox" \
					"Playwright WebKit|Test Playwright Webkit" \
					"Playwright ALL browsers|Test Playwright ALL browsers sequentially (Chromium + Firefox + WebKit, one at a time), server already running on :3000" \
					"Floating-promises guard|Check floating promises guard (@typescript-eslint/no-floating-promises + auth await scan)" \
					"Count tests by category|Count amount of tests by category" ;;
			"Tools")
				choose "Tools" \
					"Save Meteor deps list|Save Meteor dependency chain to ../meteor-deps.txt" \
					"Install forge CLI tools|Install forge CLI tools (gh, glab, tea, git-bug, forge) for GitHub/GitLab/Codeberg/Forgejo/Gitea" \
					"Mirror repo to forges|Mirror repo GitHub -> GitLab/Codeberg/Forgejo/Gitea: code + issues + PRs + Actions (sync missing, convert CI syntax)" ;;
			"Docker") if docker_menu; then exit 0; fi ;;
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
			# Debian, Ubuntu, Mint
			sudo apt install -y build-essential gcc g++ make git curl wget p7zip-full zip unzip unp npm p7zip-full
			#sudo chown -R $(id -u):$(id -g) $HOME/.npm
			sudo npm -g install n
			sudo n 24.16.0
			sudo npm -g install meteor --unsafe-perm
			#sudo chown -R $(id -u):$(id -g) $HOME/.npm $HOME/.meteor
		elif [[ "$OSTYPE" == "darwin"* ]]; then
			echo "macOS"
			brew install npm
			brew install node@24
			ZSHRC="$HOME/.zshrc"
			touch "$ZSHRC"
			grep -qxF 'export PATH="/opt/homebrew/opt/node@24/bin:$PATH"' "$ZSHRC" || echo 'export PATH="/opt/homebrew/opt/node@24/bin:$PATH"' >> "$ZSHRC"
			grep -qxF 'export LDFLAGS="-L/opt/homebrew/opt/node@24/lib"' "$ZSHRC" || echo 'export LDFLAGS="-L/opt/homebrew/opt/node@24/lib"' >> "$ZSHRC"
			grep -qxF 'export CPPFLAGS="-I/opt/homebrew/opt/node@24/include"' "$ZSHRC" || echo 'export CPPFLAGS="-I/opt/homebrew/opt/node@24/include"' >> "$ZSHRC"
			export PATH="/opt/homebrew/opt/node@24/bin:$PATH"
			export LDFLAGS="-L/opt/homebrew/opt/node@24/lib"
			export CPPFLAGS="-I/opt/homebrew/opt/node@24/include"
			directory_name="~/.npm"
			if [ ! -d "$directory_name" ]; then
				mkdir "$directory_name"
				echo "Directory '$directory_name' created."
			else
				echo "Directory '$directory_name' already exists."
			fi
			npm config set prefix '~/.npm'
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

    "Build WeKan")
		build_wekan
		break
		;;

    "Run Meteor for dev on http://localhost:3000")
		ensure_rspack_public_dirs
		kill_meteor_on_port 3000 || break
		#Not in use, could increase RAM usage: NODE_OPTIONS="--max_old_space_size=4096"
		#---------------------------------------------------------------------
		# Logging of terminal output to console and to ../log/wekan-log.log at end of this line: 2>&1 | tee ../log/wekan-log.log
		#WARN_WHEN_USING_OLD_API=true NODE_OPTIONS="--trace-warnings"
		DEFAULT_METEOR_REACTIVITY_ORDER="changeStreams,oplog,polling" DDP_TRANSPORT=uws DEBUG=true WRITABLE_PATH=.. WITH_API=true RICHER_CARD_COMMENT_EDITOR=false ROOT_URL=http://localhost:3000 meteor run --port 3000 2>&1 | tee ../log/wekan-log.log
		#---------------------------------------------------------------------
		break
		;;


    "Run Meteor for dev on http://localhost:3000 with trace warnings, and warnings using old Meteor API that will not exist in Meteor 3.0")
		ensure_rspack_public_dirs
		kill_meteor_on_port 3000 || break
                #Not in use, could increase RAM usage: NODE_OPTIONS="--max_old_space_size=4096"
                #---------------------------------------------------------------------
                # Logging of terminal output to console and to ../log/wekan-log.log at end of this line: 2>&1 | tee ../log/wekan-log.log
                DEFAULT_METEOR_REACTIVITY_ORDER="changeStreams,oplog,polling" DDP_TRANSPORT=uws DEBUG=true WARN_WHEN_USING_OLD_API=true NODE_OPTIONS="--trace-warnings --max-old-space-size=8192" WRITABLE_PATH=.. WITH_API=true RICHER_CARD_COMMENT_EDITOR=false ROOT_URL=http://localhost:3000 meteor run --port 3000 2>&1 | tee ../log/wekan-log.log
                #---------------------------------------------------------------------
                break
                ;;

    "Run Meteor for dev on http://localhost:3000 with bundle visualizer")
		ensure_rspack_public_dirs
		kill_meteor_on_port 3000 || break
		#Not in use, could increase RAM usage: NODE_OPTIONS="--max_old_space_size=4096"
		#---------------------------------------------------------------------
		#Logging of terminal output to console and to ../log/wekan-log.log at end of this line: 2>&1 | tee ../log/wekan-log.log
		#WARN_WHEN_USING_OLD_API=true NODE_OPTIONS="--trace-warnings"
		DEFAULT_METEOR_REACTIVITY_ORDER="changeStreams,oplog,polling" DDP_TRANSPORT=uws DEBUG=true WRITABLE_PATH=.. WITH_API=true RICHER_CARD_COMMENT_EDITOR=false ROOT_URL=http://localhost:3000 meteor run --port 3000 --extra-packages bundle-visualizer --production  2>&1 | tee ../log/wekan-log.log
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
		#Logging of terminal output to console and to ../log/wekan-log.log at end of this line: 2>&1 | tee ../log/wekan-log.log
		#WARN_WHEN_USING_OLD_API=true NODE_OPTIONS="--trace-warnings"
		DEFAULT_METEOR_REACTIVITY_ORDER="changeStreams,oplog,polling" DDP_TRANSPORT=uws DEBUG=true WRITABLE_PATH=.. WITH_API=true RICHER_CARD_COMMENT_EDITOR=false ROOT_URL=http://$IPADDRESS:3000 meteor run --port 3000 2>&1 | tee ../log/wekan-log.log
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
                #Logging of terminal output to console and to ../log/wekan-log.log at end of this line: 2>&1 | tee ../log/wekan-log.log
                #WARN_WHEN_USING_OLD_API=true NODE_OPTIONS="--trace-warnings"
                DEFAULT_METEOR_REACTIVITY_ORDER="changeStreams,oplog,polling" DDP_TRANSPORT=uws DEBUG=true MONGO_URL=mongodb://127.0.0.1:27019/wekan WRITABLE_PATH=.. WITH_API=true RICHER_CARD_COMMENT_EDITOR=false ROOT_URL=http://$IPADDRESS:3000 meteor run --port 3000 2>&1 | tee ../log/wekan-log.log
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
		#Logging of terminal output to console and to ../log/wekan-log.log at end of this line: 2>&1 | tee ../log/wekan-log.log
		#WARN_WHEN_USING_OLD_API=true NODE_OPTIONS="--trace-warnings"
		DEFAULT_METEOR_REACTIVITY_ORDER="changeStreams,oplog,polling" DDP_TRANSPORT=uws DEBUG=true WRITABLE_PATH=.. WITH_API=true RICHER_CARD_COMMENT_EDITOR=false ROOT_URL=http://$IPADDRESS:$PORT meteor run --port $PORT 2>&1 | tee ../log/wekan-log.log
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

    "Run ALL tests in parallel on http://localhost:3000 (start server, jobs run concurrently, progress + summary)")
		run_all_tests parallel
		break
		;;

    "Run ALL tests sequentially on http://localhost:3000 (start server, one job at a time, progress + summary)")
		run_all_tests sequential
		break
		;;

	"Test Mocha unit + security + API-logic tests (server-side only, no browser)")
		echo "Running Mocha tests: meteor test --once --driver-package meteortesting:mocha --port 3100"
		echo "(server-side unit/security/API-logic tests; browser/client tests are covered by Playwright options)"
		meteor test --once --driver-package meteortesting:mocha --port 3100
		break
		;;

    "Test import regression (tests/wekanCreator.import.test.js, fast, no server)")
		echo "Running import regression test (node, no server needed)."
		node tests/wekanCreator.import.test.js
		break
		;;

    "Test Node E2E regressions (tests/e2e/list-regressions.js, needs running server)")
		echo "Running Node E2E regressions (puppeteer)."
		echo "NOTE: needs a WeKan server with WITH_API=true on http://localhost:3000."
		echo "      Start one with menu option 3 first, or use the Run ALL tests option."
		meteor npm run test:e2e
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
		if ! command -v rg >/dev/null 2>&1; then
			echo "ripgrep (rg) not found. Installing dependency."
			if command -v apt >/dev/null 2>&1; then
				sudo apt install -y ripgrep
			elif command -v brew >/dev/null 2>&1; then
				brew install ripgrep
			else
				echo "WARNING: Could not auto-install ripgrep. Falling back to grep."
			fi
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

		echo "Checking whether @typescript-eslint/no-floating-promises is configured in .eslintrc.json"
		if command -v rg >/dev/null 2>&1; then
			RULE_CHECK_CMD='rg -n'
		else
			RULE_CHECK_CMD='grep -nE'
		fi

		if $RULE_CHECK_CMD '"@typescript-eslint/no-floating-promises"' .eslintrc.json >/dev/null 2>&1; then
			echo "OK: Rule @typescript-eslint/no-floating-promises is configured in .eslintrc.json"
		else
			echo "WARNING: Rule @typescript-eslint/no-floating-promises is NOT configured in .eslintrc.json"
			echo "Suggested: add @typescript-eslint/eslint-plugin and set '@typescript-eslint/no-floating-promises': 'error'"
		fi

		echo "Quick note: @typescript-eslint/no-floating-promises is a type-aware rule and may require further parser/project setup for full enforcement in all files."

		echo
		echo "Scanning for unawaited Authentication.checkBoardAccess/checkBoardWriteAccess in server/models"
		AUTH_CALL_PATTERN='Authentication\.checkBoardAccess\(|Authentication\.checkBoardWriteAccess\('
		AUTH_AWAIT_PATTERN='await Authentication\.checkBoardAccess\(|await Authentication\.checkBoardWriteAccess\('
		if command -v rg >/dev/null 2>&1; then
			if rg -n "$AUTH_CALL_PATTERN" server/models | rg -v "$AUTH_AWAIT_PATTERN"; then
				echo "WARNING: Found possible unawaited board auth checks above"
			else
				echo "OK: No unawaited board auth checks found"
			fi
		else
			if grep -RInE "$AUTH_CALL_PATTERN" server/models | grep -vE "$AUTH_AWAIT_PATTERN"; then
				echo "WARNING: Found possible unawaited board auth checks above"
			else
				echo "OK: No unawaited board auth checks found"
			fi
		fi
		break
		;;

    "Install forge CLI tools (gh, glab, tea, git-bug, forge) for GitHub/GitLab/Codeberg/Forgejo/Gitea")
		install_forge_tools
		break
		;;

    "Mirror repo GitHub -> GitLab/Codeberg/Forgejo/Gitea: code + issues + PRs + Actions (sync missing, convert CI syntax)")
		mirror_forge
		break
		;;

    "Count amount of tests by category")
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
		break
		;;

    esac
done
