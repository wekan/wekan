#!/usr/bin/env bash
# ── Repoint stale commit links in the CHANGELOG ──────────────────────────────
#
# Every CHANGELOG bullet links the commit it describes. Those links are written
# BEFORE a release, so anything that rewrites history in between — a rebase onto
# an upstream change, an amend, a squash, a version-bump rebase — changes the
# hashes and leaves the links pointing at a commit that no longer exists.
# Pushed like that, all of them 404.
#
# What counts as STALE is the whole trick, and getting it wrong is worse than
# doing nothing: a link is fine when its commit is reachable from ANY ref in
# this clone — a branch OR a tag. A commit that is only in an old release tag is
# not on this branch, yet GitHub serves it perfectly well, and repointing it
# would silently send the reader to a different change. So the test here is
# `git for-each-ref --contains`, not "is it an ancestor of HEAD".
#
# When a hash really resolves to nothing, the replacement is looked for in this
# order, strongest evidence first:
#
#   1. the pre-rewrite object is still in the clone (the reflog keeps it): the
#      commit on a ref with the SAME subject AND the same author date is the
#      rewritten copy of it. Author date survives a rebase; the commit date does
#      not, which is why it is the one compared;
#   2. same subject, unique in recent history — a reworded amend is rare, a
#      repeated subject ("Updated ChangeLog.", "Bump versions for v9.99") is
#      not, so a subject that matches several commits is NOT used;
#   3. the same patch, by `git patch-id` — this is what survives a reword;
#   4. the object is gone entirely: if the first 9–12 characters still resolve
#      to a real commit, the tail was wrong (a short hash padded out to 40
#      characters) and the resolved commit is the one meant.
#
# Anything left over is reported, with its line, and left alone — a doc link is
# never a reason to fail a release.
#
# By default only the UNRELEASED section is touched ("# Upcoming WeKan ®
# release" if present, otherwise the newest "# vNN.MM ..." heading): earlier
# sections are already pushed and are normally correct. `--all-sections` checks
# the whole file, which is worth doing once in a while — it is how 106 dead
# links from earlier rewrites were found and fixed.
#
# Used by BOTH releases/release-all.sh (before a release) and build.sh
# (Setup → "Update git ..."), so the logic lives in ONE place.
#
# Usage: releases/fix-changelog-hashes.sh [--all-sections] [--dry-run] [CHANGELOG_FILE]
#   CHANGELOG_FILE defaults to CHANGELOG.md at the repo root (env override
#   CHANGELOG_FILE=... also works). Always exits 0.

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_DIR" || exit 0

ALL_SECTIONS=0
DRY_RUN=0
ARG_FILE=""
for arg in "$@"; do
  case "$arg" in
    --all-sections) ALL_SECTIONS=1 ;;
    --dry-run)      DRY_RUN=1 ;;
    -*)             echo "Unknown option: $arg" ;;
    *)              ARG_FILE="$arg" ;;
  esac
done
CHANGELOG_FILE="${ARG_FILE:-${CHANGELOG_FILE:-CHANGELOG.md}}"

# A commit any ref can reach — branch or tag — is a link that works on GitHub.
# The set is listed ONCE (`git rev-list --all` walks the history once; asking
# `for-each-ref --contains` per link would walk it again for every link, which
# --all-sections turns into thousands of walks).
REACHABLE_LIST="$(mktemp)"
trap 'rm -f "$REACHABLE_LIST"' EXIT
git rev-list --all 2>/dev/null | sort > "$REACHABLE_LIST"

reachable() {
  local full
  # An abbreviated hash has to be expanded first; an object that is not in this
  # clone at all cannot be reachable.
  full="$(git rev-parse --verify --quiet "$1^{commit}" 2>/dev/null)" || return 1
  [ -z "$full" ] && return 1
  LC_ALL=C grep -qxF "$full" "$REACHABLE_LIST"
}

# The rewritten copy of a commit whose object is still in the clone.
rewritten_copy() {
  local h="$1" subject date matches new
  subject="$(git log -1 --format=%s "$h" 2>/dev/null)" || return 1
  [ -z "$subject" ] && return 1
  date="$(git log -1 --format=%ad --date=short "$h" 2>/dev/null)"

  # 1. same subject AND same author date - a rebase keeps both.
  matches="$(git log --all --format='%H%x09%ad%x09%s' --date=short \
             | awk -F'\t' -v s="$subject" -v d="$date" '$2==d && $3==s {print $1}')"
  if [ "$(printf '%s\n' "$matches" | grep -c .)" = "1" ]; then
    printf '%s' "$matches"; return 0
  fi

  # 2. same subject, and only one commit has it.
  matches="$(git log --all --format='%H%x09%s' \
             | awk -F'\t' -v s="$subject" '$2==s {print $1}')"
  if [ "$(printf '%s\n' "$matches" | grep -c .)" = "1" ]; then
    printf '%s' "$matches"; return 0
  fi

  # 3. same patch - what survives a reword.
  local pid
  pid="$(git diff-tree -p "$h" 2>/dev/null | git patch-id --stable 2>/dev/null | cut -d' ' -f1)"
  if [ -n "$pid" ]; then
    new="$(git log --format='%H' -n 500 \
           | while read -r c; do
               p="$(git diff-tree -p "$c" 2>/dev/null | git patch-id --stable 2>/dev/null | cut -d' ' -f1)"
               [ "$p" = "$pid" ] && { printf '%s' "$c"; break; }
             done)"
    [ -n "$new" ] && { printf '%s' "$new"; return 0; }
  fi
  return 1
}

