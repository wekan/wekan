@echo off
setlocal
REM Shared menu supports organization management, linked files and offline HTML/CSV.
REM The documented Windows checkout is %USERPROFILE%\Downloads\repos\wekan.
REM Resolve this script so other checkout locations also work.
for %%I in ("%~dp0..") do set "WEKAN_ROOT=%%~fI"
set "TOOLS_DIR=%WEKAN_ROOT%\.tools"
set "PATH=%TOOLS_DIR%\bin;%GOBIN%;%PATH%"
if not exist "%TOOLS_DIR%\tmp" mkdir "%TOOLS_DIR%\tmp"
set "TEMP=%TOOLS_DIR%\tmp"
set "TMP=%TEMP%"
node "%WEKAN_ROOT%\tools\mirror-menu.mjs" %*
exit /b %errorlevel%
