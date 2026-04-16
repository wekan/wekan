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


# Require only the new version as argument, extract old version from CHANGELOG.md
if [ $# -ne 1 ]; then
  echo "Usage:   ./releases/release-all.sh NEW-VERSION"
  echo "Example: ./releases/release-all.sh 8.99"
  exit 1
fi

NEW="$1"

# Validate version number format: digits.digits only
if ! echo "$NEW" | grep -qE '^[0-9]+\.[0-9]+$'; then
  echo "Error: version number must be in X.Y format (e.g. 8.99)"
  exit 1
fi

# Extract previous version from top of CHANGELOG.md (e.g. # v8.98 - 2026-04-16)
OLD=$(grep -m1 -oE '^# v[0-9]+\.[0-9]+' CHANGELOG.md | head -1 | sed 's/^# v//')
if [ -z "$OLD" ]; then
  echo "Error: could not determine previous version from CHANGELOG.md"
  exit 1
fi

set -e

# Clean GitHub cache
gh cache delete --all || true

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
#echo "After the workflow completes, optionally update the website:"
#echo "    ./releases/release-website.sh $OLD $NEW"
