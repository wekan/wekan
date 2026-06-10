#!/bin/bash

# WeKan release script — commits pending changes and triggers GitHub Actions.
#
# Usage:
#   ./releases/release-all.sh PREVIOUS-VERSION NEW-VERSION
# Example:
#   ./releases/release-all.sh 8.40 8.41
#
# Before running this script:
#   - Add the new release section to CHANGELOG.md
#   - Make sure all code changes are ready to ship
#
# Manual (local) releases use ./releases/release.sh instead. This script is the
# GitHub Actions path: it prepares the version locally and triggers release-all.yml.
#
# What this script does:
#   1. Bumps all WeKan/Node/MongoDB version numbers (./releases/version.sh)
#   2. Commits and pushes any pending changes (e.g. CHANGELOG.md + version bumps)
#   3. Triggers the GitHub Actions release workflow (release-all.yml)
#   4. Updates the wekan.fi website (./releases/release-website.sh)
#
# GitHub Actions (release-all.yml) then automatically:
#   - Tags the pushed commit as v<new_version>
#   - Builds the amd64 bundle (full Meteor 3 build)
#   - Rebuilds native modules for arm64, win64, mac-amd64, mac-arm64 from the
#     amd64 base (only platforms MongoDB ships server binaries for; MongoDB 7.x
#     is the default database)
#   - Creates the GitHub Release with the newest CHANGELOG.md notes
#   - Uploads every wekan-<version>-<platform>.zip bundle to the release
#   - Builds and pushes the multi-arch Docker image to Docker Hub, Quay.io, GHCR
#   - Builds the snap on Launchpad (amd64 + arm64), pushes it to the Snap Store
#     and attaches the .snap files to the GitHub Release
#
# Track progress at: https://github.com/wekan/wekan/actions
#
# Required GitHub secrets (DOCKERHUB_AUTH, QUAY_AUTH, GHCR_AUTH, SNAP_AUTH,
# LP_CREDENTIALS) — how to create each one, the menu path at every website/CLI,
# and where to add them on GitHub — are documented in, and can be created with:
#   ./releases/create-github-secrets.sh

# Version update logic moved to ./releases/update-all-versions.sh
set -e

# Install the tools this release flow needs for the current platform (Ubuntu
# amd64/arm64 via apt, macOS amd64/arm64 via brew) if they are not present yet.
. "$(cd "$(dirname "$0")" && pwd)/ensure-tools.sh"
ensure_tools git gh curl wget

# Extract latest and previous version from CHANGELOG.md (e.g. # v8.98 2026-04-16)
#RELEASE_LINES=( $(grep -E '^# v[0-9]+\.[0-9]+(\.[0-9]+)?[ -]+[0-9]{4}-[0-9]{2}-[0-9]{2}' CHANGELOG.md | head -2) )
#LATEST_VERSION=$(echo "${RELEASE_LINES[0]}" | grep -oE 'v[0-9]+\.[0-9]+(\.[0-9]+)?' | head -1 | sed 's/^v//')
#PREVIOUS_VERSION=$(echo "${RELEASE_LINES[1]}" | grep -oE 'v[0-9]+\.[0-9]+(\.[0-9]+)?' | head -1 | sed 's/^v//')
#if [ -z "$LATEST_VERSION" ] || [ -z "$PREVIOUS_VERSION" ]; then
#  echo "Could not determine both latest and previous version from CHANGELOG.md" >&2
#  exit 1
#fi
#echo "Latest version from CHANGELOG.md: $LATEST_VERSION"
#echo "Previous version from CHANGELOG.md: $PREVIOUS_VERSION"
#NEW="v${LATEST_VERSION}"
#OLD="v${PREVIOUS_VERSION}"
NEW=$2
OLD=$1

# Update all versions
./releases/version.sh $OLD $NEW

# Resolve repo root from script location so this works regardless of CWD
REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_DIR"

# Rebuild the OpenAPI spec (public/api/wekan.yml) and HTML docs
# (public/api/wekan.html) from current source for this version, so the committed
# bundle and the wekan.fi website (updated below) both get up-to-date API docs.
./releases/rebuild-docs.sh "$NEW"

echo "=== WeKan release: v$OLD -> v$NEW ==="
echo ""

# ── Step 1: Commit and push any pending changes ─────────────────────────────
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "--- Committing pending changes ---"
  git add --all
  git commit -m "Prepare v$NEW release"
  echo "Done."
  echo ""
fi

# Push if there are unpushed commits
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse @{upstream} 2>/dev/null || echo "")
if [ "$LOCAL" != "$REMOTE" ]; then
  echo "--- Pushing to remote ---"
  git push
  echo "Done."
  echo ""
fi

# ── Step 2: Trigger the release workflow ─────────────────────────────────────
echo "--- Triggering GitHub Actions release workflow ---"
gh workflow run release-all.yml \
  -f old_version="$OLD" \
  -f new_version="$NEW"
echo "Done."
echo ""

echo "=== Release workflow triggered for v$NEW ==="
echo "    Follow at: https://github.com/wekan/wekan/actions"
echo ""
# .github.com/workflows/release-all.yml automaticall updates
# versions at website wekan.fi/install/
# so manual website update is not needed:
# Update the website:"
./releases/release-website.sh $OLD $NEW
