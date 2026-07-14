@ECHO OFF
SETLOCAL EnableDelayedExpansion

REM ============================================================================
REM  WeKan rebuild / run / test helper for Windows.
REM  Mirrors the menu of rebuild-wekan.sh so building, running and testing
REM  WeKan works on Windows too.
REM
REM  Notes:
REM   - Run this from the WeKan repo root (this script uses its own folder as
REM     the repo root, so it works regardless of where the repo is cloned).
REM   - Node.js + Meteor must be installed and on PATH (see option 1).
REM   - 'curl' ships with Windows 10 1803+ and is used for server readiness.
REM   - Playwright runs Chromium, Firefox AND WebKit natively on Windows
REM     (unlike Linux arm64, no Docker is needed here).
REM   - If Meteor does not run well natively on your Windows, WSL2 + Ubuntu
REM     with rebuild-wekan.sh is the recommended alternative.
REM ============================================================================

REM --- Repo root = folder of this script (strip trailing backslash) ---
set "REPO=%~dp0"
if "%REPO:~-1%"=="\" set "REPO=%REPO:~0,-1%"
cd /d "%REPO%"

REM Give the Meteor build tool and Node processes a larger heap so long
REM development sessions and test runs don't crash with "FATAL ERROR: ...
REM JavaScript heap out of memory". TOOL_NODE_FLAGS controls the Meteor
REM command-line/build process (the one that hits the limit during
REM `meteor run` / `meteor test` / `meteor build`); NODE_OPTIONS covers the
REM child Node/rspack processes. Both default to 8 GB and honor any value you
REM already set. Lower it if your machine has less RAM.
if not defined TOOL_NODE_FLAGS set "TOOL_NODE_FLAGS=--max-old-space-size=8192"
if not defined NODE_OPTIONS set "NODE_OPTIONS=--max-old-space-size=8192"

REM Every log this script writes goes into ..\log\ (one directory up from the
REM repo). Create it up front so redirections never fail on a missing directory.
if not exist "..\log" md "..\log"

REM --- Platform detection (OS + CPU arch), like detect_platform in the .sh ---
set "PLATFORM_OS=windows"
set "PLATFORM_ARCH=amd64"
if /i "%PROCESSOR_ARCHITECTURE%"=="ARM64" set "PLATFORM_ARCH=arm64"
if /i "%PROCESSOR_ARCHITEW6432%"=="ARM64" set "PLATFORM_ARCH=arm64"
echo Platform: %PLATFORM_OS% %PLATFORM_ARCH%
echo Repo: %REPO%
echo Note: Dev-server console output is also logged to ..\log\wekan-log.log

:menu
echo.
echo ==================== WeKan ( Windows ) ====================
echo   1^) Setup            ^(install dependencies, build^)
echo   2^) Dev server       ^(meteor run variants^)
echo   3^) Tests            ^(mocha, playwright, e2e, ...^)
echo   4^) Docker           ^(start / follow logs / stop^)
echo   5^) Tools            ^(save deps, forge tools, mirror^)
echo   0^) Quit
echo ==========================================================
set "choice="
set /p "choice=Choose a category: "
if "%choice%"=="1" goto menu_setup
if "%choice%"=="2" goto menu_dev
if "%choice%"=="3" goto menu_tests
if "%choice%"=="4" goto menu_docker
if "%choice%"=="5" goto menu_tools
if "%choice%"=="0" goto end
echo invalid option
goto menu

REM ===========================================================================
:menu_setup
echo.
echo -- Setup --   ^(0 = Back^)
echo   1^) Install dependencies
echo   2^) Build WeKan
set "choice="
set /p "choice=Choose: "
if "%choice%"=="1" goto install
if "%choice%"=="2" goto build
if "%choice%"=="0" goto menu
goto menu_setup

REM ===========================================================================
:menu_dev
echo.
echo -- Dev server --   ^(0 = Back^)
echo   1^) localhost:3000
echo   2^) localhost:3000 + trace warnings
echo   3^) localhost:3000 + bundle visualizer
echo   4^) CURRENT-IP:3000
echo   5^) CURRENT-IP:3000 + MONGO_URL 27019
echo   6^) CUSTOM-IP:PORT
echo   7^) Kill all dev servers ^(free ports 3000/3001/3100/3101/4000/4001/8080^)
set "choice="
set /p "choice=Choose: "
if "%choice%"=="1" goto dev_local
if "%choice%"=="2" goto dev_trace
if "%choice%"=="3" goto dev_visualizer
if "%choice%"=="4" goto dev_currentip
if "%choice%"=="5" goto dev_currentip_mongo
if "%choice%"=="6" goto dev_customip
if "%choice%"=="7" goto dev_killall
if "%choice%"=="0" goto menu
goto menu_dev

REM ===========================================================================
:menu_tests
echo.
echo -- Tests --   ^(0 = Back^)
echo   1^) ALL tests, parallel
echo   2^) ALL tests, sequential
echo   3^) Mocha ^(server-side^)
echo   4^) Import regression
echo   5^) Node E2E regressions
echo   6^) Playwright Chromium
echo   7^) Playwright Firefox
echo   8^) Playwright WebKit
echo   9^) Playwright ALL browsers
echo  10^) Floating-promises guard
echo  11^) Count tests by category
set "choice="
set /p "choice=Choose: "
if "%choice%"=="1"  goto test_all_parallel
if "%choice%"=="2"  goto test_all_sequential
if "%choice%"=="3"  goto test_mocha
if "%choice%"=="4"  goto test_import
if "%choice%"=="5"  goto test_e2e
if "%choice%"=="6"  goto test_pw_chromium
if "%choice%"=="7"  goto test_pw_firefox
if "%choice%"=="8"  goto test_pw_webkit
if "%choice%"=="9"  goto test_pw_parallel
if "%choice%"=="10" goto check_floating
if "%choice%"=="11" goto count_tests
if "%choice%"=="0"  goto menu
goto menu_tests

REM ===========================================================================
:menu_tools
echo.
echo -- Tools --   ^(0 = Back^)
echo   1^) Save Meteor deps list
echo   2^) Install forge CLI tools
echo   3^) Mirror repo to forges
set "choice="
set /p "choice=Choose: "
if "%choice%"=="1" goto save_deps
if "%choice%"=="2" goto install_forge_tools
if "%choice%"=="3" goto mirror_forge
if "%choice%"=="0" goto menu
goto menu_tools

REM ===========================================================================
:menu_docker
echo.
echo -- Docker: pick a backend --   ^(0 = Back^)
echo   1^) FerretDB v1 SQLite ^(default^)  ^(docker-compose.yml^)
echo   2^) MongoDB 7                     ^(docker-compose-mongodb-v7.yml^)
echo   3^) FerretDB v2 Postgres          ^(docker-compose-ferretdb-v2-postgresql.yml^)
echo   4^) MongoDB Multitenancy          ^(docker-compose-multitenancy.yml^)
set "choice="
set /p "choice=Backend: "
if "%choice%"=="0" goto menu
set "CF="
if "%choice%"=="1" set "CF=docker-compose.yml"
if "%choice%"=="2" set "CF=docker-compose-mongodb-v7.yml"
if "%choice%"=="3" set "CF=docker-compose-ferretdb-v2-postgresql.yml"
if "%choice%"=="4" set "CF=docker-compose-multitenancy.yml"
if not defined CF goto menu_docker
echo.
echo -- Action --   ^(0 = Back^)
echo   1^) Start ^(up -d^)
echo   2^) Build from source ^& start ^(up -d --build^)
echo   3^) Follow logs ^(logs -f^)
echo   4^) Stop ^(down^)
set "choice="
set /p "choice=Action: "
if "%choice%"=="0" goto menu_docker
if "%choice%"=="2" goto docker_build_start
set "AC="
if "%choice%"=="1" set "AC=up -d"
if "%choice%"=="3" set "AC=logs -f"
if "%choice%"=="4" set "AC=down"
if not defined AC goto menu_docker
echo Running: docker compose -f %CF% %AC%
docker compose -f %CF% %AC%
goto end

