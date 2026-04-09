#!/usr/bin/env bash

# Fetch the latest Node.js 24.x release and update all files that hardcode
# the version number: Dockerfile, snapcraft.yaml, GitHub Actions workflow,
# rebuild-wekan.sh, and releases/test-download-urls.sh.
#
# Usage (standalone):
#   ./releases/update-node-version.sh
#
# Called automatically by releases/release-all.sh before every release.

set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_DIR"


# BSD sed (macOS) requires an empty string after -i; GNU sed (Linux) does not.
if [ "$(uname)" = "Darwin" ]; then
  if ! command -v brew >/dev/null 2>&1; then
    echo "Homebrew not found. Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  fi
  if ! command -v curl >/dev/null 2>&1; then
    echo "curl not found. Installing curl with brew..."
    brew install curl
  fi
  sedi() { sed -i '' "$@"; }
else
  if ! command -v curl >/dev/null 2>&1; then
    echo "curl not found. Installing curl with apt-get..."
    sudo apt-get update && sudo apt-get install -y curl
  fi
  sedi() { sed -i "$@"; }
fi

# ── Fetch latest Node.js 24.x version ────────────────────────────────────────
echo "  Fetching latest Node.js 24.x version from nodejs.org..."

# The directory listing always contains a line like:
#   node-v24.14.1-linux-x64.tar.gz
# Extract the version from the first x64 tarball listed.
NEW_NODE=$(curl -fsSL https://nodejs.org/dist/latest-v24.x/ \
  | grep -o 'node-v24\.[0-9][0-9]*\.[0-9][0-9]*-linux-x64\.tar\.gz' \
  | head -1 \
  | sed 's/node-v\(.*\)-linux-x64\.tar\.gz/\1/')

if [ -z "$NEW_NODE" ]; then
  echo "Error: could not determine latest Node.js 24.x version." >&2
  exit 1
fi

echo "  Latest Node.js 24.x: $NEW_NODE"

# ── Dockerfile ────────────────────────────────────────────────────────────────
# Matches:  NODE_VERSION=v24.14.1
sedi "s|NODE_VERSION=v24\.[0-9][0-9]*\.[0-9][0-9]*|NODE_VERSION=v${NEW_NODE}|g" \
  Dockerfile

# ── snapcraft.yaml ───────────────────────────────────────────────────────────
# Matches:  npm-node-version: 24.14.1
sedi "s|npm-node-version: 24\.[0-9][0-9]*\.[0-9][0-9]*|npm-node-version: ${NEW_NODE}|g" \
  snapcraft.yaml
# Matches:  NODE_VERSION="24.14.1"   (in wekan override-build)
sedi "s|NODE_VERSION=\"24\.[0-9][0-9]*\.[0-9][0-9]*\"|NODE_VERSION=\"${NEW_NODE}\"|g" \
  snapcraft.yaml
# Matches comment:  matching Node.js 24.14.1 binary
sedi "s|Node\.js 24\.[0-9][0-9]*\.[0-9][0-9]* binary|Node.js ${NEW_NODE} binary|g" \
  snapcraft.yaml

# ── .github/workflows/release-all.yml ────────────────────────────────────────
WORKFLOW=".github/workflows/release-all.yml"
# Matches:  node-version: '24.14.1'  (actions/setup-node, windows job)
sedi "s|node-version: '24\.[0-9][0-9]*\.[0-9][0-9]*'|node-version: '${NEW_NODE}'|g" \
  "$WORKFLOW"
# Matches:  node:24.14.1-slim  (docker run commands and comments)
sedi "s|node:24\.[0-9][0-9]*\.[0-9][0-9]*-slim|node:${NEW_NODE}-slim|g" \
  "$WORKFLOW"
# Matches version number in comments:  bundles: 24.14.1 (ABI
sedi "s|bundles: 24\.[0-9][0-9]*\.[0-9][0-9]* (ABI|bundles: ${NEW_NODE} (ABI|g" \
  "$WORKFLOW"
# Matches:  Node 24.14.1 — the exact version bundled
sedi "s|Node 24\.[0-9][0-9]*\.[0-9][0-9]* —|Node ${NEW_NODE} —|g" \
  "$WORKFLOW"

# ── rebuild-wekan.sh ──────────────────────────────────────────────────────────
# Matches:  sudo n 24.14.1
sedi "s|sudo n 24\.[0-9][0-9]*\.[0-9][0-9]*|sudo n ${NEW_NODE}|g" \
  rebuild-wekan.sh

# ── releases/test-download-urls.sh ───────────────────────────────────────────
# Matches URL path:    /v24.14.1/
sedi "s|/v24\.[0-9][0-9]*\.[0-9][0-9]*/|/v${NEW_NODE}/|g" \
  releases/test-download-urls.sh
# Matches tarball name:  node-v24.14.1-
sedi "s|node-v24\.[0-9][0-9]*\.[0-9][0-9]*-|node-v${NEW_NODE}-|g" \
  releases/test-download-urls.sh
# Matches label text:  Node.js 24.14.1
sedi "s|Node\.js 24\.[0-9][0-9]*\.[0-9][0-9]*|Node.js ${NEW_NODE}|g" \
  releases/test-download-urls.sh

echo "  Updated all files to Node.js $NEW_NODE."
