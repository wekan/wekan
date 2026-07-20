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
REM  #6480/#6481: FerretDB v1 now ships an OpLog (started below with
REM  --repl-set-name), so by default WeKan's Meteor TAILS the OpLog instead of
REM  poll-and-diff (fixes high FerretDB CPU on busy boards). Set
REM  WEKAN_FERRETDB_OPLOG=false to force the old polling-only behaviour.
if not defined WEKAN_FERRETDB_OPLOG set "WEKAN_FERRETDB_OPLOG=true"
if not defined WEKAN_FERRETDB_REPL_SET set "WEKAN_FERRETDB_REPL_SET=rs0"
set "FERRET_REPL_ARG="
if /I "%WEKAN_FERRETDB_OPLOG%"=="true" (
  set "FERRET_REPL_ARG=--repl-set-name=%WEKAN_FERRETDB_REPL_SET%"
  if not defined MONGO_OPLOG_URL set "MONGO_OPLOG_URL=mongodb://127.0.0.1:27017/local?replicaSet=%WEKAN_FERRETDB_REPL_SET%"
  REM  Prefer OpLog but ALWAYS keep polling as the final fallback: Meteor uses
  REM  OpLog only when tailing works, otherwise polling. Admin Panel / Version
  REM  ("Reactivity mode") shows which one is live.
  if not defined METEOR_REACTIVITY_ORDER set "METEOR_REACTIVITY_ORDER=oplog,polling"
  if not defined DEFAULT_METEOR_REACTIVITY_ORDER set "DEFAULT_METEOR_REACTIVITY_ORDER=oplog,polling"
) else (
  if not defined METEOR_REACTIVITY_ORDER set "METEOR_REACTIVITY_ORDER=polling"
  if not defined DEFAULT_METEOR_REACTIVITY_ORDER set "DEFAULT_METEOR_REACTIVITY_ORDER=polling"
)
REM  FerretDB (v1 SQLite fork) does NOT implement MongoDB change streams: a
REM  $changeStream aggregate returns "not implemented" and Meteor busy-loops
REM  retrying it (high FerretDB CPU, cards never open). Force changeStreams out
REM  of the reactivity order however it was passed in (done at top level, not in
REM  the parentheses above, so each set sees the previous line's result).
set "METEOR_REACTIVITY_ORDER=%METEOR_REACTIVITY_ORDER:changeStreams,=%"
set "METEOR_REACTIVITY_ORDER=%METEOR_REACTIVITY_ORDER:,changeStreams=%"
set "METEOR_REACTIVITY_ORDER=%METEOR_REACTIVITY_ORDER:changeStreams=%"
set "METEOR_REACTIVITY_ORDER=%METEOR_REACTIVITY_ORDER:changeStream,=%"
set "METEOR_REACTIVITY_ORDER=%METEOR_REACTIVITY_ORDER:,changeStream=%"
set "METEOR_REACTIVITY_ORDER=%METEOR_REACTIVITY_ORDER:changeStream=%"
if not defined METEOR_REACTIVITY_ORDER set "METEOR_REACTIVITY_ORDER=oplog,polling"
if "%METEOR_REACTIVITY_ORDER%"=="" set "METEOR_REACTIVITY_ORDER=oplog,polling"
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
start "FerretDB" /b "%DIR%ferretdb.exe" --handler=sqlite --sqlite-url=%FERRETDB_SQLITE_URL% --listen-addr=127.0.0.1:27017 %FERRET_REPL_ARG% --telemetry=disable

echo Starting WeKan on %ROOT_URL% (port %PORT%), files under %WRITABLE_PATH% ...
"%DIR%node.exe" "%DIR%main.js"

REM WeKan exited: stop FerretDB and restart the whole stack.
taskkill /IM ferretdb.exe /F >NUL 2>NUL
echo WeKan exited; restarting in 3 seconds... (close this window to stop)
timeout /t 3 /nobreak >NUL
goto wekan_loop

endlocal
