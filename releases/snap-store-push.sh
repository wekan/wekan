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
#      does, FAILS, so the workflow is red rather than green with an old snap.
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
  snapcraft list-revisions "$name" --arch "$arch" 2>/dev/null | awk -v v="$version" -v a="$arch" '
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
echo "Uploading $snap_file..."
set +e
timeout -k 30 "$upload_budget" snapcraft upload "$snap_file" 2>&1 | tee "$log"
upload_rc=${PIPESTATUS[0]}
set -e

rev=$(grep -oE 'Revision [0-9]+' "$log" | head -1 | awk '{ print $2 }' || true)
if [ "$upload_rc" -eq 0 ] && [ -n "$rev" ]; then
  release_revision "$rev"
  exit 0
fi

# Cut off or refused: the store may still have it - processing, or a binary
# it already holds. Ask until it shows the revision, then release that.
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
