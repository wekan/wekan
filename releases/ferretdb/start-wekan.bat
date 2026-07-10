@echo off
REM ============================================================================
REM  Self-contained WeKan launcher (Windows).
REM
REM  Everything needed to run WeKan offline is inside this bundle: the WeKan
REM  server (main.js), a bundled Node.js (node.exe) and a bundled FerretDB v1
REM  with its embedded SQLite backend (ferretdb.exe). Just double-click this file
REM  (or run it from cmd). By default it starts FerretDB v1 (SQLite) as the
REM  database, storing all data - and attachments/avatars on the filesystem -
REM  under WRITABLE_PATH (a "data" folder next to this file unless you set
REM  WRITABLE_PATH). No separate MongoDB or Node install is required.
REM
REM  See docs/Platforms/Propietary/Windows/Offline.md. Override PORT, ROOT_URL,
REM  WRITABLE_PATH or MONGO_URL below (or in the environment) as needed.
REM ============================================================================
setlocal

set "DIR=%~dp0"
if not defined WRITABLE_PATH set "WRITABLE_PATH=%DIR%data"
set "FERRETDB_SQLITE_DIR=%WRITABLE_PATH%\ferretdb-sqlite"
if not defined PORT set "PORT=8080"
if not defined ROOT_URL set "ROOT_URL=http://localhost:%PORT%"
if not defined MONGO_URL set "MONGO_URL=mongodb://127.0.0.1:27017/wekan"

REM Store attachments and avatars on the filesystem (default), under WRITABLE_PATH.
if not exist "%WRITABLE_PATH%\attachments" mkdir "%WRITABLE_PATH%\attachments"
if not exist "%WRITABLE_PATH%\avatars"     mkdir "%WRITABLE_PATH%\avatars"
if not exist "%FERRETDB_SQLITE_DIR%"        mkdir "%FERRETDB_SQLITE_DIR%"

REM FerretDB's SQLite URL needs forward slashes.
set "FERRETDB_SQLITE_URL=file:%FERRETDB_SQLITE_DIR:\=/%/"

set "DO_NOT_TRACK=1"
set "FERRETDB_TELEMETRY=disable"

echo Starting bundled FerretDB v1 (SQLite) on 127.0.0.1:27017 (data: %FERRETDB_SQLITE_DIR%) ...
start "FerretDB" /b "%DIR%ferretdb.exe" --handler=sqlite --sqlite-url=%FERRETDB_SQLITE_URL% --listen-addr=127.0.0.1:27017 --telemetry=disable

echo Starting WeKan on %ROOT_URL% (port %PORT%), files under %WRITABLE_PATH% ...
"%DIR%node.exe" "%DIR%main.js"

endlocal
