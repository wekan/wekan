#!/usr/bin/env bash
# Attach already-built artifacts. A stalled transfer must not consume the job's
# entire lifetime (v11.85 amd64 snap); verify names AND sizes from the release.
#
# This is THE way a release workflow attaches a file to a GitHub Release. Every
# job that builds a release asset calls it as its own last step, the moment that
# asset is built and checked - not a later job that collects everything at the
# end. A release then fills up as its builds finish, and a run that is cancelled
# or dies half way still leaves every finished file on the release instead of
# none of them.
#
# It runs on the Linux, macOS and Windows (Git Bash) runners alike, so nothing
# here may assume GNU tools: macOS has no `timeout`, and on Windows the first
# `timeout` on PATH can be System32's "wait N seconds" command, which takes
# different arguments.
set -euo pipefail
if [ "$#" -lt 3 ]; then
  echo "Usage: $0 <repository> <tag> <artifact> [artifact ...]" >&2
  exit 2
fi
repository=$1
tag=$2
shift 2
for artifact in "$@"; do
  [ -s "$artifact" ] || { echo "Missing or empty artifact: $artifact" >&2; exit 1; }
done
repo_root=$(cd "$(dirname "$0")/.." && pwd)
export TMPDIR="${TMPDIR:-$repo_root/.tools/tmp}"
mkdir -p "$TMPDIR"
upload_tmp=$(mktemp -d "$TMPDIR/release-upload.XXXXXX")
trap 'rm -rf "$upload_tmp"' EXIT

# A bounded command where a GNU-compatible timeout exists (Linux: timeout,
# macOS with coreutils: gtimeout), and the plain command where none does. The
# probe RUNS it, so a `timeout` that is not GNU's is not mistaken for one.
bounded() {
  local limit=$1 kill_after=$2
  shift 2
  local t
  for t in timeout gtimeout; do
    if command -v "$t" >/dev/null 2>&1 && "$t" --kill-after=1s 5s true >/dev/null 2>&1; then
      "$t" --kill-after="$kill_after" "$limit" "$@"
      return
    fi
  done
  "$@"
}

for attempt in 1 2 3; do
  echo "Attaching artifacts to $repository $tag (attempt $attempt/3)."
  if bounded 10m 30s gh release upload --repo "$repository" "$tag" "$@" --clobber; then
    if bounded 60s 10s gh release view --repo "$repository" "$tag" \
      --json assets --jq '.assets[] | [.name, .size] | @tsv' > "$upload_tmp/assets.tsv"; then
      verified=true
      for artifact in "$@"; do
        # tr: BSD wc pads the count with spaces.
        size=$(wc -c < "$artifact" | tr -d ' ')
        if ! awk -F '\t' -v name="$(basename "$artifact")" -v size="$size" \
          '$1 == name && $2 == size { found=1 } END { exit !found }' "$upload_tmp/assets.tsv"; then
          echo "::warning::$(basename "$artifact") is missing or has the wrong size in $tag."
          verified=false
        fi
      done
      if [ "$verified" = true ]; then
        for artifact in "$@"; do
          echo "OK: $(basename "$artifact") is attached to $tag ($(( $(wc -c < "$artifact" | tr -d ' ') / 1024 / 1024 )) MiB)."
        done
        echo "OK: all artifacts attached to $tag with matching sizes."
        exit 0
      fi
    fi
  fi
  if [ "$attempt" -lt 3 ]; then
    echo "::warning::Release attachment did not complete and verify; retrying in $((attempt * 10))s."
    sleep $((attempt * 10))
  fi
done
echo "::error::Could not attach and verify artifacts in $repository $tag after three bounded attempts. The release must exist, and GITHUB_TOKEN must be allowed to write releases here (permissions: contents: write). The local build artifacts remain available." >&2
exit 1
