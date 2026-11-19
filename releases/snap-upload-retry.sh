#!/usr/bin/env bash
set -euo pipefail
. "$(dirname "${BASH_SOURCE[0]}")/tools-env.sh"   # temporary files and downloads go to .tools/tmp

if [ "$#" -lt 1 ] || [ "$#" -gt 2 ]; then
  echo "Usage: $0 <snap-file> [channels]" >&2
  exit 2
fi

snap_file=$1
channels=${2:-stable,candidate,beta,edge}
attempts=${SNAP_UPLOAD_ATTEMPTS:-3}
retry_delay=${SNAP_UPLOAD_RETRY_DELAY:-30}
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

# How long one `snapcraft upload` may take, the store's processing included.
# snapcraft polls "Status: processing" with no limit of its own, and on v13.18
# the store kept every wekan and wekan-gantt-gpl revision there for hours: the
# polling ran into the job's timeout-minutes and GitHub cancelled the job,
# which reported a release failure for snaps that had uploaded fine. A normal
# upload, processing included, takes about five minutes.
budget=${SNAP_UPLOAD_PROCESSING_BUDGET:-1800}
if ! [[ "$budget" =~ ^[1-9][0-9]*$ ]]; then
  echo "::error::SNAP_UPLOAD_PROCESSING_BUDGET must be a positive number of seconds (got '$budget')." >&2
  exit 2
fi

attempt=1
while [ "$attempt" -le "$attempts" ]; do
  echo "Uploading $label to the Snap Store ($channels), attempt $attempt/$attempts..."
  set +e
  timeout -k 30 "$budget" snapcraft upload --release="$channels" "$snap_file" 2>&1 | tee "$log_file"
  upload_rc=${PIPESTATUS[0]}
  set -e
  if [ "$upload_rc" -eq 0 ]; then
    exit 0
  fi

  if [ "$upload_rc" -eq 124 ] || [ "$upload_rc" -eq 137 ]; then
    if grep -q 'Status: ' "$log_file"; then
      # The store has the file and is processing it. The channels were sent
      # with the upload, so the store releases the revision itself when its
      # processing finishes; uploading again would only queue a duplicate.
      echo "::warning::The Snap Store accepted $label but was still processing it after ${budget}s. It releases the revision to $channels by itself when processing finishes; check with 'snapcraft list-revisions <snap>' or https://dashboard.snapcraft.io/ if it does not appear."
      if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then
        echo "PROCESSING $label: accepted by the Snap Store, still processing after ${budget}s" >> "$GITHUB_STEP_SUMMARY"
      fi
      exit 0
    fi
    # Cut off before the store accepted the file: nothing reached it, so
    # this is an upload that did not happen, and is retried like one.
    echo "::warning::Uploading $label did not finish within ${budget}s, before the Snap Store accepted it."
    echo "Timeout" >> "$log_file"
  fi

  if grep -qiE "$retryable_re" "$log_file"; then
    if [ "$attempt" -lt "$attempts" ]; then
      delay=$((attempt * retry_delay))
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
