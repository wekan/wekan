#!/usr/bin/env bash
# test-menu.sh - interactive test menu for WeKan, mirroring docs/Features
#
# Menu structure and submenus are read directly from docs/Features at every
# run, so this script never drifts from that tree: a folder under
# docs/Features is a submenu, and a folder with no subfolders of its own is a
# runnable leaf feature. Menu 1 always runs every feature; the rest of the
# top menu is the first-level docs/Features categories, and 0 exits (0 goes
# back one level inside a submenu).
#
# Every run's starting command, logs and any produced files are written under
#   .tools/test-menu/YYYY-MM-DD_HH-MM-SS/<same path as under docs/Features>/
#
# A few leaves have a real runner wired up below (RUNNERS) that exercises the
# actual WeKan server code from this checkout - e.g. Login does a REST
# username/password login round trip, and ImportExport/PDF creates a board
# and downloads its PDF export. Every leaf without a dedicated runner falls
# back to running this repo's own automated tests (tests/*.test.cjs) whose
# name matches the feature, which is a real, working way to exercise that
# feature's code without a running server.
#
# Run: ./test-menu.sh

set -uo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FEATURES_DIR="$ROOT_DIR/docs/Features"
SESSION_TS="$(date '+%Y-%m-%d_%H-%M-%S')"
SESSION_DIR="$ROOT_DIR/.tools/test-menu/$SESSION_TS"
STATE_DIR="$SESSION_DIR/.state"
MENU_LOG="$SESSION_DIR/test-menu.log"

mkdir -p "$SESSION_DIR" "$STATE_DIR"
: > "$MENU_LOG"

log() {
  # Always goes to the session log; also echoed to the terminal.
  echo "$*" | tee -a "$MENU_LOG"
}

# ---------------------------------------------------------------------------
# node / server resolution
# ---------------------------------------------------------------------------

resolve_node() {
  local c
  shopt -s nullglob
  for c in "$ROOT_DIR"/.tools/node-v*/bin/node; do
    [ -x "$c" ] && { echo "$c"; shopt -u nullglob; return 0; }
  done
  shopt -u nullglob
  command -v node 2>/dev/null || true
}

WEKAN_TEST_URL="${WEKAN_TEST_URL:-http://localhost:3000}"
SERVER_CHECKED=0
SERVER_AVAILABLE=0
SERVER_PID=""
MONGOD_PID=""

url_port() {
  local url="$1"
  echo "$url" | sed -E 's#^[a-z]+://[^:/]+:?##; s#/.*$##' | grep -E '^[0-9]+$' || echo 80
}

server_reachable() {
  curl -fsS --connect-timeout 2 --max-time 4 "$WEKAN_TEST_URL/sign-in" >/dev/null 2>&1
}

