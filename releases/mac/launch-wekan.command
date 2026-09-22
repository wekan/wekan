#!/bin/bash
set -euo pipefail

resources="$(cd "$(dirname "$0")" && pwd -P)"
bundle="$resources/bundle"

if [ ! -x "$bundle/node" ] || [ ! -x "$bundle/ferretdb" ] || [ ! -x "$bundle/start-wekan.sh" ]; then
  echo "WeKan app is incomplete: Node.js, FerretDB or start-wekan.sh is missing." >&2
  exit 1
fi

: "${WRITABLE_PATH:=$HOME/Library/Application Support/WeKan}"
: "${PORT:=8080}"
: "${ROOT_URL:=http://localhost:$PORT}"
export WRITABLE_PATH PORT ROOT_URL
mkdir -p "$WRITABLE_PATH"

echo "WeKan is starting in this Terminal window."
echo "Open: $ROOT_URL"
echo "Data: $WRITABLE_PATH"
echo "Stop: Ctrl-C"
echo

exec "$bundle/start-wekan.sh" "$@"
