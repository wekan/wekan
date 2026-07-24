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
# Every CHANGELOG bullet links the commit it describes. Those links are written
# BEFORE the release, so anything that rewrites history in between — a rebase
# onto an upstream change, an amend, a squash — changes the hashes and leaves
# every link in the not-yet-released section pointing at a commit that no longer
# exists. Pushed like that, all of them 404.
#
# So, just before the release is prepared: for each commit link in the section
# being released, if the hash is no longer an ancestor of HEAD, look up that old
# commit's SUBJECT (the pre-rewrite object is still in the clone, reachable via
# the reflog) and find the commit on this branch with the same subject. That is
# the rewritten copy of the same commit, so the link is repointed to it.
#
# Only the unreleased section is touched — earlier sections are already pushed
# and their hashes are correct. A link that cannot be resolved is reported and
# left alone: a doc link is never a reason to abort a release.
CHANGELOG_FILE="${CHANGELOG_FILE:-CHANGELOG.md}"
fix_upcoming_commit_hashes() {
  [ -f "$CHANGELOG_FILE" ] || return 0
  git rev-parse --git-dir >/dev/null 2>&1 || return 0

  # The section to check: "# Upcoming ..." when it is still there, otherwise the
  # newest "# vNN.MM ..." heading (the release may already have been renamed).
  local start end
  start="$(grep -nE '^# Upcoming WeKan' "$CHANGELOG_FILE" | head -1 | cut -d: -f1)"
  [ -z "$start" ] && start="$(grep -nE '^# v[0-9]+\.[0-9]+ ' "$CHANGELOG_FILE" | head -1 | cut -d: -f1)"
  [ -z "$start" ] && return 0
  end="$(awk -v s="$start" 'NR>s && /^# v[0-9]+\.[0-9]+ /{print NR-1; exit}' "$CHANGELOG_FILE")"
  [ -z "$end" ] && end="$(wc -l < "$CHANGELOG_FILE")"

  local hashes
  hashes="$(sed -n "${start},${end}p" "$CHANGELOG_FILE" \
    | grep -oE 'commit/[0-9a-f]{7,40}' | sed 's|commit/||' | sort -u)"
  [ -z "$hashes" ] && return 0

  local h subject new fixed=0 unresolved=()
  for h in $hashes; do
    # Still on this branch: the link is fine.
    git merge-base --is-ancestor "$h" HEAD >/dev/null 2>&1 && continue
    subject="$(git log -1 --format=%s "$h" 2>/dev/null || true)"
    if [ -z "$subject" ]; then
      unresolved+=("$h (commit object is no longer in this clone)")
      continue
    fi
    # The rewritten copy: same subject, on this branch. Newest match wins.
    new="$(git log -n 300 --format='%h%x09%s' \
           | awk -F'\t' -v s="$subject" '$2==s {print $1; exit}')"
    if [ -z "$new" ]; then
      unresolved+=("$h (no commit on this branch with subject: $subject)")
      continue
    fi
    # Replace only inside the section, so an identical hash elsewhere is untouched.
    local _tmp
    _tmp="$(mktemp)"
    awk -v s="$start" -v e="$end" -v old="$h" -v repl="$new" '
      NR>=s && NR<=e { gsub("commit/" old, "commit/" repl) } { print }
    ' "$CHANGELOG_FILE" > "$_tmp" && mv "$_tmp" "$CHANGELOG_FILE"
    echo "    $h -> $new   ${subject:0:60}"
    fixed=$((fixed + 1))
  done

  if [ "$fixed" -gt 0 ]; then
    echo "--- Repointed $fixed stale commit link(s) in CHANGELOG.md (history was rewritten since they were written) ---"
  fi
  if [ "${#unresolved[@]}" -gt 0 ]; then
    echo ""
    echo "WARNING: ${#unresolved[@]} commit link(s) in the section being released could not be resolved:"
    printf '    %s\n' "${unresolved[@]}"
    echo "         They are left as-is and will 404 on GitHub. Fix them by hand if they matter."
    echo ""
  fi
}

echo "--- Checking CHANGELOG.md commit links against this branch ---"
fix_upcoming_commit_hashes

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
