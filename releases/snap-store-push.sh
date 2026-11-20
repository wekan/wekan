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

# The store's revisions of $name: "Rev. Uploaded Arches Version Channels",
# Arches may list several. snapcraft 9 renamed list-revisions to revisions
# and the old name now only prints that and fails - so on v13.20 and v13.21
# this found nothing, the file was uploaded again, and the store answered
# "Error checking upload uniqueness" for a file it already had. The new name
# first, the old one for an older snapcraft.
store_revisions() {
  snapcraft revisions "$name" "$@" 2>/dev/null || snapcraft list-revisions "$name" "$@"
}

# The revision of $version for $arch on the store, or nothing.
revision_on_store() {
  store_revisions --arch "$arch" | awk -v v="$version" -v a="$arch" '
    $1 ~ /^[0-9]+$/ {
      n = split($3, arches, ",")
      for (i = 1; i <= n; i++) if (arches[i] == a && $4 == v) { print $1; exit }
    }'
}

# The store holds the file and has not released it.
held_message() {
  echo "::error::The Snap Store already holds $snap_file but has not released it, so $name $version ($arch) was NOT released to $channels. Open https://dashboard.snapcraft.io/snaps/$name/ (Releases): a revision marked \"Can't be released: ReviewQueued\" waits for the Snap Store's manual review, which no upload or release command can skip - ask for it at https://forum.snapcraft.io/c/store-requests/ naming the snap and the revision. Then run \"Push Snap to Store\" again: it releases the reviewed revision to every channel." >&2
  if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then
    echo "- HELD BY THE STORE \`$name\` $version $arch: the store has the file and has not released it (manual review?)" >> "$GITHUB_STEP_SUMMARY"
  fi
}

# Released to each channel on its own: one the store refuses does not keep
# the revision out of the others, and each refusal is in the log. Ends the
# script - red when a channel was refused.
release_revision() {
  local rev=$1 channel refused=""
  for channel in ${channels//,/ }; do
    echo "Releasing $name $version ($arch), revision $rev, to $channel..."
    if snapcraft release "$name" "$rev" "$channel"; then
      echo "RELEASED $name $version $arch r$rev -> $channel"
      [ -z "${GITHUB_STEP_SUMMARY:-}" ] || echo "- RELEASED \`$name\` $version $arch, revision $rev, to $channel" >> "$GITHUB_STEP_SUMMARY"
    else
      refused="$refused $channel"
      echo "::error::The Snap Store did not release $name $version ($arch), revision $rev, to $channel. The snapcraft lines above say why; a revision marked \"Can't be released: ReviewQueued\" on https://dashboard.snapcraft.io/snaps/$name/ waits for the store's manual review - ask for it at https://forum.snapcraft.io/c/store-requests/." >&2
      [ -z "${GITHUB_STEP_SUMMARY:-}" ] || echo "- NOT RELEASED \`$name\` $version $arch, revision $rev, to $channel" >> "$GITHUB_STEP_SUMMARY"
    fi
  done
  if [ -n "$refused" ]; then
    echo "::error::$name $version ($arch) r$rev not released to:$refused." >&2
    exit 1
  fi
  exit 0
}

rev=$(revision_on_store || true)
if [ -n "$rev" ]; then
  echo "$name $version ($arch) is already on the store as revision $rev."
  release_revision "$rev"
  exit 0
fi

log=$(mktemp "${TMPDIR:-/tmp}/snap-push.XXXXXX.log")
trap 'rm -f "$log"' EXIT
# The store's own transient failures: uploaded again.
retryable_re='(\[[ \t]*500[ \t]*\][ \t]*Internal[ \t]+Server[ \t]+Error|HTTP[ \t]*500[ \t]+Internal[ \t]+Server[ \t]+Error|(^|[^0-9])500[ \t]+Internal[ \t]+Server[ \t]+Error|Error checking upload uniqueness|502[ \t]+Bad[ \t]+Gateway|503[ \t]+Service[ \t]+Unavailable|504[ \t]+Gateway[ \t]+Timeout|Connection[ \t]+(reset|aborted))'
# "Error checking upload uniqueness" is in it - on v10.78 it was the store's
# own glitch and an upload again went through - but it also answers a file
# the store already holds: on v13.21 the wekan and wekan-gantt-gpl revisions
# of that very file sat in the store's manual review queue ("Can't be
# released: ReviewQueued"). So the store is asked first whether it lists the
# revision, and when the error outlasts the attempts the file is reported as
# held - not waited for for hours, as v13.20 and v13.21 were.
duplicate_re='already been uploaded|exact same content'
uniqueness_re='Error checking upload uniqueness'
# Uploaded once: the store takes a file only once, and a file that did reach
# it is found and released above rather than sent again. A 5xx or a dropped
# connection, where nothing reached the store, may be tried again when
# SNAP_PUSH_UPLOAD_ATTEMPTS asks for it.
attempts=${SNAP_PUSH_UPLOAD_ATTEMPTS:-1}
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
  # The store already holds this exact file: release its revision when it is
  # listed; when it is not, the store is holding it (review), and asking
  # again for hours does not change that.
  if grep -qiE "$duplicate_re" "$log"; then
    rev=$(revision_on_store || true)
    if [ -n "$rev" ]; then
      release_revision "$rev"
      exit 0
    fi
    held_message
    exit 1
  fi
  if grep -qiE "$uniqueness_re" "$log"; then
    rev=$(revision_on_store || true)
    if [ -n "$rev" ]; then
      release_revision "$rev"
      exit 0
    fi
    # Never sent again: the store holds this file.
    held_message
    exit 1
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
