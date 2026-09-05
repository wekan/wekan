@ECHO OFF
SETLOCAL EnableDelayedExpansion

REM ============================================================================
REM  WeKan rebuild / run / test helper for Windows.
REM  Mirrors the menu of build.sh so building, running and testing
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
REM     with build.sh is the recommended alternative.
REM
REM  Two build directories, and they are not the same thing:
REM   - .build\  the RELEASE bundle, from 'meteor build .build --directory'.
REM               .build\bundle is what is deployed, tested and packaged.
REM   - _build\  rspack's compiled output, written by ANY Meteor compile.
REM               Meteor reads its main modules from _build\main-prod\, so it is
REM               a handoff, not a leftover: it is gitignored but must NOT be
REM               added to .meteorignore (see the note in that file).
REM  Both are generated. Never edit them, never commit them, and skip them in any
REM  tool that walks the repo - _build holds a second copy of every source file.
REM ============================================================================

REM --- Command line: build.bat <name> [args] / --help / --list ---------------
REM  Same names as build.sh, so a release, a bundle build or a translation pull
REM  can be scripted on Windows too. With no arguments this falls through to the
REM  menu, exactly as before.
if "%~1"=="" goto no_cli_args
if /I "%~1"=="-h"     goto cli_help_exit
if /I "%~1"=="--help" goto cli_help_exit
if /I "%~1"=="help"   goto cli_help_exit
if /I "%~1"=="-l"     goto cli_list_exit
if /I "%~1"=="--list" goto cli_list_exit
if /I "%~1"=="list"   goto cli_list_exit
call :cli_run %*
exit /b %errorlevel%
:cli_help_exit
call :cli_help
exit /b 0
:cli_list_exit
call :cli_help
echo.
echo Commands:
call :cli_list
exit /b 0
:no_cli_args

REM --- Repo root = folder of this script (strip trailing backslash) ---
set "REPO=%~dp0"
if "%REPO:~-1%"=="\" set "REPO=%REPO:~0,-1%"
cd /d "%REPO%"

REM Give the Meteor build tool and Node processes a larger heap so long
REM development sessions and test runs don't crash with "FATAL ERROR: ...
REM JavaScript heap out of memory". TOOL_NODE_FLAGS controls the Meteor
REM command-line/build process (the one that hits the limit during
REM `meteor run` / `meteor test` / `meteor build`); NODE_OPTIONS covers the
REM child Node/rspack processes. Both derive their defaults from installed RAM and honor any value you
set "WEKAN_MEMORY_MB=16384"
for /f "usebackq delims=" %%M in (`powershell.exe -NoProfile -Command "[math]::Floor((Get-CimInstance Win32_OperatingSystem).TotalVisibleMemorySize / 1024)" 2^>NUL`) do set "WEKAN_MEMORY_MB=%%M"
set /a WEKAN_BUILD_HEAP_MB=WEKAN_MEMORY_MB/2
if %WEKAN_BUILD_HEAP_MB% GTR 16384 set "WEKAN_BUILD_HEAP_MB=16384"
if not defined TOOL_NODE_FLAGS set "TOOL_NODE_FLAGS=--max-old-space-size=%WEKAN_BUILD_HEAP_MB%"
if not defined NODE_OPTIONS set "NODE_OPTIONS=--max-old-space-size=%WEKAN_BUILD_HEAP_MB%"

REM Every log this script writes goes into the repo-local ignored .tools\log\.
REM Create it up front so redirections never fail on a missing directory.
if not exist ".tools\log" md ".tools\log"

REM --- Platform detection (OS + CPU arch), like detect_platform in the .sh ---
set "PLATFORM_OS=windows"
set "PLATFORM_ARCH=amd64"
if /i "%PROCESSOR_ARCHITECTURE%"=="ARM64" set "PLATFORM_ARCH=arm64"
if /i "%PROCESSOR_ARCHITEW6432%"=="ARM64" set "PLATFORM_ARCH=arm64"
echo Platform: %PLATFORM_OS% %PLATFORM_ARCH%
echo Repo: %REPO%
echo Note: Dev-server console output is also logged to .tools\log\wekan-log.log

:menu
echo.
echo ==================== WeKan ( Windows ) ====================
echo   1^) Setup            ^(install dependencies, build^)
echo   2^) Dev server       ^(meteor run variants^)
echo   3^) Tests            ^(mocha, playwright, e2e, ...^)
echo   4^) Docker           ^(start / follow logs / stop^)
echo   5^) Releases         ^(release, snap, bundles, translations, ...^)
echo   6^) CLI commands     ^(run any of them without the menu^)
echo   7^) Tools            ^(save deps, forge tools, mirror^)
echo   0^) Quit
echo ==========================================================
set "choice="
set /p "choice=Choose a category: "
if "%choice%"=="1" goto menu_setup
if "%choice%"=="2" goto menu_dev
if "%choice%"=="3" goto menu_tests
if "%choice%"=="4" goto menu_docker
if "%choice%"=="5" goto menu_releases
if "%choice%"=="6" goto menu_cli
if "%choice%"=="7" goto menu_tools
if "%choice%"=="0" goto end
echo invalid option
goto menu

REM ===========================================================================
:menu_setup
echo.
echo -- Setup --   ^(0 = Back^)
echo   1^) Install dependencies
echo   2^) Build WeKan release bundle
echo   3^) Build WeKan development bundle
echo   4^) git pull ^(fetch, fast-forward or rebase, repoint moved CHANGELOG links^)
echo   5^) git push ^(check the CHANGELOG links, push, pull-and-retry once if rejected^)
set "choice="
set /p "choice=Choose: "
if "%choice%"=="1" goto install
if "%choice%"=="2" goto build
if "%choice%"=="3" goto builddev
if "%choice%"=="4" goto gitpull
if "%choice%"=="5" goto gitpush
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
echo   7^) CUSTOM PORT + SUBDOMAIN ^(asks for port and ROOT_URL host^)
echo   8^) Kill all dev servers ^(free ports 3000/3001/3100/3101/4000/4001/8080^)
set "choice="
set /p "choice=Choose: "
if "%choice%"=="1" goto dev_local
if "%choice%"=="2" goto dev_trace
if "%choice%"=="3" goto dev_visualizer
if "%choice%"=="4" goto dev_currentip
if "%choice%"=="5" goto dev_currentip_mongo
if "%choice%"=="6" goto dev_customip
if "%choice%"=="7" goto dev_customurl
if "%choice%"=="8" goto dev_killall
if "%choice%"=="0" goto menu
goto menu_dev

REM ===========================================================================
:menu_tests
echo.
echo -- Tests --   ^(0 = Back^)
echo   1^) EVERYTHING two-worker: one stage at a time, two Playwright workers
echo       per browser; every database and all FerretDB tests remain sequential.
echo       Logs in .tools\log\^<datetime^>\
echo   2^) EVERYTHING one by one: one stage and one Playwright worker at a time
echo       for minimum RAM usage; database and FerretDB stages stay sequential
echo   3^) EVERYTHING at once: WeKan test jobs concurrently; database and
echo       FerretDB stages remain sequential
echo   4^) Mocha ^(server-side^)
echo   5^) Import regression
echo   6^) Node E2E regressions
echo   7^) Install Playwright browsers ^(Chromium, Firefox, WebKit^)
echo   8^) Playwright Chromium
echo   9^) Playwright Firefox
echo  10^) Playwright WebKit
echo  11^) Playwright ALL browsers
echo  12^) Floating-promises guard
echo  13^) Count tests by category
echo  14^) All databases ^(sequential^): build newest FerretDB v1, run every query type
echo       against every database with an image for this CPU, compare the answers
echo  15^) Run all FerretDB tests - SEQUENTIAL ^(unit, vet, integration^)
set "choice="
set /p "choice=Choose: "
if "%choice%"=="1"  goto test_everything_two
if "%choice%"=="2"  goto test_everything_one
if "%choice%"=="3"  goto test_everything_all
if "%choice%"=="4"  goto test_mocha
if "%choice%"=="5"  goto test_import
if "%choice%"=="6"  goto test_e2e
if "%choice%"=="7"  goto install_pw_browsers
if "%choice%"=="8"  goto test_pw_chromium
if "%choice%"=="9"  goto test_pw_firefox
if "%choice%"=="10" goto test_pw_webkit
if "%choice%"=="11" goto test_pw_parallel
if "%choice%"=="12" goto check_floating
if "%choice%"=="13" goto count_tests
if "%choice%"=="14" goto test_all_databases
if "%choice%"=="15" goto test_ferretdb
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
REM  Releases: every maintainer script in releases/, grouped, same list and
REM  same order as build.sh's RELEASE_SCRIPTS. They are Git Bash scripts, so
REM  this needs Git for Windows (bash on PATH); .mjs entries are run by node.
REM  The entries build.sh marks as linux-only (systemd, ufw, snap, multipass)
REM  are not here: Windows cannot do them at all.
REM  tests/buildScriptParity.test.cjs fails when a script is added to
REM  releases/ and not to BOTH menus.
:menu_releases
echo.
echo -- Releases --   ^(0 = Back^)
echo   1^) Release ^(22 entries^)
echo   2^) Snap ^(11 entries^)
echo   3^) Bundles ^(10 entries^)
echo   4^) Docker images ^(5 entries^)
echo   5^) Sandstorm ^(5 entries^)
echo   6^) Translations ^(9 entries^)
echo   7^) Git and repo ^(8 entries^)
echo   8^) Server and VM ^(4 entries^)
set "choice="
set /p "choice=Choose: "
if "%choice%"=="1" goto rel_release
if "%choice%"=="2" goto rel_snap
if "%choice%"=="3" goto rel_bundles
if "%choice%"=="4" goto rel_dockerimages
if "%choice%"=="5" goto rel_sandstorm
if "%choice%"=="6" goto rel_translations
if "%choice%"=="7" goto rel_gitandrepo
if "%choice%"=="8" goto rel_serverandvm
if "%choice%"=="0" goto menu
goto menu_releases