:docker_build_start
REM Build the wekan-app image from the LOCAL source (repo Dockerfile) and tag it
REM as the image the compose file references, so the following "up -d" runs your
REM freshly built container instead of a possibly-stale prebuilt one. All WeKan
REM compose files reference ghcr.io/wekan/wekan:latest.
if not exist "%REPO%\Dockerfile" ( echo ERROR: Dockerfile not found in %REPO%. & goto end )
set "WK_IMG=ghcr.io/wekan/wekan:latest"
echo ==^> Building wekan-app image from local source, tagging it as: %WK_IMG%
docker build -t %WK_IMG% -f "%REPO%\Dockerfile" "%REPO%"
if errorlevel 1 ( echo ERROR: Docker build failed. & goto end )
echo Running: docker compose -f %CF% up -d
docker compose -f %CF% up -d
goto end

REM ===========================================================================
:install
echo Installing WeKan dependencies for Windows.
echo This uses Chocolatey to install git, curl, Node.js LTS and MongoDB tools,
echo then installs Meteor via npm.
where choco >nul 2>&1
if errorlevel 1 (
	echo Installing Chocolatey package manager ...
	@"%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -InputFormat None -ExecutionPolicy Bypass -Command "iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))" && SET "PATH=%PATH%;%ALLUSERSPROFILE%\chocolatey\bin"
)
call choco install -y git curl nodejs-lts mongodb-shell
echo Installing Meteor (npm -g install meteor) ...
call npm -g install meteor
echo Done. Open a new terminal so PATH changes take effect, then re-run this script.
goto end

REM ===========================================================================
:build
echo Building WeKan.
REM Also clears the rspack dev-build caches (_build and node_modules\.cache) so the
REM next `meteor run` recompiles from scratch instead of serving stale modules.
if exist "%REPO%\node_modules"        rmdir /s /q "%REPO%\node_modules"
if exist "%REPO%\node_modules\.cache" rmdir /s /q "%REPO%\node_modules\.cache"
if exist "%REPO%\.meteor\local"       rmdir /s /q "%REPO%\.meteor\local"
if exist "%REPO%\.build"              rmdir /s /q "%REPO%\.build"
if exist "%REPO%\_build"              rmdir /s /q "%REPO%\_build"
call meteor update --npm
call meteor npm install
call meteor build .build --directory
echo Done.
goto end

REM ===========================================================================
:dev_local
call :ensure_dirs
call :set_dev_env
set "ROOT_URL=http://localhost:3000"
call :runlog --port 3000
goto end

:dev_trace
call :ensure_dirs
call :set_dev_env
set "WARN_WHEN_USING_OLD_API=true"
set "NODE_OPTIONS=--trace-warnings --max-old-space-size=8192"
set "ROOT_URL=http://localhost:3000"
call :runlog --port 3000
goto end

:dev_visualizer
call :ensure_dirs
call :set_dev_env
set "ROOT_URL=http://localhost:3000"
call :runlog --port 3000 --extra-packages bundle-visualizer --production
goto end

:dev_currentip
call :ensure_dirs
call :detect_ip
echo Your IP address is !IPADDRESS!
call :set_dev_env
set "ROOT_URL=http://!IPADDRESS!:3000"
call :runlog --port 3000
goto end

:dev_currentip_mongo
call :ensure_dirs
call :detect_ip
echo Your IP address is !IPADDRESS!
call :set_dev_env
set "MONGO_URL=mongodb://127.0.0.1:27019/wekan"
set "ROOT_URL=http://!IPADDRESS!:3000"
call :runlog --port 3000
goto end

:dev_customip
call :ensure_dirs
ipconfig
echo From the list above, what is your IP address?
set /p "IPADDRESS=IP address: "
echo On what port would you like to run WeKan?
set /p "PORT=Port: "
echo ROOT_URL=http://%IPADDRESS%:%PORT%
call :set_dev_env
set "ROOT_URL=http://%IPADDRESS%:%PORT%"
call :runlog --port %PORT%
goto end

:dev_killall
call :kill_all_dev_servers
goto end

