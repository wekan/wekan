#!/usr/bin/env bash
# Which of the newest releases are missing something.
#
#   releases/release-missing-scan.sh <owner/repo> [how-many]
#
# prints "<version> <missing-count>" for every one of the <how-many> newest
# GitHub Releases (10 by default) that lacks an asset releases/expected-assets.sh
# says a complete release carries - a bundle without its .sha256sum counts as
# missing, as in release-all-missing.yml's plan. "Release all missing", run
# with no version, starts itself once for each line.
set -euo pipefail
. "$(dirname "${BASH_SOURCE[0]}")/tools-env.sh"   # temporary files go to .tools/tmp

repo=${1:?usage: release-missing-scan.sh <owner/repo> [how-many]}
count=${2:-10}
case "$count" in ''|*[!0-9]*) echo "how-many must be a number, not '$count'" >&2; exit 2 ;; esac
here=$(cd "$(dirname "$0")" && pwd)

# A draft or prerelease is not a release to complete.
gh release list --repo "$repo" --limit "$count" --exclude-drafts --exclude-pre-releases --json tagName --jq '.[].tagName' |
while read -r tag; do
  case "$tag" in v[0-9]*.[0-9]*) ;; *) continue ;; esac
  version=${tag#v}
  existing=$(gh release view "$tag" --repo "$repo" --json assets --jq '.assets[].name')
  missing=0
  while read -r kind selector asset sums; do
    need="$asset"
    [ "$sums" = "sums" ] && need="$need ${asset}.sha256sum"
    for n in $need; do
      if ! printf '%s\n' "$existing" | grep -qxF "$n"; then missing=$((missing + 1)); break; fi
    done
  done < <(bash "$here/expected-assets.sh" "$version")
  [ "$missing" -eq 0 ] || echo "$version $missing"
done
