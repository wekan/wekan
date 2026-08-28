#!/usr/bin/env bash
# Generate repeatable browser traffic against a DEBUGSPEED WeKan server.

set -euo pipefail
WEKAN_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

printf 'WeKan localhost port [3000]: '
read -r WEKAN_PORT
WEKAN_PORT="${WEKAN_PORT:-3000}"
case "$WEKAN_PORT" in *[!0-9]*|'') echo 'Port must be a number.' >&2; exit 2 ;; esac

export DEBUGSPEED_URL="http://127.0.0.1:$WEKAN_PORT"
export DEBUGSPEED_CLIENTS="${DEBUGSPEED_CLIENTS:-4}"
export DEBUGSPEED_SECONDS="${DEBUGSPEED_SECONDS:-60}"

NODE_BIN="${NODE_EXECUTABLE:-}"
if [ -z "$NODE_BIN" ] && command -v node >/dev/null 2>&1; then
  NODE_BIN="$(command -v node)"
fi
if [ -z "$NODE_BIN" ]; then
  # The sandbox/build instructions install Node here. Sort by version and use
  # the newest local toolchain rather than the host's potentially incompatible
  # executable.
  NODE_BIN="$(find "$WEKAN_DIR/.tools" -maxdepth 3 -type f -path '*/bin/node' 2>/dev/null | sort -V | tail -n 1)"
fi
if [ -z "$NODE_BIN" ] || [ ! -x "$NODE_BIN" ]; then
  echo 'Node.js was not found; install it with the repository sandbox instructions.' >&2
  exit 1
fi
NPM_BIN="$(dirname "$NODE_BIN")/npm"
if [ ! -x "$NPM_BIN" ]; then
  echo "npm was not found beside $NODE_BIN" >&2
  exit 1
fi

# Keep the browser paired with this checkout instead of depending on (or
# filling) ~/.cache. The normal Playwright configuration uses the same path.
export PLAYWRIGHT_BROWSERS_PATH="${PLAYWRIGHT_BROWSERS_PATH:-$WEKAN_DIR/.tools/ms-playwright}"

if ! curl -fsS "$DEBUGSPEED_URL" >/dev/null; then
  echo "WeKan is not responding at $DEBUGSPEED_URL" >&2
  exit 1
fi

if [ ! -f "$WEKAN_DIR/tests/playwright/node_modules/playwright/index.mjs" ]; then
  echo 'Installing the repository Playwright dependencies ...'
  (cd "$WEKAN_DIR/tests/playwright" && "$NPM_BIN" install)
fi

CHROMIUM_PATH="$("$NODE_BIN" --input-type=module -e \
  "import { chromium } from './tests/playwright/node_modules/playwright/index.mjs'; console.log(chromium.executablePath())" \
  2>/dev/null || true)"
if [ -z "$CHROMIUM_PATH" ] || [ ! -x "$CHROMIUM_PATH" ]; then
  echo "Installing the repository Playwright Chromium in $PLAYWRIGHT_BROWSERS_PATH ..."
  (cd "$WEKAN_DIR/tests/playwright" && \
    "$NODE_BIN" node_modules/playwright/cli.js install chromium)
  CHROMIUM_PATH="$("$NODE_BIN" --input-type=module -e \
    "import { chromium } from './tests/playwright/node_modules/playwright/index.mjs'; console.log(chromium.executablePath())")"
  if [ ! -x "$CHROMIUM_PATH" ]; then
    echo "Playwright Chromium was not installed at $CHROMIUM_PATH" >&2
    exit 1
  fi
fi

echo "Running $DEBUGSPEED_CLIENTS browser clients for $DEBUGSPEED_SECONDS seconds."
if [ -n "${DEBUGSPEED_USERNAME:-}" ]; then
  echo 'Authenticated mode: clients will open visible boards repeatedly.'
else
  echo 'Anonymous mode: set DEBUGSPEED_USERNAME and DEBUGSPEED_PASSWORD to exercise boards.'
fi
"$NODE_BIN" "$WEKAN_DIR/releases/debug-speed-traffic.mjs"
