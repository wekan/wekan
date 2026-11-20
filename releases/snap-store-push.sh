#!/usr/bin/env bash
# Puts one .snap on the Snap Store and RELEASES it to the given channels -
# for "Push Snap to Store" (.github/workflows/snap-store.yml), which takes the
# .snap files of a GitHub release.
#
#   releases/snap-store-push.sh <name>_<version>_<arch>.snap [channels]
#
# Why not `snapcraft upload --release=...` alone (releases/snap-upload-retry.sh):
# the store can keep a revision in "processing" for hours, and an upload that
# gives up waiting leaves its release to the store. When that release never
# happens, the build is green and the store keeps the old version - which is
# what v13.20 did. So this script:
#   1. asks the store whether this version is already there for this arch -
#      an earlier upload that finished processing after its job gave up - and
#      releases that revision: nothing is uploaded twice;
#   2. otherwise uploads WITHOUT --release, and releases the revision the
#      upload created, by number;
#   3. when the upload is cut off while the store is still processing, keeps
#      asking for the revision and releases it when it appears; when it never
#      does, FAILS, so the workflow is red rather than green with an old snap;
#   4. uploads again after a store-side failure ("Error checking upload
#      uniqueness", 5xx), and fails at once on any other refusal.
#
# Credentials: SNAPCRAFT_STORE_CREDENTIALS (an exported login, as SNAP_AUTH).
set -euo pipefail
. "$(dirname "${BASH_SOURCE[0]}")/tools-env.sh"   # temporary files go to .tools/tmp

if [ "$#" -lt 1 ] || [ "$#" -gt 2 ]; then
  echo "Usage: $0 <name>_<version>_<arch>.snap [channels]" >&2
  exit 2
fi
snap_file=$1
channels=${2:-stable,candidate,beta,edge}
upload_budget=${SNAP_PUSH_UPLOAD_BUDGET:-1800}
wait_budget=${SNAP_PUSH_WAIT_BUDGET:-7200}
poll=${SNAP_PUSH_POLL:-60}

if [ ! -s "$snap_file" ]; then
  echo "::error::No non-empty snap file: $snap_file" >&2
  exit 2
fi
base=$(basename "$snap_file" .snap)
# <name>_<version>_<arch>: the name has no underscore, nor does the arch.
name=${base%%_*}
arch=${base##*_}
version=${base#"${name}_"}
version=${version%"_${arch}"}
if [ -z "$name" ] || [ -z "$arch" ] || [ -z "$version" ] || [ "$name" = "$base" ]; then
  echo "::error::$snap_file is not named <name>_<version>_<arch>.snap" >&2
  exit 2
fi

# The revision of $version for $arch on the store, or nothing. list-revisions
# prints "Rev. Uploaded Arches Version Channels"; Arches may list several.
revision_on_store() {
  snapcraft list-revisions "$name" --arch "$arch" | awk -v v="$version" -v a="$arch" '
    $1 ~ /^[0-9]+$/ {
      n = split($3, arches, ",")
      for (i = 1; i <= n; i++) if (arches[i] == a && $4 == v) { print $1; exit }
    }'
}

release_revision() {
  local rev=$1
  echo "Releasing $name $version ($arch), revision $rev, to $channels..."
  snapcraft release "$name" "$rev" "$channels"
  echo "RELEASED $name $version $arch r$rev -> $channels"
  if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then
    echo "- RELEASED \`$name\` $version $arch, revision $rev, to $channels" >> "$GITHUB_STEP_SUMMARY"
  fi
}

rev=$(revision_on_store || true)
if [ -n "$rev" ]; then
  echo "$name $version ($arch) is already on the store as revision $rev."
  release_revision "$rev"
  exit 0
fi

log=$(mktemp "${TMPDIR:-/tmp}/snap-push.XXXXXX.log")
trap 'rm -f "$log"' EXIT
# The store's own transient failures, the same list as
# releases/snap-upload-retry.sh. "Error checking upload uniqueness" is one: the
# v13.20 push got it and nothing reached the store, so waiting for a revision
# (as this script then did, for two hours) could never succeed - the upload
# has to be made again.
retryable_re='(\[[ \t]*500[ \t]*\][ \t]*Internal[ \t]+Server[ \t]+Error|HTTP[ \t]*500[ \t]+Internal[ \t]+Server[ \t]+Error|(^|[^0-9])500[ \t]+Internal[ \t]+Server[ \t]+Error|Error checking upload uniqueness|502[ \t]+Bad[ \t]+Gateway|503[ \t]+Service[ \t]+Unavailable|504[ \t]+Gateway[ \t]+Timeout|Connection[ \t]+(reset|aborted))'
attempts=${SNAP_PUSH_UPLOAD_ATTEMPTS:-4}
retry_delay=${SNAP_PUSH_RETRY_DELAY:-60}
attempt=1
while :; do
  echo "Uploading $snap_file (attempt $attempt/$attempts)..."
  set +e
  timeout -k 30 "$upload_budget" snapcraft upload "$snap_file" 2>&1 | tee "$log"
  upload_rc=${PIPESTATUS[0]}
  set -e
  rev=$(grep -oE 'Revision [0-9]+' "$log" | head -1 | awk '{ print $2 }' || true)
  if [ "$upload_rc" -eq 0 ] && [ -n "$rev" ]; then
    release_revision "$rev"
    exit 0
  fi
  # Cut off while the store was processing: the revision is coming.
  if { [ "$upload_rc" -eq 124 ] || [ "$upload_rc" -eq 137 ]; } && grep -q 'Status: processing' "$log" \
    && ! grep -qiE 'error while processing' "$log"; then
    break
  fi
  # The store already holds this exact file: its revision is listed, or soon.
  if grep -qiE 'already been uploaded|exact same content' "$log"; then
    break
  fi
  # A store-side failure: the file has to be uploaded again.
  if grep -qiE "$retryable_re" "$log" && [ "$attempt" -lt "$attempts" ]; then
    delay=$((attempt * retry_delay))
    echo "::warning::The Snap Store failed while taking $snap_file (attempt $attempt/$attempts); uploading it again in ${delay}s."
    sleep "$delay"
    attempt=$((attempt + 1))
    continue
  fi
  echo "::error::The Snap Store did not take $snap_file (exit $upload_rc), so $name $version ($arch) was NOT released to $channels. The snapcraft lines above say why; run \"Push Snap to Store\" again." >&2
  if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then
    echo "- NOT RELEASED \`$name\` $version $arch: upload refused (exit $upload_rc)" >> "$GITHUB_STEP_SUMMARY"
  fi
  exit 1
done

# Processing, or a binary the store already holds. Ask until it shows the
# revision, then release that.
echo "::warning::The upload of $snap_file ended without a revision (exit $upload_rc). Asking the store for $name $version ($arch) for up to ${wait_budget}s."
waited=0
while [ "$waited" -lt "$wait_budget" ]; do
  rev=$(revision_on_store || true)
  if [ -n "$rev" ]; then
    release_revision "$rev"
    exit 0
  fi
  sleep "$poll"
  waited=$((waited + poll))
done
echo "::error::$name $version ($arch) did not appear on the Snap Store within ${wait_budget}s after its upload, so it was NOT released to $channels. Check https://dashboard.snapcraft.io/snaps/$name/ - a revision that needs review or failed processing is shown there - and run \"Push Snap to Store\" again." >&2
if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then
  echo "- NOT RELEASED \`$name\` $version $arch: not on the store after ${wait_budget}s" >> "$GITHUB_STEP_SUMMARY"
fi
exit 1