REM ---------------------------------------------------------------------------
:rel_release
echo.
echo -- Releases / Release --   ^(0 = Back^)
echo   1^) Release ALL platforms: push CHANGELOG, trigger release-all.yml
echo   2^) Release ^(older local flow^), for one version
echo   3^) Show the version numbers this checkout would release
echo   4^) Show the CHANGELOG of the release being prepared
echo   5^) Rebuild the API docs ^(wekan.yml + wekan.html^)
echo   6^) Rebuild a release that already exists
echo   7^) Prepare the release directory for one version
echo   8^) Collect the built bundles for one version
echo   9^) Link the newest bundle as wekan-latest
echo   10^) Move an old release out of the download directory
echo   11^) Clean up after a release
echo   12^) Publish the Helm chart in wekan/charts
echo   13^) Update wekan.fi with the new version and API docs
echo   14^) Publish the npm packages xet7 maintains
echo   15^) Check every download URL snapcraft.yaml uses
echo   16^) Clone all release-related repositories
echo   17^) Create the GitHub Actions secrets a release needs
echo   18^) Add a git tag for a release
echo   19^) Delete a git tag, locally and on the remote
echo   20^) Move the 'stable' tag to HEAD
echo   21^) Release the wekan-ondra / wekan-gantt-gpl variants, part 1
echo   22^) Release the wekan-ondra / wekan-gantt-gpl variants, part 2
echo   23^) Report ^(or repair^) the Helm chart index for past releases
echo   24^) Rebuild the Helm index.yaml from the chart packages
set "choice="
set /p "choice=Choose: "
if "%choice%"=="1" call :rel_run "releases/release-all.sh" ""
if "%choice%"=="2" call :rel_run "releases/release.sh" "WeKan version, e.g. 10.50"
if "%choice%"=="3" call :rel_run "releases/version.sh" ""
if "%choice%"=="4" call :rel_run "releases/changelog.sh" ""
if "%choice%"=="5" call :rel_run "releases/rebuild-docs.sh" ""
if "%choice%"=="6" call :rel_run "releases/rebuild-release.sh" ""
if "%choice%"=="7" call :rel_run "releases/rel.sh" "WeKan version, e.g. 10.50"
if "%choice%"=="8" call :rel_run "releases/release-bundle.sh" "WeKan version, e.g. 10.50"
if "%choice%"=="9" call :rel_run "releases/release-ln.sh" "WeKan version, e.g. 10.50"
if "%choice%"=="10" call :rel_run "releases/release-x2.sh" "WeKan version, e.g. 10.50"
if "%choice%"=="11" call :rel_run "releases/release-cleanup.sh" "WeKan version, e.g. 10.50"
if "%choice%"=="12" call :rel_run "releases/release-charts.sh" ""
if "%choice%"=="13" call :rel_run "releases/release-website.sh" ""
if "%choice%"=="14" call :rel_run "releases/npm-publish.sh" ""
if "%choice%"=="15" call :rel_run "releases/test-download-urls.sh" ""
if "%choice%"=="16" call :rel_run "releases/clone-release-repos.sh" ""
if "%choice%"=="17" call :rel_run "releases/create-github-secrets.sh" ""
if "%choice%"=="18" call :rel_run "releases/add-tag.sh" "Version tag, e.g. v10.50"
if "%choice%"=="19" call :rel_run "releases/delete-tag.sh" "Version tag, e.g. v10.50"
if "%choice%"=="20" call :rel_cmd "git tag --force stable HEAD && git push --tags --force && git push --follow-tags" ""
if "%choice%"=="21" call :rel_run "releases/release-ondra-1.sh" ""
if "%choice%"=="22" call :rel_run "releases/release-ondra-2.sh" ""
if "%choice%"=="23" call :rel_run "releases/backfill-charts.sh" ""
if "%choice%"=="24" call :rel_run "releases/reindex-charts.py" ""
if "%choice%"=="0" goto menu_releases
goto rel_release

REM ---------------------------------------------------------------------------
:rel_snap
echo.
echo -- Releases / Snap --   ^(0 = Back^)
echo   1^) Build the snap from snapcraft.yaml
echo   2^) Install the locally built .snap
echo   3^) Push one .snap to the Snap Store
echo   4^) Release the snap for one version
echo   5^) List the newest Snap Store revisions
echo   6^) Release one store revision to edge, beta and candidate
echo   7^) Switch the installed snap to the edge channel
echo   8^) Switch the installed snap to the stable channel
echo   9^) snapcraft help topics
echo   10^) wekan.help of the installed snap
echo   11^) Switch between KVM, snapcraft, Waydroid and VirtualBox
set "choice="
set /p "choice=Choose: "
if "%choice%"=="1" call :rel_run "releases/snap-build.sh" ""
if "%choice%"=="2" call :rel_run "releases/snap-install.sh" ""
if "%choice%"=="3" call :rel_run "releases/snap-push-to-store.sh" "Path to the .snap file"
if "%choice%"=="4" call :rel_run "releases/release-snap.sh" "WeKan version, e.g. 10.50"
if "%choice%"=="5" call :rel_run "releases/snap-store-revisions.sh" ""
if "%choice%"=="6" call :rel_run "releases/snap-store-release-revision-to-channels.sh" "Snap Store revision number"
if "%choice%"=="7" call :rel_run "releases/snap-release-all-channels.sh" "Version, or empty for the newest"
if "%choice%"=="7" call :rel_run "releases/snap-edge.sh" ""
if "%choice%"=="8" call :rel_run "releases/snap-stable.sh" ""
if "%choice%"=="9" call :rel_run "releases/snapcraft-help.sh" ""
if "%choice%"=="10" call :rel_run "releases/wekan-snap-help.sh" ""
if "%choice%"=="11" call :rel_run "releases/switch-kvm-snapcraft-waydroid-virtualbox.sh" ""
if "%choice%"=="0" goto menu_releases
goto rel_snap

REM ---------------------------------------------------------------------------
:rel_bundles
echo.
echo -- Releases / Bundles --   ^(0 = Back^)
echo   ^(the Windows bundle is built by running releases\build-bundle-win64.bat directly^)
echo   1^) Build the arm64 bundle
echo   2^) Build the armhf ^(arm/v7^) bundle
echo   3^) Build the ppc64el bundle
echo   4^) Build the ppc64le bundle
echo   5^) Build the s390x bundle
echo   6^) Fetch the built bundle from the amd64 build host
echo   7^) Fetch the built bundle from the arm64 build host
echo   8^) Fetch the built bundle from the ppc64le build host
echo   9^) Fetch the built bundle from the s390x build host
echo   10^) Upload the Windows bundle to the download server
set "choice="
set /p "choice=Choose: "
if "%choice%"=="1" call :rel_run "releases/build-bundle-arm64.sh" "WeKan version, e.g. 10.50"
if "%choice%"=="2" call :rel_run "releases/build-bundle-armhf.sh" "WeKan version, e.g. 10.50"
if "%choice%"=="3" call :rel_run "releases/build-bundle-ppc64el.sh" "WeKan version, e.g. 10.50"
if "%choice%"=="4" call :rel_run "releases/build-bundle-ppc64le.sh" "WeKan version, e.g. 10.50"
if "%choice%"=="5" call :rel_run "releases/build-bundle-s390x.sh" "WeKan version, e.g. 10.50"
if "%choice%"=="6" call :rel_run "releases/up.sh" "WeKan version, e.g. 10.50"
if "%choice%"=="7" call :rel_run "releases/up-a.sh" "WeKan version, e.g. 10.50"
if "%choice%"=="8" call :rel_run "releases/up-o.sh" "WeKan version, e.g. 10.50"
if "%choice%"=="9" call :rel_run "releases/up-s.sh" "WeKan version, e.g. 10.50"
if "%choice%"=="10" call :rel_run "releases/up-w.sh" "WeKan version, e.g. 10.50"
if "%choice%"=="0" goto menu_releases
goto rel_bundles

REM ---------------------------------------------------------------------------
:rel_dockerimages
echo.
echo -- Releases / Docker images --   ^(0 = Back^)
echo   1^) Build the WeKan Docker image
echo   2^) Create the multi-platform buildx builder
echo   3^) Publish a variant image ^(wekan-gantt-gpl / wekan-ondra^)
echo   4^) Push the locally built images to Docker Hub and Quay
echo   5^) Mirror the images between registries with skopeo
set "choice="
set /p "choice=Choose: "
if "%choice%"=="1" call :rel_run "releases/docker-build.sh" ""
if "%choice%"=="2" call :rel_run "releases/docker-build-deps.sh" ""
if "%choice%"=="3" call :rel_run "releases/docker-publish-variant.sh" "Image and version, e.g. wekan-gantt-gpl 10.50"
if "%choice%"=="4" call :rel_run "releases/docker-push-gantt.sh" "Docker build tag and WeKan version"
if "%choice%"=="5" call :rel_run "releases/docker-registry-sync.sh" ""
if "%choice%"=="0" goto menu_releases
goto rel_dockerimages

REM ---------------------------------------------------------------------------
:rel_sandstorm
echo.
echo -- Releases / Sandstorm --   ^(0 = Back^)
echo   1^) Install the Sandstorm-related files
echo   2^) Disable the Sandstorm files again
echo   3^) Make the .spk package
echo   4^) Run the Sandstorm dev server
echo   5^) Release the Sandstorm version
set "choice="
set /p "choice=Choose: "
if "%choice%"=="1" call :rel_run "releases/install-sandstorm.sh" ""
if "%choice%"=="2" call :rel_run "releases/disable-sandstorm.sh" ""
if "%choice%"=="3" call :rel_run "releases/sandstorm-make-spk.sh" ""
if "%choice%"=="4" call :rel_run "releases/sandstorm-test-dev.sh" ""
if "%choice%"=="5" call :rel_run "releases/release-sandstorm.sh" ""
if "%choice%"=="0" goto menu_releases
goto rel_sandstorm

REM ---------------------------------------------------------------------------
:rel_translations
echo.
echo -- Releases / Translations --   ^(0 = Back^)
echo   1^) Pull the newest translations from Transifex and merge them
echo   2^) How many strings each language still needs
echo   3^) Push one language to Transifex
echo   4^) Push every language to Transifex
echo   5^) Push the English source to Transifex
echo   6^) Copy the English source into en-GB on Transifex
echo   7^) Report English strings that regressed
echo   8^) Prove a pull keeps human translations ^(no network^)
echo   9^) Merge a finished pull by hand
set "choice="
set /p "choice=Choose: "
if "%choice%"=="1" call :rel_run "releases/translations/pull-translations.sh" ""
if "%choice%"=="2" call :rel_run "releases/translations/fill-translations.mjs --missing" ""
if "%choice%"=="3" call :rel_run "releases/translations/push-translation.sh" "Language code, e.g. ja"
if "%choice%"=="4" call :rel_run "releases/translations/push-all-translations.sh" ""
if "%choice%"=="5" call :rel_run "releases/translations/push-english-base-translation.sh" ""
if "%choice%"=="6" call :rel_run "releases/translations/push-copy-en-gb-translation.sh" ""
if "%choice%"=="7" call :rel_run "releases/translations/report-english-regressions.mjs" ""
if "%choice%"=="8" call :rel_run "releases/translations/verify-human-preference.mjs" ""
if "%choice%"=="9" call :rel_run "releases/translations/merge-translations.mjs" ""
if "%choice%"=="0" goto menu_releases
goto rel_translations

REM ---------------------------------------------------------------------------
:rel_gitandrepo
echo.
echo -- Releases / Git and repo --   ^(0 = Back^)
echo   1^) Commit with the editor open for a multi-line message
echo   2^) Add everything, then revert it again
echo   3^) Delete a branch, locally and on the remote
echo   4^) Count lines of code per committer
echo   5^) Convert the remaining Stylus to CSS
echo   6^) Update Node.js everywhere in the sources
echo   7^) Update the local Node.js version
echo   8^) Migrate a MongoDB database to FerretDB ^(--help first^)
set "choice="
set /p "choice=Choose: "
if "%choice%"=="1" call :rel_run "releases/commit.sh" ""
if "%choice%"=="2" call :rel_cmd "git restore --staged" "Path to unstage"
if "%choice%"=="3" call :rel_run "releases/delete-branch-local-and-remote.sh" "Branch name"
if "%choice%"=="4" call :rel_run "releases/count-lines-of-code-per-committer.sh" ""
if "%choice%"=="5" call :rel_run "releases/stylus-to-css.sh" ""
if "%choice%"=="6" call :rel_run "releases/node-update.sh" ""
if "%choice%"=="7" call :rel_run "releases/node-update-local.sh" ""
if "%choice%"=="8" call :rel_run "releases/migrate-mongodb-to-ferretdb.mjs" "Arguments, e.g. --help"
if "%choice%"=="0" goto menu_releases
goto rel_gitandrepo

