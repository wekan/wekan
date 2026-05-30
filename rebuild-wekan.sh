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
options=("Install WeKan dependencies" "Build WeKan" "Run Meteor for dev on http://localhost:3000" "Run Meteor for dev on http://localhost:3000 with trace warnings, and warnings using old Meteor API that will not exist in Meteor 3.0" "Run Meteor for dev on http://localhost:3000 with bundle visualizer" "Run Meteor for dev on http://CURRENT-IP-ADDRESS:3000" "Run Meteor for dev on http://CURRENT-IP-ADDRESS:3000 with MONGO_URL=mongodb://127.0.0.1:27019/wekan" "Run Meteor for dev on http://CUSTOM-IP-ADDRESS:PORT" "Run tests" "Check floating promises guard (@typescript-eslint/no-floating-promises + auth await scan)" "Save Meteor dependency chain to ../meteor-deps.txt" "Quit")

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
			sudo n 24.15.0
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

    "Run tests")
		echo "Running tests (all existing non-watch tests)."
		FAILED=0
		TEST_SERVER_PID=""

		if curl -fsS http://127.0.0.1:3000 >/dev/null 2>&1; then
			echo "ERROR: Port 3000 is already in use. Stop any running dev server before running option 9."
			echo "SKIP: Run tests aborted to avoid Meteor build-state conflicts."
			break
		fi

		echo "[1/5] Import regression test"
		if node tests/wekanCreator.import.test.js; then
			echo "PASS: tests/wekanCreator.import.test.js"
		else
			echo "FAIL: tests/wekanCreator.import.test.js"
			FAILED=1
		fi

		echo "[2/5] Meteor mocha suite (package.json script: test)"
		if meteor test --once --driver-package meteortesting:mocha --port 3100; then
			echo "PASS: meteor test --once --driver-package meteortesting:mocha --port 3100"
		else
			echo "FAIL: meteor test --once --driver-package meteortesting:mocha --port 3100"
			FAILED=1
		fi

		echo "[3/5] Start temporary Meteor server for browser suites"
		DEFAULT_METEOR_REACTIVITY_ORDER="changeStreams,oplog,polling" DDP_TRANSPORT=uws DEBUG=true WRITABLE_PATH=.. WITH_API=true RICHER_CARD_COMMENT_EDITOR=false ROOT_URL=http://localhost:3000 meteor run --port 3000 > ../wekan-test-server.log 2>&1 &
		TEST_SERVER_PID=$!
		SERVER_READY=0
		for i in $(seq 1 120); do
			if curl -fsS http://127.0.0.1:3000/sign-in >/dev/null 2>&1; then
				SERVER_READY=1
				break
			fi
			sleep 1
		done

		if [ "$SERVER_READY" -ne 1 ]; then
			echo "FAIL: temporary Meteor server did not become ready on http://localhost:3000"
			FAILED=1
		else
			echo "[4/5] Browser suites (E2E + Playwright Chromium)"
			if meteor npm run test:e2e; then
				echo "PASS: meteor npm run test:e2e"
			else
				echo "WARN: meteor npm run test:e2e failed on first attempt, retrying once"
				if meteor npm run test:e2e; then
					echo "PASS: meteor npm run test:e2e (retry)"
				else
					echo "FAIL: meteor npm run test:e2e"
					FAILED=1
				fi
			fi

			if [ -d tests/playwright ]; then
				if PLAYWRIGHT_HTML_OPEN=never meteor npm run test:playwright -- --project=chromium --max-failures=1; then
					echo "PASS: meteor npm run test:playwright -- --project=chromium --max-failures=1"
				else
					echo "FAIL: meteor npm run test:playwright -- --project=chromium --max-failures=1"
					FAILED=1
				fi
			else
				echo "SKIP: tests/playwright directory not found"
			fi
		fi

		if [ -n "$TEST_SERVER_PID" ]; then
			kill "$TEST_SERVER_PID" >/dev/null 2>&1 || true
			wait "$TEST_SERVER_PID" >/dev/null 2>&1 || true
		fi

		echo "[5/5] Legacy comprehensive suite (test-wekan.sh)"
		if [ -f ./test-wekan.sh ]; then
			if bash ./test-wekan.sh; then
				echo "PASS: ./test-wekan.sh"
			else
				echo "FAIL: ./test-wekan.sh"
				FAILED=1
			fi
		else
			echo "SKIP: ./test-wekan.sh not found"
		fi

		if [ "$FAILED" -eq 0 ]; then
			echo "All selected tests passed."
		else
			echo "Some tests failed. See output above."
		fi
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
