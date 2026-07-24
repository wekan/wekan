#!/bin/bash

# WeKan REMOTE release script — pushes your CHANGELOG.md edit and triggers the
# GitHub Actions release workflow, which does EVERYTHING else remotely.
#
# For a fully LOCAL release (build on this machine), use ./releases/release.sh.
# This script (release-all.sh) is the REMOTE path: nothing is built, bumped or
# published on your machine — GitHub Actions does it all, in parallel.
#
# Usage:
#   1. Add your changes under a "# Upcoming WeKan ® release" section in CHANGELOG.md.
#   2. Run (NO version number needed):
#        ./releases/release-all.sh
#      The script renames "# Upcoming ..." to the next version (the same increment as
#      the last release) dated today. You can still override explicitly:
#        ./releases/release-all.sh 9.35 9.36       # PREVIOUS NEW
#
# What this script does locally (the only local steps):
#   1. Repoints stale commit links in the CHANGELOG section being released: a rebase,
#      amend or squash between writing an entry and releasing it changes the hashes,
#      and the links would 404 once pushed. Each is remapped by commit subject.
#   2. Determines PREVIOUS and NEW version automatically: renames the "# Upcoming
#      WeKan ® release" heading to the next version, or (if already renamed) uses the
#      newest release heading. An explicit "PREVIOUS NEW" pair overrides this.
#   3. Commits and pushes pending changes (your CHANGELOG.md edit) to main so the
#      workflow can read them.
#   4. Triggers .github/workflows/release-all.yml.
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

# ── Version helpers ─────────────────────────────────────────────────────────
# WeKan versions are NN.MM with a 2-digit minor. Encode NN.MM as the integer
# NN*100+MM so the release-to-release step (normally +1) can be measured and
# re-applied, and a minor of 99 rolls into the next major (9.99 -> 10.00).
wekan_enc() { local v="${1#v}"; local M="${v%%.*}"; local m="${v#*.}"; m="${m%%.*}"; echo $(( 10#$M * 100 + 10#$m )); }
wekan_dec() { printf '%d.%02d' $(( $1 / 100 )) $(( $1 % 100 )); }

# The RELEASED versions from CHANGELOG.md ("# vNN.MM <date> ..." headings), newest
# first. The "# Upcoming ..." heading has no version, so it is skipped.
mapfile -t RELEASED < <(grep -oE '^# v[0-9]+\.[0-9]+ ' CHANGELOG.md | grep -oE '[0-9]+\.[0-9]+')

# ── Repoint stale commit links in the section about to be released ───────────
# A rebase / amend / squash between writing a CHANGELOG bullet and releasing it
# rewrites the linked commit's hash, so the not-yet-released links would 404 once
# pushed. Just before the release is prepared, repoint each stale link in the
# unreleased section to the rewritten copy of the same commit (matched by commit
# subject). The logic lives in releases/fix-changelog-hashes.sh — shared with
# rebuild-wekan.sh's "Update git ..." option so there is ONE implementation.
bash "$(dirname "$0")/fix-changelog-hashes.sh" || true

# ── Determine PREVIOUS (OLD) and NEW version — no version argument needed ────
# Explicit args still win. Otherwise:
#   * if there is a "# Upcoming WeKan ® release" section, RENAME it to the next
#     version (the same increment as the last release) dated today; OLD = newest
#     release, NEW = that next version.
#   * if there is NO Upcoming section, the newest heading is already the prepared
#     release, so use it as NEW (checked to be the expected increment of OLD, and
#     referenced by a recent commit, so an old entry is never re-released).
if [ -n "${1:-}" ] && [ -n "${2:-}" ]; then
  OLD="${1#v}"
  NEW="${2#v}"
elif grep -qE '^# Upcoming WeKan' CHANGELOG.md; then
  OLD="${RELEASED[0]:-}"
  if [ -z "$OLD" ]; then
    echo "Error: no released '# vNN.MM <date>' heading found in CHANGELOG.md." >&2
    exit 1
  fi
  STEP=1
  if [ -n "${RELEASED[1]:-}" ]; then
    STEP=$(( $(wekan_enc "${RELEASED[0]}") - $(wekan_enc "${RELEASED[1]}") ))
    [ "$STEP" -le 0 ] && STEP=1
  fi
  NEW="$(wekan_dec $(( $(wekan_enc "$OLD") + STEP )) )"
  DATE="$(date +%F)"
  echo "--- Renaming '# Upcoming WeKan ® release' -> '# v$NEW $DATE WeKan ® release' ---"
  _tmp="$(mktemp)"
  sed "s|^# Upcoming WeKan ® release.*|# v$NEW $DATE WeKan ® release|" CHANGELOG.md > "$_tmp" && mv "$_tmp" CHANGELOG.md
else
  NEW="${RELEASED[0]:-}"
  OLD="${RELEASED[1]:-}"
  if [ -z "$NEW" ] || [ -z "$OLD" ]; then
    echo "Error: could not detect NEW and PREVIOUS version from CHANGELOG.md" >&2
    echo "(no '# Upcoming WeKan ® release' section, and fewer than two '# vNN.MM' releases)." >&2
    echo "Add an Upcoming section (preferred) or pass versions: $0 9.35 9.36" >&2
    exit 1
  fi
  EXPECTED="$(wekan_dec $(( $(wekan_enc "$OLD") + 1 )) )"
  if [ "$NEW" != "$EXPECTED" ]; then
    echo "Note: newest CHANGELOG version v$NEW is not the +1 increment (v$EXPECTED) of the previous v$OLD; proceeding anyway."
  fi
  if git log -15 --format='%s' 2>/dev/null | grep -qF "$NEW"; then
    echo "    (v$NEW is referenced in a recent commit — treating it as the prepared release.)"
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
