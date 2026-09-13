@echo off
setlocal
for %%I in ("%~dp0..") do set "WEKAN_ROOT=%%~fI"
set "PATH=%WEKAN_ROOT%\.tools\bin;%GOBIN%;%PATH%"
set "FLAGS=--apply --code"
if "%~1"=="--preview" (
  set "FLAGS=--code"
  node "%WEKAN_ROOT%\tools\mirror-active-forges.mjs" --target sourceforge --code %2 %3 %4 %5 %6 %7 %8 %9
) else (
  node "%WEKAN_ROOT%\tools\mirror-active-forges.mjs" --target sourceforge %FLAGS% %*
)
exit /b %ERRORLEVEL%
