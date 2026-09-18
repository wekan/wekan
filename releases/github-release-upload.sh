#!/usr/bin/env bash
# Attach already-built artifacts. A stalled transfer must not consume the job's
# entire lifetime (v11.85 amd64 snap); verify names AND sizes from the release.
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
for attempt in 1 2 3; do
  echo "Attaching artifacts to $repository $tag (attempt $attempt/3)."
  if timeout --kill-after=30s 10m gh release upload --repo "$repository" "$tag" "$@" --clobber; then
    if timeout --kill-after=10s 60s gh release view --repo "$repository" "$tag" \
      --json assets --jq '.assets[] | [.name, .size] | @tsv' > "$upload_tmp/assets.tsv"; then
      verified=true
      for artifact in "$@"; do
        size=$(wc -c < "$artifact")
        if ! awk -F '\t' -v name="$(basename "$artifact")" -v size="$size" \
          '$1 == name && $2 == size { found=1 } END { exit !found }' "$upload_tmp/assets.tsv"; then
          echo "::warning::$(basename "$artifact") is missing or has the wrong size in $tag."
          verified=false
        fi
      done
      if [ "$verified" = true ]; then
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
echo "::error::Could not attach and verify artifacts in $repository $tag after three bounded attempts. The local build artifacts remain available." >&2
exit 1
