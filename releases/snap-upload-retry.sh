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
log_file=${SNAP_UPLOAD_LOG:-/tmp/snap-upload.log}

if [ ! -s "$snap_file" ]; then
  echo "::error::No non-empty snap file to upload: $snap_file" >&2
  exit 2
fi

for attempt in $(seq 1 "$attempts"); do
  echo "Uploading $label to the Snap Store ($channels), attempt $attempt/$attempts..."
  if snapcraft upload --release="$channels" "$snap_file" 2>&1 | tee "$log_file"; then
    exit 0
  fi

  if grep -qiE '(\[[ \t]*500[ \t]*\][ \t]*Internal[ \t]+Server[ \t]+Error|HTTP[ \t]*500|Error checking upload uniqueness|error while processing|502[ \t]+Bad[ \t]+Gateway|503[ \t]+Service|504[ \t]+Gateway|Timeout|Connection[ \t]+(reset|aborted))' "$log_file"; then
    if [ "$attempt" -lt "$attempts" ]; then
      delay=$((attempt * 30))
      echo "::warning::The Snap Store returned a transient processing/server error while uploading $label (attempt $attempt/$attempts). Retrying in ${delay}s."
      sleep "$delay"
      continue
    fi

    echo "::error::The Snap Store kept returning a transient processing/server error while uploading $label (attempt $attempt/$attempts)." >&2
    exit 10
  fi

  exit 11
done

exit 1