# Reuse a WeKan already running at $WEKAN_TEST_URL; otherwise try to start the
# precompiled bundle at .build/bundle (built by `meteor build .build
# --directory`, see build.sh) against a MongoDB it starts itself. Every
# server-dependent runner calls this first and skips cleanly when it fails,
# instead of the whole menu failing.
ensure_server() {
  [ "$SERVER_CHECKED" -eq 1 ] && return $([ "$SERVER_AVAILABLE" -eq 1 ] && echo 0 || echo 1)
  SERVER_CHECKED=1

  if server_reachable; then
    log "Reusing the WeKan already running at $WEKAN_TEST_URL."
    SERVER_AVAILABLE=1
    return 0
  fi

  local bundle="$ROOT_DIR/.build/bundle"
  if [ ! -f "$bundle/main.js" ]; then
    log "No WeKan reachable at $WEKAN_TEST_URL, and no precompiled bundle at"
    log "$bundle/main.js. Build one first (./build.sh -> meteor build .build"
    log "--directory) or set WEKAN_TEST_URL to a running instance."
    SERVER_AVAILABLE=0
    return 1
  fi

  local node_bin
  node_bin="$(resolve_node)"
  if [ -z "$node_bin" ]; then
    log "No usable node binary found to run $bundle/main.js."
    SERVER_AVAILABLE=0
    return 1
  fi

  local mongo_port=3001
  if ! (exec 3<>/dev/tcp/127.0.0.1/"$mongo_port") 2>/dev/null; then
    local mongod_bin
    mongod_bin="$(command -v mongod || true)"
    if [ -z "$mongod_bin" ]; then
      log "Nothing is listening on 127.0.0.1:$mongo_port and no mongod binary was"
      log "found on PATH. Server-dependent features will be skipped."
      SERVER_AVAILABLE=0
      return 1
    fi
    local dbpath="$SESSION_DIR/.mongodb"
    mkdir -p "$dbpath"
    log "Starting mongod on :$mongo_port ($dbpath) ..."
    "$mongod_bin" --port "$mongo_port" --dbpath "$dbpath" --bind_ip 127.0.0.1 \
      --nounixsocket >>"$SESSION_DIR/mongod.log" 2>&1 &
    MONGOD_PID=$!
    local i
    for i in $(seq 1 30); do
      (exec 3<>/dev/tcp/127.0.0.1/"$mongo_port") 2>/dev/null && break
      sleep 1
    done
  else
    log "Reusing the MongoDB already listening on :$mongo_port."
  fi

  local port
  port="$(url_port "$WEKAN_TEST_URL")"
  log "Starting the WeKan bundle server on $WEKAN_TEST_URL from $bundle ..."
  (
    MONGO_URL="mongodb://127.0.0.1:$mongo_port/meteor" ROOT_URL="$WEKAN_TEST_URL" \
    PORT="$port" WITH_API=true RICHER_CARD_COMMENT_EDITOR=false \
    "$node_bin" "$bundle/main.js"
  ) >>"$SESSION_DIR/wekan-server.log" 2>&1 &
  SERVER_PID=$!

  local i
  for i in $(seq 1 60); do
    if server_reachable; then
      log "WeKan server ready on $WEKAN_TEST_URL."
      SERVER_AVAILABLE=1
      return 0
    fi
    sleep 1
  done
  log "WeKan server did not become ready in time; see $SESSION_DIR/wekan-server.log"
  SERVER_AVAILABLE=0
  return 1
}

stop_server_if_ours() {
  [ -n "$SERVER_PID" ] && kill "$SERVER_PID" >/dev/null 2>&1
  [ -n "$MONGOD_PID" ] && kill "$MONGOD_PID" >/dev/null 2>&1
}
trap stop_server_if_ours EXIT

# ---------------------------------------------------------------------------
# dedicated runners - the featues explicitly wired to real WeKan code
# ---------------------------------------------------------------------------

# Login: a real username/password REST login round trip
# (server/apiAuthRoutes.js POST /users/login), against a disposable test user
# created through the public POST /users/register route.
run_login_password() {
  local relpath="$1" outdir="$2" cmdfile="$3" logfile="$4"
  if ! ensure_server; then
    echo "SKIPPED: no WeKan server available." | tee -a "$logfile"
    return
  fi
  local username="testmenu$(date +%s)$$"
  local email="${username}@example.invalid"
  local password="TestMenu-${RANDOM}${RANDOM}!"

  {
    echo "curl -sS -H 'Content-type: application/json' \\"
    echo "  '$WEKAN_TEST_URL/users/register' \\"
    echo "  -d '{\"username\":\"$username\",\"email\":\"$email\",\"password\":\"***redacted***\"}'"
  } >>"$cmdfile"
  local register_response
  register_response=$(curl -sS -H "Content-type: application/json" \
    "$WEKAN_TEST_URL/users/register" \
    -d "{\"username\":\"$username\",\"email\":\"$email\",\"password\":\"$password\"}")
  echo "$register_response" > "$outdir/register-response.json"
  {
    echo "Registered test user $username."
    echo "Register response: $register_response"
  } >>"$logfile"

  {
    echo
    echo "curl -sS -H 'Content-type: application/json' \\"
    echo "  '$WEKAN_TEST_URL/users/login' \\"
    echo "  -d '{\"username\":\"$username\",\"password\":\"***redacted***\"}'"
  } >>"$cmdfile"
  local login_response
  login_response=$(curl -sS -H "Content-type: application/json" \
    "$WEKAN_TEST_URL/users/login" \
    -d "{\"username\":\"$username\",\"password\":\"$password\"}")
  echo "$login_response" > "$outdir/login-response.json"
  echo "Login response: $login_response" >>"$logfile"

  local token userId
  token=$(echo "$login_response" | jq -r '.token // empty' 2>/dev/null)
  userId=$(echo "$login_response" | jq -r '.id // empty' 2>/dev/null)
  if [ -n "$token" ] && [ -n "$userId" ]; then
    echo "PASS: password login for $username returned a token." | tee -a "$logfile"
    jq -n --arg url "$WEKAN_TEST_URL" --arg token "$token" \
      --arg userId "$userId" --arg username "$username" \
      '{url:$url, token:$token, userId:$userId, username:$username}' \
      > "$STATE_DIR/session.json"
  else
    echo "FAIL: password login did not return a token; see login-response.json" \
      | tee -a "$logfile"
  fi
}

