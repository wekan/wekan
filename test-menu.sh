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
# The example INPUT for a feature lives with its documentation, checked into
# the repository: docs/Features/<path>/example-input.txt (a curl call, a URL,
# a JSON body - hand-written for Login and ImportExport/PDF, extracted from
# the feature's own .md for the rest). test-menu.sh only ever READS these -
# it never writes into docs/Features.
#
# What running a feature actually DOES is written under
#   .tools/test-menu/YYYY-MM-DD_HH-MM-SS/<same path as under docs/Features>/
#     output.txt  - what came back (a real response, or the test output)
#     result.txt  - one line: PASS / FAIL / SKIP and why
#     run.log     - the full narrative, timestamps included
#
# A few leaves have a real runner wired up below (RUNNERS) that exercises the
# actual WeKan server code from this checkout - e.g. Login does a REST
# username/password login round trip, and ImportExport/PDF creates a board
# and downloads its PDF export - using the request shown in their
# example-input.txt. Every leaf without a dedicated runner falls back, in
# order, to: (1) this repo's own automated tests (tests/*.test.cjs) whose
# name matches the feature, a real, working way to exercise that feature's
# code without a running server, then (2) simply pointing at its
# example-input.txt, when there is genuinely no code of its own to run (e.g.
# Webhooks/Discord, which is just a URL convention). Either way,
# output.txt/result.txt are never empty and never silently "nothing was run".
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

# Writes the one-line PASS/FAIL/SKIP verdict to result.txt, run.log and the
# terminal, all three, so it is never buried in a file nobody opens.
record_result() {
  local msg="$1" resultfile="$2" logfile="$3"
  echo "$msg" >> "$resultfile"
  echo "$msg" | tee -a "$logfile"
}

# ---------------------------------------------------------------------------
# dedicated runners - the featues explicitly wired to real WeKan code
# ---------------------------------------------------------------------------

# Login: a real username/password REST login round trip
# (server/apiAuthRoutes.js POST /users/login), against a disposable test user
# created through the public POST /users/register route. The request shape is
# documented at docs/Features/Login/example-input.txt; a fresh username is
# generated each run so repeated runs never collide with each other.
run_login_password() {
  local relpath="$1" outdir="$2" outputfile="$3" resultfile="$4" logfile="$5"
  if ! ensure_server; then
    record_result "SKIPPED: no WeKan server available at $WEKAN_TEST_URL." "$resultfile" "$logfile"
    return
  fi
  local username="testmenu$(date +%s)$$"
  local email="${username}@example.invalid"
  local password="TestMenu-${RANDOM}${RANDOM}!"

  echo "1. Register a disposable test user (POST /users/register)," \
    "username=$username" >>"$logfile"
  local register_response
  register_response=$(curl -sS -H "Content-type: application/json" \
    "$WEKAN_TEST_URL/users/register" \
    -d "{\"username\":\"$username\",\"email\":\"$email\",\"password\":\"$password\"}")
  {
    echo "# 1. Register response"
    echo "$register_response"
  } >>"$outputfile"
  echo "$register_response" > "$outdir/register-response.json"
  echo "Registered test user $username. Response: $register_response" >>"$logfile"

  echo "2. Log in with that username and password (POST /users/login)," \
    "as documented in docs/Features/Login/example-input.txt" >>"$logfile"
  local login_response
  login_response=$(curl -sS -H "Content-type: application/json" \
    "$WEKAN_TEST_URL/users/login" \
    -d "{\"username\":\"$username\",\"password\":\"$password\"}")
  {
    echo
    echo "# 2. Login response"
    echo "$login_response"
  } >>"$outputfile"
  echo "$login_response" > "$outdir/login-response.json"
  echo "Login response: $login_response" >>"$logfile"

  local token userId
  token=$(echo "$login_response" | jq -r '.token // empty' 2>/dev/null)
  userId=$(echo "$login_response" | jq -r '.id // empty' 2>/dev/null)
  if [ -n "$token" ] && [ -n "$userId" ]; then
    record_result "PASS: password login for $username returned a token." "$resultfile" "$logfile"
    jq -n --arg url "$WEKAN_TEST_URL" --arg token "$token" \
      --arg userId "$userId" --arg username "$username" \
      '{url:$url, token:$token, userId:$userId, username:$username}' \
      > "$STATE_DIR/session.json"
  else
    record_result "FAIL: password login did not return a token; see output.txt" "$resultfile" "$logfile"
  fi
}

