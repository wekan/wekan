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

echo
PS3='Please enter your choice: '
options=("Install WeKan dependencies" "Build WeKan" "Run Meteor for dev on http://localhost:3000" "Run Meteor for dev on http://localhost:3000 with trace warnings, and warnings using old Meteor API that will not exist in Meteor 3.0" "Run Meteor for dev on http://localhost:3000 with bundle visualizer" "Run Meteor for dev on http://CURRENT-IP-ADDRESS:3000" "Run Meteor for dev on http://CURRENT-IP-ADDRESS:3000 with MONGO_URL=mongodb://127.0.0.1:27019/wekan" "Run Meteor for dev on http://CUSTOM-IP-ADDRESS:PORT" "Run ALL tests on http://localhost:3000 (start server, progress + summary)" "Test Mocha unit + security + API-logic tests (server-side only, no browser)" "Test import regression (tests/wekanCreator.import.test.js, fast, no server)" "Test Node E2E regressions (tests/e2e/list-regressions.js, needs running server)" "Test Playwright Chromium" "Test Playwright Firefox" "Test Playwright Webkit" "Check floating promises guard (@typescript-eslint/no-floating-promises + auth await scan)" "Save Meteor dependency chain to ../meteor-deps.txt" "Quit")

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
		echo "Running ALL tests: import regression + Mocha (server-side) + Node E2E + Playwright."
		SUMMARY=()
		record() { SUMMARY+=("$1|$2"); }

		if curl -fsS http://127.0.0.1:3000 >/dev/null 2>&1; then
			echo "ERROR: Port 3000 is already in use. Stop any running dev server before running this option."
			break
		fi

		TOTAL=5
		TEST_SERVER_PID=""

		echo
		echo "==> [1/$TOTAL] Import regression (node, no server)"
		if node tests/wekanCreator.import.test.js; then record PASS "Import regression"; else record FAIL "Import regression"; fi

		echo
		echo "==> [2/$TOTAL] Mocha unit + security + API-logic tests (server-side, meteor test, port 3100)"
		if meteor test --once --driver-package meteortesting:mocha --port 3100; then record PASS "Mocha (server-side)"; else record FAIL "Mocha (server-side)"; fi

		echo
		echo "==> [3/$TOTAL] Starting WeKan server on http://localhost:3000 (WITH_API=true)"
		DEFAULT_METEOR_REACTIVITY_ORDER="changeStreams,oplog,polling" DDP_TRANSPORT=uws DEBUG=true WRITABLE_PATH=.. WITH_API=true RICHER_CARD_COMMENT_EDITOR=false ROOT_URL=http://localhost:3000 meteor run --port 3000 > ../wekan-test-server.log 2>&1 &
		TEST_SERVER_PID=$!
		SERVER_READY=0
		for i in $(seq 1 180); do
			if curl -fsS http://127.0.0.1:3000/sign-in >/dev/null 2>&1; then SERVER_READY=1; break; fi
			printf '.'; sleep 1
		done
		echo
		if [ "$SERVER_READY" -ne 1 ]; then
			echo "FAIL: server did not become ready on http://localhost:3000 (see ../wekan-test-server.log)"
			record FAIL "Server startup"
			record SKIP "Node E2E regressions"
			record SKIP "Playwright Chromium"
		else
			record PASS "Server startup"
			echo
			echo "==> [4/$TOTAL] Node E2E regressions (tests/e2e/list-regressions.js)"
			if meteor npm run test:e2e; then record PASS "Node E2E regressions"; else record FAIL "Node E2E regressions"; fi

			echo
			echo "==> [5/$TOTAL] Playwright Chromium (browser UI specs + REST API specs)"
			ORIG_HOME="$HOME"
			PW_JSON="$ORIG_HOME/repos/wekan/tests/playwright/test-results/all-tests-report.json"
			rm -f "$PW_JSON"
			(
				cd "$ORIG_HOME/repos/wekan/tests/playwright"
				export HOME="$ORIG_HOME/repos/wekan/.tools"
				unset CHROME_DEVEL_SANDBOX
				export PLAYWRIGHT_BROWSERS_PATH="$ORIG_HOME/.var/app/com.visualstudio.code/cache/ms-playwright"
				# Run EVERY spec (no --max-failures), printing each test (list) while
				# also writing a JSON report we parse below for per-test failures.
				export PLAYWRIGHT_JSON_OUTPUT_NAME="test-results/all-tests-report.json"
				PLAYWRIGHT_HTML_OPEN=never meteor npm exec playwright test -- --project=chromium --reporter=list,json
			)
			if [ $? -eq 0 ]; then record PASS "Playwright Chromium"; else record FAIL "Playwright Chromium"; fi

			# Extract per-test stats + failing test details from the JSON report.
			PW_STATS=""
			PW_FAILURES=""
			if [ -f "$PW_JSON" ]; then
				PW_STATS="$(node -e '
					const fs=require("fs");
					let r; try{r=JSON.parse(fs.readFileSync(process.argv[1],"utf8"))}catch(e){process.exit(0)}
					const s=r.stats||{};
					console.log(`${s.expected||0} passed, ${s.unexpected||0} failed, ${s.flaky||0} flaky, ${s.skipped||0} skipped`);
				' "$PW_JSON")"
				PW_FAILURES="$(node -e '
					const fs=require("fs");
					let r; try{r=JSON.parse(fs.readFileSync(process.argv[1],"utf8"))}catch(e){process.exit(0)}
					const out=[];
					function walk(suite, titles){
						const t=[...titles, suite.title].filter(Boolean);
						for(const s of suite.suites||[]) walk(s,t);
						for(const spec of suite.specs||[]){
							if(spec.ok) continue;
							const loc = spec.file ? `${spec.file}:${spec.line}` : "";
							out.push(`${loc} › ${[...t, spec.title].join(" › ")}`);
						}
					}
					for(const s of r.suites||[]) walk(s,[]);
					out.forEach(l=>console.log(l));
				' "$PW_JSON")"
			fi
		fi

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
			status="${line%%|*}"; name="${line#*|}"
			suffix=""
			if [ "$name" = "Playwright Chromium" ] && [ -n "$PW_STATS" ]; then
				suffix="  ($PW_STATS)"
			fi
			printf '  %-6s %s%s\n' "$status" "$name" "$suffix"
			[ "$status" = "FAIL" ] && FAILED=1
		done
		echo "====================================================="
		# Per-test details for any failing Playwright specs.
		if [ -n "$PW_FAILURES" ]; then
			echo
			echo "Failing Playwright tests:"
			while IFS= read -r f; do
				[ -n "$f" ] && printf '  FAIL  %s\n' "$f"
			done <<< "$PW_FAILURES"
			echo "(full output and traces above; HTML report in tests/playwright/playwright-report)"
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
			ORIG_HOME="$HOME"
			cd "$ORIG_HOME/repos/wekan/tests/playwright"
			export HOME="$ORIG_HOME/repos/wekan/.tools"
			unset CHROME_DEVEL_SANDBOX
			export PLAYWRIGHT_BROWSERS_PATH="$ORIG_HOME/.var/app/com.visualstudio.code/cache/ms-playwright"
			export WEKAN_PLAYWRIGHT_ALL=1
			read -p "Install Playwright test dependencies first? [y/N] " INSTALL_DEPS
			case "$INSTALL_DEPS" in
				[Yy]*) meteor npm install ;;
			esac
			meteor npm exec playwright test -- --project=chromium
			break
			;;

    "Test Playwright Firefox")
			ORIG_HOME="$HOME"
			cd "$ORIG_HOME/repos/wekan/tests/playwright"
			export HOME="$ORIG_HOME/repos/wekan/.tools"
			unset CHROME_DEVEL_SANDBOX
			export PLAYWRIGHT_BROWSERS_PATH="$ORIG_HOME/.var/app/com.visualstudio.code/cache/ms-playwright"
			export WEKAN_PLAYWRIGHT_ALL=1
			read -p "Install Playwright test dependencies first? [y/N] " INSTALL_DEPS
			case "$INSTALL_DEPS" in
				[Yy]*) meteor npm install ;;
			esac
			meteor npm exec playwright test -- --project=firefox
			break
			;;

    "Test Playwright Webkit")
			ORIG_HOME="$HOME"
			cd "$ORIG_HOME/repos/wekan/tests/playwright"
			export HOME="$ORIG_HOME/repos/wekan/.tools"
			unset CHROME_DEVEL_SANDBOX
			export PLAYWRIGHT_BROWSERS_PATH="$ORIG_HOME/.var/app/com.visualstudio.code/cache/ms-playwright"
			export WEKAN_PLAYWRIGHT_ALL=1
			read -p "Install Playwright test dependencies first? [y/N] " INSTALL_DEPS
			case "$INSTALL_DEPS" in
				[Yy]*) meteor npm install ;;
			esac
			meteor npm exec playwright test -- --project=webkit
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
