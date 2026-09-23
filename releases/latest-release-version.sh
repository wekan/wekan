#!/bin/bash
# Read-only version preflight, including remote tags. Failure to query the
# remote must stop a release rather than silently using stale local state.
set -euo pipefail
cd "$(dirname "$0")/.."
remote_tags="$(git ls-remote --tags origin 'refs/tags/v*')" || {
  echo 'Error: cannot check remote release tags; no release changes made.' >&2
  exit 1
}
local_tags="$(git tag --list 'v*')"
package_version="$(sed -nE 's/^[[:space:]]*"version": "v?([0-9]+\.[0-9]+)(\.0)?",/\1/p' package.json)"
[[ "$package_version" =~ ^[0-9]+\.[0-9]{2}$ ]] || {
  echo 'Error: invalid package.json release version.' >&2
  exit 1
}
{
  printf '%s\n' "$package_version" "$local_tags"
  printf '%s\n' "$remote_tags" | sed -nE 's|.*refs/tags/(v[0-9]+\.[0-9]{2})(\^\{\})?$|\1|p'
  sed -nE 's/^# v([0-9]+\.[0-9]{2}) .*/\1/p' CHANGELOG.md
} | awk '
  /^v?[0-9]+\.[0-9][0-9]$/ {
    sub(/^v/, ""); split($0, v, "."); n = v[1] * 100 + v[2];
    if (n > newest) newest = n
  }
  END { printf "%d.%02d\n", int(newest / 100), newest % 100 }
'