# ImportExport/PDF: create a board through the REST API, then download its
# PDF export (models/exportPDF.js GET /api/boards/:boardId/exportPDF), the
# request shape documented at docs/Features/ImportExport/PDF/example-input.txt.
run_export_pdf() {
  local relpath="$1" outdir="$2" outputfile="$3" resultfile="$4" logfile="$5"
  if ! ensure_server; then
    record_result "SKIPPED: no WeKan server available at $WEKAN_TEST_URL." "$resultfile" "$logfile"
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
    run_login_password "Login" "$outdir" "$outputfile" "$resultfile" "$logfile"
    token=$(jq -r '.token // empty' "$STATE_DIR/session.json" 2>/dev/null)
    : > "$resultfile"
  fi
  if [ -z "$token" ]; then
    record_result "FAIL: no login token available; cannot create a board to export." \
      "$resultfile" "$logfile"
    return
  fi

  echo "3. Create a board to export (POST /api/boards)" >>"$logfile"
  local board_response
  board_response=$(curl -sS -H "Authorization: Bearer $token" \
    -H "Content-type: application/json" -X POST "$WEKAN_TEST_URL/api/boards" \
    -d '{"title":"Test Menu Board","permission":"private","color":"nephritis"}')
  {
    echo
    echo "# 3. Create board response"
    echo "$board_response"
  } >>"$outputfile"
  echo "$board_response" > "$outdir/create-board-response.json"
  echo "Create board response: $board_response" >>"$logfile"
  local boardId
  boardId=$(echo "$board_response" | jq -r '._id // .data._id // empty' 2>/dev/null)
  if [ -z "$boardId" ]; then
    record_result "FAIL: could not create a board; see output.txt" "$resultfile" "$logfile"
    return
  fi
  echo "Created board $boardId." >>"$logfile"

  echo "4. Export that board to PDF (GET /api/boards/:boardId/exportPDF)," \
    "as documented in docs/Features/ImportExport/PDF/example-input.txt" >>"$logfile"
  curl -sS -H "Authorization: Bearer $token" \
    "$WEKAN_TEST_URL/api/boards/$boardId/exportPDF?authToken=$token" \
    -o "$outdir/board.pdf"
  if [ -s "$outdir/board.pdf" ] && head -c4 "$outdir/board.pdf" | grep -q "%PDF"; then
    local size
    size=$(wc -c < "$outdir/board.pdf" | tr -d ' ')
    {
      echo
      echo "# 4. Export result"
      echo "board.pdf: $size bytes, starts with $(head -c8 "$outdir/board.pdf")"
    } >>"$outputfile"
    record_result "PASS: exported board $boardId to board.pdf ($size bytes)." \
      "$resultfile" "$logfile"
  else
    echo "board.pdf is not a valid PDF (missing %PDF header)." >>"$outputfile"
    record_result "FAIL: board.pdf is not a PDF; see output.txt" "$resultfile" "$logfile"
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
# automated tests and runs them (a real exercise of the WeKan source, for
# features that do not (yet) have a dedicated interactive runner above), and
# when there is genuinely no test to run, points at the feature's checked-in
# docs/Features/<path>/example-input.txt instead. Either way output.txt and
# result.txt are always written and never empty.
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

# Every keyword derived from the leaf's own name (not its parent's - those are
# far too generic, e.g. "board") whose filename or file contents mention it.
find_matching_tests() {
  # Filename-only, deliberately: an early version also grep'd file CONTENTS
  # for a keyword once the filename search failed, but "webhook" appears in
  # passing in a dozen files that are not about webhooks at all (an SSRF
  # guard test, an admin-panel pane list, ...), so it pulled in noise that
  # made the eventual PASS/FAIL count meaningless. A feature whose name
  # genuinely appears nowhere in a test's own filename falls through to
  # find_doc_example below instead of a false-positive test run.
  local kws="$1"
  local -a matches=()
  local f base kw hit
  shopt -s nocasematch
  for f in "$ROOT_DIR"/tests/*.test.cjs; do
    [ -e "$f" ] || continue
    base="$(basename "$f")"
    hit=0
    for kw in $kws; do
      [ "${#kw}" -lt 4 ] && continue
      if [[ "$base" == *"$kw"* ]]; then hit=1; break; fi
    done
    [ "$hit" -eq 1 ] && matches+=("$f")
  done
  shopt -u nocasematch
  printf '%s\n' "${matches[@]}"
}

# The feature's own checked-in example input, if any: docs/Features/<path>/
# example-input.txt - a worked example (a curl call, a URL, a JSON body),
# hand-written for Login and ImportExport/PDF and extracted from the
# feature's own .md for the rest. Never written to by this script.
example_input_file() {
  local f="$FEATURES_DIR/$1/example-input.txt"
  [ -f "$f" ] && echo "$f"
}

run_generic_fallback() {
  local relpath="$1" outdir="$2" outputfile="$3" resultfile="$4" logfile="$5"
  local leaf kws node_bin example_file
  leaf="$(basename "$relpath")"
  kws="$(derive_keywords "$leaf")"
  node_bin="$(resolve_node)"
  example_file="$(example_input_file "$relpath")"

  echo "No dedicated runner for '$relpath'; matching against: $kws" >>"$logfile"
  if [ -n "$example_file" ]; then
    echo "Example input: ${example_file#"$ROOT_DIR"/}" >>"$logfile"
  else
    echo "No example-input.txt for '$relpath' either." >>"$logfile"
  fi

  local -a matches=()
  if [ -n "$node_bin" ]; then
    while IFS= read -r f; do [ -n "$f" ] && matches+=("$f"); done \
      < <(find_matching_tests "$kws")
  fi

  if [ "${#matches[@]}" -gt 0 ]; then
    {
      echo "# Running this repo's own automated tests that match '$leaf'"
      [ -n "$example_file" ] && \
        echo "# (input: ${example_file#"$ROOT_DIR"/})"
      echo "$node_bin ${matches[*]##*/}"
    } >>"$outputfile"
    echo "$node_bin ${matches[*]}" >>"$logfile"

    local pass=0 fail=0 f out rc
    for f in "${matches[@]}"; do
      out=$("$node_bin" "$f" 2>&1)
      rc=$?
      {
        echo
        echo "== $(basename "$f") =="
        echo "$out"
      } >>"$outputfile"
      echo "$out" >>"$logfile"
      if [ "$rc" -eq 0 ]; then
        pass=$((pass + 1))
      else
        fail=$((fail + 1))
        echo "FAIL: $(basename "$f")" >>"$logfile"
      fi
    done
    record_result \
      "RESULT: $pass passed, $fail failed, out of ${#matches[@]} matched test(s)." \
      "$resultfile" "$logfile"
    return
  fi

  if [ -z "$node_bin" ]; then
    echo "(no usable node binary was found to run automated tests either)" >>"$logfile"
  fi

  if [ -n "$example_file" ]; then
    echo "No automated test matches '$relpath' and no server-dependent runner" \
      "is wired up for it; nothing was executed." >>"$outputfile"
    record_result \
      "SKIP: no automated check for '$relpath'; see ${example_file#"$ROOT_DIR"/} for its documented example." \
      "$resultfile" "$logfile"
  else
    echo "(no matching test and no example-input.txt for '$relpath')" >>"$outputfile"
    record_result \
      "SKIP: no automated test, running server, or documented example for '$relpath'. See docs/Features/$relpath." \
      "$resultfile" "$logfile"
  fi
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
  local outputfile="$outdir/output.txt" resultfile="$outdir/result.txt"
  local logfile="$outdir/run.log"
  : > "$outputfile"
  : > "$resultfile"
  {
    echo "===== $relpath - started $(date '+%Y-%m-%d %H:%M:%S %Z') ====="
    local ef
    ef="$(example_input_file "$relpath")"
    if [ -n "$ef" ]; then
      echo "Example input: ${ef#"$ROOT_DIR"/}"
    else
      echo "No checked-in example-input.txt for this feature."
    fi
  } > "$logfile"

  log "----- $relpath -----"
  local runner="${RUNNERS[$relpath]:-}"
  if [ -n "$runner" ]; then
    "$runner" "$relpath" "$outdir" "$outputfile" "$resultfile" "$logfile"
  else
    run_generic_fallback "$relpath" "$outdir" "$outputfile" "$resultfile" "$logfile"
  fi
  echo "===== $relpath - finished $(date '+%Y-%m-%d %H:%M:%S %Z') =====" >>"$logfile"
  log "  -> $outdir/result.txt"
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
echo "Example input for each feature: docs/Features/<path>/example-input.txt"
echo "Session directory: $SESSION_DIR"
echo "(output.txt, result.txt and run.log are saved there, mirrored into the"
echo " same subfolders as docs/Features)"
echo "WEKAN_TEST_URL=$WEKAN_TEST_URL (set this env var to point at an already-running WeKan)"

show_menu "$FEATURES_DIR" "WeKan Test Menu" 1

echo "Bye. Session saved under $SESSION_DIR"