REM ---------------------------------------------------------------------------
:rel_serverandvm
echo.
echo -- Releases / Server and VM --   ^(0 = Back^)
echo   1^) Show the VirtualBox VM's IP address
echo   2^) Let Node.js bind port 80 in the VM
echo   3^) Start WeKan in the VirtualBox VM
echo   4^) Stop WeKan in the VirtualBox VM
set "choice="
set /p "choice=Choose: "
if "%choice%"=="1" call :rel_run "releases/virtualbox/ipaddress.sh" ""
if "%choice%"=="2" call :rel_run "releases/virtualbox/node-allow-port-80.sh" ""
if "%choice%"=="3" call :rel_run "releases/virtualbox/start-wekan.sh" ""
if "%choice%"=="4" call :rel_run "releases/virtualbox/stop-wekan.sh" ""
if "%choice%"=="0" goto menu_releases
goto rel_serverandvm

REM ---------------------------------------------------------------------------
REM  Run one releases/ script: %1 = path (may carry arguments), %2 = the
REM  prompt for its argument, empty when it takes none.
:rel_run
set "RS=%~1"
set "RP=%~2"
set "RA="
if "%RP%"=="" goto rel_run_go
set /p "RA=%RP%: "
:rel_run_go
call :need_bash
if errorlevel 1 goto :eof
echo.
echo --- %RS% %RA% ---
echo %RS%| findstr /I /C:".mjs" >nul
if errorlevel 1 goto rel_run_bash
call node %RS% %RA%
goto rel_run_done
:rel_run_bash
call bash %RS% %RA%
:rel_run_done
goto :eof

REM ---------------------------------------------------------------------------
REM  Run one COMMAND (the entries that used to be one-line wrapper scripts):
REM  %1 = the command, %2 = the prompt for its argument. Through bash, so the
REM  ^&^& in a command means what it means everywhere else.
:rel_cmd
set "RC=%~1"
set "RP=%~2"
set "RA="
if "%RP%"=="" goto rel_cmd_go
set /p "RA=%RP%: "
:rel_cmd_go
call :need_bash
if errorlevel 1 goto :eof
echo.
echo --- !RC! !RA! ---
call bash -c "!RC! !RA!"
goto :eof

REM ---------------------------------------------------------------------------
:need_bash
where bash >nul 2>&1
if errorlevel 1 (
	echo bash not found - the releases scripts need Git Bash, bundled with Git for Windows.
	echo Install Git for Windows, or run this under WSL2 with build.sh.
	exit /b 1
)
exit /b 0

REM ===========================================================================
REM  CLI: run any of the above without the menu.
REM    build.bat ^<name^> [arguments]   run one entry
REM    build.bat --list                every name, with what it does
REM    build.bat --help                usage and examples
:cli_help
echo WeKan build.bat - menu, or a command line.
echo.
echo   build.bat                          the menu
echo   build.bat --help                   this text
echo   build.bat --list                   every command name, with what it does
echo   build.bat ^<name^> [arguments]       run one, without the menu
echo.
echo Examples:
echo.
echo   build.bat release-all              push the CHANGELOG, trigger the release
echo   build.bat version                  show the version numbers this would release
echo   build.bat rebuild-docs             rebuild wekan.yml + wekan.html
echo   build.bat release-snap 10.50       release the snap of that version
echo   build.bat pull-translations        pull and merge the newest translations
echo   build.bat push-translation ja      push one language to Transifex
echo   build.bat fill-translations        how many strings each language still needs
echo   build.bat add-tag v10.50           tag the release
echo.
echo Arguments after the name are passed to the script unchanged. Names come
echo from --list. The scripts run under Git Bash; systemd/ufw/snap entries are
echo Linux only and are in build.sh instead.
goto :eof

:cli_list
echo   release-all                        Release ALL platforms: push CHANGELOG, trigger release-all.yml
echo   release                            Release ^(older local flow^), for one version   ^<WeKan version, e.g. 10.50^>
echo   version                            Show the version numbers this checkout would release
echo   changelog                          Show the CHANGELOG of the release being prepared
echo   rebuild-docs                       Rebuild the API docs ^(wekan.yml + wekan.html^)
echo   rebuild-release                    Rebuild a release that already exists
echo   rel                                Prepare the release directory for one version   ^<WeKan version, e.g. 10.50^>
echo   release-bundle                     Collect the built bundles for one version   ^<WeKan version, e.g. 10.50^>
echo   release-ln                         Link the newest bundle as wekan-latest   ^<WeKan version, e.g. 10.50^>
echo   release-x2                         Move an old release out of the download directory   ^<WeKan version, e.g. 10.50^>
echo   release-cleanup                    Clean up after a release   ^<WeKan version, e.g. 10.50^>
echo   release-charts                     Publish the Helm chart in wekan/charts
echo   release-website                    Update wekan.fi with the new version and API docs
echo   npm-publish                        Publish the npm packages xet7 maintains
echo   test-download-urls                 Check every download URL snapcraft.yaml uses
echo   clone-release-repos                Clone all release-related repositories
echo   create-github-secrets              Create the GitHub Actions secrets a release needs
echo   add-tag                            Add a git tag for a release   ^<Version tag, e.g. v10.50^>
echo   delete-tag                         Delete a git tag, locally and on the remote   ^<Version tag, e.g. v10.50^>
echo   stable-tag                         Move the 'stable' tag to HEAD
echo   release-ondra-1                    Release the wekan-ondra / wekan-gantt-gpl variants, part 1
echo   release-ondra-2                    Release the wekan-ondra / wekan-gantt-gpl variants, part 2
echo   snap-build                         Build the snap from snapcraft.yaml
echo   snap-install                       Install the locally built .snap
echo   snap-push-to-store                 Push one .snap to the Snap Store   ^<Path to the .snap file^>
echo   release-snap                       Release the snap for one version   ^<WeKan version, e.g. 10.50^>
echo   snap-store-revisions               List the newest Snap Store revisions
echo   snap-store-release-revision-to-channels Release one store revision to edge, beta and candidate   ^<Snap Store revision number^>
echo   snap-release-all-channels Release every snap, every architecture, to all four channels   ^<Version, or empty for the newest^>
echo   snap-edge                          Switch the installed snap to the edge channel
echo   snap-stable                        Switch the installed snap to the stable channel
echo   snapcraft-help                     snapcraft help topics
echo   wekan-snap-help                    wekan.help of the installed snap
echo   switch-kvm-snapcraft-waydroid-virtualbox Switch between KVM, snapcraft, Waydroid and VirtualBox
echo   build-bundle-arm64                 Build the arm64 bundle   ^<WeKan version, e.g. 10.50^>
echo   build-bundle-armhf                 Build the armhf ^(arm/v7^) bundle   ^<WeKan version, e.g. 10.50^>
echo   build-bundle-ppc64el               Build the ppc64el bundle   ^<WeKan version, e.g. 10.50^>
echo   build-bundle-ppc64le               Build the ppc64le bundle   ^<WeKan version, e.g. 10.50^>
echo   build-bundle-s390x                 Build the s390x bundle   ^<WeKan version, e.g. 10.50^>
echo   up                                 Fetch the built bundle from the amd64 build host   ^<WeKan version, e.g. 10.50^>
echo   up-a                               Fetch the built bundle from the arm64 build host   ^<WeKan version, e.g. 10.50^>
echo   up-o                               Fetch the built bundle from the ppc64le build host   ^<WeKan version, e.g. 10.50^>
echo   up-s                               Fetch the built bundle from the s390x build host   ^<WeKan version, e.g. 10.50^>
echo   up-w                               Upload the Windows bundle to the download server   ^<WeKan version, e.g. 10.50^>
echo   docker-build                       Build the WeKan Docker image
echo   docker-build-deps                  Create the multi-platform buildx builder
echo   docker-publish-variant             Publish a variant image ^(wekan-gantt-gpl / wekan-ondra^)   ^<Image and version, e.g. wekan-gantt-gpl 10.50^>
echo   docker-push-gantt                  Push the locally built images to Docker Hub and Quay   ^<Docker build tag and WeKan version^>
echo   docker-registry-sync               Mirror the images between registries with skopeo
echo   install-sandstorm                  Install the Sandstorm-related files
echo   disable-sandstorm                  Disable the Sandstorm files again
echo   sandstorm-make-spk                 Make the .spk package
echo   sandstorm-test-dev                 Run the Sandstorm dev server
echo   release-sandstorm                  Release the Sandstorm version
echo   pull-translations                  Pull the newest translations from Transifex and merge them
echo   fill-translations                  How many strings each language still needs
echo   push-translation                   Push one language to Transifex   ^<Language code, e.g. ja^>
echo   push-all-translations              Push every language to Transifex
echo   push-english-base-translation      Push the English source to Transifex
echo   push-copy-en-gb-translation        Copy the English source into en-GB on Transifex
echo   report-english-regressions         Report English strings that regressed
echo   verify-human-preference            Prove a pull keeps human translations ^(no network^)
echo   merge-translations                 Merge a finished pull by hand
echo   commit                             Commit with the editor open for a multi-line message
echo   git-add-revert                     Add everything, then revert it again   ^<Path to unstage^>
echo   delete-branch-local-and-remote     Delete a branch, locally and on the remote   ^<Branch name^>
echo   count-lines-of-code-per-committer  Count lines of code per committer
echo   stylus-to-css                      Convert the remaining Stylus to CSS
echo   node-update                        Update Node.js everywhere in the sources
echo   node-update-local                  Update the local Node.js version
echo   migrate-mongodb-to-ferretdb        Migrate a MongoDB database to FerretDB ^(--help first^)   ^<Arguments, e.g. --help^>
echo   ipaddress                          Show the VirtualBox VM's IP address
echo   node-allow-port-80                 Let Node.js bind port 80 in the VM
echo   start-wekan                        Start WeKan in the VirtualBox VM
echo   stop-wekan                         Stop WeKan in the VirtualBox VM
goto :eof

