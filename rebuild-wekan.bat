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

REM --- Platform detection (OS + CPU arch), like detect_platform in the .sh ---
set "PLATFORM_OS=windows"
set "PLATFORM_ARCH=amd64"
if /i "%PROCESSOR_ARCHITECTURE%"=="ARM64" set "PLATFORM_ARCH=arm64"
if /i "%PROCESSOR_ARCHITEW6432%"=="ARM64" set "PLATFORM_ARCH=arm64"
echo Platform: %PLATFORM_OS% %PLATFORM_ARCH%
echo Repo: %REPO%

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
echo   9^) Run ALL tests on http://localhost:3000 ^(start server, progress + summary^)
echo  10^) Test Mocha unit + security + API-logic tests ^(server-side only, no browser^)
echo  11^) Test import regression ^(tests\wekanCreator.import.test.js, fast, no server^)
echo  12^) Test Node E2E regressions ^(tests\e2e\list-regressions.js, needs running server^)
echo  13^) Test Playwright Chromium
echo  14^) Test Playwright Firefox
echo  15^) Test Playwright Webkit
echo  16^) Test Playwright ALL browsers sequentially ^(Chromium + Firefox + WebKit, one at a time^), server already running on :3000
echo  17^) Check floating promises guard ^(@typescript-eslint/no-floating-promises + auth await scan^)
echo  18^) Save Meteor dependency chain to ..\meteor-deps.txt
echo  19^) Quit
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
if "%choice%"=="9"  goto test_all
if "%choice%"=="10" goto test_mocha
if "%choice%"=="11" goto test_import
if "%choice%"=="12" goto test_e2e
if "%choice%"=="13" goto test_pw_chromium
if "%choice%"=="14" goto test_pw_firefox
if "%choice%"=="15" goto test_pw_webkit
if "%choice%"=="16" goto test_pw_parallel
if "%choice%"=="17" goto check_floating
if "%choice%"=="18" goto save_deps
if "%choice%"=="19" goto end
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
call meteor run --port 3000
goto end

:dev_trace
call :ensure_dirs
call :set_dev_env
set "WARN_WHEN_USING_OLD_API=true"
set "NODE_OPTIONS=--trace-warnings"
set "ROOT_URL=http://localhost:3000"
call meteor run --port 3000
goto end

:dev_visualizer
call :ensure_dirs
call :set_dev_env
set "ROOT_URL=http://localhost:3000"
call meteor run --port 3000 --extra-packages bundle-visualizer --production
goto end

:dev_currentip
call :ensure_dirs
call :detect_ip
echo Your IP address is !IPADDRESS!
call :set_dev_env
set "ROOT_URL=http://!IPADDRESS!:3000"
call meteor run --port 3000
goto end

:dev_currentip_mongo
call :ensure_dirs
call :detect_ip
echo Your IP address is !IPADDRESS!
call :set_dev_env
set "MONGO_URL=mongodb://127.0.0.1:27019/wekan"
set "ROOT_URL=http://!IPADDRESS!:3000"
call meteor run --port 3000
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
call meteor run --port %PORT%
goto end

REM ===========================================================================
:test_all
echo Running ALL tests against ONE WeKan server on http://localhost:3000 - all jobs run SEQUENTIALLY (one at a time).
echo Mocha uses its own build dir (.meteor\local-test) so it runs at the same time as the :3000 server, which keeps .meteor\local.
curl -fsS http://127.0.0.1:3000 >nul 2>&1
if not errorlevel 1 (
	echo ERROR: Port 3000 is already in use. Stop any running dev server before running this option.
	goto end
)

set "FAILED=0"
set "S_mocha=RUN" & set "S_import=RUN" & set "S_e2e=RUN" & set "S_browsers=RUN"
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
start "WekanTestServer" /MIN /D "%REPO%" cmd /c "meteor run --port 3000 1>..\wekan-test-server.log 2>&1"

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
echo ==^> Running Mocha (separate .meteor\local-test build, port 3100).
pushd "%REPO%"
set "METEOR_LOCAL_DIR=.meteor\local-test"
call meteor test --once --driver-package meteortesting:mocha --port 3100 1>..\wekan-alltests-mocha.log 2>&1
if errorlevel 1 (set "S_mocha=FAIL") else (set "S_mocha=PASS")
set "METEOR_LOCAL_DIR="
popd

echo ==^> Running import regression.
pushd "%REPO%"
call node tests\wekanCreator.import.test.js 1>..\wekan-alltests-import.log 2>&1
if errorlevel 1 (set "S_import=FAIL") else (set "S_import=PASS")
popd

if "!SERVER_READY!"=="0" goto skip_server_jobs
echo ==^> Running Node E2E regressions.
pushd "%REPO%"
call meteor npm run test:e2e 1>..\wekan-alltests-e2e.log 2>&1
if errorlevel 1 (set "S_e2e=FAIL") else (set "S_e2e=PASS")
popd
echo ==^> Running Playwright Chromium, Firefox and WebKit one at a time ^(--workers=1^).
pushd "%REPO%\tests\playwright"
set "WEKAN_PLAYWRIGHT_ALL=1"
call meteor npm exec playwright test -- --project=chromium --project=firefox --project=webkit --workers=1 --reporter=list 1>..\..\wekan-alltests-browsers.log 2>&1
if errorlevel 1 (set "S_browsers=FAIL") else (set "S_browsers=PASS")
popd
goto server_jobs_done

:skip_server_jobs
echo FAIL: server did not become ready on http://localhost:3000 ^(see ..\wekan-test-server.log^)
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

echo.
echo ==================== TEST SUMMARY ====================
call :report "!S_mocha!"     "Mocha (server-side)"
call :report "!S_import!"    "Import regression"
if "!SERVER_READY!"=="1" ( call :report "PASS" "Server startup" ) else ( call :report "FAIL" "Server startup" )
call :report "!S_e2e!"       "Node E2E regressions"
call :report "!S_browsers!"  "Playwright (Chromium+Firefox+WebKit)"
echo =====================================================
echo (per-job logs: ..\wekan-alltests-^<mocha^|import^|e2e^|browsers^>.log ; server: ..\wekan-test-server.log)
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
REM  Subroutines
REM ===========================================================================
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
REM %1 = status (PASS/FAIL/SKIP or empty), %2 = name
set "ST=%~1"
if "%ST%"=="" set "ST=----"
echo   %ST%   %~2
exit /b 0

:jstate
REM %1 = job key. Sets S_<key> to RUN / PASS / FAIL from .done-<key>.
REM Called repeatedly by the :test_all poll loop and once more for the summary.
if not exist ".done-%1" ( set "S_%1=RUN" & exit /b 0 )
set /p "S_%1="<".done-%1"
exit /b 0

REM ===========================================================================
:end
ENDLOCAL
