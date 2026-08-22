#!/usr/bin/env bash
if [ -n "${ZSH_VERSION:-}" ]; then exec /bin/bash "$0" "$@"; fi

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
# Detect OS and ensure Python 3 and pip are available.
. "$REPO_DIR/releases/ensure-tools.sh"
if [ "$(_et_os)" = macos ]; then
  _et_brew_ensure
  command -v python3 >/dev/null 2>&1 || brew install python
else
  ensure_tools python3 python3-pip
fi

# Use /usr/bin/env for python3 and pip3
PYTHON=$(command -v python3 || command -v /usr/bin/python3)
PIP=$(command -v pip3 || echo "")

# If pip3 is missing, try to install it
if [ -z "$PIP" ]; then
  echo "pip3 not found. Attempting to install pip3..."
  if $PYTHON -m ensurepip --upgrade 2>/dev/null; then
    PIP=$(command -v pip3 || echo "")
  fi
  if [ -z "$PIP" ]; then
    ensure_tools python3-pip
    PIP=$(command -v pip3 || echo "")
  fi
fi

# Install esprima if missing.
# Python 3.12+ on Debian/Ubuntu marks the system interpreter as
# "externally managed" (PEP 668), which rejects `pip install --user`. Fall back
# to --break-system-packages so the script works directly with Python 3.12.3.
if ! $PYTHON -c "import esprima" 2>/dev/null; then
  echo "  Installing Python package: esprima"
  if $PYTHON -m pip install --quiet --user --upgrade esprima 2>/dev/null; then
    :
  elif $PYTHON -m pip install --quiet --user --break-system-packages --upgrade esprima 2>/dev/null; then
    :
  elif $PYTHON -m pip install --quiet --break-system-packages --upgrade esprima; then
    :
  else
    echo "Failed to install the 'esprima' package. Please install it manually:" >&2
    echo "  $PYTHON -m pip install --user --break-system-packages esprima" >&2
    exit 1
  fi
fi

# ── Generate OpenAPI 2.0 YAML from models/ and server/models/ ─────────────────
# Always regenerate from source so the spec reflects the current code.
# SimpleSchema definitions live in models/ while the REST routes that use them
# live in server/models/ (Meteor 3 split), so both directories must be scanned.
# The generator writes only YAML to stdout; all debug output goes to stderr.
echo "  Generating public/api/wekan.yml from models/ and server/models/ ..."
"$PYTHON" openapi/generate_openapi.py --release "v$VERSION" models server/models \
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
