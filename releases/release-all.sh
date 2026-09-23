#!/bin/bash
if [ -n "${ZSH_VERSION:-}" ]; then exec /bin/bash "$0" "$@"; fi

# WeKan REMOTE release script — pushes your CHANGELOG.md edit and triggers the
# GitHub Actions release workflow, which does EVERYTHING else remotely.
#
# For a fully LOCAL release (build on this machine), use ./releases/release.sh.
# This script (release-all.sh) is the REMOTE path: nothing is built, bumped or
# published on your machine — GitHub Actions does it all, in parallel.
#
# Usage:
#   1. Add your changes under a "# Upcoming WeKan ® release" section in
#      CHANGELOG.md - there isn't one lying around empty between releases,
#      so create it yourself from docs/DeveloperDocs/Changelog-Upcoming-Template.md
#      the moment you have a real entry for it.
#   2. Run (NO version number needed):
#        ./releases/release-all.sh
#      The script renames "# Upcoming ..." to the next version (always +1 minor)
#      dated today. You can also specify the same version pair explicitly:
#        ./releases/release-all.sh 9.35 9.36       # PREVIOUS NEW
#
# What this script does locally (the only local steps):
#   1. Repoints stale commit links in the CHANGELOG section being released: a rebase,
#      amend or squash between writing an entry and releasing it changes the hashes,
#      and the links would 404 once pushed. Each is remapped by commit subject.
#   2. Determines PREVIOUS and NEW version automatically: renames the "# Upcoming
#      WeKan ® release" heading to the next version. Missing or empty Upcoming notes
#      stop the script. An explicit "PREVIOUS NEW" pair must match the next version.
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
# Release notes summarize translation details as updated language names.
# Add **Languages updated:** metadata beneath the Translations group label.
# Notes include only In short, Security, translation languages, thanks and
# the changelog link. Other details stay in CHANGELOG.md. Never append
# "Binaries in these bundles" or a provenance table; retain provenance.tsv
# build artifacts and checksum verification separately.
#
# Track progress at: https://github.com/wekan/wekan/actions
#
# Required GitHub secrets (DOCKERHUB_AUTH, QUAY_AUTH, GHCR_AUTH, SNAP_AUTH,
# LP_CREDENTIALS, and WEKAN_REPO_TOKEN for pushing to wekan.fi + charts) are
# documented in, and can be created with: ./releases/create-github-secrets.sh

set -e
CHECK_ONLY=false
if [ "${1:-}" = --check ]; then CHECK_ONLY=true; shift; fi

# Check release notes before installing tools, changing files or contacting forges.
REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_DIR"
bash "$REPO_DIR/releases/check-upcoming-release.sh" "$REPO_DIR/CHANGELOG.md"
mkdir -p "$REPO_DIR/.tools/tmp"
export TMPDIR="$REPO_DIR/.tools/tmp"

# Refuse stale source reviews before changing release notes or publishing.
# The workflows repeat this gate against their own checkout.
python3 "$REPO_DIR/releases/check-telemetry.py" --source "$REPO_DIR"

python3 "$REPO_DIR/releases/remote-release.py" --audit
[ "$(git branch --show-current)" = main ] || { echo "Error: Release from main only." >&2; exit 1; }

case "$(git remote get-url origin)" in
  git@github.com:wekan/wekan|git@github.com:wekan/wekan.git|\
  ssh://git@github.com/wekan/wekan|ssh://git@github.com/wekan/wekan.git|\
  https://github.com/wekan/wekan.git|https://github.com/wekan/wekan) ;;
  *) echo 'Error: origin must point to wekan/wekan.' >&2; exit 1 ;;
esac

# Install the tools this trigger needs if missing.
. "$REPO_DIR/releases/ensure-tools.sh"
ensure_tools git gh
gh auth status

