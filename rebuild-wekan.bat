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
echo   1^) Install WeKan dependencies
echo   2^) Build WeKan
echo   3^) Run Meteor for dev on http://localhost:3000
echo   4^) Run Meteor for dev on http://localhost:3000 with trace warnings ^(old Meteor API warnings^)
echo   5^) Run Meteor for dev on http://localhost:3000 with bundle visualizer
echo   6^) Run Meteor for dev on http://CURRENT-IP-ADDRESS:3000
echo   7^) Run Meteor for dev on http://CURRENT-IP-ADDRESS:3000 with MONGO_URL=mongodb://127.0.0.1:27019/wekan
echo   8^) Run Meteor for dev on http://CUSTOM-IP-ADDRESS:PORT
echo   9^) Run ALL tests in parallel on http://localhost:3000 ^(start server, jobs run concurrently, progress + summary^)
echo  10^) Run ALL tests sequentially on http://localhost:3000 ^(start server, one job at a time, progress + summary^)
echo  11^) Test Mocha unit + security + API-logic tests ^(server-side only, no browser^)
echo  12^) Test import regression ^(tests\wekanCreator.import.test.js, fast, no server^)
echo  13^) Test Node E2E regressions ^(tests\e2e\list-regressions.js, needs running server^)
echo  14^) Test Playwright Chromium
echo  15^) Test Playwright Firefox
echo  16^) Test Playwright Webkit
echo  17^) Test Playwright ALL browsers sequentially ^(Chromium + Firefox + WebKit, one at a time^), server already running on :3000
echo  18^) Check floating promises guard ^(@typescript-eslint/no-floating-promises + auth await scan^)
echo  19^) Save Meteor dependency chain to ..\meteor-deps.txt
echo  20^) Install forge CLI tools ^(gh, glab, tea, git-bug, forge^) for GitHub/GitLab/Codeberg/Forgejo/Gitea
echo  21^) Mirror repo GitHub -^> GitLab/Codeberg/Forgejo/Gitea: code + issues + PRs + Actions ^(sync missing, convert CI^)
echo  22^) Count amount of tests by category
echo  23^) Quit
echo ==========================================================
set "choice="
set /p "choice=Please enter your choice: "

if "%choice%"=="1"  goto install
if "%choice%"=="2"  goto build
if "%choice%"=="3"  goto dev_local
if "%choice%"=="4"  goto dev_trace
if "%choice%"=="5"  goto dev_visualizer
if "%choice%"=="6"  goto dev_currentip
if "%choice%"=="7"  goto dev_currentip_mongo
if "%choice%"=="8"  goto dev_customip
if "%choice%"=="9"  goto test_all_parallel
if "%choice%"=="10" goto test_all_sequential
if "%choice%"=="11" goto test_mocha
if "%choice%"=="12" goto test_import
if "%choice%"=="13" goto test_e2e
if "%choice%"=="14" goto test_pw_chromium
if "%choice%"=="15" goto test_pw_firefox
if "%choice%"=="16" goto test_pw_webkit
if "%choice%"=="17" goto test_pw_parallel
if "%choice%"=="18" goto check_floating
if "%choice%"=="19" goto save_deps
if "%choice%"=="20" goto install_forge_tools
if "%choice%"=="21" goto mirror_forge
if "%choice%"=="22" goto count_tests
if "%choice%"=="23" goto end
echo invalid option
goto menu

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