REM ===========================================================================
:test_all_parallel
echo Running ALL tests against ONE WeKan server on http://localhost:3000 - all jobs run IN PARALLEL (concurrently). Needs plenty of RAM (fine on 32 GB).
echo Two WeKan servers are involved:
echo   :3000  - the PRECOMPILED .build\bundle run as a plain Node server (Meteor's mongod on :3001, db "meteor")
echo            - serves Node E2E + Playwright browser tests. No recompile: your existing build is reused.
echo   :3100  - Mocha via 'meteor test' (its own .meteor\local-test build; the in-process server-side tests
echo            CANNOT run from a production bundle, so this one build is unavoidable).
echo   Import regression is a plain Node script (no server, no MongoDB).
curl -fsS http://127.0.0.1:3000 >nul 2>&1
if not errorlevel 1 (
	echo ERROR: Port 3000 is already in use. Stop any running dev server before running this option.
	goto end
)

set "FAILED=0"
set "S_mocha=RUN" & set "S_import=RUN" & set "S_e2e=RUN" & set "S_browsers=RUN"
set "C_mocha=0" & set "C_import=0" & set "C_e2e=0" & set "C_browsers=0"
REM Each run gets its own ..\log\<timestamp>\ dir (stamped once at run start), so
REM logs are never overwritten and previous runs are kept. PowerShell gives a
REM locale-independent yyyy-MM-dd_HH-mm-ss; %RUN_LOGDIR% is absolute so it works
REM from any job's working directory (e.g. the browser job runs in tests\playwright).
for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format yyyy-MM-dd_HH-mm-ss"') do set "RUN_TS=%%i"
set "RUN_LOGDIR=%REPO%\..\log\%RUN_TS%"
if not exist "%RUN_LOGDIR%" md "%RUN_LOGDIR%"
echo Logs for this run: %RUN_LOGDIR%\  - previous runs are kept
REM Clear completion flags from any previous run.
del /q ".done-mocha" ".done-import" ".done-e2e" ".done-browsers" 2>nul

REM Start the :3000 server FIRST and let it build alone. Mocha runs its own
REM Meteor build (.meteor\local-test); launching it here would make two full
REM builds compete for CPU/disk and starve the server, so it does not become
REM ready until much later (a long line of dots). Mocha and the import
REM regression do not need the server, so we launch them once the server build
REM is underway and they then run in parallel with the E2E and browser jobs.
echo.
call :start_bundle_server

REM Mocha and the import regression do not need the :3000 server; start them now
REM (each in its own minimized window; /D sets the working dir so all paths are
REM relative and space-safe). Each writes a log and, on exit, its return code to
REM .done-<job>, which the poll loop below watches.
echo ==^> Starting Mocha (separate .meteor\local-test build, port 3100) and import regression in parallel.
start "Wekan mocha" /MIN /D "%REPO%" cmd /c "set METEOR_LOCAL_DIR=.meteor\local-test&& (echo ===== Mocha [M2 node:3100 db:3101] test run: %DATE% %TIME% =====) 1>%RUN_LOGDIR%\wekan-alltests-mocha.log 2>&1 & call meteor test --once --driver-package meteortesting:mocha --port 3100 1>>%RUN_LOGDIR%\wekan-alltests-mocha.log 2>&1 & if errorlevel 1 (echo FAIL>.done-mocha) else (echo PASS>.done-mocha)"
start "Wekan import" /MIN /D "%REPO%" cmd /c "(echo ===== Import regression [no server] test run: %DATE% %TIME% =====) 1>%RUN_LOGDIR%\wekan-alltests-import.log 2>&1 & call node tests\wekanCreator.import.test.js 1>>%RUN_LOGDIR%\wekan-alltests-import.log 2>&1 & if errorlevel 1 (echo FAIL>.done-import) else (echo PASS>.done-import)"

if "!SERVER_READY!"=="0" (
	echo FAIL: server did not become ready on http://localhost:3000 ^(see %RUN_LOGDIR%\wekan-test-server.log^)
	set "S_e2e=SKIP" & set "S_browsers=SKIP" & set "FAILED=1"
) else (
	echo ==^> Server is up: starting Node E2E and Playwright ^(Chromium + Firefox + WebKit, --workers=3^) in parallel.
	start "Wekan e2e" /MIN /D "%REPO%" cmd /c "(echo ===== Node E2E [M1 node:3000 db:3001] test run: %DATE% %TIME% =====) 1>%RUN_LOGDIR%\wekan-alltests-e2e.log 2>&1 & call meteor npm run test:e2e 1>>%RUN_LOGDIR%\wekan-alltests-e2e.log 2>&1 & if errorlevel 1 (echo FAIL>.done-e2e) else (echo PASS>.done-e2e)"
	start "Wekan browsers" /MIN /D "%REPO%\tests\playwright" cmd /c "set WEKAN_PLAYWRIGHT_ALL=1&& (echo ===== Playwright browsers [M1 node:3000 db:3001] test run: %DATE% %TIME% =====) 1>%RUN_LOGDIR%\wekan-alltests-browsers.log 2>&1 & call meteor npm exec playwright test -- --project=chromium --project=firefox --project=webkit --workers=3 --reporter=list 1>>%RUN_LOGDIR%\wekan-alltests-browsers.log 2>&1 & if errorlevel 1 (echo FAIL>..\..\.done-browsers) else (echo PASS>..\..\.done-browsers)"
)

REM Live progress: re-print a status line every ~3s until all expected jobs
REM have written their .done flag (cmd has no native wait).
echo Live progress (refreshes every few seconds) - RUN / PASS / FAIL per job:
:wait_all
call :jstate mocha
call :jstate import
call :jcount C_mocha check "%RUN_LOGDIR%\wekan-alltests-mocha.log"
call :jcount C_import check "%RUN_LOGDIR%\wekan-alltests-import.log"
if "!SERVER_READY!"=="1" (
	call :jstate e2e
	call :jstate browsers
	call :jcount C_e2e e2e "%RUN_LOGDIR%\wekan-alltests-e2e.log"
	call :jcount C_browsers check "%RUN_LOGDIR%\wekan-alltests-browsers.log"
)
echo   mocha [M2 :3100/db:3101] !S_mocha! tests:!C_mocha!  ^| import [no server] !S_import! tests:!C_import!  ^| e2e [M1 :3000/db:3001] !S_e2e! tests:!C_e2e!  ^| browsers [M1 :3000/db:3001] !S_browsers! tests:!C_browsers!
set "ALLDONE=1"
if not exist ".done-mocha" set "ALLDONE=0"
if not exist ".done-import" set "ALLDONE=0"
if "!SERVER_READY!"=="1" (
	if not exist ".done-e2e" set "ALLDONE=0"
	if not exist ".done-browsers" set "ALLDONE=0"
)
if "!ALLDONE!"=="0" (
	ping -n 4 127.0.0.1 >nul
	goto wait_all
)

echo.
echo Stopping WeKan test server (bundle node :3000).
taskkill /FI "WINDOWTITLE eq WekanTestServer*" /T /F >nul 2>&1
if "!MONGOD_STARTED!"=="1" ( echo Stopping test MongoDB ^(mongod :3001^). & taskkill /FI "WINDOWTITLE eq WekanTestMongo*" /T /F >nul 2>&1 )

REM Final pass/fail per job (RUN means it never wrote a flag = treat as FAIL).
if "!S_mocha!"=="FAIL" set "FAILED=1"
if "!S_import!"=="FAIL" set "FAILED=1"
if "!S_e2e!"=="FAIL" set "FAILED=1"
if "!S_browsers!"=="FAIL" set "FAILED=1"

echo.
echo ==================== TEST SUMMARY ====================
call :report "!S_mocha!"     "Mocha (server-side)"                  "[M2 :3100/db:3101] tests:!C_mocha!"
call :report "!S_import!"    "Import regression"                    "[no server]        tests:!C_import!"
if "!SERVER_READY!"=="1" ( call :report "PASS" "Server startup" "[M1 :3000/db:3001]" ) else ( call :report "FAIL" "Server startup" "[M1 :3000/db:3001]" )
call :report "!S_e2e!"       "Node E2E regressions"                 "[M1 :3000/db:3001] tests:!C_e2e!"
call :report "!S_browsers!"  "Playwright (Chromium+Firefox+WebKit)" "[M1 :3000/db:3001] tests:!C_browsers!"
echo =====================================================
echo (per-job logs in: %RUN_LOGDIR%\  as wekan-alltests-^<mocha^|import^|e2e^|browsers^>.log and wekan-test-server.log)
if "!FAILED!"=="0" ( echo RESULT: All tests passed. ) else ( echo RESULT: Some tests FAILED ^(see details above^). )
goto end

REM ===========================================================================
:test_all_sequential
echo Running ALL tests against ONE WeKan server on http://localhost:3000 - all jobs run SEQUENTIALLY (one at a time).
echo Two WeKan servers are involved (they do NOT run tests in parallel; the suites run one at a time):
echo   :3000  - the PRECOMPILED .build\bundle run as a plain Node server (Meteor's mongod on :3001, db "meteor")
echo            - serves Node E2E + Playwright browser tests. No recompile: your existing build is reused.
echo   :3100  - Mocha via 'meteor test' (its own .meteor\local-test build; the in-process server-side tests
echo            CANNOT run from a production bundle, so this one build is unavoidable).
echo   Import regression is a plain Node script (no server, no MongoDB).
curl -fsS http://127.0.0.1:3000 >nul 2>&1
if not errorlevel 1 (
	echo ERROR: Port 3000 is already in use. Stop any running dev server before running this option.
	goto end
)

set "FAILED=0"
set "S_mocha=RUN" & set "S_import=RUN" & set "S_e2e=RUN" & set "S_browsers=RUN"
set "C_mocha=0" & set "C_import=0" & set "C_e2e=0" & set "C_browsers=0"
REM Each run gets its own ..\log\<timestamp>\ dir (stamped once at run start), so
REM logs are never overwritten and previous runs are kept. PowerShell gives a
REM locale-independent yyyy-MM-dd_HH-mm-ss; %RUN_LOGDIR% is absolute so it works
REM from any job's working directory (e.g. the browser job runs in tests\playwright).
for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format yyyy-MM-dd_HH-mm-ss"') do set "RUN_TS=%%i"
set "RUN_LOGDIR=%REPO%\..\log\%RUN_TS%"
if not exist "%RUN_LOGDIR%" md "%RUN_LOGDIR%"
echo Logs for this run: %RUN_LOGDIR%\  - previous runs are kept
REM Clear completion flags from any previous run.
del /q ".done-mocha" ".done-import" ".done-e2e" ".done-browsers" 2>nul

REM Start the :3000 server FIRST and let it build alone. Mocha runs its own
REM Meteor build (.meteor\local-test); launching it here would make two full
REM builds compete for CPU/disk and starve the server, so it does not become
REM ready until much later (a long line of dots). Once the server is ready the
REM test jobs run one at a time (sequentially), not in parallel.
echo.
call :start_bundle_server

REM Run each test job to completion, ONE AT A TIME (sequential, not in parallel),
REM so the combined run does not exhaust RAM/swap and crash the machine. Mocha
REM and the import regression do not need the :3000 server; E2E and the browser
REM suites do. The browser suite runs all three browsers with --workers=1, i.e.
REM one browser at a time.
REM Each job runs in its own minimized window (same proven start-commands as the
REM parallel mode, writing a .done-<key> flag on exit) but ONE AT A TIME: after
REM starting a job we poll :seq_run_wait, which prints a live pass counter every
REM few seconds until that job's .done flag appears, before starting the next.
REM cd to the repo so the relative .done-<key> flag checks resolve here.
cd /d "%REPO%"

echo ==^> Running Mocha on Meteor #2 [Node.js :3100, MongoDB :3101] (separate .meteor\local-test build). Full log: %RUN_LOGDIR%\wekan-alltests-mocha.log
start "Wekan mocha" /MIN /D "%REPO%" cmd /c "set METEOR_LOCAL_DIR=.meteor\local-test&& (echo ===== Mocha [M2 node:3100 db:3101] test run: %DATE% %TIME% =====) 1>%RUN_LOGDIR%\wekan-alltests-mocha.log 2>&1 & call meteor test --once --driver-package meteortesting:mocha --port 3100 1>>%RUN_LOGDIR%\wekan-alltests-mocha.log 2>&1 & if errorlevel 1 (echo FAIL>.done-mocha) else (echo PASS>.done-mocha)"
call :seq_run_wait mocha check C_mocha "%RUN_LOGDIR%\wekan-alltests-mocha.log"

echo ==^> Running import regression [plain Node, no Meteor / no MongoDB]. Full log: %RUN_LOGDIR%\wekan-alltests-import.log
start "Wekan import" /MIN /D "%REPO%" cmd /c "(echo ===== Import regression [no server] test run: %DATE% %TIME% =====) 1>%RUN_LOGDIR%\wekan-alltests-import.log 2>&1 & call node tests\wekanCreator.import.test.js 1>>%RUN_LOGDIR%\wekan-alltests-import.log 2>&1 & if errorlevel 1 (echo FAIL>.done-import) else (echo PASS>.done-import)"
call :seq_run_wait import check C_import "%RUN_LOGDIR%\wekan-alltests-import.log"

if "!SERVER_READY!"=="0" goto skip_server_jobs
echo ==^> Running Node E2E regressions on Meteor #1 [Node.js :3000, MongoDB :3001]. Full log: %RUN_LOGDIR%\wekan-alltests-e2e.log
start "Wekan e2e" /MIN /D "%REPO%" cmd /c "(echo ===== Node E2E [M1 node:3000 db:3001] test run: %DATE% %TIME% =====) 1>%RUN_LOGDIR%\wekan-alltests-e2e.log 2>&1 & call meteor npm run test:e2e 1>>%RUN_LOGDIR%\wekan-alltests-e2e.log 2>&1 & if errorlevel 1 (echo FAIL>.done-e2e) else (echo PASS>.done-e2e)"
call :seq_run_wait e2e e2e C_e2e "%RUN_LOGDIR%\wekan-alltests-e2e.log"

echo ==^> Running Playwright Chromium, Firefox and WebKit one at a time ^(--workers=1^) on Meteor #1 [Node.js :3000, MongoDB :3001]. Full log: %RUN_LOGDIR%\wekan-alltests-browsers.log
start "Wekan browsers" /MIN /D "%REPO%\tests\playwright" cmd /c "set WEKAN_PLAYWRIGHT_ALL=1&& (echo ===== Playwright browsers [M1 node:3000 db:3001] test run: %DATE% %TIME% =====) 1>%RUN_LOGDIR%\wekan-alltests-browsers.log 2>&1 & call meteor npm exec playwright test -- --project=chromium --project=firefox --project=webkit --workers=1 --reporter=list 1>>%RUN_LOGDIR%\wekan-alltests-browsers.log 2>&1 & if errorlevel 1 (echo FAIL>..\..\.done-browsers) else (echo PASS>..\..\.done-browsers)"
call :seq_run_wait browsers check C_browsers "%RUN_LOGDIR%\wekan-alltests-browsers.log"
goto server_jobs_done

:skip_server_jobs
echo FAIL: server did not become ready on http://localhost:3000 ^(see %RUN_LOGDIR%\wekan-test-server.log^)
set "S_e2e=SKIP" & set "S_browsers=SKIP" & set "FAILED=1"

:server_jobs_done

echo.
echo Stopping WeKan test server (bundle node :3000).
taskkill /FI "WINDOWTITLE eq WekanTestServer*" /T /F >nul 2>&1
if "!MONGOD_STARTED!"=="1" ( echo Stopping test MongoDB ^(mongod :3001^). & taskkill /FI "WINDOWTITLE eq WekanTestMongo*" /T /F >nul 2>&1 )

REM Final pass/fail per job (RUN means it never wrote a flag = treat as FAIL).
if "!S_mocha!"=="FAIL" set "FAILED=1"
if "!S_import!"=="FAIL" set "FAILED=1"
if "!S_e2e!"=="FAIL" set "FAILED=1"
if "!S_browsers!"=="FAIL" set "FAILED=1"

REM Count passing tests per job from each log (advances shown in the summary).
call :jcount C_mocha check "%RUN_LOGDIR%\wekan-alltests-mocha.log"
call :jcount C_import check "%RUN_LOGDIR%\wekan-alltests-import.log"
call :jcount C_e2e e2e "%RUN_LOGDIR%\wekan-alltests-e2e.log"
call :jcount C_browsers check "%RUN_LOGDIR%\wekan-alltests-browsers.log"

echo.
echo ==================== TEST SUMMARY ====================
call :report "!S_mocha!"     "Mocha (server-side)"                  "[M2 :3100/db:3101] tests:!C_mocha!"
call :report "!S_import!"    "Import regression"                    "[no server]        tests:!C_import!"
if "!SERVER_READY!"=="1" ( call :report "PASS" "Server startup" "[M1 :3000/db:3001]" ) else ( call :report "FAIL" "Server startup" "[M1 :3000/db:3001]" )
call :report "!S_e2e!"       "Node E2E regressions"                 "[M1 :3000/db:3001] tests:!C_e2e!"
call :report "!S_browsers!"  "Playwright (Chromium+Firefox+WebKit)" "[M1 :3000/db:3001] tests:!C_browsers!"
echo =====================================================
echo (per-job logs in: %RUN_LOGDIR%\  as wekan-alltests-^<mocha^|import^|e2e^|browsers^>.log and wekan-test-server.log)
if "!FAILED!"=="0" ( echo RESULT: All tests passed. ) else ( echo RESULT: Some tests FAILED ^(see details above^). )
goto end

REM ===========================================================================
:test_mocha
echo Running Mocha tests: meteor test --once --driver-package meteortesting:mocha --port 3100
echo (server-side unit/security/API-logic tests; browser/client tests are covered by Playwright options)
call meteor test --once --driver-package meteortesting:mocha --port 3100
goto end

:test_import
echo Running import regression test (node, no server needed).
call node tests\wekanCreator.import.test.js
goto end

:test_e2e
echo Running Node E2E regressions (puppeteer).
echo NOTE: needs a WeKan server with WITH_API=true on http://localhost:3000.
echo       Start one with menu option 3 first, or use the Run ALL tests option.
call meteor npm run test:e2e
goto end

:test_pw_chromium
set "PW_PROJECT=chromium"
goto pw_single

:test_pw_firefox
set "PW_PROJECT=firefox"
goto pw_single

:test_pw_webkit
set "PW_PROJECT=webkit"
goto pw_single

:pw_single
echo Running Playwright %PW_PROJECT% tests.
echo NOTE: needs a WeKan server running on http://localhost:3000 (menu option 3, or 'Run ALL tests').
cd /d "%REPO%\tests\playwright"
set "WEKAN_PLAYWRIGHT_ALL=1"
set "INSTALL_DEPS="
set /p "INSTALL_DEPS=Install Playwright test dependencies and browsers first? [y/N] "
if /i "%INSTALL_DEPS%"=="y" (
	call meteor npm install
	call meteor npm exec playwright install %PW_PROJECT%
)
call meteor npm exec playwright test -- --project=%PW_PROJECT%
goto end

REM ===========================================================================
:test_pw_parallel
echo Running Chromium, Firefox and WebKit Playwright suites sequentially (one browser at a time).
echo NOTE: needs a WeKan server already running on http://localhost:3000 (menu option 3).
curl -fsS http://127.0.0.1:3000/sign-in >nul 2>&1
if errorlevel 1 (
	echo ERROR: WeKan does not appear to be running on http://localhost:3000.
	echo        Start it first with menu option 3, then re-run this option.
	goto end
)

set "INSTALL_DEPS="
set /p "INSTALL_DEPS=Install Playwright test dependencies and browsers first? [y/N] "
if /i "%INSTALL_DEPS%"=="y" (
	pushd "%REPO%\tests\playwright"
	call meteor npm install
	call meteor npm exec playwright install
	popd
)

REM All three browsers run natively on Windows. Use --workers=1 so a single
REM Playwright run executes Chromium, Firefox and WebKit tests one at a time
REM (sequentially) rather than concurrently: running all three at once uses too
REM much RAM/swap and can crash the machine. WEKAN_PLAYWRIGHT_ALL=1 enables all
REM projects.
cd /d "%REPO%\tests\playwright"
set "WEKAN_PLAYWRIGHT_ALL=1"
call meteor npm exec playwright test -- --project=chromium --project=firefox --project=webkit --workers=1 --reporter=list
if errorlevel 1 ( echo RESULT: Some Playwright browsers FAILED ^(see details above^). ) else ( echo RESULT: All Playwright browsers passed. )
goto end

REM ===========================================================================
:check_floating
echo Ensuring missing ESLint dependencies for the no-floating-promises rule.
set "INSTALL_ESLINT="
set /p "INSTALL_ESLINT=Install @typescript-eslint eslint-plugin + parser (devDeps) now? [y/N] "
if /i "%INSTALL_ESLINT%"=="y" call meteor npm install --save-dev @typescript-eslint/eslint-plugin @typescript-eslint/parser

echo Ensuring .eslintrc.json includes @typescript-eslint plugin and no-floating-promises rule
node -e "const fs=require('fs');const p='.eslintrc.json';const c=JSON.parse(fs.readFileSync(p,'utf8'));c.plugins=Array.isArray(c.plugins)?c.plugins:[];if(!c.plugins.includes('@typescript-eslint'))c.plugins.push('@typescript-eslint');c.rules=c.rules||{};c.rules['@typescript-eslint/no-floating-promises']='error';fs.writeFileSync(p,JSON.stringify(c,null,2)+'\n');"

echo Checking whether @typescript-eslint/no-floating-promises is configured in .eslintrc.json
findstr /c:"@typescript-eslint/no-floating-promises" .eslintrc.json >nul 2>&1
if errorlevel 1 (
	echo WARNING: Rule @typescript-eslint/no-floating-promises is NOT configured in .eslintrc.json
) else (
	echo OK: Rule @typescript-eslint/no-floating-promises is configured in .eslintrc.json
)

echo.
echo Scanning for unawaited Authentication.checkBoardAccess/checkBoardWriteAccess in server\models
node -e "const fs=require('fs'),path=require('path');function walk(d,acc){for(const e of fs.readdirSync(d,{withFileTypes:true})){const fp=path.join(d,e.name);if(e.isDirectory())walk(fp,acc);else if(/\.js$/.test(e.name))acc.push(fp);}return acc;}let found=false;for(const f of walk('server/models',[])){const lines=fs.readFileSync(f,'utf8').split(/\r?\n/);lines.forEach((ln,i)=>{if(/Authentication\.checkBoard(Access|WriteAccess)\(/.test(ln)&&!/await Authentication\.checkBoard/.test(ln)){found=true;console.log(f+':'+(i+1)+': '+ln.trim());}});}console.log(found?'WARNING: Found possible unawaited board auth checks above':'OK: No unawaited board auth checks found');"
goto end

REM ===========================================================================
:save_deps
call meteor list --tree > ..\meteor-deps.txt
echo Saved Meteor dependency chain to ..\meteor-deps.txt
goto end

REM ===========================================================================
:install_forge_tools
echo.
echo Installing gh-like forge CLIs: gh, glab, tea, git-bug, forge ^(git-pkgs/forge^).
echo Already-installed tools are skipped.
set "HASWINGET="
set "HASGO="
where /q winget && set "HASWINGET=1"
where /q go && set "HASGO=1"

where /q gh
if %errorlevel%==0 (
	echo OK: gh present
) else (
	if defined HASWINGET ( winget install --id GitHub.cli -e --source winget ) else ( echo Install gh manually: https://github.com/cli/cli#installation )
)
where /q glab
if %errorlevel%==0 (
	echo OK: glab present
) else (
	if defined HASWINGET ( winget install --id GLab.GLab -e --source winget ) else ( echo Install glab manually: https://gitlab.com/gitlab-org/cli#installation )
)
where /q tea
if %errorlevel%==0 (
	echo OK: tea present
) else (
	if defined HASGO ( go install code.gitea.io/tea@latest ) else ( echo Install tea manually: https://gitea.com/gitea/tea/releases )
)
where /q git-bug
if %errorlevel%==0 (
	echo OK: git-bug present
) else (
	if defined HASGO ( go install github.com/git-bug/git-bug@latest ) else ( echo Install git-bug manually: https://github.com/git-bug/git-bug/releases )
)
where /q forge
if %errorlevel%==0 (
	echo OK: forge present
) else (
	if defined HASGO ( go install github.com/git-pkgs/forge@latest ) else ( echo Install forge manually ^(needs Go^): https://github.com/git-pkgs/forge )
)
echo.
echo Authenticate before mirroring: gh auth login ^| glab auth login ^| tea login add
if defined HASGO echo Note: Go tools install to %%GOPATH%%\bin - ensure it is on your PATH.
goto end

REM ===========================================================================
:mirror_forge
echo.
echo Mirror a repository between forges ^(code + issues + PRs + Actions^).
echo Forges:
echo   1^) GitHub
echo   2^) GitLab
echo   3^) Codeberg
echo   4^) Forgejo ^(self-hosted^)
echo   5^) Gitea ^(self-hosted^)
echo.
set "SRC="
set "TGT="
set /p "FORGESEL=Enter SOURCE and TARGET numbers, e.g. 1 3 (GitHub -> Codeberg): "
for /f "tokens=1,2" %%a in ("%FORGESEL%") do ( set "SRC=%%a" & set "TGT=%%b" )
call :forge_props "%SRC%" S
if not defined SNAME ( echo Invalid source number. & goto end )
call :forge_props "%TGT%" T
if not defined TNAME ( echo Invalid target number. & goto end )
if "%SRC%"=="%TGT%" ( echo Source and target must differ. & goto end )
echo Source: %SNAME%   -^>   Target: %TNAME%
if not "%STOOL%"=="gh" echo NOTE: automated issue/PR sync supports GitHub as SOURCE only; code + CI conversion still work.
set /p "SREPO=Source repo (owner/name): "
set /p "TREPO=Target repo (owner/name): "
if "%SREPO%"=="" ( echo Both repos are required. & goto end )
if "%TREPO%"=="" ( echo Both repos are required. & goto end )
if not defined SHOST set /p "SHOST=Source host (e.g. git.example.com): "
if not defined THOST set /p "THOST=Target host (e.g. git.example.com): "

set /p "DOCODE=Mirror code (all branches/tags) with git push --mirror? [y/N] "
if /i not "%DOCODE%"=="y" goto forge_extras
set "FWORK=%TEMP%\wekan-mirror-%RANDOM%"
echo Cloning https://%SHOST%/%SREPO%.git (mirror) ...
git clone --mirror "https://%SHOST%/%SREPO%.git" "%FWORK%\repo.git"
echo Pushing to https://%THOST%/%TREPO%.git (target must exist; push credentials required) ...
pushd "%FWORK%\repo.git"
git push --mirror "https://%THOST%/%TREPO%.git"
popd
rmdir /s /q "%FWORK%"

:forge_extras
echo.
echo Now syncing issues + PRs (missing only) and converting CI workflows (DRY RUN)...
node "%REPO%\tools\forge-mirror.js" --source-tool %STOOL% --source-repo "%SREPO%" --source-host "%SHOST%" --target-tool %TTOOL% --target-repo "%TREPO%" --target-host "%THOST%" --target-kind %TKIND% --include-closed
echo.
set /p "APPLYNOW=Apply the issue/PR creation at the target now (not a dry run)? [y/N] "
if /i "%APPLYNOW%"=="y" node "%REPO%\tools\forge-mirror.js" --source-tool %STOOL% --source-repo "%SREPO%" --source-host "%SHOST%" --target-tool %TTOOL% --target-repo "%TREPO%" --target-host "%THOST%" --target-kind %TKIND% --include-closed --issues --prs --apply
echo Mirror flow complete.
goto end

REM ===========================================================================
REM  Subroutines
REM ===========================================================================
:forge_props
REM %1 = forge number, %2 = output prefix (S or T).
REM Sets <prefix>NAME <prefix>HOST <prefix>TOOL <prefix>KIND. HOST empty = ask.
set "_n=%~1"
set "%2NAME="
set "%2HOST="
if "%_n%"=="1" ( set "%2NAME=GitHub"   & set "%2HOST=github.com"   & set "%2TOOL=gh"   & set "%2KIND=github" )
if "%_n%"=="2" ( set "%2NAME=GitLab"   & set "%2HOST=gitlab.com"   & set "%2TOOL=glab" & set "%2KIND=gitlab" )
if "%_n%"=="3" ( set "%2NAME=Codeberg" & set "%2HOST=codeberg.org" & set "%2TOOL=tea"  & set "%2KIND=codeberg" )
if "%_n%"=="4" ( set "%2NAME=Forgejo"  & set "%2HOST="             & set "%2TOOL=tea"  & set "%2KIND=forgejo" )
if "%_n%"=="5" ( set "%2NAME=Gitea"    & set "%2HOST="             & set "%2TOOL=tea"  & set "%2KIND=gitea" )
exit /b 0

:ensure_dirs
if not exist "%REPO%\public\build-chunks" md "%REPO%\public\build-chunks"
if not exist "%REPO%\public\build-assets" md "%REPO%\public\build-assets"
exit /b 0

:set_dev_env
REM Common dev-server environment (caller sets ROOT_URL afterwards).
set "DEFAULT_METEOR_REACTIVITY_ORDER=changeStreams,oplog,polling"
set "DDP_TRANSPORT=uws"
set "DEBUG=true"
set "WRITABLE_PATH=.."
set "WITH_API=true"
set "RICHER_CARD_COMMENT_EDITOR=false"
exit /b 0

:runlog
REM Run "meteor run <args>" showing output live AND copying it to
REM ..\log\wekan-log.log - the Windows equivalent of the .sh's
REM "meteor run ... 2>&1 | tee ../log/wekan-log.log". cmd has no built-in tee,
REM so pipe through PowerShell's Tee-Object. %* = all args forwarded to meteor.
REM Note: PowerShell buffers the pipeline, so console output can appear in
REM bursts; the full stream is always captured in the log file.
REM Callers always pass "--port <PORT>" first, so %2 is the port: kill any
REM Meteor dev server already listening there before starting a new one.
call :kill_meteor_on_port %2
if errorlevel 1 exit /b 1
if not exist "..\log" md "..\log"
call meteor run %* 2>&1 | powershell -NoProfile -Command "$input | Tee-Object -FilePath '..\log\wekan-log.log'"
exit /b 0

:kill_meteor_on_port
REM %1 = app port. Frees BOTH the app port and the rspack dev-server port (8080),
REM because "meteor run" starts an rspack dev server on 8080 (rspack.config.js:
REM Meteor.devServerPort || 8080) that can outlive the meteor parent and would
REM make the new server fail with "EADDRINUSE ... :8080". Returns 1 if a port
REM could not be freed, 0 otherwise (including when neither was in use).
set "APPPORT=%~1"
if "%APPPORT%"=="" exit /b 0
if not defined RSPACK_DEV_PORT set "RSPACK_DEV_PORT=8080"
call :port_in_use %APPPORT%
set "PIU_APP=%ERRORLEVEL%"
call :port_in_use %RSPACK_DEV_PORT%
set "PIU_RS=%ERRORLEVEL%"
if "%PIU_APP%"=="1" if "%PIU_RS%"=="1" exit /b 0
echo ==^> A Meteor dev server is already running ^(app port %APPPORT%, rspack dev-server port %RSPACK_DEV_PORT%^); stopping it before starting a new one.
call :free_port %APPPORT%
call :free_port %RSPACK_DEV_PORT%
REM Wait for both ports to be released (up to ~15s).
for /l %%i in (1,1,15) do (
	call :port_in_use %APPPORT%
	set "PIU_APP=!ERRORLEVEL!"
	call :port_in_use %RSPACK_DEV_PORT%
	set "PIU_RS=!ERRORLEVEL!"
	if "!PIU_APP!"=="1" if "!PIU_RS!"=="1" goto :kmop_free
	>nul ping -n 2 127.0.0.1
	call :free_port %APPPORT%
	call :free_port %RSPACK_DEV_PORT%
)
:kmop_free
call :port_in_use %APPPORT%
if not errorlevel 1 (
	echo ERROR: Port %APPPORT% is still in use after attempting to stop the existing server. Stop it manually and retry.
	exit /b 1
)
call :port_in_use %RSPACK_DEV_PORT%
if not errorlevel 1 (
	echo ERROR: Port %RSPACK_DEV_PORT% is still in use after attempting to stop the existing server. Stop it manually and retry.
	exit /b 1
)
echo     Ports %APPPORT% and %RSPACK_DEV_PORT% are now free.
exit /b 0

:port_in_use
REM %1 = port. Returns errorlevel 0 if something is LISTENING on that TCP port,
REM else 1. Checks the socket directly (netstat), so it also detects a server
REM that is still building and not yet answering HTTP.
netstat -ano | findstr /r /c:":%~1 .*LISTENING" >nul 2>&1
exit /b %ERRORLEVEL%

:free_port
REM %1 = port. Kill whatever is LISTENING on that TCP port (and its process tree).
for /f "tokens=5" %%p in ('netstat -ano ^| findstr /r /c:":%~1 .*LISTENING"') do taskkill /F /T /PID %%p >nul 2>&1
exit /b 0

:kill_all_dev_servers
REM Kill every dev/test server this script can start, freeing all dev/test ports
REM at once: the dev app (3000) + its Mongo (3001), the Mocha test server (3100)
REM + its Mongo (3101), a Sandstorm standalone dev server (4000) + its Mongo
REM (4001), and the rspack dev server (8080). Used by the "Kill all dev servers"
REM menu option.
set "DEV_SERVER_PORTS=3000 3001 3100 3101 4000 4001 8080"
echo ==^> Killing any dev/test servers on ports: %DEV_SERVER_PORTS%
REM Best-effort by image name; the per-port free below does the real work and is
REM narrow enough not to touch unrelated Node apps.
taskkill /F /IM meteor.exe /T >nul 2>&1
taskkill /F /IM mongod.exe /T >nul 2>&1
for %%p in (%DEV_SERVER_PORTS%) do call :free_port %%p
REM Wait for the ports to free (up to ~10s).
for /l %%i in (1,1,10) do (
	set "ANY=0"
	for %%p in (%DEV_SERVER_PORTS%) do ( call :port_in_use %%p & if not errorlevel 1 set "ANY=1" )
	if "!ANY!"=="0" goto :kads_done
	>nul ping -n 2 127.0.0.1
	for %%p in (%DEV_SERVER_PORTS%) do call :free_port %%p
)
:kads_done
set "STUCK="
for %%p in (%DEV_SERVER_PORTS%) do ( call :port_in_use %%p & if not errorlevel 1 set "STUCK=!STUCK! %%p" )
if defined STUCK (
	echo     WARNING: still in use after trying to stop them:!STUCK!
) else (
	echo     All dev server ports are now free: %DEV_SERVER_PORTS%
)
exit /b 0

:detect_ip
REM Best-effort: first IPv4 address from ipconfig.
set "IPADDRESS="
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
	if not defined IPADDRESS set "IPADDRESS=%%a"
)
set "IPADDRESS=%IPADDRESS: =%"
exit /b 0

:run_pw_all
REM %1 = project. WebKit runs natively on Windows (no Docker needed).
pushd "%REPO%\tests\playwright"
set "WEKAN_PLAYWRIGHT_ALL=1"
call meteor npm exec playwright test -- --project=%1 --reporter=list
set "RC=%ERRORLEVEL%"
popd
exit /b %RC%

:report
REM %1 = status (PASS/FAIL/SKIP or empty), %2 = name, %3 = extra (port/tests, optional)
set "ST=%~1"
if "%ST%"=="" set "ST=----"
echo   %ST%   %~2   %~3
exit /b 0

:jstate
REM %1 = job key. Sets S_<key> to RUN / PASS / FAIL from .done-<key>.
REM Called repeatedly by the :test_all poll loop and once more for the summary.
if not exist ".done-%1" ( set "S_%1=RUN" & exit /b 0 )
set /p "S_%1="<".done-%1"
exit /b 0

:jcount
REM %1 = output var name, %2 = kind (check|e2e), %3 = log file.
REM Counts passing tests in the log and stores the number in the named var:
REM   check -> U+2713 marks (Playwright list, Mocha spec, import assertions)
REM   e2e   -> "[wekan-e2e] ..." step lines from the Node E2E harness.
REM Uses node (always present here) so Unicode counting is reliable on cmd.
if not exist "%~3" ( set "%~1=0" & exit /b 0 )
if /i "%~2"=="e2e" goto jcount_e2e
for /f "usebackq delims=" %%n in (`node -e "let n=0;try{n=(require('fs').readFileSync(process.argv[1],'utf8').match(/\u2713/g)||[]).length}catch(e){}process.stdout.write(String(n))" "%~3"`) do set "%~1=%%n"
exit /b 0
:jcount_e2e
for /f "usebackq delims=" %%n in (`node -e "let n=0;try{n=(require('fs').readFileSync(process.argv[1],'utf8').match(/\[wekan-e2e\]/g)||[]).length}catch(e){}process.stdout.write(String(n))" "%~3"`) do set "%~1=%%n"
exit /b 0

:wait_server_ready
REM Poll http://localhost:3000 until the precompiled bundle server answers. It boots
REM in seconds (no build), so this is usually quick; print a check counter now and then
REM and point at the live server log. Sets SERVER_READY=1 as soon as :3000 answers.
REM IMPORTANT: use a curl timeout so a slow boot never blocks the loop
REM (--connect-timeout/--max-time make each poll return quickly; ~240 polls ~= 20 min).
set "SERVER_READY=0"
echo ==^> Waiting for the WeKan test server on http://localhost:3000 ^(precompiled bundle boots in seconds^) ...
echo     ^(live server log: type "%RUN_LOGDIR%\wekan-test-server.log" in another window^)
for /l %%i in (1,1,240) do (
	if "!SERVER_READY!"=="0" (
		curl -fsS --connect-timeout 2 --max-time 4 http://127.0.0.1:3000/sign-in >nul 2>&1 && set "SERVER_READY=1"
		if "!SERVER_READY!"=="0" (
			set /a "_mod=%%i %% 6"
			if "!_mod!"=="0" ( echo     ... still waiting ^(check %%i^); see the server log for details )
			ping -n 2 127.0.0.1 >nul
		)
	)
)
echo.
if "!SERVER_READY!"=="1" echo ==^> WeKan test server is ready on http://localhost:3000 ^(precompiled bundle, no rebuild^).
exit /b 0

:start_bundle_server
REM Parity with rebuild-wekan.sh: run the :3000 test server from the PRECOMPILED
REM .build\bundle (NOT `meteor run`), so Node E2E + Playwright reuse the WeKan you
REM already built with `meteor build .build --directory` - no recompile. The bundle is
REM a plain Node server, so it needs its own MongoDB (Meteor's bundled mongod on :3001,
REM db name "meteor" to match what the tests seed) and its server npm deps installed
REM once. Mocha still uses `meteor test` (its own build) - it cannot run from a bundle.
REM Sets SERVER_READY (via :wait_server_ready) and MONGOD_STARTED (1 if this run started
REM the mongod, so the caller only stops one it started).
set "SERVER_READY=0"
set "MONGOD_STARTED=0"

REM 1) Ensure the bundle exists; build it once if missing.
if not exist "%REPO%\.build\bundle\main.js" (
	echo ==^> .build\bundle not found - building the WeKan bundle first ^(meteor build .build --directory^)...
	pushd "%REPO%"
	call meteor npm install
	call meteor build .build --directory
	popd
)
if not exist "%REPO%\.build\bundle\main.js" (
	echo ERROR: .build\bundle\main.js is still missing after building. Aborting.
	exit /b 1
)