# ── Version helpers ─────────────────────────────────────────────────────────
# WeKan versions are NN.MM with a 2-digit minor. Encode NN.MM as the integer
# NN*100+MM so the release-to-release step (always +1) can be applied with
# plain integer arithmetic, and a minor of 99 rolls into the next major
# (9.99 -> 10.00).
wekan_enc() { local v="${1#v}"; local M="${v%%.*}"; local m="${v#*.}"; m="${m%%.*}"; echo $(( 10#$M * 100 + 10#$m )); }
wekan_dec() { printf '%d.%02d' $(( $1 / 100 )) $(( $1 % 100 )); }

# Check every version source before changing any files. A release can exist even
# when its changelog heading was mistakenly left as Upcoming.
LATEST="$(bash "$REPO_DIR/releases/latest-release-version.sh")"

# An Upcoming section with real entries is mandatory, including explicit versions.
OLD="$LATEST"
NEW="$(wekan_dec $(( $(wekan_enc "$OLD") + 1 )) )"
if [ -n "${1:-}" ] || [ -n "${2:-}" ] || [ "$#" -gt 2 ]; then
  if [ "$#" -ne 2 ] || [ "${1#v}" != "$OLD" ] || [ "${2#v}" != "$NEW" ]; then
    echo "Error: release must advance v$OLD to v$NEW; refusing stale or reused versions." >&2
    exit 1
  fi
fi

if [ "$CHECK_ONLY" = true ]; then
  echo "Release preflight passed: v$OLD -> v$NEW"
  exit 0
fi

# ── Repoint stale commit links in the section about to be released ───────────
# A rebase / amend / squash between writing a CHANGELOG bullet and releasing it
# rewrites the linked commit's hash, so the not-yet-released links would 404 once
# pushed. Just before the release is prepared, repoint each stale link in the
# unreleased section to the rewritten copy of the same commit (matched by commit
# subject). The logic lives in releases/fix-changelog-hashes.sh — shared with
# build.sh's "Update git ..." option so there is ONE implementation.
bash "$(dirname "$0")/fix-changelog-hashes.sh" || true

# ── Determine PREVIOUS (OLD) and NEW version — no version argument needed ────
DATE="$(date +%F)"
echo "--- Renaming '# Upcoming WeKan ® release' -> '# v$NEW $DATE WeKan ® release' ---"
_tmp="$(mktemp)"
sed "s|^# Upcoming WeKan ® release.*|# v$NEW $DATE WeKan ® release|" CHANGELOG.md > "$_tmp" && mv "$_tmp" CHANGELOG.md

# Do not open an empty Upcoming section. Add real notes before the next release.

echo "=== WeKan remote release: v$OLD -> v$NEW ==="
echo "    Previous version (changelog, package and local/remote tags): v$OLD"
echo "    New version: v$NEW"
echo ""

# ── Step 1: Push your pending CHANGELOG.md edit so the workflow can read it ──
# This is the only thing built/changed on your machine. version bumps, docs,
# builds and cross-repo updates all happen remotely in GitHub Actions.
if [ -n "$(git status --porcelain)" ]; then
  echo "--- Committing and pushing pending changes (e.g. CHANGELOG.md) ---"
  git add --all
  git commit -m "Prepare v$NEW release"
fi

LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse @{upstream} 2>/dev/null || echo "")
if [ "$LOCAL" != "$REMOTE" ]; then
  echo "--- Pushing to remote ---"
  git push origin HEAD:refs/heads/main
fi
echo ""

# ── Step 2: Trigger the GitHub Actions release workflow ─────────────────────
echo "--- Triggering GitHub Actions release workflow (release-all.yml) ---"
gh workflow run release-all.yml --repo wekan/wekan --ref main \
  -f old_version="$OLD" \
  -f new_version="$NEW"
echo ""

echo "=== Remote release triggered for v$NEW ==="
echo "    Everything else (version bump, docs, website, charts, builds, Docker,"
echo "    snap) now runs on GitHub Actions, in parallel where possible."
echo "    Follow at: https://github.com/wekan/wekan/actions"