REM ===========================================================================
:test_all_parallel
echo Running ALL tests against ONE WeKan server on http://localhost:3000 - all jobs run IN PARALLEL (concurrently). Needs plenty of RAM (fine on 32 GB).
echo Mocha uses its own build dir (.meteor\local-test) so it runs at the same time as the :3000 server, which keeps .meteor\local.
echo Two Meteor instances run side by side:
echo   Meteor #1 (.meteor\local)      - Node.js app :3000, MongoDB :3001 - serves Node E2E + Playwright browser tests
echo   Meteor #2 (.meteor\local-test) - Node.js app :3100, MongoDB :3101 - runs the server-side Mocha tests
echo   Import regression is a plain Node script (no Meteor, no MongoDB).
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
call :set_dev_env
echo ==^> Starting the single WeKan server on http://localhost:3000 (WITH_API=true, .meteor\local)
set "ROOT_URL=http://localhost:3000"
start "WekanTestServer" /MIN /D "%REPO%" cmd /c "(echo ===== WeKan test server [node :3000 db :3001] started: %DATE% %TIME% =====) 1>%RUN_LOGDIR%\wekan-test-server.log 2>&1 & meteor run --port 3000 1>>%RUN_LOGDIR%\wekan-test-server.log 2>&1"

REM Mocha and the import regression do not need the :3000 server; start them now
REM (each in its own minimized window; /D sets the working dir so all paths are
REM relative and space-safe). Each writes a log and, on exit, its return code to
REM .done-<job>, which the poll loop below watches.
echo ==^> Starting Mocha (separate .meteor\local-test build, port 3100) and import regression in parallel.
start "Wekan mocha" /MIN /D "%REPO%" cmd /c "set METEOR_LOCAL_DIR=.meteor\local-test&& (echo ===== Mocha [M2 node:3100 db:3101] test run: %DATE% %TIME% =====) 1>%RUN_LOGDIR%\wekan-alltests-mocha.log 2>&1 & call meteor test --once --driver-package meteortesting:mocha --port 3100 1>>%RUN_LOGDIR%\wekan-alltests-mocha.log 2>&1 & if errorlevel 1 (echo FAIL>.done-mocha) else (echo PASS>.done-mocha)"
start "Wekan import" /MIN /D "%REPO%" cmd /c "(echo ===== Import regression [no server] test run: %DATE% %TIME% =====) 1>%RUN_LOGDIR%\wekan-alltests-import.log 2>&1 & call node tests\wekanCreator.import.test.js 1>>%RUN_LOGDIR%\wekan-alltests-import.log 2>&1 & if errorlevel 1 (echo FAIL>.done-import) else (echo PASS>.done-import)"

set "SERVER_READY=0"
for /l %%i in (1,1,180) do (
	if "!SERVER_READY!"=="0" (
		curl -fsS http://127.0.0.1:3000/sign-in >nul 2>&1 && set "SERVER_READY=1"
		if "!SERVER_READY!"=="0" (
			<nul set /p "=."
			ping -n 2 127.0.0.1 >nul
		)
	)
)
echo.

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
echo Stopping WeKan test server.
taskkill /FI "WINDOWTITLE eq WekanTestServer*" /T /F >nul 2>&1

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
echo Mocha uses its own build dir (.meteor\local-test) so it runs at the same time as the :3000 server, which keeps .meteor\local.
echo Two Meteor instances are involved:
echo   Meteor #1 (.meteor\local)      - Node.js app :3000, MongoDB :3001 - serves Node E2E + Playwright browser tests
echo   Meteor #2 (.meteor\local-test) - Node.js app :3100, MongoDB :3101 - runs the server-side Mocha tests
echo   Import regression is a plain Node script (no Meteor, no MongoDB).
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
call :set_dev_env
echo ==^> Starting the single WeKan server on http://localhost:3000 (WITH_API=true, .meteor\local)
set "ROOT_URL=http://localhost:3000"
start "WekanTestServer" /MIN /D "%REPO%" cmd /c "(echo ===== WeKan test server [node :3000 db :3001] started: %DATE% %TIME% =====) 1>%RUN_LOGDIR%\wekan-test-server.log 2>&1 & meteor run --port 3000 1>>%RUN_LOGDIR%\wekan-test-server.log 2>&1"

