#!/usr/bin/env sh
set -eu
cd "$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
: "${MONGO_URL:?Set MONGO_URL to your MongoDB-compatible database}"
: "${ROOT_URL:?Set ROOT_URL to the public URL of WeKan}"
export PORT="${PORT:-3000}"
exec ./bun index.mjs "$@"