# ImportExport/PDF: create a board through the REST API, then download its
# PDF export (models/exportPDF.js GET /api/boards/:boardId/exportPDF).
run_export_pdf() {
  local relpath="$1" outdir="$2" cmdfile="$3" logfile="$4"
  if ! ensure_server; then
    echo "SKIPPED: no WeKan server available." | tee -a "$logfile"
    return
  fi

  local token="" url=""
  if [ -f "$STATE_DIR/session.json" ]; then
    token=$(jq -r '.token // empty' "$STATE_DIR/session.json")
    url=$(jq -r '.url // empty' "$STATE_DIR/session.json")
  fi
  if [ -z "$token" ] || [ "$url" != "$WEKAN_TEST_URL" ]; then
    echo "No cached login for $WEKAN_TEST_URL; logging in a fresh test user first." \
      >>"$logfile"
    run_login_password "Login" "$outdir" "$cmdfile" "$logfile"
    token=$(jq -r '.token // empty' "$STATE_DIR/session.json" 2>/dev/null)
  fi
  if [ -z "$token" ]; then
    echo "FAIL: no login token available; cannot create a board to export." \
      | tee -a "$logfile"
    return
  fi

  {
    echo
    echo "curl -sS -H 'Authorization: Bearer ***redacted***' -H 'Content-type: application/json' \\"
    echo "  -X POST '$WEKAN_TEST_URL/api/boards' \\"
    echo "  -d '{\"title\":\"Test Menu Board\",\"permission\":\"private\",\"color\":\"nephritis\"}'"
  } >>"$cmdfile"
  local board_response
  board_response=$(curl -sS -H "Authorization: Bearer $token" \
    -H "Content-type: application/json" -X POST "$WEKAN_TEST_URL/api/boards" \
    -d '{"title":"Test Menu Board","permission":"private","color":"nephritis"}')
  echo "$board_response" > "$outdir/create-board-response.json"
  echo "Create board response: $board_response" >>"$logfile"
  local boardId
  boardId=$(echo "$board_response" | jq -r '._id // .data._id // empty' 2>/dev/null)
  if [ -z "$boardId" ]; then
    echo "FAIL: could not create a board; see create-board-response.json" \
      | tee -a "$logfile"
    return
  fi
  echo "Created board $boardId." >>"$logfile"

  {
    echo
    echo "curl -sS -H 'Authorization: Bearer ***redacted***' \\"
    echo "  '$WEKAN_TEST_URL/api/boards/$boardId/exportPDF?authToken=***redacted***' -o board.pdf"
  } >>"$cmdfile"
  curl -sS -H "Authorization: Bearer $token" \
    "$WEKAN_TEST_URL/api/boards/$boardId/exportPDF?authToken=$token" \
    -o "$outdir/board.pdf"
  if [ -s "$outdir/board.pdf" ] && head -c4 "$outdir/board.pdf" | grep -q "%PDF"; then
    local size
    size=$(wc -c < "$outdir/board.pdf" | tr -d ' ')
    echo "PASS: exported board $boardId to $outdir/board.pdf ($size bytes)." \
      | tee -a "$logfile"
  else
    echo "FAIL: $outdir/board.pdf is not a PDF; see $logfile" | tee -a "$logfile"
  fi
}