REM 2) Resolve Meteor's bundled node (run the bundle with the node its native modules
REM    were built against) and the sibling mongod under the same dev_bundle.
set "NODE_BIN="
for /f "usebackq delims=" %%i in (`meteor node -e "process.stdout.write(process.execPath)" 2^>nul`) do set "NODE_BIN=%%i"
if not defined NODE_BIN (
	echo ERROR: could not resolve Meteor's bundled node ^(meteor node^). Aborting.
	exit /b 1
)
for %%i in ("%NODE_BIN%") do set "NODE_BIN_DIR=%%~dpi"
for %%i in ("%NODE_BIN_DIR:~0,-1%") do set "DEV_BUNDLE=%%~dpi"
set "MONGOD_BIN=%DEV_BUNDLE%mongodb\bin\mongod.exe"
if not exist "%MONGOD_BIN%" (
	echo ERROR: Meteor's bundled mongod not found at "%MONGOD_BIN%". Aborting.
	exit /b 1
)

REM 3) Install the bundle server's npm deps once (native modules built for NODE_BIN).
if not exist "%REPO%\.build\bundle\programs\server\node_modules" (
	echo ==^> Installing .build\bundle\programs\server npm deps ^(one-time, for the bundle server^)...
	pushd "%REPO%\.build\bundle\programs\server"
	call meteor npm install
	popd
)

