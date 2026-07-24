#!/usr/bin/env bash
# ── Repoint stale commit links in the not-yet-released CHANGELOG section ──────
#
# Every CHANGELOG bullet links the commit it describes. Those links are written
# BEFORE a release, so anything that rewrites history in between — a rebase onto
# an upstream change, an amend, a squash, a version-bump rebase — changes the
# hashes and leaves every link in the not-yet-released section pointing at a
# commit that no longer exists. Pushed like that, all of them 404.
#
# So: for each commit link in the section, if the hash is no longer an ancestor
# of HEAD, look up that old commit's SUBJECT (the pre-rewrite object is still in
# the clone, reachable via the reflog) and find the commit on this branch with
# the same subject — the rewritten copy of the same commit — and repoint the
# link to it.
#
# Only the UNRELEASED section is touched: the "# Upcoming WeKan ® release"
# section if present, otherwise the newest "# vNN.MM ..." heading (the release
# may already have been renamed). Earlier sections are already pushed and their
# hashes are correct, so a hash quoted in an older entry is never touched. A
# link that cannot be resolved is reported and left alone — a doc link is never
# a reason to fail.
#
# Used by BOTH releases/release-all.sh (before a release) and rebuild-wekan.sh
# (Setup → "Update git ..."), so the logic lives in ONE place.
#
# Usage: releases/fix-changelog-hashes.sh [CHANGELOG_FILE]
#   CHANGELOG_FILE defaults to CHANGELOG.md at the repo root (env override
#   CHANGELOG_FILE=... also works). Always exits 0.

# Resolve repo root from this script's location so it works from any CWD.
REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_DIR" || exit 0

CHANGELOG_FILE="${1:-${CHANGELOG_FILE:-CHANGELOG.md}}"

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
    echo "--- Repointed $fixed stale commit link(s) in $CHANGELOG_FILE (history was rewritten since they were written) ---"
  else
    echo "    All commit links in the unreleased section are current."
  fi
  if [ "${#unresolved[@]}" -gt 0 ]; then
    echo ""
    echo "WARNING: ${#unresolved[@]} commit link(s) in the unreleased section could not be resolved:"
    printf '    %s\n' "${unresolved[@]}"
    echo "         They are left as-is and will 404 on GitHub. Fix them by hand if they matter."
    echo ""
  fi
}

echo "--- Checking $CHANGELOG_FILE commit links against this branch ---"
fix_upcoming_commit_hashes
exit 0
