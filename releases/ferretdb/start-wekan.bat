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
REM  See docs/Platforms/Propietary/OS/Windows/Offline.md. Override PORT, ROOT_URL,
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
REM EXPORTING NEEDS THE API, and that is not obvious from the name. Every export
REM in the interface - a board or a card to PDF, Excel, JSON, .zip, CSV - is a
REM download from an /api/... address, and the server refuses those unless
REM WITH_API is exactly "true". Without it, clicking "PDF" saved WeKan's own HTML
REM page under the name of the file the download link had asked for. The snap and
REM every docker-compose set this; the two bundle launchers were the only
REM platforms that did not. Set WITH_API=false to turn the REST API off.
if not defined WITH_API set "WITH_API=true"
if not defined MONGO_URL set "MONGO_URL=mongodb://127.0.0.1:27017/wekan"
REM FerretDB v1 SQLite is standalone and polling-only. Replica sets and OpLog
REM tailing are reserved for real MongoDB deployments.
set "MONGO_OPLOG_URL="
set "METEOR_REACTIVITY_ORDER=polling"
set "DEFAULT_METEOR_REACTIVITY_ORDER=polling"
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
if not defined WEKAN_MEMORY_MB for /f "usebackq delims=" %%M in (`powershell.exe -NoProfile -Command "[math]::Floor((Get-CimInstance Win32_OperatingSystem).TotalVisibleMemorySize / 1024)" 2^>NUL`) do set "WEKAN_MEMORY_MB=%%M"
if not defined WEKAN_MEMORY_MB set "WEKAN_MEMORY_MB=2048"
set /a WEKAN_RUNTIME_HEAP_MB=WEKAN_MEMORY_MB*3/5
if %WEKAN_RUNTIME_HEAP_MB% GTR 4096 set "WEKAN_RUNTIME_HEAP_MB=4096"
set /a WEKAN_GO_HEAP_MB=WEKAN_MEMORY_MB/5
if %WEKAN_GO_HEAP_MB% GTR 1024 set "WEKAN_GO_HEAP_MB=1024"
if not defined NODE_OPTIONS set "NODE_OPTIONS=--max-old-space-size=%WEKAN_RUNTIME_HEAP_MB%"
if not defined GOMEMLIMIT set "GOMEMLIMIT=%WEKAN_GO_HEAP_MB%MiB"
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
