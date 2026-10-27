@echo off
setlocal
for %%I in ("%~dp0..") do set "WEKAN_ROOT=%%~fI"
REM TEMP, TMP, npm and Go in .tools\ (releases\tools-env.bat).
call "%~dp0tools-env.bat"
set "PATH=%WEKAN_ROOT%\.tools\bin;%GOBIN%;%PATH%"
set "FLAGS=--apply --code"
if "%~1"=="--preview" (
  set "FLAGS=--code"
  node "%WEKAN_ROOT%\tools\mirror-active-forges.mjs" --target github --code %2 %3 %4 %5 %6 %7 %8 %9
) else (
  node "%WEKAN_ROOT%\tools\mirror-active-forges.mjs" --target github %FLAGS% %*
)
exit /b %ERRORLEVEL%
