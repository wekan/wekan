#!/bin/bash

echo "Recommended for development: Newest Debian or Ubuntu amd64 based distro, directly to SSD disk or dual boot, not VM. Works fast."
echo "Note1: If you use other locale than en_US.UTF-8 , you need to additionally install en_US.UTF-8"
echo "       with 'sudo dpkg-reconfigure locales' , so that MongoDB works correctly."
echo "       You can still use any other locale as your main locale."
echo "Note2: Console output is also logged to ../wekan-log.txt"

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

# WebKit's bundled Playwright build links against old system libraries (libicu 74,
# libxml2 v2, libevent 2.1, ...) that newer Linux arm64 distros (e.g. Ubuntu 26.04)
# no longer ship, so it cannot launch natively there. On Linux arm64 we drive WebKit
# from the official Playwright Docker image instead; Linux amd64 and macOS arm64 run
# WebKit natively. Override with WEKAN_WEBKIT_DOCKER=1 (force Docker) or =0 (force native).
function webkit_needs_docker(){
	case "${WEKAN_WEBKIT_DOCKER:-auto}" in
		1) return 0 ;;
		0) return 1 ;;
	esac
	[ "$PLATFORM_OS" = "linux" ] && [ "$PLATFORM_ARCH" = "arm64" ]
}

