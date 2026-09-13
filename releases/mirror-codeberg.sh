#!/bin/bash
# Human-run: synchronize missing GitHub data to this active mirror.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
export PATH="$ROOT/.tools/bin:${GOBIN:+$GOBIN:}$PATH"
FLAGS=(--apply --code)
if [ "${1:-}" = --preview ]; then FLAGS=(--code); shift; fi
node "$ROOT/tools/mirror-active-forges.mjs" --target codeberg "${FLAGS[@]}" "$@"
