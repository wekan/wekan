@echo off
REM tools-env.bat - keep every file WeKan's batch scripts write inside .tools\.
REM
REM   Usage (from another .bat):  call "%~dp0tools-env.bat"
REM
REM The Windows counterpart of releases/tools-env.sh. .tools\ is ignored by
REM .gitignore and .meteorignore, so nothing written there can reach a commit or
REM trigger a Meteor rebuild, and a sandboxed editor (Windows Sandbox,
REM docs/Security/Sandboxes/Windows) that can reach only the checkout still
REM works. The scripts used to write to %TEMP%, %LOCALAPPDATA%\.meteor,
REM %APPDATA%\npm and %APPDATA%\npm-cache, %USERPROFILE%\go and a system-wide
REM Node.js from Chocolatey. Each now lives under .tools\:
REM
REM   .tools\tmp              TEMP, TMP, TMPDIR - temporary files and downloads
REM   .tools\.meteor          Meteor (METEOR_WAREHOUSE_DIR once installed there)
REM   .tools\node-v*-win-*    Node.js, unpacked from nodejs.org's zip
REM   .tools\npm-global       npm's global installs (npm_config_prefix)
REM   .tools\npm-cache        npm's cache (npm_config_cache)
REM   .tools\gopath, gocache, gomodcache   Go, for FerretDB builds
REM   .tools\ms-playwright    the Playwright browsers
REM
REM No setlocal: the caller keeps what is set here. Calling twice is harmless.

for %%I in ("%~dp0..") do set "WEKAN_DIR=%%~fI"
set "WEKAN_TOOLS_DIR=%WEKAN_DIR%\.tools"
if not exist "%WEKAN_TOOLS_DIR%\tmp" mkdir "%WEKAN_TOOLS_DIR%\tmp"

set "TEMP=%WEKAN_TOOLS_DIR%\tmp"
set "TMP=%TEMP%"
set "TMPDIR=%TEMP%"
set "WEKAN_DOWNLOADS=%TEMP%"
set "npm_config_cache=%WEKAN_TOOLS_DIR%\npm-cache"
set "npm_config_prefix=%WEKAN_TOOLS_DIR%\npm-global"
set "GOPATH=%WEKAN_TOOLS_DIR%\gopath"
set "GOCACHE=%WEKAN_TOOLS_DIR%\gocache"
set "GOMODCACHE=%WEKAN_TOOLS_DIR%\gomodcache"
if not defined PLAYWRIGHT_BROWSERS_PATH set "PLAYWRIGHT_BROWSERS_PATH=%WEKAN_TOOLS_DIR%\ms-playwright"
REM Meteor reads its packages from METEOR_WAREHOUSE_DIR (default
REM %LOCALAPPDATA%\.meteor). Pointed at .tools\.meteor only once Meteor is
REM installed there (build.bat option 1), so an older install keeps working.
REM SANDBOX=true goes with it, as in tools-env.sh: without it Meteor takes the
REM running tool to be the warehouse's own launcher, and springboards forever
REM once .meteor\release names another release.
if exist "%WEKAN_TOOLS_DIR%\.meteor\meteor.bat" (
  set "METEOR_WAREHOUSE_DIR=%WEKAN_TOOLS_DIR%\.meteor"
  set "SANDBOX=true"
)

REM The Node.js build.bat unpacked into .tools (the last one listed).
set "WEKAN_NODE_DIR="
for /d %%D in ("%WEKAN_TOOLS_DIR%\node-v*-win-*") do if exist "%%~fD\node.exe" set "WEKAN_NODE_DIR=%%~fD"

REM Put the tools installed there first on PATH - once - so no user or system
REM PATH setting has to change for a new terminal to find them.
if defined WEKAN_TOOLS_ENV_PATH goto :eof
set "WEKAN_TOOLS_ENV_PATH=1"
REM npm's global installs come before Node.js's own npm, so an npm upgraded with
REM npm install -g is the one found.
if defined WEKAN_NODE_DIR set "PATH=%WEKAN_NODE_DIR%;%PATH%"
set "PATH=%WEKAN_TOOLS_DIR%\bin;%WEKAN_TOOLS_DIR%\.meteor;%npm_config_prefix%;%PATH%"
goto :eof
