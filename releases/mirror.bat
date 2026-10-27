@echo off
setlocal
REM Shared menu supports organization management, linked files and offline HTML/CSV.
REM The documented Windows checkout is %USERPROFILE%\Downloads\repos\wekan.
REM Resolve this script so other checkout locations also work.
for %%I in ("%~dp0..") do set "WEKAN_ROOT=%%~fI"
set "TOOLS_DIR=%WEKAN_ROOT%\.tools"
REM TEMP, TMP, npm and Go in .tools\ (releases\tools-env.bat).
call "%~dp0tools-env.bat"
set "PATH=%TOOLS_DIR%\bin;%GOBIN%;%PATH%"
node "%WEKAN_ROOT%\tools\mirror-menu.mjs" %*
exit /b %errorlevel%
