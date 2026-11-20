#!/usr/bin/env bash
# Releases the newest revision the Snap Store has of a snap, for every
# architecture, to the given channels - whatever the GitHub release holds.
#
#   releases/snap-store-release-newest.sh <snap-name> [channels]
#
# "Push Snap to Store" (.github/workflows/snap-store.yml) runs it after
# pushing a release's files, so a revision that reached the store some other
# way - an earlier upload that finished processing after its job gave up, a
# revision a reviewer approved later - is released too. Releasing a revision
# that is already in a channel changes nothing, so it is always asked for.
#
# A revision the store will not release - "Can't be released: ReviewQueued",
# greyed out on the dashboard too - is reported, the other architectures go
# on, and the script ends red: a snap that is not released is not green.
set -euo pipefail
. "$(dirname "${BASH_SOURCE[0]}")/tools-env.sh"   # temporary files go to .tools/tmp

if [ "$#" -lt 1 ] || [ "$#" -gt 2 ]; then
  echo "Usage: $0 <snap-name> [channels]" >&2
  exit 2
fi
name=$1
channels=${2:-stable,candidate,beta,edge}
case "$name" in wekan|wekan-ondra|wekan-gantt-gpl) ;; *) echo "::error::'$name' is not one of WeKan's snaps." >&2; exit 2 ;; esac
case "$channels" in *[!a-z0-9/,.-]*|'') echo "::error::'$channels' is not a channel list." >&2; exit 2 ;; esac

# snapcraft 9 renamed list-revisions to revisions; the old name for an older one.
listing=$(snapcraft revisions "$name" 2>/dev/null || snapcraft list-revisions "$name")
# "Rev. Uploaded Arches Version Channels": the newest revision of each arch.
newest=$(printf '%s\n' "$listing" | awk '
  $1 ~ /^[0-9]+$/ {
    n = split($3, arches, ",")
    for (i = 1; i <= n; i++) if (!(arches[i] in rev) || $1 + 0 > rev[arches[i]] + 0) { rev[arches[i]] = $1; ver[arches[i]] = $4 }
  }
  END { for (a in rev) print a, rev[a], ver[a] }' | sort)
if [ -z "$newest" ]; then
  echo "::error::The Snap Store lists no revisions of $name." >&2
  exit 1
fi

held=""
while read -r arch rev version; do
  [ -n "$arch" ] || continue
  # Each channel on its own: one the store refuses does not keep the revision
  # out of the others, and each refusal is in the log.
  for channel in ${channels//,/ }; do
    echo "Releasing $name $version ($arch), revision $rev, to $channel..."
    if snapcraft release "$name" "$rev" "$channel"; then
      echo "RELEASED $name $version $arch r$rev -> $channel"
      [ -z "${GITHUB_STEP_SUMMARY:-}" ] || echo "- RELEASED \`$name\` $version $arch, newest revision $rev, to $channel" >> "$GITHUB_STEP_SUMMARY"
    else
      held="$held $arch:r$rev:$channel"
      echo "::error::The Snap Store did not release $name $version ($arch), revision $rev, to $channel. On https://dashboard.snapcraft.io/snaps/$name/ (Releases) a revision marked \"Can't be released: ReviewQueued\" waits for the store's manual review: ask for it at https://forum.snapcraft.io/c/store-requests/, naming the snap and the revision, then run \"Push Snap to Store\" again." >&2
      [ -z "${GITHUB_STEP_SUMMARY:-}" ] || echo "- NOT RELEASED \`$name\` $version $arch, revision $rev, to $channel" >> "$GITHUB_STEP_SUMMARY"
    fi
  done
done <<< "$newest"

if [ -n "$held" ]; then
  echo "::error::$name: not released:$held." >&2
  exit 1
fi
