#!/usr/bin/env bash

# Rebuild OpenAPI spec (wekan.yml) and HTML docs (wekan.html) from source.
#
# Usage:
#   ./releases/rebuild-docs.sh 8.43
#
# Output:
#   public/api/wekan.yml  — OpenAPI 2.0 spec parsed from models/
#   public/api/wekan.html — standalone HTML rendered by @redocly/cli
#
# Dependencies installed automatically if missing:
#   Python 3  + pip package: esprima
#   Node.js   + npx package: @redocly/cli (latest)

set -euo pipefail

if [ $# -ne 1 ]; then
  echo "Usage: ./releases/rebuild-docs.sh VERSION"
  echo "Example: ./releases/rebuild-docs.sh 8.43"
  exit 1
fi

VERSION="$1"
REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_DIR"

mkdir -p public/api

# ── Python dependency: esprima ────────────────────────────────────────────────
# The OpenAPI generator (openapi/generate_openapi.py) uses the esprima package
# to parse the JavaScript AST from models/*.js files.
if ! python3 -c "import esprima" 2>/dev/null; then
  echo "  Installing Python package: esprima"
  python3 -m pip install --quiet --user --upgrade esprima
fi

# ── Generate OpenAPI 2.0 YAML from models/ ────────────────────────────────────
# Always regenerate from source so the spec reflects the current code.
# The generator writes only YAML to stdout; all debug output goes to stderr.
echo "  Generating public/api/wekan.yml from models/ ..."
python3 openapi/generate_openapi.py --release "v$VERSION" models \
  > public/api/wekan.yml

# Sanity-check: the first line of a valid spec starts with "swagger:"
if ! head -1 public/api/wekan.yml | grep -q '^swagger:'; then
  echo "Error: generated wekan.yml does not look like a valid OpenAPI spec." >&2
  echo "       First line: $(head -1 public/api/wekan.yml)" >&2
  exit 1
fi

# ── Generate standalone HTML via @redocly/cli (latest) ───────────────────────
# @redocly/cli replaces the deprecated redoc-cli and api2html tools.
# npx --yes downloads it on first run without prompting.
echo "  Rendering public/api/wekan.html via @redocly/cli ..."
npx --yes @redocly/cli@latest build-docs public/api/wekan.yml \
  --output public/api/wekan.html \
  --title "WeKan REST API v$VERSION"

echo "  Done."
echo "    public/api/wekan.yml"
echo "    public/api/wekan.html"
