#!/bin/bash

# WeKan full release script.
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
#   0. Rebuilds OpenAPI docs (wekan.yml + wekan.html) from current source
#   1. Updates all version numbers in release files
#   2. Commits and pushes the version bump
#   3. Creates and pushes the git tag  <-- this triggers GitHub Actions
#   4. Updates the website repo if ~/repos/w/wekan.fi exists
#
# GitHub Actions (release-all.yml) then automatically:
#   - Builds amd64 bundle (full Meteor 3 build)
#   - Builds arm64, s390x, win64 bundles from the amd64 base
#   - Creates the GitHub Release with CHANGELOG notes
#   - Uploads all four .zip bundles to the release
#   - Builds and pushes multi-platform Docker image to Docker Hub, Quay.io, GHCR
#   - Builds and publishes the snap package to the Snap Store
#   - Uploads the .snap file to the GitHub Release
#
# Track progress at: https://github.com/wekan/wekan/actions

if [ $# -ne 2 ]; then
  echo "Usage:   ./releases/release-all.sh PREVIOUS-VERSION NEW-VERSION"
  echo "Example: ./releases/release-all.sh 8.40 8.41"
  exit 1
fi

OLD="$1"
NEW="$2"

# Validate version number format: digits.digits only
if ! echo "$OLD" | grep -qE '^[0-9]+\.[0-9]+$' || \
   ! echo "$NEW" | grep -qE '^[0-9]+\.[0-9]+$'; then
  echo "Error: version numbers must be in X.Y format (e.g. 8.40)"
  exit 1
fi

# Resolve repo root from script location so this works regardless of CWD
REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
RELEASES_DIR="$REPO_DIR/releases"

# Stop immediately if any command fails
set -e

cd "$REPO_DIR"

echo "=== WeKan release: v$OLD  ->  v$NEW ==="
echo ""

# ── Step 0: Rebuild API docs from current source ─────────────────────────────
# Runs before the version bump so the freshly generated docs are included in
# the commit and therefore in both the wekan repo and the wekan.fi website.
echo "--- Step 0: Rebuilding API docs ---"
"$RELEASES_DIR/rebuild-docs.sh" "$NEW"
echo "Done."
echo ""

# ── Step 1: Update version numbers in all release files ─────────────────────
echo "--- Step 1: Updating version numbers ---"
"$RELEASES_DIR/sed-release-versions.sh" "$OLD" "$NEW"
echo "Done."
echo ""

# ── Step 2: Commit and push the version bump ────────────────────────────────
echo "--- Step 2: Committing and pushing version bump ---"
git add --all
git commit -m "v$NEW"
git push
echo "Done."
echo ""

# ── Step 3: Tag and push (this triggers GitHub Actions release-all.yml) ──────
echo "--- Step 3: Creating and pushing tag v$NEW ---"
git tag -a "v$NEW" -m "v$NEW"
git push origin "v$NEW"
echo "Done."
echo ""

echo "=== GitHub Actions is now building and releasing v$NEW ==="
echo "    Building:  amd64 (full Meteor build), arm64, s390x, win64 bundles"
echo "    Releasing: GitHub Release with CHANGELOG notes + all .zip bundles"
echo "    Docker:    wekanteam/wekan, quay.io/wekan/wekan, ghcr.io/wekan/wekan"
echo "    Snap:      published to Snap Store stable channel + uploaded to release"
echo "    Follow at: https://github.com/wekan/wekan/actions"
echo ""

# ── Step 4: Update website repo (skipped if not present) ─────────────────────
WEBSITE_DIR="$HOME/repos/w/wekan.fi"
if [ -d "$WEBSITE_DIR" ]; then
  echo "--- Step 4: Updating website ---"
  "$RELEASES_DIR/release-website.sh" "$OLD" "$NEW"
  echo "Done."
else
  echo "--- Step 4: Website repo not found at $WEBSITE_DIR, skipping ---"
  echo "    Run manually when ready: ./releases/release-website.sh $OLD $NEW"
fi
echo ""

echo "=== release-all.sh finished for v$NEW ==="