REM Wait for the :3000 server build to finish before running the jobs, so the
REM heavy Meteor build is not competing for CPU/RAM with the test jobs.
set "SERVER_READY=0"
for /l %%i in (1,1,180) do (
	if "!SERVER_READY!"=="0" (
		curl -fsS http://127.0.0.1:3000/sign-in >nul 2>&1 && set "SERVER_READY=1"
		if "!SERVER_READY!"=="0" (
			<nul set /p "=."
			ping -n 2 127.0.0.1 >nul
		)
	)
)
echo.

REM Run each test job to completion, ONE AT A TIME (sequential, not in parallel),
REM so the combined run does not exhaust RAM/swap and crash the machine. Mocha
REM and the import regression do not need the :3000 server; E2E and the browser
REM suites do. The browser suite runs all three browsers with --workers=1, i.e.
REM one browser at a time.
echo ==^> Running Mocha on Meteor #2 [Node.js :3100, MongoDB :3101] (separate .meteor\local-test build).
pushd "%REPO%"
set "METEOR_LOCAL_DIR=.meteor\local-test"
(echo ===== Mocha [M2 node:3100 db:3101] test run: %DATE% %TIME% =====) 1>%RUN_LOGDIR%\wekan-alltests-mocha.log 2>&1
call meteor test --once --driver-package meteortesting:mocha --port 3100 1>>%RUN_LOGDIR%\wekan-alltests-mocha.log 2>&1
if errorlevel 1 (set "S_mocha=FAIL") else (set "S_mocha=PASS")
set "METEOR_LOCAL_DIR="
popd

echo ==^> Running import regression [plain Node, no Meteor / no MongoDB].
pushd "%REPO%"
(echo ===== Import regression [no server] test run: %DATE% %TIME% =====) 1>%RUN_LOGDIR%\wekan-alltests-import.log 2>&1
call node tests\wekanCreator.import.test.js 1>>%RUN_LOGDIR%\wekan-alltests-import.log 2>&1
if errorlevel 1 (set "S_import=FAIL") else (set "S_import=PASS")
popd

if "!SERVER_READY!"=="0" goto skip_server_jobs
echo ==^> Running Node E2E regressions on Meteor #1 [Node.js :3000, MongoDB :3001].
pushd "%REPO%"
(echo ===== Node E2E [M1 node:3000 db:3001] test run: %DATE% %TIME% =====) 1>%RUN_LOGDIR%\wekan-alltests-e2e.log 2>&1
call meteor npm run test:e2e 1>>%RUN_LOGDIR%\wekan-alltests-e2e.log 2>&1
if errorlevel 1 (set "S_e2e=FAIL") else (set "S_e2e=PASS")
popd
echo ==^> Running Playwright Chromium, Firefox and WebKit one at a time ^(--workers=1^) on Meteor #1 [Node.js :3000, MongoDB :3001].
pushd "%REPO%\tests\playwright"
set "WEKAN_PLAYWRIGHT_ALL=1"
(echo ===== Playwright browsers [M1 node:3000 db:3001] test run: %DATE% %TIME% =====) 1>%RUN_LOGDIR%\wekan-alltests-browsers.log 2>&1
call meteor npm exec playwright test -- --project=chromium --project=firefox --project=webkit --workers=1 --reporter=list 1>>%RUN_LOGDIR%\wekan-alltests-browsers.log 2>&1
if errorlevel 1 (set "S_browsers=FAIL") else (set "S_browsers=PASS")
popd
goto server_jobs_done

:skip_server_jobs
echo FAIL: server did not become ready on http://localhost:3000 ^(see %RUN_LOGDIR%\wekan-test-server.log^)
set "S_e2e=SKIP" & set "S_browsers=SKIP" & set "FAILED=1"

:server_jobs_done

echo.
echo Stopping WeKan test server.
taskkill /FI "WINDOWTITLE eq WekanTestServer*" /T /F >nul 2>&1

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
if not exist "..\log" md "..\log"
call meteor run %* 2>&1 | powershell -NoProfile -Command "$input | Tee-Object -FilePath '..\log\wekan-log.log'"
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