# Run the WebKit Playwright project inside the official Playwright container.
# Extra args are passed through to `playwright test`. WeKan must already be running
# on the host (default http://127.0.0.1:3000, Meteor's bundled Mongo on 3001); the
# container shares the host network so it can reach both.
function run_playwright_webkit_docker(){
	local reporoot="$ORIG_HOME/repos/wekan"
	local pwdir="$reporoot/tests/playwright"
	if ! command -v docker >/dev/null 2>&1; then
		echo "ERROR: Docker is required to run WebKit on Linux arm64, but 'docker' was not found."
		echo "       Install Docker, or run WebKit on Linux amd64 / macOS arm64 (native)."
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
	echo "Running Playwright WebKit in Docker ($image) on Linux arm64."
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
		sh -c 'export PATH=/repo/tests/playwright/node_modules/.bin:$PATH; exec npx playwright test --project=webkit "$@"' sh "$@"
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
# WebKit goes through Docker on Linux arm64 (see webkit_needs_docker).
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
	if [ "$browser" = "webkit" ] && webkit_needs_docker; then
		( cd "$pwdir" && export PLAYWRIGHT_JSON_OUTPUT_NAME="$json" && run_playwright_webkit_docker --output="$outdir" --reporter=list,json )
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
# streams to ../wekan-playwright-<browser>.log; once all finish we print each
# log followed by a per-browser PASS/FAIL summary. Tests seed their own random
# users/boards and clean up by id, so running the three browsers at once is safe.
function run_playwright_parallel(){
	ORIG_HOME="$HOME"
	local pwdir="$ORIG_HOME/repos/wekan/tests/playwright"
	ensure_test_results_writable

	if ! curl -fsS http://127.0.0.1:3000/sign-in >/dev/null 2>&1; then
		echo "ERROR: WeKan does not appear to be running on http://localhost:3000."
		echo "       Start it first with menu option 3, then re-run this option."
		return 1
	fi

	read -p "Install Playwright test dependencies first? [y/N] " INSTALL_DEPS
	case "$INSTALL_DEPS" in [Yy]*) ( cd "$pwdir" && meteor npm install ) ;; esac

	echo "Running Chromium, Firefox and WebKit Playwright suites at the same time."
	echo "Live output goes to ../wekan-playwright-<browser>.log; a summary prints when all finish."

	# bash 3.2 (macOS) has no associative arrays, so track the three PIDs in
	# plain variables instead of a map.
	( run_pw_all_browser chromium ) > ../wekan-playwright-chromium.log 2>&1 &
	local pid_chromium=$!
	( run_pw_all_browser firefox  ) > ../wekan-playwright-firefox.log  2>&1 &
	local pid_firefox=$!
	( run_pw_all_browser webkit   ) > ../wekan-playwright-webkit.log   2>&1 &
	local pid_webkit=$!
	echo "  chromium pid $pid_chromium, firefox pid $pid_firefox, webkit pid $pid_webkit"

	local rc_chromium rc_firefox rc_webkit
	wait "$pid_chromium"; rc_chromium=$?
	wait "$pid_firefox";  rc_firefox=$?
	wait "$pid_webkit";   rc_webkit=$?

	local PW_FAILURES=""
	SUMMARY=()
	record() { SUMMARY+=("$1|$2|${3:-}"); }
	for entry in "chromium:Chromium:$rc_chromium" "firefox:Firefox:$rc_firefox" "webkit:WebKit:$rc_webkit"; do
		browser="${entry%%:*}"; rest="${entry#*:}"; label="${rest%%:*}"; rc="${rest#*:}"
		echo
		echo "==================== Playwright $label output ===================="
		cat "../wekan-playwright-${browser}.log" 2>/dev/null || true
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
	if [ "$browser" = "webkit" ] && webkit_needs_docker; then
		echo "Linux arm64 detected: running WebKit via Docker (native WebKit cannot launch here)."
		echo "Make sure WeKan is running on http://localhost:3000 (menu option 3, or 'Run ALL tests')."
		( cd "$ORIG_HOME/repos/wekan/tests/playwright" && run_playwright_webkit_docker )
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

echo
PS3='Please enter your choice: '
options=("Install WeKan dependencies" "Build WeKan" "Run Meteor for dev on http://localhost:3000" "Run Meteor for dev on http://localhost:3000 with trace warnings, and warnings using old Meteor API that will not exist in Meteor 3.0" "Run Meteor for dev on http://localhost:3000 with bundle visualizer" "Run Meteor for dev on http://CURRENT-IP-ADDRESS:3000" "Run Meteor for dev on http://CURRENT-IP-ADDRESS:3000 with MONGO_URL=mongodb://127.0.0.1:27019/wekan" "Run Meteor for dev on http://CUSTOM-IP-ADDRESS:PORT" "Run ALL tests on http://localhost:3000 (start server, progress + summary)" "Test Mocha unit + security + API-logic tests (server-side only, no browser)" "Test import regression (tests/wekanCreator.import.test.js, fast, no server)" "Test Node E2E regressions (tests/e2e/list-regressions.js, needs running server)" "Test Playwright Chromium" "Test Playwright Firefox" "Test Playwright Webkit" "Test Playwright ALL browsers in parallel (Chromium + Firefox + WebKit), server already running on :3000" "Check floating promises guard (@typescript-eslint/no-floating-promises + auth await scan)" "Save Meteor dependency chain to ../meteor-deps.txt" "Quit")

select opt in "${options[@]}"
do
    case $opt in
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
		echo "Building WeKan."
		rm -rf node_modules .meteor/local .build
		(meteor update --npm 2>/dev/null || true) && meteor npm install
		meteor build .build --directory
		echo Done.
		break
		;;

    "Run Meteor for dev on http://localhost:3000")
		ensure_rspack_public_dirs
		#Not in use, could increase RAM usage: NODE_OPTIONS="--max_old_space_size=4096"
		#---------------------------------------------------------------------
		# Logging of terminal output to console and to ../wekan-log.txt at end of this line: 2>&1 | tee ../wekan-log.txt
		#WARN_WHEN_USING_OLD_API=true NODE_OPTIONS="--trace-warnings"
		DEFAULT_METEOR_REACTIVITY_ORDER="changeStreams,oplog,polling" DDP_TRANSPORT=uws DEBUG=true WRITABLE_PATH=.. WITH_API=true RICHER_CARD_COMMENT_EDITOR=false ROOT_URL=http://localhost:3000 meteor run --port 3000 2>&1 | tee ../wekan-log.txt
		#---------------------------------------------------------------------
		break
		;;


    "Run Meteor for dev on http://localhost:3000 with trace warnings, and warnings using old Meteor API that will not exist in Meteor 3.0")
		ensure_rspack_public_dirs
                #Not in use, could increase RAM usage: NODE_OPTIONS="--max_old_space_size=4096"
                #---------------------------------------------------------------------
                # Logging of terminal output to console and to ../wekan-log.txt at end of this line: 2>&1 | tee ../wekan-log.txt
                DEFAULT_METEOR_REACTIVITY_ORDER="changeStreams,oplog,polling" DDP_TRANSPORT=uws DEBUG=true WARN_WHEN_USING_OLD_API=true NODE_OPTIONS="--trace-warnings" WRITABLE_PATH=.. WITH_API=true RICHER_CARD_COMMENT_EDITOR=false ROOT_URL=http://localhost:3000 meteor run --port 3000 2>&1 | tee ../wekan-log.txt
                #---------------------------------------------------------------------
                break
                ;;

    "Run Meteor for dev on http://localhost:3000 with bundle visualizer")
		ensure_rspack_public_dirs
		#Not in use, could increase RAM usage: NODE_OPTIONS="--max_old_space_size=4096"
		#---------------------------------------------------------------------
		#Logging of terminal output to console and to ../wekan-log.txt at end of this line: 2>&1 | tee ../wekan-log.txt
		#WARN_WHEN_USING_OLD_API=true NODE_OPTIONS="--trace-warnings"
		DEFAULT_METEOR_REACTIVITY_ORDER="changeStreams,oplog,polling" DDP_TRANSPORT=uws DEBUG=true WRITABLE_PATH=.. WITH_API=true RICHER_CARD_COMMENT_EDITOR=false ROOT_URL=http://localhost:3000 meteor run --port 3000 --extra-packages bundle-visualizer --production  2>&1 | tee ../wekan-log.txt
		#---------------------------------------------------------------------
		break
		;;

    "Run Meteor for dev on http://CURRENT-IP-ADDRESS:3000")
		ensure_rspack_public_dirs
		if [[ "$OSTYPE" == "darwin"* ]]; then
		  IPADDRESS=$(ifconfig | grep broadcast | grep 'inet ' | cut -d: -f2 | awk '{ print $2}' | cut -d '/' -f 1 | grep '192.')
		else
		  IPADDRESS=$(ip a | grep 'noprefixroute' | grep 'inet ' | cut -d: -f2 | awk '{ print $2}' | cut -d '/' -f 1 | grep '192.')
		fi
		echo "Your IP address is $IPADDRESS"
		#---------------------------------------------------------------------
		#Not in use, could increase RAM usage: NODE_OPTIONS="--max_old_space_size=4096"
		#---------------------------------------------------------------------
		#Logging of terminal output to console and to ../wekan-log.txt at end of this line: 2>&1 | tee ../wekan-log.txt
		#WARN_WHEN_USING_OLD_API=true NODE_OPTIONS="--trace-warnings"
		DEFAULT_METEOR_REACTIVITY_ORDER="changeStreams,oplog,polling" DDP_TRANSPORT=uws DEBUG=true WRITABLE_PATH=.. WITH_API=true RICHER_CARD_COMMENT_EDITOR=false ROOT_URL=http://$IPADDRESS:3000 meteor run --port 3000 2>&1 | tee ../wekan-log.txt
		#---------------------------------------------------------------------
		break
		;;

    "Run Meteor for dev on http://CURRENT-IP-ADDRESS:3000 with MONGO_URL=mongodb://127.0.0.1:27019/wekan")
		ensure_rspack_public_dirs
                if [[ "$OSTYPE" == "darwin"* ]]; then
                  IPADDRESS=$(ifconfig | grep broadcast | grep 'inet ' | cut -d: -f2 | awk '{ print $2}' | cut -d '/' -f 1 | grep '192.')
                else
                  IPADDRESS=$(ip a | grep 'noprefixroute' | grep 'inet ' | cut -d: -f2 | awk '{ print $2}' | cut -d '/' -f 1 | grep '192.')
                fi
                echo "Your IP address is $IPADDRESS"
                #---------------------------------------------------------------------
                #Not in use, could increase RAM usage: NODE_OPTIONS="--max_old_space_size=4096"
                #---------------------------------------------------------------------
                #Logging of terminal output to console and to ../wekan-log.txt at end of this line: 2>&1 | tee ../wekan-log.txt
                #WARN_WHEN_USING_OLD_API=true NODE_OPTIONS="--trace-warnings"
                DEFAULT_METEOR_REACTIVITY_ORDER="changeStreams,oplog,polling" DDP_TRANSPORT=uws DEBUG=true MONGO_URL=mongodb://127.0.0.1:27019/wekan WRITABLE_PATH=.. WITH_API=true RICHER_CARD_COMMENT_EDITOR=false ROOT_URL=http://$IPADDRESS:3000 meteor run --port 3000 2>&1 | tee ../wekan-log.txt
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
		#---------------------------------------------------------------------
		#Not in use, could increase RAM usage: NODE_OPTIONS="--max_old_space_size=4096"
		#---------------------------------------------------------------------
		#Logging of terminal output to console and to ../wekan-log.txt at end of this line: 2>&1 | tee ../wekan-log.txt
		#WARN_WHEN_USING_OLD_API=true NODE_OPTIONS="--trace-warnings"
		DEFAULT_METEOR_REACTIVITY_ORDER="changeStreams,oplog,polling" DDP_TRANSPORT=uws DEBUG=true WRITABLE_PATH=.. WITH_API=true RICHER_CARD_COMMENT_EDITOR=false ROOT_URL=http://$IPADDRESS:$PORT meteor run --port $PORT 2>&1 | tee ../wekan-log.txt
		#---------------------------------------------------------------------
		break
		;;

    "Save Meteor dependency chain to ../meteor-deps.txt")
                meteor list --tree > ../meteor-deps.txt
                echo "Saved Meteor dependency chain to ../meteor-deps.txt"
                #---------------------------------------------------------------------
                break
                ;;

    "Run ALL tests on http://localhost:3000 (start server, progress + summary)")
		echo "Running ALL tests against ONE WeKan server on http://localhost:3000 - all jobs in PARALLEL with live progress."
		echo "Mocha gets its own build dir (.meteor/local-test) so it runs at the same time as the :3000 server, which keeps .meteor/local."
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
		ORIG_HOME="$HOME"
		PW_FAILURES=""
		TEST_SERVER_PID=""
		STATDIR="$(mktemp -d)"
		BPIDS=""
		# Launch one test job in the background: run it, record its exit code in
		# STATDIR/<key>, and send all of its output to ../wekan-alltests-<key>.log.
		launch_job() {
			local k="$1"
			(
				rc=0
				case "$k" in
					mocha)  METEOR_LOCAL_DIR=.meteor/local-test meteor test --once --driver-package meteortesting:mocha --port 3100 || rc=$? ;;
					import) node tests/wekanCreator.import.test.js || rc=$? ;;
					e2e)    meteor npm run test:e2e || rc=$? ;;
					*)      run_pw_all_browser "$k" || rc=$? ;;
				esac
				echo "$rc" > "$STATDIR/$k"
			) > "../wekan-alltests-$k.log" 2>&1 &
			BPIDS="$BPIDS $!"
		}

		if curl -fsS http://127.0.0.1:3000 >/dev/null 2>&1; then
			echo "ERROR: Port 3000 is already in use. Stop any running dev server before running this option."
			rm -rf "$STATDIR"
			break
		fi

		# Start the :3000 server FIRST and let it build alone. Mocha runs its own
		# Meteor build (.meteor/local-test); launching it here would make two full
		# builds compete for CPU/disk and starve the server, so it does not become
		# ready until much later (a long line of dots). Mocha and the import
		# regression do not need the server, so we launch them once it is ready and
		# they then run in parallel with the E2E and browser jobs.
		echo
		echo "==> Starting the single WeKan server on http://localhost:3000 (WITH_API=true, .meteor/local)"
		DEFAULT_METEOR_REACTIVITY_ORDER="changeStreams,oplog,polling" DDP_TRANSPORT=uws DEBUG=true WRITABLE_PATH=.. WITH_API=true RICHER_CARD_COMMENT_EDITOR=false ROOT_URL=http://localhost:3000 meteor run --port 3000 > ../wekan-test-server.log 2>&1 &
		TEST_SERVER_PID=$!
		SERVER_READY=0
		for i in $(seq 1 180); do
			if curl -fsS http://127.0.0.1:3000/sign-in >/dev/null 2>&1; then SERVER_READY=1; break; fi
			printf '.'; sleep 1
		done
		echo

		# Mocha and the import regression do not need the :3000 server; launch them
		# now (after the server build is past, so they no longer compete with it)
		# so they run in parallel with the E2E and browser jobs below.
		echo "==> Starting Mocha (separate .meteor/local-test build, port 3100) and import regression in parallel."
		launch_job mocha
		launch_job import

		if [ "$SERVER_READY" -ne 1 ]; then
			echo "FAIL: server did not become ready on http://localhost:3000 (see ../wekan-test-server.log)"
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

		# Live combined progress: one refreshing line per running job until all end.
		BN="$(set -- $ALLKEYS; echo $#)"
		echo "Live progress (refreshes every second) - [RUN]/[PASS]/[FAIL], checks passed / x failed:"
		for k in $ALLKEYS; do echo; done
		while :; do
			printf '\033[%dA' "$BN"
			alldone=1
			for k in $ALLKEYS; do
				log="../wekan-alltests-$k.log"
				ok=$(grep -c $'\xe2\x9c\x93' "$log" 2>/dev/null); ok=${ok:-0}
				bad=$(grep -c $'\xe2\x9c\x98' "$log" 2>/dev/null); bad=${bad:-0}
				if [ -f "$STATDIR/$k" ]; then
					rc=$(cat "$STATDIR/$k" 2>/dev/null)
					if [ "${rc:-1}" = "0" ]; then st="PASS"; else st="FAIL"; fi
				else
					st="RUN "; alldone=0
				fi
				printf '\033[K  [%-4s] %-22s ok:%s fail:%s\n' "$st" "$(label_of "$k")" "$ok" "$bad"
			done
			[ "$alldone" -eq 1 ] && break
			sleep 1
		done
		for p in $BPIDS; do wait "$p" 2>/dev/null || true; done

		# Roll the parallel results into the summary (browsers carry pass/fail stats).
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
			echo "Stopping WeKan test server."
			kill "$TEST_SERVER_PID" >/dev/null 2>&1 || true
			wait "$TEST_SERVER_PID" >/dev/null 2>&1 || true
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
		echo "(per-job logs: ../wekan-alltests-<mocha|import|e2e|chromium|firefox|webkit>.log ; server: ../wekan-test-server.log)"
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

    "Test Playwright ALL browsers in parallel (Chromium + Firefox + WebKit), server already running on :3000")
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

    "Quit")
		break
		;;
    *) echo invalid option;;
    esac
done
