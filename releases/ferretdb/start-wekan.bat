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
REM Files layout: <files>\attachments, <files>\avatars, <files>\db (FerretDB SQLite).
set "FILES=%WRITABLE_PATH%\files"
set "FERRETDB_SQLITE_DIR=%FILES%\db"
if not defined PORT set "PORT=8080"
if not defined ROOT_URL set "ROOT_URL=http://localhost:%PORT%"
if not defined MONGO_URL set "MONGO_URL=mongodb://127.0.0.1:27017/wekan"
REM  Card loading: "all" (default, every card into the browser) or "lazy" (each
REM  list loads only the visible cards on demand, for very large boards). Also
REM  changeable at runtime in Admin Panel / Features.
if not defined CARDS_LOADING set "CARDS_LOADING=all"

REM Store attachments and avatars on the filesystem (default), next to the DB.
if not exist "%FILES%\attachments" mkdir "%FILES%\attachments"
if not exist "%FILES%\avatars"     mkdir "%FILES%\avatars"
if not exist "%FERRETDB_SQLITE_DIR%" mkdir "%FERRETDB_SQLITE_DIR%"

REM FerretDB's SQLite URL needs forward slashes.
set "FERRETDB_SQLITE_URL=file:%FERRETDB_SQLITE_DIR:\=/%/"

set "DO_NOT_TRACK=1"
set "FERRETDB_TELEMETRY=disable"

REM Run the bundled FerretDB (this platform's ferretdb.exe) and WeKan (main.js on
REM the bundled node.exe) together in a restart loop: start FerretDB in the
REM background, run WeKan in the foreground, and if WeKan exits, stop FerretDB and
REM restart the whole stack. Close the window to stop both.
:wekan_loop
echo Starting bundled FerretDB v1 (SQLite) on 127.0.0.1:27017 (data: %FERRETDB_SQLITE_DIR%) ...
start "FerretDB" /b "%DIR%ferretdb.exe" --handler=sqlite --sqlite-url=%FERRETDB_SQLITE_URL% --listen-addr=127.0.0.1:27017 --telemetry=disable

echo Starting WeKan on %ROOT_URL% (port %PORT%), files under %WRITABLE_PATH% ...
"%DIR%node.exe" "%DIR%main.js"

REM WeKan exited: stop FerretDB and restart the whole stack.
taskkill /IM ferretdb.exe /F >NUL 2>NUL
echo WeKan exited; restarting in 3 seconds... (close this window to stop)
timeout /t 3 /nobreak >NUL
goto wekan_loop

endlocal