REM 4) MongoDB on :3001 - reuse one already listening, else start Meteor's mongod.
netstat -ano | findstr /r /c:":3001 .*LISTENING" >nul 2>&1
if not errorlevel 1 (
	echo ==^> Reusing the MongoDB already listening on :3001 ^(not started or stopped by this run^).
) else (
	for %%i in ("%REPO%\..\mongodb-test-3001") do set "DBPATH=%%~fi"
	if not exist "!DBPATH!" md "!DBPATH!"
	echo ==^> Starting MongoDB ^(Meteor's mongod^) on :3001, dbpath !DBPATH!.
	start "WekanTestMongo" /MIN "%MONGOD_BIN%" --port 3001 --dbpath "!DBPATH!" --bind_ip 127.0.0.1 --logpath "%RUN_LOGDIR%\wekan-test-mongod.log"
	set "MONGOD_STARTED=1"
	echo     Giving mongod a few seconds to accept connections on :3001 ^(Meteor then retries as needed^) ...
	ping -n 8 127.0.0.1 >nul
)

REM 5) Start the precompiled bundle as the :3000 server. Env is set in THIS scope so
REM    the child inherits it (avoids nested quotes), then unset so it does not leak to
REM    the Mocha/E2E jobs (which must NOT inherit MONGO_URL - Mocha uses its own :3101).
REM    WRITABLE_PATH is absolute (the bundle's main.js may chdir into programs\server).
for %%i in ("%REPO%\..") do set "WRITABLE_ABS=%%~fi"
set "MONGO_URL=mongodb://127.0.0.1:3001/meteor"
set "ROOT_URL=http://localhost:3000"
set "PORT=3000"
set "WRITABLE_PATH=%WRITABLE_ABS%"
set "WITH_API=true"
set "RICHER_CARD_COMMENT_EDITOR=false"
set "DEFAULT_METEOR_REACTIVITY_ORDER=changeStreams,oplog,polling"
echo ==^> Starting the WeKan test server on http://localhost:3000 from .build\bundle ^(precompiled - no rebuild^).
start "WekanTestServer" /MIN /D "%REPO%" cmd /c "(echo ===== WeKan test server [bundle node :3000 db :3001/meteor] started: %DATE% %TIME% =====) 1>%RUN_LOGDIR%\wekan-test-server.log 2>&1 & "%NODE_BIN%" "%REPO%\.build\bundle\main.js" 1>>%RUN_LOGDIR%\wekan-test-server.log 2>&1"
set "MONGO_URL=" & set "ROOT_URL=" & set "PORT=" & set "WRITABLE_PATH=" & set "WITH_API=" & set "RICHER_CARD_COMMENT_EDITOR=" & set "DEFAULT_METEOR_REACTIVITY_ORDER="

REM 6) Wait for :3000 to answer (bundle boots in seconds; curl-timeout poll).
call :wait_server_ready
exit /b 0