:cli_run
set "K=%~1"
set "ARGS=%*"
call set "ARGS=%%ARGS:*%K%=%%"
set "CMD="
set "SHCMD="
if /I "%K%"=="release-all" (set "CMD=bash releases/release-all.sh" ^& goto cli_go)
if /I "%K%"=="release" (set "CMD=bash releases/release.sh" ^& goto cli_go)
if /I "%K%"=="version" (set "CMD=bash releases/version.sh" ^& goto cli_go)
if /I "%K%"=="changelog" (set "CMD=bash releases/changelog.sh" ^& goto cli_go)
if /I "%K%"=="rebuild-docs" (set "CMD=bash releases/rebuild-docs.sh" ^& goto cli_go)
if /I "%K%"=="rebuild-release" (set "CMD=bash releases/rebuild-release.sh" ^& goto cli_go)
if /I "%K%"=="rel" (set "CMD=bash releases/rel.sh" ^& goto cli_go)
if /I "%K%"=="release-bundle" (set "CMD=bash releases/release-bundle.sh" ^& goto cli_go)
if /I "%K%"=="release-ln" (set "CMD=bash releases/release-ln.sh" ^& goto cli_go)
if /I "%K%"=="release-x2" (set "CMD=bash releases/release-x2.sh" ^& goto cli_go)
if /I "%K%"=="release-cleanup" (set "CMD=bash releases/release-cleanup.sh" ^& goto cli_go)
if /I "%K%"=="release-charts" (set "CMD=bash releases/release-charts.sh" ^& goto cli_go)
if /I "%K%"=="backfill-charts" (set "CMD=bash releases/backfill-charts.sh" ^& goto cli_go)
if /I "%K%"=="reindex-charts" (set "CMD=python3 releases/reindex-charts.py" ^& goto cli_go)
if /I "%K%"=="release-website" (set "CMD=bash releases/release-website.sh" ^& goto cli_go)
if /I "%K%"=="npm-publish" (set "CMD=bash releases/npm-publish.sh" ^& goto cli_go)
if /I "%K%"=="test-download-urls" (set "CMD=bash releases/test-download-urls.sh" ^& goto cli_go)
if /I "%K%"=="clone-release-repos" (set "CMD=bash releases/clone-release-repos.sh" ^& goto cli_go)
if /I "%K%"=="create-github-secrets" (set "CMD=bash releases/create-github-secrets.sh" ^& goto cli_go)
if /I "%K%"=="add-tag" (set "CMD=bash releases/add-tag.sh" ^& goto cli_go)
if /I "%K%"=="delete-tag" (set "CMD=bash releases/delete-tag.sh" ^& goto cli_go)
if /I "%K%"=="stable-tag" (set "SHCMD=git tag --force stable HEAD && git push --tags --force && git push --follow-tags" ^& goto cli_go)
if /I "%K%"=="release-ondra-1" (set "CMD=bash releases/release-ondra-1.sh" ^& goto cli_go)
if /I "%K%"=="release-ondra-2" (set "CMD=bash releases/release-ondra-2.sh" ^& goto cli_go)
if /I "%K%"=="snap-build" (set "CMD=bash releases/snap-build.sh" ^& goto cli_go)
if /I "%K%"=="snap-install" (set "CMD=bash releases/snap-install.sh" ^& goto cli_go)
if /I "%K%"=="snap-push-to-store" (set "CMD=bash releases/snap-push-to-store.sh" ^& goto cli_go)
if /I "%K%"=="release-snap" (set "CMD=bash releases/release-snap.sh" ^& goto cli_go)
if /I "%K%"=="snap-store-revisions" (set "CMD=bash releases/snap-store-revisions.sh" ^& goto cli_go)
if /I "%K%"=="snap-store-release-revision-to-channels" (set "CMD=bash releases/snap-store-release-revision-to-channels.sh" ^& goto cli_go)
if /I "%K%"=="snap-release-all-channels" (set "CMD=bash releases/snap-release-all-channels.sh" ^& goto cli_go)
if /I "%K%"=="snap-edge" (set "CMD=bash releases/snap-edge.sh" ^& goto cli_go)
if /I "%K%"=="snap-stable" (set "CMD=bash releases/snap-stable.sh" ^& goto cli_go)
if /I "%K%"=="snapcraft-help" (set "CMD=bash releases/snapcraft-help.sh" ^& goto cli_go)
if /I "%K%"=="wekan-snap-help" (set "CMD=bash releases/wekan-snap-help.sh" ^& goto cli_go)
if /I "%K%"=="switch-kvm-snapcraft-waydroid-virtualbox" (set "CMD=bash releases/switch-kvm-snapcraft-waydroid-virtualbox.sh" ^& goto cli_go)
if /I "%K%"=="build-bundle-arm64" (set "CMD=bash releases/build-bundle-arm64.sh" ^& goto cli_go)
if /I "%K%"=="build-bundle-armhf" (set "CMD=bash releases/build-bundle-armhf.sh" ^& goto cli_go)
if /I "%K%"=="build-bundle-ppc64el" (set "CMD=bash releases/build-bundle-ppc64el.sh" ^& goto cli_go)
if /I "%K%"=="build-bundle-ppc64le" (set "CMD=bash releases/build-bundle-ppc64le.sh" ^& goto cli_go)
if /I "%K%"=="build-bundle-s390x" (set "CMD=bash releases/build-bundle-s390x.sh" ^& goto cli_go)
if /I "%K%"=="up" (set "CMD=bash releases/up.sh" ^& goto cli_go)
if /I "%K%"=="up-a" (set "CMD=bash releases/up-a.sh" ^& goto cli_go)
if /I "%K%"=="up-o" (set "CMD=bash releases/up-o.sh" ^& goto cli_go)
if /I "%K%"=="up-s" (set "CMD=bash releases/up-s.sh" ^& goto cli_go)
if /I "%K%"=="up-w" (set "CMD=bash releases/up-w.sh" ^& goto cli_go)
if /I "%K%"=="docker-build" (set "CMD=bash releases/docker-build.sh" ^& goto cli_go)
if /I "%K%"=="docker-build-deps" (set "CMD=bash releases/docker-build-deps.sh" ^& goto cli_go)
if /I "%K%"=="docker-publish-variant" (set "CMD=bash releases/docker-publish-variant.sh" ^& goto cli_go)
if /I "%K%"=="docker-push-gantt" (set "CMD=bash releases/docker-push-gantt.sh" ^& goto cli_go)
if /I "%K%"=="docker-registry-sync" (set "CMD=bash releases/docker-registry-sync.sh" ^& goto cli_go)
if /I "%K%"=="install-sandstorm" (set "CMD=bash releases/install-sandstorm.sh" ^& goto cli_go)
if /I "%K%"=="disable-sandstorm" (set "CMD=bash releases/disable-sandstorm.sh" ^& goto cli_go)
if /I "%K%"=="sandstorm-make-spk" (set "CMD=bash releases/sandstorm-make-spk.sh" ^& goto cli_go)
if /I "%K%"=="sandstorm-test-dev" (set "CMD=bash releases/sandstorm-test-dev.sh" ^& goto cli_go)
if /I "%K%"=="release-sandstorm" (set "CMD=bash releases/release-sandstorm.sh" ^& goto cli_go)
if /I "%K%"=="pull-translations" (set "CMD=bash releases/translations/pull-translations.sh" ^& goto cli_go)
if /I "%K%"=="fill-translations" (set "CMD=node releases/translations/fill-translations.mjs --missing" ^& goto cli_go)
if /I "%K%"=="push-translation" (set "CMD=bash releases/translations/push-translation.sh" ^& goto cli_go)
if /I "%K%"=="push-all-translations" (set "CMD=bash releases/translations/push-all-translations.sh" ^& goto cli_go)
if /I "%K%"=="push-english-base-translation" (set "CMD=bash releases/translations/push-english-base-translation.sh" ^& goto cli_go)
if /I "%K%"=="push-copy-en-gb-translation" (set "CMD=bash releases/translations/push-copy-en-gb-translation.sh" ^& goto cli_go)
if /I "%K%"=="report-english-regressions" (set "CMD=node releases/translations/report-english-regressions.mjs" ^& goto cli_go)
if /I "%K%"=="verify-human-preference" (set "CMD=node releases/translations/verify-human-preference.mjs" ^& goto cli_go)
if /I "%K%"=="merge-translations" (set "CMD=node releases/translations/merge-translations.mjs" ^& goto cli_go)
REM `git pull` and `git push` are shell functions in build.sh, not scripts in
REM releases/, so this answers to the same two names with its own labels - the
REM ones the interactive menu already uses.
if /I "%K%"=="git-pull" (goto gitpull)
if /I "%K%"=="git-push" (goto gitpush)
if /I "%K%"=="commit" (set "CMD=bash releases/commit.sh" ^& goto cli_go)
if /I "%K%"=="git-add-revert" (set "SHCMD=git restore --staged" ^& goto cli_go)
if /I "%K%"=="delete-branch-local-and-remote" (set "CMD=bash releases/delete-branch-local-and-remote.sh" ^& goto cli_go)
if /I "%K%"=="count-lines-of-code-per-committer" (set "CMD=bash releases/count-lines-of-code-per-committer.sh" ^& goto cli_go)
if /I "%K%"=="stylus-to-css" (set "CMD=bash releases/stylus-to-css.sh" ^& goto cli_go)
if /I "%K%"=="node-update" (set "CMD=bash releases/node-update.sh" ^& goto cli_go)
if /I "%K%"=="node-update-local" (set "CMD=bash releases/node-update-local.sh" ^& goto cli_go)
if /I "%K%"=="migrate-mongodb-to-ferretdb" (set "CMD=node releases/migrate-mongodb-to-ferretdb.mjs" ^& goto cli_go)
if /I "%K%"=="ipaddress" (set "CMD=bash releases/virtualbox/ipaddress.sh" ^& goto cli_go)
if /I "%K%"=="node-allow-port-80" (set "CMD=bash releases/virtualbox/node-allow-port-80.sh" ^& goto cli_go)
if /I "%K%"=="start-wekan" (set "CMD=bash releases/virtualbox/start-wekan.sh" ^& goto cli_go)
if /I "%K%"=="stop-wekan" (set "CMD=bash releases/virtualbox/stop-wekan.sh" ^& goto cli_go)
echo build.bat: no command called "%K%".
echo Try: build.bat --list
exit /b 2
:cli_go
call :need_bash
if errorlevel 1 exit /b 1
if not "!SHCMD!"=="" goto cli_go_sh
call !CMD! !ARGS!
exit /b %errorlevel%
:cli_go_sh
call bash -c "!SHCMD! !ARGS!"
exit /b %errorlevel%

REM ===========================================================================
:menu_cli
echo.
call :cli_help
echo.
echo Commands:
call :cli_list
goto menu


