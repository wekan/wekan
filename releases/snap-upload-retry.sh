#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 1 ] || [ "$#" -gt 2 ]; then
  echo "Usage: $0 <snap-file> [channels]" >&2
  exit 2
fi

snap_file=$1
channels=${2:-stable,candidate,beta,edge}
attempts=${SNAP_UPLOAD_ATTEMPTS:-3}
label=${SNAP_UPLOAD_LABEL:-$snap_file}
repo_root=$(cd "$(dirname "$0")/.." && pwd)
tmpdir=${TMPDIR:-$repo_root/.tools/tmp}
mkdir -p "$tmpdir"
cleanup_log=false
if [ -n "${SNAP_UPLOAD_LOG:-}" ]; then
  log_file=$SNAP_UPLOAD_LOG
else
  log_file=$(mktemp "$tmpdir/snap-upload.XXXXXX.log")
  cleanup_log=true
fi

if ! [[ "$attempts" =~ ^[1-9][0-9]*$ ]]; then
  echo "::error::SNAP_UPLOAD_ATTEMPTS must be a positive integer (got '$attempts')." >&2
  exit 2
fi

if [ "$cleanup_log" = true ]; then
  trap 'rm -f "$log_file"' EXIT
fi

retryable_re='(\[[ \t]*500[ \t]*\][ \t]*Internal[ \t]+Server[ \t]+Error|HTTP[ \t]*500[ \t]+Internal[ \t]+Server[ \t]+Error|(^|[^0-9])500[ \t]+Internal[ \t]+Server[ \t]+Error|Error checking upload uniqueness|error while processing|502[ \t]+Bad[ \t]+Gateway|503[ \t]+Service[ \t]+Unavailable|504[ \t]+Gateway[ \t]+Timeout|Timeout|Connection[ \t]+(reset|aborted))'

if [ ! -s "$snap_file" ]; then
  echo "::error::No non-empty snap file to upload: $snap_file" >&2
  exit 2
fi

attempt=1
while [ "$attempt" -le "$attempts" ]; do
  echo "Uploading $label to the Snap Store ($channels), attempt $attempt/$attempts..."
  set +e
  snapcraft upload --release="$channels" "$snap_file" 2>&1 | tee "$log_file"
  upload_rc=${PIPESTATUS[0]}
  set -e
  if [ "$upload_rc" -eq 0 ]; then
    exit 0
  fi

  if grep -qiE "$retryable_re" "$log_file"; then
    if [ "$attempt" -lt "$attempts" ]; then
      delay=$((attempt * 30))
      echo "::warning::The Snap Store returned a transient processing/server error while uploading $label (attempt $attempt/$attempts). Retrying in ${delay}s."
      sleep "$delay"
      attempt=$((attempt + 1))
      continue
    fi

    echo "::error::The Snap Store kept returning a transient processing/server error while uploading $label (attempt $attempt/$attempts)." >&2
    exit 10
  fi

  exit 11
done

exit 1
