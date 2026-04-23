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
# What this script does:
#   1. Commits and pushes any pending changes (e.g. CHANGELOG.md edits)
#   2. Triggers the GitHub Actions release workflow (release-all.yml)
#
# GitHub Actions (release-all.yml) then automatically:
#   - Updates Node.js to the latest 24.x across all files
#   - Rebuilds OpenAPI docs (wekan.yml + wekan.html) from current source
#   - Updates all WeKan version numbers in release files
#   - Commits the version bump and creates the git tag
#   - Builds amd64 bundle (full Meteor 3 build)
#   - Builds arm64, s390x, ppc64le, win64 bundles from the amd64 base
#   - Creates the GitHub Release with CHANGELOG notes
#   - Uploads all .zip bundles to the release
#   - Builds and pushes multi-platform Docker image to Docker Hub, Quay.io, GHCR
#   - Builds and publishes the snap package to the Snap Store
#   - Uploads the .snap file to the GitHub Release
#   - Updates Helm chart and deploys to GitHub Pages
#
# Track progress at: https://github.com/wekan/wekan/actions

# Version update logic moved to ./releases/update-all-versions.sh
set -e

# Extract latest and previous version from CHANGELOG.md (e.g. # v8.98 2026-04-16)
RELEASE_LINES=( $(grep -E '^# v[0-9]+\.[0-9]+(\.[0-9]+)?[ -]+[0-9]{4}-[0-9]{2}-[0-9]{2}' CHANGELOG.md | head -2) )
LATEST_VERSION=$(echo "${RELEASE_LINES[0]}" | grep -oE 'v[0-9]+\.[0-9]+(\.[0-9]+)?' | head -1 | sed 's/^v//')
PREVIOUS_VERSION=$(echo "${RELEASE_LINES[1]}" | grep -oE 'v[0-9]+\.[0-9]+(\.[0-9]+)?' | head -1 | sed 's/^v//')
if [ -z "$LATEST_VERSION" ] || [ -z "$PREVIOUS_VERSION" ]; then
  echo "Could not determine both latest and previous version from CHANGELOG.md" >&2
  exit 1
fi
echo "Latest version from CHANGELOG.md: $LATEST_VERSION"
echo "Previous version from CHANGELOG.md: $PREVIOUS_VERSION"
NEW="v${LATEST_VERSION}"
OLD="v${PREVIOUS_VERSION}"

# Update all versions
./releases/version.sh $OLD $NEW

# Resolve repo root from script location so this works regardless of CWD
REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_DIR"

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