REM ===========================================================================
:menu_docker
echo.
echo -- Docker: pick a backend --   ^(0 = Back^)
echo   1^) FerretDB v1 SQLite ^(default^)     ^(docker-compose.yml^)
echo   2^) FerretDB v1 PostgreSQL            ^(docker-compose-ferretdb-v1-postgresql.yml^)
echo   3^) FerretDB v1 MySQL ^(experimental^)   ^(docker-compose-ferretdb-v1-mysql.yml^)
echo   4^) FerretDB v1 MariaDB ^(experimental^) ^(docker-compose-ferretdb-v1-mariadb.yml^)
echo   5^) FerretDB v1 SAP HANA ^(experimental^)^(docker-compose-ferretdb-v1-sap-hana.yml^)
echo   6^) FerretDB v2 PostgreSQL            ^(docker-compose-ferretdb-v2-postgresql.yml^)
echo   7^) MongoDB 7                         ^(docker-compose-mongodb-v7.yml^)
echo   8^) MongoDB Multitenancy              ^(docker-compose-multitenancy.yml^)
set "choice="
set /p "choice=Backend: "
if "%choice%"=="0" goto menu
set "CF="
if "%choice%"=="1" set "CF=docker-compose.yml"
if "%choice%"=="2" set "CF=docker-compose-ferretdb-v1-postgresql.yml"
if "%choice%"=="3" set "CF=docker-compose-ferretdb-v1-mysql.yml"
if "%choice%"=="4" set "CF=docker-compose-ferretdb-v1-mariadb.yml"
if "%choice%"=="5" set "CF=docker-compose-ferretdb-v1-sap-hana.yml"
if "%choice%"=="6" set "CF=docker-compose-ferretdb-v2-postgresql.yml"
if "%choice%"=="7" set "CF=docker-compose-mongodb-v7.yml"
if "%choice%"=="8" set "CF=docker-compose-multitenancy.yml"
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
REM Two entries, one build. :build adds what a RELEASE bundle is on top of
REM :builddev, and both share :buildcommon - so the plain build cannot drift
REM from the one the release steps run on.
:builddev
echo Building the WeKan DEVELOPMENT bundle ^(plain meteor build^).
call :buildcommon
if errorlevel 1 goto end
echo.
echo Done. This is NOT what a release ships: it still has the legacy client, the
echo source maps and uWebSockets.js, and no Node.js, FerretDB or launcher of its
echo own. Use "Build WeKan release bundle" to find out whether a release starts.
goto end

REM ===========================================================================
:build
echo Building the WeKan RELEASE bundle.
call :buildcommon
if errorlevel 1 goto end
REM THE REST OF WHAT A RELEASE BUNDLE IS - the same steps as the Release All
REM workflow for this platform, minus the .zip: the server's npm modules, the
REM three prunes, the sockjs / legacy-client / source-map trim, a verified
REM Node.js, FerretDB, the MongoDB Database Tools and start-wekan.bat. So this
REM entry answers whether the bundle a release would publish starts here, which
REM `meteor build` on its own never could.
REM
REM Through bash, like the git actions above and for the same reason: this is
REM releases/build-release-bundle.sh, the script the release itself runs, not a
REM batch copy of it that would drift from it.
where bash >nul 2>&1
if errorlevel 1 (
  echo.
  echo WARNING: bash was not found, so .build\bundle is a plain `meteor build`
  echo          bundle - no Node.js, no FerretDB, no launcher, nothing trimmed.
  echo          bash comes with Git for Windows ^(Git Bash^) and with WSL.
  goto end
)
bash releases/build-release-bundle.sh .build/bundle
echo Done.
goto end

REM ===========================================================================
REM The part both build entries do: clear the rspack dev-build caches (_build and
REM node_modules\.cache) so the next `meteor run` recompiles from scratch instead
REM of serving stale modules, then build the bundle.
:buildcommon
if exist "%REPO%\node_modules"        rmdir /s /q "%REPO%\node_modules"
if exist "%REPO%\node_modules\.cache" rmdir /s /q "%REPO%\node_modules\.cache"
if exist "%REPO%\.meteor\local"       rmdir /s /q "%REPO%\.meteor\local"
if exist "%REPO%\.build"              rmdir /s /q "%REPO%\.build"
if exist "%REPO%\_build"              rmdir /s /q "%REPO%\_build"
call meteor update --npm
call meteor npm install
call meteor build .build --directory
if not exist "%REPO%\.build\bundle\main.js" (
  echo ERROR: the build produced no .build\bundle\main.js.
  exit /b 1
)
exit /b 0

REM ===========================================================================
:gitpull
REM Both git actions are build.sh's git_pull / git_push, run through bash rather
REM than written a second time here. What they do - fast-forward or rebase,
REM repoint the CHANGELOG links a rebase moved, abort a conflicting rebase so the
REM repo is left exactly as it was, pull-and-retry once when a push is rejected -
REM is shell logic, and the batch copy of the old "Update git" that used to live
REM here is why this file drifted: it reimplemented the same steps, so a fix to
REM one never reached the other.
where bash >nul 2>&1
if errorlevel 1 (
  echo ERROR: bash was not found. It comes with Git for Windows ^(Git Bash^) and with WSL.
  goto end
)
bash ./build.sh git-pull
goto end

REM ===========================================================================
:gitpush
where bash >nul 2>&1
if errorlevel 1 (
  echo ERROR: bash was not found. It comes with Git for Windows ^(Git Bash^) and with WSL.
  goto end
)
bash ./build.sh git-push
goto end

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

:dev_customurl
REM Parity with build.sh's "CUSTOM PORT + SUBDOMAIN": ask for the port and the
REM ROOT_URL host. An empty answer or a bare name is local, so the port is added;
REM a full URL or a dotted name is public/proxied and the port is NOT added -
REM the same rule build.sh's ask_dev_url applies.
call :ensure_dirs
set "DEV_PORT="
set /p "DEV_PORT=Port for the dev server to listen on [3000]: "
if not defined DEV_PORT set "DEV_PORT=3000"
echo ROOT_URL: empty or a bare name = local ^(the port is added^);
echo           a full URL or a dotted name = public/proxied ^(the port is NOT added^).
set "DEV_HOST="
set /p "DEV_HOST=ROOT_URL [http://localhost:%DEV_PORT%]: "
if not defined DEV_HOST set "DEV_HOST=localhost"
set "DEV_ROOT_URL="
echo %DEV_HOST% | findstr /r /c:"^^https*://" >nul && set "DEV_ROOT_URL=%DEV_HOST%"
if not defined DEV_ROOT_URL echo %DEV_HOST% | findstr /r /c:"\." >nul && set "DEV_ROOT_URL=https://%DEV_HOST%"
if not defined DEV_ROOT_URL set "DEV_ROOT_URL=http://%DEV_HOST%:%DEV_PORT%"
echo ROOT_URL=%DEV_ROOT_URL%
call :set_dev_env
set "ROOT_URL=%DEV_ROOT_URL%"
call :runlog --port %DEV_PORT%
goto end

:dev_killall
call :kill_all_dev_servers
goto end