:seq_run_wait
REM Live progress for a sequential job that runs in its own minimized window and
REM writes .done-<key> when finished. %1=key %2=count kind (check^|e2e) %3=count var
REM %4=log file. Polls every few seconds, printing the running pass counter, then
REM sets S_<key> from the .done flag. Only numbers + fixed labels are echoed (safe).
:seq_run_wait_loop
call :jcount %3 %2 "%~4"
echo     %1: tests:!%3! ^(running^)
if not exist ".done-%1" ( ping -n 4 127.0.0.1 >nul & goto seq_run_wait_loop )
call :jstate %1
call :jcount %3 %2 "%~4"
echo     %1: !S_%1! tests:!%3!
exit /b 0

REM ===========================================================================
:count_tests
REM Print a "by category" summary table for all four test categories that
REM rebuild-wekan runs, then the detailed Playwright per-spec table.
REM Counting rules (kept identical to rebuild-wekan.sh):
REM   Mocha            it( lines across client/lib/tests + server/lib/tests + imports/i18n
REM   Import regression ^function test lines in tests/wekanCreator.import.test.js
REM   Node E2E         logStep('Testing lines in tests/e2e/list-regressions.js
REM   Playwright       test( / test.only( / test.skip( / test.fixme( lines per spec
REM Uses node (always present here) so parsing matches rebuild-wekan.sh exactly;
REM findstr's limited regex engine cannot reproduce these expressions.
node -e "const fs=require('fs'),p=require('path');function rd(f){try{return fs.readFileSync(f,'utf8');}catch(e){return null;}}function cnt(f,re){const s=rd(f);if(s===null)return null;return s.split(/\r?\n/).filter(l=>re.test(l)).length;}function ls(d,suf){try{return fs.readdirSync(d).filter(x=>x.endsWith(suf)).map(x=>p.join(d,x));}catch(e){return [];}}let mocha=0;const mfiles=[].concat(ls('client/lib/tests','.tests.js'),ls('server/lib/tests','.tests.js'),['imports/i18n/i18n.test.js']);for(const f of mfiles){const c=cnt(f,/(^|[^A-Za-z.])it\s*\(/);if(c!==null)mocha+=c;}let imp=cnt('tests/wekanCreator.import.test.js',/^function test/);if(imp===null)imp=0;let ne=cnt('tests/e2e/list-regressions.js',/logStep\('Testing/);if(ne===null)ne=0;const d='tests/playwright/specs';let files=[];try{files=fs.readdirSync(d).filter(f=>f.endsWith('.e2e.js')).sort();}catch(e){}let pw=0;const rows=[];for(const f of files){const m=f.match(/^([0-9]+)/);const spec=m?m[1]:'';let area=f.replace(/^[0-9]+[-_]?/,'').replace(/\.e2e\.js$/,'').replace(/[-_]+/g,' ');area=area.charAt(0).toUpperCase()+area.slice(1);const src=fs.readFileSync(p.join(d,f),'utf8');const c=src.split(/\r?\n/).filter(l=>/(^|[^a-zA-Z.])test(\.(only|skip|fixme))?\s*\(/.test(l)).length;rows.push('| '+spec+' | '+area+' | '+c+' |');pw+=c;}const gt=mocha+imp+ne+pw;console.log('| Category | Tests |');console.log('|----------|-------|');console.log('| Mocha (server + client, meteortesting:mocha) | '+mocha+' |');console.log('| Import regression (tests/wekanCreator.import.test.js) | '+imp+' |');console.log('| Node E2E regressions (tests/e2e/list-regressions.js) | '+ne+' |');console.log('| Playwright e2e specs (tests/playwright/specs/*.e2e.js) | '+pw+' |');console.log('| **Total** | **'+gt+'** |');console.log('');console.log('| Spec | Area | Tests |');console.log('|------|------|-------|');for(const r of rows)console.log(r);console.log('');console.log('**Total: '+pw+' tests**');"
goto end


REM ===========================================================================
:end
ENDLOCAL
