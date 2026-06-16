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
echo  16^) Check floating promises guard ^(@typescript-eslint/no-floating-promises + auth await scan^)
echo  17^) Save Meteor dependency chain to ..\meteor-deps.txt
echo  18^) Quit
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
if "%choice%"=="16" goto check_floating
if "%choice%"=="17" goto save_deps
if "%choice%"=="18" goto end
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
if exist "%REPO%\node_modules"      rmdir /s /q "%REPO%\node_modules"
if exist "%REPO%\.meteor\local"     rmdir /s /q "%REPO%\.meteor\local"
if exist "%REPO%\.build"            rmdir /s /q "%REPO%\.build"
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
echo Running ALL tests: import regression + Mocha (server-side) + Node E2E + Playwright (Chromium, Firefox, WebKit).
curl -fsS http://127.0.0.1:3000 >nul 2>&1
if not errorlevel 1 (
	echo ERROR: Port 3000 is already in use. Stop any running dev server before running this option.
	goto end
)

set "TOTAL=5"
set "FAILED=0"
set "R_IMPORT=" & set "R_MOCHA=" & set "R_SERVER=" & set "R_E2E="
set "R_CHROMIUM=" & set "R_FIREFOX=" & set "R_WEBKIT="

echo.
echo ==^> [1/%TOTAL%] Import regression (node, no server)
call node tests\wekanCreator.import.test.js
if errorlevel 1 ( set "R_IMPORT=FAIL" & set "FAILED=1" ) else ( set "R_IMPORT=PASS" )

echo.
echo ==^> [2/%TOTAL%] Mocha unit + security + API-logic tests (server-side, meteor test, port 3100)
call meteor test --once --driver-package meteortesting:mocha --port 3100
if errorlevel 1 ( set "R_MOCHA=FAIL" & set "FAILED=1" ) else ( set "R_MOCHA=PASS" )

echo.
echo ==^> [3/%TOTAL%] Starting WeKan server on http://localhost:3000 (WITH_API=true)
REM Set the dev env in this shell; the started child process inherits it,
REM which avoids fragile nested quotes inside cmd /c.
call :set_dev_env
set "ROOT_URL=http://localhost:3000"
start "WekanTestServer" /MIN /D "%REPO%" cmd /c "meteor run --port 3000 1>..\wekan-test-server.log 2>&1"

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
	echo FAIL: server did not become ready on http://localhost:3000 ^(see ..\wekan-test-server.log^)
	set "R_SERVER=FAIL" & set "FAILED=1"
	set "R_E2E=SKIP"
	set "R_CHROMIUM=SKIP" & set "R_FIREFOX=SKIP" & set "R_WEBKIT=SKIP"
) else (
	set "R_SERVER=PASS"
	echo.
	echo ==^> [4/%TOTAL%] Node E2E regressions ^(tests\e2e\list-regressions.js^)
	call meteor npm run test:e2e
	if errorlevel 1 ( set "R_E2E=FAIL" & set "FAILED=1" ) else ( set "R_E2E=PASS" )

	echo.
	echo ==^> [5/%TOTAL%] Playwright browser specs ^(Chromium + Firefox + WebKit^)

	echo.
	echo -- Playwright Chromium --
	call :run_pw_all chromium
	if errorlevel 1 ( set "R_CHROMIUM=FAIL" & set "FAILED=1" ) else ( set "R_CHROMIUM=PASS" )

	echo.
	echo -- Playwright Firefox --
	call :run_pw_all firefox
	if errorlevel 1 ( set "R_FIREFOX=FAIL" & set "FAILED=1" ) else ( set "R_FIREFOX=PASS" )

	echo.
	echo -- Playwright WebKit --
	call :run_pw_all webkit
	if errorlevel 1 ( set "R_WEBKIT=FAIL" & set "FAILED=1" ) else ( set "R_WEBKIT=PASS" )
)

echo.
echo Stopping WeKan test server.
taskkill /FI "WINDOWTITLE eq WekanTestServer*" /T /F >nul 2>&1

echo.
echo ==================== TEST SUMMARY ====================
call :report "!R_IMPORT!"    "Import regression"
call :report "!R_MOCHA!"     "Mocha (server-side)"
call :report "!R_SERVER!"    "Server startup"
call :report "!R_E2E!"       "Node E2E regressions"
call :report "!R_CHROMIUM!"  "Playwright Chromium"
call :report "!R_FIREFOX!"   "Playwright Firefox"
call :report "!R_WEBKIT!"    "Playwright WebKit"
echo =====================================================
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

REM ===========================================================================
:end
ENDLOCAL