# A 40-character hash whose tail was invented: the real short hash is its head.
by_prefix() {
  local h="$1" n candidate
  for n in 12 11 10 9; do
    [ "${#h}" -le "$n" ] && continue
    candidate="$(git rev-parse --verify --quiet "${h:0:$n}^{commit}" 2>/dev/null)"
    if [ -n "$candidate" ] && reachable "$candidate"; then
      printf '%s' "$candidate"; return 0
    fi
  done
  return 1
}

fix_commit_hashes() {
  [ -f "$CHANGELOG_FILE" ] || return 0
  git rev-parse --git-dir >/dev/null 2>&1 || return 0

  local start end
  if [ "$ALL_SECTIONS" = "1" ]; then
    start=1
    end="$(wc -l < "$CHANGELOG_FILE")"
    echo "    Checking the WHOLE file (--all-sections)."
  else
    start="$(grep -nE '^# Upcoming WeKan' "$CHANGELOG_FILE" | head -1 | cut -d: -f1)"
    [ -z "$start" ] && start="$(grep -nE '^# v[0-9]+\.[0-9]+ ' "$CHANGELOG_FILE" | head -1 | cut -d: -f1)"
    [ -z "$start" ] && return 0
    end="$(awk -v s="$start" 'NR>s && /^# v[0-9]+\.[0-9]+ /{print NR-1; exit}' "$CHANGELOG_FILE")"
    [ -z "$end" ] && end="$(wc -l < "$CHANGELOG_FILE")"
  fi

  local hashes
  hashes="$(sed -n "${start},${end}p" "$CHANGELOG_FILE" \
    | grep -oE 'github\.com/wekan/wekan/commit/[0-9a-f]{7,40}' \
    | sed 's|.*/||' | sort -u)"
  [ -z "$hashes" ] && { echo "    No commit links in the section."; return 0; }

  local h new fixed=0 checked=0 unresolved=()
  for h in $hashes; do
    checked=$((checked + 1))
    # Reachable from a branch or a tag: the link works, leave it alone. This is
    # the guard that keeps a tag-only 2019 commit from being "fixed" into a
    # different change.
    reachable "$h" && continue

    new="$(rewritten_copy "$h")" || new=""
    [ -z "$new" ] && new="$(by_prefix "$h")"
    if [ -z "$new" ]; then
      unresolved+=("$h (no commit in this clone matches it)")
      continue
    fi

    local short _tmp
    short="${new:0:${#h}}"
    if [ "$DRY_RUN" = "1" ]; then
      echo "    would repoint $h -> $short   $(git log -1 --format=%s "$new" | cut -c1-60)"
      fixed=$((fixed + 1))
      continue
    fi
    _tmp="$(mktemp)"
    awk -v s="$start" -v e="$end" -v old="$h" -v repl="$short" '
      NR>=s && NR<=e { gsub("commit/" old, "commit/" repl) } { print }
    ' "$CHANGELOG_FILE" > "$_tmp" && mv "$_tmp" "$CHANGELOG_FILE"
    echo "    $h -> $short   $(git log -1 --format=%s "$new" | cut -c1-60)"
    fixed=$((fixed + 1))
  done

  if [ "$fixed" -gt 0 ]; then
    echo "--- Repointed $fixed of $checked commit link(s) in $CHANGELOG_FILE (history was rewritten since they were written) ---"
  else
    echo "    All $checked commit link(s) checked resolve to a commit in this clone."
  fi
  if [ "${#unresolved[@]}" -gt 0 ]; then
    echo ""
    echo "WARNING: ${#unresolved[@]} commit link(s) could not be resolved:"
    printf '    %s\n' "${unresolved[@]}"
    echo "         They are left as-is and will 404 on GitHub. Fix them by hand if they matter."
    echo ""
  fi
}

echo "--- Checking $CHANGELOG_FILE commit links against this clone ---"
fix_commit_hashes
exit 0