REM ===========================================================================
:test_all_parallel
REM Clear anything a previous run left listening before starting: cmd cannot
REM trap Ctrl-C, so an interrupted run's database outlives it, and the harness
REM would REUSE it (it reuses a database that answers) with data this run never
REM seeded. build.sh does this with a trap on the way out; here it is done on
REM the way in, which covers the same gap.
call :stop_test_databases
echo Running ALL tests against ONE WeKan server on http://localhost:3000 - all jobs run IN PARALLEL (concurrently). Needs plenty of RAM (fine on 32 GB).
echo Two WeKan servers are involved:
echo   :3000  - the PRECOMPILED .build\bundle run as a plain Node server (Meteor's mongod on :3001, db "meteor")
echo            - serves Node E2E + Playwright browser tests. Built fresh above, so the tests run against the current source.
echo   :3100  - Mocha via 'meteor test' (its own .meteor\local-test build; the in-process server-side tests
echo            CANNOT run from a production bundle, so this one build is unavoidable).
echo   Import regression is a plain Node script (no server, no MongoDB).
curl -fsS http://127.0.0.1:3000 >nul 2>&1
if not errorlevel 1 (
	echo ERROR: Port 3000 is already in use. Stop any running dev server before running this option.
	goto end
)

REM Parity with build.sh: the tests ALWAYS run against a freshly built bundle. The
REM :3000 server runs the precompiled .build\bundle, so a stale bundle means the
REM suite passes or fails on code that is no longer in the working tree.
call :rebuild_for_tests
if errorlevel 1 goto end

set "FAILED=0"
set "S_mocha=RUN" & set "S_unit=RUN" & set "S_import=RUN" & set "S_e2e=RUN"
set "S_chromium=RUN" & set "S_firefox=RUN" & set "S_webkit=RUN"
set "C_mocha=0" & set "C_unit=0" & set "C_import=0" & set "C_e2e=0"
set "C_chromium=0" & set "C_firefox=0" & set "C_webkit=0"
REM Each run gets its own .tools\log\<timestamp>\ dir (stamped once at run start), so
REM logs are never overwritten and previous runs are kept. PowerShell gives a
REM locale-independent yyyy-MM-dd_HH-mm-ss; %RUN_LOGDIR% is absolute so it works
REM from any job's working directory (e.g. the browser job runs in tests\playwright).
for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format yyyy-MM-dd_HH-mm-ss"') do set "RUN_TS=%%i"
set "RUN_LOGDIR=%REPO%\.tools\log\%RUN_TS%"
if not exist "%RUN_LOGDIR%" md "%RUN_LOGDIR%"
echo Logs for this run: %RUN_LOGDIR%\  - previous runs are kept
REM Clear completion flags from any previous run.
del /q ".done-mocha" ".done-unit" ".done-import" ".done-e2e" ".done-chromium" ".done-firefox" ".done-webkit" 2>nul

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
echo ==^> Starting Mocha (separate .meteor\local-test build, port 3100), the node unit suites and the import regression in parallel.
start "Wekan mocha" /MIN /D "%REPO%" cmd /c "set METEOR_LOCAL_DIR=.meteor\local-test&& (echo ===== Mocha [M2 node:3100 db:3101] test run: %DATE% %TIME% =====) 1>%RUN_LOGDIR%\wekan-alltests-mocha.log 2>&1 & call meteor test --once --driver-package meteortesting:mocha --port 3100 1>>%RUN_LOGDIR%\wekan-alltests-mocha.log 2>&1 & if errorlevel 1 (echo FAIL>.done-mocha) else (echo PASS>.done-mocha)"
start "Wekan unit" /MIN /D "%REPO%" cmd /c "(echo ===== Unit tests (node) [no server] test run: %DATE% %TIME% =====) 1>%RUN_LOGDIR%\wekan-alltests-unit.log 2>&1 & call meteor npm run test:unit:all 1>>%RUN_LOGDIR%\wekan-alltests-unit.log 2>&1 & if errorlevel 1 (echo FAIL>.done-unit) else (echo PASS>.done-unit)"
start "Wekan import" /MIN /D "%REPO%" cmd /c "(echo ===== Import regression [no server] test run: %DATE% %TIME% =====) 1>%RUN_LOGDIR%\wekan-alltests-import.log 2>&1 & call node tests\wekanCreator.import.test.js 1>>%RUN_LOGDIR%\wekan-alltests-import.log 2>&1 & if errorlevel 1 (echo FAIL>.done-import) else (echo PASS>.done-import)"

if "!SERVER_READY!"=="0" (
	echo FAIL: server did not become ready on http://localhost:3000 ^(see %RUN_LOGDIR%\wekan-test-server.log^)
	set "S_e2e=SKIP" & set "S_chromium=SKIP" & set "S_firefox=SKIP" & set "S_webkit=SKIP" & set "FAILED=1"
) else (
	echo ==^> Server is up: starting Node E2E and Playwright ^(Chromium, Firefox and WebKit as three separate jobs^) in parallel.
	start "Wekan e2e" /MIN /D "%REPO%" cmd /c "(echo ===== Node E2E [M1 node:3000 db:3001] test run: %DATE% %TIME% =====) 1>%RUN_LOGDIR%\wekan-alltests-e2e.log 2>&1 & call meteor npm run test:e2e 1>>%RUN_LOGDIR%\wekan-alltests-e2e.log 2>&1 & if errorlevel 1 (echo FAIL>.done-e2e) else (echo PASS>.done-e2e)"
	REM One job, one log, one summary row PER BROWSER - the same shape build.sh
	REM produces. A single combined "browsers" job wrote one wekan-alltests-browsers.log
	REM for all three, so "which browser failed, and what did WebKit print" could not
	REM be answered from the logs, and CLAUDE.md's "check the newest test logs" names
	REM the per-browser files. --output keeps each browser's artifacts in its own
	REM directory, or the three would clear each other's at startup.
	call :start_browser_job chromium
	call :start_browser_job firefox
	call :start_browser_job webkit
)

REM Live progress: re-print a status line every ~3s until all expected jobs
REM have written their .done flag (cmd has no native wait).
echo Live progress (refreshes every few seconds) - RUN / PASS / FAIL per job:
:wait_all
call :jstate mocha
call :jstate unit
call :jstate import
call :jcount C_mocha check "%RUN_LOGDIR%\wekan-alltests-mocha.log"
call :jcount C_unit unit "%RUN_LOGDIR%\wekan-alltests-unit.log"
call :jcount C_import check "%RUN_LOGDIR%\wekan-alltests-import.log"
if "!SERVER_READY!"=="1" (
	call :jstate e2e
	call :jstate chromium
	call :jstate firefox
	call :jstate webkit
	call :jcount C_e2e e2e "%RUN_LOGDIR%\wekan-alltests-e2e.log"
	call :jcount C_chromium check "%RUN_LOGDIR%\wekan-alltests-chromium.log"
	call :jcount C_firefox check "%RUN_LOGDIR%\wekan-alltests-firefox.log"
	call :jcount C_webkit check "%RUN_LOGDIR%\wekan-alltests-webkit.log"
)
echo   mocha [M2 :3100/db:3101] !S_mocha! tests:!C_mocha!  ^| unit [no server] !S_unit! tests:!C_unit!  ^| import [no server] !S_import! tests:!C_import!  ^| e2e [M1 :3000/db:3001] !S_e2e! tests:!C_e2e!
echo   chromium !S_chromium! tests:!C_chromium!  ^| firefox !S_firefox! tests:!C_firefox!  ^| webkit !S_webkit! tests:!C_webkit!   [all three on M1 :3000/db:3001]
set "ALLDONE=1"
if not exist ".done-mocha" set "ALLDONE=0"
if not exist ".done-unit" set "ALLDONE=0"
if not exist ".done-import" set "ALLDONE=0"
if "!SERVER_READY!"=="1" (
	if not exist ".done-e2e" set "ALLDONE=0"
	if not exist ".done-chromium" set "ALLDONE=0"
	if not exist ".done-firefox" set "ALLDONE=0"
	if not exist ".done-webkit" set "ALLDONE=0"
)
if "!ALLDONE!"=="0" (
	ping -n 4 127.0.0.1 >nul
	goto wait_all
)

echo.
call :stop_test_databases

REM Final pass/fail per job (RUN means it never wrote a flag = treat as FAIL).
if "!S_mocha!"=="FAIL" set "FAILED=1"
if "!S_unit!"=="FAIL" set "FAILED=1"
if "!S_import!"=="FAIL" set "FAILED=1"
if "!S_e2e!"=="FAIL" set "FAILED=1"
if "!S_chromium!"=="FAIL" set "FAILED=1"
if "!S_firefox!"=="FAIL" set "FAILED=1"
if "!S_webkit!"=="FAIL" set "FAILED=1"

echo.
echo ==================== TEST SUMMARY ====================
call :report "!S_mocha!"     "Mocha (server-side)"                  "[M2 :3100/db:3101] tests:!C_mocha!"
call :report "!S_unit!"      "Unit tests (node)"                    "[no server]        tests:!C_unit!"
call :report "!S_import!"    "Import regression"                    "[no server]        tests:!C_import!"
if "!SERVER_READY!"=="1" ( call :report "PASS" "Server startup" "[M1 :3000/db:3001]" ) else ( call :report "FAIL" "Server startup" "[M1 :3000/db:3001]" )
call :report "!S_e2e!"       "Node E2E regressions"                 "[M1 :3000/db:3001] tests:!C_e2e!"
call :report "!S_chromium!"  "Playwright Chromium"                  "[M1 :3000/db:3001] tests:!C_chromium!"
call :report "!S_firefox!"   "Playwright Firefox"                   "[M1 :3000/db:3001] tests:!C_firefox!"
call :report "!S_webkit!"    "Playwright WebKit"                    "[M1 :3000/db:3001] tests:!C_webkit!"
echo =====================================================
echo (per-job logs in: %RUN_LOGDIR%\  as wekan-alltests-^<mocha^|unit^|import^|e2e^|chromium^|firefox^|webkit^>.log and wekan-test-server.log)
if "!FAILED!"=="0" ( echo RESULT: All tests passed. ) else ( echo RESULT: Some tests FAILED ^(see details above^). )
goto end

REM ===========================================================================
:test_all_sequential
REM Clear anything a previous run left listening before starting: cmd cannot
REM trap Ctrl-C, so an interrupted run's database outlives it, and the harness
REM would REUSE it (it reuses a database that answers) with data this run never
REM seeded. build.sh does this with a trap on the way out; here it is done on
REM the way in, which covers the same gap.
call :stop_test_databases
echo Running ALL tests against ONE WeKan server on http://localhost:3000 - all jobs run SEQUENTIALLY (one at a time).
echo Two WeKan servers are involved (they do NOT run tests in parallel; the suites run one at a time):
echo   :3000  - the PRECOMPILED .build\bundle run as a plain Node server (Meteor's mongod on :3001, db "meteor")
echo            - serves Node E2E + Playwright browser tests. Built fresh above, so the tests run against the current source.
echo   :3100  - Mocha via 'meteor test' (its own .meteor\local-test build; the in-process server-side tests
echo            CANNOT run from a production bundle, so this one build is unavoidable).
echo   Import regression is a plain Node script (no server, no MongoDB).
curl -fsS http://127.0.0.1:3000 >nul 2>&1
if not errorlevel 1 (
	echo ERROR: Port 3000 is already in use. Stop any running dev server before running this option.
	goto end
)

REM Parity with build.sh: the tests ALWAYS run against a freshly built bundle. The
REM :3000 server runs the precompiled .build\bundle, so a stale bundle means the
REM suite passes or fails on code that is no longer in the working tree.
call :rebuild_for_tests
if errorlevel 1 goto end

set "FAILED=0"
set "S_mocha=RUN" & set "S_unit=RUN" & set "S_import=RUN" & set "S_e2e=RUN"
set "S_chromium=RUN" & set "S_firefox=RUN" & set "S_webkit=RUN"
set "C_mocha=0" & set "C_unit=0" & set "C_import=0" & set "C_e2e=0"
set "C_chromium=0" & set "C_firefox=0" & set "C_webkit=0"
REM Each run gets its own .tools\log\<timestamp>\ dir (stamped once at run start), so
REM logs are never overwritten and previous runs are kept. PowerShell gives a
REM locale-independent yyyy-MM-dd_HH-mm-ss; %RUN_LOGDIR% is absolute so it works
REM from any job's working directory (e.g. the browser job runs in tests\playwright).
for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format yyyy-MM-dd_HH-mm-ss"') do set "RUN_TS=%%i"
set "RUN_LOGDIR=%REPO%\.tools\log\%RUN_TS%"
if not exist "%RUN_LOGDIR%" md "%RUN_LOGDIR%"
echo Logs for this run: %RUN_LOGDIR%\  - previous runs are kept
REM Clear completion flags from any previous run.
del /q ".done-mocha" ".done-unit" ".done-import" ".done-e2e" ".done-chromium" ".done-firefox" ".done-webkit" 2>nul

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

echo ==^> Running the node unit suites [plain Node, no Meteor / no MongoDB]: test:unit:all. Full log: %RUN_LOGDIR%\wekan-alltests-unit.log
start "Wekan unit" /MIN /D "%REPO%" cmd /c "(echo ===== Unit tests (node) [no server] test run: %DATE% %TIME% =====) 1>%RUN_LOGDIR%\wekan-alltests-unit.log 2>&1 & call meteor npm run test:unit:all 1>>%RUN_LOGDIR%\wekan-alltests-unit.log 2>&1 & if errorlevel 1 (echo FAIL>.done-unit) else (echo PASS>.done-unit)"
call :seq_run_wait unit unit C_unit "%RUN_LOGDIR%\wekan-alltests-unit.log"

echo ==^> Running import regression [plain Node, no Meteor / no MongoDB]. Full log: %RUN_LOGDIR%\wekan-alltests-import.log
start "Wekan import" /MIN /D "%REPO%" cmd /c "(echo ===== Import regression [no server] test run: %DATE% %TIME% =====) 1>%RUN_LOGDIR%\wekan-alltests-import.log 2>&1 & call node tests\wekanCreator.import.test.js 1>>%RUN_LOGDIR%\wekan-alltests-import.log 2>&1 & if errorlevel 1 (echo FAIL>.done-import) else (echo PASS>.done-import)"
call :seq_run_wait import check C_import "%RUN_LOGDIR%\wekan-alltests-import.log"

if "!SERVER_READY!"=="0" goto skip_server_jobs
echo ==^> Running Node E2E regressions on Meteor #1 [Node.js :3000, MongoDB :3001]. Full log: %RUN_LOGDIR%\wekan-alltests-e2e.log
start "Wekan e2e" /MIN /D "%REPO%" cmd /c "(echo ===== Node E2E [M1 node:3000 db:3001] test run: %DATE% %TIME% =====) 1>%RUN_LOGDIR%\wekan-alltests-e2e.log 2>&1 & call meteor npm run test:e2e 1>>%RUN_LOGDIR%\wekan-alltests-e2e.log 2>&1 & if errorlevel 1 (echo FAIL>.done-e2e) else (echo PASS>.done-e2e)"
call :seq_run_wait e2e e2e C_e2e "%RUN_LOGDIR%\wekan-alltests-e2e.log"

echo ==^> Running Playwright Chromium, Firefox and WebKit one browser at a time on Meteor #1 [Node.js :3000, MongoDB :3001].
REM One job, one log and one summary row per browser, as build.sh does. The
REM combined run wrote a single wekan-alltests-browsers.log for all three, so
REM neither "which browser failed" nor "what did WebKit print" was answerable
REM from the logs afterwards - and CLAUDE.md's "check the newest test logs"
REM names wekan-alltests-chromium.log, -firefox.log and -webkit.log.
call :start_browser_job chromium
call :seq_run_wait chromium check C_chromium "%RUN_LOGDIR%\wekan-alltests-chromium.log"
call :start_browser_job firefox
call :seq_run_wait firefox check C_firefox "%RUN_LOGDIR%\wekan-alltests-firefox.log"
call :start_browser_job webkit
call :seq_run_wait webkit check C_webkit "%RUN_LOGDIR%\wekan-alltests-webkit.log"
goto server_jobs_done

:skip_server_jobs
echo FAIL: server did not become ready on http://localhost:3000 ^(see %RUN_LOGDIR%\wekan-test-server.log^)
set "S_e2e=SKIP" & set "S_chromium=SKIP" & set "S_firefox=SKIP" & set "S_webkit=SKIP" & set "FAILED=1"

:server_jobs_done

echo.
call :stop_test_databases

REM Final pass/fail per job (RUN means it never wrote a flag = treat as FAIL).
if "!S_mocha!"=="FAIL" set "FAILED=1"
if "!S_unit!"=="FAIL" set "FAILED=1"
if "!S_import!"=="FAIL" set "FAILED=1"
if "!S_e2e!"=="FAIL" set "FAILED=1"
if "!S_chromium!"=="FAIL" set "FAILED=1"
if "!S_firefox!"=="FAIL" set "FAILED=1"
if "!S_webkit!"=="FAIL" set "FAILED=1"

REM Count passing tests per job from each log (advances shown in the summary).
call :jcount C_mocha check "%RUN_LOGDIR%\wekan-alltests-mocha.log"
call :jcount C_unit unit "%RUN_LOGDIR%\wekan-alltests-unit.log"
call :jcount C_import check "%RUN_LOGDIR%\wekan-alltests-import.log"
call :jcount C_e2e e2e "%RUN_LOGDIR%\wekan-alltests-e2e.log"
call :jcount C_chromium check "%RUN_LOGDIR%\wekan-alltests-chromium.log"
call :jcount C_firefox check "%RUN_LOGDIR%\wekan-alltests-firefox.log"
call :jcount C_webkit check "%RUN_LOGDIR%\wekan-alltests-webkit.log"

echo.
echo ==================== TEST SUMMARY ====================
call :report "!S_mocha!"     "Mocha (server-side)"                  "[M2 :3100/db:3101] tests:!C_mocha!"
call :report "!S_unit!"      "Unit tests (node)"                    "[no server]        tests:!C_unit!"
call :report "!S_import!"    "Import regression"                    "[no server]        tests:!C_import!"
if "!SERVER_READY!"=="1" ( call :report "PASS" "Server startup" "[M1 :3000/db:3001]" ) else ( call :report "FAIL" "Server startup" "[M1 :3000/db:3001]" )
call :report "!S_e2e!"       "Node E2E regressions"                 "[M1 :3000/db:3001] tests:!C_e2e!"
call :report "!S_chromium!"  "Playwright Chromium"                  "[M1 :3000/db:3001] tests:!C_chromium!"
call :report "!S_firefox!"   "Playwright Firefox"                   "[M1 :3000/db:3001] tests:!C_firefox!"
call :report "!S_webkit!"    "Playwright WebKit"                    "[M1 :3000/db:3001] tests:!C_webkit!"
echo =====================================================
echo (per-job logs in: %RUN_LOGDIR%\  as wekan-alltests-^<mocha^|unit^|import^|e2e^|chromium^|firefox^|webkit^>.log and wekan-test-server.log)
if "!FAILED!"=="0" ( echo RESULT: All tests passed. ) else ( echo RESULT: Some tests FAILED ^(see details above^). )
goto end

REM ===========================================================================
:test_mocha
call :onelog mocha
call :tee test_mocha_body
goto end

:test_mocha_body
echo Running Mocha tests: meteor test --once --driver-package meteortesting:mocha --port 3100
echo (server-side unit/security/API-logic tests; browser/client tests are covered by Playwright options)
call meteor test --once --driver-package meteortesting:mocha --port 3100
exit /b 0

:test_import
call :onelog import
call :tee test_import_body
goto end

:test_import_body
echo Running import regression test (node, no server needed).
call node tests\wekanCreator.import.test.js
exit /b 0

:test_e2e
call :onelog e2e
call :tee test_e2e_body
goto end

:test_e2e_body
echo Running Node E2E regressions (puppeteer).
echo NOTE: needs a WeKan server with WITH_API=true on http://localhost:3000.
echo       Start one yourself first, or use a whole-suite option, which starts it.
call meteor npm run test:e2e
exit /b 0

:install_pw_browsers
REM Parity with build.sh's "Install Playwright browsers". Windows has no Docker
REM fallback here (build.sh uses one for WebKit on Linux arm64), so all three are
REM installed natively, with their system dependencies.
echo Installing Playwright test dependencies and browsers ^(Chromium, Firefox, WebKit^).
cd /d "%REPO%\tests\playwright"
call meteor npm install
call meteor npm exec playwright install --with-deps chromium firefox webkit
echo Done. Run a browser suite from the Tests menu.
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
echo NOTE: needs a WeKan server running on http://localhost:3000 (a whole-suite option starts it).
cd /d "%REPO%\tests\playwright"
set "WEKAN_PLAYWRIGHT_ALL=1"
set "INSTALL_DEPS="
set /p "INSTALL_DEPS=Install Playwright test dependencies and browsers first? [y/N] "
if /i "%INSTALL_DEPS%"=="y" (
	call meteor npm install
	call meteor npm exec playwright install %PW_PROJECT%
)
call :onelog playwright-%PW_PROJECT%
call meteor npm exec playwright test -- --project=%PW_PROJECT% 2>&1 | powershell -NoProfile -Command "$input | Tee-Object -FilePath '%ONELOG%'"
goto end

REM ===========================================================================
:test_pw_parallel
echo Running Chromium, Firefox and WebKit Playwright suites sequentially (one browser at a time).
echo NOTE: needs a WeKan server already running on http://localhost:3000 (Dev menu).
curl -fsS http://127.0.0.1:3000/sign-in >nul 2>&1
if errorlevel 1 (
	echo ERROR: WeKan does not appear to be running on http://localhost:3000.
	echo        Start it first from the Dev menu, then re-run this option.
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

REM One browser at a time, each with its own log - the same as build.sh's
REM run_playwright_parallel, and the same per-browser logs the whole-suite runs
REM write. Running all three concurrently against one dev server uses too much
REM RAM/swap on smaller machines and can crash it, so this stays sequential.
REM
REM It used to be a single `playwright test --project=... --project=...` call
REM with no log at all: everything went to the terminal and there was nothing
REM left to read afterwards, which is what tests/dbConformanceWiring.test.cjs
REM means by "every Tests option writes its log to .tools/log/<datetime>/".
set "PW_ALL_FAILED=0"
for %%B in (chromium firefox webkit) do call :pw_one_browser %%B
if "%PW_ALL_FAILED%"=="1" ( echo RESULT: Some Playwright browsers FAILED ^(see the logs above^). ) else ( echo RESULT: All Playwright browsers passed. )
goto end

:pw_one_browser
REM One browser of the "ALL browsers" option: %1 = chromium^|firefox^|webkit.
REM Streams live AND writes wekan-playwright-^<browser^>.log, via the same
REM :onelog helper every other Tests option uses.
set "PW_PROJECT=%~1"
call :onelog playwright-%PW_PROJECT%
echo ==^> Playwright %PW_PROJECT% ^(one browser at a time^). Log: %ONELOG%
pushd "%REPO%\tests\playwright"
set "WEKAN_PLAYWRIGHT_ALL=1"
call meteor npm exec playwright test -- --project=%PW_PROJECT% --output=test-results\%PW_PROJECT% --reporter=list 2>&1 | powershell -NoProfile -Command "$input | Tee-Object -FilePath '%ONELOG%'"
if errorlevel 1 set "PW_ALL_FAILED=1"
popd
exit /b 0

REM ===========================================================================
:check_floating
echo Ensuring missing ESLint dependencies for the no-floating-promises rule.
set "INSTALL_ESLINT="
set /p "INSTALL_ESLINT=Install @typescript-eslint eslint-plugin + parser (devDeps) now? [y/N] "
if /i "%INSTALL_ESLINT%"=="y" call meteor npm install --save-dev @typescript-eslint/eslint-plugin @typescript-eslint/parser

call :onelog floating-promises
call :tee check_floating_body
goto end

:check_floating_body
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
exit /b 0

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
set "DDP_TRANSPORT=sockjs"
set "DEBUG=true"
set "WRITABLE_PATH=.."
set "WITH_API=true"
set "RICHER_CARD_COMMENT_EDITOR=false"
exit /b 0

:onelog
REM Set ONELOG to .tools\log\<datetime>\wekan-%1.log - the same place every other
REM test run writes, so "the newest test logs" is one directory whichever option
REM produced them. A larger run (EVERYTHING) exports WEKAN_LOGDIR first, and then
REM the whole run stays in that one directory. The Windows equivalent of build.sh's
REM one_log().
if defined WEKAN_LOGDIR (
	set "ONELOGDIR=%WEKAN_LOGDIR%"
) else (
	for /f %%T in ('powershell -NoProfile -Command "Get-Date -Format yyyy-MM-dd_HH-mm-ss"') do set "ONELOGDIR=.tools\log\%%T"
)
if not exist "%ONELOGDIR%" md "%ONELOGDIR%" >nul 2>&1
set "ONELOG=%ONELOGDIR%\wekan-%~1.log"
echo Log: %ONELOG%
exit /b 0

:tee
REM Run the subroutine named %1, showing its output live AND copying it to
REM %ONELOG%. cmd has no tee, so the stream goes through PowerShell's Tee-Object,
REM as :runlog does for the dev server.
call :%~1 2>&1 | powershell -NoProfile -Command "$input | Tee-Object -FilePath '%ONELOG%'"
exit /b 0

:runlog
REM Run "meteor run <args>" showing output live AND copying it to
REM .tools\log\wekan-log.log - the Windows equivalent of the .sh's
REM "meteor run ... 2>&1 | tee .tools/log/wekan-log.log". cmd has no built-in tee,
REM so pipe through PowerShell's Tee-Object. %* = all args forwarded to meteor.
REM Note: PowerShell buffers the pipeline, so console output can appear in
REM bursts; the full stream is always captured in the log file.
REM Callers always pass "--port <PORT>" first, so %2 is the port: kill any
REM Meteor dev server already listening there before starting a new one.
call :kill_meteor_on_port %2
if errorlevel 1 exit /b 1
if not exist ".tools\log" md ".tools\log"
call meteor run %* 2>&1 | powershell -NoProfile -Command "$input | Tee-Object -FilePath '.tools\log\wekan-log.log'"
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

:stop_test_databases
REM Stop what a test run started: the bundle server on :3000, the test mongod on
REM :3001 when THIS run launched it, and any database-conformance container.
REM
REM Called at the end of both all-tests flows, and again before a run starts,
REM which is the batch answer to build.sh's trap. cmd cannot trap Ctrl-C, so an
REM interrupted run leaves its database behind; clearing before starting means
REM the next run does not inherit it. That matters because the harness reuses a
REM database only when it ANSWERS - a leftover mongod answers, so it would be
REM reused, holding a database this run never seeded, and the failures would
REM land somewhere else entirely.
echo Stopping WeKan test server (bundle node :3000).
taskkill /FI "WINDOWTITLE eq WekanTestServer*" /T /F >nul 2>&1
if "!MONGOD_STARTED!"=="1" ( echo Stopping test MongoDB ^(mongod :3001^). & taskkill /FI "WINDOWTITLE eq WekanTestMongo*" /T /F >nul 2>&1 )
REM The conformance stage runs each engine in a container named
REM wekan-conformance-db-<timestamp> and removes it when that engine is done. An
REM interrupted run leaves the one it was on, and a container still holding 5432
REM or 3306 fails the next run's engine before it starts.
where docker >nul 2>&1
if not errorlevel 1 (
	for /f %%c in ('docker ps -aq --filter "name=wekan-conformance-db-" 2^>nul') do (
		echo Stopping database-conformance container %%c.
		docker rm -f %%c >nul 2>&1
	)
)
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
if /i "%~2"=="unit" goto jcount_unit
for /f "usebackq delims=" %%n in (`node -e "let n=0;try{n=(require('fs').readFileSync(process.argv[1],'utf8').match(/\u2713/g)||[]).length}catch(e){}process.stdout.write(String(n))" "%~3"`) do set "%~1=%%n"
exit /b 0
:jcount_unit
REM The node suites print "  ok - <name>" per assertion group.
for /f "usebackq delims=" %%n in (`node -e "let n=0;try{n=(require('fs').readFileSync(process.argv[1],'utf8').match(/^\s*ok - /gm)||[]).length}catch(e){}process.stdout.write(String(n))" "%~3"`) do set "%~1=%%n"
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

:rebuild_for_tests
REM Delete .build (and the rspack dev-build caches, as :buildcommon does) and build the
REM WeKan bundle the test server runs. Same steps as Setup -> "Build WeKan", so the
REM two can never drift apart.
echo ==^> Deleting .build and building WeKan before running the tests ^(always, so the tests run against the current source^).
pushd "%REPO%"
if exist "%REPO%\node_modules\.cache" rmdir /s /q "%REPO%\node_modules\.cache"
if exist "%REPO%\.meteor\local"       rmdir /s /q "%REPO%\.meteor\local"
if exist "%REPO%\.build"              rmdir /s /q "%REPO%\.build"
if exist "%REPO%\_build"              rmdir /s /q "%REPO%\_build"
call meteor npm install
call meteor build .build --directory
popd
if not exist "%REPO%\.build\bundle\main.js" (
	echo ERROR: .build\bundle\main.js is missing after building. Aborting the test run.
	exit /b 1
)
exit /b 0

REM ===========================================================================

:start_bundle_server
REM Parity with build.sh: run the :3000 test server from the PRECOMPILED
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

:start_browser_job
REM Start ONE Playwright browser as its own job: %1 = chromium^|firefox^|webkit.
REM
REM One job, one log, one .done flag and one summary row per browser - the same
REM shape build.sh's run_pw_all_browser produces, and what CLAUDE.md means by the
REM per-browser logs in log\^<datetime^>\. The combined three-project run this
REM replaced wrote everything into one wekan-alltests-browsers.log, where a
REM failure could not be attributed to a browser without reading the whole file.
REM
REM --output is per browser as well: Playwright CLEARS its output directory at
REM startup, so three jobs sharing test-results\ would delete each other's traces
REM and screenshots - exactly the artifacts wanted after a failure. The job runs
REM in tests\playwright, so the .done flag is written two levels up, in the repo
REM root, where the wait loops look for it.
if "%~1"=="" exit /b 1
echo ==^> Playwright %~1 on Meteor #1 [Node.js :3000, MongoDB :3001]. Log: %RUN_LOGDIR%\wekan-alltests-%~1.log
start "Wekan %~1" /MIN /D "%REPO%\tests\playwright" cmd /c "set WEKAN_PLAYWRIGHT_ALL=1&& (echo ===== Playwright %~1 [M1 node:3000 db:3001] test run: %DATE% %TIME% =====) 1>%RUN_LOGDIR%\wekan-alltests-%~1.log 2>&1 & call meteor npm exec playwright test -- --project=%~1 --output=test-results\%~1 --reporter=list 1>>%RUN_LOGDIR%\wekan-alltests-%~1.log 2>&1 & if errorlevel 1 (echo FAIL>..\..\.done-%~1) else (echo PASS>..\..\.done-%~1)"
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
call :onelog test-counts
call :tee count_tests_body
goto end

:count_tests_body
REM Print a "by category" summary table for all four test categories that
REM build runs, then the detailed Playwright per-spec table.
REM Counting rules (kept identical to build.sh):
REM   Mocha            it( lines across client/lib/tests + server/lib/tests + imports/i18n
REM   Import regression ^function test lines in tests/wekanCreator.import.test.js
REM   Node E2E         logStep('Testing lines in tests/e2e/list-regressions.js
REM   Playwright       test( / test.only( / test.skip( / test.fixme( lines per spec
REM Uses node (always present here) so parsing matches build.sh exactly;
REM findstr's limited regex engine cannot reproduce these expressions.
node -e "const fs=require('fs'),p=require('path');function rd(f){try{return fs.readFileSync(f,'utf8');}catch(e){return null;}}function cnt(f,re){const s=rd(f);if(s===null)return null;return s.split(/\r?\n/).filter(l=>re.test(l)).length;}function ls(d,suf){try{return fs.readdirSync(d).filter(x=>x.endsWith(suf)).map(x=>p.join(d,x));}catch(e){return [];}}let mocha=0;const mfiles=[].concat(ls('client/lib/tests','.tests.js'),ls('server/lib/tests','.tests.js'),['imports/i18n/i18n.test.js']);for(const f of mfiles){const c=cnt(f,/(^|[^A-Za-z.])it\s*\(/);if(c!==null)mocha+=c;}let imp=cnt('tests/wekanCreator.import.test.js',/^function test/);if(imp===null)imp=0;let ne=cnt('tests/e2e/list-regressions.js',/logStep\('Testing/);if(ne===null)ne=0;const d='tests/playwright/specs';let files=[];try{files=fs.readdirSync(d).filter(f=>f.endsWith('.e2e.js')).sort();}catch(e){}let pw=0;const rows=[];for(const f of files){const m=f.match(/^([0-9]+)/);const spec=m?m[1]:'';let area=f.replace(/^[0-9]+[-_]?/,'').replace(/\.e2e\.js$/,'').replace(/[-_]+/g,' ');area=area.charAt(0).toUpperCase()+area.slice(1);const src=fs.readFileSync(p.join(d,f),'utf8');const c=src.split(/\r?\n/).filter(l=>/(^|[^a-zA-Z.])test(\.(only|skip|fixme))?\s*\(/.test(l)).length;rows.push('| '+spec+' | '+area+' | '+c+' |');pw+=c;}const gt=mocha+imp+ne+pw;console.log('| Category | Tests |');console.log('|----------|-------|');console.log('| Mocha (server + client, meteortesting:mocha) | '+mocha+' |');console.log('| Import regression (tests/wekanCreator.import.test.js) | '+imp+' |');console.log('| Node E2E regressions (tests/e2e/list-regressions.js) | '+ne+' |');console.log('| Playwright e2e specs (tests/playwright/specs/*.e2e.js) | '+pw+' |');console.log('| **Total** | **'+gt+'** |');console.log('');console.log('| Spec | Area | Tests |');console.log('|------|------|-------|');for(const r of rows)console.log(r);console.log('');console.log('**Total: '+pw+' tests**');"
exit /b 0


REM ===========================================================================
:test_all_databases
REM The same thing build.sh's "All databases (sequential)" runs: build the newest
REM FerretDB v1 from .tools\FerretDB (cloning wekan/FerretDB there if it is not
REM there, and installing Go and the module dependencies if they are
REM missing), then run the whole FerretDB v1 query catalogue against every
REM database that has a Docker image for THIS CPU - one at a time, because they
REM all use the same FerretDB port - and compare that they all answered the same.
REM Results go to .tools\log\<datetime>\ with every other test run's.
REM
REM The orchestration is one bash script, shared with build.sh rather than
REM rewritten here: a second implementation would drift, and Docker Desktop on
REM Windows ships bash through Git for Windows / WSL anyway.
where bash >nul 2>&1
if errorlevel 1 (
  echo ERROR: bash was not found. It comes with Git for Windows ^(Git Bash^) and with WSL.
  echo        Install either, or run this from WSL: ./releases/db-conformance.sh
  goto end
)
bash ./releases/db-conformance.sh
goto end

REM ===========================================================================
:test_ferretdb
REM All of FerretDB's own tests, one at a time: unit, vet, integration.
REM
REM FerretDB lives in .tools\FerretDB - companion repos are kept in one directory
REM that .gitignore and .meteorignore already exclude, instead of one ignored
REM subdirectory each at the repo root. It is cloned here when it is not there,
REM the same as build.sh's ensure_tool_repo does, so neither script depends on
REM the other having been run first. Its build.sh installs Go and the Go modules
REM when they are missing, and writes its logs to .tools\log\<datetime>\ with every
REM other test run's.
where bash >nul 2>&1
if errorlevel 1 (
  echo ERROR: bash was not found. It comes with Git for Windows ^(Git Bash^) and with WSL.
  goto end
)
if not exist "%REPO%\.tools\FerretDB\build.sh" (
  where git >nul 2>&1
  if errorlevel 1 (
    echo ERROR: git was not found, so .tools\FerretDB cannot be cloned.
    echo        Install Git for Windows, or clone it by hand:
    echo          git clone git@github.com:wekan/FerretDB .tools/FerretDB
    goto end
  )
  if not exist "%REPO%\.tools" md "%REPO%\.tools"
  echo ==^> FerretDB is not in .tools\ yet; cloning wekan/FerretDB
  git clone git@github.com:wekan/FerretDB "%REPO%\.tools\FerretDB"
  if errorlevel 1 (
    echo ==^> SSH clone failed ^(no key for github.com?^); trying HTTPS.
    git clone https://github.com/wekan/FerretDB "%REPO%\.tools\FerretDB"
  )
)
if not exist "%REPO%\.tools\FerretDB\build.sh" (
  echo ERROR: .tools\FerretDB\build.sh is still missing after cloning.
  goto end
)
bash -c "cd .tools/FerretDB && ./build.sh test-all"
goto end

REM ===========================================================================
:test_everything_two
set "WEKAN_EVERYTHING_MODE=two-worker"
goto test_everything

:test_everything_one
set "WEKAN_EVERYTHING_MODE=sequential"
goto test_everything

:test_everything_all
set "WEKAN_EVERYTHING_MODE=parallel"
goto test_everything

:test_everything
REM Every test WeKan and FerretDB have, one stage at a time: WeKan's own suite,
REM then the database conformance run for every database with an image for this
REM CPU, then all of FerretDB's tests. One .tools\log\<datetime>\ directory for the
REM whole run, and nothing runs concurrently, which is what makes a failure
REM readable.
REM
REM The shared runner first stops and waits for any older EVERYTHING run, so the
REM two runs cannot share ports 3000/3001, databases or browser output.
REM The WeKan stage builds a Meteor bundle and runs a server, which needs the
REM POSIX shell throughout - so this hands the whole run to bash rather than
REM reimplementing it here, exactly as options 14 and 15 do.
where bash >nul 2>&1
if errorlevel 1 (
  echo ERROR: bash was not found. It comes with Git for Windows ^(Git Bash^) and with WSL.
  goto end
)
bash ./releases/run-everything.sh %WEKAN_EVERYTHING_MODE%
if errorlevel 1 (
  echo ERROR: EVERYTHING did not start or did not finish successfully. See the message above.
  goto end
)
goto end

REM ===========================================================================
:end
ENDLOCAL
