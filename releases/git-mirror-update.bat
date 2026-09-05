@echo off
setlocal EnableExtensions

rem WeKan's Windows checkout location, matching build.bat and AGENTS.md.
set "WEKAN_ROOT=%USERPROFILE%\Downloads\repos\wekan"
set "TOOLS_DIR=%WEKAN_ROOT%\.tools"

if not exist "%WEKAN_ROOT%\releases\git-mirror-update.bat" (
  echo WeKan checkout not found at "%WEKAN_ROOT%". 1>&2
  exit /b 1
)

if not exist "%TOOLS_DIR%" mkdir "%TOOLS_DIR%"
if errorlevel 1 exit /b %errorlevel%

call :mirror gitlab git@gitlab.com:wekan/wekan
if errorlevel 1 exit /b %errorlevel%
call :mirror codeberg git@codeberg.org:wekan/wekan
exit /b %errorlevel%

:mirror
set "MIRROR_NAME=%~1"
set "CLONE_URL=%~2"
set "MIRROR_DIR=%TOOLS_DIR%\wekan-%MIRROR_NAME%"

if not exist "%MIRROR_DIR%\.git" (
  git -C "%TOOLS_DIR%" clone "%CLONE_URL%" "wekan-%MIRROR_NAME%"
  if errorlevel 1 exit /b 1
)

git -C "%MIRROR_DIR%" remote get-url upstream >nul 2>&1
if errorlevel 1 (
  git -C "%MIRROR_DIR%" remote add upstream https://github.com/wekan/wekan
  if errorlevel 1 exit /b 1
)

git -C "%MIRROR_DIR%" pull
if errorlevel 1 exit /b %errorlevel%
git -C "%MIRROR_DIR%" fetch upstream
if errorlevel 1 exit /b %errorlevel%
git -C "%MIRROR_DIR%" merge upstream/main
if errorlevel 1 exit /b %errorlevel%
git -C "%MIRROR_DIR%" push
exit /b %errorlevel%