# Maps a docs/Features leaf's relative path to the runner above. Anything not
# listed here uses run_generic_fallback.
declare -A RUNNERS=(
  ["Login"]="run_login_password"
  ["ImportExport/PDF"]="run_export_pdf"
)

# ---------------------------------------------------------------------------
# generic fallback runner - matches the feature against this repo's own
# automated tests and runs them, which is a real exercise of the WeKan source
# for features that do not (yet) have a dedicated interactive runner above.
# ---------------------------------------------------------------------------

derive_keywords() {
  local name="$1" spaced whole word out=""
  spaced=$(echo "$name" | sed -E 's/([a-z0-9])([A-Z])/\1 \2/g; s/[-_ ]+/ /g')
  whole=$(echo "$name" | tr -d ' _-')
  for word in $(echo "$whole $spaced" | tr '[:upper:]' '[:lower:]'); do
    out="$out $word"
    # a plural keyword ("webhooks") must also match a singular file name
    # ("webhookUsername.test.cjs"); the reverse never loses a match, so only
    # this direction is worth the trouble.
    [ "${#word}" -gt 3 ] && [ "${word: -1}" = "s" ] && out="$out ${word%s}"
  done
  echo "$out"
}

run_generic_fallback() {
  local relpath="$1" outdir="$2" cmdfile="$3" logfile="$4"
  local leaf kws node_bin
  leaf="$(basename "$relpath")"
  kws="$(derive_keywords "$leaf")"
  node_bin="$(resolve_node)"

  {
    echo "No dedicated runner for '$relpath'."
    echo "Falling back to this repo's own automated tests matching: $kws"
    echo "(see docs/Features/$relpath for what the feature itself does)"
  } >>"$logfile"

  if [ -z "$node_bin" ]; then
    echo "SKIPPED: no usable node binary found." | tee -a "$logfile"
    return
  fi

  local -a matches=()
  local f base kw hit
  shopt -s nocasematch
  for f in "$ROOT_DIR"/tests/*.test.cjs; do
    [ -e "$f" ] || continue
    base="$(basename "$f")"
    hit=0
    for kw in $kws; do
      [ "${#kw}" -lt 3 ] && continue
      if [[ "$base" == *"$kw"* ]]; then hit=1; break; fi
    done
    [ "$hit" -eq 1 ] && matches+=("$f")
  done
  shopt -u nocasematch

  if [ "${#matches[@]}" -eq 0 ]; then
    echo "No matching automated test found for '$relpath'; nothing was run." \
      | tee -a "$logfile"
    return
  fi

  {
    echo "$node_bin ${matches[*]}"
  } >>"$cmdfile"

  local pass=0 fail=0
  for f in "${matches[@]}"; do
    {
      echo
      echo "== $(basename "$f") =="
    } >>"$logfile"
    if "$node_bin" "$f" >>"$logfile" 2>&1; then
      pass=$((pass + 1))
    else
      fail=$((fail + 1))
      echo "FAIL: $(basename "$f")" >>"$logfile"
    fi
  done
  echo "RESULT: $pass passed, $fail failed, out of ${#matches[@]} matched test(s)." \
    | tee -a "$logfile"
}

# ---------------------------------------------------------------------------
# running a feature (leaf) and saving its command/log/output under the
# session directory, mirroring its docs/Features path
# ---------------------------------------------------------------------------

run_feature() {
  local relpath="$1"
  [ -z "$relpath" ] && return
  local outdir="$SESSION_DIR/$relpath"
  mkdir -p "$outdir"
  local cmdfile="$outdir/command.txt" logfile="$outdir/run.log"
  : > "$cmdfile"
  {
    echo "===== $relpath - started $(date '+%Y-%m-%d %H:%M:%S %Z') ====="
  } > "$logfile"

  log "----- $relpath -----"
  local runner="${RUNNERS[$relpath]:-}"
  if [ -n "$runner" ]; then
    "$runner" "$relpath" "$outdir" "$cmdfile" "$logfile"
  else
    run_generic_fallback "$relpath" "$outdir" "$cmdfile" "$logfile"
  fi
  echo "===== $relpath - finished $(date '+%Y-%m-%d %H:%M:%S %Z') =====" >>"$logfile"
  log "  -> $outdir/run.log"
}

# Recursively runs every leaf feature at or under $1 (a docs/Features
# directory). A directory that has both subdirectories AND its own markdown
# files directly in it (e.g. Login) also runs as its own feature first, using
# its own relative path - exactly the entry RUNNERS above keys off.
run_all_under() {
  local dir="$1" rel
  if [ "$dir" = "$FEATURES_DIR" ]; then rel=""; else rel="${dir#"$FEATURES_DIR"/}"; fi

  local -a subdirs=()
  while IFS= read -r d; do subdirs+=("$d"); done \
    < <(find "$dir" -mindepth 1 -maxdepth 1 -type d | sort)

  if [ "${#subdirs[@]}" -eq 0 ]; then
    [ -n "$rel" ] && run_feature "$rel"
    return
  fi

  if [ -n "$rel" ] && find "$dir" -mindepth 1 -maxdepth 1 -type f -iname "*.md" \
      -print -quit | grep -q .; then
    run_feature "$rel"
  fi
  local d
  for d in "${subdirs[@]}"; do
    run_all_under "$d"
  done
}

# ---------------------------------------------------------------------------
# interactive menu, built live from docs/Features
# ---------------------------------------------------------------------------

show_menu() {
  local dir="$1" title="$2" is_top="$3"
  while true; do
    local -a labels=() types=() values=()

    if [ "$is_top" = "1" ]; then
      labels+=("Run ALL features"); types+=("all"); values+=("$FEATURES_DIR")
    else
      labels+=("Run ALL in this category"); types+=("all"); values+=("$dir")
      if find "$dir" -mindepth 1 -maxdepth 1 -type f -iname "*.md" \
          -print -quit | grep -q .; then
        labels+=("$(basename "$dir") (base feature)")
        types+=("run"); values+=("${dir#"$FEATURES_DIR"/}")
      fi
    fi

    local d
    while IFS= read -r d; do
      labels+=("$(basename "$d")")
      if [ -z "$(find "$d" -mindepth 1 -maxdepth 1 -type d -print -quit)" ]; then
        types+=("run"); values+=("${d#"$FEATURES_DIR"/}")
      else
        types+=("menu"); values+=("$d")
      fi
    done < <(find "$dir" -mindepth 1 -maxdepth 1 -type d | sort)

    echo
    echo "=== $title ==="
    local i
    for i in "${!labels[@]}"; do
      printf " %d) %s\n" "$((i + 1))" "${labels[$i]}"
    done
    if [ "$is_top" = "1" ]; then
      echo " 0) Exit"
    else
      echo " 0) Back"
    fi

    read -r -p "Choose: " choice
    [ "$choice" = "0" ] && return

    if ! [[ "$choice" =~ ^[0-9]+$ ]] || [ "$choice" -lt 1 ] || \
        [ "$choice" -gt "${#labels[@]}" ]; then
      echo "Invalid choice."
      continue
    fi

    local idx=$((choice - 1))
    case "${types[$idx]}" in
      all) run_all_under "${values[$idx]}" ;;
      run) run_feature "${values[$idx]}" ;;
      menu) show_menu "${values[$idx]}" "$(basename "${values[$idx]}")" 0 ;;
    esac
  done
}

echo "WeKan test menu"
echo "Session directory: $SESSION_DIR"
echo "(starting commands, run logs and any output files are saved there,"
echo " in the same subfolders as docs/Features)"
echo "WEKAN_TEST_URL=$WEKAN_TEST_URL (set this env var to point at an already-running WeKan)"

show_menu "$FEATURES_DIR" "WeKan Test Menu" 1

echo "Bye. Session saved under $SESSION_DIR"
