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
#   0. Updates Node.js to the latest 24.x release across all files
#   1. Rebuilds OpenAPI docs (wekan.yml + wekan.html) from current source
#   2. Updates all WeKan version numbers in release files
#   3. Commits and pushes the version bump
#   4. Creates and pushes the git tag  <-- this triggers GitHub Actions
#   5. Updates the website repo if ~/repos/w/wekan.fi exists
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

# Delete all GitHub Actions Caches, so that old stuff does not break builds.
gh cache delete --all

# Resolve repo root from script location so this works regardless of CWD
REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
RELEASES_DIR="$REPO_DIR/releases"

# Stop immediately if any command fails
set -e

cd "$REPO_DIR"

echo "=== WeKan release: v$OLD  ->  v$NEW ==="
echo ""

# ── Check if this is a resume from a previous interrupted run ────────────────
if git tag -l | grep -q "^v$NEW$"; then
  echo "--- Resume detected: Tag v$NEW already exists locally ---"

  # Check if tag was already pushed
  if git ls-remote --tags origin 2>/dev/null | grep -q "refs/tags/v$NEW"; then
    echo "Tag v$NEW already exists on remote. Nothing to do!"
    echo "GitHub Actions release is already in progress at: https://github.com/wekan/wekan/actions"
    exit 0
  else
    echo "Tag exists locally but not on remote. Skipping to Step 4 (push only)..."
    SKIP_TO_STEP_4=1
  fi
else
  SKIP_TO_STEP_4=0
fi
echo ""

if [ "$SKIP_TO_STEP_4" = "0" ]; then

# ── Step 0: Update Node.js to the latest 24.x release ───────────────────────
# Fetches https://nodejs.org/dist/latest-v24.x/ and updates Dockerfile,
# snapcraft.yaml, GitHub Actions workflow, rebuild-wekan.sh, and
# releases/test-download-urls.sh so all platforms use the same newest version.
echo "--- Step 0: Updating Node.js to latest 24.x ---"
"$RELEASES_DIR/update-node-version.sh"
echo "Done."
echo ""

# ── Step 1: Rebuild API docs from current source ─────────────────────────────
# Runs before the version bump so the freshly generated docs are included in
# the commit and therefore in both the wekan repo and the wekan.fi website.
echo "--- Step 1: Rebuilding API docs ---"
"$RELEASES_DIR/rebuild-docs.sh" "$NEW"
echo "Done."
echo ""

# ── Step 2: Update WeKan version numbers in all release files ────────────────
echo "--- Step 2: Updating WeKan version numbers ---"
"$RELEASES_DIR/sed-release-versions.sh" "$OLD" "$NEW"
echo "Done."
echo ""

# ── Step 3: Commit and push ──────────────────────────────────────────────────
echo "--- Step 3: Committing and pushing version bump ---"
git add --all
if git diff --cached --quiet; then
  echo "No changes to commit (already at v$NEW). Skipping commit."
else
  git commit -m "v$NEW"
fi
timeout 60 git push || {
  echo "Warning: git push failed (timeout or connection error), continuing to tag push..."
}
echo "Done."
echo ""

fi  # End of: if [ "$SKIP_TO_STEP_4" = "0" ]

# ── Step 4: Tag and push (this triggers GitHub Actions release-all.yml) ──────
echo "--- Step 4: Creating and pushing tag v$NEW ---"

# Check if tag already exists locally
if git tag -l | grep -q "^v$NEW$"; then
  echo "Tag v$NEW already exists locally. Skipping tag creation."
else
  git tag -a "v$NEW" -m "v$NEW"
  echo "Created tag v$NEW"
fi

# Push tag to remote (always do this, in case it was created but not pushed)
echo "Pushing tag v$NEW to remote..."
timeout 60 git push origin "v$NEW" || {
  echo "Error: Failed to push tag v$NEW (timeout or connection error)"
  exit 1
}

# Verify tag was pushed
if ! git ls-remote --tags origin 2>/dev/null | grep -q "refs/tags/v$NEW"; then
  echo "Error: Tag v$NEW was not found on remote after push"
  exit 1
fi
echo "Done."
echo ""

echo "=== GitHub Actions is now building and releasing v$NEW ==="
echo "    Building:  amd64 (full Meteor build), arm64, s390x, ppc64le, armhf, win64 bundles"
echo "    Releasing: GitHub Release with CHANGELOG notes + all .zip bundles"
echo "    Docker:    wekanteam/wekan, quay.io/wekan/wekan, ghcr.io/wekan/wekan"
echo "    Snap:      published edge, released to candidate"
echo "    Follow at: https://github.com/wekan/wekan/actions"
echo ""

# ── Step 5: Update website repo (skipped if not present) ─────────────────────
WEBSITE_DIR="../w/wekan.fi"
if [ -d "$WEBSITE_DIR" ]; then
  echo "--- Step 5: Updating website ---"
  "$RELEASES_DIR/release-website.sh" "$OLD" "$NEW"
  echo "Done."
else
  echo "--- Step 5: Website repo not found at $WEBSITE_DIR, skipping ---"
  echo "    Run manually when ready: ./releases/release-website.sh $OLD $NEW"
fi
echo ""

echo "=== release-all.sh finished for v$NEW ==="
