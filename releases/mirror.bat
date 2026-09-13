@echo off
setlocal
REM The documented Windows checkout is %USERPROFILE%\Downloads\repos\wekan.
REM Resolve this script so other checkout locations also work.
for %%I in ("%~dp0..") do set "WEKAN_ROOT=%%~fI"
set "TOOLS_DIR=%WEKAN_ROOT%\.tools"
set "PATH=%TOOLS_DIR%\bin;%GOBIN%;%PATH%"
if "%~1"=="--help" (
  echo Usage: releases\mirror.bat [--preview]
  exit /b 0
)
if not "%~1"=="" if not "%~1"=="--preview" exit /b 2
if not "%~2"=="" exit /b 2
if not exist "%TOOLS_DIR%\tmp" mkdir "%TOOLS_DIR%\tmp"
set "TEMP=%TOOLS_DIR%\tmp"
set "TMP=%TEMP%"
set "SNAPSHOT=%TEMP%\mirror-source-%RANDOM%-%RANDOM%.json"
node "%WEKAN_ROOT%\tools\mirror-active-forges.mjs" --export-source "%SNAPSHOT%"
if errorlevel 1 exit /b 1
set "STATUS=0"
set "ARCHIVE_FLAGS=--apply"
if "%~1"=="--preview" set "ARCHIVE_FLAGS="
node "%WEKAN_ROOT%\tools\mirror-active-forges.mjs" --archive-only %ARCHIVE_FLAGS% --snapshot "%SNAPSHOT%"
if errorlevel 1 set "STATUS=1"
set "TARGETS=%SNAPSHOT%.targets"
node "%WEKAN_ROOT%\tools\mirror-active-forges.mjs" --list-targets > "%TARGETS%"
if errorlevel 1 (
  del "%SNAPSHOT%" "%TARGETS%"
  exit /b 1
)
for /f "usebackq tokens=1,2" %%A in ("%TARGETS%") do call :mirror %%A %%B %1
del "%TARGETS%"
del "%SNAPSHOT%"
exit /b %STATUS%

:mirror
REM The shared engine sends branches and tags without force or deletion.
call "%~dp0mirror-%~1.bat" %3 --snapshot "%SNAPSHOT%" --skip-archive
if errorlevel 1 set "STATUS=1"
exit /b 0
