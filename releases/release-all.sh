#!/bin/bash

# WeKan REMOTE release script — pushes your CHANGELOG.md edit and triggers the
# GitHub Actions release workflow, which does EVERYTHING else remotely.
#
# For a fully LOCAL release (build on this machine), use ./releases/release.sh.
# This script (release-all.sh) is the REMOTE path: nothing is built, bumped or
# published on your machine — GitHub Actions does it all, in parallel.
#
# Usage:
#   1. Add the new release section to CHANGELOG.md (e.g. "# v9.36 2026-06-10").
#   2. Run:
#        ./releases/release-all.sh                 # versions read from CHANGELOG.md
#      or override explicitly:
#        ./releases/release-all.sh 9.35 9.36       # PREVIOUS NEW
#
# What this script does locally (the only local steps):
#   1. Determines PREVIOUS and NEW version (from CHANGELOG.md, or from args).
#   2. Commits and pushes pending changes (your CHANGELOG.md edit) to main so the
#      workflow can read them.
#   3. Triggers .github/workflows/release-all.yml.
#
# GitHub Actions (release-all.yml) then does everything else remotely, in
# parallel where possible:
#   - bump:    runs releases/version.sh + releases/rebuild-docs.sh on the runner
#              (updates Node/MongoDB/WeKan versions, rebuilds API docs), commits
#              and pushes the bump to wekan/wekan main.
#   - website: updates the wekan/wekan.fi repo (install page + API docs) and pushes.
#   - charts:  updates and publishes the wekan/charts Helm chart and pushes.
#   - builds:  tags v<new>, builds amd64/arm64/win64/mac bundles, creates the
#              GitHub Release, builds+pushes Docker images, builds the snap.
#
# Track progress at: https://github.com/wekan/wekan/actions
#
# Required GitHub secrets (DOCKERHUB_AUTH, QUAY_AUTH, GHCR_AUTH, SNAP_AUTH,
# LP_CREDENTIALS, and WEKAN_REPO_TOKEN for pushing to wekan.fi + charts) are
# documented in, and can be created with: ./releases/create-github-secrets.sh

set -e

# Install the tools this trigger needs (Ubuntu apt / macOS brew) if missing.
. "$(cd "$(dirname "$0")" && pwd)/ensure-tools.sh"
ensure_tools git gh

# Resolve repo root from script location so this works regardless of CWD.
REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_DIR"

# ── Determine PREVIOUS (OLD) and NEW version ────────────────────────────────
# Explicit args win; otherwise read the top two "# v<x> <date>" headings from
# CHANGELOG.md (newest first).
if [ -n "${1:-}" ] && [ -n "${2:-}" ]; then
  OLD="${1#v}"
  NEW="${2#v}"
else
  mapfile -t RELEASE_LINES < <(grep -E '^# v[0-9]+\.[0-9]+(\.[0-9]+)?[ -]+[0-9]{4}-[0-9]{2}-[0-9]{2}' CHANGELOG.md | head -2)
  NEW=$(echo "${RELEASE_LINES[0]:-}" | grep -oE 'v[0-9]+\.[0-9]+(\.[0-9]+)?' | head -1 | sed 's/^v//')
  OLD=$(echo "${RELEASE_LINES[1]:-}" | grep -oE 'v[0-9]+\.[0-9]+(\.[0-9]+)?' | head -1 | sed 's/^v//')
  if [ -z "$NEW" ] || [ -z "$OLD" ]; then
    echo "Error: could not detect both NEW and PREVIOUS version from CHANGELOG.md." >&2
    echo "Add a '# v<new> <YYYY-MM-DD>' heading, or pass versions: $0 9.35 9.36" >&2
    exit 1
  fi
fi

echo "=== WeKan remote release: v$OLD -> v$NEW ==="
echo "    Previous version (from CHANGELOG.md): v$OLD"
echo "    New version      (from CHANGELOG.md): v$NEW"
echo ""

# ── Step 1: Push your pending CHANGELOG.md edit so the workflow can read it ──
# This is the only thing built/changed on your machine. version bumps, docs,
# builds and cross-repo updates all happen remotely in GitHub Actions.
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "--- Committing and pushing pending changes (e.g. CHANGELOG.md) ---"
  git add --all
  git commit -m "Prepare v$NEW release"
fi

LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse @{upstream} 2>/dev/null || echo "")
if [ "$LOCAL" != "$REMOTE" ]; then
  echo "--- Pushing to remote ---"
  git push
fi
echo ""

# ── Step 2: Trigger the GitHub Actions release workflow ─────────────────────
echo "--- Triggering GitHub Actions release workflow (release-all.yml) ---"
gh workflow run release-all.yml \
  -f old_version="$OLD" \
  -f new_version="$NEW"
echo ""

echo "=== Remote release triggered for v$NEW ==="
echo "    Everything else (version bump, docs, website, charts, builds, Docker,"
echo "    snap) now runs on GitHub Actions, in parallel where possible."
echo "    Follow at: https://github.com/wekan/wekan/actions"
